"""
Unit tests for discrete route encoding, candidate generation, and repair operator.
"""
import pytest
from backend.app.database.models import VehicleType, OptimizationWeights
from backend.app.routing.network_graph import transport_graph
from backend.app.optimization.route_encoding import RouteEncoderDecoder


def test_candidate_generation():
    encoder_decoder = RouteEncoderDecoder(transport_graph)
    candidates = encoder_decoder.generate_candidate_paths(
        origin_node="N1",
        destination_node="N10",
        k=4,
        vehicle_type=VehicleType.CAR
    )

    assert len(candidates) >= 1
    for c in candidates:
        assert c.path_nodes[0] == "N1"
        assert c.path_nodes[-1] == "N10"
        assert c.distance_km > 0.0
        assert c.travel_time_min > 0.0
        assert len(c.coordinates) >= 2


def test_repair_operator_on_blocked_road():
    encoder_decoder = RouteEncoderDecoder(transport_graph)
    # Generate candidates
    candidates = encoder_decoder.generate_candidate_paths(
        origin_node="N1",
        destination_node="N5",
        k=2,
        vehicle_type=VehicleType.CAR
    )
    assert len(candidates) >= 1

    candidate = candidates[0]
    # Artificially block an edge on the graph
    u, v = candidate.path_nodes[0], candidate.path_nodes[1]
    edge = encoder_decoder._find_edge(u, v)
    if edge:
        edge.is_blocked = True
        try:
            repaired_cand, was_repaired = encoder_decoder.repair_invalid_route(
                candidate, VehicleType.CAR
            )
            assert repaired_cand.path_nodes[0] == candidate.path_nodes[0]
            assert repaired_cand.path_nodes[-1] == candidate.path_nodes[-1]
        finally:
            edge.is_blocked = False  # Reset
