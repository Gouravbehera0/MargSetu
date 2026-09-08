import { useNavigate } from 'react-router-dom';
import { Compass, Navigation, Car, Siren, Activity, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import Logo from '@/components/Logo';

const features = [
  { icon: Navigation, title: 'QPSO Routing', desc: 'Continuous delta-well optimization', color: 'bg-blue-500/15 text-blue-400' },
  { icon: Car, title: '9 Vehicle Profiles', desc: 'Cars, Bikes, Trucks, Transit & Cabs', color: 'bg-indigo-500/15 text-indigo-400' },
  { icon: Siren, title: 'Emergency Green Corridor', desc: '600m acoustic-visual radar alerts', color: 'bg-red-500/15 text-red-400' },
  { icon: Activity, title: 'Live Sensor Telemetry', desc: 'Sub-80ms dynamic detour rerouting', color: 'bg-emerald-500/15 text-emerald-400' },
];

export default function SplashPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between font-sans selection:bg-blue-600 selection:text-white p-4 sm:p-8">
      {/* Top Header */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between py-2">
        <Logo size="sm" variant="light" />
        <button
          onClick={() => navigate('/map')}
          className="text-xs font-bold text-slate-400 hover:text-white transition-colors"
        >
          Skip to Map &rarr;
        </button>
      </div>

      {/* Hero Section */}
      <div className="w-full max-w-3xl mx-auto text-center my-auto py-8">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-cyan-300 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Next-Generation Intelligent Transportation Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
          MARGSETU
        </h1>
        <p className="text-lg sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300 mt-2">
          One Platform. Smarter Routes. Safer Roads.
        </p>

        <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto mt-4 leading-relaxed">
          Quantum-Inspired Particle Swarm Optimization (QPSO) based intelligent traffic route optimization platform for general transportation and priority emergency clearance.
        </p>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-8 text-left">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-start space-x-3.5"
              >
                <div className={`w-10 h-10 rounded-xl ${f.color} flex items-center justify-center shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">{f.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
          <button
            onClick={() => navigate('/login')}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98]"
          >
            <span>Sign In to Platform</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/map')}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-sm transition-all"
          >
            Launch Interactive Map
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full text-center text-xs text-slate-500 py-3 border-t border-slate-900">
        MARGSETU • Quantum-Inspired Metaheuristic Traffic Routing System
      </footer>
    </div>
  );
}
