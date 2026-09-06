import { useNavigate } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';
import BottomNavigation from '@/components/BottomNavigation';
import AlertCard from '@/components/AlertCard';
import { vehicleAlerts } from '@/data/mockData';

export default function VehicleAlertsPage() {
  const navigate = useNavigate();

  return (
    <div className="mobile-container pb-24">
      <AppHeader title="Alerts" showBack onBack={() => navigate('/vehicle')} showNotification={false} />

      <div className="px-5 pt-4 space-y-3">
        {vehicleAlerts.map((alert) => (
          <AlertCard key={alert.id} alert={alert} />
        ))}
      </div>

      <BottomNavigation variant="vehicle" />
    </div>
  );
}
