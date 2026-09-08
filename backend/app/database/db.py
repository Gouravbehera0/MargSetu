"""
MARGSETU - In-Memory Database & State Management
Provides persistence, seed data, and query functions for incidents, vehicles, traffic, and benchmark runs.
"""
from typing import Dict, List, Optional
from backend.app.database.models import (
    Incident, IncidentType, EmergencyVehicle, VehicleType, GeoPoint, CitizenGiveWayAlert
)

# Seed Incidents
SEED_INCIDENTS: List[Incident] = [
    Incident(
        id="inc-1",
        type=IncidentType.ACCIDENT,
        description="Minor 2-wheeler collision near Master Canteen Chowk",
        location=GeoPoint(lat=20.2685, lng=85.8360, name="Master Canteen"),
        affected_nodes=["N1", "N2"],
        severity="warning",
        active=True
    ),
    Incident(
        id="inc-2",
        type=IncidentType.ROADBLOCK,
        description="Drainage culvert repair on Sachivalaya Marg (Unit-4)",
        location=GeoPoint(lat=20.2850, lng=85.8240, name="Sachivalaya Marg"),
        affected_nodes=["N4", "N5"],
        severity="critical",
        active=False
    ),
    Incident(
        id="inc-3",
        type=IncidentType.CONSTRUCTION,
        description="Smart City flyover expansion on Janpath Road",
        location=GeoPoint(lat=20.2920, lng=85.8450, name="Janpath Central"),
        affected_nodes=["N6", "N7"],
        severity="info",
        active=True
    )
]

# Seed Emergency Vehicles
SEED_EMERGENCY_VEHICLES: List[EmergencyVehicle] = [
    EmergencyVehicle(
        id="ev-1",
        code="AMB-108",
        vehicle_type=VehicleType.AMBULANCE,
        driver_name="Rajesh Mohanty",
        driver_phone="+91 98765 43210",
        status="on_mission",
        current_location=GeoPoint(lat=20.2720, lng=85.8280, name="Near AG Square"),
        destination=GeoPoint(lat=20.3120, lng=85.8180, name="AIIMS Hospital"),
        eta_minutes=6.5,
        speed_kmh=70.0,
        active_route_geometry=[
            [20.2720, 85.8280],
            [20.2810, 85.8250],
            [20.2950, 85.8210],
            [20.3050, 85.8190],
            [20.3120, 85.8180]
        ],
        alert_radius_meters=600.0
    ),
    EmergencyVehicle(
        id="ev-2",
        code="FIRE-101",
        vehicle_type=VehicleType.FIRE,
        driver_name="Bikram Das",
        driver_phone="+91 98765 43211",
        status="on_mission",
        current_location=GeoPoint(lat=20.2960, lng=85.8520, name="Rasulgarh Fire Station"),
        destination=GeoPoint(lat=20.2800, lng=85.8320, name="Old Town Warehouse"),
        eta_minutes=9.2,
        speed_kmh=60.0,
        active_route_geometry=[
            [20.2960, 85.8520],
            [20.2880, 85.8440],
            [20.2830, 85.8380],
            [20.2800, 85.8320]
        ],
        alert_radius_meters=750.0
    ),
    EmergencyVehicle(
        id="ev-3",
        code="POL-112",
        vehicle_type=VehicleType.POLICE,
        driver_name="Amitabh Patnaik",
        driver_phone="+91 98765 43212",
        status="patrol",
        current_location=GeoPoint(lat=20.3010, lng=85.8350, name="Jayadev Vihar Chowk"),
        destination=GeoPoint(lat=20.3200, lng=85.8200, name="Patia VIP Corridor"),
        eta_minutes=4.0,
        speed_kmh=65.0,
        active_route_geometry=[
            [20.3010, 85.8350],
            [20.3110, 85.8280],
            [20.3200, 85.8200]
        ],
        alert_radius_meters=500.0
    )
]

# In-memory storage stores
incidents_db: Dict[str, Incident] = {inc.id: inc for inc in SEED_INCIDENTS}
vehicles_db: Dict[str, EmergencyVehicle] = {v.id: v for v in SEED_EMERGENCY_VEHICLES}
alerts_db: List[CitizenGiveWayAlert] = []
benchmark_history_db: List[Dict] = []


def get_all_incidents() -> List[Incident]:
    return list(incidents_db.values())


def add_incident(incident: Incident) -> Incident:
    incidents_db[incident.id] = incident
    return incident


def remove_incident(incident_id: str) -> bool:
    if incident_id in incidents_db:
        del incidents_db[incident_id]
        return True
    return False


def get_all_emergency_vehicles() -> List[EmergencyVehicle]:
    return list(vehicles_db.values())


def update_vehicle_location(vehicle_id: str, location: GeoPoint) -> Optional[EmergencyVehicle]:
    if vehicle_id in vehicles_db:
        vehicles_db[vehicle_id].current_location = location
        return vehicles_db[vehicle_id]
    return None
