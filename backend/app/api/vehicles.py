"""
MARGSETU - Vehicles & GPS Location API Router
Endpoints:
- GET  /api/vehicles/list
- POST /api/vehicles/location
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from backend.app.database.models import GeoPoint, VehicleType, EmergencyVehicle
from backend.app.database.db import vehicles_db, update_vehicle_location

router = APIRouter(prefix="/api/vehicles", tags=["Vehicles"])


class LocationUpdateRequest(BaseModel):
    vehicle_id: str
    location: GeoPoint
    speed_kmh: Optional[float] = None


@router.get("/list", response_model=List[EmergencyVehicle])
def list_vehicles():
    return list(vehicles_db.values())


@router.post("/location", response_model=Dict[str, Any])
def report_vehicle_location(req: LocationUpdateRequest):
    updated = update_vehicle_location(req.vehicle_id, req.location)
    if not updated:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    if req.speed_kmh is not None:
        updated.speed_kmh = req.speed_kmh
    return {
        "status": "success",
        "vehicle_id": req.vehicle_id,
        "lat": req.location.lat,
        "lng": req.location.lng
    }
