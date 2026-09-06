import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, AlertTriangle, Clock, ArrowDown, Check, X } from 'lucide-react';
import MapMock from '@/components/MapMock';
import LoadingState from '@/components/LoadingState';
import { mockRerouteService } from '@/services/mockServices';
import { useApp } from '@/context/AppContext';
import type { NavigationRoute } from '@/types';

interface RerouteResult {
  previousETA: string;
  newETA: string;
  reason: string;
  newRoute: NavigationRoute;
}

export default function DynamicReroutingPage() {
  const navigate = useNavigate();
  const { activeRoute, setActiveRoute, showToast } = useApp();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<RerouteResult | null>(null);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    mockRerouteService().then((res) => {
      setData(res);
      setLoading(false);
    });
  }, []);

  const handleAccept = () => {
    if (data) {
      setActiveRoute(data.newRoute);
      showToast(`Route updated — Faster route selected. ETA reduced to ${data.newETA}.`, 'success');
    }
    setAccepted(true);
    setTimeout(() => navigate('/vehicle/navigation'), 800);
  };

  return (
    <div className="mobile-container pb-24">
      {/* Header */}
      <div className="bg-navy-800 text-white px-5 pt-12 pb-6 rounded-b-3xl">
        <button onClick={() => navigate('/vehicle/navigation')} className="flex items-center gap-1 text-white/80 active:scale-95 mb-4">
          <ChevronLeft size={20} />
          <span className="text-sm">Back to Navigation</span>
        </button>
        <h1 className="text-xl font-bold">Route Update</h1>
      </div>

      {loading ? (
        <div className="pt-8">
          <LoadingState message="Analyzing traffic..." subMessage="Finding faster alternatives" />
        </div>
      ) : accepted ? (
        <div className="flex flex-col items-center justify-center pt-20 animate-scale-in">
          <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
            <Check size={40} className="text-white" strokeWidth={3} />
          </div>
          <h2 className="text-xl font-bold text-navy-800 mt-4">Route Updated!</h2>
          <p className="text-sm text-gray-500 mt-1">Returning to live navigation...</p>
        </div>
      ) : (
        data && (
          <>
            {/* Accident illustration */}
            <div className="px-5 pt-5">
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                  <AlertTriangle size={32} className="text-orange-500" />
                </div>
                <p className="text-sm font-semibold text-orange-700 mt-3 text-center">{data.reason}</p>
              </div>
            </div>

            {/* ETA comparison */}
            <div className="px-5 pt-5">
              <div className="card p-5">
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <p className="text-xs text-gray-400 mb-1">Previous ETA</p>
                    <p className="text-2xl font-bold text-gray-400 line-through">{data.previousETA}</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <ArrowDown size={24} className="text-green-500" />
                    <span className="text-xs text-green-600 font-semibold mt-1">Faster</span>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400 mb-1">New ETA</p>
                    <p className="text-2xl font-bold text-green-600">{data.newETA}</p>
                  </div>
                </div>
                <div className="mt-4 bg-green-50 rounded-xl p-3 flex items-center gap-2">
                  <Check size={16} className="text-green-600" />
                  <p className="text-sm font-semibold text-green-700">Faster route available — {data.newRoute.name}</p>
                </div>
                <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                  <span>New distance: <span className="font-bold text-navy-700">{data.newRoute.distance}</span></span>
                  <span>Traffic: <span className="font-bold text-green-600 capitalize">{data.newRoute.traffic}</span></span>
                </div>
              </div>
            </div>

            {/* Map preview */}
            <div className="px-5 pt-4">
              <MapMock
                markers={[
                  { id: 'amb', type: 'ambulance', label: 'A102', position: { x: 30, y: 35 } },
                  { id: 'hosp', type: 'hospital', label: 'City Hospital', position: { x: 60, y: 75 } },
                ]}
                showRoute
                className="h-40 shadow-card"
                animatedVehicle
              />
            </div>

            {/* Buttons */}
            <div className="px-5 pt-5 space-y-3">
              <button
                onClick={handleAccept}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Check size={20} />
                Accept New Route
              </button>
              <button
                onClick={() => navigate('/vehicle/navigation')}
                className="w-full bg-gray-100 text-gray-600 font-semibold rounded-xl py-3.5 active:scale-[0.98] hover:bg-gray-200"
              >
                Not Now
              </button>
            </div>
          </>
        )
      )}
    </div>
  );
}
