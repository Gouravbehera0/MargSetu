import { Home, Map, Siren, Bell, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface BottomNavProps {
  variant?: 'citizen' | 'vehicle';
}

const citizenItems = [
  { icon: Home, label: 'Home', path: '' },
  { icon: Map, label: 'Map', path: 'map' },
  { icon: Siren, label: 'SOS', path: 'request', isSOS: true },
  { icon: Bell, label: 'Alerts', path: 'alerts' },
  { icon: User, label: 'Profile', path: 'profile' },
];

const vehicleItems = [
  { icon: Home, label: 'Home', path: '' },
  { icon: Map, label: 'Route', path: 'route' },
  { icon: Siren, label: 'Missions', path: 'missions', isSOS: true },
  { icon: Bell, label: 'Alerts', path: 'alerts' },
  { icon: User, label: 'Profile', path: 'profile' },
];

export default function BottomNavigation({ variant = 'citizen' }: BottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const items = variant === 'vehicle' ? vehicleItems : citizenItems;
  const basePath = variant === 'vehicle' ? '/vehicle' : '/citizen';

  return (
    <nav className="fixed bottom-0 left-0 right-0 mx-auto max-w-md bg-white border-t border-gray-100 shadow-nav px-2 pt-2 pb-5 z-40">
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const fullPath = item.path ? `${basePath}/${item.path}` : basePath;
          const isActive = location.pathname === fullPath || (item.path === '' && location.pathname === basePath);
          const Icon = item.icon;

          if (item.isSOS) {
            return (
              <button
                key={item.label}
                onClick={() => navigate(fullPath)}
                className="flex flex-col items-center gap-0.5 -mt-6"
              >
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 active:scale-90 ${
                    variant === 'vehicle'
                      ? 'bg-navy-600 hover:bg-navy-700'
                      : 'bg-emergency-500 hover:bg-emergency-600'
                  }`}
                >
                  <Icon size={24} className="text-white" />
                </div>
                <span className="text-[10px] font-medium text-gray-600">{item.label}</span>
              </button>
            );
          }

          return (
            <button
              key={item.label}
              onClick={() => navigate(fullPath)}
              className="flex flex-col items-center gap-0.5 py-1 px-2 active:scale-95 transition-transform"
            >
              <Icon
                size={22}
                className={isActive ? 'text-navy-700' : 'text-gray-400'}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={`text-[10px] font-medium ${isActive ? 'text-navy-700' : 'text-gray-400'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
