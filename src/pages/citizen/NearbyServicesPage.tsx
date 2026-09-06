import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';
import BottomNavigation from '@/components/BottomNavigation';
import ServiceCard from '@/components/ServiceCard';
import BottomSheet from '@/components/BottomSheet';
import { Search, Phone } from 'lucide-react';
import { fetchHospitals, fetchFireStations, fetchPoliceStations, fetchAmbulanceStations } from '@/services/supabaseQueries';
import type { NearbyService } from '@/types';

const categories = [
  { key: 'all', label: 'All' },
  { key: 'hospital', label: 'Hospitals' },
  { key: 'ambulance_station', label: 'Ambulances' },
  { key: 'fire_station', label: 'Fire Stations' },
  { key: 'police_station', label: 'Police' },
];

export default function NearbyServicesPage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<NearbyService | null>(null);
  const [allServices, setAllServices] = useState<NearbyService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [hospitals, fireStations, policeStations, ambulanceStations] = await Promise.all([
          fetchHospitals(),
          fetchFireStations(),
          fetchPoliceStations(),
          fetchAmbulanceStations(),
        ]);
        const services: NearbyService[] = [
          ...(hospitals as NearbyService[]),
          ...(ambulanceStations as NearbyService[]),
          ...(fireStations as NearbyService[]),
          ...(policeStations as NearbyService[]),
        ];
        setAllServices(services);
      } catch (err) {
        console.error('Failed to load services:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = allServices.filter((s) => {
    const matchesCategory = activeCategory === 'all' || s.type === activeCategory;
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="mobile-container pb-24">
      <AppHeader title="Nearby Services" showBack onBack={() => navigate('/citizen')} showNotification={false} />

      {/* Search */}
      <div className="px-5 pt-4">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-11"
          />
        </div>
      </div>

      {/* Category chips */}
      <div className="px-5 pt-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`chip ${activeCategory === cat.key ? 'chip-active' : 'chip-inactive'}`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Services */}
      <div className="px-5 pt-4 space-y-3">
        {loading ? (
          <>
            <div className="skeleton h-20 rounded-2xl" />
            <div className="skeleton h-20 rounded-2xl" />
            <div className="skeleton h-20 rounded-2xl" />
          </>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No services found.</p>
        ) : (
          filtered.map((service) => (
            <ServiceCard key={service.id} service={service} onClick={() => setSelected(service)} />
          ))
        )}
      </div>

      <BottomNavigation variant="citizen" />

      {/* Detail bottom sheet */}
      <BottomSheet open={!!selected} onClose={() => setSelected(null)}>
        {selected && (
          <div>
            <h2 className="text-xl font-bold text-navy-800">{selected.name}</h2>
            <p className="text-sm text-gray-500 mt-1">{selected.address}</p>
            <div className="flex items-center gap-4 mt-3">
              <span className="text-sm font-semibold text-navy-600">{selected.distance}</span>
              <span className="text-sm text-gray-400">•</span>
              <span className="text-sm font-semibold text-navy-600">{selected.eta}</span>
            </div>
            <div className="mt-4 bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Phone</span>
                <span className="text-sm font-semibold text-navy-700">{selected.phone}</span>
              </div>
              {selected.type === 'hospital' && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Emergency</span>
                  <span className={`text-sm font-semibold ${selected.emergencyAvailable ? 'text-green-600' : 'text-emergency-600'}`}>
                    {selected.emergencyAvailable ? 'Available' : 'Full'}
                  </span>
                </div>
              )}
            </div>
            <a href={`tel:${selected.phone}`} className="btn-primary w-full mt-4 flex items-center justify-center gap-2">
              <Phone size={18} />
              Call Now
            </a>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
