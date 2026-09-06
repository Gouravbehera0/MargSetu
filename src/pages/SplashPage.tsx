import { useNavigate } from 'react-router-dom';
import { Navigation, Siren, MapPin, Bell, Building2, ArrowRight } from 'lucide-react';
import Logo from '@/components/Logo';

const features = [
  { icon: Navigation, title: 'Smart Routing', desc: 'QPSO-optimized paths', color: 'bg-blue-100 text-blue-600' },
  { icon: MapPin, title: 'Real-Time Tracking', desc: 'Live vehicle updates', color: 'bg-green-100 text-green-600' },
  { icon: Bell, title: 'Give-Way Alerts', desc: 'Emergency notifications', color: 'bg-emergency-100 text-emergency-600' },
  { icon: Building2, title: 'Nearby Services', desc: 'Hospitals & stations', color: 'bg-orange-100 text-orange-600' },
];

export default function SplashPage() {
  const navigate = useNavigate();

  return (
    <div className="mobile-container flex flex-col bg-gradient-to-b from-navy-800 to-navy-900 text-white">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16">
        <div className="animate-scale-in">
          <Logo size="lg" showText={false} />
        </div>
        <h1 className="text-4xl font-extrabold mt-6 text-center tracking-tight animate-slide-up">
          Emergency <span className="text-emergency-400">Connect</span>
        </h1>
        <p className="text-white/60 text-base mt-2 text-center font-medium animate-slide-up">
          Smarter Routes. Faster Response. Safer Lives.
        </p>

        {/* Emergency vehicle illustration */}
        <div className="mt-6 w-full max-w-xs animate-fade-in">
          <div className="relative bg-white/10 backdrop-blur rounded-3xl p-6 flex items-center justify-center">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center px-2">
                <Siren size={58} className="text-emergency-400 animate-pulse" strokeWidth={2.2} aria-label="Emergency siren" />
                <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-emergency-400 rounded-full animate-ping" />
              </div>
              <div className="flex flex-col gap-1">
                <div className="h-2 w-20 bg-white/20 rounded-full" />
                <div className="h-2 w-16 bg-white/10 rounded-full" />
                <div className="h-2 w-24 bg-white/10 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="px-6 pb-4">
        <div className="grid grid-cols-2 gap-3">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="bg-white/10 backdrop-blur rounded-2xl p-4 animate-slide-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className={`w-10 h-10 rounded-xl ${f.color} flex items-center justify-center mb-2`}>
                  <Icon size={20} />
                </div>
                <h3 className="font-bold text-sm text-white">{f.title}</h3>
                <p className="text-xs text-white/50">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 pb-10 pt-4">
        <button
          onClick={() => navigate('/login')}
          className="w-full bg-white text-navy-800 font-bold rounded-2xl py-4 text-lg flex items-center justify-center gap-2 active:scale-[0.98] hover:bg-gray-100 transition-all animate-slide-up"
        >
          Get Started
          <ArrowRight size={20} />
        </button>
        <p className="text-center text-white/40 text-xs mt-4">
          SIH 2026 PS26137 — Quantum-Inspired Route Optimization
        </p>
      </div>
    </div>
  );
}
