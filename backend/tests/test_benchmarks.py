"""
Unit tests for comparative algorithm benchmarking.
Compares Dijkstra, A*, Standard PSO, and QPSO on identical road conditions.
"""
import pytest
from backend.app.database.models import BenchmarkRequest, GeoPoint, VehicleType, TrafficLevel
from backend.app.api.benchmark import run_benchmark


def test_benchmarks_all_four_algorithms():
    req = BenchmarkRequest(
        origin=GeoPoint(lat=20.2685, lng=85.8360, name="Master Canteen"),
        destination=GeoPoint(lat=20.3120, lng=85.8180, name="AIIMS Hospital"),
        vehicle_type=VehicleType.CAR,
        particle_count=15,
        iterations=25,
        traffic_condition=TrafficLevel.MEDIUM
    )

    results = run_benchmark(req)

    assert len(results) == 4
    algo_names = [r.algorithm for r in results]
    assert "Dijkstra" in algo_names
    assert "A*" in algo_names
    assert "Standard PSO" in algo_names
    assert any("QPSO" in name for name in algo_names)

    for item in results:
        assert item.distance_km > 0.0
        assert item.travel_time_min > 0.0
        assert item.computation_time_ms >= 0.0
        assert item.fitness > 0.0
        assert item.route_valid is True
        assert len(item.path) >= 2
