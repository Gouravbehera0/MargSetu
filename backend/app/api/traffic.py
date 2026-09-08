"""
MARGSETU - Traffic Simulation API Router
Endpoints:
- GET  /api/traffic
- POST /api/traffic/update
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from backend.app.database.models import TrafficLevel
from backend.app.traffic.simulation import traffic_manager

router = APIRouter(prefix="/api/traffic", tags=["Traffic"])


class TrafficUpdateRequest(BaseModel):
    edge_id: str
    traffic_level: TrafficLevel
    is_blocked: Optional[bool] = None


@router.get("", response_model=List[Dict[str, Any]])
def get_all_traffic():
    """Returns current traffic status, congestion factor, and blockage of all road segments."""
    return traffic_manager.get_all_road_statuses()


@router.post("/update", response_model=Dict[str, Any])
def update_traffic_condition(req: TrafficUpdateRequest):
    """Updates traffic condition on a specific road segment and broadcasts network impact."""
    result = traffic_manager.update_road_traffic(
        edge_id=req.edge_id,
        traffic_level=req.traffic_level,
        is_blocked=req.is_blocked
    )
    return {
        "status": "success",
        "message": f"Updated {result['name']} to {req.traffic_level.value.upper()}",
        "data": result
    }
