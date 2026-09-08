"""
MARGSETU - Emergency Priority & Citizen Give-Way Alert Engine
Calculates spatial proximity between emergency vehicles and citizens along active corridors,
sharing live route geometry, heading/bearing direction, distance, and ETA with relevant nearby users.
"""
import math
import uuid
from typing import List, Dict, Optional, Any
from backend.app.database.models import (
    VehicleType, CitizenGiveWayAlert, GeoPoint, EmergencyVehicle, ActiveAmbulanceAlertResponse
)
from backend.app.routing.network_graph import haversine_distance


def calculate_bearing(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculates forward azimuth / bearing in degrees (0 - 360) from pt1 to pt2."""
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    d_lng_rad = math.radians(lng2 - lng1)

    y = math.sin(d_lng_rad) * math.cos(lat2_rad)
    x = math.cos(lat1_rad) * math.sin(lat2_rad) - math.sin(lat1_rad) * math.cos(lat2_rad) * math.cos(d_lng_rad)
    bearing = math.atan2(y, x)
    bearing_deg = (math.degrees(bearing) + 360.0) % 360.0
    return round(bearing_deg, 1)


def bearing_to_compass(bearing: float) -> str:
    """Converts degrees (0 - 360) to 8-point compass cardinal direction."""
    directions = ["North", "North-East", "East", "South-East", "South", "South-West", "West", "North-West"]
    idx = int(((bearing + 22.5) % 360) / 45.0)
    return directions[idx]


def point_to_segment_distance_km(p_lat: float, p_lng: float, a_lat: float, a_lng: float, b_lat: float, b_lng: float) -> float:
    """Computes minimum Haversine distance in km from point P to line segment A-B."""
    # Projection onto segment in flat local approximation for short distances
    dx = b_lng - a_lng
    dy = b_lat - a_lat
    if dx == 0 and dy == 0:
        return haversine_distance(p_lat, p_lng, a_lat, a_lng)

    t = ((p_lng - a_lng) * dx + (p_lat - a_lat) * dy) / (dx * dx + dy * dy)
    t = max(0.0, min(1.0, t))
    proj_lat = a_lat + t * dy
    proj_lng = a_lng + t * dx
    return haversine_distance(p_lat, p_lng, proj_lat, proj_lng)


def min_distance_to_polyline_km(lat: float, lng: float, polyline: List[List[float]]) -> float:
    """Calculates the minimum distance in km from a coordinate to any segment of a polyline."""
    if not polyline:
        return 9999.0
    if len(polyline) == 1:
        return haversine_distance(lat, lng, polyline[0][0], polyline[0][1])

    min_d = 9999.0
    for i in range(len(polyline) - 1):
        d = point_to_segment_distance_km(
            lat, lng,
            polyline[i][0], polyline[i][1],
            polyline[i + 1][0], polyline[i + 1][1]
        )
        if d < min_d:
            min_d = d
    return min_d


class EmergencyGiveWayEngine:
    ALERT_MESSAGES = {
        VehicleType.AMBULANCE: "🚑 Emergency ambulance approaching. Please give way immediately.",
        VehicleType.FIRE: "🚒 Fire emergency vehicle approaching. Please pull over and give way.",
        VehicleType.POLICE: "🚓 Police emergency vehicle approaching. Please clear the route."
    }

    def __init__(self):
        # Active registered citizens locations (opt-in)
        self.active_citizens: Dict[str, GeoPoint] = {
            "cit-1": GeoPoint(lat=20.2740, lng=85.8300, name="Citizen A (AG Square)"),
            "cit-2": GeoPoint(lat=20.2830, lng=85.8240, name="Citizen B (Secretariat)"),
            "cit-3": GeoPoint(lat=20.2980, lng=85.8420, name="Citizen C (Vani Vihar)"),
            "cit-4": GeoPoint(lat=20.3080, lng=85.8210, name="Citizen D (Jayadev North)")
        }

    def register_citizen_location(self, citizen_id: str, point: GeoPoint):
        self.active_citizens[citizen_id] = point

    def compute_vehicle_heading(self, vehicle: EmergencyVehicle) -> float:
        """Determines heading degrees along the active corridor geometry."""
        geom = vehicle.active_route_geometry
        if not geom or len(geom) < 2:
            return vehicle.heading_degrees or 0.0

        step = min(vehicle.current_step_index, len(geom) - 2)
        p1 = geom[step]
        p2 = geom[step + 1]
        bearing = calculate_bearing(p1[0], p1[1], p2[0], p2[1])
        vehicle.heading_degrees = bearing
        vehicle.heading_direction = bearing_to_compass(bearing)
        return bearing

    def step_vehicle_movement(self, vehicle: EmergencyVehicle) -> EmergencyVehicle:
        """
        Advances the emergency vehicle by one step along its active route geometry.
        Loops or oscillates smoothly for continuous simulation and live updates.
        """
        geom = vehicle.active_route_geometry
        if not geom or len(geom) < 2:
            return vehicle

        next_idx = vehicle.current_step_index + 1
        if next_idx >= len(geom):
            # Loop back or reverse route to keep simulation active
            vehicle.current_step_index = 0
            next_idx = 0
        else:
            vehicle.current_step_index = next_idx

        new_pt = geom[vehicle.current_step_index]
        vehicle.current_location = GeoPoint(
            lat=new_pt[0],
            lng=new_pt[1],
            name=f"Corridor Waypoint #{vehicle.current_step_index + 1}"
        )

        # Compute next target heading
        if vehicle.current_step_index < len(geom) - 1:
            next_pt = geom[vehicle.current_step_index + 1]
            bearing = calculate_bearing(new_pt[0], new_pt[1], next_pt[0], next_pt[1])
        else:
            prev_pt = geom[vehicle.current_step_index - 1]
            bearing = calculate_bearing(prev_pt[0], prev_pt[1], new_pt[0], new_pt[1])

        vehicle.heading_degrees = bearing
        vehicle.heading_direction = bearing_to_compass(bearing)
        vehicle.eta_minutes = max(1.0, round(vehicle.eta_minutes - 0.5, 1))

        return vehicle

    def check_active_ambulance_alert_for_user(
        self,
        ambulance: EmergencyVehicle,
        user_lat: float,
        user_lng: float,
        alert_radius_meters: float = 1200.0
    ) -> ActiveAmbulanceAlertResponse:
        """
        Evaluates whether an active ambulance is relevant to a specific user based on:
        1. Proximity to the ambulance (direct Haversine distance).
        2. Proximity to the ambulance's active corridor polyline.
        3. Movement direction (is the ambulance heading toward the user?).
        """
        amb_lat = ambulance.current_location.lat
        amb_lng = ambulance.current_location.lng
        dist_km = haversine_distance(amb_lat, amb_lng, user_lat, user_lng)
        dist_m = round(dist_km * 1000.0, 1)

        # Ensure vehicle heading is refreshed
        heading = self.compute_vehicle_heading(ambulance)
        compass = ambulance.heading_direction or bearing_to_compass(heading)

        # Bearing from ambulance toward user
        bearing_to_user = calculate_bearing(amb_lat, amb_lng, user_lat, user_lng)
        # Angular difference between ambulance heading vector and user direction vector
        angle_diff = abs((bearing_to_user - heading + 180.0) % 360.0 - 180.0)

        # Distance from user to the ambulance route corridor polyline
        corridor_dist_km = min_distance_to_polyline_km(user_lat, user_lng, ambulance.active_route_geometry)
        corridor_dist_m = round(corridor_dist_km * 1000.0, 1)

        # Approaching condition: user is ahead within a 110-degree forward cone
        is_approaching = angle_diff <= 110.0

        # Relevance criteria:
        # Either within direct alert radius AND approaching, OR within 350m of the corridor
        is_relevant = (
            (dist_m <= alert_radius_meters and (is_approaching or dist_m <= 300.0))
            or (corridor_dist_m <= 350.0 and dist_m <= (alert_radius_meters * 1.5))
        )

        speed_kmh = max(30.0, ambulance.speed_kmh)
        eta_sec = max(5, int((dist_km / speed_kmh) * 3600.0))

        if is_relevant:
            action_desc = "Move over to the left shoulder and clear the emergency corridor immediately."
            msg = f"🚨 {ambulance.code} approaching in {eta_sec}s ({dist_m:.0f}m away, heading {compass}). Give way!"
        else:
            action_desc = "Corridor is clear in your immediate sector."
            msg = f"Ambulance {ambulance.code} active on corridor ({dist_m:.0f}m away)."

        return ActiveAmbulanceAlertResponse(
            has_active_ambulance=True,
            is_relevant_to_user=is_relevant,
            vehicle_id=ambulance.id,
            vehicle_code=ambulance.code,
            vehicle_type=ambulance.vehicle_type,
            ambulance_location=ambulance.current_location,
            heading_degrees=heading,
            heading_direction=compass,
            speed_kmh=speed_kmh,
            distance_meters=dist_m,
            eta_seconds=eta_sec,
            active_route_geometry=ambulance.active_route_geometry,
            message=msg,
            give_way_action=action_desc,
            is_approaching=is_approaching
        )

    def check_proximity_and_alert(
        self,
        vehicle: EmergencyVehicle,
        alert_radius_meters: Optional[float] = None
    ) -> List[CitizenGiveWayAlert]:
        """
        Calculates distance from vehicle to all active opted-in citizens.
        Generates Give-Way alerts for those within the proximity radius, enriched
        with live ambulance coordinates, heading, route geometry, and ETA.
        """
        radius_km = (alert_radius_meters or vehicle.alert_radius_meters) / 1000.0
        alerts: List[CitizenGiveWayAlert] = []

        heading = self.compute_vehicle_heading(vehicle)
        compass = vehicle.heading_direction or bearing_to_compass(heading)

        for citizen_id, cit_loc in self.active_citizens.items():
            dist_km = haversine_distance(
                vehicle.current_location.lat, vehicle.current_location.lng,
                cit_loc.lat, cit_loc.lng
            )

            # Check if citizen is on or near the corridor
            corridor_dist_km = min_distance_to_polyline_km(cit_loc.lat, cit_loc.lng, vehicle.active_route_geometry)

            if dist_km <= radius_km or corridor_dist_km <= 0.35:
                dist_m = round(dist_km * 1000.0, 1)
                default_msg = self.ALERT_MESSAGES.get(
                    vehicle.vehicle_type,
                    "🚨 Emergency vehicle approaching. Please give way."
                )

                # Heading from vehicle to citizen
                bearing_to_cit = calculate_bearing(
                    vehicle.current_location.lat, vehicle.current_location.lng,
                    cit_loc.lat, cit_loc.lng
                )
                angle_diff = abs((bearing_to_cit - heading + 180.0) % 360.0 - 180.0)
                is_approaching = angle_diff <= 110.0

                eta_sec = max(5, int((dist_km / max(30.0, vehicle.speed_kmh)) * 3600.0))
                msg = f"{default_msg} ({dist_m:.0f}m away • ETA: {eta_sec}s - {vehicle.code})"

                alert = CitizenGiveWayAlert(
                    id=str(uuid.uuid4())[:8],
                    citizen_id=citizen_id,
                    emergency_vehicle_code=vehicle.code,
                    emergency_vehicle_type=vehicle.vehicle_type,
                    distance_meters=dist_m,
                    message=msg,
                    severity="critical" if is_approaching else "warning",
                    ambulance_location=vehicle.current_location,
                    heading_degrees=heading,
                    heading_direction=compass,
                    speed_kmh=vehicle.speed_kmh,
                    active_route_geometry=vehicle.active_route_geometry,
                    eta_seconds=eta_sec,
                    is_approaching=is_approaching
                )
                alerts.append(alert)

        return alerts


emergency_engine = EmergencyGiveWayEngine()

