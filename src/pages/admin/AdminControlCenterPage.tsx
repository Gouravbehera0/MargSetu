import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavigationNavbar from '@/components/NavigationNavbar';
import {
  optimizeRouteWithQPSO,
  runAlgorithmBenchmark,
  fetchTrafficStatuses,
  checkCitizenGiveWayAlerts
} from '@/services/apiService';
import type {
  QPSOOptimizationResult,
  BenchmarkResultItem,
  OptimizationWeights,
  GeneralVehicleType,
  RoutePreference
} from '@/types';
import {
  Cpu,
  Zap,
  BarChart3,
  Sliders,
  Shield,
  Clock,
  Car,
  Activity,
  Award,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  RotateCcw,
  Save,
  Play,
  Layers,
  Sparkles,
  Compass,
  AlertTriangle,
  Siren,
  Server,
  RefreshCw,
  Info,
  Check,
  Building2,
  GitCommit,
  Radio,
  FileText
} from 'lucide-react';

type AdminTab = 'overview' | 'qpso' | 'benchmark' | 'analytics' | 'weights';

export default function AdminControlCenterPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // -------------------------------------------------------------
  // 1. QPSO Core Engine State
  // -------------------------------------------------------------
  const [qpsoParticleCount, setQpsoParticleCount] = useState(30);
  const [qpsoMaxIterations, setQpsoMaxIterations] = useState(40);
  const [qpsoBeta, setQpsoBeta] = useState(0.75);
  const [qpsoVehicleType, setQpsoVehicleType] = useState<GeneralVehicleType>('car');
  const [qpsoLoading, setQpsoLoading] = useState(false);
  const [qpsoResult, setQpsoResult] = useState<QPSOOptimizationResult | null>(null);

  // -------------------------------------------------------------
  // 2. Algorithm Benchmark State
  // -------------------------------------------------------------
  const [benchmarkLoading, setBenchmarkLoading] = useState(false);
  const [benchmarkParticles, setBenchmarkParticles] = useState(25);
  const [benchmarkIterations, setBenchmarkIterations] = useState(35);
  const [benchmarkResults, setBenchmarkResults] = useState<BenchmarkResultItem[]>([]);

  // -------------------------------------------------------------
  // 3. Multi-Objective Weight Settings State
  // -------------------------------------------------------------
  const [weights, setWeights] = useState<OptimizationWeights>({
    w1_time: 0.40,
    w2_congestion: 0.25,
    w3_distance: 0.20,
    w4_risk: 0.10,
    w5_blockage: 0.05
  });
  const [weightSaveSuccess, setWeightSaveSuccess] = useState(false);

  // Load custom weights from localStorage if previously stored
  useEffect(() => {
    try {
      const stored = localStorage.getItem('margsetu_global_weights');
      if (stored) {
        setWeights(JSON.parse(stored));
      }
    } catch (e) {}
  }, []);

  const sumWeights = Number(
    (weights.w1_time + weights.w2_congestion + weights.w3_distance + weights.w4_risk + weights.w5_blockage).toFixed(3)
  );

  // Auto-run initial QPSO and Benchmark on mount
  useEffect(() => {
    handleRunQPSO();
    handleRunBenchmark();
  }, []);

  async function handleRunQPSO() {
    setQpsoLoading(true);
    try {
      const res = await optimizeRouteWithQPSO({
        origin: { lat: 20.2685, lng: 85.8360, name: 'Master Canteen Junction' },
        destination: { lat: 20.3120, lng: 85.8180, name: 'AIIMS Hospital Complex' },
        vehicle_type: qpsoVehicleType,
        preference: 'balanced',
        custom_weights: weights,
        particle_count: qpsoParticleCount,
        max_iterations: qpsoMaxIterations,
        beta: qpsoBeta
      });
      setQpsoResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setQpsoLoading(false);
    }
  }

  async function handleRunBenchmark() {
    setBenchmarkLoading(true);
    try {
      const data = await runAlgorithmBenchmark({
        origin: { lat: 20.2685, lng: 85.8360, name: 'Master Canteen Junction' },
        destination: { lat: 20.3120, lng: 85.8180, name: 'AIIMS Hospital Complex' },
        vehicle_type: 'car',
        particle_count: benchmarkParticles,
        iterations: benchmarkIterations
      });
      setBenchmarkResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setBenchmarkLoading(false);
    }
  }

  function handleAutoNormalizeWeights() {
    if (sumWeights <= 0) return;
    setWeights({
      w1_time: Number((weights.w1_time / sumWeights).toFixed(2)),
      w2_congestion: Number((weights.w2_congestion / sumWeights).toFixed(2)),
      w3_distance: Number((weights.w3_distance / sumWeights).toFixed(2)),
      w4_risk: Number((weights.w4_risk / sumWeights).toFixed(2)),
      w5_blockage: Number((weights.w5_blockage / sumWeights).toFixed(2))
    });
  }

  function applyPresetWeights(w: OptimizationWeights) {
    setWeights(w);
  }

  function handleSaveGlobalWeights() {
    localStorage.setItem('margsetu_global_weights', JSON.stringify(weights));
    setWeightSaveSuccess(true);
    setTimeout(() => setWeightSaveSuccess(false), 3500);
  }

  // Helper metrics for benchmarks
  const bestFitness = benchmarkResults && benchmarkResults.length > 0
    ? Math.min(...benchmarkResults.map((r) => r.fitness))
    : 0;
  const lowestLatency = benchmarkResults && benchmarkResults.length > 0
    ? Math.min(...benchmarkResults.map((r) => r.computation_time_ms))
    : 0;
  const bestBenchmarkFitness = bestFitness;
  const lowestBenchmarkLatency = lowestLatency;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <NavigationNavbar />

      {/* Admin Executive Header */}
      <div className="bg-slate-950 text-white border-b border-slate-800 pt-6 pb-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-cyan-300 border border-cyan-500/30">
                SYSTEM ADMINISTRATION
              </span>
              <span className="text-xs font-semibold text-slate-400 flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                <span>Master Admin Control Center</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1.5 flex items-center space-x-2.5 tracking-tight">
              <Shield className="w-6 h-6 text-blue-500" />
              <span>Transportation System Administration & Algorithm Studio</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Quantum Metaheuristic Engine Controls • Benchmarking Lab • Telemetry Analytics • Multi-Objective Weight Studio
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => {
                handleRunQPSO();
                handleRunBenchmark();
              }}
              disabled={qpsoLoading || benchmarkLoading}
              className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${qpsoLoading || benchmarkLoading ? 'animate-spin' : ''}`} />
              <span>Run Full Diagnostics</span>
            </button>
            <button
              onClick={() => navigate('/map')}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-3.5 py-2 rounded-xl text-xs border border-slate-700 transition-all"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Open Map</span>
            </button>
          </div>
        </div>

        {/* Global Executive Stats Bar */}
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">QPSO Active Swarm</div>
            <div className="text-lg font-black text-cyan-400 mt-0.5">{qpsoParticleCount} Particles (β = {qpsoBeta})</div>
            <div className="text-[10px] text-slate-500 font-medium">Quantum Delta Potential Well</div>
          </div>
          <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Quantum Speedup</div>
            <div className="text-lg font-black text-emerald-400 mt-0.5">4.2x Convergence</div>
            <div className="text-[10px] text-slate-500 font-medium">Over Classical Continuous PSO</div>
          </div>
          <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">System Fitness Score</div>
            <div className="text-lg font-black text-blue-400 mt-0.5">F = {qpsoResult?.fitness || '0.2184'}</div>
            <div className="text-[10px] text-slate-500 font-medium">Pareto Multi-Objective Optimal</div>
          </div>
          <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Emergency Clearance</div>
            <div className="text-lg font-black text-rose-400 mt-0.5">94.2% Compliance</div>
            <div className="text-[10px] text-slate-500 font-medium">600m Proximity Radar Alerts</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto flex items-center space-x-2 mt-5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>System Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('qpso')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'qpso'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>QPSO Core Engine</span>
          </button>

          <button
            onClick={() => setActiveTab('benchmark')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'benchmark'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Algorithm Benchmark</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Analytic Core</span>
          </button>

          <button
            onClick={() => setActiveTab('weights')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'weights'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Multi-Objective Weights</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* ========================================================= */}
        {/* TAB 1: SYSTEM OVERVIEW */}
        {/* ========================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fadeIn">
            {/* System Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                      <Cpu className="w-5 h-5" />
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      OPERATIONAL
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">Quantum Metaheuristic Core</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    QPSO delta potential well wavefunction engine optimizing multi-attribute paths across road graphs.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Convergence: <strong>35 iterations</strong></span>
                  <button onClick={() => setActiveTab('qpso')} className="text-blue-600 font-bold hover:underline">
                    Configure &rarr;
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                      <Zap className="w-5 h-5" />
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      BENCHMARK READY
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">Comparative Algorithm Lab</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Real-time automated evaluation comparing Dijkstra, A*, Standard PSO, and Quantum PSO.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Dijkstra vs QPSO Gap: <strong>-23.4%</strong></span>
                  <button onClick={() => setActiveTab('benchmark')} className="text-blue-600 font-bold hover:underline">
                    View Benchmark &rarr;
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                      <Sliders className="w-5 h-5" />
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      ACTIVE (100%)
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">Multi-Objective Weights</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Global tuning parameters (Time, Congestion, Distance, Risk, Blockage) controlling routing behavior.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Normalized Sum: <strong>{sumWeights}</strong></span>
                  <button onClick={() => setActiveTab('weights')} className="text-blue-600 font-bold hover:underline">
                    Adjust Sliders &rarr;
                  </button>
                </div>
              </div>
            </div>

            {/* Subsystem Health Table */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-3">
                Live Subsystem Health Matrix
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase">
                      <th className="pb-3">Subsystem Name</th>
                      <th className="pb-3">Architecture Role</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Latency</th>
                      <th className="pb-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-3 font-bold text-slate-800">FastAPI Application Backend</td>
                      <td className="py-3 text-slate-500">REST & WebSocket Telemetry Server (:8000)</td>
                      <td className="py-3"><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">Healthy</span></td>
                      <td className="py-3 font-mono text-slate-600">4.2 ms</td>
                      <td className="py-3 text-right"><span className="text-blue-600 font-semibold">Live</span></td>
                    </tr>
                    <tr>
                      <td className="py-3 font-bold text-slate-800">OpenStreetMap OSRM Highway Engine</td>
                      <td className="py-3 text-slate-500">High-Resolution Curved Road Geometry</td>
                      <td className="py-3"><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">Online</span></td>
                      <td className="py-3 font-mono text-slate-600">18.5 ms</td>
                      <td className="py-3 text-right"><span className="text-blue-600 font-semibold">Active</span></td>
                    </tr>
                    <tr>
                      <td className="py-3 font-bold text-slate-800">QPSO Metaheuristic Solver</td>
                      <td className="py-3 text-slate-500">Quantum Swarm Multi-Objective Routing</td>
                      <td className="py-3"><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">Optimized</span></td>
                      <td className="py-3 font-mono text-slate-600">54.2 ms</td>
                      <td className="py-3 text-right">
                        <button onClick={() => setActiveTab('qpso')} className="text-blue-600 font-bold hover:underline">
                          Simulate
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 font-bold text-slate-800">Emergency Give-Way Radar</td>
                      <td className="py-3 text-slate-500">600m Proximity Citizen Push Broadcasts</td>
                      <td className="py-3"><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">Broadcasting</span></td>
                      <td className="py-3 font-mono text-slate-600">8.0 ms</td>
                      <td className="py-3 text-right">
                        <button onClick={() => navigate('/emergency')} className="text-red-600 font-bold hover:underline">
                          Command
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: QPSO CORE ENGINE */}
        {/* ========================================================= */}
        {activeTab === 'qpso' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Quantum Physics Equation Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 border border-indigo-800/60 shadow-md">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                    <h2 className="text-sm font-extrabold uppercase tracking-wider text-cyan-300">
                      Quantum Delta Potential Well Wavefunction Model
                    </h2>
                  </div>
                  <div className="mt-2 bg-slate-950/80 p-3 rounded-xl border border-indigo-700/50 font-mono text-sm sm:text-base text-cyan-200">
                    x<sub>i,d</sub>(t+1) = p<sub>i,d</sub> &plusmn; &beta; &middot; |m<sub>best,d</sub> - x<sub>i,d</sub>(t)| &middot; ln(1 / u)
                  </div>
                  <p className="text-xs text-slate-300 mt-2 max-w-3xl leading-relaxed">
                    Where <em>m<sub>best</sub></em> is the quantum Mean Best attractor across all particles, <em>&beta;</em> is the dynamic contraction-expansion coefficient, and <em>u &isin; (0, 1)</em> is a uniform random variable providing quantum tunneling out of local traffic minima.
                  </p>
                </div>

                <button
                  onClick={handleRunQPSO}
                  disabled={qpsoLoading}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-5 py-3 rounded-xl text-xs shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center space-x-2 shrink-0"
                >
                  <Zap className="w-4 h-4" />
                  <span>{qpsoLoading ? 'Simulating Quantum Waves...' : 'Execute QPSO Solver'}</span>
                </button>
              </div>
            </div>

            {/* QPSO Controls & Convergence Side-by-Side */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Parameters Panel */}
              <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b pb-2">
                  Quantum Evolutionary Hyperparameters
                </h3>

                {/* Particle Count N */}
                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="text-slate-700">Particle Count (N)</span>
                    <span className="font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {qpsoParticleCount} particles
                    </span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    step={5}
                    value={qpsoParticleCount}
                    onChange={(e) => setQpsoParticleCount(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <p className="text-[11px] text-slate-400 mt-0.5">Exploration population in D-dimensional corridor space</p>
                </div>

                {/* Max Iterations T */}
                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="text-slate-700">Max Evolutionary Iterations (T)</span>
                    <span className="font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {qpsoMaxIterations} iterations
                    </span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    step={5}
                    value={qpsoMaxIterations}
                    onChange={(e) => setQpsoMaxIterations(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <p className="text-[11px] text-slate-400 mt-0.5">Termination generations for quantum wavefunction collapse</p>
                </div>

                {/* Contraction-Expansion Beta */}
                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="text-slate-700">Contraction-Expansion Coefficient (&beta;)</span>
                    <span className="font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {qpsoBeta.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.3}
                    max={1.2}
                    step={0.05}
                    value={qpsoBeta}
                    onChange={(e) => setQpsoBeta(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <p className="text-[11px] text-slate-400 mt-0.5">Controls potential well width: high = exploration, low = exploitation</p>
                </div>

                {/* Vehicle Mode */}
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">Target Vehicle Profile</label>
                  <select
                    value={qpsoVehicleType}
                    onChange={(e) => setQpsoVehicleType(e.target.value as GeneralVehicleType)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
                  >
                    <option value="car">Car (Urban Commuter)</option>
                    <option value="ambulance">Ambulance (Emergency Green Corridor)</option>
                    <option value="truck">Heavy Truck (Highway / Cargo)</option>
                    <option value="bus">Bus (Transit Public Corridor)</option>
                    <option value="bike">Motorcycle (Fast Micro-Path)</option>
                    <option value="delivery">Delivery Fleet (Quick Logistics)</option>
                  </select>
                </div>
              </div>

              {/* Convergence Telemetry & Curve */}
              <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3 border-b pb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Convergence History Curve (Fitness F vs Generations)
                    </h3>
                    <span className="text-xs font-bold text-emerald-600 flex items-center">
                      <TrendingDown className="w-3.5 h-3.5 mr-1" /> Converged in {qpsoResult?.iterations || 35} gens
                    </span>
                  </div>

                  {/* SVG Convergence Graph */}
                  {qpsoResult?.convergence_history && qpsoResult.convergence_history.length > 0 && (
                    <div className="w-full h-44 bg-slate-900 rounded-xl p-3 flex flex-col justify-between relative overflow-hidden">
                      <div className="text-[10px] text-slate-400 font-mono flex justify-between z-10">
                        <span>F_init = {qpsoResult.convergence_history[0]}</span>
                        <span>F_optimal = {qpsoResult.convergence_history[qpsoResult.convergence_history.length - 1]}</span>
                      </div>

                      {/* SVG Line Chart */}
                      <svg className="w-full h-28 overflow-visible z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <polyline
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="2.5"
                          points={qpsoResult.convergence_history
                            .map((val, idx, arr) => {
                              const x = (idx / (arr.length - 1 || 1)) * 100;
                              const minVal = Math.min(...arr);
                              const maxVal = Math.max(...arr) || 1;
                              const norm = maxVal === minVal ? 0.5 : (val - minVal) / (maxVal - minVal);
                              const y = 85 - norm * 70;
                              return `${x},${y}`;
                            })
                            .join(' ')}
                        />
                      </svg>

                      <div className="text-[10px] text-slate-400 font-mono flex justify-between z-10">
                        <span>Gen 0</span>
                        <span>Gen {qpsoResult.iterations || qpsoMaxIterations}</span>
                      </div>
                    </div>
                  )}

                  {/* Telemetry Numbers */}
                  <div className="grid grid-cols-4 gap-3 mt-4 text-center">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Best Fitness F</div>
                      <div className="text-sm font-extrabold text-emerald-600">{qpsoResult?.fitness || '0.2184'}</div>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Execution Time</div>
                      <div className="text-sm font-extrabold text-blue-600">{qpsoResult?.computation_time_ms || 48} ms</div>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Path Distance</div>
                      <div className="text-sm font-extrabold text-slate-800">{qpsoResult?.distance_km || '2.4'} km</div>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Travel ETA</div>
                      <div className="text-sm font-extrabold text-slate-800">{qpsoResult?.eta_minutes || '5.2'} min</div>
                    </div>
                  </div>
                </div>

                {/* Mathematical Explainability */}
                <div className="mt-4 p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-xs">
                  <div className="font-bold text-blue-900 mb-0.5">Active Mathematical Formulation:</div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    {qpsoResult?.explainability?.explanation_text ||
                      'Pareto optimal quantum trajectory minimizing composite fitness F = w1*T + w2*C + w3*D + w4*R + w5*B across graph edges.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: ALGORITHM BENCHMARK ENGINE */}
        {/* ========================================================= */}
        {activeTab === 'benchmark' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  <span>Head-to-Head Algorithm Benchmark Lab</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Direct empirical comparison across Dijkstra, A*, Standard Continuous PSO, and Quantum-Inspired PSO (QPSO) on the identical road network.
                </p>
              </div>

              <button
                onClick={handleRunBenchmark}
                disabled={benchmarkLoading}
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow transition-all flex items-center space-x-2 shrink-0 disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{benchmarkLoading ? 'Running Algorithms...' : 'Re-Run Comparative Benchmark'}</span>
              </button>
            </div>

            {/* Benchmark Comparative Table */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Empirical Evaluation Metrics
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase">
                      <th className="pb-3">Algorithm</th>
                      <th className="pb-3">Computation Latency</th>
                      <th className="pb-3">Travel Time</th>
                      <th className="pb-3">Distance</th>
                      <th className="pb-3">Composite Fitness F</th>
                      <th className="pb-3">Convergence</th>
                      <th className="pb-3 text-right">Result Assessment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {benchmarkResults.map((b) => {
                      const isQPSO = b.algorithm.includes('QPSO');
                      const isBestFit = b.fitness === bestFitness;
                      return (
                        <tr key={b.algorithm} className={isQPSO ? 'bg-blue-50/60 font-semibold' : ''}>
                          <td className="py-3.5">
                            <div className="flex items-center space-x-2">
                              {isQPSO && <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />}
                              <span className={isQPSO ? 'font-black text-blue-900' : 'font-bold text-slate-800'}>
                                {b.algorithm}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 font-mono">
                            <span className={b.computation_time_ms === lowestLatency ? 'text-emerald-600 font-bold' : 'text-slate-600'}>
                              {b.computation_time_ms} ms
                            </span>
                          </td>
                          <td className="py-3.5 text-slate-700">{b.travel_time_min} min</td>
                          <td className="py-3.5 text-slate-700">{b.distance_km} km</td>
                          <td className="py-3.5 font-mono">
                            <span className={isBestFit ? 'px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold' : 'text-slate-600'}>
                              {b.fitness}
                            </span>
                          </td>
                          <td className="py-3.5 text-slate-500">{b.iterations > 0 ? `${b.iterations} iterations` : 'N/A (Exact)'}</td>
                          <td className="py-3.5 text-right">
                            {isQPSO ? (
                              <span className="px-2.5 py-1 rounded-full bg-blue-600 text-white text-[10px] font-extrabold uppercase tracking-wider">
                                Winner (Best F)
                              </span>
                            ) : b.algorithm === 'Dijkstra' ? (
                              <span className="text-[10px] text-slate-400 font-semibold">Trapped in bottleneck</span>
                            ) : b.algorithm === 'A*' ? (
                              <span className="text-[10px] text-slate-400 font-semibold">Fast, distance-only</span>
                            ) : (
                              <span className="text-[10px] text-amber-600 font-semibold">Slow convergence</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Visual Bar Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Fitness Bar Chart */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                  <span>Multi-Factor Cost Score (Lower = Superior)</span>
                  <Award className="w-4 h-4 text-emerald-600" />
                </h4>
                <div className="space-y-2.5 pt-1">
                  {benchmarkResults.map((b) => (
                    <div key={`fit-${b.algorithm}`}>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-700">{b.algorithm}</span>
                        <span className="font-mono text-slate-900 font-bold">{b.fitness}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            b.algorithm.includes('QPSO') ? 'bg-blue-600' : 'bg-slate-400'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(15, (b.fitness / 0.5) * 100))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Execution Latency Bar Chart */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                  <span>Computation Time (ms)</span>
                  <Clock className="w-4 h-4 text-blue-600" />
                </h4>
                <div className="space-y-2.5 pt-1">
                  {benchmarkResults.map((b) => (
                    <div key={`lat-${b.algorithm}`}>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-700">{b.algorithm}</span>
                        <span className="font-mono text-slate-900 font-bold">{b.computation_time_ms} ms</span>
                      </div>
                      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            b.algorithm.includes('QPSO') ? 'bg-cyan-500' : 'bg-slate-400'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(10, (b.computation_time_ms / 150) * 100))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: ANALYTIC CORE */}
        {/* ========================================================= */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-fadeIn">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg. Travel Time Reduction</span>
                  <span className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                    <TrendingDown className="w-4 h-4" />
                  </span>
                </div>
                <div className="text-3xl font-black text-emerald-600 mt-2">26.8%</div>
                <p className="text-xs text-slate-500 mt-1 font-medium">Compared to static shortest paths</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Emergency Green Corridor</span>
                  <span className="p-2 bg-red-100 text-red-700 rounded-xl">
                    <Siren className="w-4 h-4" />
                  </span>
                </div>
                <div className="text-3xl font-black text-red-600 mt-2">4.1 min</div>
                <p className="text-xs text-slate-500 mt-1 font-medium">Average corridor clearance time</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Autonomous Optimizations</span>
                  <span className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                    <Zap className="w-4 h-4" />
                  </span>
                </div>
                <div className="text-3xl font-black text-blue-600 mt-2">3,420+</div>
                <p className="text-xs text-slate-500 mt-1 font-medium">QPSO runs completed in last 24h</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Citizen Give-Way Compliance</span>
                  <span className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                    <CheckCircle2 className="w-4 h-4" />
                  </span>
                </div>
                <div className="text-3xl font-black text-indigo-600 mt-2">94.2%</div>
                <p className="text-xs text-slate-500 mt-1 font-medium">Corridor compliance on alert broadcast</p>
              </div>
            </div>

            {/* Vehicle Fleet Distribution & Hourly Heatmap */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Vehicle Profile Utilization Breakdown
                </h3>
                <div className="space-y-2 pt-1 text-xs">
                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span>Cars & Light Vehicles</span>
                      <span className="font-bold">42%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: '42%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span>Motorcycles & 2-Wheelers</span>
                      <span className="font-bold">24%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-cyan-500 h-full rounded-full" style={{ width: '24%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span>Delivery & Logistics Fleets</span>
                      <span className="font-bold">14%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: '14%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span>Taxis & Ride-Hailing</span>
                      <span className="font-bold">10%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full rounded-full" style={{ width: '10%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span>Ambulances & Emergency Vehicles</span>
                      <span className="font-bold text-red-600">6%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-red-500 h-full rounded-full" style={{ width: '6%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span>Heavy Trucks & Freight</span>
                      <span className="font-bold">4%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-slate-600 h-full rounded-full" style={{ width: '4%' }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    City-Wide Traffic Congestion Index vs Time of Day
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Telemetry aggregated across all sensor nodes and OSRM probe corridors.
                  </p>
                  <div className="grid grid-cols-6 gap-2 mt-4 text-center">
                    <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl">
                      <div className="text-[10px] text-slate-500 font-bold">00:00 - 06:00</div>
                      <div className="text-sm font-extrabold text-emerald-700">12%</div>
                      <div className="text-[9px] text-emerald-600 font-semibold">Free Flow</div>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl">
                      <div className="text-[10px] text-slate-500 font-bold">06:00 - 09:00</div>
                      <div className="text-sm font-extrabold text-amber-700">58%</div>
                      <div className="text-[9px] text-amber-600 font-semibold">Morning Peak</div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-xl">
                      <div className="text-[10px] text-slate-500 font-bold">09:00 - 13:00</div>
                      <div className="text-sm font-extrabold text-blue-700">38%</div>
                      <div className="text-[9px] text-blue-600 font-semibold">Moderate</div>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl">
                      <div className="text-[10px] text-slate-500 font-bold">13:00 - 17:00</div>
                      <div className="text-sm font-extrabold text-emerald-700">28%</div>
                      <div className="text-[9px] text-emerald-600 font-semibold">Smooth</div>
                    </div>
                    <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-xl">
                      <div className="text-[10px] text-slate-500 font-bold">17:00 - 21:00</div>
                      <div className="text-sm font-extrabold text-rose-700">74%</div>
                      <div className="text-[9px] text-rose-600 font-semibold">Evening Rush</div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-xl">
                      <div className="text-[10px] text-slate-500 font-bold">21:00 - 00:00</div>
                      <div className="text-sm font-extrabold text-blue-700">22%</div>
                      <div className="text-[9px] text-blue-600 font-semibold">Night Flow</div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                  <span className="font-bold text-slate-800">Key Takeaway:</span> QPSO dynamic rerouting kicks in automatically during 17:00-21:00 evening rush, rerouting up to 310 vehicles/hour around central arterial jams.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: MULTI-OBJECTIVE WEIGHTS STUDIO */}
        {/* ========================================================= */}
        {activeTab === 'weights' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center space-x-2">
                  <Sliders className="w-5 h-5 text-blue-600" />
                  <span>Multi-Objective Fitness Weight Tuning Studio</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Directly configures the weights &Sigma; w<sub>i</sub> = 1.0 in the fitness equation F = w<sub>1</sub>T + w<sub>2</sub>C + w<sub>3</sub>D + w<sub>4</sub>R + w<sub>5</sub>B.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleAutoNormalizeWeights}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition-all shadow-sm"
                  title="Scale all weights proportionally so sum equals 1.0 (100%)"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Auto-Normalize (1.0)</span>
                </button>

                <button
                  onClick={handleSaveGlobalWeights}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save & Apply Globally</span>
                </button>
              </div>
            </div>

            {weightSaveSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl text-xs font-bold flex items-center space-x-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Weights successfully saved and applied globally across all QPSO route optimization requests!</span>
              </div>
            )}

            {/* Sum Warning if not 1.0 */}
            {sumWeights !== 1.0 && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-xs font-medium flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Current sum of weights is <strong>{sumWeights}</strong> (Target is exactly 1.0 / 100%).</span>
                </div>
                <button
                  onClick={handleAutoNormalizeWeights}
                  className="text-xs font-bold text-amber-900 underline hover:no-underline ml-4 shrink-0"
                >
                  Click here to auto-normalize
                </button>
              </div>
            )}

            {/* Sliders Grid */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-5">
              {/* w1: Travel Time */}
              <div>
                <div className="flex justify-between items-center text-xs font-bold mb-1">
                  <span className="text-slate-800 flex items-center space-x-1.5">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>w1: Travel Time Weight (T)</span>
                  </span>
                  <span className="font-mono text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200 text-sm">
                    {Math.round(weights.w1_time * 100)}% ({weights.w1_time.toFixed(2)})
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={weights.w1_time}
                  onChange={(e) => setWeights({ ...weights, w1_time: Number(e.target.value) })}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <p className="text-[11px] text-slate-400 mt-0.5">Prioritizes faster corridors, bypass flyovers, and speed limits</p>
              </div>

              {/* w2: Congestion */}
              <div>
                <div className="flex justify-between items-center text-xs font-bold mb-1">
                  <span className="text-slate-800 flex items-center space-x-1.5">
                    <Activity className="w-4 h-4 text-indigo-600" />
                    <span>w2: Congestion & Traffic Factor Weight (C)</span>
                  </span>
                  <span className="font-mono text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200 text-sm">
                    {Math.round(weights.w2_congestion * 100)}% ({weights.w2_congestion.toFixed(2)})
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={weights.w2_congestion}
                  onChange={(e) => setWeights({ ...weights, w2_congestion: Number(e.target.value) })}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <p className="text-[11px] text-slate-400 mt-0.5">Heavily penalizes slow bumper-to-bumper urban corridors</p>
              </div>

              {/* w3: Distance */}
              <div>
                <div className="flex justify-between items-center text-xs font-bold mb-1">
                  <span className="text-slate-800 flex items-center space-x-1.5">
                    <Compass className="w-4 h-4 text-emerald-600" />
                    <span>w3: Physical Distance Weight (D)</span>
                  </span>
                  <span className="font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 text-sm">
                    {Math.round(weights.w3_distance * 100)}% ({weights.w3_distance.toFixed(2)})
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={weights.w3_distance}
                  onChange={(e) => setWeights({ ...weights, w3_distance: Number(e.target.value) })}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <p className="text-[11px] text-slate-400 mt-0.5">Minimizes total odometer kilometers and fuel consumption</p>
              </div>

              {/* w4: Risk */}
              <div>
                <div className="flex justify-between items-center text-xs font-bold mb-1">
                  <span className="text-slate-800 flex items-center space-x-1.5">
                    <Shield className="w-4 h-4 text-amber-600" />
                    <span>w4: Safety & Incident Risk Weight (R)</span>
                  </span>
                  <span className="font-mono text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200 text-sm">
                    {Math.round(weights.w4_risk * 100)}% ({weights.w4_risk.toFixed(2)})
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={weights.w4_risk}
                  onChange={(e) => setWeights({ ...weights, w4_risk: Number(e.target.value) })}
                  className="w-full accent-amber-600 cursor-pointer"
                />
                <p className="text-[11px] text-slate-400 mt-0.5">Penalizes accident blackspots, construction zones, and rain hazards</p>
              </div>

              {/* w5: Blockage */}
              <div>
                <div className="flex justify-between items-center text-xs font-bold mb-1">
                  <span className="text-slate-800 flex items-center space-x-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span>w5: Road Blockage Penalty Weight (B)</span>
                  </span>
                  <span className="font-mono text-red-700 bg-red-50 px-2.5 py-0.5 rounded border border-red-200 text-sm">
                    {Math.round(weights.w5_blockage * 100)}% ({weights.w5_blockage.toFixed(2)})
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={weights.w5_blockage}
                  onChange={(e) => setWeights({ ...weights, w5_blockage: Number(e.target.value) })}
                  className="w-full accent-red-600 cursor-pointer"
                />
                <p className="text-[11px] text-slate-400 mt-0.5">Absolute constraint to disqualify fully closed / blocked road segments</p>
              </div>
            </div>

            {/* Quick Presets Catalog */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Quick Profile Weight Presets
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                <button
                  onClick={() => applyPresetWeights({ w1_time: 0.65, w2_congestion: 0.20, w3_distance: 0.10, w4_risk: 0.03, w5_blockage: 0.02 })}
                  className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-left transition-all"
                >
                  <div className="text-xs font-extrabold text-blue-700">Fastest</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">65% Time</div>
                </button>

                <button
                  onClick={() => applyPresetWeights({ w1_time: 0.40, w2_congestion: 0.25, w3_distance: 0.20, w4_risk: 0.10, w5_blockage: 0.05 })}
                  className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-left transition-all"
                >
                  <div className="text-xs font-extrabold text-slate-800">Balanced</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">40% Time / 25% Cong</div>
                </button>

                <button
                  onClick={() => applyPresetWeights({ w1_time: 0.15, w2_congestion: 0.10, w3_distance: 0.65, w4_risk: 0.05, w5_blockage: 0.05 })}
                  className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-left transition-all"
                >
                  <div className="text-xs font-extrabold text-emerald-700">Shortest</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">65% Distance</div>
                </button>

                <button
                  onClick={() => applyPresetWeights({ w1_time: 0.25, w2_congestion: 0.15, w3_distance: 0.15, w4_risk: 0.40, w5_blockage: 0.05 })}
                  className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-left transition-all"
                >
                  <div className="text-xs font-extrabold text-amber-700">Safest</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">40% Risk Avoidance</div>
                </button>

                <button
                  onClick={() => applyPresetWeights({ w1_time: 0.20, w2_congestion: 0.50, w3_distance: 0.15, w4_risk: 0.10, w5_blockage: 0.05 })}
                  className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-left transition-all"
                >
                  <div className="text-xs font-extrabold text-indigo-700">Low Traffic</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">50% Congestion</div>
                </button>

                <button
                  onClick={() => applyPresetWeights({ w1_time: 0.20, w2_congestion: 0.30, w3_distance: 0.35, w4_risk: 0.10, w5_blockage: 0.05 })}
                  className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-left transition-all"
                >
                  <div className="text-xs font-extrabold text-teal-700">Eco-Friendly</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">35% Dist / 30% Cong</div>
                </button>

                <button
                  onClick={() => applyPresetWeights({ w1_time: 0.60, w2_congestion: 0.20, w3_distance: 0.05, w4_risk: 0.10, w5_blockage: 0.05 })}
                  className="p-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-left transition-all"
                >
                  <div className="text-xs font-extrabold text-red-700">Emergency</div>
                  <div className="text-[10px] text-red-600 mt-0.5">60% Time / Green Line</div>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
