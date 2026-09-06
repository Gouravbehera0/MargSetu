import type { Vehicle } from '@/types';
import { Ambulance, Flame, Shield, Phone } from 'lucide-react';
import StatusBadge from './StatusBadge';

interface VehicleCardProps {
  vehicle: Vehicle;
  onContact?: () => void;
  onClick?: () => void;
}

const typeConfig = {
  ambulance: { icon: Ambulance, color: 'bg-emergency-500' },
  fire: { icon: Flame, color: 'bg-orange-500' },
  police: { icon: Shield, color: 'bg-navy-600' },
};

export default function VehicleCard({ vehicle, onContact, onClick }: VehicleCardProps) {
  const cfg = typeConfig[vehicle.type];
  const Icon = cfg.icon;

  const statusVariant = vehicle.status === 'online' ? 'success' : vehicle.status === 'on_mission' ? 'warning' : 'neutral';
  const statusLabel = vehicle.status === 'online' ? 'Online' : vehicle.status === 'on_mission' ? 'On Mission' : 'Offline';

  return (
    <div className="card p-4 active:scale-[0.98] hover:shadow-card-hover transition-all duration-200" onClick={onClick}>
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-xl ${cfg.color} flex items-center justify-center shrink-0`}>
          <Icon size={24} className="text-white" strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-navy-800">{vehicle.code}</h3>
            <StatusBadge status={statusLabel} variant={statusVariant} dot />
          </div>
          <p className="text-sm text-gray-500">{vehicle.driverName}</p>
          {vehicle.eta && vehicle.distance && (
            <div className="flex items-center gap-3 mt-1 text-xs">
              <span className="text-navy-600 font-semibold">ETA {vehicle.eta}</span>
              <span className="text-gray-400">{vehicle.distance}</span>
            </div>
          )}
        </div>
        {onContact && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onContact();
            }}
            className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center active:scale-90 transition-transform shrink-0"
          >
            <Phone size={18} className="text-green-600" />
          </button>
        )}
      </div>
    </div>
  );
}
