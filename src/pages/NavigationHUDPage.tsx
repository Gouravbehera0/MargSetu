import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import NavigationNavbar from '@/components/NavigationNavbar';
import LeafletMap from '@/components/LeafletMap';
import type { GeoPoint, GeneralVehicleType } from '@/types';
import {
  Navigation,
  ArrowUp,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  TrendingDown,
  Compass,
  Gauge
} from 'lucide-react';

interface TurnStep {
  id: string;
  instruction: string;
  distance: string;
  road: string;
  direction: 'straight' | 'right' | 'left' | 'arrive';
}

export default function NavigationHUDPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const navState = (location.state as any) || {};

  const origin: GeoPoint = navState.origin || {
    lat: 21.2514,
    lng: 81.6296,
    name: 'Jaistambh Chowk, Raipur'
  };

  const destination: GeoPoint = navState.destination || {
    lat: 21.25586,
    lng: 81.62954,
    name: 'Raipur Junction Railway Station'
  };

  const vehicleType: GeneralVehicleType = navState.vehicleType || 'car';
  const initialEta = navState.etaMinutes || 14;
  const initialDist = navState.distanceKm || 6.8;

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [speedKmh, setSpeedKmh] = useState(48);
  const [etaMinutes, setEtaMinutes] = useState(initialEta);
  const [remainingDistanceKm, setRemainingDistanceKm] = useState(initialDist);
  const [muted, setMuted] = useState(false);

  // Dynamic Rerouting state
  const [rerouteAlert, setRerouteAlert] = useState<{
    active: boolean;
    reason: string;
    oldEta: number;
    newEta: number;
    timeSaved: number;
  }>({
    active: false,
    reason: '',
    oldEta: initialEta,
    newEta: Math.max(1, Math.round(initialEta * 0.7)),
    timeSaved: Math.max(2, Math.round(initialEta * 0.3))
  });

  // Dynamic turn-by-turn guidance steps contextual to origin and destination
  const originLabel = origin.name ? origin.name.split(',')[0] : 'Origin Point';
  const destLabel = destination.name ? destination.name.split(',')[0] : 'Destination Point';

  const turnSteps: TurnStep[] = [
    {
      id: '1',
      instruction: `Depart from ${originLabel}`,
      distance: '350 m',
      road: `${originLabel} Main Connector`,
      direction: 'straight'
    },
    {
      id: '2',
      instruction: 'Turn right onto Central Highway Link',
      distance: '1.2 km',
      road: 'Highway Expressway Link',
      direction: 'right'
    },
    {
      id: '3',
      instruction: 'Continue straight on QPSO Quantum-Optimized Corridor',
      distance: '2.5 km',
      road: 'Arterial Ring Corridor',
      direction: 'straight'
    },
    {
      id: '4',
      instruction: `Turn left towards ${destLabel} Approach`,
      distance: '650 m',
      road: `${destLabel} Access Road`,
      direction: 'left'
    },
    {
      id: '5',
      instruction: `Arrive at ${destLabel}`,
      distance: '0 m',
      road: `${destLabel} Terminal Entrance`,
      direction: 'arrive'
    }
  ];

  // Route coordinates: use passed polyline if available, or generate a realistic fallback
  const initialCoordinates: [number, number][] =
    navState.polyline && navState.polyline.length > 2
      ? navState.polyline
      : [
          [origin.lat, origin.lng],
          [origin.lat + (destination.lat - origin.lat) * 0.3, origin.lng + (destination.lng - origin.lng) * 0.25],
          [origin.lat + (destination.lat - origin.lat) * 0.65, origin.lng + (destination.lng - origin.lng) * 0.7],
          [destination.lat, destination.lng]
        ];

  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>(initialCoordinates);

  // Vehicle location moves along route coordinates
  const vehicleLocation: GeoPoint =
    routeCoordinates.length > currentStepIndex
      ? {
          lat: routeCoordinates[Math.min(currentStepIndex, routeCoordinates.length - 1)][0],
          lng: routeCoordinates[Math.min(currentStepIndex, routeCoordinates.length - 1)][1],
          name: 'Your Vehicle'
        }
      : origin;

  // Simulate turn step progression
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStepIndex((prev) => (prev < turnSteps.length - 1 ? prev + 1 : prev));
      setRemainingDistanceKm((prev) => Math.max(0.2, Number((prev - 1.1).toFixed(1))));
      setEtaMinutes((prev) => Math.max(1, prev - 2));
      setSpeedKmh(Math.floor(42 + Math.random() * 12));
    }, 10000);

    return () => clearInterval(timer);
  }, [turnSteps.length]);

  // Simulate a dynamic rerouting event after 6 seconds to demonstrate real-time bypass
  useEffect(() => {
    const rerouteTimer = setTimeout(() => {
      setRerouteAlert({
        active: true,
        reason: `Sudden congestion spike ahead on Central Link. Faster bypass discovered via QPSO Metaheuristic detour towards ${destLabel}.`,
        oldEta: etaMinutes,
        newEta: Math.max(2, Math.round(etaMinutes * 0.7)),
        timeSaved: Math.max(2, Math.round(etaMinutes * 0.3))
      });
    }, 6000);

    return () => clearTimeout(rerouteTimer);
  }, []);

  function handleAcceptReroute() {
    setEtaMinutes(rerouteAlert.newEta);
    setRemainingDistanceKm((prev) => Math.max(0.8, Number((prev * 0.85).toFixed(1))));
    setRerouteAlert({ ...rerouteAlert, active: false });
  }

  function handleDismissReroute() {
    setRerouteAlert({ ...rerouteAlert, active: false });
  }

  const currentStep = turnSteps[currentStepIndex];

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col font-sans">
      <NavigationNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col space-y-4">
        {/* Dynamic Reroute Toast / Modal */}
        {rerouteAlert.active && (
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-4 sm:p-5 shadow-2xl border-2 border-emerald-400 animate-bounceOnce flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/20 rounded-xl">
                <Sparkles className="w-6 h-6 text-white animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-sm sm:text-base tracking-wide">
                    Better Route Available
                  </span>
                  <span className="bg-white/20 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                    QPSO Real-Time
                  </span>
                </div>
                <p className="text-xs text-emerald-100 mt-1 max-w-xl">
                  {rerouteAlert.reason}
                </p>
                <div className="flex items-center space-x-4 mt-2 text-xs font-bold">
                  <span className="line-through text-emerald-200">Old ETA: {rerouteAlert.oldEta} min</span>
                  <span className="text-white flex items-center bg-emerald-800/60 px-2 py-0.5 rounded">
                    <TrendingDown className="w-3.5 h-3.5 mr-1 text-emerald-300" />
                    New ETA: {rerouteAlert.newEta} min (Save {rerouteAlert.timeSaved} min)
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <button
                onClick={handleAcceptReroute}
                className="flex-1 sm:flex-initial bg-white text-emerald-800 hover:bg-emerald-50 font-bold px-4 py-2.5 rounded-xl text-xs shadow-lg transition-all"
              >
                Accept New Route
              </button>
              <button
                onClick={handleDismissReroute}
                className="bg-emerald-800/40 hover:bg-emerald-800/70 text-white font-semibold px-3 py-2.5 rounded-xl text-xs transition-all"
              >
                Keep Current
              </button>
            </div>
          </div>
        )}

        {/* Turn-by-Turn Instruction HUD Banner */}
        <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-xl">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              {currentStep.direction === 'straight' && <ArrowUp className="w-8 h-8 text-white" />}
              {currentStep.direction === 'right' && <ArrowRight className="w-8 h-8 text-white" />}
              {currentStep.direction === 'left' && <ArrowLeft className="w-8 h-8 text-white" />}
              {currentStep.direction === 'arrive' && <CheckCircle className="w-8 h-8 text-white" />}
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-blue-400 font-bold">
                In {currentStep.distance}
              </div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-white">
                {currentStep.instruction}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                Current Segment: <span className="text-slate-200 font-semibold">{currentStep.road}</span>
              </p>
            </div>
          </div>

          {/* Quick HUD controls */}
          <div className="hidden sm:flex items-center space-x-3">
            <button
              onClick={() => setMuted(!muted)}
              className="p-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-slate-300 transition-colors"
              title="Toggle voice guidance"
            >
              {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
            </button>
            <button
              onClick={() => navigate('/map')}
              className="p-3 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-xl transition-colors"
              title="Stop Navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Map Viewport */}
        <div className="flex-1 w-full min-h-[420px] rounded-2xl overflow-hidden relative border border-slate-700">
          <LeafletMap
            origin={origin}
            destination={destination}
            primaryRoute={routeCoordinates}
            vehicleLocation={vehicleLocation}
            vehicleType={vehicleType}
            className="w-full h-full min-h-[420px]"
          />

          {/* Floating Speedometer Overlay */}
          <div className="absolute top-4 left-4 z-[400] bg-slate-950/90 backdrop-blur-md border border-slate-700 p-3 rounded-2xl shadow-xl flex items-center space-x-3">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black text-white tracking-tight">{speedKmh}</span>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">km/h</span>
            </div>
            <div className="h-8 w-px bg-slate-700" />
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-emerald-400">Limit 60</span>
              <span className="text-[10px] text-slate-400">Normal Flow</span>
            </div>
          </div>

          {/* Floating Destination Badge */}
          <div className="absolute bottom-4 left-4 z-[400] bg-slate-900/90 backdrop-blur-md border border-slate-700 px-3.5 py-2 rounded-xl text-xs flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span className="text-slate-400">Navigating to:</span>
            <span className="font-bold text-white truncate max-w-xs">{destLabel}</span>
          </div>
        </div>

        {/* Bottom Trip Telemetry HUD */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 grid grid-cols-3 sm:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-[10px] uppercase text-slate-400 font-bold">Estimated Arrival</div>
            <div className="text-lg sm:text-xl font-black text-blue-400 mt-0.5">{etaMinutes} min</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-slate-400 font-bold">Distance Left</div>
            <div className="text-lg sm:text-xl font-black text-slate-100 mt-0.5">{remainingDistanceKm} km</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-slate-400 font-bold">Traffic Condition</div>
            <div className="text-lg sm:text-xl font-black text-emerald-400 mt-0.5">Smooth</div>
          </div>
          <div className="col-span-3 sm:col-span-1 flex items-center justify-center">
            <button
              onClick={() => navigate('/map')}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold py-2.5 rounded-xl transition-all"
            >
              Exit Navigation
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
