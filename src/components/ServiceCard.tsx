import { Clock, MapPin } from 'lucide-react';
import type { NearbyService } from '@/types';
import StatusBadge from './StatusBadge';

interface ServiceCardProps {
  service: NearbyService;
  onClick?: () => void;
}

function getServiceInfo(service: NearbyService) {
  if (service.type === 'hospital') {
    const h = service as Extract<NearbyService, { type: 'hospital' }>;
    return {
      available: h.emergencyAvailable,
      availableLabel: h.emergencyAvailable ? 'Emergency: Available' : 'Emergency: Full',
      subInfo: `${h.beds} beds available`,
    };
  }
  if (service.type === 'fire_station') {
    const f = service as Extract<NearbyService, { type: 'fire_station' }>;
    return {
      available: f.available,
      availableLabel: f.available ? 'Available' : 'Busy',
      subInfo: `${f.vehicles} vehicles`,
    };
  }
  if (service.type === 'police_station') {
    const p = service as Extract<NearbyService, { type: 'police_station' }>;
    return {
      available: p.available,
      availableLabel: p.available ? 'Available' : 'Busy',
      subInfo: `${p.units} units`,
    };
  }
  const a = service as Extract<NearbyService, { type: 'ambulance_station' }>;
  return {
    available: a.available,
    availableLabel: a.available ? 'Available' : 'Busy',
    subInfo: `${a.ambulances} ambulances`,
  };
}

export default function ServiceCard({ service, onClick }: ServiceCardProps) {
  const info = getServiceInfo(service);

  return (
    <button
      onClick={onClick}
      className="card p-4 w-full text-left active:scale-[0.98] hover:shadow-card-hover transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-bold text-navy-800 text-base">{service.name}</h3>
        <StatusBadge
          status=""
          variant={info.available ? 'success' : 'error'}
          dot
        >
          {info.availableLabel}
        </StatusBadge>
      </div>
      <div className="flex items-center gap-3 text-sm text-gray-500">
        <span className="flex items-center gap-1">
          <MapPin size={14} />
          {service.distance}
        </span>
        <span className="flex items-center gap-1">
          <Clock size={14} />
          {service.eta}
        </span>
      </div>
      <p className="text-xs text-gray-400 mt-1">{info.subInfo}</p>
    </button>
  );
}
