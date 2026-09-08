import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavigationNavbar from '@/components/NavigationNavbar';
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
  Filter
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

  const filteredFleet = FLEET_DATA.filter((v) => {
    if (filterType === 'all') return true;
    if (filterType === 'emergency') return v.isEmergency;
    if (filterType === 'commercial') return ['truck', 'bus', 'delivery'].includes(v.type);
    return v.type === filterType;
  });

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
