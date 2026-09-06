import { Siren, ArrowDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface EmergencyAlertModalProps {
  open: boolean;
  onClose?: () => void;
  vehicleType?: string;
  distance?: string;
  eta?: string;
  direction?: string;
}

export default function EmergencyAlertModal({
  open,
  onClose,
  vehicleType = 'AMBULANCE',
  distance = '350 meters',
  eta = '40 seconds',
  direction = 'North → South',
}: EmergencyAlertModalProps) {
  const navigate = useNavigate();
  if (!open) return null;

  const handleClose = () => {
    onClose?.();
    navigate(-1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-emergency-900/95 animate-fade-in">
      <div className="absolute inset-0 bg-gradient-to-b from-emergency-800/90 to-emergency-900/95" />

      {/* Pulsing background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="w-72 h-72 bg-emergency-500/20 rounded-full animate-ping-slow" />
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="w-48 h-48 bg-emergency-500/30 rounded-full animate-pulse-slow" />
      </div>

      <div className="relative z-10 w-full max-w-sm px-6 text-center animate-scale-in">
        <div className="w-24 h-24 mx-auto rounded-full bg-emergency-500 flex items-center justify-center shadow-2xl animate-pulse">
          <Siren size={48} className="text-white" strokeWidth={2.5} />
        </div>

        <p className="text-emergency-200 font-bold text-sm tracking-widest mt-6">EMERGENCY ALERT</p>
        <h1 className="text-3xl font-extrabold text-white mt-2">{vehicleType} APPROACHING</h1>

        <div className="mt-8 space-y-3">
          <div className="bg-white/10 backdrop-blur rounded-xl p-3 flex items-center justify-between">
            <span className="text-emergency-100 text-sm">Distance</span>
            <span className="text-white font-bold text-lg">{distance}</span>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-3 flex items-center justify-between">
            <span className="text-emergency-100 text-sm">ETA</span>
            <span className="text-white font-bold text-lg">{eta}</span>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-3 flex items-center justify-between">
            <span className="text-emergency-100 text-sm">Direction</span>
            <span className="text-white font-bold text-lg flex items-center gap-1">
              {direction}
              <ArrowDown size={16} className="rotate-[-90deg]" />
            </span>
          </div>
        </div>

        <p className="text-emergency-100 font-semibold mt-6 text-lg">
          Please give way and keep the road clear.
        </p>

        <button
          onClick={handleClose}
          className="w-full mt-8 bg-white text-emergency-700 font-bold rounded-xl py-4 text-lg active:scale-[0.98] hover:bg-emergency-50 transition-all"
        >
          GOT IT
        </button>
      </div>
    </div>
  );
}
