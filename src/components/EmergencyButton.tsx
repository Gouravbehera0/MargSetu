import type { EmergencyServiceType } from '@/types';
import { Ambulance, Flame, Shield } from 'lucide-react';

interface EmergencyButtonProps {
  type: EmergencyServiceType;
  label: string;
  onClick?: () => void;
}

const config = {
  ambulance: { icon: Ambulance, bg: 'bg-emergency-500', hover: 'hover:bg-emergency-600', ring: 'ring-emergency-200' },
  fire: { icon: Flame, bg: 'bg-orange-500', hover: 'hover:bg-orange-600', ring: 'ring-orange-200' },
  police: { icon: Shield, bg: 'bg-navy-600', hover: 'hover:bg-navy-700', ring: 'ring-navy-200' },
};

export default function EmergencyButton({ type, label, onClick }: EmergencyButtonProps) {
  const c = config[type];
  const Icon = c.icon;

  return (
    <button
      onClick={onClick}
      className={`${c.bg} ${c.hover} text-white rounded-2xl p-4 flex items-center gap-4 shadow-card active:scale-[0.97] transition-all duration-200 w-full`}
    >
      <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
        <Icon size={26} className="text-white" strokeWidth={2.5} />
      </div>
      <span className="text-lg font-bold flex-1 text-left">{label}</span>
      <span className="text-2xl text-white/60">›</span>
    </button>
  );
}
