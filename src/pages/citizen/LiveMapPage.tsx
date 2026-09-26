import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';
import BottomNavigation from '@/components/BottomNavigation';
import BottomSheet from '@/components/BottomSheet';
import LeafletMap from '@/components/LeafletMap';
import { useApp } from '@/context/AppContext';
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
  const { mapState } = useApp();
  const safeOrigin = mapState?.origin || {
    lat: 21.2514,
    lng: 81.6296,
    name: 'Raipur Urban Center'
  };
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
        <div className="relative w-full h-[440px] rounded-2xl overflow-hidden shadow-card border border-slate-200">
          <LeafletMap
            origin={safeOrigin}
            destination={mapState.destination}
            primaryRoute={mapState.primaryRoute}
            alternativeRoutes={mapState.alternativeRoutes}
            vehicleLocation={safeOrigin}
            vehicleType={mapState.vehicleType}
            activeAmbulanceAlert={mapState.activeAmbulance}
            center={[safeOrigin.lat, safeOrigin.lng]}
            zoom={14}
            className="w-full h-full"
          />
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
              <button
                onClick={() => navigate('/navigate')}
                className="flex-1 btn-primary flex items-center justify-center gap-2"
              >
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
