"""
MARGSETU - Standard Particle Swarm Optimization (PSO) Baseline
Classical PSO with velocity, inertia weight (w), and cognitive/social acceleration (c1, c2).
Used for side-by-side benchmarking against QPSO.
"""
import time
import numpy as np
from typing import List, Optional
from backend.app.database.models import (
    OptimizationRequest, OptimizationResult, RouteCandidate, OptimizationWeights, VehicleType
)
from backend.app.routing.network_graph import TransportationGraph
from backend.app.optimization.fitness import get_profile_weights, evaluate_route_fitness
from backend.app.optimization.route_encoding import RouteEncoderDecoder


class StandardPSORouteOptimizer:
    def __init__(self, graph: TransportationGraph):
        self.graph = graph
        self.encoder_decoder = RouteEncoderDecoder(graph)

    def optimize_route(
        self,
        request: OptimizationRequest,
        candidate_pool: Optional[List[RouteCandidate]] = None
    ) -> OptimizationResult:
        start_time = time.perf_counter()

        origin_node = self.graph.get_nearest_node(request.origin.lat, request.origin.lng)
        dest_node = self.graph.get_nearest_node(request.destination.lat, request.destination.lng)

        weights = get_profile_weights(
            preference=request.preference,
            vehicle_type=request.vehicle_type,
            custom=request.custom_weights
        )

        if candidate_pool is None or len(candidate_pool) == 0:
            candidate_pool = self.encoder_decoder.generate_candidate_paths(
                origin_node=origin_node,
                destination_node=dest_node,
                k=6,
                vehicle_type=request.vehicle_type,
                weights=weights,
                origin_point=request.origin,
                dest_point=request.destination
            )

        N = max(10, request.particle_count)
        D = len(candidate_pool)
        max_iter = max(20, request.max_iterations)

        # Classical PSO Hyperparameters
        w = 0.729       # Inertia weight
        c1 = 1.49445    # Cognitive coefficient
        c2 = 1.49445    # Social coefficient
        v_max = 2.0
        lb, ub = -3.0, 3.0

        # Positions and Velocities
        X = np.random.uniform(lb, ub, (N, D))
        V = np.random.uniform(-v_max, v_max, (N, D))

        pbest = np.copy(X)
        pbest_fitness = np.full(N, float("inf"))

        gbest = np.zeros(D)
        gbest_fitness = float("inf")
        gbest_candidate: Optional[RouteCandidate] = None

        convergence_history: List[float] = []

        # Initial evaluation
        for i in range(N):
            cand, is_valid = self.encoder_decoder.decode_particle_to_route(
                X[i], candidate_pool, request.vehicle_type
            )
            fitness = cand.composite_fitness if is_valid else (cand.composite_fitness + 5.0)
            pbest_fitness[i] = fitness
            if fitness < gbest_fitness:
                gbest_fitness = fitness
                gbest = np.copy(X[i])
                gbest_candidate = cand

        convergence_history.append(round(float(gbest_fitness), 4))

        # Iterative PSO Velocity & Position Evolution
        for _ in range(max_iter):
            for i in range(N):
                r1 = np.random.rand(D)
                r2 = np.random.rand(D)

                # Velocity update: v_i(t+1) = w*v_i(t) + c1*r1*(pbest_i - x_i) + c2*r2*(gbest - x_i)
                V[i] = w * V[i] + c1 * r1 * (pbest[i] - X[i]) + c2 * r2 * (gbest - X[i])
                V[i] = np.clip(V[i], -v_max, v_max)

                # Position update: x_i(t+1) = x_i(t) + v_i(t+1)
                X[i] = np.clip(X[i] + V[i], lb, ub)

                cand, is_valid = self.encoder_decoder.decode_particle_to_route(
                    X[i], candidate_pool, request.vehicle_type
                )
                fitness = cand.composite_fitness if is_valid else (cand.composite_fitness + 5.0)

                if fitness < pbest_fitness[i]:
                    pbest_fitness[i] = fitness
                    pbest[i] = np.copy(X[i])

                    if fitness < gbest_fitness:
                        gbest_fitness = fitness
                        gbest = np.copy(X[i])
                        gbest_candidate = cand

            convergence_history.append(round(float(gbest_fitness), 4))

        elapsed_ms = (time.perf_counter() - start_time) * 1000.0

        if gbest_candidate is None:
            gbest_candidate = candidate_pool[0]

        _, explanation = evaluate_route_fitness(
            travel_time_min=gbest_candidate.travel_time_min,
            congestion_score=gbest_candidate.traffic_score,
            distance_km=gbest_candidate.distance_km,
            risk_score=gbest_candidate.risk_score,
            blockage_score=gbest_candidate.blockage_score,
            weights=weights
        )

        return OptimizationResult(
            algorithm="Standard PSO",
            route_id=f"pso-{int(time.time()*1000)}",
            route_name=f"{gbest_candidate.name} (PSO Optimized)",
            origin=request.origin,
            destination=request.destination,
            distance_km=gbest_candidate.distance_km,
            eta_minutes=gbest_candidate.travel_time_min,
            fitness=round(gbest_fitness, 4),
            traffic_score=gbest_candidate.traffic_score,
            risk_score=gbest_candidate.risk_score,
            blockage_score=gbest_candidate.blockage_score,
            iterations=max_iter,
            computation_time_ms=round(elapsed_ms, 2),
            convergence_history=convergence_history,
            weights_used=weights,
            explainability=explanation,
            path_nodes=gbest_candidate.path_nodes,
            route_geometry=gbest_candidate.coordinates,
            candidate_alternatives=[c.model_dump() for c in candidate_pool],
            vehicle_type=request.vehicle_type,
            is_emergency=False
        )
