import { ArrowLeft, ArrowRight, ArrowUp, MapPin, Flag, Navigation } from 'lucide-react';
import type { TurnInstructionData } from '@/types';

interface TurnInstructionProps {
  instruction: TurnInstructionData;
  nextInstruction?: TurnInstructionData;
}

const directionConfig = {
  left: { icon: ArrowLeft, bg: 'bg-navy-600', label: 'Turn Left' },
  right: { icon: ArrowRight, bg: 'bg-navy-600', label: 'Turn Right' },
  straight: { icon: ArrowUp, bg: 'bg-blue-500', label: 'Continue' },
  arrive: { icon: Flag, bg: 'bg-green-500', label: 'Arrive' },
  depart: { icon: Navigation, bg: 'bg-navy-700', label: 'Depart' },
};

export default function TurnInstruction({ instruction, nextInstruction }: TurnInstructionProps) {
  const cfg = directionConfig[instruction.direction];
  const Icon = cfg.icon;

  return (
    <div className="bg-navy-800 text-white rounded-2xl p-3.5 shadow-lg flex items-center gap-3 animate-slide-down">
      <div className={`w-11 h-11 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}>
        <Icon size={24} className="text-white" strokeWidth={2.5} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-white/50 uppercase tracking-wide">{cfg.label}</p>
        <p className="font-bold text-sm leading-tight truncate">{instruction.text}</p>
      </div>
      {nextInstruction && nextInstruction.direction !== 'arrive' && (
        <div className="text-right shrink-0 border-l border-white/10 pl-3">
          <p className="text-[10px] text-white/40">Then</p>
          <p className="text-xs font-semibold text-white/70 truncate max-w-[100px]">{nextInstruction.text}</p>
        </div>
      )}
    </div>
  );
}
