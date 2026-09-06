import { useNavigate } from 'react-router-dom';
import Logo from '@/components/Logo';
import StatusBadge from '@/components/StatusBadge';
import { adminEmergencies, adminStats, trafficSummary, weeklyEmergencyData } from '@/data/mockData';
import {
  Siren, Ambulance, Flame, Shield, Clock, Activity, TrafficCone,
  AlertTriangle, TrendingUp, ChevronLeft,
} from 'lucide-react';

const statCards = [
  { label: 'Active Emergencies', value: adminStats.activeEmergencies, icon: Siren, color: 'bg-emergency-500' },
  { label: 'Active Ambulances', value: adminStats.activeAmbulances, icon: Ambulance, color: 'bg-blue-500' },
  { label: 'Fire Vehicles', value: adminStats.fireVehicles, icon: Flame, color: 'bg-orange-500' },
  { label: 'Police Vehicles', value: adminStats.policeVehicles, icon: Shield, color: 'bg-navy-600' },
];

const priorityColors: Record<string, 'error' | 'warning' | 'success'> = {
  Critical: 'error',
  High: 'error',
  Medium: 'warning',
  Low: 'success',
};

const statusColors: Record<string, 'warning' | 'info' | 'success'> = {
  'En Route': 'warning',
  Assigned: 'info',
  Completed: 'success',
};

const maxWeekly = Math.max(...weeklyEmergencyData.map((d) => d.count));

