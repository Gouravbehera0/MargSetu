import { useState, useEffect } from 'react';
import NavigationNavbar from '@/components/NavigationNavbar';
import { runAlgorithmBenchmark } from '@/services/apiService';
import type { BenchmarkResultItem } from '@/types';
import {
  Zap,
  BarChart3,
  Clock,
  CheckCircle2,
  TrendingDown,
  Play,
  RotateCcw,
  Sparkles,
  Award,
  Layers
} from 'lucide-react';

export default function AlgorithmBenchmarkPage() {
  const [loading, setLoading] = useState(false);
  const [particleCount, setParticleCount] = useState(25);
  const [iterations, setIterations] = useState(40);
  const [results, setResults] = useState<BenchmarkResultItem[]>([]);

  useEffect(() => {
    handleRunBenchmark();
  }, []);

  async function handleRunBenchmark() {
    setLoading(true);
    try {
      const data = await runAlgorithmBenchmark({
        origin: { lat: 20.2685, lng: 85.8360, name: 'Master Canteen' },
        destination: { lat: 20.3120, lng: 85.8180, name: 'AIIMS Hospital' },
        vehicle_type: 'car',
        particle_count: particleCount,
        iterations: iterations
      });
      setResults(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // Identify best fitness and lowest computation time
  const bestFitness = results.length > 0 ? Math.min(...results.map((r) => r.fitness)) : 0;
  const lowestLatency = results.length > 0 ? Math.min(...results.map((r) => r.computation_time_ms)) : 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <NavigationNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded bg-blue-100 text-blue-800">
                Benchmarking Lab
              </span>
              <span className="text-xs font-bold text-slate-400">Metaheuristic Routing Performance Evaluation</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 flex items-center space-x-2">
              <Zap className="w-6 h-6 text-amber-500" />
              <span>Comparative Algorithm Performance Lab</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Live experimental comparison of Dijkstra, A*, Standard PSO, and Quantum-Inspired PSO (QPSO) on the identical road network.
            </p>
          </div>

          <button
            onClick={handleRunBenchmark}
            disabled={loading}
            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md transition-all disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            <span>{loading ? 'Executing Algorithms...' : 'Run Benchmark Experiment'}</span>
          </button>
        </div>

        {/* Experiment Setup Controls */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-6 text-xs font-medium text-slate-600">
            <div>
              <span className="font-bold text-slate-800">Test Network:</span> 16 Nodes, 28 Road Segments
            </div>
            <div>
              <span className="font-bold text-slate-800">Scenario:</span> Master Canteen ➔ AIIMS Hospital
            </div>
          </div>

          <div className="flex items-center space-x-4 text-xs font-semibold">
            <div className="flex items-center space-x-2">
              <span className="text-slate-500">Particles (N):</span>
              <select
                value={particleCount}
                onChange={(e) => setParticleCount(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 font-bold text-slate-800"
              >
                <option value={15}>15 Particles</option>
                <option value={25}>25 Particles</option>
                <option value={40}>40 Particles</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-slate-500">Iterations:</span>
              <select
                value={iterations}
                onChange={(e) => setIterations(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 font-bold text-slate-800"
              >
                <option value={25}>25 Epochs</option>
                <option value={40}>40 Epochs</option>
                <option value={60}>60 Epochs</option>
              </select>
            </div>
          </div>
        </div>

        {/* Comparative Table */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="pb-3 pl-2">Algorithm</th>
                <th className="pb-3">Composite Fitness F</th>
                <th className="pb-3">ETA (Travel Time)</th>
                <th className="pb-3">Distance</th>
                <th className="pb-3">Computation Time</th>
                <th className="pb-3">Iterations</th>
                <th className="pb-3">Route Validity</th>
                <th className="pb-3 text-right pr-2">Evaluation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {results.map((item, idx) => {
                const isQPSO = item.algorithm.includes('QPSO');
                const isBestFit = item.fitness === bestFitness;

                return (
                  <tr
                    key={idx}
                    className={`transition-colors ${
                      isQPSO ? 'bg-indigo-50/70 font-semibold' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-4 pl-2">
                      <div className="flex items-center space-x-2">
                        {isQPSO ? (
                          <span className="p-1 rounded-full bg-indigo-600 text-white">
                            <Sparkles className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-600 font-bold">
                            {idx + 1}
                          </span>
                        )}
                        <div>
                          <span className="text-slate-900 font-bold">{item.algorithm}</span>
                          {isQPSO && (
                            <span className="ml-2 text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                              Our Engine
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <span
                        className={`font-mono font-bold ${
                          isBestFit ? 'text-emerald-600 text-sm' : 'text-slate-900'
                        }`}
                      >
                        {item.fitness}
                      </span>
                    </td>
                    <td className="py-4 font-bold text-slate-900">{item.travel_time_min} min</td>
                    <td className="py-4">{item.distance_km} km</td>
                    <td className="py-4 font-mono text-cyan-700 font-semibold">{item.computation_time_ms} ms</td>
                    <td className="py-4">{item.iterations}</td>
                    <td className="py-4">
                      <span className="inline-flex items-center space-x-1 text-emerald-600 font-bold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Valid</span>
                      </span>
                    </td>
                    <td className="py-4 text-right pr-2">
                      {isBestFit ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px]">
                          <Award className="w-3.5 h-3.5 mr-1" />
                          Optimal Multi-Factor
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Baseline</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Visual Charts Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Latency Comparison Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Computation Time Comparison (ms)</span>
            </h3>

            <div className="space-y-3 pt-2">
              {results.map((r, idx) => {
                const maxLat = Math.max(...results.map((x) => x.computation_time_ms), 1);
                const pct = Math.max(12, Math.min(100, (r.computation_time_ms / maxLat) * 100));

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>{r.algorithm}</span>
                      <span className="font-mono text-slate-900">{r.computation_time_ms} ms</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          r.algorithm.includes('QPSO')
                            ? 'bg-indigo-600'
                            : r.algorithm === 'A*'
                            ? 'bg-blue-500'
                            : 'bg-slate-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fitness Comparison Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
              <TrendingDown className="w-4 h-4 text-emerald-600" />
              <span>Objective Fitness F (Lower is Better)</span>
            </h3>

            <div className="space-y-3 pt-2">
              {results.map((r, idx) => {
                const maxFit = Math.max(...results.map((x) => x.fitness), 0.1);
                const pct = Math.max(15, Math.min(100, (r.fitness / maxFit) * 100));

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>{r.algorithm}</span>
                      <span className="font-mono text-slate-900 font-bold">{r.fitness}</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          r.fitness === bestFitness ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
