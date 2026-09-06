import { useNavigate } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';
import BottomNavigation from '@/components/BottomNavigation';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import { ambulances, hospitals } from '@/data/mockData';
import { Clock, MapPin, Navigation, ChevronRight, ClipboardList } from 'lucide-react';

const missions = [
  {
    id: 'm1',
    type: 'Medical Emergency',
    location: 'Master Canteen, Bhubaneswar',
    destination: 'City Hospital',
    priority: 'High',
    eta: '05:42',
    distance: '2.4 km',
    status: 'En Route',
  },
  {
    id: 'm2',
    type: 'Patient Transport',
    location: 'AIIMS Bhubaneswar',
    destination: 'City Hospital',
    priority: 'Medium',
    eta: '12:00',
    distance: '4.5 km',
    status: 'Assigned',
  },
  {
    id: 'm3',
    type: 'Medical Emergency',
    location: 'Rasulgarh',
    destination: 'Apollo Hospitals',
    priority: 'Low',
    eta: '15:00',
    distance: '5.8 km',
    status: 'Completed',
  },
];

const priorityColors: Record<string, 'error' | 'warning' | 'success'> = {
  High: 'error',
  Medium: 'warning',
  Low: 'success',
};

const statusColors: Record<string, 'warning' | 'info' | 'success'> = {
  'En Route': 'warning',
  Assigned: 'info',
  Completed: 'success',
};

export default function VehicleMissionsPage() {
  const navigate = useNavigate();

  return (
    <div className="mobile-container pb-24">
      <AppHeader title="Missions" showBack onBack={() => navigate('/vehicle')} showNotification={false} />

      <div className="px-5 pt-4 space-y-3">
        {missions.length === 0 ? (
          <EmptyState
            icon={<ClipboardList size={28} className="text-gray-300" />}
            title="No Active Missions"
            message="New missions will appear here when assigned."
          />
        ) : (
          missions.map((mission) => (
            <button
              key={mission.id}
              onClick={() => navigate('/vehicle/route')}
              className="card p-4 w-full text-left active:scale-[0.98] hover:shadow-card-hover transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-navy-800">{mission.type}</h3>
                <StatusBadge status={mission.priority} variant={priorityColors[mission.priority]} />
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-gray-500">
                  <MapPin size={14} className="text-gray-400" />
                  <span>From: {mission.location}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <Navigation size={14} className="text-gray-400" />
                  <span>To: {mission.destination}</span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 text-navy-600 font-semibold">
                    <Clock size={12} />
                    {mission.eta}
                  </span>
                  <span className="text-gray-400">{mission.distance}</span>
                </div>
                <StatusBadge status={mission.status} variant={statusColors[mission.status]} dot />
              </div>
            </button>
          ))
        )}
      </div>

      <BottomNavigation variant="vehicle" />
    </div>
  );
}
