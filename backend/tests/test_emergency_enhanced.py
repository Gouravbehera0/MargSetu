"""
Unit tests for Enhanced Emergency Vehicle Alert System
Tests:
- Bearing & Heading calculation (0-360 degrees, compass)
- Polyline distance & corridor snapping
- Approaching status and relevance filtering for nearby users
- Live ambulance telemetry step progression
- API endpoints for active ambulance and movement stepping
"""
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.emergency.give_way import (
    calculate_bearing, bearing_to_compass, point_to_segment_distance_km,
    min_distance_to_polyline_km, emergency_engine
)
from backend.app.database.db import vehicles_db

client = TestClient(app)


def test_bearing_calculations():
    # Due North: lat increases, lng constant
    b_north = calculate_bearing(20.0, 85.0, 21.0, 85.0)
    assert 0.0 <= b_north <= 2.0 or b_north >= 358.0
    assert bearing_to_compass(b_north) == "North"

    # Due East: lat constant, lng increases
    b_east = calculate_bearing(20.0, 85.0, 20.0, 86.0)
    assert 88.0 <= b_east <= 92.0
    assert bearing_to_compass(b_east) == "East"

    # Due South: lat decreases
    b_south = calculate_bearing(20.0, 85.0, 19.0, 85.0)
    assert 178.0 <= b_south <= 182.0
    assert bearing_to_compass(b_south) == "South"

    # Due West: lng decreases
    b_west = calculate_bearing(20.0, 85.0, 20.0, 84.0)
    assert 268.0 <= b_west <= 272.0
    assert bearing_to_compass(b_west) == "West"


def test_polyline_corridor_distance():
    polyline = [
        [20.2720, 85.8280],
        [20.2810, 85.8250],
        [20.2950, 85.8210]
    ]
    # Point directly on line
    d_on = min_distance_to_polyline_km(20.2810, 85.8250, polyline)
    assert d_on < 0.01  # less than 10 meters

    # Point slightly offset
    d_offset = min_distance_to_polyline_km(20.2815, 85.8260, polyline)
    assert 0.01 < d_offset < 0.5  # within 500m

    # Point very far away
    d_far = min_distance_to_polyline_km(20.5000, 86.0000, polyline)
    assert d_far > 10.0


def test_active_ambulance_alert_relevance():
    amb = vehicles_db["ev-1"]
    amb.current_step_index = 0
    amb.current_location.lat = amb.active_route_geometry[0][0]
    amb.current_location.lng = amb.active_route_geometry[0][1]

    # User nearby along the forward corridor: near AG square (20.2740, 85.8300)
    alert_near = emergency_engine.check_active_ambulance_alert_for_user(
        ambulance=amb,
        user_lat=20.2740,
        user_lng=85.8300,
        alert_radius_meters=1000.0
    )
    assert alert_near.has_active_ambulance is True
    assert alert_near.is_relevant_to_user is True
    assert alert_near.vehicle_code == "AMB-108"
    assert alert_near.distance_meters > 0
    assert alert_near.eta_seconds > 0
    assert len(alert_near.active_route_geometry) >= 2
    assert alert_near.heading_degrees >= 0.0

    # User very far away (15 km north-east)
    alert_far = emergency_engine.check_active_ambulance_alert_for_user(
        ambulance=amb,
        user_lat=20.4500,
        user_lng=85.9500,
        alert_radius_meters=1000.0
    )
    assert alert_far.has_active_ambulance is True
    assert alert_far.is_relevant_to_user is False


def test_step_ambulance_simulation():
    amb = vehicles_db["ev-1"]
    amb.current_step_index = 0
    init_loc = (amb.current_location.lat, amb.current_location.lng)

    updated = emergency_engine.step_vehicle_movement(amb)
    assert updated.current_step_index == 1
    new_loc = (updated.current_location.lat, updated.current_location.lng)
    assert new_loc != init_loc
    assert updated.heading_degrees >= 0.0


def test_emergency_api_active_ambulance():
    res = client.get("/api/emergency/active-ambulance?user_lat=20.2740&user_lng=85.8300&alert_radius_meters=1000")
    assert res.status_code == 200
    data = res.json()
    assert data["has_active_ambulance"] is True
    assert data["is_relevant_to_user"] is True
    assert data["vehicle_code"] == "AMB-108"
    assert "active_route_geometry" in data
    assert "heading_degrees" in data
    assert "heading_direction" in data
    assert "eta_seconds" in data
    assert "give_way_action" in data


def test_emergency_api_step_endpoint():
    res = client.post("/api/emergency/step", json={"vehicle_id": "ev-1"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["vehicle_id"] == "ev-1"
    assert "heading_degrees" in data
    assert "current_location" in data
