import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';
import BottomNavigation from '@/components/BottomNavigation';
import { useApp } from '@/context/AppContext';
import { fetchEmergencyContacts } from '@/services/supabaseQueries';
import {
  Phone, ChevronRight, Bell, MapPin, Globe, Shield, HelpCircle, LogOut,
  User, Heart, Users,
} from 'lucide-react';

const menuItems = [
  { icon: Bell, label: 'Notification Settings', color: 'bg-orange-100 text-orange-600' },
  { icon: MapPin, label: 'Location Settings', color: 'bg-blue-100 text-blue-600' },
  { icon: Globe, label: 'Language', color: 'bg-green-100 text-green-600' },
  { icon: Shield, label: 'Privacy', color: 'bg-navy-100 text-navy-600' },
  { icon: HelpCircle, label: 'Help & Support', color: 'bg-gray-100 text-gray-600' },
];

export default function CitizenProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useApp();
  const [contacts, setContacts] = useState<{ id: string; name: string; phone: string; relation: string }[]>([]);

  useEffect(() => {
    if (user) {
      fetchEmergencyContacts(user.id)
        .then((data) => setContacts(data ?? []))
        .catch(() => {});
    }
  }, [user]);

  return (
    <div className="mobile-container pb-24">
      <AppHeader title="Profile" showBack onBack={() => navigate('/citizen')} showNotification={false} />

      {/* Profile card */}
      <div className="px-5 pt-5">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-navy-500 to-navy-700 flex items-center justify-center shadow-lg">
            <User size={32} className="text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-navy-800">{user?.name ?? 'User'}</h2>
            <p className="text-sm text-gray-500">{user?.phone || user?.email || ''}</p>
            <div className="flex items-center gap-1 mt-1">
              <MapPin size={12} className="text-gray-400" />
              <span className="text-xs text-gray-400">{user?.savedLocation || 'Bhubaneswar, Odisha'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency contacts */}
      <div className="px-5 pt-4">
        <h3 className="text-sm font-bold text-navy-700 mb-2 flex items-center gap-1.5">
          <Heart size={14} className="text-emergency-500" />
          Emergency Contacts
        </h3>
        {contacts.length === 0 ? (
          <div className="card p-4 text-center">
            <p className="text-sm text-gray-400">No emergency contacts added yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {contacts.map((contact) => (
              <div key={contact.id} className="card p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emergency-100 flex items-center justify-center">
                  <Users size={18} className="text-emergency-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-navy-800 text-sm">{contact.name}</p>
                  <p className="text-xs text-gray-400">{contact.relation}</p>
                </div>
                <a href={`tel:${contact.phone}`} className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center active:scale-90">
                  <Phone size={16} className="text-green-600" />
                </a>
              </div>
            ))}
          </div>
        )}
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

      <BottomNavigation variant="citizen" />
    </div>
  );
}
