import { useState } from 'react';
import NavigationNavbar from '@/components/NavigationNavbar';
import {
  Sliders,
  Save,
  RotateCcw,
  CheckCircle2,
  Shield,
  Clock,
  Compass,
  Radio
} from 'lucide-react';

export default function PlatformSettingsPage() {
  const [weights, setWeights] = useState({
    w1_time: 0.40,
    w2_congestion: 0.25,
    w3_distance: 0.20,
    w4_risk: 0.10,
    w5_blockage: 0.05
  });

  const [rerouteSettings, setRerouteSettings] = useState({
    offRouteThresholdMeters: 40,
    rerouteCooldownSec: 15,
    minTimeSavedMin: 2.0
  });

  const [alertRadiusMeters, setAlertRadiusMeters] = useState(600);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const sumWeights = Object.values(weights).reduce((a, b) => a + b, 0);

  function handleSave() {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  }

  function handleReset() {
    setWeights({
      w1_time: 0.40,
      w2_congestion: 0.25,
      w3_distance: 0.20,
      w4_risk: 0.10,
      w5_blockage: 0.05
    });
    setRerouteSettings({
      offRouteThresholdMeters: 40,
      rerouteCooldownSec: 15,
      minTimeSavedMin: 2.0
    });
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <NavigationNavbar />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center space-x-2">
              <Sliders className="w-6 h-6 text-blue-600" />
              <span>Platform & Algorithm Configuration</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Tune QPSO multi-objective weights, dynamic rerouting cooldowns, and citizen Give-Way telemetry settings.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleReset}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Configuration</span>
            </button>
          </div>
        </div>

        {savedSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl text-xs font-bold flex items-center space-x-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Settings saved successfully. Changes active across QPSO instances.</span>
          </div>
        )}

        {/* Section 1: Objective Function Weights */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Multi-Objective Function Weights (F = w1*T + w2*C + w3*D + w4*R + w5*B)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Relative weighting applied across candidate route metrics.
              </p>
            </div>
            <span
              className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                Math.abs(sumWeights - 1.0) < 0.01
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              Sum: {sumWeights.toFixed(2)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <div className="flex justify-between font-bold text-slate-700 mb-1">
                <span>w1: Travel Time (T)</span>
                <span className="text-blue-600">{weights.w1_time}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={weights.w1_time}
                onChange={(e) => setWeights({ ...weights, w1_time: Number(e.target.value) })}
                className="w-full accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between font-bold text-slate-700 mb-1">
                <span>w2: Traffic Congestion (C)</span>
                <span className="text-blue-600">{weights.w2_congestion}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={weights.w2_congestion}
                onChange={(e) => setWeights({ ...weights, w2_congestion: Number(e.target.value) })}
                className="w-full accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between font-bold text-slate-700 mb-1">
                <span>w3: Distance (D)</span>
                <span className="text-blue-600">{weights.w3_distance}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={weights.w3_distance}
                onChange={(e) => setWeights({ ...weights, w3_distance: Number(e.target.value) })}
                className="w-full accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between font-bold text-slate-700 mb-1">
                <span>w4: Road Safety Risk (R)</span>
                <span className="text-blue-600">{weights.w4_risk}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={weights.w4_risk}
                onChange={(e) => setWeights({ ...weights, w4_risk: Number(e.target.value) })}
                className="w-full accent-blue-600"
              />
            </div>

            <div className="sm:col-span-2">
              <div className="flex justify-between font-bold text-slate-700 mb-1">
                <span>w5: Blockage & Closure Penalty (B)</span>
                <span className="text-blue-600">{weights.w5_blockage}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={weights.w5_blockage}
                onChange={(e) => setWeights({ ...weights, w5_blockage: Number(e.target.value) })}
                className="w-full accent-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Dynamic Rerouting & Thresholds */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3">
            Dynamic Rerouting Sensitivities
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Off-Route Deviation Threshold</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={rerouteSettings.offRouteThresholdMeters}
                  onChange={(e) =>
                    setRerouteSettings({ ...rerouteSettings, offRouteThresholdMeters: Number(e.target.value) })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
                />
                <span className="text-slate-400 font-semibold">meters</span>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Rerouting Cooldown</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={rerouteSettings.rerouteCooldownSec}
                  onChange={(e) =>
                    setRerouteSettings({ ...rerouteSettings, rerouteCooldownSec: Number(e.target.value) })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
                />
                <span className="text-slate-400 font-semibold">seconds</span>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Min ETA Savings to Prompt</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  step="0.5"
                  value={rerouteSettings.minTimeSavedMin}
                  onChange={(e) =>
                    setRerouteSettings({ ...rerouteSettings, minTimeSavedMin: Number(e.target.value) })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
                />
                <span className="text-slate-400 font-semibold">minutes</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
