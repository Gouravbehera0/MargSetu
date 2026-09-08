"""
MARGSETU - Dijkstra Baseline Route Algorithm
Deterministic lowest-cost path search using Dijkstra's algorithm.
Used as a classical baseline for benchmarking against QPSO.
"""
import time
import heapq
from typing import List, Optional, Tuple, Dict, Any
from backend.app.database.models import (
    OptimizationRequest, OptimizationResult, OptimizationWeights, VehicleType
)
from backend.app.routing.network_graph import TransportationGraph
from backend.app.optimization.fitness import get_profile_weights, evaluate_route_fitness
from backend.app.optimization.route_encoding import RouteEncoderDecoder


class DijkstraRouteOptimizer:
    def __init__(self, graph: TransportationGraph):
        self.graph = graph
        self.encoder_decoder = RouteEncoderDecoder(graph)

    def optimize_route(self, request: OptimizationRequest) -> OptimizationResult:
        start_time = time.perf_counter()

        origin_node = self.graph.get_nearest_node(request.origin.lat, request.origin.lng)
        dest_node = self.graph.get_nearest_node(request.destination.lat, request.destination.lng)

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

        # Priority Queue for Dijkstra: (cost, node)
        distances = {node: float("inf") for node in self.graph.nodes}
        previous = {node: None for node in self.graph.nodes}
        distances[origin_node] = 0.0

        pq: List[Tuple[float, str]] = [(0.0, origin_node)]
        iterations = 0

        while pq:
            current_cost, u = heapq.heappop(pq)
            iterations += 1

            if u == dest_node:
                break

            if current_cost > distances[u]:
                continue

            for edge in self.graph.adjacency.get(u, []):
                v = edge.v
                if edge.is_blocked:
                    continue
                if request.vehicle_type in edge.restricted_vehicles:
                    continue

                edge_cost = edge.get_effective_cost(request.vehicle_type, w_dict)
                new_cost = current_cost + edge_cost

                if new_cost < distances[v]:
                    distances[v] = new_cost
                    previous[v] = u
                    heapq.heappush(pq, (new_cost, v))

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
            candidate_id="dijkstra-opt",
            name="Dijkstra Shortest Cost Path",
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
            algorithm="Dijkstra",
            route_id=f"dijkstra-{int(time.time()*1000)}",
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
