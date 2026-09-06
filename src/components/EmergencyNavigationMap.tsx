import type { NavigationRoute, RouteCoordinate, MapIncident, NavigationTrafficSegment } from '@/types';
import { Ambulance, Hospital, AlertTriangle, Construction, Ban, Flame } from 'lucide-react';

interface EmergencyNavigationMapProps {
  route: NavigationRoute | null;
  vehiclePosition: RouteCoordinate;
  destination: RouteCoordinate;
  trafficData?: NavigationTrafficSegment[];
  incidents?: MapIncident[];
  progress: number;
  className?: string;
}

const trafficColors: Record<string, string> = {
  low: '#22c55e',
  moderate: '#f97316',
  high: '#ef4444',
};

const incidentConfig = {
  accident: { icon: AlertTriangle, bg: 'bg-emergency-500' },
  roadblock: { icon: Ban, bg: 'bg-orange-500' },
  construction: { icon: Construction, bg: 'bg-yellow-500' },
  fire: { icon: Flame, bg: 'bg-emergency-600' },
};

function buildSvgPath(coords: RouteCoordinate[]): string {
  if (coords.length === 0) return '';
  return coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
}

export default function EmergencyNavigationMap({
  route,
  vehiclePosition,
  destination,
  trafficData = [],
  incidents = [],
  progress,
  className = '',
}: EmergencyNavigationMapProps) {
  const routeColor = route ? trafficColors[route.traffic] : '#22c55e';

  const traveledPath =
    route && route.coordinates.length > 0
      ? buildSvgPath(
          route.coordinates.filter((_, i) => {
            const threshold = (i / (route.coordinates.length - 1)) * 100;
            return threshold <= progress;
          }).concat(
            progress > 0 && progress < 100
              ? [vehiclePosition]
              : []
          )
        )
      : '';

  const fullPath = route ? buildSvgPath(route.coordinates) : '';

  return (
    <div className={`relative w-full overflow-hidden bg-[#e8eef5] ${className}`}>
      {/* Map background */}
      <div className="absolute inset-0">
        {/* Roads */}
        <div className="absolute top-1/2 left-0 right-0 h-4 bg-gray-300/50 -translate-y-1/2" />
        <div className="absolute top-0 bottom-0 left-1/2 w-4 bg-gray-300/50 -translate-x-1/2" />
        <div className="absolute top-[25%] left-0 right-0 h-2.5 bg-gray-300/35" />
        <div className="absolute top-0 bottom-0 left-[25%] w-2.5 bg-gray-300/35" />
        <div className="absolute top-0 bottom-0 left-[75%] w-2.5 bg-gray-300/35" />
        <div className="absolute top-[75%] left-0 right-0 h-2.5 bg-gray-300/35" />
        <div className="absolute top-[10%] left-[10%] right-[10%] h-1.5 bg-gray-300/25 rotate-3" />

        {/* Blocks */}
        <div className="absolute top-[5%] left-[5%] w-[15%] h-[15%] bg-green-100/40 rounded-lg" />
        <div className="absolute top-[5%] right-[5%] w-[15%] h-[15%] bg-blue-100/30 rounded-lg" />
        <div className="absolute bottom-[5%] left-[5%] w-[15%] h-[15%] bg-orange-100/30 rounded-lg" />
        <div className="absolute bottom-[5%] right-[5%] w-[15%] h-[15%] bg-green-100/40 rounded-lg" />
        <div className="absolute top-[30%] left-[30%] w-[12%] h-[12%] bg-gray-200/30 rounded-lg" />
        <div className="absolute top-[55%] right-[28%] w-[12%] h-[12%] bg-gray-200/30 rounded-lg" />
        <div className="absolute top-[8%] left-[40%] w-[10%] h-[10%] bg-green-100/30 rounded-lg" />
        <div className="absolute bottom-[12%] right-[35%] w-[10%] h-[10%] bg-blue-100/30 rounded-lg" />
      </div>

      {/* Traffic indicators */}
      {trafficData.map((t) => (
        <div
          key={t.id}
          className="absolute -translate-x-1/2 -translate-y-1/2 z-5"
          style={{ left: `${t.position.x}%`, top: `${t.position.y}%` }}
        >
          <div
            className="w-3 h-3 rounded-full ring-2 ring-white/60"
            style={{ backgroundColor: trafficColors[t.level] }}
          >
            {t.level === 'high' && <div className="absolute inset-0 rounded-full animate-ping" style={{ backgroundColor: trafficColors[t.level] }} />}
          </div>
        </div>
      ))}

      {/* Route polyline */}
      {route && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {/* Full route (dimmed) */}
          <path
            d={fullPath}
            fill="none"
            stroke={routeColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.25"
          />
          {/* Traveled portion (bright) */}
          {traveledPath && (
            <path
              d={traveledPath}
              fill="none"
              stroke={routeColor}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {/* Remaining route (dashed, bright) */}
          <path
            d={fullPath}
            fill="none"
            stroke={routeColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="4 3"
          >
            <animate attributeName="stroke-dashoffset" from="14" to="0" dur="1s" repeatCount="indefinite" />
          </path>
        </svg>
      )}

      {/* Incident markers */}
      {incidents.map((inc) => {
        const cfg = incidentConfig[inc.type];
        const Icon = cfg.icon;
        return (
          <div
            key={inc.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
            style={{ left: `${inc.position.x}%`, top: `${inc.position.y}%` }}
          >
            <div className={`${cfg.bg} w-8 h-8 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white animate-pulse`}>
              <Icon size={14} className="text-white" strokeWidth={2.5} />
            </div>
          </div>
        );
      })}

      {/* Destination marker */}
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2 z-30"
        style={{ left: `${destination.x}%`, top: `${destination.y}%` }}
      >
        <div className="relative">
          <div className="absolute inset-0 w-10 h-10 bg-green-400/30 rounded-full animate-ping" />
          <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center shadow-lg ring-[3px] ring-white relative z-10">
            <Hospital size={18} className="text-white" strokeWidth={2.5} />
          </div>
        </div>
      </div>

      {/* Vehicle marker */}
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2 z-40 transition-all duration-1000 ease-linear"
        style={{ left: `${vehiclePosition.x}%`, top: `${vehiclePosition.y}%` }}
      >
        <div className="relative">
          <div className="absolute inset-0 w-12 h-12 bg-emergency-400/20 rounded-full animate-ping" />
          <div className="w-12 h-12 bg-emergency-500 rounded-full flex items-center justify-center shadow-xl ring-[3px] ring-white relative z-10">
            <Ambulance size={22} className="text-white" strokeWidth={2.5} />
          </div>
        </div>
      </div>
    </div>
  );
}
