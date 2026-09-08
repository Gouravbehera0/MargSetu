"""
MARGSETU - Database & Domain Models
Pydantic schemas and database models for Intelligent Route Optimization.
"""
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum


class VehicleType(str, Enum):
    CAR = "car"
    BIKE = "bike"
    BUS = "bus"
    TRUCK = "truck"
    TAXI = "taxi"
    DELIVERY = "delivery"
    AMBULANCE = "ambulance"
    FIRE = "fire"
    POLICE = "police"


class RoutePreference(str, Enum):
    FASTEST = "fastest"
    SHORTEST = "shortest"
    SAFEST = "safest"
    LOW_TRAFFIC = "low_traffic"
    ECO = "eco"
    BALANCED = "balanced"
    EMERGENCY = "emergency"


class TrafficLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    SEVERE = "severe"
    BLOCKED = "blocked"


class IncidentType(str, Enum):
    ACCIDENT = "accident"
    ROADBLOCK = "roadblock"
    CONSTRUCTION = "construction"
    FIRE = "fire"
    WEATHER = "weather"


class GeoPoint(BaseModel):
    lat: float
    lng: float
    name: Optional[str] = None


class RouteSegment(BaseModel):
    id: str
    from_node: str
    to_node: str
    name: str
    distance_km: float
    travel_time_min: float
    traffic_level: TrafficLevel = TrafficLevel.LOW
    congestion_factor: float = 0.0  # 0.0 (free flow) to 1.0 (gridlock)
    risk_score: float = 0.0        # 0.0 (safe) to 1.0 (hazardous)
    is_blocked: bool = False
    speed_limit_kmh: float = 50.0
    coordinates: List[List[float]] = []  # [[lat, lng], ...]


class RouteCandidate(BaseModel):
    id: str
    name: str
    path_nodes: List[str]
    segments: List[RouteSegment]
    distance_km: float
    travel_time_min: float
    traffic_score: float
    risk_score: float
    blockage_score: float
    composite_fitness: float
    coordinates: List[List[float]]
    turn_instructions: List[Dict[str, Any]] = []


class OptimizationWeights(BaseModel):
    w1_time: float = Field(0.40, description="Weight for travel time (T)")
    w2_congestion: float = Field(0.25, description="Weight for congestion (C)")
    w3_distance: float = Field(0.20, description="Weight for distance (D)")
    w4_risk: float = Field(0.10, description="Weight for road risk (R)")
    w5_blockage: float = Field(0.05, description="Weight for blockage/closure (B)")

    def normalize(self) -> "OptimizationWeights":
        total = self.w1_time + self.w2_congestion + self.w3_distance + self.w4_risk + self.w5_blockage
        if total <= 0:
            return OptimizationWeights()
        return OptimizationWeights(
            w1_time=self.w1_time / total,
            w2_congestion=self.w2_congestion / total,
            w3_distance=self.w3_distance / total,
            w4_risk=self.w4_risk / total,
            w5_blockage=self.w5_blockage / total,
        )


class OptimizationRequest(BaseModel):
    origin: GeoPoint
    destination: GeoPoint
    vehicle_type: VehicleType = VehicleType.CAR
    preference: RoutePreference = RoutePreference.BALANCED
    custom_weights: Optional[OptimizationWeights] = None
    particle_count: int = 30
    max_iterations: int = 60
    beta: float = 0.75  # Contraction-Expansion coefficient
    avoid_incidents: bool = True


class FitnessExplanation(BaseModel):
    time_contribution: float
    congestion_contribution: float
    distance_contribution: float
    risk_contribution: float
    blockage_contribution: float
    total_fitness: float
    explanation_text: str


class OptimizationResult(BaseModel):
    algorithm: str = "QPSO"
    route_id: str
    route_name: str
    origin: GeoPoint
    destination: GeoPoint
    distance_km: float
    eta_minutes: float
    fitness: float
    traffic_score: float
    risk_score: float
    blockage_score: float
    iterations: int
    computation_time_ms: float
    convergence_history: List[float]
    weights_used: OptimizationWeights
    explainability: FitnessExplanation
    path_nodes: List[str]
    route_geometry: List[List[float]]  # [[lat, lng], ...]
    candidate_alternatives: List[Dict[str, Any]] = []
    vehicle_type: VehicleType = VehicleType.CAR
    is_emergency: bool = False


class BenchmarkRequest(BaseModel):
    origin: GeoPoint
    destination: GeoPoint
    vehicle_type: VehicleType = VehicleType.CAR
    particle_count: int = 30
    iterations: int = 50
    traffic_condition: TrafficLevel = TrafficLevel.MEDIUM


class BenchmarkResultItem(BaseModel):
    algorithm: str
    fitness: float
    travel_time_min: float
    distance_km: float
    computation_time_ms: float
    iterations: int
    convergence_history: List[float]
    route_valid: bool
    path: List[str]


class Incident(BaseModel):
    id: str
    type: IncidentType
    description: str
    location: GeoPoint
    affected_nodes: List[str] = []
    severity: str = "warning"
    reported_at: datetime = Field(default_factory=datetime.utcnow)
    active: bool = True


class EmergencyVehicle(BaseModel):
    id: str
    code: str
    vehicle_type: VehicleType
    driver_name: str
    driver_phone: str
    status: str = "on_mission"
    current_location: GeoPoint
    destination: GeoPoint
    eta_minutes: float
    speed_kmh: float = 65.0
    heading_degrees: float = 0.0
    heading_direction: str = "North"
    current_step_index: int = 0
    active_route_geometry: List[List[float]] = []
    alert_radius_meters: float = 600.0


class CitizenGiveWayAlert(BaseModel):
    id: str
    citizen_id: str
    emergency_vehicle_code: str
    emergency_vehicle_type: VehicleType
    distance_meters: float
    message: str
    severity: str = "critical"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    ambulance_location: Optional[GeoPoint] = None
    heading_degrees: Optional[float] = None
    heading_direction: Optional[str] = None
    speed_kmh: Optional[float] = None
    active_route_geometry: Optional[List[List[float]]] = None
    eta_seconds: Optional[int] = None
    is_approaching: bool = True


class ActiveAmbulanceAlertResponse(BaseModel):
    has_active_ambulance: bool
    is_relevant_to_user: bool = False
    vehicle_id: Optional[str] = None
    vehicle_code: Optional[str] = None
    vehicle_type: Optional[VehicleType] = None
    ambulance_location: Optional[GeoPoint] = None
    heading_degrees: float = 0.0
    heading_direction: str = "North"
    speed_kmh: float = 70.0
    distance_meters: float = 0.0
    eta_seconds: int = 0
    active_route_geometry: List[List[float]] = []
    message: str = ""
    give_way_action: str = ""
    is_approaching: bool = True

