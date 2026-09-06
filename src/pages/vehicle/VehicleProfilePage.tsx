import { useNavigate } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';
import BottomNavigation from '@/components/BottomNavigation';
import StatusBadge from '@/components/StatusBadge';
import { useApp } from '@/context/AppContext';
import {
  ChevronRight, Bell, MapPin, Globe, Shield, HelpCircle, LogOut,
  User, Ambulance,
} from 'lucide-react';

const menuItems = [
  { icon: Bell, label: 'Notification Settings', color: 'bg-orange-100 text-orange-600' },
  { icon: MapPin, label: 'Location Settings', color: 'bg-blue-100 text-blue-600' },
  { icon: Globe, label: 'Language', color: 'bg-green-100 text-green-600' },
  { icon: Shield, label: 'Privacy', color: 'bg-navy-100 text-navy-600' },
  { icon: HelpCircle, label: 'Help & Support', color: 'bg-gray-100 text-gray-600' },
];

export default function VehicleProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useApp();

  return (
    <div className="mobile-container pb-24">
      <AppHeader title="Profile" showBack onBack={() => navigate('/vehicle')} showNotification={false} />

      {/* Profile card */}
      <div className="px-5 pt-5">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-navy-500 to-navy-700 flex items-center justify-center shadow-lg">
            <User size={32} className="text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-navy-800">{user?.name ?? 'Driver'}</h2>
            <p className="text-sm text-gray-500">{user?.phone || user?.email || ''}</p>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status="" variant="success" dot>
                Online
              </StatusBadge>
              <span className="text-xs text-gray-400">Ambulance {user?.vehicleCode ?? 'A102'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle info */}
      <div className="px-5 pt-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emergency-500 flex items-center justify-center">
              <Ambulance size={24} className="text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-navy-800">Ambulance {user?.vehicleCode ?? 'A102'}</h3>
              <p className="text-sm text-gray-500">Type: Advanced Life Support</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400">Total Missions</p>
              <p className="font-bold text-navy-800">247</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400">Rating</p>
              <p className="font-bold text-navy-800">4.9 ★</p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="px-5 pt-4">
        <div className="card divide-y divide-gray-100">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                className="w-full flex items-center gap-3 p-4 active:bg-gray-50 transition-colors"
              >
                <div className={`w-9 h-9 rounded-lg ${item.color} flex items-center justify-center`}>
                  <Icon size={18} />
                </div>
                <span className="flex-1 text-left font-medium text-navy-700 text-sm">{item.label}</span>
                <ChevronRight size={18} className="text-gray-300" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Logout */}
      <div className="px-5 pt-4">
        <button
          onClick={async () => {
            await logout();
            navigate('/');
          }}
          className="w-full bg-emergency-50 text-emergency-600 font-semibold rounded-xl py-3.5 flex items-center justify-center gap-2 active:scale-[0.98] hover:bg-emergency-100 border border-emergency-200"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>

      <BottomNavigation variant="vehicle" />
    </div>
  );
}
