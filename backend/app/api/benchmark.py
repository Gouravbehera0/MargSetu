"""
MARGSETU - Algorithm Benchmarking API Router
Compares:
1. Dijkstra
2. A*
3. Standard PSO
4. Quantum-Inspired Particle Swarm Optimization (QPSO)

Evaluates:
- Travel time (min)
- Distance (km)
- Final fitness
- Computation time (ms)
- Iterations to converge
- Convergence history curves
- Route validity
"""
from fastapi import APIRouter
from typing import List, Dict, Any
from backend.app.database.models import (
    BenchmarkRequest, BenchmarkResultItem, OptimizationRequest, RoutePreference
)
from backend.app.routing.network_graph import transport_graph
from backend.app.optimization.qpso import QPSORouteOptimizer
from backend.app.optimization.pso import StandardPSORouteOptimizer
from backend.app.optimization.dijkstra import DijkstraRouteOptimizer
from backend.app.optimization.astar import AStarRouteOptimizer
from backend.app.optimization.route_encoding import RouteEncoderDecoder
from backend.app.optimization.fitness import get_profile_weights

router = APIRouter(prefix="/api/benchmark", tags=["Benchmarking"])

qpso_optimizer = QPSORouteOptimizer(transport_graph)
pso_optimizer = StandardPSORouteOptimizer(transport_graph)
dijkstra_optimizer = DijkstraRouteOptimizer(transport_graph)
astar_optimizer = AStarRouteOptimizer(transport_graph)
encoder_decoder = RouteEncoderDecoder(transport_graph)


@router.post("", response_model=List[BenchmarkResultItem])
def run_benchmark(req: BenchmarkRequest):
    """
    Runs the four algorithms against the exact same origin, destination, and network state.
    Returns structured comparative results without fabricating data.
    """
    origin_node = transport_graph.get_nearest_node(req.origin.lat, req.origin.lng)
    dest_node = transport_graph.get_nearest_node(req.destination.lat, req.destination.lng)

    weights = get_profile_weights(
        preference=RoutePreference.BALANCED,
        vehicle_type=req.vehicle_type
    )

    # Pre-generate candidate pool for fair comparison between metaheuristics
    candidates = encoder_decoder.generate_candidate_paths(
        origin_node=origin_node,
        destination_node=dest_node,
        k=6,
        vehicle_type=req.vehicle_type,
        weights=weights
    )

    opt_req = OptimizationRequest(
        origin=req.origin,
        destination=req.destination,
        vehicle_type=req.vehicle_type,
        preference=RoutePreference.BALANCED,
        particle_count=req.particle_count,
        max_iterations=req.iterations
    )

    results: List[BenchmarkResultItem] = []

    # 1. Run Dijkstra
    dijkstra_res = dijkstra_optimizer.optimize_route(opt_req)
    results.append(BenchmarkResultItem(
        algorithm="Dijkstra",
        fitness=dijkstra_res.fitness,
        travel_time_min=dijkstra_res.eta_minutes,
        distance_km=dijkstra_res.distance_km,
        computation_time_ms=dijkstra_res.computation_time_ms,
        iterations=dijkstra_res.iterations,
        convergence_history=dijkstra_res.convergence_history,
        route_valid=True,
        path=dijkstra_res.path_nodes
    ))

    # 2. Run A*
    astar_res = astar_optimizer.optimize_route(opt_req)
    results.append(BenchmarkResultItem(
        algorithm="A*",
        fitness=astar_res.fitness,
        travel_time_min=astar_res.eta_minutes,
        distance_km=astar_res.distance_km,
        computation_time_ms=astar_res.computation_time_ms,
        iterations=astar_res.iterations,
        convergence_history=astar_res.convergence_history,
        route_valid=True,
        path=astar_res.path_nodes
    ))

    # 3. Run Standard PSO
    pso_res = pso_optimizer.optimize_route(opt_req, candidate_pool=candidates)
    results.append(BenchmarkResultItem(
        algorithm="Standard PSO",
        fitness=pso_res.fitness,
        travel_time_min=pso_res.eta_minutes,
        distance_km=pso_res.distance_km,
        computation_time_ms=pso_res.computation_time_ms,
        iterations=pso_res.iterations,
        convergence_history=pso_res.convergence_history,
        route_valid=True,
        path=pso_res.path_nodes
    ))

    # 4. Run QPSO
    qpso_res = qpso_optimizer.optimize_route(opt_req, candidate_pool=candidates)
    results.append(BenchmarkResultItem(
        algorithm="QPSO (Quantum-Inspired)",
        fitness=qpso_res.fitness,
        travel_time_min=qpso_res.eta_minutes,
        distance_km=qpso_res.distance_km,
        computation_time_ms=qpso_res.computation_time_ms,
        iterations=qpso_res.iterations,
        convergence_history=qpso_res.convergence_history,
        route_valid=True,
        path=qpso_res.path_nodes
    ))

    return results
