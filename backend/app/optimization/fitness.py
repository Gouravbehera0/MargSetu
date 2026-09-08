"""
MARGSETU - Multi-Objective Fitness Evaluation
Normalized objective function: F = w1*T + w2*C + w3*D + w4*R + w5*B
Provides profile weights, normalization, and explainability breakdowns.
"""
from typing import Dict, List, Tuple
from backend.app.database.models import (
    OptimizationWeights, RoutePreference, VehicleType, FitnessExplanation
)

# Preset weights for different route preferences
PROFILE_WEIGHTS: Dict[RoutePreference, OptimizationWeights] = {
    RoutePreference.BALANCED: OptimizationWeights(
        w1_time=0.40, w2_congestion=0.25, w3_distance=0.20, w4_risk=0.10, w5_blockage=0.05
    ),
    RoutePreference.FASTEST: OptimizationWeights(
        w1_time=0.65, w2_congestion=0.20, w3_distance=0.10, w4_risk=0.03, w5_blockage=0.02
    ),
    RoutePreference.SHORTEST: OptimizationWeights(
        w1_time=0.15, w2_congestion=0.10, w3_distance=0.65, w4_risk=0.05, w5_blockage=0.05
    ),
    RoutePreference.SAFEST: OptimizationWeights(
        w1_time=0.25, w2_congestion=0.15, w3_distance=0.15, w4_risk=0.40, w5_blockage=0.05
    ),
    RoutePreference.LOW_TRAFFIC: OptimizationWeights(
        w1_time=0.20, w2_congestion=0.50, w3_distance=0.15, w4_risk=0.10, w5_blockage=0.05
    ),
    RoutePreference.ECO: OptimizationWeights(
        w1_time=0.20, w2_congestion=0.30, w3_distance=0.35, w4_risk=0.10, w5_blockage=0.05
    ),
    RoutePreference.EMERGENCY: OptimizationWeights(
        w1_time=0.60, w2_congestion=0.20, w3_distance=0.05, w4_risk=0.10, w5_blockage=0.05
    )
}

# Vehicle specific overrides (if not explicitly overridden by preference)
VEHICLE_DEFAULT_PREFERENCES: Dict[VehicleType, RoutePreference] = {
    VehicleType.CAR: RoutePreference.BALANCED,
    VehicleType.BIKE: RoutePreference.FASTEST,
    VehicleType.BUS: RoutePreference.LOW_TRAFFIC,
    VehicleType.TRUCK: RoutePreference.SAFEST,
    VehicleType.TAXI: RoutePreference.FASTEST,
    VehicleType.DELIVERY: RoutePreference.FASTEST,
    VehicleType.AMBULANCE: RoutePreference.EMERGENCY,
    VehicleType.FIRE: RoutePreference.EMERGENCY,
    VehicleType.POLICE: RoutePreference.EMERGENCY,
}


def get_profile_weights(
    preference: RoutePreference = RoutePreference.BALANCED,
    vehicle_type: Optional[VehicleType] = None,
    custom: Optional[OptimizationWeights] = None
) -> OptimizationWeights:
    """Returns normalized optimization weights based on preference or vehicle type."""
    if custom is not None:
        return custom.normalize()

    # Emergency vehicles always default to emergency weights unless user customized
    if vehicle_type in [VehicleType.AMBULANCE, VehicleType.FIRE, VehicleType.POLICE]:
        return PROFILE_WEIGHTS[RoutePreference.EMERGENCY].normalize()

    if preference in PROFILE_WEIGHTS:
        return PROFILE_WEIGHTS[preference].normalize()

    return PROFILE_WEIGHTS[RoutePreference.BALANCED].normalize()


def evaluate_route_fitness(
    travel_time_min: float,
    congestion_score: float,
    distance_km: float,
    risk_score: float,
    blockage_score: float,
    weights: OptimizationWeights,
    max_time_ref: float = 60.0,
    max_dist_ref: float = 30.0
) -> Tuple[float, FitnessExplanation]:
    """
    Evaluates multi-factor fitness:
    F = w1*T + w2*C + w3*D + w4*R + w5*B

    Factors are strictly normalized in [0, 1]:
    - T: travel time normalized against reference trip maximum (clamped to 1.0)
    - C: congestion score (already in [0, 1])
    - D: distance normalized against reference trip maximum (clamped to 1.0)
    - R: risk score (already in [0, 1])
    - B: blockage penalty (0.0 if clear, 1.0 if closed/blocked)

    Returns (composite_fitness, FitnessExplanation)
    """
    T_norm = min(1.0, max(0.0, travel_time_min / max(1.0, max_time_ref)))
    C_norm = min(1.0, max(0.0, congestion_score))
    D_norm = min(1.0, max(0.0, distance_km / max(1.0, max_dist_ref)))
    R_norm = min(1.0, max(0.0, risk_score))
    B_norm = min(1.0, max(0.0, blockage_score))

    # Calculate weighted contributions
    c_time = weights.w1_time * T_norm
    c_cong = weights.w2_congestion * C_norm
    c_dist = weights.w3_distance * D_norm
    c_risk = weights.w4_risk * R_norm
    c_blk = weights.w5_blockage * B_norm

    total_fitness = c_time + c_cong + c_dist + c_risk + c_blk

    explanation = FitnessExplanation(
        time_contribution=round(c_time, 4),
        congestion_contribution=round(c_cong, 4),
        distance_contribution=round(c_dist, 4),
        risk_contribution=round(c_risk, 4),
        blockage_contribution=round(c_blk, 4),
        total_fitness=round(total_fitness, 4),
        explanation_text=(
            f"Evaluated with weights [Time: {weights.w1_time:.2f}, Congestion: {weights.w2_congestion:.2f}, "
            f"Distance: {weights.w3_distance:.2f}, Risk: {weights.w4_risk:.2f}, Blockage: {weights.w5_blockage:.2f}]. "
            f"Total fitness score = {total_fitness:.4f} (Lower is better)."
        )
    )

    return total_fitness, explanation
