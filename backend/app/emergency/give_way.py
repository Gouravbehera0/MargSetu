"""
MARGSETU - Emergency Priority & Citizen Give-Way Alert Engine
Calculates spatial proximity between emergency vehicles and citizens along active corridors,
broadcasting immediate Give-Way notifications.
"""
import uuid
from typing import List, Dict, Optional, Any
from backend.app.database.models import (
    VehicleType, CitizenGiveWayAlert, GeoPoint, EmergencyVehicle
)
from backend.app.routing.network_graph import haversine_distance


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

    def check_proximity_and_alert(
        self,
        vehicle: EmergencyVehicle,
        alert_radius_meters: Optional[float] = None
    ) -> List[CitizenGiveWayAlert]:
        """
        Calculates distance from vehicle to all active opted-in citizens.
        Generates Give-Way alerts for those within the proximity radius.
        """
        radius_km = (alert_radius_meters or vehicle.alert_radius_meters) / 1000.0
        alerts: List[CitizenGiveWayAlert] = []

        for citizen_id, cit_loc in self.active_citizens.items():
            dist_km = haversine_distance(
                vehicle.current_location.lat, vehicle.current_location.lng,
                cit_loc.lat, cit_loc.lng
            )

            if dist_km <= radius_km:
                dist_m = round(dist_km * 1000.0, 1)
                default_msg = self.ALERT_MESSAGES.get(
                    vehicle.vehicle_type,
                    "🚨 Emergency vehicle approaching. Please give way."
                )
                msg = f"{default_msg} ({dist_m:.0f}m away - Vehicle: {vehicle.code})"

                alert = CitizenGiveWayAlert(
                    id=str(uuid.uuid4())[:8],
                    citizen_id=citizen_id,
                    emergency_vehicle_code=vehicle.code,
                    emergency_vehicle_type=vehicle.vehicle_type,
                    distance_meters=dist_m,
                    message=msg,
                    severity="critical"
                )
                alerts.append(alert)

        return alerts


emergency_engine = EmergencyGiveWayEngine()
