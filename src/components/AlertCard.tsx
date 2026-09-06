import type { AlertItem } from '@/types';
import { Ambulance, Route, Hospital, TrafficCone, Siren } from 'lucide-react';

interface AlertCardProps {
  alert: AlertItem;
  onDismiss?: () => void;
}

const config = {
  ambulance_approaching: { icon: Ambulance, color: 'text-emergency-500', bg: 'bg-emergency-50', border: 'border-emergency-200' },
  route_update: { icon: Route, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200' },
  hospital_update: { icon: Hospital, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' },
  mission_update: { icon: Siren, color: 'text-emergency-500', bg: 'bg-emergency-50', border: 'border-emergency-200' },
  traffic_alert: { icon: TrafficCone, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200' },
};

const severityDot = {
  critical: 'bg-emergency-500',
  warning: 'bg-orange-500',
  info: 'bg-blue-500',
};

export default function AlertCard({ alert, onDismiss }: AlertCardProps) {
  const c = config[alert.type];
  const Icon = c.icon;

  return (
    <div className={`card p-4 border ${c.border} ${c.bg} animate-slide-up`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center shrink-0`}>
          <Icon size={20} className={c.color} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${severityDot[alert.severity]} animate-pulse`} />
            <h3 className="font-bold text-navy-800 text-sm">{alert.title}</h3>
          </div>
          <p className="text-sm text-gray-600 mt-0.5">{alert.message}</p>
          <div className="flex items-center gap-3 mt-2">
            {alert.distance && <span className="text-xs font-semibold text-emergency-600">{alert.distance}</span>}
            {alert.eta && <span className="text-xs font-semibold text-navy-600">ETA: {alert.eta}</span>}
            <span className="text-xs text-gray-400 ml-auto">{alert.timestamp}</span>
          </div>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600 shrink-0">
            <span className="text-lg">✕</span>
          </button>
        )}
      </div>
    </div>
  );
}
