"""
MARGSETU - Spatial Map Matcher
Matches raw GPS telemetry (lat, lng, heading) to the closest road segment polyline
in the transportation graph using cross-track orthogonal distance and bearing alignment.
"""
import math
from typing import Optional, Tuple, List, Dict, Any
from backend.app.routing.network_graph import haversine_distance, transport_graph, TransportationGraph


def calculate_bearing(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates compass initial bearing in degrees from point 1 to point 2 [0 - 360)."""
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_lambda = math.radians(lon2 - lon1)

    y = math.sin(delta_lambda) * math.cos(phi2)
    x = math.cos(phi1) * math.sin(phi2) - math.sin(phi1) * math.cos(phi2) * math.cos(delta_lambda)

    theta = math.atan2(y, x)
    return (math.degrees(theta) + 360.0) % 360.0


def point_to_segment_distance(
    p_lat: float, p_lng: float,
    a_lat: float, a_lng: float,
    b_lat: float, b_lng: float
) -> Tuple[float, float, float]:
    """
    Computes shortest distance (in meters) from point P to line segment AB.
    Returns: (distance_meters, proj_lat, proj_lng)
    """
    # Simple equirectangular projection approximation for local urban meters
    # 1 deg lat ~ 111,139 meters; 1 deg lng ~ 111,139 * cos(lat) meters
    mean_lat = math.radians((a_lat + b_lat + p_lat) / 3.0)
    kx = 111139.0 * math.cos(mean_lat)
    ky = 111139.0

    px, py = (p_lng - a_lng) * kx, (p_lat - a_lat) * ky
    bx, by = (b_lng - a_lng) * kx, (b_lat - a_lat) * ky

    seg_len_sq = bx * bx + by * by
    if seg_len_sq <= 1e-6:
        # A and B are identical
        dist = math.sqrt(px * px + py * py)
        return dist, a_lat, a_lng

    # Projection factor t clamped to [0, 1]
    t = max(0.0, min(1.0, (px * bx + py * by) / seg_len_sq))

    proj_x = t * bx
    proj_y = t * by
    dx = px - proj_x
    dy = py - proj_y
    dist_m = math.sqrt(dx * dx + dy * dy)

    proj_lat = a_lat + (proj_y / ky)
    proj_lng = a_lng + (proj_x / kx)
    return dist_m, proj_lat, proj_lng


class SpatialMapMatcher:
    def __init__(self, graph: Optional[TransportationGraph] = None):
        self.graph = graph or transport_graph

    def match_point(
        self,
        lat: float,
        lng: float,
        heading: Optional[float] = None,
        max_search_radius_m: float = 300.0
    ) -> Optional[Tuple[str, float]]:
        """
        Map-matches a GPS coordinate to the most likely road segment ID in the graph.
        Returns: (segment_id, distance_in_meters) or None if no segment is within range.
        """
        best_segment_id = None
        min_score = float("inf")

        for edge_id, edge in self.graph.edges_by_id.items():
            # Skip synthetic reverse edges for map matching ID consistency
            if edge_id.endswith("_rev"):
                continue

            coords = edge.coordinates
            if not coords or len(coords) < 2:
                # Use node positions as fallback
                u_node = self.graph.nodes.get(edge.u)
                v_node = self.graph.nodes.get(edge.v)
                if not u_node or not v_node:
                    continue
                coords = [[u_node["lat"], u_node["lng"]], [v_node["lat"], v_node["lng"]]]

            for i in range(len(coords) - 1):
                p1 = coords[i]
                p2 = coords[i + 1]

                dist_m, _, _ = point_to_segment_distance(
                    lat, lng,
                    p1[0], p1[1],
                    p2[0], p2[1]
                )

                if dist_m > max_search_radius_m:
                    continue

                # Heading alignment penalty/bonus
                heading_penalty = 0.0
                if heading is not None:
                    seg_bearing = calculate_bearing(p1[0], p1[1], p2[0], p2[1])
                    diff = abs(heading - seg_bearing)
                    if diff > 180:
                        diff = 360 - diff
                    # Also check reverse direction for bidirectional road
                    rev_diff = abs(heading - ((seg_bearing + 180) % 360))
                    if rev_diff > 180:
                        rev_diff = 360 - rev_diff
                    min_diff = min(diff, rev_diff)
                    # Penalize misalignment (> 45 deg)
                    heading_penalty = (min_diff / 45.0) * 15.0

                composite_score = dist_m + heading_penalty
                if composite_score < min_score:
                    min_score = composite_score
                    best_segment_id = edge.id

        if best_segment_id:
            return best_segment_id, round(min_score, 1)

        # Fallback: find nearest node's first outgoing edge
        nearest_node = self.graph.get_nearest_node(lat, lng)
        edges = self.graph.adjacency.get(nearest_node, [])
        if edges:
            first_edge = edges[0]
            clean_id = first_edge.id.replace("_rev", "")
            return clean_id, 999.0

        return "E1", 999.0


# Global singleton map matcher
map_matcher = SpatialMapMatcher(transport_graph)
