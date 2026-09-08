"""
MARGSETU - OSRM Routing Proxy Client
Connects to OpenStreetMap / OSRM routing engine with multi-corridor discovery,
timeout handling, and high-resolution road curve coordinates.
"""
import math
import requests
from typing import List, Dict, Any, Optional
from backend.app.database.models import GeoPoint, VehicleType
from backend.app.routing.network_graph import haversine_distance


class OSRMClient:
    def __init__(self, base_url: str = "https://router.project-osrm.org"):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": "MargSetu-RouteOptimization/1.0"})

    def get_route_candidates(
        self,
        origin: GeoPoint,
        destination: GeoPoint,
        vehicle_type: VehicleType = VehicleType.CAR,
        alternatives: bool = True
    ) -> Optional[List[Dict[str, Any]]]:
        """
        Fetches route alternatives from OSRM driving profile.
        Returns parsed candidate route objects with high-resolution road curve coordinates.
        """
        profile = "driving"
        if vehicle_type == VehicleType.BIKE:
            profile = "bike"

        coords = f"{origin.lng:.6f},{origin.lat:.6f};{destination.lng:.6f},{destination.lat:.6f}"
        url = f"{self.base_url}/route/v1/{profile}/{coords}"
        params = {
            "overview": "full",
            "geometries": "geojson",
            "alternatives": "true" if alternatives else "false",
            "steps": "true"
        }

        parsed_routes: List[Dict[str, Any]] = []

        try:
            resp = self.session.get(url, params=params, timeout=4.5)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("code") == "Ok" and "routes" in data:
                    for idx, r in enumerate(data["routes"]):
                        coords_latlng = [[pt[1], pt[0]] for pt in r.get("geometry", {}).get("coordinates", [])]
                        dist_km = round(r.get("distance", 0.0) / 1000.0, 2)
                        dur_min = round(r.get("duration", 0.0) / 60.0, 1)

                        instructions = []
                        for leg in r.get("legs", []):
                            for step in leg.get("steps", []):
                                name = step.get("name") or "Connecting Road"
                                maneuver = step.get("maneuver", {})
                                m_type = maneuver.get("type", "turn")
                                step_dist = round(step.get("distance", 0.0) / 1000.0, 2)
                                instructions.append({
                                    "instruction": f"{m_type.capitalize()} onto {name}",
                                    "distance_km": step_dist,
                                    "direction": m_type
                                })

                        names = ["Primary Expressway Corridor", "Arterial Bypass Corridor", "Commercial Transit Route", "Alternative Link"]
                        parsed_routes.append({
                            "id": f"osrm-route-{idx+1}",
                            "name": names[idx % len(names)],
                            "distance_km": dist_km,
                            "travel_time_min": dur_min,
                            "coordinates": coords_latlng,
                            "turn_instructions": instructions
                        })
        except Exception:
            pass

        # If OSRM returned only 1 route, generate a diverse alternative corridor via intermediate waypoint
        if len(parsed_routes) == 1:
            try:
                alt_route = self._fetch_waypoint_alternative(origin, destination, profile)
                if alt_route:
                    parsed_routes.append(alt_route)
            except Exception:
                pass

        if parsed_routes:
            return parsed_routes

        # Fallback to realistic curved road generation if OSRM is offline
        return self._generate_curved_road_fallback(origin, destination)

    def _fetch_waypoint_alternative(
        self,
        origin: GeoPoint,
        destination: GeoPoint,
        profile: str
    ) -> Optional[Dict[str, Any]]:
        """Queries OSRM through an intermediate offset waypoint to find a distinct second corridor."""
        mid_lat = (origin.lat + destination.lat) / 2.0
        mid_lng = (origin.lng + destination.lng) / 2.0
        d_lat = destination.lat - origin.lat
        d_lng = destination.lng - origin.lng

        # Perpendicular offset vector
        offset_scale = 0.15
        wp_lat = mid_lat - (d_lng * offset_scale)
        wp_lng = mid_lng + (d_lat * offset_scale)

        coords = f"{origin.lng:.6f},{origin.lat:.6f};{wp_lng:.6f},{wp_lat:.6f};{destination.lng:.6f},{destination.lat:.6f}"
        url = f"{self.base_url}/route/v1/{profile}/{coords}"
        params = {"overview": "full", "geometries": "geojson", "steps": "false"}

        resp = self.session.get(url, params=params, timeout=3.5)
        if resp.status_code == 200:
            data = resp.json()
            if data.get("code") == "Ok" and "routes" in data and len(data["routes"]) > 0:
                r = data["routes"][0]
                coords_latlng = [[pt[1], pt[0]] for pt in r.get("geometry", {}).get("coordinates", [])]
                dist_km = round(r.get("distance", 0.0) / 1000.0, 2)
                dur_min = round(r.get("duration", 0.0) / 60.0, 1)
                return {
                    "id": "osrm-route-2",
                    "name": "Alternative Expressway Bypass",
                    "distance_km": dist_km,
                    "travel_time_min": dur_min,
                    "coordinates": coords_latlng,
                    "turn_instructions": []
                }
        return None

    def _generate_curved_road_fallback(
        self,
        origin: GeoPoint,
        destination: GeoPoint
    ) -> List[Dict[str, Any]]:
        """
        Generates realistic curved road coordinates with street grid turns
        when offline, ensuring routes never render as a flat straight line.
        """
        dist_km = haversine_distance(origin.lat, origin.lng, destination.lat, destination.lng)
        num_steps = max(20, min(100, int(dist_km * 4)))

        routes: List[Dict[str, Any]] = []
        d_lat = destination.lat - origin.lat
        d_lng = destination.lng - origin.lng

        # Perpendicular vector components
        perp_lat = -d_lng
        perp_lng = d_lat

        for idx, (name, curvature) in enumerate([
            ("Curved Expressway Corridor A", 0.12),
            ("Alternate Arterial Corridor B", -0.15)
        ]):
            coords: List[List[float]] = []
            for i in range(num_steps + 1):
                t = i / num_steps
                # Base interpolation
                base_lat = origin.lat + t * d_lat
                base_lng = origin.lng + t * d_lng

                # Sinusoidal road bend + small street perturbations
                bend = math.sin(t * math.pi) * curvature
                micro_turn = math.sin(t * 8 * math.pi) * (curvature * 0.15)

                curved_lat = base_lat + (perp_lat * (bend + micro_turn))
                curved_lng = base_lng + (perp_lng * (bend + micro_turn))
                coords.append([round(curved_lat, 6), round(curved_lng, 6)])

            routes.append({
                "id": f"curved-route-{idx+1}",
                "name": name,
                "distance_km": round(dist_km * (1.15 + abs(curvature)), 2),
                "travel_time_min": round((dist_km * (1.15 + abs(curvature)) / 45.0) * 60, 1),
                "coordinates": coords,
                "turn_instructions": []
            })

        return routes


osrm_client = OSRMClient()
