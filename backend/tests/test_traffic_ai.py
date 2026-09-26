"""
Unit and integration tests for MARGSETU AI Traffic Analysis Engine & Endpoints.
"""
import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
import numpy as np

from backend.app.main import app
from backend.app.database.models import SpeedObservation, RoadConditionReport
from backend.app.traffic.ai_analyzer import AITrafficAnalyzer
from backend.app.traffic.map_matcher import map_matcher
from backend.app.traffic.storage import traffic_storage

client = TestClient(app)


def test_ai_analyzer_iqr_outlier_filtering():
    # Regular speeds around 40-50, with extreme outliers: 2 km/h (parked) and 150 km/h (erroneous ping)
    raw_speeds = [42.0, 45.0, 44.0, 48.0, 46.0, 43.0, 47.0, 2.0, 150.0]
    filtered = AITrafficAnalyzer.filter_speed_outliers(raw_speeds)

    # 2.0 and 150.0 should be excluded or filtered by IQR
    assert len(filtered) < len(raw_speeds)
    assert 150.0 not in filtered
    assert np.mean(filtered) >= 40.0 and np.mean(filtered) <= 50.0


def test_ai_analyzer_speed_aggregation():
    speeds = [30.0, 32.0, 31.0, 29.0, 33.0, 30.5]
    agg_speed, var, count = AITrafficAnalyzer.aggregate_speed(speeds, reference_speed=50.0)

    assert count == 6
    assert 29.0 <= agg_speed <= 33.0
    assert var >= 0.0


def test_ai_analyzer_classification():
    # Low speed compared to reference = Heavy or Severe
    level, score, conf = AITrafficAnalyzer.classify_traffic(
        current_speed=15.0,
        reference_speed=50.0,
        historical_speed=40.0,
        observations_count=12
    )
    assert level in ["Heavy", "Severe"]
    assert score >= 50.0
    assert conf >= 80.0

    # Normal speed
    lvl_norm, score_norm, conf_norm = AITrafficAnalyzer.classify_traffic(
        current_speed=48.0,
        reference_speed=50.0,
        historical_speed=45.0,
        observations_count=16
    )
    assert lvl_norm == "Normal"
    assert score_norm <= 25.0
    assert conf_norm >= 90.0


def test_ai_analyzer_prediction():
    recent = [45.0, 42.0, 38.0, 32.0, 26.0]
    pred_15 = AITrafficAnalyzer.predict_traffic(
        segment_id="E1",
        recent_speeds=recent,
        current_speed=26.0,
        reference_speed=50.0,
        historical_future_speed=30.0,
        horizon_minutes=15
    )
    assert pred_15.horizon_minutes == 15
    assert pred_15.predicted_speed_kmh > 0
    assert pred_15.trend in ["IMPROVING", "STABLE", "WORSENING"]
    assert pred_15.confidence_score > 50.0


def test_spatial_map_matching():
    # Coordinates near Master Canteen Junction (20.2685, 85.8360) and Rajmahal (20.2610, 85.8340) -> Edge E1
    matched = map_matcher.match_point(20.2650, 85.8350, heading=180.0)
    assert matched is not None
    seg_id, dist = matched
    assert seg_id == "E1"
    assert dist < 300.0


def test_api_submit_speed_observation():
    payload = {
        "latitude": 20.2650,
        "longitude": 85.8350,
        "speed_kmh": 22.5,
        "heading_degrees": 180.0,
        "segment_id": "E1"
    }
    resp = client.post("/api/traffic/speed", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "recorded"
    assert data["segment_id"] == "E1"
    assert "current_average_speed_kmh" in data
    assert "traffic_level" in data
    assert "congestion_score" in data


def test_api_get_segment_intelligence():
    resp = client.get("/api/traffic/segment/E1")
    assert resp.status_code == 200
    data = resp.json()
    assert data["segment_id"] == "E1"
    assert data["reference_speed_kmh"] > 0
    assert data["traffic_level"] in ["Normal", "Moderate", "Heavy", "Severe"]
    assert 0.0 <= data["congestion_score"] <= 100.0
    assert 0.0 <= data["confidence_score"] <= 100.0


def test_api_traffic_analytics():
    resp = client.get("/api/traffic/analytics")
    assert resp.status_code == 200
    data = resp.json()
    assert "network_average_speed_kmh" in data
    assert "congested_segments_count" in data
    assert "top_bottlenecks" in data
    assert len(data["top_bottlenecks"]) <= 5


def test_api_traffic_prediction():
    resp = client.get("/api/traffic/prediction?segment_id=E1&horizon_minutes=15")
    assert resp.status_code == 200
    data = resp.json()
    assert "predictions" in data
    assert len(data["predictions"]) >= 1
    assert data["predictions"][0]["horizon_minutes"] == 15


def test_api_road_condition_report():
    report_payload = {
        "latitude": 20.2685,
        "longitude": 85.8360,
        "report_type": "pothole",
        "severity": "high",
        "description": "Large road crater after rain near square junction",
        "segment_id": "E1"
    }
    resp = client.post("/api/traffic/report", json=report_payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["report_type"] == "pothole"
    assert data["severity"] == "high"

    # Verify report is listed
    list_resp = client.get("/api/traffic/reports")
    assert list_resp.status_code == 200
    reports = list_resp.json()
    assert any(r["description"] == report_payload["description"] for r in reports)
