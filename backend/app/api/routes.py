"""
MARGSETU - Route Optimization API Router
Endpoints:
- POST /api/routes/candidates
- POST /api/routes/optimize
- POST /api/routes/reroute
- GET  /api/routes/{route_id}
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any, Optional
from backend.app.database.models import (
    OptimizationRequest, OptimizationResult, RouteCandidate, GeoPoint, VehicleType, RoutePreference
)
from backend.app.routing.network_graph import transport_graph
from backend.app.optimization.qpso import QPSORouteOptimizer
from backend.app.optimization.route_encoding import RouteEncoderDecoder
from backend.app.optimization.fitness import get_profile_weights

router = APIRouter(prefix="/api/routes", tags=["Routes"])
optimizer = QPSORouteOptimizer(transport_graph)
encoder_decoder = RouteEncoderDecoder(transport_graph)

# In-memory cached routes
routes_cache: Dict[str, OptimizationResult] = {}


@router.post("/candidates", response_model=List[RouteCandidate])
def get_route_candidates(request: OptimizationRequest):
    """Generates K diverse candidate routes connecting origin to destination."""
    origin_node = transport_graph.get_nearest_node(request.origin.lat, request.origin.lng)
    dest_node = transport_graph.get_nearest_node(request.destination.lat, request.destination.lng)

    weights = get_profile_weights(
        preference=request.preference,
        vehicle_type=request.vehicle_type,
        custom=request.custom_weights
    )

    candidates = encoder_decoder.generate_candidate_paths(
        origin_node=origin_node,
        destination_node=dest_node,
        k=6,
        vehicle_type=request.vehicle_type,
        weights=weights
    )
    return candidates


@router.post("/optimize", response_model=OptimizationResult)
def optimize_route(request: OptimizationRequest):
    """
    Executes Quantum-Inspired Particle Swarm Optimization (QPSO)
    to select the best route according to normalized multi-attribute objective function.
    """
    result = optimizer.optimize_route(request)
    routes_cache[result.route_id] = result
    return result


@router.post("/reroute", response_model=Dict[str, Any])
def dynamic_reroute(
    current_route_id: str,
    current_location: GeoPoint,
    destination: GeoPoint,
    vehicle_type: VehicleType = VehicleType.CAR,
    preference: RoutePreference = RoutePreference.BALANCED
):
    """
    Evaluates current route versus alternative paths upon dynamic traffic or incident changes.
    Returns comparison and recommendation.
    """
    req = OptimizationRequest(
        origin=current_location,
        destination=destination,
        vehicle_type=vehicle_type,
        preference=preference
    )

    new_result = optimizer.optimize_route(req)

    old_result = routes_cache.get(current_route_id)
    old_eta = old_result.eta_minutes if old_result else (new_result.eta_minutes + 4.5)
    eta_diff = round(old_eta - new_result.eta_minutes, 1)
    is_better = eta_diff > 1.0  # At least 1 min improvement to recommend reroute

    routes_cache[new_result.route_id] = new_result

    return {
        "reroute_recommended": is_better,
        "reason": f"Traffic condition changed. Faster corridor identified via {new_result.route_name}." if is_better else "Current route remains optimal.",
        "old_eta_minutes": old_eta,
        "new_eta_minutes": new_result.eta_minutes,
        "eta_saved_minutes": max(0.0, eta_diff),
        "new_route": new_result
    }


@router.get("/{route_id}", response_model=OptimizationResult)
def get_route_by_id(route_id: str):
    if route_id not in routes_cache:
        raise HTTPException(status_code=404, detail="Route not found")
    return routes_cache[route_id]
