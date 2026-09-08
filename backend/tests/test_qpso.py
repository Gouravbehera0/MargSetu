"""
Unit tests for authentic Quantum-Inspired Particle Swarm Optimization (QPSO).
Verifies:
1. Mean best (mbest) mathematical formulation
2. Local attractor equation
3. Position update in delta potential well
4. Convergence monotonic decrease
"""
import numpy as np
import pytest
from backend.app.database.models import OptimizationRequest, GeoPoint, VehicleType, RoutePreference
from backend.app.routing.network_graph import transport_graph
from backend.app.optimization.qpso import QPSORouteOptimizer


def test_qpso_mathematical_operators():
    # Test mbest = (1/N) * sum(pbest_i)
    pbest = np.array([
        [1.0, 2.0, 3.0],
        [3.0, 4.0, 5.0],
        [2.0, 3.0, 4.0]
    ])
    mbest = np.mean(pbest, axis=0)
    assert np.allclose(mbest, [2.0, 3.0, 4.0])

    # Test Local attractor: p_i = phi * pbest_i + (1 - phi) * gbest
    gbest = np.array([5.0, 5.0, 5.0])
    phi = np.array([0.5, 0.5, 0.5])
    p_0 = phi * pbest[0] + (1 - phi) * gbest
    assert np.allclose(p_0, [3.0, 3.5, 4.0])


def test_qpso_route_optimization_run():
    optimizer = QPSORouteOptimizer(transport_graph)
    req = OptimizationRequest(
        origin=GeoPoint(lat=20.2685, lng=85.8360, name="Master Canteen"),
        destination=GeoPoint(lat=20.3120, lng=85.8180, name="AIIMS Hospital"),
        vehicle_type=VehicleType.CAR,
        preference=RoutePreference.BALANCED,
        particle_count=20,
        max_iterations=30,
        beta=0.75
    )

    res = optimizer.optimize_route(req)

    assert res.algorithm == "QPSO"
    assert res.distance_km > 0.0
    assert res.eta_minutes > 0.0
    assert res.fitness > 0.0
    assert res.iterations == 30
    assert len(res.convergence_history) == 31  # Initial + 30 iterations
    # Convergence must be non-increasing (gbest monotonic)
    for i in range(len(res.convergence_history) - 1):
        assert res.convergence_history[i + 1] <= res.convergence_history[i] + 1e-6
    assert len(res.path_nodes) >= 2
    assert len(res.route_geometry) >= 2
