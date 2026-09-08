"""
MARGSETU - Quantum-Inspired Particle Swarm Optimization (QPSO) Engine
"Quantum-Inspired Intelligent Traffic Route Optimization in Transportation Systems Using Metaheuristic Optimization."

Mathematical Formulation:
1. Mean Best Position:
   mbest = (1/N) * sum(pbest_i, i=1..N)

2. Local Attractor:
   p_{i,d} = phi_{i,d} * pbest_{i,d} + (1 - phi_{i,d}) * gbest_d
   where phi_{i,d} ~ U(0, 1)

3. Quantum Delta Potential Well Wavefunction State Update:
   x_{i,d}(t+1) = p_{i,d} +/- beta * |mbest_d - x_{i,d}(t)| * ln(1/u_{i,d})
   where u_{i,d} ~ U(0, 1), and the +/- sign is chosen randomly with probability 0.5.
   beta is the contraction-expansion coefficient controlling convergence speed.
"""
import time
import numpy as np
from typing import List, Dict, Tuple, Optional, Any
from backend.app.database.models import (
    OptimizationRequest, OptimizationResult, RouteCandidate, OptimizationWeights,
    VehicleType, RoutePreference
)
from backend.app.routing.network_graph import TransportationGraph, haversine_distance
from backend.app.optimization.fitness import get_profile_weights, evaluate_route_fitness
from backend.app.optimization.route_encoding import RouteEncoderDecoder


