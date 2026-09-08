import { useNavigate, Link } from 'react-router-dom';
import {
  Compass,
  Car,
  Siren,
  Truck,
  Shield,
  ArrowRight,
  ChevronLeft,
  Sparkles
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function RoleSelectionPage() {
  const navigate = useNavigate();
  const { setRole, setUser } = useApp();

  const selectRole = (role: 'citizen' | 'vehicle' | 'admin', path: string, title: string) => {
    setRole(role);
    setUser({
      id: 'usr_' + Date.now(),
      email: `${role}@margsetu.in`,
      name: title,
      role: role
    });
    navigate(path);
  };

  const roles = [
    {
      id: 'commuter',
      title: 'Citizen Commuter',
      desc: 'Plan optimal journeys for Cars, 2-Wheelers, Buses, and Taxis avoiding traffic bottlenecks.',
      icon: Car,
      color: 'from-blue-600 to-indigo-600',
      badge: 'Urban Mobility',
      path: '/map',
      role: 'citizen' as const
    },
    {
      id: 'emergency',
      title: 'Emergency First-Responder',
      desc: 'Dedicated Green Corridor clearance for Ambulances, Fire Tenders, and Police Interceptors.',
      icon: Siren,
      color: 'from-red-600 to-rose-700',
      badge: 'Priority Mode',
      path: '/emergency',
      role: 'vehicle' as const
    },
    {
      id: 'fleet',
      title: 'Commercial Fleet Dispatcher',
      desc: 'Heavy cargo trucks, logistics delivery vans, and transit bus fleet operational routing.',
      icon: Truck,
      color: 'from-amber-600 to-orange-700',
      badge: 'Commercial Fleet',
      path: '/vehicles',
      role: 'vehicle' as const
    },
    {
      id: 'admin',
      title: 'Transportation Authority & Admin',
      desc: 'QPSO metaheuristic algorithm studio, comparative benchmark lab, and weights configuration.',
      icon: Shield,
      color: 'from-cyan-600 to-blue-700',
      badge: 'Master Control',
      path: '/admin',
      role: 'admin' as const
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Bar */}
      <header className="w-full border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-1 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <Link to="/map" className="flex items-center space-x-2">
          <img
            src="/images/margsetu_app_logo.png"
            alt="MargSetu App Logo"
            className="w-7 h-7 rounded-lg object-contain shadow-sm"
          />
          <span className="text-sm font-black tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-cyan-200">
            MARGSETU
          </span>
        </Link>

        <Link to="/map" className="text-xs text-blue-400 hover:text-blue-300 font-bold">
          Skip to Map &rarr;
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto p-4 sm:p-8 flex flex-col justify-center">
        <div className="text-center max-w-xl mx-auto mb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-cyan-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Multi-Modal Role Gateway</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Select Your Operating Role
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
            Choose how you wish to interact with the MargSetu intelligent transportation ecosystem.
          </p>
        </div>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((r) => {
            const Icon = r.icon;
            return (
              <button
                key={r.id}
                onClick={() => selectRole(r.role, r.path, r.title)}
                className="bg-slate-900/90 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-900 p-5 rounded-2xl text-left transition-all group flex flex-col justify-between space-y-4 hover:shadow-xl hover:shadow-blue-950/30 active:scale-[0.99]"
              >
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${r.color} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                    {r.badge}
                  </span>
                </div>

                <div>
                  <h2 className="text-base font-black text-white group-hover:text-cyan-300 transition-colors">
                    {r.title}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {r.desc}
                  </p>
                </div>

                <div className="flex items-center text-xs font-bold text-blue-400 group-hover:text-cyan-300 pt-2 border-t border-slate-800/80">
                  <span>Enter as {r.title.split(' ')[0]}</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>

        <p className="text-center text-xs text-slate-500 mt-8">
          You can change vehicle modes or access the Admin Control Center anytime from the top navigation bar.
        </p>
      </main>
    </div>
  );
}

