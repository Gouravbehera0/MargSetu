import type {
  Vehicle,
  Hospital,
  FireStation,
  PoliceStation,
  AmbulanceStation,
  AlertItem,
  RouteOption,
  TrafficData,
  UserProfile,
  EmergencyContact,
  MapMarker,
} from '@/types';

export const currentUser: UserProfile = {
  name: 'Amit Sharma',
  phone: '+91 98765 43210',
  location: 'Bhubaneswar, Odisha',
  role: 'citizen',
  emergencyContacts: [
    { id: 'c1', name: 'Priya Sharma', phone: '+91 98765 11111', relation: 'Spouse' },
    { id: 'c2', name: 'Rajesh Sharma', phone: '+91 98765 22222', relation: 'Father' },
    { id: 'c3', name: 'Dr. Mehta', phone: '+91 98765 33333', relation: 'Family Doctor' },
  ],
};

export const vehicleUser: UserProfile = {
  name: 'Vikram Patel',
  phone: '+91 99887 76655',
  location: 'Bhubaneswar, Odisha',
  role: 'vehicle',
  vehicleType: 'ambulance',
  vehicleCode: 'A102',
  emergencyContacts: [],
};

export const ambulances: Vehicle[] = [
  {
    id: 'amb1',
    code: 'A102',
    type: 'ambulance',
    status: 'on_mission',
    driverName: 'Vikram Patel',
    driverPhone: '+91 99887 76655',
    location: { lat: 20.2961, lng: 85.8245 },
    hospitalId: 'h1',
    eta: '05:42',
    distance: '2.4 km',
    missionStatus: 'en_route',
  },
  {
    id: 'amb2',
    code: 'A205',
    type: 'ambulance',
    status: 'online',
    driverName: 'Suresh Kumar',
    driverPhone: '+91 90011 22334',
    location: { lat: 20.3001, lng: 85.8201 },
  },
  {
    id: 'amb3',
    code: 'A308',
    type: 'ambulance',
    status: 'online',
    driverName: 'Anita Das',
    driverPhone: '+91 90011 44556',
    location: { lat: 20.2920, lng: 85.8280 },
  },
];

export const fireVehicles: Vehicle[] = [
  {
    id: 'fire1',
    code: 'F101',
    type: 'fire',
    status: 'online',
    driverName: 'Mohan Reddy',
    driverPhone: '+91 91100 22334',
    location: { lat: 20.2980, lng: 85.8260 },
  },
  {
    id: 'fire2',
    code: 'F202',
    type: 'fire',
    status: 'on_mission',
    driverName: 'Karthik N',
    driverPhone: '+91 91100 55667',
    location: { lat: 20.2950, lng: 85.8290 },
    eta: '08:15',
    distance: '3.1 km',
    missionStatus: 'en_route',
  },
];

export const policeVehicles: Vehicle[] = [
  {
    id: 'pol1',
    code: 'P301',
    type: 'police',
    status: 'online',
    driverName: 'Inspector Gupta',
    driverPhone: '+91 92233 44556',
    location: { lat: 20.2970, lng: 85.8230 },
  },
  {
    id: 'pol2',
    code: 'P302',
    type: 'police',
    status: 'online',
    driverName: 'SI Verma',
    driverPhone: '+91 92233 77889',
    location: { lat: 20.2940, lng: 85.8210 },
  },
];

export const allVehicles: Vehicle[] = [...ambulances, ...fireVehicles, ...policeVehicles];

export const hospitals: Hospital[] = [
  {
    id: 'h1',
    name: 'City Hospital',
    type: 'hospital',
    distance: '2.1 km',
    eta: '6 min',
    emergencyAvailable: true,
    address: 'Janpath, Bhubaneswar',
    phone: '+91 674 239 1000',
    beds: 12,
    location: { lat: 20.2961, lng: 85.8245 },
  },
  {
    id: 'h2',
    name: 'AIIMS Bhubaneswar',
    type: 'hospital',
    distance: '4.5 km',
    eta: '12 min',
    emergencyAvailable: true,
    address: 'Sijua, Patia',
    phone: '+91 674 239 2000',
    beds: 8,
    location: { lat: 20.3050, lng: 85.8150 },
  },
  {
    id: 'h3',
    name: 'Apollo Hospitals',
    type: 'hospital',
    distance: '5.8 km',
    eta: '15 min',
    emergencyAvailable: false,
    address: 'Sainik School Road',
    phone: '+91 674 239 3000',
    beds: 0,
    location: { lat: 20.3100, lng: 85.8300 },
  },
];

