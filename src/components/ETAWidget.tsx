import { Clock, Navigation } from 'lucide-react';

interface ETAWidgetProps {
  eta: string;
  distance?: string;
  label?: string;
}

export default function ETAWidget({ eta, distance, label = 'ETA' }: ETAWidgetProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-10 h-10 rounded-xl bg-navy-100 flex items-center justify-center">
        <Clock size={20} className="text-navy-600" />
      </div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="font-bold text-navy-800 text-lg leading-none">{eta}</p>
      </div>
      {distance && (
        <>
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center ml-2">
            <Navigation size={18} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Distance</p>
            <p className="font-bold text-navy-800 text-lg leading-none">{distance}</p>
          </div>
        </>
      )}
    </div>
  );
}
