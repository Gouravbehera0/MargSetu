import { useNavigate, useLocation } from 'react-router-dom';
import { Compass, Activity, Navigation, Siren, Car } from 'lucide-react';

interface MobileBottomNavProps {
  className?: string;
}

export default function MobileBottomNav({ className = '' }: MobileBottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Map', path: '/map', icon: Compass },
    { label: 'Traffic', path: '/traffic', icon: Activity },
    { label: 'Navigate', path: '/navigate', icon: Navigation, isHighlight: true },
    { label: 'Emergency', path: '/emergency', icon: Siren },
    { label: 'Fleet', path: '/vehicles', icon: Car },
  ];

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[max(env(safe-area-inset-bottom),8px)] pt-1.5 px-3 ${className}`}
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path === '/map' && location.pathname === '/');
          const Icon = item.icon;

          if (item.isHighlight) {
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center -mt-4 active:scale-95 transition-transform"
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-blue-500/35 ring-4 ring-blue-100'
                      : 'bg-blue-600 text-white shadow-blue-500/25'
                  }`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-[10px] font-black text-blue-600 mt-1">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.label}
              type="button"
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all active:scale-90 ${
                isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 text-blue-600 stroke-[2.5]' : 'stroke-[1.8]'
                  }`}
                />
                {item.path === '/emergency' && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-ping" />
                )}
              </div>
              <span
                className={`text-[10px] mt-0.5 tracking-tight ${
                  isActive ? 'font-black text-blue-600' : 'font-semibold text-slate-500'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
