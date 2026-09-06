import type { MapMarker } from '@/types';
import { Ambulance, Flame, Shield, Hospital, MapPin, Siren } from 'lucide-react';

interface MapMockProps {
  markers?: MapMarker[];
  showRoute?: boolean;
  routeColor?: string;
  showUser?: boolean;
  className?: string;
  animatedVehicle?: boolean;
}

const markerConfig = {
  user: { icon: MapPin, bg: 'bg-blue-500', size: 28 },
  ambulance: { icon: Ambulance, bg: 'bg-emergency-500', size: 26 },
  fire: { icon: Flame, bg: 'bg-orange-500', size: 26 },
  police: { icon: Shield, bg: 'bg-navy-600', size: 26 },
  hospital: { icon: Hospital, bg: 'bg-green-600', size: 28 },
  fire_incident: { icon: Flame, bg: 'bg-emergency-600', size: 26 },
  emergency: { icon: Siren, bg: 'bg-emergency-500', size: 26 },
};

export default function MapMock({
  markers = [],
  showRoute = false,
  routeColor = 'bg-green-500',
  showUser = true,
  className = '',
  animatedVehicle = false,
}: MapMockProps) {
  const userMarker: MapMarker = {
    id: 'user',
    type: 'user',
    label: 'You',
    position: { x: 50, y: 55 },
  };

  const allMarkers = showUser ? [userMarker, ...markers] : markers;

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden bg-[#e8eef5] ${className}`}>
      {/* Map background pattern */}
      <div className="absolute inset-0">
        {/* Roads */}
        <div className="absolute top-1/2 left-0 right-0 h-3 bg-gray-300/60 -translate-y-1/2" />
        <div className="absolute top-0 bottom-0 left-1/2 w-3 bg-gray-300/60 -translate-x-1/2" />
        <div className="absolute top-[25%] left-0 right-0 h-2 bg-gray-300/40" />
        <div className="absolute top-0 bottom-0 left-[25%] w-2 bg-gray-300/40" />
        <div className="absolute top-0 bottom-0 left-[75%] w-2 bg-gray-300/40" />
        <div className="absolute top-[75%] left-0 right-0 h-2 bg-gray-300/40" />

        {/* Blocks */}
        <div className="absolute top-[5%] left-[5%] w-[15%] h-[15%] bg-green-100/50 rounded-lg" />
        <div className="absolute top-[5%] right-[5%] w-[15%] h-[15%] bg-blue-100/40 rounded-lg" />
        <div className="absolute bottom-[5%] left-[5%] w-[15%] h-[15%] bg-orange-100/40 rounded-lg" />
        <div className="absolute bottom-[5%] right-[5%] w-[15%] h-[15%] bg-green-100/50 rounded-lg" />
        <div className="absolute top-[30%] left-[30%] w-[15%] h-[15%] bg-gray-200/40 rounded-lg" />
        <div className="absolute top-[55%] right-[30%] w-[15%] h-[15%] bg-gray-200/40 rounded-lg" />

        {/* Traffic indicators */}
        <div className="absolute top-[48%] left-[20%] w-2.5 h-2.5 bg-emergency-400 rounded-full animate-pulse" />
        <div className="absolute top-[48%] right-[30%] w-2.5 h-2.5 bg-orange-400 rounded-full" />
        <div className="absolute top-[22%] left-[48%] w-2.5 h-2.5 bg-green-400 rounded-full" />
      </div>

      {/* Route line */}
      {showRoute && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
          <path
            d="M 50% 55% Q 40% 45%, 35% 40% T 30% 35%"
            fill="none"
            stroke={routeColor === 'bg-green-500' ? '#22c55e' : '#ef4444'}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="6 4"
            className="animate-pulse"
          />
        </svg>
      )}

      {/* Markers */}
      {allMarkers.map((marker) => {
        const cfg = markerConfig[marker.type];
        const Icon = cfg.icon;
        const isUser = marker.type === 'user';

        return (
          <div
            key={marker.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-500"
            style={{ left: `${marker.position.x}%`, top: `${marker.position.y}%` }}
          >
            {isUser ? (
              <div className="relative">
                <div className="absolute inset-0 w-7 h-7 bg-blue-400/30 rounded-full animate-ping" />
                <div className={`w-7 h-7 ${cfg.bg} rounded-full flex items-center justify-center shadow-lg ring-4 ring-white relative z-10`}>
                  <Icon size={16} className="text-white" />
                </div>
              </div>
            ) : (
              <div className={`w-${cfg.size <= 26 ? '9' : '10'} h-${cfg.size <= 26 ? '9' : '10'} ${cfg.bg} rounded-full flex items-center justify-center shadow-lg ring-[3px] ring-white ${animatedVehicle && marker.type === 'ambulance' ? 'animate-pulse' : ''}`}>
                <Icon size={18} className="text-white" strokeWidth={2.5} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
