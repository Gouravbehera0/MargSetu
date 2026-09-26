"""
MARGSETU - AI Traffic Intelligence & Analytics API Router
Provides crowdsourced GPS telemetry ingestion, segment intelligence, 15-30min forecasting,
incident reporting, and network analytics.
"""
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from backend.app.database.models import (
    TrafficLevel,
    SpeedObservation,
    RoadSegmentIntelligence,
    TrafficPrediction,
    RoadConditionReport,
    TrafficAnalyticsSummary
)
from backend.app.traffic.simulation import traffic_manager
from backend.app.traffic.storage import traffic_storage

router = APIRouter(tags=["Traffic Intelligence"])


class TrafficUpdateRequest(BaseModel):
    edge_id: str
    traffic_level: TrafficLevel
    is_blocked: Optional[bool] = None


@router.get("", response_model=List[Dict[str, Any]])
def get_all_traffic():
    """
    Returns current traffic conditions and AI metrics across all road segments.
    Backward-compatible with original simulator while providing enhanced AI data.
    """
    segments_intel = traffic_storage.get_all_segments_intelligence()
    results = []
    for s in segments_intel:
        results.append({
            "edge_id": s.segment_id,
            "name": s.road_name,
            "from_node": s.from_node,
            "to_node": s.to_node,
            "distance_km": s.distance_km,
            "travel_time_min": s.estimated_travel_time_min,
            "speed_limit_kmh": s.reference_speed_kmh,
            "traffic_level": s.traffic_level.lower(),
            "congestion_factor": round(s.congestion_score / 100.0, 2),
            "is_blocked": s.is_blocked,
            "risk_score": 0.05,
            "coordinates": s.coordinates,
            # AI Intelligence fields
            "reference_speed_kmh": s.reference_speed_kmh,
            "current_average_speed_kmh": s.current_average_speed_kmh,
            "historical_average_speed_kmh": s.historical_average_speed_kmh,
            "observations_count": s.active_observations,
            "congestion_score": s.congestion_score,
            "confidence_score": s.confidence_score,
            "last_updated": s.last_updated.isoformat()
        })
    return results


@router.post("/speed", response_model=Dict[str, Any])
def submit_speed_observation(obs: SpeedObservation):
    """
    Ingests anonymized GPS speed telemetry while user navigation is active.
    Map-matches GPS to the nearest road segment, filters outliers via IQR,
    and updates real-time speed aggregation and confidence scores.
    """
    segment_id, intel = traffic_storage.add_speed_observation(obs)
    return {
        "status": "recorded",
        "segment_id": segment_id,
        "matched_road": intel.road_name,
        "current_average_speed_kmh": intel.current_average_speed_kmh,
        "traffic_level": intel.traffic_level,
        "congestion_score": intel.congestion_score,
        "observations_count": intel.active_observations,
        "confidence_score": intel.confidence_score
    }


@router.get("/segment/{segment_id}", response_model=RoadSegmentIntelligence)
def get_segment_intelligence(segment_id: str):
    """
    Retrieves full AI traffic analysis for a specific road segment:
    Reference speed, current average speed, historical speed, active observations,
    traffic level, congestion score (0-100), and confidence score (0-100%).
    """
    clean_id = segment_id.upper().strip()
    return traffic_storage.get_segment_intelligence(clean_id)


@router.get("/nearby", response_model=List[RoadSegmentIntelligence])
def get_nearby_traffic(
    lat: float = Query(..., description="User latitude"),
    lng: float = Query(..., description="User longitude"),
    radius_km: float = Query(5.0, description="Search radius in kilometers")
):
    """
    Finds road segments within geographic proximity to the user with current traffic levels.
    """
    return traffic_storage.get_nearby_segments(lat=lat, lng=lng, radius_km=radius_km)


@router.get("/analytics", response_model=TrafficAnalyticsSummary)
def get_traffic_analytics():
    """
    Provides network-wide AI traffic metrics: average network speed,
    count of congested corridors, active observers, and top bottleneck ranking.
    """
    return traffic_storage.get_analytics_summary()


@router.get("/prediction", response_model=Dict[str, Any])
def get_traffic_predictions(
    segment_id: Optional[str] = Query(None, description="Specific segment ID or None for network overview"),
    horizon_minutes: int = Query(15, description="Prediction horizon: 15 or 30 minutes")
):
    """
    Returns 15-minute or 30-minute predictive traffic trajectory using double-exponential smoothing.
    """
    if horizon_minutes not in [15, 30]:
        horizon_minutes = 15

    if segment_id:
        pred = traffic_storage.predict_segment_traffic(segment_id.upper().strip(), horizon_minutes)
        return {"predictions": [pred.model_dump()]}

    # Return predictions for top 5 key arterial segments
    sample_segments = ["E1", "E2", "E4", "E6", "E22"]
    predictions = [
        traffic_storage.predict_segment_traffic(sid, horizon_minutes).model_dump()
        for sid in sample_segments
    ]
    return {
        "horizon_minutes": horizon_minutes,
        "predictions": predictions,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.post("/report", response_model=RoadConditionReport)
def submit_road_condition_report(report: RoadConditionReport):
    """
    Submits a crowdsourced road hazard/condition report (pothole, bad road, accident, blockage).
    Affects segment risk factors and AI congestion penalties.
    """
    return traffic_storage.add_road_condition_report(report)


@router.get("/reports", response_model=List[RoadConditionReport])
def get_active_road_reports():
    """
    Retrieves all active citizen road condition reports.
    """
    return traffic_storage.get_all_reports()


@router.post("/update", response_model=Dict[str, Any])
def update_traffic_condition(req: TrafficUpdateRequest):
    """
    Manual simulation override for testing dynamic graph edge recalculations.
    """
    result = traffic_manager.update_road_traffic(
        edge_id=req.edge_id,
        traffic_level=req.traffic_level,
        is_blocked=req.is_blocked
    )
    # Refresh cache
    traffic_storage.get_segment_intelligence(req.edge_id)
    return {
        "status": "success",
        "message": f"Updated {result['name']} to {req.traffic_level.value.upper()}",
        "data": result
    }
