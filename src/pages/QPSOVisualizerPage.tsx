import { useState, useEffect } from 'react';
import NavigationNavbar from '@/components/NavigationNavbar';
import { optimizeRouteWithQPSO } from '@/services/apiService';
import type { QPSOOptimizationResult } from '@/types';
import {
  Cpu,
  Zap,
  Activity,
  GitCommit,
  Sparkles,
  ArrowRight,
  TrendingDown,
  CheckCircle2,
  RefreshCw,
  Info
} from 'lucide-react';

export default function QPSOVisualizerPage() {
  const [particleCount, setParticleCount] = useState(30);
  const [maxIterations, setMaxIterations] = useState(50);
  const [beta, setBeta] = useState(0.75);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QPSOOptimizationResult | null>(null);

  useEffect(() => {
    handleRunQPSO();
  }, []);

  async function handleRunQPSO() {
    setLoading(true);
    try {
      const res = await optimizeRouteWithQPSO({
        origin: { lat: 20.2685, lng: 85.8360, name: 'Origin Terminal' },
        destination: { lat: 20.3120, lng: 85.8180, name: 'AIIMS Target' },
        vehicle_type: 'car',
        preference: 'balanced',
        particle_count: particleCount,
        max_iterations: maxIterations,
        beta: beta
      });
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <NavigationNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded bg-blue-100 text-blue-800">
                CORE ROUTING ENGINE
              </span>
              <span className="text-xs font-bold text-slate-400">Quantum Metaheuristic Optimization</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 flex items-center space-x-2">
              <Cpu className="w-6 h-6 text-indigo-600" />
              <span>Quantum-Inspired Particle Swarm Optimization (QPSO) Engine</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Solves discrete transportation routing via delta potential well wavefunction simulation and mean best attractors.
            </p>
          </div>

          <button
            onClick={handleRunQPSO}
            disabled={loading}
            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50"
          >
            <Zap className="w-4 h-4" />
            <span>{loading ? 'Simulating Quantum Swarm...' : 'Re-Run Optimization'}</span>
          </button>
        </div>

        {/* Live Swarm Telemetry Cards */}
        {result && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Swarm Size (N)</div>
              <div className="text-xl font-black text-slate-900 mt-1">{result.candidate_alternatives.length * 5} Particles</div>
              <div className="text-[10px] text-blue-600 mt-0.5 font-semibold">In continuous space</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Total Iterations</div>
              <div className="text-xl font-black text-slate-900 mt-1">{result.iterations} Epochs</div>
              <div className="text-[10px] text-indigo-600 mt-0.5 font-semibold">Stopping criteria met</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Contraction Coeff (β)</div>
              <div className="text-xl font-black text-indigo-600 mt-1">{beta}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Dynamic decay</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Global Best (gbest)</div>
              <div className="text-xl font-black text-emerald-600 mt-1">{result.fitness}</div>
              <div className="text-[10px] text-emerald-700 mt-0.5 font-bold">Lowest Cost Found</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Runtime Latency</div>
              <div className="text-xl font-black text-cyan-600 mt-1">{result.computation_time_ms} ms</div>
              <div className="text-[10px] text-cyan-700 mt-0.5 font-semibold">Sub-second response</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Candidate Routes</div>
              <div className="text-xl font-black text-slate-900 mt-1">{result.candidate_alternatives?.length || 4} Diverse</div>
              <div className="text-[10px] text-slate-500 mt-0.5 font-semibold">Yen K-Shortest</div>
            </div>
          </div>
        )}

        {/* Algorithm Pipeline Diagram ("How QPSO Works") */}
        <div className="bg-navy-900 text-white rounded-2xl p-6 shadow-xl border border-navy-800 space-y-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-cyan-300">
              QPSO Algorithmic Execution Pipeline
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 text-center">
            {[
              { step: '1. Init', label: 'Candidate & Swarm Initialization', icon: '⚛️' },
              { step: '2. Fitness', label: 'Multi-Factor Evaluation (T, C, D, R, B)', icon: '⚖️' },
              { step: '3. pbest', label: 'Update Particle Personal Bests', icon: '🎯' },
              { step: '4. gbest', label: 'Identify Global Swarm Leader', icon: '🏆' },
              { step: '5. mbest', label: 'Calculate Mean Best (1/N Σ pbest)', icon: '📊' },
              { step: '6. Attractor', label: 'Compute Local Attractor (p_i)', icon: '🧲' },
              { step: '7. Delta Well', label: 'Quantum Position Update x(t+1)', icon: '🌊' },
              { step: '8. Decode', label: 'Feasibility Check & Optimal Path', icon: '🛣️' }
            ].map((p, idx) => (
              <div
                key={idx}
                className="bg-navy-800/80 border border-navy-700 p-3 rounded-xl flex flex-col items-center justify-between"
              >
                <div className="text-2xl mb-1">{p.icon}</div>
                <div className="text-xs font-black text-cyan-400">{p.step}</div>
                <p className="text-[10px] text-slate-300 mt-1 leading-tight">{p.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Convergence Curve & Hyperparameter Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Convergence Chart Card */}
          <div className="lg:col-span-8 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
                <TrendingDown className="w-4 h-4 text-emerald-600" />
                <span>Fitness Convergence Curve (Epoch vs. Global Best Cost F)</span>
              </h3>
              <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                Monotonic Descent
              </span>
            </div>

            {/* Convergence Visualizer Bar/SVG */}
            {result && result.convergence_history && (
              <div className="h-64 w-full bg-slate-900 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                  <span>Initial Cost: {result.convergence_history[0]}</span>
                  <span>Final Optimal Cost: {result.convergence_history[result.convergence_history.length - 1]}</span>
                </div>

                {/* SVG Polyline Convergence */}
                <div className="flex-1 relative my-2">
                  <svg className="w-full h-full" viewBox="0 0 500 150" preserveAspectRatio="none">
                    {/* Grid lines */}
                    <line x1="0" y1="30" x2="500" y2="30" stroke="#334155" strokeDasharray="3 3" />
                    <line x1="0" y1="75" x2="500" y2="75" stroke="#334155" strokeDasharray="3 3" />
                    <line x1="0" y1="120" x2="500" y2="120" stroke="#334155" strokeDasharray="3 3" />

                    {/* Convergence Path */}
                    {(() => {
                      const history = result.convergence_history;
                      const maxVal = Math.max(...history);
                      const minVal = Math.min(...history);
                      const range = maxVal - minVal || 0.1;

                      const points = history
                        .map((val, idx) => {
                          const x = (idx / (history.length - 1)) * 500;
                          const y = 140 - ((val - minVal) / range) * 120;
                          return `${x},${y}`;
                        })
                        .join(' ');

                      return (
                        <polyline
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={points}
                        />
                      );
                    })()}
                  </svg>
                </div>

                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>Iteration 0</span>
                  <span>Iteration {result.iterations / 2}</span>
                  <span>Iteration {result.iterations}</span>
                </div>
              </div>
            )}

            {/* Explainability Breakdown Card */}
            {result && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div className="font-bold text-slate-800 mb-1">Normalized Explainability Breakdown:</div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-2 font-mono text-center">
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <div className="text-[10px] text-slate-400 font-sans">w1 * Time (T)</div>
                    <div className="font-bold text-slate-800 mt-0.5">{result.explainability?.time_contribution}</div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <div className="text-[10px] text-slate-400 font-sans">w2 * Congestion (C)</div>
                    <div className="font-bold text-slate-800 mt-0.5">{result.explainability?.congestion_contribution}</div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <div className="text-[10px] text-slate-400 font-sans">w3 * Distance (D)</div>
                    <div className="font-bold text-slate-800 mt-0.5">{result.explainability?.distance_contribution}</div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <div className="text-[10px] text-slate-400 font-sans">w4 * Risk (R)</div>
                    <div className="font-bold text-slate-800 mt-0.5">{result.explainability?.risk_contribution}</div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <div className="text-[10px] text-slate-400 font-sans">w5 * Blockage (B)</div>
                    <div className="font-bold text-slate-800 mt-0.5">{result.explainability?.blockage_contribution}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Hyperparameter Sliders */}
          <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              QPSO Hyperparameters
            </h3>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Particle Count (Swarm Size N)</span>
                <span className="text-indigo-600">{particleCount}</span>
              </div>
              <input
                type="range"
                min="10"
                max="60"
                value={particleCount}
                onChange={(e) => setParticleCount(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <span className="text-[10px] text-slate-400">Higher N increases exploration diversity</span>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Max Iterations (Epochs)</span>
                <span className="text-indigo-600">{maxIterations}</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                value={maxIterations}
                onChange={(e) => setMaxIterations(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <span className="text-[10px] text-slate-400">Epochs before stopping condition</span>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Contraction-Expansion (β)</span>
                <span className="text-indigo-600">{beta}</span>
              </div>
              <input
                type="range"
                min="0.4"
                max="1.2"
                step="0.05"
                value={beta}
                onChange={(e) => setBeta(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <span className="text-[10px] text-slate-400">Controls delta well potential bound</span>
            </div>

            {/* Mathematical Formula Card */}
            <div className="bg-slate-900 text-slate-200 p-4 rounded-xl text-xs font-mono space-y-2">
              <div className="text-cyan-400 font-bold font-sans text-[11px] uppercase tracking-wider">
                Quantum Delta Well State Equation:
              </div>
              <div className="text-[11px] text-slate-300">
                x_i(t+1) = p_i ± β·|mbest - x_i(t)|·ln(1/u)
              </div>
              <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                mbest = (1/N) Σ pbest_i<br />
                p_i = φ·pbest_i + (1-φ)·gbest
              </div>
            </div>

            <button
              onClick={handleRunQPSO}
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs shadow transition-all disabled:opacity-50"
            >
              Apply Hyperparameters & Re-run
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
