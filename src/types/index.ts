export type Role = 'citizen' | 'vehicle' | 'admin';

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

// -------------------------------------------------------------
// MARGSETU - General Transportation & QPSO Intelligent Routing Types
// -------------------------------------------------------------

export type GeneralVehicleType =
  | 'car'
  | 'bike'
  | 'bus'
  | 'truck'
  | 'taxi'
  | 'delivery'
  | 'ambulance'
  | 'fire'
  | 'police';

export type RoutePreference =
  | 'fastest'
  | 'shortest'
  | 'safest'
  | 'low_traffic'
  | 'eco'
  | 'balanced'
  | 'emergency';

export interface GeoPoint {
  lat: float_number;
  lng: float_number;
  name?: string;
}

type float_number = number;

export interface OptimizationWeights {
  w1_time: number;
  w2_congestion: number;
  w3_distance: number;
  w4_risk: number;
  w5_blockage: number;
}

export interface FitnessExplanation {
  time_contribution: number;
  congestion_contribution: number;
  distance_contribution: number;
  risk_contribution: number;
  blockage_contribution: number;
  total_fitness: number;
  explanation_text: string;
}

export interface RouteCandidateAlternative {
  id: string;
  name: string;
  distance_km: number;
  travel_time_min: number;
  traffic_score: number;
  risk_score: number;
  blockage_score: number;
  composite_fitness: number;
  coordinates: [number, number][];
}

export interface QPSOOptimizationResult {
  algorithm: string;
  route_id: string;
  route_name: string;
  origin: GeoPoint;
  destination: GeoPoint;
  distance_km: number;
  eta_minutes: number;
  fitness: number;
  traffic_score: number;
  risk_score: number;
  blockage_score: number;
  iterations: number;
  computation_time_ms: number;
  convergence_history: number[];
  weights_used: OptimizationWeights;
  explainability: FitnessExplanation;
  path_nodes: string[];
  route_geometry: [number, number][];
  candidate_alternatives: RouteCandidateAlternative[];
  vehicle_type: GeneralVehicleType;
  is_emergency: boolean;
}

export interface BenchmarkResultItem {
  algorithm: string;
  fitness: number;
  travel_time_min: number;
  distance_km: number;
  computation_time_ms: number;
  iterations: number;
  convergence_history: number[];
  route_valid: boolean;
  path: string[];
}

export interface IncidentRecord {
  id: string;
  type: 'accident' | 'roadblock' | 'construction' | 'fire' | 'weather';
  description: string;
  location: GeoPoint;
  affected_nodes: string[];
  severity: 'info' | 'warning' | 'critical';
  reported_at: string;
  active: boolean;
}

export interface CitizenGiveWayAlertItem {
  id: string;
  citizen_id: string;
  emergency_vehicle_code: string;
  emergency_vehicle_type: GeneralVehicleType;
  distance_meters: number;
  message: string;
  severity: string;
  timestamp: string;
  ambulance_location?: GeoPoint;
  heading_degrees?: number;
  heading_direction?: string;
  speed_kmh?: number;
  active_route_geometry?: [number, number][];
  eta_seconds?: number;
  is_approaching?: boolean;
}

export interface ActiveAmbulanceAlertData {
  has_active_ambulance: boolean;
  is_relevant_to_user: boolean;
  vehicle_id?: string;
  vehicle_code?: string;
  vehicle_type?: string;
  ambulance_location?: GeoPoint;
  heading_degrees: number;
  heading_direction: string;
  speed_kmh: number;
  distance_meters: number;
  eta_seconds: number;
  active_route_geometry: [number, number][];
  message: string;
  give_way_action: string;
  is_approaching: boolean;
}


