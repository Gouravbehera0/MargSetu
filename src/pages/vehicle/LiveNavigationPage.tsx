import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Ambulance, Navigation, RefreshCw, ChevronDown, ChevronUp, Hospital, Clock, MapPin, Gauge } from 'lucide-react';
import EmergencyNavigationMap from '@/components/EmergencyNavigationMap';
import TurnInstruction from '@/components/TurnInstruction';
import StatusBadge from '@/components/StatusBadge';
import { useApp } from '@/context/AppContext';
import { getDefaultNavigationRoute, getNavigationSimState } from '@/services/mockServices';
import { navigationIncidents, navigationTrafficSegments, destinationPosition } from '@/data/navigationData';
import type { NavigationRoute } from '@/types';

const trafficLabel: Record<string, { text: string; color: string; dot: string }> = {
  low: { text: 'Low', color: 'text-green-600', dot: 'bg-green-500' },
  moderate: { text: 'Moderate', color: 'text-orange-600', dot: 'bg-orange-500' },
  high: { text: 'High', color: 'text-emergency-600', dot: 'bg-emergency-500' },
};

export default function LiveNavigationPage() {
  const navigate = useNavigate();
  const { activeRoute, setActiveRoute, showToast } = useApp();
  const [progress, setProgress] = useState(0);
  const [cardExpanded, setCardExpanded] = useState(true);
  const [routeKey, setRouteKey] = useState(0);
  const initialized = useRef(false);

  const route: NavigationRoute = activeRoute ?? getDefaultNavigationRoute();

  useEffect(() => {
    if (!activeRoute && !initialized.current) {
      initialized.current = true;
      setActiveRoute(getDefaultNavigationRoute());
    }
  }, [activeRoute, setActiveRoute]);

  useEffect(() => {
    setProgress(0);
    setRouteKey((k) => k + 1);
  }, [route.id]);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => Math.min(100, p + 0.4));
    }, 300);
    return () => clearInterval(interval);
  }, [routeKey]);

  const simState = getNavigationSimState(route, progress);
  const currentInstruction = route.instructions[simState.currentInstructionIndex];
  const nextInstruction = route.instructions[simState.currentInstructionIndex + 1];
  const traffic = trafficLabel[route.traffic];
  const isArrived = progress >= 100;

  const handleReroute = () => {
    navigate('/vehicle/reroute');
  };

  const handleBack = () => {
    navigate('/vehicle');
  };

  return (
    <div className="mobile-container relative flex flex-col overflow-hidden" style={{ minHeight: '100dvh' }}>
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-navy-800 text-white px-4 pt-12 pb-3 rounded-b-2xl shadow-lg">
        <div className="flex items-center gap-3">
          <button onClick={handleBack} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center active:scale-90 shrink-0">
            <ChevronLeft size={20} className="text-white" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white/60">Navigating to</p>
            <p className="font-bold text-sm truncate">City Hospital</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-emergency-500 flex items-center justify-center">
              <Ambulance size={14} className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-white">A102</span>
              <span className="text-[9px] text-emergency-400">Emergency</span>
            </div>
          </div>
        </div>
      </div>

      {/* Map area */}
      <div className="absolute inset-0">
        <EmergencyNavigationMap
          key={routeKey}
          route={route}
          vehiclePosition={simState.position}
          destination={destinationPosition}
          trafficData={navigationTrafficSegments}
          incidents={navigationIncidents}
          progress={progress}
          className="w-full h-full"
        />
      </div>

      {/* Turn instruction overlay */}
      <div className="absolute top-[88px] left-3 right-3 z-40">
        {currentInstruction && !isArrived && (
          <TurnInstruction instruction={currentInstruction} nextInstruction={nextInstruction} />
        )}
        {isArrived && (
          <div className="bg-green-500 text-white rounded-2xl p-3.5 shadow-lg flex items-center gap-3 animate-scale-in">
            <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Hospital size={24} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-bold text-sm">Arrived at Destination</p>
              <p className="text-xs text-white/80">City Hospital — Safe arrival</p>
            </div>
          </div>
        )}
      </div>

      {/* Progress bar overlay */}
      <div className="absolute top-[150px] left-3 right-3 z-30">
        <div className="bg-white/90 backdrop-blur rounded-xl px-3 py-2 shadow-card">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-500 font-medium">Route Progress</span>
            <span className="text-navy-700 font-bold">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emergency-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Bottom navigation info card */}
      <div className="absolute bottom-0 left-0 right-0 z-40">
        <div className="bg-white rounded-t-3xl shadow-2xl pb-5 px-5 pt-3 animate-slide-up">
          {/* Handle */}
          <button
            onClick={() => setCardExpanded((v) => !v)}
            className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-3 active:scale-95"
          />

          {/* Collapsed view */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emergency-500 flex items-center justify-center shrink-0">
              <Ambulance size={24} className="text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-navy-800 text-sm">Ambulance A102</h2>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-navy-700 font-bold">
                  <Clock size={12} />
                  {isArrived ? 'Arrived' : simState.eta}
                </span>
                <span className="flex items-center gap-1 text-gray-500">
                  <MapPin size={12} />
                  {simState.remainingDistance}
                </span>
                <span className={`flex items-center gap-1 font-semibold ${traffic.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${traffic.dot}`} />
                  {traffic.text}
                </span>
              </div>
            </div>
            <button
              onClick={() => setCardExpanded((v) => !v)}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center active:scale-90 shrink-0"
            >
              {cardExpanded ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronUp size={18} className="text-gray-400" />}
            </button>
          </div>

          {/* Expanded view */}
          {cardExpanded && (
            <div className="mt-4 animate-slide-up">
              {/* Route info grid */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                  <Clock size={16} className="text-navy-500 mx-auto mb-0.5" />
                  <p className="text-[10px] text-gray-400">ETA</p>
                  <p className="font-bold text-navy-800 text-sm">{isArrived ? 'Done' : route.eta}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                  <MapPin size={16} className="text-navy-500 mx-auto mb-0.5" />
                  <p className="text-[10px] text-gray-400">Distance</p>
                  <p className="font-bold text-navy-800 text-sm">{route.distance}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                  <Gauge size={16} className="text-navy-500 mx-auto mb-0.5" />
                  <p className="text-[10px] text-gray-400">Traffic</p>
                  <p className={`font-bold text-sm ${traffic.color}`}>{traffic.text}</p>
                </div>
              </div>

              {/* Active route badge */}
              <div className="flex items-center justify-between mb-3 px-3 py-2 bg-navy-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <Navigation size={14} className="text-navy-500" />
                  <span className="text-xs font-semibold text-navy-700">Active Route</span>
                </div>
                <span className="text-sm font-bold text-navy-800">{route.name}</span>
              </div>

              {/* Destination */}
              <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-green-50 rounded-xl">
                <Hospital size={16} className="text-green-600 shrink-0" />
                <span className="text-xs text-gray-500">Destination:</span>
                <span className="text-sm font-bold text-navy-800">City Hospital</span>
              </div>

              {/* Reroute button */}
              <button
                onClick={handleReroute}
                disabled={isArrived}
                className="w-full bg-orange-50 text-orange-600 font-bold rounded-xl py-3.5 flex items-center justify-center gap-2 active:scale-[0.98] hover:bg-orange-100 border border-orange-200 transition-all disabled:opacity-50"
              >
                <RefreshCw size={18} />
                REROUTE
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
