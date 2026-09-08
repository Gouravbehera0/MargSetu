import NavigationNavbar from '@/components/NavigationNavbar';
import {
  BarChart3,
  TrendingDown,
  Clock,
  Car,
  Siren,
  Activity,
  Award,
  Zap,
  CheckCircle2
} from 'lucide-react';

export default function AnalyticsDashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <NavigationNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <span>Intelligent Transportation Analytics & KPIs</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            System-wide performance benchmarks, emergency response time reductions, and urban mobility efficiency indicators.
          </p>
        </div>

        {/* Big KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg. ETA Reduction</span>
              <span className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                <TrendingDown className="w-4 h-4" />
              </span>
            </div>
            <div className="text-3xl font-black text-emerald-600 mt-2">26.8%</div>
            <p className="text-xs text-slate-500 mt-1 font-medium">Compared to static shortest paths</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Emergency Clearance</span>
              <span className="p-2 bg-red-100 text-red-700 rounded-xl">
                <Siren className="w-4 h-4" />
              </span>
            </div>
            <div className="text-3xl font-black text-red-600 mt-2">4.1 min</div>
            <p className="text-xs text-slate-500 mt-1 font-medium">Average corridor clearance time</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">QPSO Optimizations</span>
              <span className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                <Zap className="w-4 h-4" />
              </span>
            </div>
            <div className="text-3xl font-black text-blue-600 mt-2">3,420+</div>
            <p className="text-xs text-slate-500 mt-1 font-medium">Autonomous runs in last 24h</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Citizen Give-Way Rate</span>
              <span className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>
            <div className="text-3xl font-black text-indigo-600 mt-2">94.2%</div>
            <p className="text-xs text-slate-500 mt-1 font-medium">Corridor compliance on alert broadcast</p>
          </div>
        </div>

        {/* Detailed Breakdown Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Modal Share by Vehicle Category */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Modal Share by Vehicle Category
            </h3>

            <div className="space-y-3">
              {[
                { name: 'Private Cars & Taxis', pct: 44, color: 'bg-blue-600' },
                { name: 'Two-Wheelers & Bikes', pct: 26, color: 'bg-cyan-500' },
                { name: 'Commercial Logistics & Trucks', pct: 18, color: 'bg-amber-500' },
                { name: 'Public Transit Buses', pct: 8, color: 'bg-indigo-600' },
                { name: 'Emergency Services (Priority)', pct: 4, color: 'bg-red-600' }
              ].map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>{item.name}</span>
                    <span>{item.pct}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Route Preferences Distribution */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              User Optimization Priorities Chosen
            </h3>

            <div className="space-y-3">
              {[
                { name: 'Fastest (Travel Time Priority)', pct: 48, color: 'bg-blue-600' },
                { name: 'Balanced (Multi-Objective)', pct: 28, color: 'bg-emerald-500' },
                { name: 'Low Traffic (Congestion Avoidance)', pct: 14, color: 'bg-indigo-500' },
                { name: 'Safest Corridor', pct: 6, color: 'bg-amber-500' },
                { name: 'Eco-Friendly Profile', pct: 4, color: 'bg-teal-500' }
              ].map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>{item.name}</span>
                    <span>{item.pct}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
