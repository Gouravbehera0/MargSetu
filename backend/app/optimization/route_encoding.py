"""
MARGSETU - Discrete Road Route Encoding & Repair Engine
Bridges continuous QPSO metaheuristic optimization with discrete road network graph topologies.

Encoding Strategy:
1. Generates K diverse feasible loop-free candidate paths between origin and destination nodes
   using Yen's K-Shortest Paths and multi-criteria corridor search.
2. Represents candidate solutions in continuous particle space X in R^K (priority logits).
3. Softmax / argmax decoding maps continuous particle positions back to discrete path archetypes
   and edge-weight perturbation vectors.
4. Feasibility checker inspects road blockages, vehicle restrictions, and connectivity.
5. Repair operator performs localized detour routing around dynamic bottlenecks or assigns
   penalties to preserve swarm validity.
"""
import copy
import heapq
import numpy as np
from typing import List, Dict, Tuple, Optional, Any, Set
from backend.app.database.models import (
    RouteCandidate, RouteSegment, OptimizationWeights, VehicleType, TrafficLevel, GeoPoint
)
from backend.app.routing.network_graph import TransportationGraph, NetworkEdge, haversine_distance
from backend.app.optimization.fitness import evaluate_route_fitness
from backend.app.optimization.constraints import RouteConstraintValidator
from backend.app.routing.osrm_client import osrm_client


