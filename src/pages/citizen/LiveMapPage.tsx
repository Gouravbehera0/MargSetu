import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';
import BottomNavigation from '@/components/BottomNavigation';
import BottomSheet from '@/components/BottomSheet';
import { liveMapMarkers } from '@/data/mockData';
import type { MapMarker } from '@/types';
import { Ambulance, Flame, Shield, Hospital, Siren, MapPin, Navigation, Phone } from 'lucide-react';

const markerIcons = {
  user: MapPin,
  ambulance: Ambulance,
  fire: Flame,
  police: Shield,
  hospital: Hospital,
  fire_incident: Flame,
  emergency: Siren,
};

const markerColors = {
  user: 'bg-blue-500',
  ambulance: 'bg-emergency-500',
  fire: 'bg-orange-500',
  police: 'bg-navy-600',
  hospital: 'bg-green-600',
  fire_incident: 'bg-emergency-600',
  emergency: 'bg-emergency-500',
};

export default function LiveMapPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<MapMarker | null>(null);

  return (
    <div className="mobile-container pb-24">
      <AppHeader title="Live Map" showBack onBack={() => navigate('/citizen')} showNotification={false} />

      {/* Legend */}
      <div className="px-5 pt-4">
        <div className="flex gap-3 overflow-x-auto no-scrollbar">
          {Object.entries(markerColors).map(([key, color]) => {
            const Icon = markerIcons[key as keyof typeof markerIcons];
            if (key === 'user') return null;
            return (
              <div key={key} className="flex items-center gap-1.5 shrink-0">
                <div className={`w-5 h-5 rounded-full ${color} flex items-center justify-center`}>
                  <Icon size={10} className="text-white" />
                </div>
                <span className="text-xs text-gray-500 capitalize">{key.replace('_', ' ')}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Map */}
      <div className="px-5 pt-4">
        <div className="relative w-full h-[420px] rounded-2xl overflow-hidden bg-[#e8eef5] shadow-card">
          {/* Map background */}
          <div className="absolute inset-0">
            <div className="absolute top-1/2 left-0 right-0 h-3 bg-gray-300/60 -translate-y-1/2" />
            <div className="absolute top-0 bottom-0 left-1/2 w-3 bg-gray-300/60 -translate-x-1/2" />
            <div className="absolute top-[25%] left-0 right-0 h-2 bg-gray-300/40" />
            <div className="absolute top-0 bottom-0 left-[25%] w-2 bg-gray-300/40" />
            <div className="absolute top-0 bottom-0 left-[75%] w-2 bg-gray-300/40" />
            <div className="absolute top-[75%] left-0 right-0 h-2 bg-gray-300/40" />
            <div className="absolute top-[5%] left-[5%] w-[15%] h-[15%] bg-green-100/50 rounded-lg" />
            <div className="absolute top-[5%] right-[5%] w-[15%] h-[15%] bg-blue-100/40 rounded-lg" />
            <div className="absolute bottom-[5%] left-[5%] w-[15%] h-[15%] bg-orange-100/40 rounded-lg" />
            <div className="absolute bottom-[5%] right-[5%] w-[15%] h-[15%] bg-green-100/50 rounded-lg" />
            <div className="absolute top-[30%] left-[30%] w-[15%] h-[15%] bg-gray-200/40 rounded-lg" />
            <div className="absolute top-[55%] right-[30%] w-[15%] h-[15%] bg-gray-200/40 rounded-lg" />
            <div className="absolute top-[48%] left-[20%] w-2.5 h-2.5 bg-emergency-400 rounded-full animate-pulse" />
            <div className="absolute top-[48%] right-[30%] w-2.5 h-2.5 bg-orange-400 rounded-full" />
            <div className="absolute top-[22%] left-[48%] w-2.5 h-2.5 bg-green-400 rounded-full" />
          </div>

          {/* Markers */}
          {liveMapMarkers.map((marker) => {
            const Icon = markerIcons[marker.type];
            const color = markerColors[marker.type];
            const isUser = marker.type === 'user';
            return (
              <button
                key={marker.id}
                onClick={() => setSelected(marker)}
                className="absolute -translate-x-1/2 -translate-y-1/2 active:scale-90 transition-transform"
                style={{ left: `${marker.position.x}%`, top: `${marker.position.y}%` }}
              >
                {isUser ? (
                  <div className="relative">
                    <div className="absolute inset-0 w-7 h-7 bg-blue-400/30 rounded-full animate-ping" />
                    <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center shadow-lg ring-4 ring-white relative z-10">
                      <Icon size={14} className="text-white" />
                    </div>
                  </div>
                ) : (
                  <div className={`${color} w-9 h-9 rounded-full flex items-center justify-center shadow-lg ring-[3px] ring-white ${marker.type === 'fire_incident' || marker.type === 'emergency' ? 'animate-pulse' : ''}`}>
                    <Icon size={16} className="text-white" strokeWidth={2.5} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <BottomNavigation variant="citizen" />

      <BottomSheet open={!!selected} onClose={() => setSelected(null)}>
        {selected && (
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-12 h-12 rounded-xl ${markerColors[selected.type]} flex items-center justify-center`}>
                {(() => {
                  const Icon = markerIcons[selected.type];
                  return <Icon size={24} className="text-white" strokeWidth={2.5} />;
                })()}
              </div>
              <div>
                <h2 className="text-lg font-bold text-navy-800">{selected.label}</h2>
                {selected.status && <p className="text-sm text-gray-500">Status: {selected.status}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {selected.distance && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400">Distance</p>
                  <p className="font-bold text-navy-800">{selected.distance}</p>
                </div>
              )}
              {selected.eta && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400">ETA</p>
                  <p className="font-bold text-navy-800">{selected.eta}</p>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-4">
              <button className="flex-1 btn-primary flex items-center justify-center gap-2">
                <Navigation size={18} />
                Navigate
              </button>
              <button className="flex-1 bg-green-500 text-white font-semibold rounded-xl py-3.5 flex items-center justify-center gap-2 active:scale-[0.98] hover:bg-green-600">
                <Phone size={18} />
                Call
              </button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
