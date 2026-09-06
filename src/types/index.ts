export type Role = 'citizen' | 'vehicle';

export type EmergencyServiceType = 'ambulance' | 'fire' | 'police';

export type EmergencyType = 'accident' | 'medical' | 'injury' | 'fire' | 'other';

export type VehicleStatus = 'online' | 'on_mission' | 'offline';

export type MissionStatus = 'assigned' | 'en_route' | 'arrived' | 'transporting' | 'completed';

export type TrafficLevel = 'low' | 'moderate' | 'high';

export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface Vehicle {
  id: string;
  code: string;
  type: EmergencyServiceType;
  status: VehicleStatus;
  driverName: string;
  driverPhone: string;
  location: { lat: number; lng: number };
  hospitalId?: string;
  eta?: string;
  distance?: string;
  missionStatus?: MissionStatus;
}

export interface Hospital {
  id: string;
  name: string;
  type: 'hospital';
  distance: string;
  eta: string;
  emergencyAvailable: boolean;
  address: string;
  phone: string;
  beds: number;
  location: { lat: number; lng: number };
}

export interface FireStation {
  id: string;
  name: string;
  type: 'fire_station';
  distance: string;
  eta: string;
  available: boolean;
  address: string;
  phone: string;
  vehicles: number;
  location: { lat: number; lng: number };
}

export interface PoliceStation {
  id: string;
  name: string;
  type: 'police_station';
  distance: string;
  eta: string;
  available: boolean;
  address: string;
  phone: string;
  units: number;
  location: { lat: number; lng: number };
}

export interface AmbulanceStation {
  id: string;
  name: string;
  type: 'ambulance_station';
  distance: string;
  eta: string;
  available: boolean;
  address: string;
  phone: string;
  ambulances: number;
  location: { lat: number; lng: number };
}

export type NearbyService = Hospital | FireStation | PoliceStation | AmbulanceStation;

export interface EmergencyRequest {
  id: string;
  serviceType: EmergencyServiceType;
  emergencyType: EmergencyType;
  pickupLocation: string;
  patients: number;
  additionalInfo: string;
  status: 'requested' | 'assigned' | 'en_route' | 'completed' | 'cancelled';
  vehicleId?: string;
  createdAt: string;
}

export interface RouteOption {
  id: string;
  name: string;
  duration: string;
  durationMin: number;
  distance: string;
  traffic: TrafficLevel;
  recommended?: boolean;
}

export interface AlertItem {
  id: string;
  type: 'ambulance_approaching' | 'route_update' | 'hospital_update' | 'mission_update' | 'traffic_alert';
  title: string;
  message: string;
  severity: AlertSeverity;
  timestamp: string;
  distance?: string;
  eta?: string;
}

export interface TrafficData {
  road: string;
  level: TrafficLevel;
  color: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relation: string;
}

export interface UserProfile {
  name: string;
  phone: string;
  location: string;
  role: Role;
  vehicleType?: EmergencyServiceType;
  vehicleCode?: string;
  emergencyContacts: EmergencyContact[];
}

export interface MapMarker {
  id: string;
  type: EmergencyServiceType | 'hospital' | 'fire_incident' | 'emergency' | 'user';
  label: string;
  position: { x: number; y: number };
  status?: string;
  distance?: string;
  eta?: string;
}

export interface RouteCoordinate {
  x: number;
  y: number;
}

export interface TurnInstructionData {
  id: string;
  direction: 'left' | 'right' | 'straight' | 'arrive' | 'depart';
  text: string;
  distance: string;
  triggeredAtProgress: number;
}

export interface NavigationRoute {
  id: string;
  name: string;
  distance: string;
  distanceKm: number;
  eta: string;
  etaMin: number;
  traffic: TrafficLevel;
  coordinates: RouteCoordinate[];
  instructions: TurnInstructionData[];
  recommended?: boolean;
}

export interface MapIncident {
  id: string;
  type: 'accident' | 'roadblock' | 'construction' | 'fire';
  label: string;
  position: RouteCoordinate;
}

export interface NavigationTrafficSegment {
  id: string;
  road: string;
  level: TrafficLevel;
  position: RouteCoordinate;
}
