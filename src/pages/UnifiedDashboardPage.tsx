import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavigationNavbar from '@/components/NavigationNavbar';
import LeafletMap from '@/components/LeafletMap';
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
  RefreshCw
} from 'lucide-react';

export default function UnifiedDashboardPage() {
  const navigate = useNavigate();

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
                origin={{ lat: 20.2685, lng: 85.8360, name: 'Master Canteen' }}
                destination={{ lat: 20.3120, lng: 85.8180, name: 'AIIMS Hospital' }}
                primaryRoute={dashboardRoute}
                vehicleLocation={{ lat: 20.2780, lng: 85.8310, name: 'Active Fleet' }}
                vehicleType="ambulance"
                incidents={dashboardIncidents}
                showEmergencyRadius={true}
                alertRadiusMeters={600}
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
