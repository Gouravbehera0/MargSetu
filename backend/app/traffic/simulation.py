"""
MARGSETU - Dynamic Traffic Simulation & Rerouting Manager
Maintains live road traffic conditions, processes incident injections, and triggers dynamic recalculations.
"""
from typing import Dict, List, Optional, Any
from backend.app.database.models import TrafficLevel, Incident, IncidentType, GeoPoint
from backend.app.routing.network_graph import transport_graph, TransportationGraph


TRAFFIC_FACTORS: Dict[TrafficLevel, float] = {
    TrafficLevel.LOW: 0.10,
    TrafficLevel.MEDIUM: 0.35,
    TrafficLevel.HIGH: 0.70,
    TrafficLevel.SEVERE: 0.90,
    TrafficLevel.BLOCKED: 1.00
}


class TrafficSimulationManager:
    def __init__(self, graph: TransportationGraph):
        self.graph = graph

    def update_road_traffic(
        self,
        edge_id: str,
        traffic_level: TrafficLevel,
        is_blocked: Optional[bool] = None
    ) -> Dict[str, Any]:
        """Updates traffic condition on a specific road edge and recalculates affected metrics."""
        blocked = (traffic_level == TrafficLevel.BLOCKED) if is_blocked is None else is_blocked
        congestion_factor = TRAFFIC_FACTORS.get(traffic_level, 0.2)

        self.graph.update_edge_traffic(
            edge_id=edge_id,
            traffic_level=traffic_level,
            congestion_factor=congestion_factor,
            is_blocked=blocked
        )

        edge = self.graph.edges_by_id.get(edge_id)
        return {
            "edge_id": edge_id,
            "name": edge.name if edge else "Road",
            "traffic_level": traffic_level.value,
            "congestion_factor": congestion_factor,
            "is_blocked": blocked,
            "new_travel_time_min": round(edge.travel_time_min, 1) if edge else 0.0
        }

    def apply_incident(self, incident: Incident) -> List[str]:
        """Applies road incident effects to network graph edges."""
        affected_edges = []
        for u in incident.affected_nodes:
            for edge in self.graph.adjacency.get(u, []):
                if incident.type == IncidentType.ROADBLOCK:
                    edge.is_blocked = incident.active
                    edge.traffic_level = TrafficLevel.BLOCKED if incident.active else TrafficLevel.LOW
                    edge.congestion_factor = 1.0 if incident.active else 0.1
                elif incident.type == IncidentType.ACCIDENT:
                    edge.traffic_level = TrafficLevel.HIGH if incident.active else TrafficLevel.LOW
                    edge.congestion_factor = 0.8 if incident.active else 0.1
                    edge.risk_score = 0.6 if incident.active else 0.05
                elif incident.type == IncidentType.CONSTRUCTION:
                    edge.traffic_level = TrafficLevel.MEDIUM if incident.active else TrafficLevel.LOW
                    edge.congestion_factor = 0.5 if incident.active else 0.1
                affected_edges.append(edge.id)
        return affected_edges

    def get_all_road_statuses(self) -> List[Dict[str, Any]]:
        """Returns current traffic status across all distinct road segments."""
        statuses = []
        seen = set()
        for edge_id, edge in self.graph.edges_by_id.items():
            if edge_id.endswith("_rev"):
                continue
            base_key = f"{min(edge.u, edge.v)}-{max(edge.u, edge.v)}"
            if base_key in seen:
                continue
            seen.add(base_key)

            statuses.append({
                "edge_id": edge.id,
                "name": edge.name,
                "from_node": edge.u,
                "to_node": edge.v,
                "distance_km": edge.distance_km,
                "travel_time_min": round(edge.travel_time_min, 1),
                "speed_limit_kmh": edge.speed_limit_kmh,
                "traffic_level": edge.traffic_level.value,
                "congestion_factor": round(edge.congestion_factor, 2),
                "is_blocked": edge.is_blocked,
                "risk_score": round(edge.risk_score, 2),
                "coordinates": edge.coordinates
            })
        return statuses


traffic_manager = TrafficSimulationManager(transport_graph)
