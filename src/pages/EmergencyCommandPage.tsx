import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavigationNavbar from '@/components/NavigationNavbar';
import LeafletMap from '@/components/LeafletMap';
import MobileBottomNav from '@/components/MobileBottomNav';
import { useApp } from '@/context/AppContext';
import { checkCitizenGiveWayAlerts, fetchActiveAmbulanceAlert, stepEmergencyVehicle } from '@/services/apiService';
import { BHUBANESWAR_AMBULANCE_REAL_ROAD } from '@/data/realRoadCorridors';
import type { CitizenGiveWayAlertItem, ActiveAmbulanceAlertData } from '@/types';
import {
  Siren,
  Flame,
  Shield,
  Hospital,
  AlertTriangle,
  Radio,
  Navigation,
  CheckCircle2,
  BellRing,
  ArrowRight,
  Sparkles,
  Play,
  Pause,
  FastForward,
  Compass,
  ArrowLeft
} from 'lucide-react';


export default function EmergencyCommandPage() {
  const { mapState } = useApp();
  const navigate = useNavigate();

  const safeOrigin = mapState?.origin || {
    lat: 21.2514,
    lng: 81.6296,
    name: 'Raipur Urban Center'
  };

  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [activeEmergencyType, setActiveEmergencyType] = useState<'ambulance' | 'fire' | 'police'>('ambulance');
  const [alertRadius, setAlertRadius] = useState<number>(600);
  const [giveWayAlerts, setGiveWayAlerts] = useState<CitizenGiveWayAlertItem[]>([]);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [activeAmbulance, setActiveAmbulance] = useState<ActiveAmbulanceAlertData | null>(null);
  const [isAutoStepping, setIsAutoStepping] = useState(true);

  useEffect(() => {
    const checkMobile = () => {
      const isMobileWidth = window.innerWidth < 768;
      const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileWidth || isMobileUserAgent);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Active emergency vehicle trajectory strictly on real roads
  const emergencyRoute: [number, number][] = BHUBANESWAR_AMBULANCE_REAL_ROAD;

  const simulatedCitizens = [
    { id: 'c1', lat: 20.2740, lng: 85.8300, label: 'Citizen Priya (In corridor - 320m away)' },
    { id: 'c2', lat: 20.2830, lng: 85.8240, label: 'Citizen Rohit (Ahead on route - 850m away)' },
    { id: 'c3', lat: 20.2980, lng: 85.8420, label: 'Citizen Sunita (Outside corridor)' }
  ];

  const refreshAmbulanceTelemetry = async () => {
    try {
      const data = await fetchActiveAmbulanceAlert(20.2740, 85.8300, alertRadius);
      setActiveAmbulance(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    refreshAmbulanceTelemetry();
    const interval = setInterval(refreshAmbulanceTelemetry, 2500);
    return () => clearInterval(interval);
  }, [alertRadius]);

  // Auto-step simulation timer
  useEffect(() => {
    if (!isAutoStepping) return;
    const timer = setInterval(async () => {
      await stepEmergencyVehicle('ev-1');
      refreshAmbulanceTelemetry();
    }, 4000);
    return () => clearInterval(timer);
  }, [isAutoStepping, alertRadius]);

  async function handleStepForward() {
    await stepEmergencyVehicle('ev-1');
    await refreshAmbulanceTelemetry();
    handleTriggerBroadcast();
  }

  async function handleTriggerBroadcast() {
    setIsBroadcasting(true);
    try {
      const alerts = await checkCitizenGiveWayAlerts('ev-1', alertRadius);
      setGiveWayAlerts(alerts);
    } catch (e) {
      console.error(e);
    } finally {
      setIsBroadcasting(false);
    }
  }


  // =========================================================================
  // ANDROID & IOS MOBILE VIEW (Sleek emergency dispatch & citizen radar HUD)
  // =========================================================================
  if (isMobile) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans select-none pb-20">
        {/* Android Top App Bar */}
        <div className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-3 py-2.5 pt-[max(env(safe-area-inset-top),10px)] flex items-center justify-between">
          <div className="flex items-center space-x-2.5 min-w-0">
            <button
              type="button"
              onClick={() => navigate('/map')}
              className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-300 active:scale-95 transition-all shrink-0"
              title="Return to Map"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <h1 className="text-sm font-extrabold text-white truncate tracking-tight">Emergency Command</h1>
                <span className="flex h-2 w-2 relative shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                </span>
              </div>
              <p className="text-[10px] text-red-400 font-semibold truncate">Citizen Give-Way Radar</p>
            </div>
          </div>

          <div className="flex items-center space-x-1 shrink-0">
            <span className="bg-red-600/90 text-white text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider animate-pulse">
              LIVE BROADCAST
            </span>
          </div>
        </div>

        {/* Priority Vehicle Type Selector Pills */}
        <div className="px-3 pt-3 pb-1">
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-800/80 rounded-2xl border border-slate-700/70">
            {[
              { type: 'ambulance', label: 'Ambulance', icon: Siren, color: 'bg-red-600 text-white' },
              { type: 'fire', label: 'Fire Tender', icon: Flame, color: 'bg-orange-600 text-white' },
              { type: 'police', label: 'Police', icon: Shield, color: 'bg-blue-600 text-white' }
            ].map((v) => {
              const Icon = v.icon;
              const isSelected = activeEmergencyType === v.type;
              return (
                <button
                  key={v.type}
                  type="button"
                  onClick={() => setActiveEmergencyType(v.type as any)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                    isSelected ? `${v.color} shadow-md` : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{v.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Radar Map Container */}
        <div className="px-3 py-2 flex flex-col space-y-3">
          <div className="h-[340px] rounded-2xl overflow-hidden border border-slate-700/80 relative shadow-inner">
            <LeafletMap
              origin={safeOrigin}
              destination={mapState.destination}
              vehicleLocation={activeAmbulance?.ambulance_location || safeOrigin}
              vehicleType={activeEmergencyType}
              primaryRoute={activeAmbulance?.active_route_geometry || mapState.primaryRoute || emergencyRoute}
              alternativeRoutes={mapState.alternativeRoutes}
              activeAmbulanceAlert={activeAmbulance || mapState.activeAmbulance}
              showEmergencyRadius={true}
              alertRadiusMeters={alertRadius}
              citizens={simulatedCitizens}
              center={[safeOrigin.lat, safeOrigin.lng]}
              zoom={13}
              className="w-full h-full"
            />

            {/* Floating Top Telemetry Pill */}
            <div className="absolute top-2.5 left-2.5 right-2.5 z-10 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-red-500/40 flex items-center justify-between text-xs text-white shadow-lg">
              <div className="flex items-center space-x-1.5 truncate">
                <Siren className="w-4 h-4 text-red-500 animate-pulse shrink-0" />
                <span className="font-extrabold text-[11px] truncate">
                  {activeAmbulance?.vehicle_code || 'AMB-108'}
                </span>
                <span className="text-[10px] text-slate-400">• Priority 1</span>
              </div>
              <div className="flex items-center space-x-2 text-[10px] font-bold text-red-300 shrink-0">
                <span>{activeAmbulance?.speed_kmh || 62} km/h</span>
                <span>•</span>
                <span>{activeAmbulance?.distance_meters || 450}m away</span>
              </div>
            </div>
          </div>

          {/* Emergency Command Card */}
          <div className="p-4 rounded-2xl bg-slate-800/95 border border-slate-700 space-y-3 shadow-xl">
            {/* 4-Item Telemetry Grid */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-slate-900/70 border border-slate-700/60">
                <div className="text-[9px] uppercase font-bold text-slate-400">Distance</div>
                <div className="text-xs font-black text-red-400 mt-0.5">
                  {activeAmbulance?.distance_meters || 450} m
                </div>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/70 border border-slate-700/60">
                <div className="text-[9px] uppercase font-bold text-slate-400">Est. ETA</div>
                <div className="text-xs font-black text-emerald-400 mt-0.5">
                  {activeAmbulance?.eta_seconds || 28} s
                </div>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/70 border border-slate-700/60">
                <div className="text-[9px] uppercase font-bold text-slate-400">Speed</div>
                <div className="text-xs font-black text-blue-400 mt-0.5">
                  {activeAmbulance?.speed_kmh || 62} km/h
                </div>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/70 border border-slate-700/60">
                <div className="text-[9px] uppercase font-bold text-slate-400">Heading</div>
                <div className="text-xs font-black text-amber-400 mt-0.5 truncate">
                  {activeAmbulance?.heading_direction || 'North'} ({activeAmbulance?.heading_degrees || 0}°)
                </div>
              </div>
            </div>

            {/* Simulation Controls */}
            <div className="flex items-center space-x-2 pt-1">
              <button
                type="button"
                onClick={handleStepForward}
                className="flex-1 bg-slate-900 hover:bg-slate-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs border border-slate-700 flex items-center justify-center space-x-1.5 active:scale-95 transition-all"
              >
                <FastForward className="w-3.5 h-3.5 text-yellow-400" />
                <span>Step ⏩</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAutoStepping(!isAutoStepping)}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center space-x-1.5 active:scale-95 transition-all ${
                  isAutoStepping
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-black animate-pulse'
                    : 'bg-slate-900 text-slate-300 border-slate-700'
                }`}
              >
                {isAutoStepping ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Auto Moving</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 text-blue-400" />
                    <span>Auto Play</span>
                  </>
                )}
              </button>
            </div>

            {/* Proximity Radius Slider */}
            <div className="space-y-1.5 pt-1 border-t border-slate-700/70">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-bold text-[11px]">Proximity Alert Radius:</span>
                <span className="font-black text-red-400 text-xs">{alertRadius}m</span>
              </div>
              <input
                type="range"
                min="300"
                max="1200"
                step="50"
                value={alertRadius}
                onChange={(e) => setAlertRadius(Number(e.target.value))}
                className="w-full accent-red-500 cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-500">
                <span>300m (City)</span>
                <span>600m (Recommended)</span>
                <span>1200m (Expressway)</span>
              </div>
            </div>

            {/* Broadcast Give-Way Button */}
            <button
              type="button"
              onClick={handleTriggerBroadcast}
              disabled={isBroadcasting}
              className="w-full bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-700 text-white font-extrabold py-3 px-4 rounded-xl text-xs shadow-lg shadow-red-600/30 flex items-center justify-center space-x-2 transition-all active:scale-98 disabled:opacity-50"
            >
              <BellRing className="w-4 h-4 text-white" />
              <span>{isBroadcasting ? 'Broadcasting Give-Way Wave...' : 'Simulate Citizen Give-Way Alert'}</span>
            </button>

            {/* Dispatched Alerts Preview */}
            {giveWayAlerts.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-700">
                <div className="text-[11px] font-bold text-slate-300">
                  Citizens In Give-Way Radius ({giveWayAlerts.length}):
                </div>
                {giveWayAlerts.map((alert) => (
                  <div key={alert.id} className="p-2.5 rounded-xl bg-red-950/60 border border-red-700/50 text-xs text-red-200 flex items-start space-x-2">
                    <span className="text-base shrink-0">📢</span>
                    <div className="leading-snug text-[11px]">{alert.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <MobileBottomNav />
      </div>
    );
  }

  // =========================================================================
  // LAPTOP / DESKTOP VIEW: Existing Layout (100% Intact & Untouched)
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <NavigationNavbar />

      {/* Emergency Alert Banner */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white px-4 py-3 shadow-md flex items-center justify-between">
        <div className="flex items-center space-x-3 max-w-7xl mx-auto w-full">
          <div className="p-2 bg-white/20 rounded-full animate-pulse">
            <Siren className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-wider">
              🚨 EMERGENCY VEHICLE PRIORITY CORRIDOR ACTIVE
            </h1>
            <p className="text-xs text-red-100">
              QPSO priority weights applied: Travel Time weight = 0.60 | High Congestion Penalty = 0.20
            </p>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center space-x-2">
              <Radio className="w-5 h-5 text-red-600" />
              <span>Emergency Command & Citizen Give-Way Radar</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live proximity surveillance automatically alerts drivers in oncoming lanes to clear emergency corridors.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveEmergencyType('ambulance')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                activeEmergencyType === 'ambulance'
                  ? 'bg-red-600 text-white border-red-600 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Siren className="w-4 h-4" />
              <span>Ambulance</span>
            </button>
            <button
              onClick={() => setActiveEmergencyType('fire')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                activeEmergencyType === 'fire'
                  ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Flame className="w-4 h-4" />
              <span>Fire Tender</span>
            </button>
            <button
              onClick={() => setActiveEmergencyType('police')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                activeEmergencyType === 'police'
                  ? 'bg-navy-900 text-white border-navy-900 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Police</span>
            </button>
          </div>
        </div>

        {/* Radar Map & Give-Way Broadcast Engine */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Give-Way Surveillance Console */}
          <div className="lg:col-span-5 space-y-5">
            {/* Proximity Radius Slider Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Citizen Alert Proximity Radius
                </span>
                <span className="text-sm font-black text-red-600">{alertRadius} meters</span>
              </div>

              <input
                type="range"
                min="300"
                max="1200"
                step="50"
                value={alertRadius}
                onChange={(e) => setAlertRadius(Number(e.target.value))}
                className="w-full accent-red-600 cursor-pointer"
              />

              <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                <span>300m (Inner City)</span>
                <span>600m (Recommended)</span>
                <span>1200m (Expressway)</span>
              </div>

              <button
                onClick={handleTriggerBroadcast}
                disabled={isBroadcasting}
                className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold py-3 px-4 rounded-xl text-xs shadow-md shadow-red-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <BellRing className="w-4 h-4" />
                <span>{isBroadcasting ? 'Broadcasting Give-Way Wave...' : 'Simulate Citizen Give-Way Alert'}</span>
              </button>
            </div>

            {/* Broadcast Results / Alert Notifications */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span>Active Give-Way Alerts Dispatched</span>
                <span className="text-red-600 font-bold">{giveWayAlerts.length} Citizens In Range</span>
              </h3>

              {giveWayAlerts.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  Click "Simulate Citizen Give-Way Alert" to trigger proximity detection along the emergency corridor.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {giveWayAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-start space-x-3"
                    >
                      <span className="text-lg">📢</span>
                      <div>
                        <div className="text-xs font-bold text-red-900">{alert.message}</div>
                        <div className="text-[11px] text-red-600 mt-1 flex items-center space-x-2">
                          <span>Target: {alert.citizen_id}</span>
                          <span>•</span>
                          <span>Distance: {alert.distance_meters}m</span>
                          <span>•</span>
                          <span>Severity: Critical</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Emergency Facilities Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Destination Medical Facility Readiness
              </h3>

              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Hospital className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">AIIMS Trauma Center</h4>
                    <p className="text-[11px] text-slate-500">Destination of AMB-108</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-emerald-600">8 ICU Beds Free</div>
                  <div className="text-[10px] text-slate-400">Green corridor cleared</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Map with Pulsing Proximity Radar & Real-Time Ambulance Marker */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-4 border border-slate-200 shadow-sm min-h-[520px] flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                <Siren className="w-4 h-4 text-red-600 animate-pulse" />
                <span>Live Corridor Navigation & Shared Emergency Route</span>
              </div>
              <div className="flex items-center space-x-2">
                {activeAmbulance && (
                  <div className="flex items-center space-x-2 text-[11px] bg-slate-100 border border-slate-200 px-2 py-1 rounded-lg">
                    <span className="text-slate-500 font-semibold">Heading:</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      {activeAmbulance.heading_direction} ({activeAmbulance.heading_degrees}°)
                      <span
                        className="inline-block text-red-600 font-black"
                        style={{ transform: `rotate(${activeAmbulance.heading_degrees}deg)` }}
                      >
                        ↑
                      </span>
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="font-bold text-emerald-600">{activeAmbulance.speed_kmh} km/h</span>
                  </div>
                )}
                <button
                  onClick={handleStepForward}
                  title="Simulate ambulance next waypoint movement"
                  className="flex items-center space-x-1 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-lg border border-red-200 transition-colors"
                >
                  <FastForward className="w-3.5 h-3.5" />
                  <span>Step</span>
                </button>
                <button
                  onClick={() => setIsAutoStepping(!isAutoStepping)}
                  title={isAutoStepping ? 'Pause auto movement' : 'Start auto movement'}
                  className={`flex items-center space-x-1 text-xs font-bold px-2.5 py-1 rounded-lg border transition-colors ${
                    isAutoStepping
                      ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {isAutoStepping ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isAutoStepping ? 'Auto-Step' : 'Paused'}</span>
                </button>
                <span className="text-[11px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">
                  Radar: {alertRadius}m
                </span>
              </div>
            </div>

            <div className="flex-1 w-full h-[480px] rounded-xl overflow-hidden relative">
              <LeafletMap
                origin={safeOrigin}
                destination={mapState.destination}
                primaryRoute={activeAmbulance?.active_route_geometry || mapState.primaryRoute || emergencyRoute}
                alternativeRoutes={mapState.alternativeRoutes}
                vehicleLocation={activeAmbulance?.ambulance_location || safeOrigin}
                vehicleType="ambulance"
                activeAmbulanceAlert={activeAmbulance || mapState.activeAmbulance}
                showEmergencyRadius={true}
                alertRadiusMeters={alertRadius}
                citizens={simulatedCitizens}
                center={[safeOrigin.lat, safeOrigin.lng]}
                className="w-full h-full rounded-xl"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