export const fireStations: FireStation[] = [
  {
    id: 'fs1',
    name: 'Central Fire Station',
    type: 'fire_station',
    distance: '1.8 km',
    eta: '5 min',
    available: true,
    address: 'Fire Station Square, Bhubaneswar',
    phone: '+91 674 239 4000',
    vehicles: 4,
    location: { lat: 20.2980, lng: 85.8260 },
  },
  {
    id: 'fs2',
    name: 'Unit-4 Fire Station',
    type: 'fire_station',
    distance: '3.2 km',
    eta: '9 min',
    available: true,
    address: 'Unit-4, Bhubaneswar',
    phone: '+91 674 239 4100',
    vehicles: 2,
    location: { lat: 20.2920, lng: 85.8280 },
  },
];

export const policeStations: PoliceStation[] = [
  {
    id: 'ps1',
    name: 'Capital Police Station',
    type: 'police_station',
    distance: '2.5 km',
    eta: '7 min',
    available: true,
    address: 'Unit-1, Bhubaneswar',
    phone: '+91 674 239 5000',
    units: 6,
    location: { lat: 20.2970, lng: 85.8230 },
  },
  {
    id: 'ps2',
    name: 'Khandagiri Police Station',
    type: 'police_station',
    distance: '4.0 km',
    eta: '11 min',
    available: true,
    address: 'Khandagiri, Bhubaneswar',
    phone: '+91 674 239 5100',
    units: 3,
    location: { lat: 20.2900, lng: 85.8150 },
  },
];

export const ambulanceStations: AmbulanceStation[] = [
  {
    id: 'as1',
    name: 'City Ambulance Hub',
    type: 'ambulance_station',
    distance: '1.2 km',
    eta: '4 min',
    available: true,
    address: 'Station Road, Bhubaneswar',
    phone: '+91 674 239 6000',
    ambulances: 5,
    location: { lat: 20.2990, lng: 85.8250 },
  },
  {
    id: 'as2',
    name: 'AIIMS Ambulance Bay',
    type: 'ambulance_station',
    distance: '4.5 km',
    eta: '12 min',
    available: true,
    address: 'Sijua, Patia',
    phone: '+91 674 239 6100',
    ambulances: 3,
    location: { lat: 20.3050, lng: 85.8150 },
  },
];

export const allNearbyServices = [...hospitals, ...fireStations, ...policeStations, ...ambulanceStations];

export const routeOptions: RouteOption[] = [
  {
    id: 'r1',
    name: 'Route A',
    duration: '17 min',
    durationMin: 17,
    distance: '8.3 km',
    traffic: 'high',
  },
  {
    id: 'r2',
    name: 'Route B',
    duration: '12 min',
    durationMin: 12,
    distance: '8.7 km',
    traffic: 'low',
    recommended: true,
  },
  {
    id: 'r3',
    name: 'Route C',
    duration: '15 min',
    durationMin: 15,
    distance: '9.2 km',
    traffic: 'moderate',
  },
];

export const trafficData: TrafficData[] = [
  { road: 'Janpath Road', level: 'moderate', color: 'orange' },
  { road: 'Sachivalaya Marg', level: 'low', color: 'green' },
  { road: 'Kalpana Square', level: 'high', color: 'red' },
  { road: 'Master Canteen', level: 'moderate', color: 'orange' },
  { road: 'Rasulgarh', level: 'low', color: 'green' },
];

