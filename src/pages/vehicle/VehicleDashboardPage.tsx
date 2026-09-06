import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';
import BottomNavigation from '@/components/BottomNavigation';
import MapMock from '@/components/MapMock';
import StatusBadge from '@/components/StatusBadge';
import { useApp } from '@/context/AppContext';
import { fetchVehicles } from '@/services/supabaseQueries';
import { Navigation, RefreshCw, Clock, MapPin, AlertTriangle, Gauge, Activity } from 'lucide-react';

export default function VehicleDashboardPage() {
  const navigate = useNavigate();
  const { user } = useApp();
  const [vehicle, setVehicle] = useState<{ code: string; status: string; driver_name: string; eta: string | null; distance: string | null } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const vehicles = await fetchVehicles();
        const code = user?.vehicleCode ?? 'A102';
        const v = vehicles.find((veh: { code: string }) => veh.code === code) ?? vehicles[0];
        if (v) setVehicle(v);
      } catch (err) {
        console.error('Failed to load vehicle:', err);
      }
    })();
  }, [user]);

  const vehicleCode = vehicle?.code ?? user?.vehicleCode ?? 'A102';
  const driverName = vehicle?.driver_name ?? user?.name ?? 'Driver';
  const isOnline = vehicle?.status === 'online';
  const isOnMission = vehicle?.status === 'on_mission';

  return (
    <div className="mobile-container pb-24">
      <AppHeader showBack onBack={() => navigate('/vehicle/profile')} showNotification={false} />

      {/* Vehicle status header */}
      <div className="px-5 -mt-2">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-emergency-500 flex items-center justify-center shadow-lg">
            <Navigation size={28} className="text-white" strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-navy-800">Ambulance {vehicleCode}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <StatusBadge status="" variant={isOnline ? 'success' : isOnMission ? 'warning' : 'neutral'} dot>
                {isOnline ? 'Online' : isOnMission ? 'On Mission' : 'Offline'}
              </StatusBadge>
              <span className="text-xs text-gray-400">{driverName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Current mission */}
      <div className="px-5 pt-4">
        <div className="bg-navy-800 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <Activity size={16} className="text-emergency-400" />
            <span className="text-sm text-white/70 font-semibold">Current Mission</span>
          </div>
          <h2 className="text-lg font-bold">Medical Emergency — Master Canteen</h2>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-xs text-white/50">Emergency Type</p>
              <p className="font-bold text-sm">Medical</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-xs text-white/50">Priority</p>
              <p className="font-bold text-sm text-emergency-400">High</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-xs text-white/50">Destination</p>
              <p className="font-bold text-sm">City Hospital</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-xs text-white/50">Status</p>
              <p className="font-bold text-sm text-yellow-400">En Route</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-5 pt-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-3 text-center">
            <Clock size={18} className="text-navy-500 mx-auto mb-1" />
            <p className="text-xs text-gray-400">ETA</p>
            <p className="font-bold text-navy-800">{vehicle?.eta ?? '05:42'}</p>
          </div>
          <div className="card p-3 text-center">
            <MapPin size={18} className="text-navy-500 mx-auto mb-1" />
            <p className="text-xs text-gray-400">Distance</p>
            <p className="font-bold text-navy-800">{vehicle?.distance ?? '2.4 km'}</p>
          </div>
          <div className="card p-3 text-center">
            <Gauge size={18} className="text-orange-500 mx-auto mb-1" />
            <p className="text-xs text-gray-400">Traffic</p>
            <p className="font-bold text-orange-600 text-sm">Moderate</p>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="px-5 pt-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-navy-700">Route: Ambulance → Hospital</h3>
          <button onClick={() => navigate('/vehicle/optimization')} className="text-xs text-navy-500 font-semibold">
            View QPSO
          </button>
        </div>
        <MapMock
          markers={[
            { id: 'amb', type: 'ambulance', label: vehicleCode, position: { x: 30, y: 35 } },
            { id: 'hosp', type: 'hospital', label: 'City Hospital', position: { x: 60, y: 75 } },
          ]}
          showRoute
          className="h-56 shadow-card"
          animatedVehicle
        />
      </div>

      {/* Action buttons */}
      <div className="px-5 pt-4 space-y-3">
        <button
          onClick={() => navigate('/vehicle/optimization')}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <Navigation size={20} />
          Start Navigation
        </button>
        <button
          onClick={() => navigate('/vehicle/navigation')}
          className="w-full bg-orange-50 text-orange-600 font-semibold rounded-xl py-3.5 flex items-center justify-center gap-2 active:scale-[0.98] hover:bg-orange-100 border border-orange-200"
        >
          <RefreshCw size={18} />
          Request Reroute
        </button>
      </div>

      {/* Traffic alert */}
      <div className="px-5 pt-4">
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-center gap-3">
          <AlertTriangle size={20} className="text-orange-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-orange-700">Traffic Ahead</p>
            <p className="text-xs text-orange-600">Accident on Janpath Road — Reroute recommended</p>
          </div>
          </div>
      </div>

      <BottomNavigation variant="vehicle" />
    </div>
  );
}
