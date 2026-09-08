"""
MARGSETU - Emergency Mode & Give-Way Alerts API Router
Endpoints:
- GET  /api/emergency/vehicles
- POST /api/emergency/request
- POST /api/emergency/give-way
- POST /api/emergency/citizens/location
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from backend.app.database.models import (
    EmergencyVehicle, CitizenGiveWayAlert, GeoPoint, VehicleType
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


@router.get("/vehicles", response_model=List[EmergencyVehicle])
def get_emergency_vehicles():
    """Returns active emergency vehicles and their live coordinates & telemetry."""
    return get_all_emergency_vehicles()


@router.post("/citizens/location")
def update_citizen_location(req: CitizenLocationUpdate):
    """Registers or updates opted-in citizen location for proximity Give-Way warnings."""
    emergency_engine.register_citizen_location(req.citizen_id, req.location)
    return {"status": "success", "citizen_id": req.citizen_id}


@router.post("/give-way", response_model=List[CitizenGiveWayAlert])
def check_give_way_alerts(req: GiveWayCheckRequest):
    """
    Checks proximity between an active emergency vehicle and citizens along its corridor.
    Returns generated alerts for any citizen within the alert radius.
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
