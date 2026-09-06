import type { RouteOption } from '@/types';
import { Clock, MapPin, Check } from 'lucide-react';

interface RouteCardProps {
  route: RouteOption;
  onSelect?: () => void;
  selected?: boolean;
}

const trafficConfig = {
  low: { label: 'Low Traffic', color: 'text-green-600 bg-green-100' },
  moderate: { label: 'Moderate Traffic', color: 'text-orange-600 bg-orange-100' },
  high: { label: 'High Traffic', color: 'text-emergency-600 bg-emergency-100' },
};

export default function RouteCard({ route, onSelect, selected }: RouteCardProps) {
  const traffic = trafficConfig[route.traffic];

  return (
    <button
      onClick={onSelect}
      className={`card p-4 w-full text-left transition-all duration-200 active:scale-[0.98] ${
        selected || route.recommended ? 'ring-2 ring-navy-400' : ''
      } hover:shadow-card-hover`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-navy-800 text-lg">{route.name}</span>
          {route.recommended && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500 text-white">
              RECOMMENDED
            </span>
          )}
        </div>
        {(selected || route.recommended) && (
          <div className="w-6 h-6 rounded-full bg-navy-600 flex items-center justify-center">
            <Check size={14} className="text-white" strokeWidth={3} />
          </div>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-navy-700">
          <Clock size={16} className="text-gray-400" />
          <span className="font-semibold">{route.duration}</span>
        </div>
        <div className="flex items-center gap-1.5 text-navy-700">
          <MapPin size={16} className="text-gray-400" />
          <span className="font-semibold">{route.distance}</span>
        </div>
      </div>
      <span className={`inline-block mt-2 px-2.5 py-1 rounded-full text-xs font-semibold ${traffic.color}`}>
        {traffic.label}
      </span>
    </button>
  );
}
