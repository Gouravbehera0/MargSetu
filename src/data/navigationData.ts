import type { NavigationRoute, MapIncident, NavigationTrafficSegment, RouteCoordinate } from '@/types';

const routeAInstructions = [
  { id: 'a1', direction: 'depart' as const, text: 'Head south on Janpath Road', distance: '0 m', triggeredAtProgress: 0 },
  { id: 'a2', direction: 'right' as const, text: 'Turn right onto Sachivalaya Marg', distance: '300 m', triggeredAtProgress: 10 },
  { id: 'a3', direction: 'straight' as const, text: 'Continue straight for 1.2 km', distance: '1.2 km', triggeredAtProgress: 25 },
  { id: 'a4', direction: 'left' as const, text: 'Turn left onto Kalpana Square', distance: '500 m', triggeredAtProgress: 45 },
  { id: 'a5', direction: 'right' as const, text: 'Turn right onto Hospital Road', distance: '800 m', triggeredAtProgress: 70 },
  { id: 'a6', direction: 'arrive' as const, text: 'Arrive at City Hospital', distance: '0 m', triggeredAtProgress: 100 },
];

const routeBInstructions = [
  { id: 'b1', direction: 'depart' as const, text: 'Head east on Station Road', distance: '0 m', triggeredAtProgress: 0 },
  { id: 'b2', direction: 'left' as const, text: 'Turn left in 300 m onto Unit-1 Road', distance: '300 m', triggeredAtProgress: 8 },
  { id: 'b3', direction: 'straight' as const, text: 'Continue straight for 1.5 km', distance: '1.5 km', triggeredAtProgress: 20 },
  { id: 'b4', direction: 'right' as const, text: 'Turn right in 500 m onto Capital Road', distance: '500 m', triggeredAtProgress: 40 },
  { id: 'b5', direction: 'straight' as const, text: 'Continue straight for 2.0 km', distance: '2.0 km', triggeredAtProgress: 60 },
  { id: 'b6', direction: 'left' as const, text: 'Turn left in 200 m onto Hospital Lane', distance: '200 m', triggeredAtProgress: 85 },
  { id: 'b7', direction: 'arrive' as const, text: 'Arrive at City Hospital', distance: '0 m', triggeredAtProgress: 100 },
];

const routeCInstructions = [
  { id: 'c1', direction: 'depart' as const, text: 'Head north on Master Canteen Road', distance: '0 m', triggeredAtProgress: 0 },
  { id: 'c2', direction: 'straight' as const, text: 'Continue straight for 800 m', distance: '800 m', triggeredAtProgress: 15 },
  { id: 'c3', direction: 'right' as const, text: 'Turn right onto Rajpath', distance: '400 m', triggeredAtProgress: 30 },
  { id: 'c4', direction: 'left' as const, text: 'Turn left onto Sainik School Road', distance: '600 m', triggeredAtProgress: 50 },
  { id: 'c5', direction: 'straight' as const, text: 'Continue straight for 1.8 km', distance: '1.8 km', triggeredAtProgress: 70 },
  { id: 'c6', direction: 'right' as const, text: 'Turn right in 300 m onto Hospital Road', distance: '300 m', triggeredAtProgress: 90 },
  { id: 'c7', direction: 'arrive' as const, text: 'Arrive at City Hospital', distance: '0 m', triggeredAtProgress: 100 },
];

const routeACoords: RouteCoordinate[] = [
  { x: 15, y: 80 },
  { x: 20, y: 70 },
  { x: 25, y: 60 },
  { x: 35, y: 55 },
  { x: 45, y: 50 },
  { x: 50, y: 40 },
  { x: 55, y: 30 },
  { x: 65, y: 25 },
  { x: 70, y: 20 },
];

const routeBCoords: RouteCoordinate[] = [
  { x: 15, y: 80 },
  { x: 25, y: 75 },
  { x: 35, y: 68 },
  { x: 45, y: 60 },
  { x: 50, y: 50 },
  { x: 55, y: 40 },
  { x: 60, y: 30 },
  { x: 65, y: 22 },
  { x: 70, y: 20 },
];