class QPSORouteOptimizer:
    def __init__(self, graph: TransportationGraph):
        self.graph = graph
        self.encoder_decoder = RouteEncoderDecoder(graph)

    def optimize_route(
        self,
        request: OptimizationRequest,
        candidate_pool: Optional[List[RouteCandidate]] = None
    ) -> OptimizationResult:
        """
        Executes Quantum-Inspired Particle Swarm Optimization to find the optimal route.
        """
        start_time = time.perf_counter()

        # Step 1: Resolve origin and destination graph nodes
        origin_node = self.graph.get_nearest_node(request.origin.lat, request.origin.lng)
        dest_node = self.graph.get_nearest_node(request.destination.lat, request.destination.lng)

        weights = get_profile_weights(
            preference=request.preference,
            vehicle_type=request.vehicle_type,
            custom=request.custom_weights
        )

        # Step 2: Generate or use candidate routes
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

        if not candidate_pool:
            # Fallback direct path
            candidate_pool = [self._create_emergency_fallback(origin_node, dest_node, request.vehicle_type, weights)]

        # Step 3: Initialize QPSO Swarm
        N = max(10, request.particle_count)      # Swarm size (Number of particles)
        D = len(candidate_pool)                  # Problem dimensionality (number of candidate paths)
        max_iter = max(20, request.max_iterations)
        initial_beta = request.beta if request.beta > 0 else 0.75

        # Position bounds for continuous route decision logits [-3.0, 3.0]
        lb, ub = -3.0, 3.0

        # Particle positions: X shape (N, D)
        X = np.random.uniform(lb, ub, (N, D))

        # Personal best positions (pbest) and personal best fitness
        pbest = np.copy(X)
        pbest_fitness = np.full(N, float("inf"))

        # Global best (gbest)
        gbest = np.zeros(D)
        gbest_fitness = float("inf")
        gbest_candidate: Optional[RouteCandidate] = None

        # Convergence history for monitoring & charting
        convergence_history: List[float] = []

        # Initial evaluation
        for i in range(N):
            candidate, is_valid = self.encoder_decoder.decode_particle_to_route(
                X[i], candidate_pool, request.vehicle_type
            )
            fitness = candidate.composite_fitness if is_valid else (candidate.composite_fitness + 5.0)

            pbest_fitness[i] = fitness
            if fitness < gbest_fitness:
                gbest_fitness = fitness
                gbest = np.copy(X[i])
                gbest_candidate = candidate

        convergence_history.append(round(float(gbest_fitness), 4))

        # Step 4: Iterative QPSO Evolution Loop
        for t in range(max_iter):
            # Dynamic contraction-expansion coefficient schedule (linearly decreases to promote exploration then exploitation)
            beta = initial_beta - (initial_beta - 0.5) * (t / max_iter)

            # 4.1 Compute Mean Best: mbest = (1/N) * sum(pbest_i)
            mbest = np.mean(pbest, axis=0)

            # 4.2 Update each particle according to Quantum Delta Potential mechanics
            for i in range(N):
                # Random vectors phi and u in (0, 1)
                phi = np.random.uniform(0.0001, 0.9999, D)
                u = np.random.uniform(0.0001, 0.9999, D)

                # Local attractor: p_i = phi * pbest_i + (1 - phi) * gbest
                p_i = phi * pbest[i] + (1.0 - phi) * gbest

                # Random +/- signs with 50% probability
                signs = np.where(np.random.rand(D) < 0.5, 1.0, -1.0)

                # QPSO Position Update Equation:
                # x_{i,d}(t+1) = p_{i,d} +/- beta * |mbest_d - x_{i,d}(t)| * ln(1/u)
                X[i] = p_i + signs * beta * np.abs(mbest - X[i]) * np.log(1.0 / u)

                # Clamp within search boundaries
                X[i] = np.clip(X[i], lb, ub)

                # 4.3 Evaluate updated fitness
                candidate, is_valid = self.encoder_decoder.decode_particle_to_route(
                    X[i], candidate_pool, request.vehicle_type
                )
                fitness = candidate.composite_fitness if is_valid else (candidate.composite_fitness + 5.0)

                # Update Personal Best (pbest)
                if fitness < pbest_fitness[i]:
                    pbest_fitness[i] = fitness
                    pbest[i] = np.copy(X[i])

                    # Update Global Best (gbest)
                    if fitness < gbest_fitness:
                        gbest_fitness = fitness
                        gbest = np.copy(X[i])
                        gbest_candidate = candidate

            convergence_history.append(round(float(gbest_fitness), 4))

        elapsed_ms = (time.perf_counter() - start_time) * 1000.0

        # Step 5: Format final optimal route & explainability
        if gbest_candidate is None:
            gbest_candidate = candidate_pool[0]

        # Ensure gbest_candidate is at index 0 of candidate_pool so candidate[0] is strictly the optimal route
        ordered_candidates = [gbest_candidate]
        for c in candidate_pool:
            if c.id != gbest_candidate.id:
                ordered_candidates.append(c)

        _, explanation = evaluate_route_fitness(
            travel_time_min=gbest_candidate.travel_time_min,
            congestion_score=gbest_candidate.traffic_score,
            distance_km=gbest_candidate.distance_km,
            risk_score=gbest_candidate.risk_score,
            blockage_score=gbest_candidate.blockage_score,
            weights=weights
        )

        is_emergency = request.vehicle_type in [VehicleType.AMBULANCE, VehicleType.FIRE, VehicleType.POLICE]

        return OptimizationResult(
            algorithm="QPSO",
            route_id=f"qpso-{int(time.time()*1000)}",
            route_name=f"{gbest_candidate.name} (QPSO Optimized)",
            origin=request.origin,
            destination=request.destination,
            distance_km=gbest_candidate.distance_km,
            eta_minutes=gbest_candidate.travel_time_min,
            fitness=round(gbest_candidate.composite_fitness, 4),
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
            candidate_alternatives=[c.model_dump() for c in ordered_candidates],
            vehicle_type=request.vehicle_type,
            is_emergency=is_emergency
        )

    def _create_emergency_fallback(
        self,
        origin_node: str,
        dest_node: str,
        vehicle_type: VehicleType,
        weights: OptimizationWeights
    ) -> RouteCandidate:
        """Fallback candidate if no pre-generated paths exist."""
        path = [origin_node, dest_node]
        return self.encoder_decoder.build_candidate_from_path(
            path=path,
            candidate_id="fallback-1",
            name="Emergency Direct Arterial",
            vehicle_type=vehicle_type,
            weights=weights
        )
