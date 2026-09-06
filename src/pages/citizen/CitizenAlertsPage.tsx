import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';
import BottomNavigation from '@/components/BottomNavigation';
import AlertCard from '@/components/AlertCard';
import EmergencyAlertModal from '@/components/EmergencyAlertModal';
import EmptyState from '@/components/EmptyState';
import { Bell } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function CitizenAlertsPage() {
  const navigate = useNavigate();
  const { alerts, dismissAlert, user } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user !== undefined) {
      setLoading(false);
    }
  }, [user]);

  return (
    <div className="mobile-container pb-24">
      <AppHeader title="Alerts" showBack onBack={() => navigate('/citizen')} showNotification={false} />

      {/* Emergency alert banner */}
      {alerts.some((a) => a.severity === 'critical') && (
        <div className="px-5 pt-4">
          <button
            onClick={() => setShowModal(true)}
            className="w-full bg-emergency-500 text-white rounded-2xl p-4 flex items-center gap-3 active:scale-[0.98] hover:bg-emergency-600 transition-all shadow-lg"
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
              <Bell size={20} className="text-white" />
            </div>
            <div className="text-left flex-1">
              <p className="font-bold text-sm">Emergency Alert Active</p>
              <p className="text-xs text-white/80">Ambulance approaching — Tap to view</p>
            </div>
            <span className="text-lg">›</span>
          </button>
        </div>
      )}

      {/* Alerts list */}
      <div className="px-5 pt-4 space-y-3">
        {loading ? (
          <>
            <div className="skeleton h-20 rounded-2xl" />
            <div className="skeleton h-20 rounded-2xl" />
          </>
        ) : alerts.length === 0 ? (
          <EmptyState
            icon={<Bell size={28} className="text-gray-300" />}
            title="No Alerts"
            message="You're all caught up. Emergency alerts will appear here."
          />
        ) : (
          alerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} onDismiss={() => dismissAlert(alert.id)} />
          ))
        )}
      </div>

      <BottomNavigation variant="citizen" />

      <EmergencyAlertModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}