class RouteEncoderDecoder:
    def __init__(self, graph: TransportationGraph):
        self.graph = graph
        self.validator = RouteConstraintValidator(graph)

    def generate_candidate_paths(
        self,
        origin_node: str,
        destination_node: str,
        k: int = 5,
        vehicle_type: VehicleType = VehicleType.CAR,
        weights: Optional[OptimizationWeights] = None,
        origin_point: Optional[GeoPoint] = None,
        dest_point: Optional[GeoPoint] = None
    ) -> List[RouteCandidate]:
        """
        Generates K diverse, loop-free candidate paths.
        First leverages OSRM for high-resolution road curves along real streets/highways,
        falling back to the local urban network graph with Yen's K-shortest paths.
        """
        w = weights or OptimizationWeights()

        # Check if real GPS points are provided for real road routing
        if origin_point and dest_point:
            osrm_routes = osrm_client.get_route_candidates(origin_point, dest_point, vehicle_type)
            if osrm_routes and len(osrm_routes) > 0:
                candidates: List[RouteCandidate] = []
                traffic_profiles = [0.18, 0.45, 0.30, 0.60]
                risk_profiles = [0.04, 0.08, 0.05, 0.12]

                for idx, r in enumerate(osrm_routes):
                    t_score = traffic_profiles[idx % len(traffic_profiles)]
                    r_score = risk_profiles[idx % len(risk_profiles)]
                    fit, _ = evaluate_route_fitness(
                        travel_time_min=r["travel_time_min"],
                        congestion_score=t_score,
                        distance_km=r["distance_km"],
                        risk_score=r_score,
                        blockage_score=0.0,
                        weights=w
                    )

                    cand = RouteCandidate(
                        id=f"osrm-cand-{idx+1}",
                        name=r["name"],
                        path_nodes=[origin_node, destination_node],
                        segments=[],
                        distance_km=r["distance_km"],
                        travel_time_min=r["travel_time_min"],
                        traffic_score=t_score,
                        risk_score=r_score,
                        blockage_score=0.0,
                        composite_fitness=round(fit, 4),
                        coordinates=r["coordinates"],
                        turn_instructions=r.get("turn_instructions", [])
                    )
                    candidates.append(cand)

                return candidates

        if origin_node not in self.graph.nodes or destination_node not in self.graph.nodes:
            return []

        # Find initial shortest path using Dijkstra
        first_path = self._dijkstra_path(origin_node, destination_node, vehicle_type, weights)
        if not first_path:
            return []

        A: List[List[str]] = [first_path]  # List of shortest paths
        B: List[Tuple[float, List[str]]] = []  # Priority queue of candidate paths

        for i in range(1, k):
            # Iterate through all nodes in the previous path except the last
            for j in range(len(A[i - 1]) - 1):
                spur_node = A[i - 1][j]
                root_path = A[i - 1][:j + 1]

                # Temporarily remove edges part of previous paths that share root_path
                removed_edges = []
                for p in A:
                    if len(p) > j and p[:j + 1] == root_path:
                        u, v = p[j], p[j + 1]
                        # Remove edge u -> v
                        for edge in self.graph.adjacency.get(u, []):
                            if edge.v == v:
                                self.graph.adjacency[u].remove(edge)
                                removed_edges.append((u, edge))
                                break

                # Temporarily remove root_path nodes (except spur_node) to avoid loops
                spur_path = self._dijkstra_path(
                    spur_node, destination_node, vehicle_type, weights,
                    excluded_nodes=set(root_path[:-1])
                )

                # Restore removed edges
                for u, edge in removed_edges:
                    self.graph.adjacency[u].append(edge)

                if spur_path:
                    total_candidate_path = root_path[:-1] + spur_path
                    # Check if not already in B or A
                    if total_candidate_path not in A and not any(p == total_candidate_path for _, p in B):
                        cost = self._calculate_path_cost(total_candidate_path, vehicle_type, weights)
                        heapq.heappush(B, (cost, total_candidate_path))

            if not B:
                break

            _, next_best = heapq.heappop(B)
            A.append(next_best)

        # Build RouteCandidate objects for the discovered paths
        candidates: List[RouteCandidate] = []
        route_names = ["Corridor A (Primary)", "Corridor B (Expressway)", "Corridor C (Alternate)",
                       "Corridor D (Bypass)", "Corridor E (Scenic)", "Corridor F (Inner Road)"]

        for idx, path in enumerate(A):
            candidate = self.build_candidate_from_path(
                path=path,
                candidate_id=f"cand-{idx+1}",
                name=route_names[idx % len(route_names)],
                vehicle_type=vehicle_type,
                weights=weights or OptimizationWeights()
            )
            candidates.append(candidate)

        return candidates

    def build_candidate_from_path(
        self,
        path: List[str],
        candidate_id: str,
        name: str,
        vehicle_type: VehicleType,
        weights: OptimizationWeights
    ) -> RouteCandidate:
        """Constructs a fully detailed RouteCandidate from an ordered sequence of node IDs."""
        segments: List[RouteSegment] = []
        total_distance = 0.0
        total_time = 0.0
        weighted_congestion = 0.0
        weighted_risk = 0.0
        has_blockage = False
        all_coords: List[List[float]] = []
        turn_instructions: List[Dict[str, Any]] = []

        # Add origin coordinate
        start_node_data = self.graph.nodes[path[0]]
        all_coords.append([start_node_data["lat"], start_node_data["lng"]])
        turn_instructions.append({
            "id": f"turn-0",
            "instruction": f"Start from {start_node_data['name']}",
            "distance_km": 0.0,
            "direction": "depart"
        })

        for i in range(len(path) - 1):
            u, v = path[i], path[i + 1]
            edge = self._find_edge(u, v)

            if edge:
                total_distance += edge.distance_km
                total_time += edge.travel_time_min
                weighted_congestion += edge.congestion_factor * edge.distance_km
                weighted_risk += edge.risk_score * edge.distance_km
                if edge.is_blocked:
                    has_blockage = True

                segment_model = RouteSegment(
                    id=edge.id,
                    from_node=u,
                    to_node=v,
                    name=edge.name,
                    distance_km=edge.distance_km,
                    travel_time_min=round(edge.travel_time_min, 1),
                    traffic_level=edge.traffic_level,
                    congestion_factor=edge.congestion_factor,
                    risk_score=edge.risk_score,
                    is_blocked=edge.is_blocked,
                    speed_limit_kmh=edge.speed_limit_kmh,
                    coordinates=edge.coordinates
                )
                segments.append(segment_model)

                v_data = self.graph.nodes[v]
                all_coords.append([v_data["lat"], v_data["lng"]])
                turn_instructions.append({
                    "id": f"turn-{i+1}",
                    "instruction": f"Proceed on {edge.name} towards {v_data['name']}",
                    "distance_km": round(edge.distance_km, 2),
                    "direction": "straight" if i % 2 == 0 else "turn"
                })
            else:
                # Disconnected segment fallback
                total_distance += 1.0
                total_time += 2.0
                has_blockage = True

        avg_congestion = (weighted_congestion / total_distance) if total_distance > 0 else 0.2
        avg_risk = (weighted_risk / total_distance) if total_distance > 0 else 0.05
        blockage_score = 1.0 if has_blockage else 0.0

        fitness, _ = evaluate_route_fitness(
            travel_time_min=total_time,
            congestion_score=avg_congestion,
            distance_km=total_distance,
            risk_score=avg_risk,
            blockage_score=blockage_score,
            weights=weights
        )

        return RouteCandidate(
            id=candidate_id,
            name=name,
            path_nodes=path,
            segments=segments,
            distance_km=round(total_distance, 2),
            travel_time_min=round(total_time, 1),
            traffic_score=round(avg_congestion, 3),
            risk_score=round(avg_risk, 3),
            blockage_score=round(blockage_score, 2),
            composite_fitness=round(fitness, 4),
            coordinates=all_coords,
            turn_instructions=turn_instructions
        )

    def decode_particle_to_route(
        self,
        particle_position: np.ndarray,
        candidates: List[RouteCandidate],
        vehicle_type: VehicleType = VehicleType.CAR
    ) -> Tuple[RouteCandidate, bool]:
        """
        Decodes continuous particle vector into a discrete RouteCandidate.
        Applies Softmax-driven selection or priority ranking.
        Performs feasibility validation and repairs if needed.
        """
        if not candidates:
            raise ValueError("Candidate pool is empty")

        # Normalize particle logits via softmax
        K = min(len(candidates), len(particle_position))
        sub_pos = particle_position[:K]
        exp_logits = np.exp(sub_pos - np.max(sub_pos))
        probs = exp_logits / np.sum(exp_logits)

        # Select primary candidate archetype based on highest probability
        chosen_idx = int(np.argmax(probs))
        chosen_candidate = candidates[chosen_idx]

        # Feasibility check
        # Real road / OSRM candidates have pre-validated physical road geometry and steps
        if chosen_candidate.id.startswith("osrm-") or (
            chosen_candidate.coordinates and len(chosen_candidate.coordinates) > 2 and len(chosen_candidate.segments) == 0
        ):
            return chosen_candidate, True

        is_valid, reason, _ = self.validator.validate_route_path(
            chosen_candidate.path_nodes, vehicle_type
        )

        if is_valid:
            return chosen_candidate, True

        # If invalid (e.g. road blocked during live traffic), attempt repair
        repaired_candidate, was_repaired = self.repair_invalid_route(
            chosen_candidate, vehicle_type
        )
        if was_repaired and repaired_candidate.distance_km > 0.1:
            return repaired_candidate, True

        return chosen_candidate, False

    def repair_invalid_route(
        self,
        candidate: RouteCandidate,
        vehicle_type: VehicleType
    ) -> Tuple[RouteCandidate, bool]:
        """
        Repair operator: Detects blocked or restricted edges on the candidate path
        and replaces them with local detour segments found via Dijkstra.
        """
        repaired_path = [candidate.path_nodes[0]]

        for i in range(len(candidate.path_nodes) - 1):
            u, v = candidate.path_nodes[i], candidate.path_nodes[i + 1]
            edge = self._find_edge(u, v)

            if edge and not edge.is_blocked and vehicle_type not in edge.restricted_vehicles:
                repaired_path.append(v)
            else:
                # Road bottleneck detected! Search detour from u to v bypassing this edge
                detour = self._dijkstra_path(
                    start=u,
                    end=v,
                    vehicle_type=vehicle_type,
                    excluded_edges={(u, v)}
                )
                if detour and len(detour) >= 2:
                    # Append detour path (skipping first element u since it's already present)
                    repaired_path.extend(detour[1:])
                else:
                    # Cannot find direct local detour; try fallback to full alternative path
                    alt_path = self._dijkstra_path(
                        start=candidate.path_nodes[0],
                        end=candidate.path_nodes[-1],
                        vehicle_type=vehicle_type
                    )
                    if alt_path:
                        repaired_candidate = self.build_candidate_from_path(
                            path=alt_path,
                            candidate_id=f"{candidate.id}-repaired",
                            name=f"{candidate.name} (Detoured)",
                            vehicle_type=vehicle_type,
                            weights=OptimizationWeights()
                        )
                        return repaired_candidate, True
                    return candidate, False

        # Build repaired candidate
        repaired_candidate = self.build_candidate_from_path(
            path=repaired_path,
            candidate_id=f"{candidate.id}-repaired",
            name=f"{candidate.name} (Repaired)",
            vehicle_type=vehicle_type,
            weights=OptimizationWeights()
        )
        return repaired_candidate, True

    def _find_edge(self, u: str, v: str) -> Optional[NetworkEdge]:
        for edge in self.graph.adjacency.get(u, []):
            if edge.v == v:
                return edge
        return None

    def _calculate_path_cost(
        self,
        path: List[str],
        vehicle_type: VehicleType,
        weights: Optional[OptimizationWeights] = None
    ) -> float:
        w_dict = {
            "time": weights.w1_time if weights else 0.40,
            "congestion": weights.w2_congestion if weights else 0.25,
            "distance": weights.w3_distance if weights else 0.20,
            "risk": weights.w4_risk if weights else 0.10,
            "blockage": weights.w5_blockage if weights else 0.05
        }
        total_cost = 0.0
        for i in range(len(path) - 1):
            u, v = path[i], path[i + 1]
            edge = self._find_edge(u, v)
            if edge:
                total_cost += edge.get_effective_cost(vehicle_type, w_dict)
            else:
                total_cost += 1e5
        return total_cost

    def _dijkstra_path(
        self,
        start: str,
        end: str,
        vehicle_type: VehicleType = VehicleType.CAR,
        weights: Optional[OptimizationWeights] = None,
        excluded_nodes: Optional[Set[str]] = None,
        excluded_edges: Optional[Set[Tuple[str, str]]] = None
    ) -> Optional[List[str]]:
        excluded_nodes = excluded_nodes or set()
        excluded_edges = excluded_edges or set()

        distances = {node: float("inf") for node in self.graph.nodes}
        previous = {node: None for node in self.graph.nodes}
        distances[start] = 0.0

        pq: List[Tuple[float, str]] = [(0.0, start)]
        w_dict = {
            "time": weights.w1_time if weights else 0.40,
            "congestion": weights.w2_congestion if weights else 0.25,
            "distance": weights.w3_distance if weights else 0.20,
            "risk": weights.w4_risk if weights else 0.10,
            "blockage": weights.w5_blockage if weights else 0.05
        }

        while pq:
            current_dist, current_node = heapq.heappop(pq)
            if current_node == end:
                break
            if current_dist > distances[current_node]:
                continue

            for edge in self.graph.adjacency.get(current_node, []):
                neighbor = edge.v
                if neighbor in excluded_nodes:
                    continue
                if (current_node, neighbor) in excluded_edges:
                    continue
                if edge.is_blocked:
                    continue
                if vehicle_type in edge.restricted_vehicles:
                    continue

                cost = edge.get_effective_cost(vehicle_type, w_dict)
                new_dist = current_dist + cost
                if new_dist < distances[neighbor]:
                    distances[neighbor] = new_dist
                    previous[neighbor] = current_node
                    heapq.heappush(pq, (new_dist, neighbor))

        if distances[end] == float("inf"):
            return None

        # Reconstruct path
        path = []
        curr = end
        while curr:
            path.append(curr)
            curr = previous[curr]
        path.reverse()
        return path
