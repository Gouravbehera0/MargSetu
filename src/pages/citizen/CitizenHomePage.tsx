import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';
import BottomNavigation from '@/components/BottomNavigation';
import EmergencyButton from '@/components/EmergencyButton';
import ServiceCard from '@/components/ServiceCard';
import MapMock from '@/components/MapMock';
import { citizenMapMarkers } from '@/data/mockData';
import { useApp } from '@/context/AppContext';
import { fetchHospitals, fetchFireStations, fetchAmbulanceStations } from '@/services/supabaseQueries';
import type { NearbyService } from '@/types';

export default function CitizenHomePage() {
  const navigate = useNavigate();
  const { user, setServiceType } = useApp();
  const [nearbyServices, setNearbyServices] = useState<NearbyService[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [hospitals, fireStations, ambulanceStations] = await Promise.all([
          fetchHospitals(),
          fetchFireStations(),
          fetchAmbulanceStations(),
        ]);
        const services: NearbyService[] = [
          ...(ambulanceStations as NearbyService[]),
          ...(fireStations as NearbyService[]),
          ...(hospitals as NearbyService[]),
        ];
        setNearbyServices(services.slice(0, 3));
      } catch (err) {
        console.error('Failed to load nearby services:', err);
      }
    })();
  }, []);

  const handleEmergency = (type: 'ambulance' | 'fire' | 'police') => {
    setServiceType(type);
    navigate('/citizen/request');
  };

  const greetingName = user?.name?.split(' ')[0] ?? 'User';
  const location = user?.savedLocation || 'Bhubaneswar, Odisha';

  return (
    <div className="mobile-container pb-24">
      <AppHeader greeting={`Hello, ${greetingName} 👋`} location={location} />

      <div className="px-5 -mt-3">
        <MapMock markers={citizenMapMarkers} className="h-48 shadow-card" />
      </div>

      {/* Emergency Section */}
      <div className="px-5 mt-6">
        <h2 className="text-lg font-bold text-navy-800 mb-3">Need Emergency Help?</h2>
        <div className="space-y-3">
          <EmergencyButton type="ambulance" label="Ambulance" onClick={() => handleEmergency('ambulance')} />
          <EmergencyButton type="fire" label="Fire Brigade" onClick={() => handleEmergency('fire')} />
          <EmergencyButton type="police" label="Police" onClick={() => handleEmergency('police')} />
        </div>
      </div>

      {/* Nearby Services */}
      <div className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-navy-800">Nearby Services</h2>
          <button onClick={() => navigate('/citizen/services')} className="text-sm text-navy-500 font-semibold active:scale-95">
            See all
          </button>
        </div>
        <div className="space-y-3">
          {nearbyServices.length === 0 ? (
            <>
              <div className="skeleton h-20 rounded-2xl" />
              <div className="skeleton h-20 rounded-2xl" />
              <div className="skeleton h-20 rounded-2xl" />
            </>
          ) : (
            nearbyServices.map((service) => (
              <ServiceCard key={service.id} service={service} onClick={() => navigate('/citizen/services')} />
            ))
          )}
        </div>
      </div>

      <BottomNavigation variant="citizen" />
    </div>
  );
}
