import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Phone, X, Ambulance, Navigation, Clock, MapPin } from 'lucide-react';
import MapMock from '@/components/MapMock';
import StatusBadge from '@/components/StatusBadge';
import { useApp } from '@/context/AppContext';
import { fetchVehicles, cancelRequest } from '@/services/supabaseQueries';

export default function TrackAmbulancePage() {
  const navigate = useNavigate();
  const { currentRequest } = useApp();
  const [vehicle, setVehicle] = useState<{ code: string; driver_name: string; driver_phone: string; eta: string | null; distance: string | null } | null>(null);
  const [progress, setProgress] = useState(0);
  const [eta, setEta] = useState('05:42');

  useEffect(() => {
    (async () => {
      try {
        const vehicles = await fetchVehicles();
        const amb = vehicles.find((v: { code: string; type: string }) => v.code === (currentRequest?.vehicleId ?? 'A102'));
        if (amb) setVehicle(amb);
      } catch (err) {
        console.error('Failed to load vehicle:', err);
      }
    })();
  }, [currentRequest]);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => Math.min(100, p + 0.5));
    }, 200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const seconds = 342 - Math.floor(progress * 3.42);
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    setEta(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
  }, [progress]);

  const handleCancel = async () => {
    if (currentRequest) {
      try {
        await cancelRequest(currentRequest.id);
      } catch (err) {
        console.error('Failed to cancel request:', err);
      }
    }
    navigate('/citizen');
  };

  const vehicleCode = currentRequest?.vehicleId ?? vehicle?.code ?? 'A102';
  const driverName = vehicle?.driver_name ?? 'Driver';
  const driverPhone = vehicle?.driver_phone ?? '';

  return (
    <div className="mobile-container pb-24">
      {/* Header */}
      <div className="bg-navy-800 text-white px-5 pt-12 pb-5">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-white/80 active:scale-95">
            <ChevronLeft size={20} />
            <span className="text-sm">Back</span>
          </button>
          <StatusBadge status="" variant="warning" dot>
            En Route
          </StatusBadge>
        </div>
        <h1 className="text-xl font-bold mt-3">Ambulance Assigned</h1>
      </div>

      {/* Map */}
      <div className="px-5 -mt-2">
        <MapMock
          markers={[
            { id: 'amb', type: 'ambulance', label: vehicleCode, position: { x: 30, y: 35 } },
            { id: 'dest', type: 'hospital', label: 'City Hospital', position: { x: 60, y: 75 } },
          ]}
          showRoute
          className="h-72 shadow-card"
          animatedVehicle
        />
      </div>

      {/* Progress bar */}
      <div className="px-5 mt-3">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
          <span>Vehicle dispatched</span>
          <span>{Math.round(progress)}% complete</span>
          <span>Arrived</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 rounded-full transition-all duration-200" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Info Card */}
      <div className="px-5 mt-5">
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-emergency-500 flex items-center justify-center shadow-lg">
              <Ambulance size={28} className="text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-navy-800">Ambulance {vehicleCode}</h2>
              <p className="text-sm text-gray-500">{driverName} • {driverPhone}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <Clock size={18} className="text-navy-500 mx-auto mb-1" />
              <p className="text-xs text-gray-400">ETA</p>
              <p className="font-bold text-navy-800">{eta}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <MapPin size={18} className="text-navy-500 mx-auto mb-1" />
              <p className="text-xs text-gray-400">Distance</p>
              <p className="font-bold text-navy-800">{vehicle?.distance ?? '2.4 km'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <Navigation size={18} className="text-navy-500 mx-auto mb-1" />
              <p className="text-xs text-gray-400">Status</p>
              <p className="font-bold text-green-600 text-sm">On the way</p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-4">
            <a href={`tel:${driverPhone}`} className="flex-1 bg-green-500 text-white font-semibold rounded-xl py-3.5 flex items-center justify-center gap-2 active:scale-[0.98] hover:bg-green-600 transition-all">
              <Phone size={18} />
              Contact
            </a>
            <button
              onClick={handleCancel}
              className="flex-1 bg-emergency-50 text-emergency-600 font-semibold rounded-xl py-3.5 flex items-center justify-center gap-2 active:scale-[0.98] hover:bg-emergency-100 transition-all border border-emergency-200"
            >
              <X size={18} />
              Cancel Request
            </button>
          </div>
        </div>
      </div>

      {/* Approaching alert teaser */}
      <div className="px-5 mt-4">
        <button
          onClick={() => navigate('/citizen/alerts')}
          className="w-full bg-emergency-50 border border-emergency-200 rounded-xl p-4 flex items-center gap-3 active:scale-[0.98] transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-emergency-500 flex items-center justify-center animate-pulse">
            <Ambulance size={20} className="text-white" />
          </div>
          <div className="text-left flex-1">
            <p className="font-bold text-emergency-700 text-sm">Ambulance Approaching</p>
            <p className="text-xs text-emergency-600">350 m away • ETA 40 sec — Tap to view alert</p>
          </div>
          <span className="text-emergency-400 text-lg">›</span>
        </button>
      </div>
    </div>
  );
}
