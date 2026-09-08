"""
MARGSETU - Incident Management API Router
Endpoints:
- GET  /api/incidents
- POST /api/incidents
- DELETE /api/incidents/{incident_id}
"""
import uuid
from fastapi import APIRouter, HTTPException
from typing import List
from backend.app.database.models import Incident, IncidentType, GeoPoint
from backend.app.database.db import get_all_incidents, add_incident, remove_incident
from backend.app.traffic.simulation import traffic_manager

router = APIRouter(prefix="/api/incidents", tags=["Incidents"])


@router.get("", response_model=List[Incident])
def list_incidents():
    return get_all_incidents()


@router.post("", response_model=Incident)
def create_incident(incident: Incident):
    if not incident.id:
        incident.id = f"inc-{str(uuid.uuid4())[:6]}"
    saved = add_incident(incident)
    # Apply to road network edges
    traffic_manager.apply_incident(saved)
    return saved


@router.delete("/{incident_id}")
def delete_incident(incident_id: str):
    success = remove_incident(incident_id)
    if not success:
        raise HTTPException(status_code=404, detail="Incident not found")
    return {"status": "success", "message": f"Incident {incident_id} resolved"}
