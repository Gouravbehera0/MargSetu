"""
MARGSETU - Transportation Network Graph
Models the urban road network as a dynamic weighted graph with geographic nodes and multi-attribute edges.
"""
import math
import heapq
from typing import Dict, List, Tuple, Optional, Any, Set
from backend.app.database.models import TrafficLevel, RouteSegment, GeoPoint, VehicleType


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Computes great-circle distance in kilometers between two GPS coordinates."""
    R = 6371.0  # Earth's radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


class NetworkEdge:
    def __init__(
        self,
        edge_id: str,
        u: str,
        v: str,
        name: str,
        distance_km: float,
        speed_limit_kmh: float = 50.0,
        traffic_level: TrafficLevel = TrafficLevel.LOW,
        congestion_factor: float = 0.1,
        risk_score: float = 0.05,
        is_blocked: bool = False,
        road_type: str = "arterial",
        restricted_vehicles: Optional[List[VehicleType]] = None,
        coordinates: Optional[List[List[float]]] = None
    ):
        self.id = edge_id
        self.u = u
        self.v = v
        self.name = name
        self.distance_km = distance_km
        self.speed_limit_kmh = speed_limit_kmh
        self.traffic_level = traffic_level
        self.congestion_factor = congestion_factor
        self.risk_score = risk_score
        self.is_blocked = is_blocked
        self.road_type = road_type
        self.restricted_vehicles = restricted_vehicles or []
        self.coordinates = coordinates or []

    @property
    def effective_speed_kmh(self) -> float:
        """Effective speed reduced by congestion factor."""
        if self.is_blocked:
            return 1.0  # Almost crawling
        # speed drops proportionally to congestion factor (max 80% reduction)
        speed_factor = max(0.2, 1.0 - (self.congestion_factor * 0.8))
        return max(5.0, self.speed_limit_kmh * speed_factor)

    @property
    def travel_time_min(self) -> float:
        """Travel time in minutes under current effective speed."""
        speed = self.effective_speed_kmh
        return (self.distance_km / speed) * 60.0

    def get_effective_cost(
        self,
        vehicle_type: VehicleType = VehicleType.CAR,
        weights: Optional[Dict[str, float]] = None
    ) -> float:
        """Computes cost incorporating time, distance, congestion, risk, and vehicle access."""
        if self.is_blocked:
            return 1e6  # Massive penalty for blocked roads

        if vehicle_type in self.restricted_vehicles:
            return 1e5  # Restricted vehicle penalty

        w = weights or {"time": 0.40, "congestion": 0.25, "distance": 0.20, "risk": 0.10, "blockage": 0.05}
        # Emergency vehicle prioritization
        if vehicle_type in [VehicleType.AMBULANCE, VehicleType.FIRE, VehicleType.POLICE]:
            time_cost = self.travel_time_min * 1.5
            risk_cost = self.risk_score * 5.0
            return time_cost + (self.congestion_factor * 10.0) + risk_cost

        return (
            w.get("time", 0.4) * self.travel_time_min +
            w.get("congestion", 0.25) * (self.congestion_factor * 10.0) +
            w.get("distance", 0.2) * self.distance_km +
            w.get("risk", 0.1) * (self.risk_score * 10.0)
        )


class TransportationGraph:
    def __init__(self):
        self.nodes: Dict[str, Dict[str, Any]] = {}
        self.adjacency: Dict[str, List[NetworkEdge]] = {}
        self.edges_by_id: Dict[str, NetworkEdge] = {}
        self._initialize_smart_city_grid()

    def add_node(self, node_id: str, name: str, lat: float, lng: float, facility_type: Optional[str] = None):
        self.nodes[node_id] = {
            "id": node_id,
            "name": name,
            "lat": lat,
            "lng": lng,
            "facility_type": facility_type
        }
        if node_id not in self.adjacency:
            self.adjacency[node_id] = []

    def add_edge(
        self,
        edge_id: str,
        u: str,
        v: str,
        name: str,
        distance_km: Optional[float] = None,
        speed_limit_kmh: float = 50.0,
        traffic_level: TrafficLevel = TrafficLevel.LOW,
        congestion_factor: float = 0.1,
        risk_score: float = 0.05,
        is_blocked: bool = False,
        road_type: str = "arterial",
        restricted_vehicles: Optional[List[VehicleType]] = None,
        bidirectional: bool = True
    ):
        if distance_km is None:
            lat1, lng1 = self.nodes[u]["lat"], self.nodes[u]["lng"]
            lat2, lng2 = self.nodes[v]["lat"], self.nodes[v]["lng"]
            distance_km = round(haversine_distance(lat1, lng1, lat2, lng2) * 1.25, 2)  # 1.25 winding factor

        coords_fwd = [
            [self.nodes[u]["lat"], self.nodes[u]["lng"]],
            [self.nodes[v]["lat"], self.nodes[v]["lng"]]
        ]

        edge_fwd = NetworkEdge(
            edge_id=edge_id,
            u=u,
            v=v,
            name=name,
            distance_km=distance_km,
            speed_limit_kmh=speed_limit_kmh,
            traffic_level=traffic_level,
            congestion_factor=congestion_factor,
            risk_score=risk_score,
            is_blocked=is_blocked,
            road_type=road_type,
            restricted_vehicles=restricted_vehicles,
            coordinates=coords_fwd
        )
        self.adjacency[u].append(edge_fwd)
        self.edges_by_id[edge_id] = edge_fwd

        if bidirectional:
            rev_id = f"{edge_id}_rev"
            coords_rev = [
                [self.nodes[v]["lat"], self.nodes[v]["lng"]],
                [self.nodes[u]["lat"], self.nodes[u]["lng"]]
            ]
            edge_rev = NetworkEdge(
                edge_id=rev_id,
                u=v,
                v=u,
                name=f"{name} (Return)",
                distance_km=distance_km,
                speed_limit_kmh=speed_limit_kmh,
                traffic_level=traffic_level,
                congestion_factor=congestion_factor,
                risk_score=risk_score,
                is_blocked=is_blocked,
                road_type=road_type,
                restricted_vehicles=restricted_vehicles,
                coordinates=coords_rev
            )
            self.adjacency[v].append(edge_rev)
            self.edges_by_id[rev_id] = edge_rev

    def get_nearest_node(self, lat: float, lng: float) -> str:
        """Finds closest node in the graph to arbitrary coordinates."""
        closest_node = None
        min_dist = float("inf")
        for node_id, data in self.nodes.items():
            d = haversine_distance(lat, lng, data["lat"], data["lng"])
            if d < min_dist:
                min_dist = d
                closest_node = node_id
        return closest_node or list(self.nodes.keys())[0]

    def update_edge_traffic(self, edge_id: str, traffic_level: TrafficLevel, congestion_factor: float, is_blocked: bool = False):
        """Dynamically updates traffic congestion or blockage on an edge."""
        if edge_id in self.edges_by_id:
            edge = self.edges_by_id[edge_id]
            edge.traffic_level = traffic_level
            edge.congestion_factor = congestion_factor
            edge.is_blocked = is_blocked
        # Check reverse edge if exists
        rev_id = f"{edge_id}_rev"
        if rev_id in self.edges_by_id:
            rev_edge = self.edges_by_id[rev_id]
            rev_edge.traffic_level = traffic_level
            rev_edge.congestion_factor = congestion_factor
            rev_edge.is_blocked = is_blocked

    def _initialize_smart_city_grid(self):
        """Seeds realistic connected urban network (Bhubaneswar Smart City model with 16 nodes and 28 edges)."""
        nodes_data = [
            ("N1", "Master Canteen Junction", 20.2685, 85.8360, "hub"),
            ("N2", "Rajmahal Square", 20.2610, 85.8340, "intersection"),
            ("N3", "Kalpana Square", 20.2520, 85.8380, "intersection"),
            ("N4", "AG Square", 20.2730, 85.8280, "intersection"),
            ("N5", "Secretariat Chowk", 20.2820, 85.8230, "government"),
            ("N6", "Jayadev Vihar", 20.3010, 85.8350, "hub"),
            ("N7", "Acharya Vihar", 20.2940, 85.8390, "intersection"),
            ("N8", "Vani Vihar Chowk", 20.2990, 85.8520, "hub"),
            ("N9", "Rasulgarh Industrial Corridor", 20.2970, 85.8690, "industrial"),
            ("N10", "AIIMS Hospital Complex", 20.3120, 85.8180, "hospital"),
            ("N11", "Khandagiri Square", 20.2560, 85.7890, "intersection"),
            ("N12", "Patia Tech Park", 20.3540, 85.8170, "commercial"),
            ("N13", "KIIT Square", 20.3520, 85.8220, "education"),
            ("N14", "Baramunda Bus Terminal", 20.2740, 85.7950, "transit"),
            ("N15", "Capital Hospital Central", 20.2640, 85.8240, "hospital"),
            ("N16", "Chandrasekharpur Hub", 20.3240, 85.8200, "residential")
        ]
        for nid, name, lat, lng, ftype in nodes_data:
            self.add_node(nid, name, lat, lng, ftype)

        edges_data = [
            ("E1", "N1", "N2", "Janpath South", 1.2, 50, TrafficLevel.LOW, 0.15, 0.05, False, "arterial"),
            ("E2", "N2", "N3", "Kalpana Link", 1.4, 45, TrafficLevel.MEDIUM, 0.35, 0.10, False, "arterial"),
            ("E3", "N1", "N4", "Sachivalaya South", 1.5, 55, TrafficLevel.LOW, 0.10, 0.02, False, "arterial"),
            ("E4", "N4", "N5", "Sachivalaya Marg", 1.3, 60, TrafficLevel.LOW, 0.10, 0.02, False, "arterial"),
            ("E5", "N5", "N6", "Jayadev Expressway", 2.6, 70, TrafficLevel.MEDIUM, 0.40, 0.08, False, "highway"),
            ("E6", "N1", "N7", "Janpath North", 3.2, 45, TrafficLevel.HIGH, 0.70, 0.15, False, "arterial"),
            ("E7", "N7", "N8", "NH-16 Connector", 1.6, 65, TrafficLevel.MEDIUM, 0.30, 0.05, False, "highway"),
            ("E8", "N8", "N9", "Cuttack-Puri Bypass", 2.1, 75, TrafficLevel.LOW, 0.12, 0.04, False, "highway"),
            ("E9", "N6", "N10", "AIIMS Dedicated Corridor", 2.2, 60, TrafficLevel.LOW, 0.05, 0.01, False, "emergency_lane"),
            ("E10", "N5", "N10", "Gopabandhu Link to AIIMS", 3.6, 50, TrafficLevel.LOW, 0.20, 0.04, False, "arterial"),
            ("E11", "N2", "N15", "Hospital Access Road", 1.1, 40, TrafficLevel.LOW, 0.10, 0.02, False, "arterial"),
            ("E12", "N4", "N15", "Unit-6 Medical Route", 1.3, 40, TrafficLevel.LOW, 0.10, 0.02, False, "arterial"),
            ("E13", "N4", "N14", "Baramunda Highway", 3.5, 60, TrafficLevel.MEDIUM, 0.45, 0.10, False, "arterial"),
            ("E14", "N14", "N11", "Khandagiri Bypass", 2.4, 55, TrafficLevel.LOW, 0.20, 0.05, False, "arterial"),
            ("E15", "N11", "N10", "AIIMS Western Gate", 5.8, 65, TrafficLevel.LOW, 0.15, 0.03, False, "highway"),
            ("E16", "N6", "N16", "Chandrasekharpur Main", 2.8, 55, TrafficLevel.MEDIUM, 0.40, 0.08, False, "arterial"),
            ("E17", "N16", "N12", "Infocity Boulevard", 3.5, 60, TrafficLevel.LOW, 0.20, 0.05, False, "arterial"),
            ("E18", "N12", "N13", "KIIT Tech Corridor", 0.9, 45, TrafficLevel.LOW, 0.15, 0.02, False, "arterial"),
            ("E19", "N7", "N6", "Science Park Road", 1.2, 50, TrafficLevel.MEDIUM, 0.35, 0.06, False, "arterial"),
            ("E20", "N8", "N6", "Mayfair Bypass", 2.0, 60, TrafficLevel.LOW, 0.25, 0.04, False, "arterial"),
            ("E21", "N10", "N16", "Kanan Vihar Link", 2.5, 50, TrafficLevel.LOW, 0.20, 0.05, False, "arterial"),
            ("E22", "N9", "N8", "Rasulgarh Overbridge", 2.1, 50, TrafficLevel.HIGH, 0.75, 0.18, False, "arterial")
        ]
        for eid, u, v, name, dist, spd, tlvl, cfact, risk, blk, rtype in edges_data:
            self.add_edge(eid, u, v, name, dist, spd, tlvl, cfact, risk, blk, rtype)


# Global singleton instance of the transportation graph
transport_graph = TransportationGraph()
