"""
Integration tests for FastAPI REST endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_health_and_root():
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["platform"] == "MARGSETU"
    assert data["engine"] == "Quantum-Inspired Particle Swarm Optimization (QPSO)"

    res_health = client.get("/api/health")
    assert res_health.status_code == 200
    assert res_health.json()["status"] == "healthy"


def test_route_candidates_and_optimize():
    payload = {
        "origin": {"lat": 20.2685, "lng": 85.8360, "name": "Master Canteen"},
        "destination": {"lat": 20.3120, "lng": 85.8180, "name": "AIIMS Hospital"},
        "vehicle_type": "car",
        "preference": "balanced",
        "particle_count": 15,
        "max_iterations": 25,
        "beta": 0.75
    }

    # Test candidate generation
    res_cand = client.post("/api/routes/candidates", json=payload)
    assert res_cand.status_code == 200
    candidates = res_cand.json()
    assert len(candidates) >= 1

    # Test QPSO optimization
    res_opt = client.post("/api/routes/optimize", json=payload)
    assert res_opt.status_code == 200
    opt_data = res_opt.json()
    assert opt_data["algorithm"] == "QPSO"
    assert opt_data["distance_km"] > 0
    assert opt_data["eta_minutes"] > 0
    assert "explainability" in opt_data


def test_traffic_endpoints():
    res = client.get("/api/traffic")
    assert res.status_code == 200
    roads = res.json()
    assert len(roads) > 0

    # Test updating a segment
    update_payload = {
        "edge_id": "E1",
        "traffic_level": "high",
        "is_blocked": False
    }
    res_update = client.post("/api/traffic/update", json=update_payload)
    assert res_update.status_code == 200
    assert res_update.json()["status"] == "success"


def test_emergency_endpoints():
    res = client.get("/api/emergency/vehicles")
    assert res.status_code == 200
    vehicles = res.json()
    assert len(vehicles) >= 1

    # Test Give-Way proximity check
    give_way_payload = {
        "vehicle_id": vehicles[0]["id"],
        "alert_radius_meters": 1000.0
    }
    res_gw = client.post("/api/emergency/give-way", json=give_way_payload)
    assert res_gw.status_code == 200
    assert isinstance(res_gw.json(), list)