export const citizenAlerts: AlertItem[] = [
  {
    id: 'a1',
    type: 'ambulance_approaching',
    title: 'Ambulance Approaching',
    message: 'Ambulance A102 is 350 m away. Please give way.',
    severity: 'critical',
    timestamp: '2 min ago',
    distance: '350 m',
    eta: '40 sec',
  },
  {
    id: 'a2',
    type: 'route_update',
    title: 'Route Updated',
    message: 'Traffic increased on your current route. Faster path available.',
    severity: 'warning',
    timestamp: '8 min ago',
  },
  {
    id: 'a3',
    type: 'hospital_update',
    title: 'Hospital Update',
    message: 'City Hospital is currently accepting emergency patients.',
    severity: 'info',
    timestamp: '15 min ago',
  },
  {
    id: 'a4',
    type: 'traffic_alert',
    title: 'Traffic Alert',
    message: 'Heavy congestion on Kalpana Square. Expect delays.',
    severity: 'warning',
    timestamp: '25 min ago',
  },
];

export const vehicleAlerts: AlertItem[] = [
  {
    id: 'va1',
    type: 'mission_update',
    title: 'New Mission Assigned',
    message: 'Pickup at Master Canteen — Medical emergency. Priority: High.',
    severity: 'critical',
    timestamp: '1 min ago',
  },
  {
    id: 'va2',
    type: 'route_update',
    title: 'Route Optimized',
    message: 'QPSO engine found a faster route. ETA reduced by 3 min.',
    severity: 'info',
    timestamp: '5 min ago',
  },
  {
    id: 'va3',
    type: 'traffic_alert',
    title: 'Traffic Ahead',
    message: 'Accident reported on Janpath Road. Rerouting recommended.',
    severity: 'warning',
    timestamp: '10 min ago',
  },
];

export const citizenMapMarkers: MapMarker[] = [
  { id: 'm1', type: 'user', label: 'Your Location', position: { x: 50, y: 55 } },
  { id: 'm2', type: 'ambulance', label: 'Ambulance A102', position: { x: 30, y: 35 }, status: 'En Route', distance: '2.4 km', eta: '05:42' },
  { id: 'm3', type: 'ambulance', label: 'Ambulance A205', position: { x: 70, y: 25 }, status: 'Available' },
  { id: 'm4', type: 'fire', label: 'Fire Brigade F101', position: { x: 75, y: 65 }, status: 'Available' },
  { id: 'm5', type: 'hospital', label: 'City Hospital', position: { x: 60, y: 75 }, status: 'Accepting', distance: '2.1 km', eta: '6 min' },
  { id: 'm6', type: 'police', label: 'Capital Police', position: { x: 25, y: 70 }, status: 'Available' },
];

export const liveMapMarkers: MapMarker[] = [
  ...citizenMapMarkers,
  { id: 'm7', type: 'fire_incident', label: 'Fire Incident', position: { x: 80, y: 40 }, status: 'Active' },
  { id: 'm8', type: 'emergency', label: 'Medical Emergency', position: { x: 40, y: 20 }, status: 'Responding' },
];

export const adminEmergencies = [
  { id: 'e1', type: 'Medical', vehicle: 'A102', location: 'Master Canteen', priority: 'High', eta: '5 min', status: 'En Route' },
  { id: 'e2', type: 'Fire', vehicle: 'F202', location: 'Unit-4', priority: 'Critical', eta: '8 min', status: 'En Route' },
  { id: 'e3', type: 'Accident', vehicle: 'P301', location: 'Kalpana Square', priority: 'Medium', eta: '6 min', status: 'Assigned' },
  { id: 'e4', type: 'Medical', vehicle: 'A205', location: 'Rasulgarh', priority: 'Low', eta: '12 min', status: 'Completed' },
  { id: 'e5', type: 'Injury', vehicle: 'P302', location: 'Patia', priority: 'Medium', eta: '10 min', status: 'En Route' },
];

export const adminStats = {
  activeEmergencies: 5,
  activeAmbulances: 3,
  fireVehicles: 2,
  policeVehicles: 2,
  averageETA: '7.2 min',
};

export const trafficSummary = {
  normal: 12,
  moderate: 5,
  heavy: 3,
};

export const weeklyEmergencyData = [
  { day: 'Mon', count: 8 },
  { day: 'Tue', count: 12 },
  { day: 'Wed', count: 6 },
  { day: 'Thu', count: 14 },
  { day: 'Fri', count: 18 },
  { day: 'Sat', count: 10 },
  { day: 'Sun', count: 7 },
];

export const emergencyContacts: EmergencyContact[] = currentUser.emergencyContacts;
