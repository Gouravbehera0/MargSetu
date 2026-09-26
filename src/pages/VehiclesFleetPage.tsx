import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavigationNavbar from '@/components/NavigationNavbar';
import MobileBottomNav from '@/components/MobileBottomNav';
import {
  Car,
  Bike,
  Bus,
  Truck,
  Package,
  Siren,
  Flame,
  Shield,
  Activity,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowRight,
  Filter,
  ArrowLeft,
  Search,
  Phone,
  Fuel
} from 'lucide-react';
import type { GeneralVehicleType } from '@/types';

interface VehicleRecord {
  id: string;
  code: string;
  name: string;
  type: GeneralVehicleType;
  driverName: string;
  driverPhone: string;
  status: 'online' | 'on_mission' | 'idle';
  locationName: string;
  batteryOrFuel: string;
  constraints: string[];
  isEmergency?: boolean;
}

const FLEET_DATA: VehicleRecord[] = [
  {
    id: 'v1',
    code: 'AMB-108',
    name: 'Advanced Life Support Ambulance',
    type: 'ambulance',
    driverName: 'Rajesh Mohanty',
    driverPhone: '+91 98765 43210',
    status: 'on_mission',
    locationName: 'AG Square Station',
    batteryOrFuel: '88% Fuel',
    constraints: ['Emergency Priority Corridor Access', 'Disregards Traffic Signal Wait', 'Citizen Give-Way Radar'],
    isEmergency: true
  },
  {
    id: 'v2',
    code: 'FIRE-101',
    name: 'Heavy Rescue Fire Tender',
    type: 'fire',
    driverName: 'Bikram Das',
    driverPhone: '+91 98765 43211',
    status: 'on_mission',
    locationName: 'Rasulgarh Fire Command',
    batteryOrFuel: '95% Fuel',
    constraints: ['High Clearance Roads Only', 'Hydrant Network Access', 'Severe Congestion Bypass'],
    isEmergency: true
  },
  {
    id: 'v3',
    code: 'POL-112',
    name: 'Highway Rapid Interceptor',
    type: 'police',
    driverName: 'Amitabh Patnaik',
    driverPhone: '+91 98765 43212',
    status: 'online',
    locationName: 'Jayadev Vihar Chowk',
    batteryOrFuel: '72% Fuel',
    constraints: ['All Arterial Access', 'Real-Time Intercept Tracking'],
    isEmergency: true
  },
  {
    id: 'v4',
    code: 'TRK-504',
    name: 'Multi-Axle Heavy Cargo Hauler',
    type: 'truck',
    driverName: 'Gurpreet Singh',
    driverPhone: '+91 98765 43214',
    status: 'online',
    locationName: 'Cuttack-Puri Bypass',
    batteryOrFuel: '65% Fuel',
    constraints: ['Max Weight 28 Tonnes', 'Restricted from Narrow Old Town Alleys', 'Speed Limit 50 km/h']
  },
  {
    id: 'v5',
    code: 'BUS-12',
    name: 'Smart City Electric Transit Bus',
    type: 'bus',
    driverName: 'Subhasish Nayak',
    driverPhone: '+91 98765 43215',
    status: 'online',
    locationName: 'Master Canteen Depot',
    batteryOrFuel: '84% Battery (EV)',
    constraints: ['Bus Rapid Transit Lanes', 'Designated Stop Stops Only', 'Passenger Load Balancing']
  },
  {
    id: 'v6',
    code: 'DLV-88',
    name: 'Express Urban Delivery Van',
    type: 'delivery',
    driverName: 'Sunil Jena',
    driverPhone: '+91 98765 43216',
    status: 'online',
    locationName: 'Patia Tech Park Hub',
    batteryOrFuel: '90% Fuel',
    constraints: ['Fastest Corridor Weighting', 'Drop-off Cluster Optimization']
  },
  {
    id: 'v7',
    code: 'CAR-09',
    name: 'Private Commuter Sedan',
    type: 'car',
    driverName: 'Ananya Mishra',
    driverPhone: '+91 98765 43217',
    status: 'idle',
    locationName: 'Saheed Nagar',
    batteryOrFuel: '50% Fuel',
    constraints: ['Standard Balanced Profile', 'Toll Route Avoidance Allowed']
  }
];

