"""
MARGSETU - Emergency Mode & Give-Way Alerts API Router
Endpoints:
- GET  /api/emergency/vehicles
- POST /api/emergency/request
- POST /api/emergency/give-way
- POST /api/emergency/citizens/location
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from backend.app.database.models import (
    EmergencyVehicle, CitizenGiveWayAlert, GeoPoint, VehicleType, ActiveAmbulanceAlertResponse
)
from backend.app.database.db import get_all_emergency_vehicles, vehicles_db
from backend.app.emergency.give_way import emergency_engine
from backend.app.emergency.real_corridors import RAIPUR_AMBULANCE_REAL_ROAD, BHUBANESWAR_AMBULANCE_REAL_ROAD
from backend.app.routing.osrm_client import osrm_client

router = APIRouter(prefix="/api/emergency", tags=["Emergency"])


class CitizenLocationUpdate(BaseModel):
    citizen_id: str
    location: GeoPoint


class GiveWayCheckRequest(BaseModel):
    vehicle_id: str
    current_location: Optional[GeoPoint] = None
    alert_radius_meters: Optional[float] = None


class StepVehicleRequest(BaseModel):
    vehicle_id: str = "ev-1"


@router.get("/vehicles", response_model=List[EmergencyVehicle])
def get_emergency_vehicles():
    """Returns active emergency vehicles and their live coordinates & telemetry."""
    # Ensure headings are calculated
    for v in vehicles_db.values():
        emergency_engine.compute_vehicle_heading(v)
    return get_all_emergency_vehicles()


from backend.app.routing.network_graph import haversine_distance
from backend.app.emergency.give_way import min_distance_to_polyline_km


@router.get("/active-ambulance", response_model=ActiveAmbulanceAlertResponse)
def get_active_ambulance_alert(
    user_lat: float = Query(20.2740, description="Current latitude of citizen or navigating user"),
    user_lng: float = Query(85.8300, description="Current longitude of citizen or navigating user"),
    alert_radius_meters: float = Query(1000.0, description="Proximity alert threshold in meters"),
    simulate: bool = Query(False, description="Explicitly trigger demonstration simulation of approaching ambulance")
):
    """
    Evaluates real-time active ambulance corridor status for a user:
    - Checks for genuinely active emergency vehicles on mission in proximity.
    - If simulate=True, allows controlled interactive demonstration along real road corridors.
    - If no vehicle is on active mission, returns has_active_ambulance=False (no ghost ambulances).
    """
    active_amb: Optional[EmergencyVehicle] = None
    min_dist_m = float("inf")

    # 1. Search existing vehicles for any real active ambulance on mission near the user
    for v in vehicles_db.values():
        if v.vehicle_type == VehicleType.AMBULANCE and v.status == "on_mission":
            dist_km = haversine_distance(
                v.current_location.lat, v.current_location.lng, user_lat, user_lng
            )
            dist_m = dist_km * 1000.0
            corridor_dist_km = min_distance_to_polyline_km(user_lat, user_lng, v.active_route_geometry)
            corridor_dist_m = corridor_dist_km * 1000.0

            # Active vehicle is in relevant operational proximity (within 3km direct or 1.5km of corridor)
            if dist_m <= max(alert_radius_meters * 2.5, 3000.0) or corridor_dist_m <= 1500.0:
                if dist_m < min_dist_m:
                    min_dist_m = dist_m
                    active_amb = v

    # 2. If no active vehicle is found and simulation was explicitly requested:
    if not active_amb and simulate:
        if abs(user_lng - 81.63) < 1.5:
            # Raipur corridor simulation
            sim_id = "ev-raipur-1"
            if sim_id not in vehicles_db:
                vehicles_db[sim_id] = EmergencyVehicle(
                    id=sim_id,
                    code="AMB-108",
                    vehicle_type=VehicleType.AMBULANCE,
                    driver_name="Ramesh Verma",
                    driver_phone="+91 98765 43210",
                    status="on_mission",
                    current_location=GeoPoint(
                        lat=RAIPUR_AMBULANCE_REAL_ROAD[0][0],
                        lng=RAIPUR_AMBULANCE_REAL_ROAD[0][1],
                        name="GE Road Emergency Corridor"
                    ),
                    destination=GeoPoint(
                        lat=RAIPUR_AMBULANCE_REAL_ROAD[-1][0],
                        lng=RAIPUR_AMBULANCE_REAL_ROAD[-1][1],
                        name="Raipur Junction / Hospital Arterial"
                    ),
                    eta_minutes=4.5,
                    speed_kmh=68.0,
                    active_route_geometry=RAIPUR_AMBULANCE_REAL_ROAD,
                    alert_radius_meters=alert_radius_meters
                )
            active_amb = vehicles_db[sim_id]
        else:
            # Dynamic real-road ambulance for user's location via OSRM
            sim_id = f"ev-sim-{round(user_lat, 2)}-{round(user_lng, 2)}"
            if sim_id not in vehicles_db:
                try:
                    orig = GeoPoint(lat=user_lat - 0.012, lng=user_lng - 0.010)
                    dest = GeoPoint(lat=user_lat + 0.010, lng=user_lng + 0.012)
                    routes = osrm_client.get_route_candidates(orig, dest, vehicle_type=VehicleType.AMBULANCE)
                    real_geom = routes[0]["coordinates"] if (routes and len(routes) > 0) else BHUBANESWAR_AMBULANCE_REAL_ROAD
                except Exception:
                    real_geom = BHUBANESWAR_AMBULANCE_REAL_ROAD

                vehicles_db[sim_id] = EmergencyVehicle(
                    id=sim_id,
                    code="AMB-108",
                    vehicle_type=VehicleType.AMBULANCE,
                    driver_name="Duty Paramedic",
                    driver_phone="+91 98765 43210",
                    status="on_mission",
                    current_location=GeoPoint(lat=real_geom[0][0], lng=real_geom[0][1], name="Regional Clearway Corridor"),
                    destination=GeoPoint(lat=real_geom[-1][0], lng=real_geom[-1][1], name="Regional Hospital Facility"),
                    eta_minutes=5.0,
                    speed_kmh=70.0,
                    active_route_geometry=real_geom,
                    alert_radius_meters=alert_radius_meters
                )
            active_amb = vehicles_db[sim_id]

    # 3. If still no active ambulance, return clean inactive state
    if not active_amb:
        return ActiveAmbulanceAlertResponse(
            has_active_ambulance=False,
            is_relevant_to_user=False,
            message="No active ambulance emergency mission in progress."
        )

    return emergency_engine.check_active_ambulance_alert_for_user(
        ambulance=active_amb,
        user_lat=user_lat,
        user_lng=user_lng,
        alert_radius_meters=alert_radius_meters
    )


@router.post("/step")
def step_emergency_vehicle(req: StepVehicleRequest):
    """
    Advances the emergency vehicle along its active corridor route coordinates.
    Updates position, heading bearing, and remaining ETA in real-time.
    """
    veh = vehicles_db.get(req.vehicle_id)
    if not veh:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    updated = emergency_engine.step_vehicle_movement(veh)
    return {
        "status": "success",
        "vehicle_id": updated.id,
        "code": updated.code,
        "current_location": updated.current_location,
        "heading_degrees": updated.heading_degrees,
        "heading_direction": updated.heading_direction,
        "current_step_index": updated.current_step_index,
        "eta_minutes": updated.eta_minutes
    }


@router.post("/citizens/location")
def update_citizen_location(req: CitizenLocationUpdate):
    """Registers or updates opted-in citizen location for proximity Give-Way warnings."""
    emergency_engine.register_citizen_location(req.citizen_id, req.location)
    return {"status": "success", "citizen_id": req.citizen_id}


@router.post("/give-way", response_model=List[CitizenGiveWayAlert])
def check_give_way_alerts(req: GiveWayCheckRequest):
    """
    Checks proximity between an active emergency vehicle and citizens along its corridor.
    Returns enriched alerts with route geometry, heading arrow degrees, and ETA.
    """
    vehicle = vehicles_db.get(req.vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Emergency vehicle not found")

    if req.current_location:
        vehicle.current_location = req.current_location

    alerts = emergency_engine.check_proximity_and_alert(
        vehicle=vehicle,
        alert_radius_meters=req.alert_radius_meters
    )
    return alerts