export default function AdminControlCenterPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-navy-800 text-white px-6 py-4 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="text-white/60 hover:text-white">
              <ChevronLeft size={20} />
            </button>
            <Logo size="sm" variant="light" />
          </div>
          <div className="flex items-center gap-4">
            <StatusBadge status="" variant="success" dot>
              System Online
            </StatusBadge>
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
              <span className="text-sm font-bold">CC</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-2xl font-extrabold text-navy-800 mb-1">Control Center</h1>
        <p className="text-gray-500 text-sm mb-6">Real-time emergency response overview — Bhubaneswar Region</p>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="card p-5">
                <div className={`w-11 h-11 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
                  <Icon size={22} className="text-white" strokeWidth={2.5} />
                </div>
                <p className="text-3xl font-extrabold text-navy-800">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Average ETA banner */}
        <div className="card p-5 mb-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
            <Clock size={24} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Average Response ETA</p>
            <p className="text-2xl font-bold text-navy-800">{adminStats.averageETA}</p>
          </div>
          <div className="ml-auto flex items-center gap-1 text-green-600">
            <TrendingUp size={18} />
            <span className="text-sm font-semibold">12% faster</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-navy-800">Live Vehicle Map</h2>
                <Activity size={18} className="text-green-500" />
              </div>
              <div className="relative w-full h-80 rounded-2xl overflow-hidden bg-[#e8eef5]">
                <div className="absolute inset-0">
                  <div className="absolute top-1/2 left-0 right-0 h-3 bg-gray-300/60 -translate-y-1/2" />
                  <div className="absolute top-0 bottom-0 left-1/2 w-3 bg-gray-300/60 -translate-x-1/2" />
                  <div className="absolute top-[25%] left-0 right-0 h-2 bg-gray-300/40" />
                  <div className="absolute top-0 bottom-0 left-[25%] w-2 bg-gray-300/40" />
                  <div className="absolute top-0 bottom-0 left-[75%] w-2 bg-gray-300/40" />
                  <div className="absolute top-[75%] left-0 right-0 h-2 bg-gray-300/40" />
                  <div className="absolute top-[5%] left-[5%] w-[15%] h-[15%] bg-green-100/50 rounded-lg" />
                  <div className="absolute top-[5%] right-[5%] w-[15%] h-[15%] bg-blue-100/40 rounded-lg" />
                  <div className="absolute bottom-[5%] left-[5%] w-[15%] h-[15%] bg-orange-100/40 rounded-lg" />
                  <div className="absolute bottom-[5%] right-[5%] w-[15%] h-[15%] bg-green-100/50 rounded-lg" />
                  <div className="absolute top-[30%] left-[30%] w-[15%] h-[15%] bg-gray-200/40 rounded-lg" />
                </div>
                {/* Markers */}
                {[
                  { x: 30, y: 35, color: 'bg-emergency-500', label: 'A102' },
                  { x: 70, y: 25, color: 'bg-emergency-500', label: 'A205' },
                  { x: 75, y: 65, color: 'bg-orange-500', label: 'F101' },
                  { x: 25, y: 70, color: 'bg-navy-600', label: 'P301' },
                  { x: 60, y: 75, color: 'bg-green-600', label: 'H1' },
                  { x: 80, y: 40, color: 'bg-emergency-600', label: '🔥' },
                ].map((m, i) => (
                  <div
                    key={i}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${m.x}%`, top: `${m.y}%` }}
                  >
                    <div className={`${m.color} w-8 h-8 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white text-[10px] font-bold text-white`}>
                      {m.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Emergency table */}
            <div className="card p-5 mt-6">
              <h2 className="font-bold text-navy-800 mb-4">Active Emergencies</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-gray-100">
                      <th className="pb-2 font-semibold">Emergency</th>
                      <th className="pb-2 font-semibold">Type</th>
                      <th className="pb-2 font-semibold">Vehicle</th>
                      <th className="pb-2 font-semibold">Location</th>
                      <th className="pb-2 font-semibold">Priority</th>
                      <th className="pb-2 font-semibold">ETA</th>
                      <th className="pb-2 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminEmergencies.map((e) => (
                      <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-3 font-semibold text-navy-700">#{e.id.toUpperCase()}</td>
                        <td className="py-3 text-gray-600">{e.type}</td>
                        <td className="py-3 text-gray-600">{e.vehicle}</td>
                        <td className="py-3 text-gray-600">{e.location}</td>
                        <td className="py-3">
                          <StatusBadge status={e.priority} variant={priorityColors[e.priority]} />
                        </td>
                        <td className="py-3 text-navy-700 font-semibold">{e.eta}</td>
                        <td className="py-3">
                          <StatusBadge status={e.status} variant={statusColors[e.status]} dot />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Traffic summary */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrafficCone size={18} className="text-orange-500" />
                <h2 className="font-bold text-navy-800">Traffic Summary</h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-sm text-gray-600">Normal</span>
                  </div>
                  <span className="font-bold text-navy-800">{trafficSummary.normal}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-orange-500" />
                    <span className="text-sm text-gray-600">Moderate</span>
                  </div>
                  <span className="font-bold text-navy-800">{trafficSummary.moderate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emergency-500" />
                    <span className="text-sm text-gray-600">Heavy</span>
                  </div>
                  <span className="font-bold text-navy-800">{trafficSummary.heavy}</span>
                </div>
              </div>
            </div>

            {/* Weekly chart */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={18} className="text-navy-500" />
                <h2 className="font-bold text-navy-800">Weekly Emergencies</h2>
              </div>
              <div className="flex items-end justify-between gap-2 h-32">
                {weeklyEmergencyData.map((d) => (
                  <div key={d.day} className="flex flex-col items-center gap-1 flex-1">
                    <div
                      className="w-full bg-navy-500 rounded-t-lg transition-all duration-500 hover:bg-navy-600"
                      style={{ height: `${(d.count / maxWeekly) * 100}%` }}
                    />
                    <span className="text-[10px] text-gray-400">{d.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent alerts */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={18} className="text-emergency-500" />
                <h2 className="font-bold text-navy-800">Recent Alerts</h2>
              </div>
              <div className="space-y-2">
                {[
                  { msg: 'Fire incident reported at Unit-4', time: '2 min ago', severity: 'error' as const },
                  { msg: 'Ambulance A102 dispatched', time: '5 min ago', severity: 'warning' as const },
                  { msg: 'Route optimized for P301', time: '12 min ago', severity: 'info' as const },
                ].map((a, i) => (
                  <div key={i} className="flex items-start gap-2 py-2 border-b border-gray-50 last:border-0">
                    <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      a.severity === 'error' ? 'bg-emergency-500' : a.severity === 'warning' ? 'bg-orange-500' : 'bg-blue-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm text-navy-700">{a.msg}</p>
                      <p className="text-xs text-gray-400">{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