export default function VehiclesFleetPage() {
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState<string>('all');
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const checkMobile = () => {
      const isMobileWidth = window.innerWidth < 768;
      const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileWidth || isMobileUserAgent);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const filteredFleet = FLEET_DATA.filter((v) => {
    const matchesSearch =
      !searchQuery ||
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.driverName.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (filterType === 'all') return true;
    if (filterType === 'emergency') return v.isEmergency;
    if (filterType === 'commercial') return ['truck', 'bus', 'delivery'].includes(v.type);
    return v.type === filterType;
  });

  const onMissionCount = FLEET_DATA.filter((v) => v.status === 'on_mission').length;
  const onlineCount = FLEET_DATA.filter((v) => v.status === 'online').length;
  const idleCount = FLEET_DATA.filter((v) => v.status === 'idle').length;

  // =========================================================================
  // ANDROID & IOS MOBILE VIEW (Theme consistent, multi-modal fleet directory)
  // =========================================================================
  if (isMobile) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans select-none pb-20">
        {/* Android Top App Bar */}
        <div className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-3 py-2.5 pt-[max(env(safe-area-inset-top),10px)] flex items-center justify-between">
          <div className="flex items-center space-x-2.5 min-w-0">
            <button
              type="button"
              onClick={() => navigate('/map')}
              className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-300 active:scale-95 transition-all shrink-0"
              title="Return to Map"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <h1 className="text-sm font-extrabold text-white truncate tracking-tight">Fleet Directory</h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-900/80 text-blue-300 border border-blue-700">
                  {FLEET_DATA.length} Active
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">Multi-Modal Vehicle Profiles & Constraints</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/map')}
            className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs active:scale-95 shadow-xs transition-all shrink-0"
          >
            <span>Plan Route</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Metrics KPI Row */}
        <div className="flex space-x-2.5 overflow-x-auto px-3 py-2.5 scrollbar-none shrink-0">
          <div className="min-w-[110px] p-2.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-2xs">
            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Total Fleet</div>
            <div className="text-lg font-black text-white mt-0.5">{FLEET_DATA.length}</div>
            <div className="text-[9px] text-blue-400 font-semibold">9 Profiles</div>
          </div>

          <div className="min-w-[110px] p-2.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-2xs">
            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">On Mission</div>
            <div className="text-lg font-black text-amber-400 mt-0.5">{onMissionCount}</div>
            <div className="text-[9px] text-amber-300 font-semibold">Active Dispatch</div>
          </div>

          <div className="min-w-[110px] p-2.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-2xs">
            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Online</div>
            <div className="text-lg font-black text-emerald-400 mt-0.5">{onlineCount}</div>
            <div className="text-[9px] text-emerald-300 font-semibold">Available</div>
          </div>

          <div className="min-w-[110px] p-2.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-2xs">
            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Standby / Idle</div>
            <div className="text-lg font-black text-slate-300 mt-0.5">{idleCount}</div>
            <div className="text-[9px] text-slate-400 font-semibold">Depot Parks</div>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="px-3 pb-2 space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vehicle code or driver name..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex space-x-1.5 overflow-x-auto pb-0.5 scrollbar-none text-[11px] font-bold">
            {[
              { key: 'all', label: `All (${FLEET_DATA.length})` },
              { key: 'emergency', label: 'Emergency (3)' },
              { key: 'commercial', label: 'Commercial' },
              { key: 'car', label: 'Commuter' }
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilterType(f.key)}
                className={`px-3 py-1 rounded-xl border whitespace-nowrap transition-all ${
                  filterType === f.key
                    ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Vehicle Cards List */}
        <div className="flex-1 px-3 space-y-3 overflow-y-auto">
          {filteredFleet.map((v) => {
            const isEm = v.isEmergency;
            return (
              <div
                key={v.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isEm
                    ? 'bg-slate-800/95 border-red-500/50 shadow-md shadow-red-950/20'
                    : 'bg-slate-800/90 border-slate-700/80 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-black text-white">{v.code}</span>
                      {isEm && (
                        <span className="bg-red-950 border border-red-700/80 text-red-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center space-x-1 animate-pulse">
                          <Siren className="w-3 h-3 text-red-400" />
                          <span>PRIORITY 1</span>
                        </span>
                      )}
                    </div>
                    <h3 className="text-xs font-semibold text-slate-300 mt-0.5">{v.name}</h3>
                  </div>

                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      v.status === 'on_mission'
                        ? 'bg-amber-950 text-amber-300 border border-amber-700'
                        : v.status === 'online'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                        : 'bg-slate-700 text-slate-300 border border-slate-600'
                    }`}
                  >
                    {v.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-700/60 space-y-1.5 text-xs text-slate-400">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-[11px]">Driver:</span>
                    <span className="font-semibold text-white text-[11px]">{v.driverName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-[11px]">Station Hub:</span>
                    <span className="font-semibold text-slate-300 text-[11px]">{v.locationName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-[11px]">Energy / Fuel:</span>
                    <span className="font-semibold text-cyan-300 text-[11px]">{v.batteryOrFuel}</span>
                  </div>
                </div>

                {/* Constraints Chips */}
                <div className="mt-2.5">
                  <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1">
                    Profile Constraints:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {v.constraints.map((c, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-slate-900 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-lg"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/map')}
                  className="mt-3 w-full bg-slate-700/80 hover:bg-blue-600 hover:text-white text-slate-200 font-bold py-2 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-all active:scale-98"
                >
                  <span>Plan Route With Vehicle Profile</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <MobileBottomNav />
      </div>
    );
  }

  // =========================================================================
  // LAPTOP / DESKTOP VIEW: Existing Layout (100% Intact & Untouched)
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <NavigationNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center space-x-2">
              <Car className="w-6 h-6 text-blue-600" />
              <span>Multi-Modal Vehicle Fleet Directory</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Supports Cars, Bikes, Buses, Trucks, Delivery, and Emergency response vehicles with customized routing constraints.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1">
            {['all', 'emergency', 'commercial', 'car'].map((filter) => (
              <button
                key={filter}
                onClick={() => setFilterType(filter)}
                className={`text-xs px-3 py-1.5 rounded-xl font-bold uppercase tracking-wider border transition-all ${
                  filterType === filter
                    ? 'bg-navy-900 text-white border-navy-900 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Vehicle Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredFleet.map((v) => {
            const isEm = v.isEmergency;
            return (
              <div
                key={v.id}
                className={`bg-white rounded-2xl p-5 border shadow-sm transition-all hover:shadow-md flex flex-col justify-between ${
                  isEm ? 'border-red-200 ring-1 ring-red-100' : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-black text-slate-900">{v.code}</span>
                        {isEm && (
                          <span className="bg-red-100 text-red-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center space-x-1">
                            <Siren className="w-3 h-3" />
                            <span>PRIORITY</span>
                          </span>
                        )}
                      </div>
                      <h3 className="text-xs font-semibold text-slate-600 mt-0.5">{v.name}</h3>
                    </div>

                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        v.status === 'on_mission'
                          ? 'bg-amber-100 text-amber-800'
                          : v.status === 'online'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {v.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Driver</span>
                      <span className="font-semibold text-slate-700">{v.driverName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Current Station</span>
                      <span className="font-semibold text-slate-700">{v.locationName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Energy / Fuel</span>
                      <span className="font-semibold text-slate-700">{v.batteryOrFuel}</span>
                    </div>
                  </div>

                  {/* Routing Constraints Tag */}
                  <div className="mt-3">
                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1.5">
                      Routing Constraints:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {v.constraints.map((c, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => navigate('/map')}
                    className="w-full flex items-center justify-center space-x-1.5 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 font-bold py-2 rounded-xl text-xs transition-colors"
                  >
                    <span>Plan Route With Vehicle</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
