"""
MARGSETU - Route Constraints and Validation
Ensures candidate routes strictly obey connectivity, road closures, and vehicle regulations.
"""
from typing import List, Tuple
from backend.app.database.models import VehicleType
from backend.app.routing.network_graph import TransportationGraph, NetworkEdge


class RouteConstraintValidator:
    def __init__(self, graph: TransportationGraph):
        self.graph = graph

    def validate_route_path(
        self,
        node_path: List[str],
        vehicle_type: VehicleType = VehicleType.CAR,
        max_length_km: float = 100.0
    ) -> Tuple[bool, str, float]:
        """
        Validates if a given path of nodes is feasible.
        Returns (is_valid, reason, penalty_score).
        """
        if not node_path or len(node_path) < 2:
            return False, "Path has fewer than 2 nodes", 10.0

        total_distance = 0.0
        for i in range(len(node_path) - 1):
            u, v = node_path[i], node_path[i + 1]
            # Find edge between u and v
            edge = None
            for e in self.graph.adjacency.get(u, []):
                if e.v == v:
                    edge = e
                    break

            if edge is None:
                return False, f"Disconnected segment: No edge between {u} and {v}", 15.0

            if edge.is_blocked:
                # Emergency vehicles might bypass minor blockages if police, but general road block is invalid
                return False, f"Road blocked on segment {edge.name} ({u}->{v})", 20.0

            if vehicle_type in edge.restricted_vehicles:
                return False, f"Vehicle restriction: {vehicle_type.value} not allowed on {edge.name}", 8.0

            total_distance += edge.distance_km

        if total_distance > max_length_km:
            return False, f"Path exceeds maximum allowed distance ({total_distance:.1f} km > {max_length_km:.1f} km)", 5.0

        return True, "Valid route", 0.0
