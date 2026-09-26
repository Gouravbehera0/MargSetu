import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavigationNavbar from '@/components/NavigationNavbar';
import LeafletMap from '@/components/LeafletMap';
import MobileBottomNav from '@/components/MobileBottomNav';
import { useApp } from '@/context/AppContext';
import {
  Car,
  Siren,
  Activity,
  AlertTriangle,
  Zap,
  TrendingDown,
  Clock,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  MapPin,
  RefreshCw,
  ArrowLeft,
  Compass
} from 'lucide-react';

export default function UnifiedDashboardPage() {
  const { mapState } = useApp();
  const navigate = useNavigate();
  const safeOrigin = mapState?.origin || {
    lat: 21.2514,
    lng: 81.6296,
    name: 'Raipur Urban Center'
  };
  const [isMobile, setIsMobile] = useState<boolean>(false);

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

  const activeVehiclesCount = 142;
  const activeEmergencyCount = 3;
  const activeIncidentsCount = 3;
  const activeBlockedCount = 1;
  const avgEtaReduction = '26.8%';
  const todayOptimizations = 3420;

  const dashboardRoute: [number, number][] = [
    [20.2685, 85.8360],
    [20.2780, 85.8310],
    [20.2920, 85.8270],
    [20.3050, 85.8220],
    [20.3120, 85.8180]
  ];

  const dashboardIncidents = [
    { id: '1', lat: 20.2685, lng: 85.8360, label: 'Accident at Master Canteen', type: 'accident' },
    { id: '2', lat: 20.2850, lng: 85.8240, label: 'Culvert Repair Roadblock', type: 'roadblock' },
    { id: '3', lat: 20.2920, lng: 85.8450, label: 'Flyover Girder Construction', type: 'construction' }
  ];

  // =========================================================================
  // ANDROID & IOS MOBILE VIEW (Control Center Hub & Telemetry)
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
                <h1 className="text-sm font-extrabold text-white truncate tracking-tight">Control Center</h1>
                <span className="flex h-2 w-2 relative shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">Urban Traffic & Fleet Operations</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/map')}
            className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs active:scale-95 shadow-xs transition-all shrink-0"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Planner</span>
          </button>
        </div>

        {/* Metrics Horizontal KPI Row */}
        <div className="flex space-x-2.5 overflow-x-auto px-3 py-2.5 scrollbar-none shrink-0">
          <div className="min-w-[120px] p-2.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-2xs">
            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Active Fleet</span>
              <Car className="w-3 h-3 text-blue-400" />
            </div>
            <div className="text-lg font-black text-white mt-0.5">{activeVehiclesCount}</div>
            <div className="text-[9px] text-blue-300 font-semibold truncate">9 Vehicle Profiles</div>
          </div>

          <div className="min-w-[120px] p-2.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-2xs">
            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Emergency</span>
              <Siren className="w-3 h-3 text-red-400" />
            </div>
            <div className="text-lg font-black text-red-400 mt-0.5">{activeEmergencyCount}</div>
            <div className="text-[9px] text-red-300 font-semibold truncate">Corridors Active</div>
          </div>

          <div className="min-w-[120px] p-2.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-2xs">
            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>ETA Savings</span>
              <TrendingDown className="w-3 h-3 text-emerald-400" />
            </div>
            <div className="text-lg font-black text-emerald-400 mt-0.5">{avgEtaReduction}</div>
            <div className="text-[9px] text-emerald-300 font-semibold truncate">QPSO Algorithm</div>
          </div>

          <div className="min-w-[120px] p-2.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-2xs">
            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Optimizations</span>
              <Zap className="w-3 h-3 text-cyan-400" />
            </div>
            <div className="text-lg font-black text-cyan-300 mt-0.5">{todayOptimizations}</div>
            <div className="text-[9px] text-slate-400 font-semibold truncate">Today's Convergence</div>
          </div>
        </div>

        {/* Quick Action Primary Grid */}
        <div className="px-3 py-1 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => navigate('/map')}
            className="p-3 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white text-left shadow-md flex flex-col justify-between active:scale-98 transition-all"
          >
            <div className="p-2 rounded-xl bg-white/20 w-fit mb-2">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-xs font-black">Plan QPSO Route</div>
              <div className="text-[10px] text-blue-100">Multi-corridor routing</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/emergency')}
            className="p-3 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 text-white text-left shadow-md flex flex-col justify-between active:scale-98 transition-all"
          >
            <div className="p-2 rounded-xl bg-white/20 w-fit mb-2">
              <Siren className="w-4 h-4 text-yellow-300" />
            </div>
            <div>
              <div className="text-xs font-black">Emergency Radar</div>
              <div className="text-[10px] text-red-100">Citizen give-way alerts</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/traffic')}
            className="p-3 rounded-2xl bg-slate-800 border border-slate-700 text-white text-left shadow-sm flex flex-col justify-between active:scale-98 transition-all"
          >
            <div className="p-2 rounded-xl bg-slate-700 w-fit mb-2">
              <Activity className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <div className="text-xs font-black">Traffic Analytics</div>
              <div className="text-[10px] text-slate-400">Live speed & forecasts</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/vehicles')}
            className="p-3 rounded-2xl bg-slate-800 border border-slate-700 text-white text-left shadow-sm flex flex-col justify-between active:scale-98 transition-all"
          >
            <div className="p-2 rounded-xl bg-slate-700 w-fit mb-2">
              <Car className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="text-xs font-black">Fleet Directory</div>
              <div className="text-[10px] text-slate-400">9 vehicle profiles</div>
            </div>
          </button>
        </div>

        {/* Live Map Preview */}
        <div className="px-3 py-2 flex flex-col space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>Urban Highway Network</span>
            <span className="text-[10px] text-blue-400 font-semibold">Live Traffic Overlay</span>
          </div>
          <div className="h-[260px] rounded-2xl overflow-hidden border border-slate-700/80 relative shadow-inner">
            <LeafletMap
              origin={safeOrigin}
              destination={mapState.destination}
              primaryRoute={mapState.primaryRoute || dashboardRoute}
              alternativeRoutes={mapState.alternativeRoutes}
              vehicleLocation={safeOrigin}
              vehicleType={mapState.vehicleType || 'ambulance'}
              activeAmbulanceAlert={mapState.activeAmbulance}
              incidents={dashboardIncidents}
              showEmergencyRadius={true}
              alertRadiusMeters={600}
              center={[safeOrigin.lat, safeOrigin.lng]}
              zoom={13}
              className="w-full h-full"
            />
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

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Top Operational Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                Control Center Live
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              MARGSETU Traffic Control & Fleet Operations Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              One Platform. Smarter Routes. Safer Roads. Powered by Quantum-Inspired Particle Swarm Optimization.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/map')}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md transition-all"
            >
              <Zap className="w-4 h-4" />
              <span>Launch Route Planner</span>
            </button>
            <button
              onClick={() => navigate('/emergency')}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md transition-all"
            >
              <Siren className="w-4 h-4" />
              <span>Emergency Radar</span>
            </button>
          </div>
        </div>

        {/* Operational Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-[10px] font-bold uppercase text-slate-400">Active Vehicles</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{activeVehiclesCount}</div>
            <div className="text-[10px] text-slate-500 mt-0.5 font-semibold">Across all 9 profiles</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-[10px] font-bold uppercase text-slate-400">Emergency Vehicles</div>
            <div className="text-2xl font-black text-red-600 mt-1">{activeEmergencyCount}</div>
            <div className="text-[10px] text-red-700 mt-0.5 font-bold">Priority corridors active</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-[10px] font-bold uppercase text-slate-400">Active Incidents</div>
            <div className="text-2xl font-black text-amber-600 mt-1">{activeIncidentsCount}</div>
            <div className="text-[10px] text-amber-700 mt-0.5 font-semibold">Accidents / Works</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-[10px] font-bold uppercase text-slate-400">Road Blockages</div>
            <div className="text-2xl font-black text-rose-600 mt-1">{activeBlockedCount}</div>
            <div className="text-[10px] text-rose-700 mt-0.5 font-bold">Detours engaged</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-[10px] font-bold uppercase text-slate-400">Avg. ETA Savings</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">{avgEtaReduction}</div>
            <div className="text-[10px] text-emerald-700 mt-0.5 font-bold">Via QPSO Metaheuristic</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-[10px] font-bold uppercase text-slate-400">Daily Optimizations</div>
            <div className="text-2xl font-black text-blue-600 mt-1">{todayOptimizations}</div>
            <div className="text-[10px] text-blue-700 mt-0.5 font-semibold">Sub-80ms convergence</div>
          </div>
        </div>

        {/* Live Control Center Map & Incident Table */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col space-y-3 min-h-[460px]">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center space-x-2">
                <Activity className="w-4 h-4 text-blue-600" />
                <span>Urban Highway & Multi-Corridor Telemetry Map</span>
              </h2>
              <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-bold">
                Smart City Live
              </span>
            </div>

            <div className="flex-1 w-full min-h-[400px] rounded-xl overflow-hidden relative">
              <LeafletMap
                origin={safeOrigin}
                destination={mapState.destination}
                primaryRoute={mapState.primaryRoute || dashboardRoute}
                alternativeRoutes={mapState.alternativeRoutes}
                vehicleLocation={safeOrigin}
                vehicleType={mapState.vehicleType || 'ambulance'}
                activeAmbulanceAlert={mapState.activeAmbulance}
                incidents={dashboardIncidents}
                showEmergencyRadius={true}
                alertRadiusMeters={600}
                center={[safeOrigin.lat, safeOrigin.lng]}
                className="w-full h-full min-h-[400px] rounded-xl"
              />
            </div>
          </div>

          {/* Quick Actions & Quick Links Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Quick Command Hub
              </h3>

              <div className="space-y-2">
                {[
                  { label: 'Plan Route (9 Vehicle Types)', path: '/map', desc: 'QPSO route planner with preferences', icon: Zap },
                  { label: 'Live Turn-by-Turn Navigation', path: '/navigate', desc: 'Rerouting triggers and speed HUD', icon: Clock },
                  { label: 'Emergency & Give-Way Radar', path: '/emergency', desc: 'Proximity broadcasts to citizens', icon: Siren },
                  { label: 'Traffic Simulation Injector', path: '/traffic', desc: 'Modify road congestion edge weights', icon: Activity },
                  { label: 'Report / Resolve Incidents', path: '/incidents', desc: 'Accidents, roadblocks, construction', icon: AlertTriangle },
                  { label: 'Multi-Modal Fleet Directory', path: '/vehicles', desc: 'Active monitoring across all 9 vehicle categories', icon: Car },
                  { label: 'Admin Control Center & Algorithm Studio', path: '/admin', desc: 'QPSO tuning, benchmarking lab, and weights', icon: ShieldCheck }
                ].map((action, idx) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => navigate(action.path)}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all text-left group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-slate-100 group-hover:bg-blue-600 group-hover:text-white rounded-lg text-slate-700 transition-colors">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">{action.label}</div>
                          <div className="text-[10px] text-slate-400">{action.desc}</div>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