const routeCCoords: RouteCoordinate[] = [
  { x: 15, y: 80 },
  { x: 18, y: 70 },
  { x: 22, y: 60 },
  { x: 30, y: 52 },
  { x: 40, y: 45 },
  { x: 50, y: 38 },
  { x: 58, y: 30 },
  { x: 65, y: 25 },
  { x: 70, y: 20 },
];

export const navigationRoutes: NavigationRoute[] = [
  {
    id: 'route-a',
    name: 'Route A',
    distance: '8.3 km',
    distanceKm: 8.3,
    eta: '17 min',
    etaMin: 17,
    traffic: 'high',
    coordinates: routeACoords,
    instructions: routeAInstructions,
  },
  {
    id: 'route-b',
    name: 'Route B',
    distance: '8.7 km',
    distanceKm: 8.7,
    eta: '12 min',
    etaMin: 12,
    traffic: 'low',
    coordinates: routeBCoords,
    instructions: routeBInstructions,
    recommended: true,
  },
  {
    id: 'route-c',
    name: 'Route C',
    distance: '9.2 km',
    distanceKm: 9.2,
    eta: '15 min',
    etaMin: 15,
    traffic: 'moderate',
    coordinates: routeCCoords,
    instructions: routeCInstructions,
  },
];

export const reroutedRoute: NavigationRoute = {
  id: 'route-d',
  name: 'Route D',
  distance: '9.2 km',
  distanceKm: 9.2,
  eta: '9 min',
  etaMin: 9,
  traffic: 'low',
  coordinates: [
    { x: 15, y: 80 },
    { x: 22, y: 72 },
    { x: 30, y: 65 },
    { x: 38, y: 58 },
    { x: 48, y: 50 },
    { x: 55, y: 40 },
    { x: 62, y: 30 },
    { x: 68, y: 24 },
    { x: 70, y: 20 },
  ],
  instructions: [
    { id: 'd1', direction: 'depart', text: 'Head southeast on Bypass Road', distance: '0 m', triggeredAtProgress: 0 },
    { id: 'd2', direction: 'right', text: 'Turn right in 250 m onto Express Highway', distance: '250 m', triggeredAtProgress: 10 },
    { id: 'd3', direction: 'straight', text: 'Continue straight for 2.5 km', distance: '2.5 km', triggeredAtProgress: 25 },
    { id: 'd4', direction: 'left', text: 'Turn left in 400 m onto Capital Bypass', distance: '400 m', triggeredAtProgress: 50 },
    { id: 'd5', direction: 'straight', text: 'Continue straight for 1.8 km', distance: '1.8 km', triggeredAtProgress: 70 },
    { id: 'd6', direction: 'right', text: 'Turn right in 300 m onto Hospital Road', distance: '300 m', triggeredAtProgress: 88 },
    { id: 'd7', direction: 'arrive', text: 'Arrive at City Hospital', distance: '0 m', triggeredAtProgress: 100 },
  ],
  recommended: true,
};

export const navigationIncidents: MapIncident[] = [
  { id: 'inc1', type: 'accident', label: 'Accident', position: { x: 50, y: 40 } },
  { id: 'inc2', type: 'roadblock', label: 'Road Block', position: { x: 45, y: 50 } },
];

export const navigationTrafficSegments: NavigationTrafficSegment[] = [
  { id: 't1', road: 'Janpath Road', level: 'moderate', position: { x: 30, y: 60 } },
  { id: 't2', road: 'Sachivalaya Marg', level: 'low', position: { x: 45, y: 55 } },
  { id: 't3', road: 'Kalpana Square', level: 'high', position: { x: 50, y: 40 } },
  { id: 't4', road: 'Hospital Road', level: 'low', position: { x: 65, y: 25 } },
];

export const destinationPosition: RouteCoordinate = { x: 70, y: 20 };
