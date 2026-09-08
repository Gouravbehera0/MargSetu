"""
Unit tests for multi-factor fitness function and weight profiles.
"""
import pytest
from backend.app.database.models import OptimizationWeights, RoutePreference, VehicleType
from backend.app.optimization.fitness import get_profile_weights, evaluate_route_fitness


def test_weight_normalization():
    raw_weights = OptimizationWeights(
        w1_time=4.0, w2_congestion=2.5, w3_distance=2.0, w4_risk=1.0, w5_blockage=0.5
    )
    normalized = raw_weights.normalize()
    total = (
        normalized.w1_time + normalized.w2_congestion +
        normalized.w3_distance + normalized.w4_risk + normalized.w5_blockage
    )
    assert pytest.approx(total, 0.0001) == 1.0
    assert pytest.approx(normalized.w1_time, 0.0001) == 0.40


def test_profile_weights_preset():
    fastest_weights = get_profile_weights(RoutePreference.FASTEST)
    assert fastest_weights.w1_time >= 0.60

    safest_weights = get_profile_weights(RoutePreference.SAFEST)
    assert safest_weights.w4_risk >= 0.35

    emergency_weights = get_profile_weights(RoutePreference.EMERGENCY)
    assert emergency_weights.w1_time >= 0.55


def test_fitness_evaluation_and_explainability():
    weights = OptimizationWeights(
        w1_time=0.4, w2_congestion=0.25, w3_distance=0.2, w4_risk=0.1, w5_blockage=0.05
    )
    fitness, exp = evaluate_route_fitness(
        travel_time_min=15.0,
        congestion_score=0.4,
        distance_km=10.0,
        risk_score=0.1,
        blockage_score=0.0,
        weights=weights,
        max_time_ref=60.0,
        max_dist_ref=30.0
    )

    # Check bounds
    assert 0.0 <= fitness <= 1.0
    assert exp.time_contribution > 0.0
    assert exp.blockage_contribution == 0.0
    assert pytest.approx(exp.total_fitness, 0.001) == fitness
