import type { RouteOption, NavigationRoute } from '@/types';
import { routeOptions } from '@/data/mockData';
import { navigationRoutes, reroutedRoute } from '@/data/navigationData';

export interface RouteOptimizationResult {
  routes: RouteOption[];
  selectedRoute: RouteOption;
  duration: string;
}

export async function mockRouteService(): Promise<RouteOptimizationResult> {
  await new Promise((resolve) => setTimeout(resolve, 2500));
  const routes = routeOptions;
  const selectedRoute = routes.find((r) => r.recommended) ?? routes[0];
  return {
    routes,
    selectedRoute,
    duration: selectedRoute.duration,
  };
}

export async function mockRerouteService(): Promise<{
  previousETA: string;
  newETA: string;
  reason: string;
  newRoute: NavigationRoute;
}> {
  await new Promise((resolve) => setTimeout(resolve, 1500));
  return {
    previousETA: '12 min',
    newETA: '9 min',
    reason: 'Traffic increased ahead due to an accident.',
    newRoute: reroutedRoute,
  };
}

export async function mockAssignVehicle(): Promise<{ vehicleCode: string; eta: string; distance: string }> {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  return {
    vehicleCode: 'A102',
    eta: '05:42',
    distance: '2.4 km',
  };
}

export function getNavigationRouteById(id: string): NavigationRoute | undefined {
  return navigationRoutes.find((r) => r.id === id);
}

export function getDefaultNavigationRoute(): NavigationRoute {
  return navigationRoutes.find((r) => r.recommended) ?? navigationRoutes[0];
}

export interface NavigationSimState {
  progress: number;
  position: { x: number; y: number };
  remainingDistance: string;
  eta: string;
  currentInstructionIndex: number;
}

export function interpolatePosition(
  coordinates: { x: number; y: number }[],
  progress: number
): { x: number; y: number } {
  if (coordinates.length === 0) return { x: 0, y: 0 };
  if (coordinates.length === 1) return coordinates[0];

  const totalSegments = coordinates.length - 1;
  const exactSegment = progress / 100 * totalSegments;
  const segmentIndex = Math.min(Math.floor(exactSegment), totalSegments - 1);
  const segmentProgress = exactSegment - segmentIndex;

  const p1 = coordinates[segmentIndex];
  const p2 = coordinates[segmentIndex + 1];

  return {
    x: p1.x + (p2.x - p1.x) * segmentProgress,
    y: p1.y + (p2.y - p1.y) * segmentProgress,
  };
}

export function getNavigationSimState(route: NavigationRoute, progress: number): NavigationSimState {
  const position = interpolatePosition(route.coordinates, progress);
  const remainingKm = Math.max(0, route.distanceKm * (1 - progress / 100));
  const remainingMin = Math.max(0, route.etaMin * (1 - progress / 100));
  const remainingSec = Math.round(remainingMin * 60);

  const eta = `${String(Math.floor(remainingSec / 60)).padStart(2, '0')}:${String(remainingSec % 60).padStart(2, '0')}`;
  const remainingDistance = `${remainingKm.toFixed(1)} km`;

  let currentInstructionIndex = 0;
  for (let i = route.instructions.length - 1; i >= 0; i--) {
    if (progress >= route.instructions[i].triggeredAtProgress) {
      currentInstructionIndex = i;
      break;
    }
  }

  return {
    progress,
    position,
    remainingDistance,
    eta,
    currentInstructionIndex,
  };
}
