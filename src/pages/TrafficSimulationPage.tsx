import { useState, useEffect } from 'react';
import NavigationNavbar from '@/components/NavigationNavbar';
import { fetchTrafficStatuses, updateTrafficStatus } from '@/services/apiService';
import {
  Activity,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  CheckCircle2,
  Sliders,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface RoadSegmentStatus {
  edge_id: string;
  name: string;
  from_node?: string;
  to_node?: string;
  distance_km?: number;
  travel_time_min?: number;
  speed_limit_kmh?: number;
  traffic_level: 'low' | 'medium' | 'high' | 'severe' | 'blocked';
  congestion_factor: number;
  is_blocked: boolean;
}

export default function TrafficSimulationPage() {
  const [roads, setRoads] = useState<RoadSegmentStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadRoads();
  }, []);

  async function loadRoads() {
    setLoading(true);
    try {
      const data = await fetchTrafficStatuses();
      setRoads(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateLevel(edgeId: string, level: any, isBlocked: boolean = false) {
    try {
      await updateTrafficStatus(edgeId, level, isBlocked);
      setRoads((prev) =>
        prev.map((r) =>
          r.edge_id === edgeId
            ? {
                ...r,
                traffic_level: level,
                is_blocked: isBlocked,
                congestion_factor: level === 'blocked' ? 1.0 : level === 'high' ? 0.7 : level === 'medium' ? 0.35 : 0.15
              }
            : r
        )
      );
      setToastMessage(
        `Dynamic Edge Weight Updated: Road segment ${edgeId} shifted to ${level.toUpperCase()}. Recalculating affected QPSO paths...`
      );
      setTimeout(() => setToastMessage(null), 4000);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <NavigationNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Dynamic Recalculation Toast */}
        {toastMessage && (
          <div className="bg-navy-900 text-white p-4 rounded-2xl shadow-xl border border-blue-500/30 flex items-center space-x-3 animate-fadeIn">
            <span className="p-2 bg-blue-500/20 rounded-xl text-cyan-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </span>
            <div className="text-xs font-semibold">{toastMessage}</div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center space-x-2">
              <Activity className="w-6 h-6 text-blue-600" />
              <span>Real-Time Traffic Network Simulator</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Inject live congestion levels or road closures into graph edge weights to observe instantaneous QPSO rerouting.
            </p>
          </div>

          <button
            onClick={loadRoads}
            className="flex items-center space-x-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs shadow-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Network</span>
          </button>
        </div>

        {/* Traffic Level Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-bold text-slate-400 uppercase">Free Flow (Low)</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {roads.filter((r) => r.traffic_level === 'low').length} Roads
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Congestion index &lt; 0.25</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-bold text-slate-400 uppercase">Moderate (Medium)</div>
            <div className="text-2xl font-black text-blue-600 mt-1">
              {roads.filter((r) => r.traffic_level === 'medium').length} Roads
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Congestion index 0.25 - 0.50</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-bold text-slate-400 uppercase">Heavy (High)</div>
            <div className="text-2xl font-black text-amber-600 mt-1">
              {roads.filter((r) => r.traffic_level === 'high' || r.traffic_level === 'severe').length} Roads
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Speed drops by 40-70%</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-bold text-slate-400 uppercase">Blocked / Closed</div>
            <div className="text-2xl font-black text-rose-600 mt-1">
              {roads.filter((r) => r.is_blocked || r.traffic_level === 'blocked').length} Roads
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Triggers emergency detours</div>
          </div>
        </div>

        {/* Road Segments Interactive List */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4">
            Network Edge Segments & Live Condition Injectors
          </h2>

          <div className="divide-y divide-slate-100">
            {roads.map((road) => (
              <div
                key={road.edge_id}
                className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {road.edge_id}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{road.name}</h3>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-slate-500 mt-1.5 font-medium">
                    <span>Travel Time: {road.travel_time_min || 3.2} min</span>
                    <span>•</span>
                    <span>Congestion Index: {road.congestion_factor}</span>
                    <span>•</span>
                    <span>
                      Status:{' '}
                      <strong
                        className={
                          road.is_blocked
                            ? 'text-rose-600'
                            : road.traffic_level === 'high'
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                        }
                      >
                        {road.is_blocked ? 'BLOCKED' : road.traffic_level.toUpperCase()}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Level Change Pill Buttons */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => handleUpdateLevel(road.edge_id, 'low', false)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                      road.traffic_level === 'low' && !road.is_blocked
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Low
                  </button>
                  <button
                    onClick={() => handleUpdateLevel(road.edge_id, 'medium', false)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                      road.traffic_level === 'medium' && !road.is_blocked
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Medium
                  </button>
                  <button
                    onClick={() => handleUpdateLevel(road.edge_id, 'high', false)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                      road.traffic_level === 'high' && !road.is_blocked
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    High
                  </button>
                  <button
                    onClick={() => handleUpdateLevel(road.edge_id, 'blocked', true)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                      road.is_blocked
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                    }`}
                  >
                    Block Road
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
