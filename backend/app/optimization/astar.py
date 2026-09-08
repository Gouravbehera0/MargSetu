"""
MARGSETU - A* Search Route Algorithm Baseline
Heuristic shortest-path search using Haversine distance heuristic.
Used as a standard informed graph search baseline for benchmarking against QPSO.
"""
import time
import heapq
from typing import List, Optional, Tuple, Dict
from backend.app.database.models import (
    OptimizationRequest, OptimizationResult, OptimizationWeights, VehicleType
)
from backend.app.routing.network_graph import TransportationGraph, haversine_distance
from backend.app.optimization.fitness import get_profile_weights, evaluate_route_fitness
from backend.app.optimization.route_encoding import RouteEncoderDecoder


class AStarRouteOptimizer:
    def __init__(self, graph: TransportationGraph):
        self.graph = graph
        self.encoder_decoder = RouteEncoderDecoder(graph)

    def optimize_route(self, request: OptimizationRequest) -> OptimizationResult:
        start_time = time.perf_counter()

        origin_node = self.graph.get_nearest_node(request.origin.lat, request.origin.lng)
        dest_node = self.graph.get_nearest_node(request.destination.lat, request.destination.lng)

        dest_lat = self.graph.nodes[dest_node]["lat"]
        dest_lng = self.graph.nodes[dest_node]["lng"]

        weights = get_profile_weights(
            preference=request.preference,
            vehicle_type=request.vehicle_type,
            custom=request.custom_weights
        )

        w_dict = {
            "time": weights.w1_time,
            "congestion": weights.w2_congestion,
            "distance": weights.w3_distance,
            "risk": weights.w4_risk,
            "blockage": weights.w5_blockage
        }

        def heuristic(node_id: str) -> float:
            """Admissible lower-bound estimate to target destination."""
            n_data = self.graph.nodes[node_id]
            dist = haversine_distance(n_data["lat"], n_data["lng"], dest_lat, dest_lng)
            # Minimum possible time cost assuming 80 km/h free flow speed
            min_time = (dist / 80.0) * 60.0
            return (weights.w1_time * min_time * 0.5) + (weights.w3_distance * dist * 0.5)

        g_score = {node: float("inf") for node in self.graph.nodes}
        f_score = {node: float("inf") for node in self.graph.nodes}
        previous = {node: None for node in self.graph.nodes}

        g_score[origin_node] = 0.0
        f_score[origin_node] = heuristic(origin_node)

        # Open set priority queue: (f_score, node)
        open_set: List[Tuple[float, str]] = [(f_score[origin_node], origin_node)]
        iterations = 0

        while open_set:
            _, current = heapq.heappop(open_set)
            iterations += 1

            if current == dest_node:
                break

            for edge in self.graph.adjacency.get(current, []):
                neighbor = edge.v
                if edge.is_blocked:
                    continue
                if request.vehicle_type in edge.restricted_vehicles:
                    continue

                edge_cost = edge.get_effective_cost(request.vehicle_type, w_dict)
                tentative_g = g_score[current] + edge_cost

                if tentative_g < g_score[neighbor]:
                    previous[neighbor] = current
                    g_score[neighbor] = tentative_g
                    f_score[neighbor] = tentative_g + heuristic(neighbor)
                    heapq.heappush(open_set, (f_score[neighbor], neighbor))

        # Reconstruct path
        path = []
        curr = dest_node
        while curr:
            path.append(curr)
            curr = previous[curr]
        path.reverse()

        elapsed_ms = (time.perf_counter() - start_time) * 1000.0

        if not path or path[0] != origin_node:
            path = [origin_node, dest_node]

        candidate = self.encoder_decoder.build_candidate_from_path(
            path=path,
            candidate_id="astar-opt",
            name="A* Heuristic Optimal Path",
            vehicle_type=request.vehicle_type,
            weights=weights
        )

        _, explanation = evaluate_route_fitness(
            travel_time_min=candidate.travel_time_min,
            congestion_score=candidate.traffic_score,
            distance_km=candidate.distance_km,
            risk_score=candidate.risk_score,
            blockage_score=candidate.blockage_score,
            weights=weights
        )

        return OptimizationResult(
            algorithm="A*",
            route_id=f"astar-{int(time.time()*1000)}",
            route_name=f"{candidate.name}",
            origin=request.origin,
            destination=request.destination,
            distance_km=candidate.distance_km,
            eta_minutes=candidate.travel_time_min,
            fitness=candidate.composite_fitness,
            traffic_score=candidate.traffic_score,
            risk_score=candidate.risk_score,
            blockage_score=candidate.blockage_score,
            iterations=iterations,
            computation_time_ms=round(elapsed_ms, 2),
            convergence_history=[candidate.composite_fitness],
            weights_used=weights,
            explainability=explanation,
            path_nodes=candidate.path_nodes,
            route_geometry=candidate.coordinates,
            candidate_alternatives=[],
            vehicle_type=request.vehicle_type,
            is_emergency=False
        )
