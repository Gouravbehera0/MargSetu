import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import NavigationNavbar from '@/components/NavigationNavbar';
import LeafletMap from '@/components/LeafletMap';
import { fetchActiveAmbulanceAlert, submitSpeedObservation, optimizeRouteWithQPSO } from '@/services/apiService';
import type { GeoPoint, GeneralVehicleType, ActiveAmbulanceAlertData } from '@/types';
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
  Gauge,
  Siren,
  ChevronUp,
  LocateFixed,
  ShieldCheck,
  Activity
} from 'lucide-react';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const isSmall = window.innerWidth < 1024;
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    return isSmall || isMobileDevice;
  });

  useEffect(() => {
    const check = () => {
      const isSmall = window.innerWidth < 1024;
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isSmall || (isMobileDevice && window.innerWidth < 1200));
    };

    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return isMobile;
}

function formatArrivalTime(etaMinutes: number): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() + Math.round(etaMinutes));
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}


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
  const corridorName: string = navState.corridorName || 'QPSO Optimized Corridor';

  const [speedKmh, setSpeedKmh] = useState(48);
  const [navProgress, setNavProgress] = useState(0);
  const [muted, setMuted] = useState(false);

  // Responsive layout check: Mobile vs Laptop
  const isMobile = useIsMobile();

  // Mobile Bottom Sheet Gestures & Snap Points
  const PEEK_HEIGHT = 88;
  const [sheetHeight, setSheetHeight] = useState<number>(PEEK_HEIGHT);
  const [isDraggingSheet, setIsDraggingSheet] = useState<boolean>(false);
  const [mobileTrafficEnabled, setMobileTrafficEnabled] = useState(true);
  const [mapCenter, setMapCenter] = useState<[number, number] | undefined>(undefined);

  const dragStartYRef = useRef<number>(0);
  const dragStartHeightRef = useRef<number>(PEEK_HEIGHT);
  const dragStartTimeRef = useRef<number>(0);
  const dragDistanceRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);

  const getMidHeight = useCallback(() => {
    return Math.min(410, Math.max(340, Math.round(window.innerHeight * 0.50)));
  }, []);

  const getFullHeight = useCallback(() => {
    return Math.min(740, Math.max(520, Math.round(window.innerHeight * 0.82)));
  }, []);

  const handleDragStart = useCallback((clientY: number) => {
    isDraggingRef.current = true;
    setIsDraggingSheet(true);
    dragStartYRef.current = clientY;
    dragStartHeightRef.current = sheetHeight;
    dragStartTimeRef.current = Date.now();
    dragDistanceRef.current = 0;
  }, [sheetHeight]);

  const handleDragMove = useCallback((clientY: number) => {
    if (!isDraggingRef.current) return;
    const deltaY = dragStartYRef.current - clientY;
    dragDistanceRef.current = Math.max(dragDistanceRef.current, Math.abs(deltaY));
    const fullH = getFullHeight();
    const minH = PEEK_HEIGHT;
    const maxH = fullH + 25;
    const nextH = Math.max(minH, Math.min(maxH, dragStartHeightRef.current + deltaY));
    setSheetHeight(nextH);
  }, [getFullHeight]);

  const handleDragEnd = useCallback((clientY: number) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDraggingSheet(false);

    const deltaY = dragStartYRef.current - clientY;
    const deltaTime = Math.max(1, Date.now() - dragStartTimeRef.current);
    const velocity = deltaY / deltaTime; // px/ms

    const midH = getMidHeight();
    const fullH = getFullHeight();
    const snapPoints = [PEEK_HEIGHT, midH, fullH];

    let targetHeight = PEEK_HEIGHT;

    if (velocity > 0.35) {
      // Swiped UP fast
      if (dragStartHeightRef.current <= PEEK_HEIGHT + 35) {
        targetHeight = midH;
      } else {
        targetHeight = fullH;
      }
    } else if (velocity < -0.35) {
      // Swiped DOWN fast
      if (dragStartHeightRef.current >= fullH - 35) {
        targetHeight = midH;
      } else {
        targetHeight = PEEK_HEIGHT;
      }
    } else {
      // Snap to closest anchor
      targetHeight = snapPoints.reduce((prev, curr) =>
        Math.abs(curr - sheetHeight) < Math.abs(prev - sheetHeight) ? curr : prev
      );
    }

    setSheetHeight(targetHeight);
  }, [sheetHeight, getMidHeight, getFullHeight]);

  const toggleSheet = useCallback(() => {
    if (dragDistanceRef.current > 8) return;
    const midH = getMidHeight();
    if (sheetHeight <= PEEK_HEIGHT + 20) {
      setSheetHeight(midH);
    } else {
      setSheetHeight(PEEK_HEIGHT);
    }
  }, [sheetHeight, getMidHeight]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        handleDragMove(e.clientY);
      }
    };
    const onMouseUp = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        handleDragEnd(e.clientY);
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [handleDragMove, handleDragEnd]);

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

  // Real-time Active Ambulance Proximity Alert state
  const [activeAmbulance, setActiveAmbulance] = useState<ActiveAmbulanceAlertData | null>(null);
  const [giveWayAcknowledged, setGiveWayAcknowledged] = useState(false);


  // Route coordinates: use passed polyline if available, or generate a realistic fallback
  const initialCoordinates: [number, number][] =
    navState.polyline && navState.polyline.length >= 2
      ? navState.polyline
      : [
          [origin.lat, origin.lng],
          [origin.lat + (destination.lat - origin.lat) * 0.3, origin.lng + (destination.lng - origin.lng) * 0.25],
          [origin.lat + (destination.lat - origin.lat) * 0.65, origin.lng + (destination.lng - origin.lng) * 0.7],
          [destination.lat, destination.lng]
        ];

  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>(initialCoordinates);
  const [alternativeRoutes, setAlternativeRoutes] = useState<[number, number][][]>(navState.alternatives || []);

  // Fetch real QPSO route if navigated directly or polyline missing
  useEffect(() => {
    if (!navState.polyline || navState.polyline.length < 2) {
      optimizeRouteWithQPSO({
        origin,
        destination,
        vehicle_type: vehicleType,
        preference: 'balanced'
      }).then((res) => {
        if (res && res.route_geometry && res.route_geometry.length >= 2) {
          setRouteCoordinates(res.route_geometry);
          if (res.candidate_alternatives && res.candidate_alternatives.length > 0) {
            setAlternativeRoutes(res.candidate_alternatives.slice(1).map(c => c.coordinates));
          }
        }
      }).catch((e) => console.warn('Navigation HUD fallback route error:', e));
    }
  }, [origin.lat, origin.lng, destination.lat, destination.lng, vehicleType]);

  // Advance vehicle smoothly along polyline in real-time
  useEffect(() => {
    const timer = setInterval(() => {
      setNavProgress((prev) => {
        if (prev >= 100) return 100;
        const step = Math.max(0.8, Math.min(2.5, 100 / Math.max(12, routeCoordinates.length)));
        return Math.min(100, Number((prev + step).toFixed(2)));
      });
      setSpeedKmh(Math.floor(45 + Math.random() * 8));
    }, 1800);

    return () => clearInterval(timer);
  }, [routeCoordinates.length]);

  // Compute active position along routeCoordinates
  const coordIndex = Math.min(
    routeCoordinates.length - 1,
    Math.floor((navProgress / 100) * (routeCoordinates.length - 1))
  );

  const currentCoord = routeCoordinates[coordIndex] || [origin.lat, origin.lng];

  const vehicleLocation: GeoPoint = {
    lat: currentCoord[0],
    lng: currentCoord[1],
    name: 'Your Vehicle'
  };

  // Dynamic ETA & remaining distance based on progress
  const remainingFraction = Math.max(0, (100 - navProgress) / 100);
  const remainingDistanceKm = Number((initialDist * remainingFraction).toFixed(1));
  const etaMinutes = Math.max(navProgress >= 98 ? 0 : 1, Math.round(initialEta * remainingFraction));

  // Dynamic turn-by-turn guidance steps contextual to origin, destination, and selected corridor
  const originLabel = origin.name ? origin.name.split(',')[0].trim() : 'Origin Point';
  const destLabel = destination.name ? destination.name.split(',')[0].trim() : 'Destination Point';
  const corridorLabel = corridorName.split('(')[0].trim();

  const turnSteps: TurnStep[] = [
    {
      id: '1',
      instruction: `Depart from ${originLabel}`,
      distance: `${Math.round(initialDist * 0.12 * 1000)} m`,
      road: `${originLabel} Main Connector`,
      direction: 'straight'
    },
    {
      id: '2',
      instruction: `Turn right onto ${corridorLabel}`,
      distance: `${(initialDist * 0.35).toFixed(1)} km`,
      road: corridorLabel,
      direction: 'right'
    },
    {
      id: '3',
      instruction: `Continue straight on ${corridorLabel}`,
      distance: `${(initialDist * 0.35).toFixed(1)} km`,
      road: 'QPSO Priority Highway Corridor',
      direction: 'straight'
    },
    {
      id: '4',
      instruction: `Bear left towards ${destLabel} Approach`,
      distance: `${Math.round(initialDist * 0.18 * 1000)} m`,
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

  const currentStepIndex = Math.min(
    turnSteps.length - 1,
    Math.floor((navProgress / 100) * turnSteps.length)
  );
  const currentStep = turnSteps[currentStepIndex];

  const handleRecenter = useCallback(() => {
    if (vehicleLocation?.lat && vehicleLocation?.lng) {
      setMapCenter([vehicleLocation.lat, vehicleLocation.lng]);
    }
  }, [vehicleLocation]);

  // Periodic Anonymized GPS Telemetry Submission (zero PII, segment-level speed aggregation)
  useEffect(() => {
    const telemetryTimer = setInterval(() => {
      if (vehicleLocation?.lat && vehicleLocation?.lng) {
        submitSpeedObservation({
          latitude: vehicleLocation.lat,
          longitude: vehicleLocation.lng,
          speed_kmh: speedKmh,
          heading_degrees: 180,
          timestamp: new Date().toISOString()
        }).catch(() => {});
      }
    }, 5000);

    return () => clearInterval(telemetryTimer);
  }, [vehicleLocation.lat, vehicleLocation.lng, speedKmh]);

  // Simulate a dynamic rerouting event when downstream traffic spikes
  useEffect(() => {
    const rerouteTimer = setTimeout(() => {
      setRerouteAlert({
        active: true,
        reason: `Sudden congestion spike detected ahead (>25% speed drop). Faster bypass corridor identified via QPSO algorithm towards ${destLabel}.`,
        oldEta: etaMinutes,
        newEta: Math.max(2, Math.round(etaMinutes * 0.7)),
        timeSaved: Math.max(2, Math.round(etaMinutes * 0.3))
      });
    }, 6000);

    return () => clearTimeout(rerouteTimer);
  }, []);

  // Poll for active emergency ambulance on or approaching user's corridor
  useEffect(() => {
    let isMounted = true;
    const pollAmbulanceAlert = async () => {
      try {
        const userLoc = vehicleLocation;
        const alert = await fetchActiveAmbulanceAlert(userLoc.lat, userLoc.lng, 1200);
        if (isMounted) {
          setActiveAmbulance(alert);
        }
      } catch (e) {
        console.error('Failed to poll ambulance alert:', e);
      }
    };

    pollAmbulanceAlert();
    const interval = setInterval(pollAmbulanceAlert, 2000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [vehicleLocation.lat, vehicleLocation.lng]);

  function handleAcceptReroute() {
    setRerouteAlert({ ...rerouteAlert, active: false });
  }

  function handleDismissReroute() {
    setRerouteAlert({ ...rerouteAlert, active: false });
  }

  return (
    <>
      {isMobile ? (
        <div className="relative w-full h-[100dvh] overflow-hidden bg-slate-900 select-none flex flex-col">
          {/* 1. Full Viewport Leaflet Map */}
          <div className="absolute inset-0 z-0">
            <LeafletMap
              origin={origin}
              destination={destination}
              primaryRoute={routeCoordinates}
              alternativeRoutes={alternativeRoutes}
              vehicleLocation={vehicleLocation}
              vehicleType={vehicleType}
              activeAmbulanceAlert={activeAmbulance}
              showTrafficLayer={mobileTrafficEnabled}
              center={mapCenter}
              className="w-full h-full"
            />
          </div>

          {/* 2. Top Floating Navigation HUD Container */}
          <div className="absolute top-2 left-2 right-2 z-30 flex flex-col space-y-2 pointer-events-none pt-[env(safe-area-inset-top,0px)]">
            {/* Real-Time Active Ambulance Proximity Alert (Mobile floating card) */}
            {activeAmbulance && activeAmbulance.has_active_ambulance && activeAmbulance.is_relevant_to_user && !giveWayAcknowledged && (
              <div className="pointer-events-auto bg-gradient-to-r from-red-600 via-rose-600 to-red-700 rounded-2xl p-3 shadow-2xl border border-red-400 animate-pulse text-white flex items-center justify-between">
                <div className="flex items-center space-x-2.5 overflow-hidden">
                  <div className="p-2 bg-white/20 rounded-xl relative shrink-0">
                    <Siren className="w-5 h-5 text-white animate-bounce" />
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-400 rounded-full animate-ping" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="flex items-center space-x-1.5 flex-wrap">
                      <span className="font-black text-xs uppercase bg-red-900/60 px-1.5 py-0.5 rounded">
                        🚨 {activeAmbulance.vehicle_code || 'Ambulance'}
                      </span>
                      <span className="text-[10px] font-bold text-yellow-200">
                        {activeAmbulance.distance_meters}m • {activeAmbulance.eta_seconds}s
                      </span>
                    </div>
                    <p className="text-[11px] text-red-100 font-medium truncate mt-0.5">
                      {activeAmbulance.give_way_action || 'Move left and yield corridor immediately'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setGiveWayAcknowledged(true)}
                  className="bg-white text-red-700 text-xs font-black px-3 py-1.5 rounded-xl shrink-0 ml-2 shadow-sm active:scale-95 whitespace-nowrap"
                >
                  Yielded
                </button>
              </div>
            )}

            {/* Compact Give-Way status pill if acknowledged */}
            {activeAmbulance && activeAmbulance.has_active_ambulance && activeAmbulance.is_relevant_to_user && giveWayAcknowledged && (
              <div className="pointer-events-auto bg-red-950/90 border border-red-600/60 text-red-200 text-xs px-3 py-2 rounded-xl flex items-center justify-between shadow-lg">
                <div className="flex items-center space-x-2">
                  <Siren className="w-4 h-4 text-red-400 animate-pulse shrink-0" />
                  <span className="truncate">
                    Clearway active for <b>{activeAmbulance.vehicle_code}</b> ({activeAmbulance.distance_meters}m)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setGiveWayAcknowledged(false)}
                  className="text-[11px] font-bold text-red-300 hover:text-white underline ml-2 shrink-0"
                >
                  Alert
                </button>
              </div>
            )}

            {/* Dynamic Reroute Alert */}
            {rerouteAlert.active && (
              <div className="pointer-events-auto bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-3 shadow-2xl border border-emerald-400 animate-bounceOnce text-white flex items-center justify-between">
                <div className="flex items-center space-x-2.5 overflow-hidden">
                  <div className="p-2 bg-white/20 rounded-xl shrink-0">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-extrabold text-xs">Better Route Available</span>
                      <span className="text-[10px] bg-emerald-800/60 font-bold px-1.5 py-0.5 rounded text-emerald-200">
                        Save {rerouteAlert.timeSaved}m
                      </span>
                    </div>
                    <div className="text-[11px] text-emerald-100 truncate mt-0.5">
                      New ETA: {rerouteAlert.newEta}m (QPSO Bypass)
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                  <button
                    type="button"
                    onClick={handleAcceptReroute}
                    className="bg-white text-emerald-800 text-xs font-bold px-2.5 py-1.5 rounded-xl shadow-sm active:scale-95"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={handleDismissReroute}
                    className="p-1.5 rounded-xl text-emerald-200 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Primary Turn-by-Turn Instruction HUD Banner */}
            <div className="pointer-events-auto bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-3 shadow-2xl flex items-center justify-between text-white">
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
                  {currentStep.direction === 'straight' && <ArrowUp className="w-7 h-7 text-white" />}
                  {currentStep.direction === 'right' && <ArrowRight className="w-7 h-7 text-white" />}
                  {currentStep.direction === 'left' && <ArrowLeft className="w-7 h-7 text-white" />}
                  {currentStep.direction === 'arrive' && <CheckCircle className="w-7 h-7 text-white" />}
                </div>
                <div className="overflow-hidden">
                  <div className="text-[11px] uppercase tracking-wider text-blue-400 font-black">
                    In {currentStep.distance}
                  </div>
                  <div className="text-sm font-black text-white leading-tight truncate">
                    {currentStep.instruction}
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                    Onto {currentStep.road}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-1 shrink-0 ml-2">
                <button
                  type="button"
                  onClick={() => setMuted(!muted)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition-colors"
                  title="Voice guidance"
                >
                  {muted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/map')}
                  className="p-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-xl transition-colors"
                  title="Exit Navigation"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* 3. Floating Speedometer Badge (Upper Left) */}
          <div className="absolute top-28 left-3 z-20 bg-slate-950/90 backdrop-blur-md border border-slate-700/80 px-2.5 py-2 rounded-2xl shadow-xl flex items-center space-x-2">
            <div className="flex flex-col items-center">
              <span className="text-xl font-black text-white leading-none">{speedKmh}</span>
              <span className="text-[8px] text-slate-400 uppercase font-bold tracking-tight">km/h</span>
            </div>
            <div className="h-6 w-px bg-slate-700" />
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-bold text-red-400 border border-red-500/50 bg-red-500/10 px-1 rounded-sm">60</span>
              <span className="text-[8px] text-slate-400 mt-0.5">Limit</span>
            </div>
          </div>

          {/* 4. Floating Map Action Buttons (Dynamic height tracking above bottom sheet) */}
          <div
            className="absolute right-3 z-20 flex flex-col space-y-2.5"
            style={{
              bottom: `${sheetHeight + 14}px`,
              transition: isDraggingSheet
                ? 'none'
                : 'bottom 0.32s cubic-bezier(0.18, 0.89, 0.32, 1.1)',
            }}
          >
            {/* Traffic Toggle */}
            <button
              type="button"
              onClick={() => setMobileTrafficEnabled(!mobileTrafficEnabled)}
              className={`w-11 h-11 rounded-2xl shadow-lg border flex items-center justify-center transition-all active:scale-95 ${
                mobileTrafficEnabled
                  ? 'bg-blue-600 text-white border-blue-500 shadow-blue-500/25'
                  : 'bg-slate-900/95 backdrop-blur-md text-slate-300 border-slate-700'
              }`}
              title={mobileTrafficEnabled ? 'Hide Live Traffic' : 'Show Live Traffic'}
            >
              <Activity className="w-5 h-5" />
            </button>

            {/* Recenter GPS */}
            <button
              type="button"
              onClick={handleRecenter}
              className="w-11 h-11 bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-lg border border-slate-700 flex items-center justify-center text-blue-400 active:scale-95 transition-all"
              title="Recenter Vehicle"
            >
              <LocateFixed className="w-5 h-5 text-blue-400" />
            </button>
          </div>

          {/* 5. Bottom Draggable Navigation Sheet (Dark theme, Lyft/Google Maps style) */}
          <div
            className="absolute left-0 right-0 bottom-0 z-30 bg-slate-900/98 backdrop-blur-2xl rounded-t-3xl shadow-2xl border-t border-slate-700/90 flex flex-col overflow-hidden will-change-[height] text-white"
            style={{
              height: `${sheetHeight}px`,
              transition: isDraggingSheet
                ? 'none'
                : 'height 0.32s cubic-bezier(0.18, 0.89, 0.32, 1.1)',
            }}
          >
            {/* Drag Handle Bar */}
            <div
              className="w-full pt-3 pb-1.5 cursor-grab active:cursor-grabbing flex flex-col items-center justify-center shrink-0 select-none touch-none"
              onTouchStart={(e) => {
                if (e.touches[0]) handleDragStart(e.touches[0].clientY);
              }}
              onTouchMove={(e) => {
                if (e.touches[0]) handleDragMove(e.touches[0].clientY);
              }}
              onTouchEnd={(e) => {
                if (e.changedTouches[0]) handleDragEnd(e.changedTouches[0].clientY);
              }}
              onMouseDown={(e) => handleDragStart(e.clientY)}
              onClick={toggleSheet}
            >
              <div className="w-12 h-1.5 bg-slate-600 rounded-full" />
            </div>

            {/* Collapsed Pill Row (Peek view) */}
            <div
              className="px-4 pb-2.5 cursor-pointer shrink-0 select-none touch-none"
              onTouchStart={(e) => {
                if (e.touches[0]) handleDragStart(e.touches[0].clientY);
              }}
              onTouchMove={(e) => {
                if (e.touches[0]) handleDragMove(e.touches[0].clientY);
              }}
              onTouchEnd={(e) => {
                if (e.changedTouches[0]) handleDragEnd(e.changedTouches[0].clientY);
              }}
              onMouseDown={(e) => handleDragStart(e.clientY)}
              onClick={toggleSheet}
            >
              <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 shadow-2xs">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-black text-emerald-400">
                    {etaMinutes} <span className="text-sm font-semibold text-emerald-300">min</span>
                  </span>
                  <span className="text-slate-500 font-bold">•</span>
                  <span className="text-xs text-slate-300 font-bold">
                    {remainingDistanceKm} km
                  </span>
                  <span className="text-slate-500 font-bold">•</span>
                  <span className="text-xs text-slate-400 font-medium">
                    {formatArrivalTime(etaMinutes)}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/map');
                    }}
                    className="px-3 py-1 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-sm active:scale-95 transition-all"
                  >
                    End
                  </button>
                  <ChevronUp
                    className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${
                      sheetHeight > PEEK_HEIGHT + 20 ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Expanded Navigation Sheet Content */}
            <div
              className={`flex-1 overflow-y-auto px-4 pb-6 space-y-4 transition-opacity duration-200 ${
                sheetHeight > PEEK_HEIGHT + 15 ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              {/* Trip Summary Telemetry Grid (Also acts as secondary drag zone) */}
              <div
                className="grid grid-cols-3 gap-2.5 pt-1 cursor-grab active:cursor-grabbing select-none"
                onTouchStart={(e) => {
                  if (e.touches[0]) handleDragStart(e.touches[0].clientY);
                }}
                onTouchMove={(e) => {
                  if (e.touches[0]) handleDragMove(e.touches[0].clientY);
                }}
                onTouchEnd={(e) => {
                  if (e.changedTouches[0]) handleDragEnd(e.changedTouches[0].clientY);
                }}
                onMouseDown={(e) => handleDragStart(e.clientY)}
              >
                <div className="bg-slate-800/90 border border-slate-700/80 p-2.5 rounded-2xl text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-400">ETA</div>
                  <div className="text-base font-black text-emerald-400 mt-0.5">{etaMinutes} min</div>
                  <div className="text-[10px] text-slate-400">{formatArrivalTime(etaMinutes)}</div>
                </div>
                <div className="bg-slate-800/90 border border-slate-700/80 p-2.5 rounded-2xl text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Remaining</div>
                  <div className="text-base font-black text-white mt-0.5">{remainingDistanceKm} km</div>
                  <div className="text-[10px] text-blue-400 font-medium">To Destination</div>
                </div>
                <div className="bg-slate-800/90 border border-slate-700/80 p-2.5 rounded-2xl text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Traffic</div>
                  <div className="text-base font-black text-emerald-400 mt-0.5">Smooth</div>
                  <div className="text-[10px] text-emerald-300 font-medium">Free Flow</div>
                </div>
              </div>

              {/* Destination Info Card */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                <div className="flex items-center space-x-2.5 overflow-hidden">
                  <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse shrink-0" />
                  <div className="overflow-hidden">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Destination</div>
                    <div className="text-xs font-extrabold text-white truncate">{destLabel}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/map')}
                  className="text-xs font-bold text-red-400 hover:text-red-300 px-2.5 py-1 rounded-lg border border-red-500/30 bg-red-500/10 shrink-0"
                >
                  Exit Route
                </button>
              </div>

              {/* Turn-by-Turn Waypoint List */}
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 flex items-center justify-between">
                  <span>Turn-by-Turn Route</span>
                  <span className="text-[10px] text-blue-400 font-semibold">Step {currentStepIndex + 1} of {turnSteps.length}</span>
                </div>
                <div className="space-y-2">
                  {turnSteps.map((step, idx) => {
                    const isCurrent = idx === currentStepIndex;
                    const isPast = idx < currentStepIndex;
                    return (
                      <div
                        key={step.id}
                        className={`flex items-start space-x-3 p-2.5 rounded-xl border text-xs transition-all ${
                          isCurrent
                            ? 'bg-blue-600/20 border-blue-500 text-white ring-1 ring-blue-500/40'
                            : isPast
                            ? 'bg-slate-800/40 border-slate-800 text-slate-500'
                            : 'bg-slate-800/70 border-slate-700/60 text-slate-300'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          isCurrent ? 'bg-blue-600 text-white' : isPast ? 'bg-slate-700 text-slate-400' : 'bg-slate-700/60 text-slate-300'
                        }`}>
                          {step.direction === 'straight' && <ArrowUp className="w-3.5 h-3.5" />}
                          {step.direction === 'right' && <ArrowRight className="w-3.5 h-3.5" />}
                          {step.direction === 'left' && <ArrowLeft className="w-3.5 h-3.5" />}
                          {step.direction === 'arrive' && <CheckCircle className="w-3.5 h-3.5" />}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div className={`font-bold truncate ${isCurrent ? 'text-white' : ''}`}>
                            {step.instruction}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">
                            {step.road} • {step.distance}
                          </div>
                        </div>
                        {isCurrent && (
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-blue-500 text-white shrink-0">
                            NOW
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Telemetry Status Footer */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span>QPSO Dynamic Telemetry</span>
                </div>
                <span className="text-emerald-400 font-bold">Live GPS 10Hz</span>
              </div>

              {/* Full Primary Exit Button */}
              <button
                type="button"
                onClick={() => navigate('/map')}
                className="w-full bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-extrabold py-3 px-4 rounded-2xl shadow-lg shadow-red-600/30 flex items-center justify-center space-x-2 transition-all text-sm"
              >
                <span>Exit Navigation</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col font-sans">
          <NavigationNavbar />

          <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col space-y-4">
            {/* Real-Time Active Ambulance Give-Way Alert Banner */}
            {activeAmbulance && activeAmbulance.has_active_ambulance && activeAmbulance.is_relevant_to_user && !giveWayAcknowledged && (
              <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 rounded-2xl p-4 sm:p-5 shadow-2xl border-2 border-red-400 animate-pulse flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-white">
                <div className="flex items-center space-x-3.5">
                  <div className="p-3 bg-white/20 rounded-2xl shadow-inner relative flex-shrink-0">
                    <Siren className="w-7 h-7 text-white animate-bounce" />
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-yellow-400 rounded-full animate-ping" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 flex-wrap">
                      <span className="font-black text-sm sm:text-base tracking-wide uppercase bg-red-800/60 px-2.5 py-0.5 rounded-lg border border-red-400/40">
                        🚨 GIVE WAY ALERT • {activeAmbulance.vehicle_code || 'AMBULANCE'}
                      </span>
                      <span className="text-[11px] font-bold bg-white/20 px-2 py-0.5 rounded-full text-yellow-200">
                        Corridor Active
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-red-100 font-semibold mt-1">
                      {activeAmbulance.give_way_action || 'Emergency vehicle approaching on your corridor. Please move left and give way immediately.'}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs font-bold">
                      <span className="bg-red-950/70 border border-red-400/40 px-2.5 py-1 rounded-lg text-white">
                        📏 Distance: <span className="text-yellow-300">{activeAmbulance.distance_meters} m</span>
                      </span>
                      <span className="bg-red-950/70 border border-red-400/40 px-2.5 py-1 rounded-lg text-white">
                        ⏱️ ETA: <span className="text-emerald-300">{activeAmbulance.eta_seconds} sec</span>
                      </span>
                      <span className="bg-red-950/70 border border-red-400/40 px-2.5 py-1 rounded-lg text-white flex items-center gap-1.5">
                        <span>🧭 Heading: {activeAmbulance.heading_direction} ({activeAmbulance.heading_degrees}°)</span>
                        <span
                          className="inline-block transition-transform duration-300 text-yellow-400 font-black text-sm"
                          style={{ transform: `rotate(${activeAmbulance.heading_degrees}deg)` }}
                        >
                          ↑
                        </span>
                      </span>
                      <span className="bg-red-950/70 border border-red-400/40 px-2.5 py-1 rounded-lg text-white">
                        ⚡ Speed: {activeAmbulance.speed_kmh} km/h
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <button
                    onClick={() => setGiveWayAcknowledged(true)}
                    className="flex-1 sm:flex-initial bg-white hover:bg-red-50 text-red-700 font-extrabold px-4 py-2.5 rounded-xl text-xs shadow-lg transition-all active:scale-95 whitespace-nowrap"
                  >
                    Acknowledge & Clear Lane
                  </button>
                </div>
              </div>
            )}

            {/* Compact Give-Way status pill if acknowledged */}
            {activeAmbulance && activeAmbulance.has_active_ambulance && activeAmbulance.is_relevant_to_user && giveWayAcknowledged && (
              <div className="bg-red-950/80 border border-red-600/50 text-red-200 text-xs px-4 py-2.5 rounded-xl flex items-center justify-between shadow-md">
                <div className="flex items-center space-x-2">
                  <Siren className="w-4 h-4 text-red-400 animate-pulse" />
                  <span>
                    Clearway active for <b>{activeAmbulance.vehicle_code}</b> • <b>{activeAmbulance.distance_meters}m away</b> (ETA: <b>{activeAmbulance.eta_seconds}s</b> • Heading: <b>{activeAmbulance.heading_direction}</b>)
                  </span>
                </div>
                <button
                  onClick={() => setGiveWayAcknowledged(false)}
                  className="text-[11px] font-bold text-red-300 hover:text-white underline ml-2"
                >
                  Reopen Alert
                </button>
              </div>
            )}

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
                alternativeRoutes={alternativeRoutes}
                vehicleLocation={vehicleLocation}
                vehicleType={vehicleType}
                activeAmbulanceAlert={activeAmbulance}
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
      )}
    </>
  );
}
