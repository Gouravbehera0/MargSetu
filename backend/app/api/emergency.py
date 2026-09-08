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


@router.get("/active-ambulance", response_model=ActiveAmbulanceAlertResponse)
def get_active_ambulance_alert(
    user_lat: float = Query(20.2740, description="Current latitude of citizen or navigating user"),
    user_lng: float = Query(85.8300, description="Current longitude of citizen or navigating user"),
    alert_radius_meters: float = Query(1000.0, description="Proximity alert threshold in meters")
):
    """
    Evaluates real-time active ambulance corridor status for a user:
    - Shares ambulance live position, heading/bearing (0-360 deg) and route geometry.
    - Determines if user is along or approaching the corridor and calculates ETA.
    - Notifies only relevant nearby users.
    """
    # Look for active ambulance on mission
    active_amb: Optional[EmergencyVehicle] = None
    for veh in vehicles_db.values():
        if veh.vehicle_type == VehicleType.AMBULANCE and veh.status == "on_mission":
            active_amb = veh
            break

    # Fallback to ev-1 if present
    if not active_amb and "ev-1" in vehicles_db:
        active_amb = vehicles_db["ev-1"]

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

