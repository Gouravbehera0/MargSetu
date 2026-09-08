import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavigationNavbar from '@/components/NavigationNavbar';
import LeafletMap from '@/components/LeafletMap';
import { checkCitizenGiveWayAlerts } from '@/services/apiService';
import type { CitizenGiveWayAlertItem } from '@/types';
import {
  Siren,
  Flame,
  Shield,
  Hospital,
  AlertTriangle,
  Radio,
  Navigation,
  CheckCircle2,
  BellRing,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function EmergencyCommandPage() {
  const navigate = useNavigate();

  const [activeEmergencyType, setActiveEmergencyType] = useState<'ambulance' | 'fire' | 'police'>('ambulance');
  const [alertRadius, setAlertRadius] = useState<number>(600);
  const [giveWayAlerts, setGiveWayAlerts] = useState<CitizenGiveWayAlertItem[]>([]);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Active emergency vehicle trajectory
  const emergencyRoute: [number, number][] = [
    [20.2720, 85.8280],
    [20.2810, 85.8250],
    [20.2950, 85.8210],
    [20.3050, 85.8190],
    [20.3120, 85.8180]
  ];

  const simulatedCitizens = [
    { id: 'c1', lat: 20.2740, lng: 85.8300, label: 'Citizen Priya (In corridor - 320m away)' },
    { id: 'c2', lat: 20.2830, lng: 85.8240, label: 'Citizen Rohit (Ahead on route - 850m away)' },
    { id: 'c3', lat: 20.2980, lng: 85.8420, label: 'Citizen Sunita (Outside corridor)' }
  ];

  async function handleTriggerBroadcast() {
    setIsBroadcasting(true);
    try {
      const alerts = await checkCitizenGiveWayAlerts('ev-1', alertRadius);
      setGiveWayAlerts(alerts);
    } catch (e) {
      console.error(e);
    } finally {
      setIsBroadcasting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <NavigationNavbar />

      {/* Emergency Alert Banner */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white px-4 py-3 shadow-md flex items-center justify-between">
        <div className="flex items-center space-x-3 max-w-7xl mx-auto w-full">
          <div className="p-2 bg-white/20 rounded-full animate-pulse">
            <Siren className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-wider">
              🚨 EMERGENCY VEHICLE PRIORITY CORRIDOR ACTIVE
            </h1>
            <p className="text-xs text-red-100">
              QPSO priority weights applied: Travel Time weight = 0.60 | High Congestion Penalty = 0.20
            </p>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center space-x-2">
              <Radio className="w-5 h-5 text-red-600" />
              <span>Emergency Command & Citizen Give-Way Radar</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live proximity surveillance automatically alerts drivers in oncoming lanes to clear emergency corridors.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveEmergencyType('ambulance')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                activeEmergencyType === 'ambulance'
                  ? 'bg-red-600 text-white border-red-600 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Siren className="w-4 h-4" />
              <span>Ambulance</span>
            </button>
            <button
              onClick={() => setActiveEmergencyType('fire')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                activeEmergencyType === 'fire'
                  ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Flame className="w-4 h-4" />
              <span>Fire Tender</span>
            </button>
            <button
              onClick={() => setActiveEmergencyType('police')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                activeEmergencyType === 'police'
                  ? 'bg-navy-900 text-white border-navy-900 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Police</span>
            </button>
          </div>
        </div>

        {/* Radar Map & Give-Way Broadcast Engine */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Give-Way Surveillance Console */}
          <div className="lg:col-span-5 space-y-5">
            {/* Proximity Radius Slider Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Citizen Alert Proximity Radius
                </span>
                <span className="text-sm font-black text-red-600">{alertRadius} meters</span>
              </div>

              <input
                type="range"
                min="300"
                max="1200"
                step="50"
                value={alertRadius}
                onChange={(e) => setAlertRadius(Number(e.target.value))}
                className="w-full accent-red-600 cursor-pointer"
              />

              <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                <span>300m (Inner City)</span>
                <span>600m (Recommended)</span>
                <span>1200m (Expressway)</span>
              </div>

              <button
                onClick={handleTriggerBroadcast}
                disabled={isBroadcasting}
                className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold py-3 px-4 rounded-xl text-xs shadow-md shadow-red-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <BellRing className="w-4 h-4" />
                <span>{isBroadcasting ? 'Broadcasting Give-Way Wave...' : 'Simulate Citizen Give-Way Alert'}</span>
              </button>
            </div>

            {/* Broadcast Results / Alert Notifications */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span>Active Give-Way Alerts Dispatched</span>
                <span className="text-red-600 font-bold">{giveWayAlerts.length} Citizens In Range</span>
              </h3>

              {giveWayAlerts.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  Click "Simulate Citizen Give-Way Alert" to trigger proximity detection along the emergency corridor.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {giveWayAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-start space-x-3"
                    >
                      <span className="text-lg">📢</span>
                      <div>
                        <div className="text-xs font-bold text-red-900">{alert.message}</div>
                        <div className="text-[11px] text-red-600 mt-1 flex items-center space-x-2">
                          <span>Target: {alert.citizen_id}</span>
                          <span>•</span>
                          <span>Distance: {alert.distance_meters}m</span>
                          <span>•</span>
                          <span>Severity: Critical</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Emergency Facilities Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Destination Medical Facility Readiness
              </h3>

              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Hospital className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">AIIMS Trauma Center</h4>
                    <p className="text-[11px] text-slate-500">Destination of AMB-108</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-emerald-600">8 ICU Beds Free</div>
                  <div className="text-[10px] text-slate-400">Green corridor cleared</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Map with Pulsing Proximity Radar */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-4 border border-slate-200 shadow-sm min-h-[520px] flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                <Siren className="w-4 h-4 text-red-600" />
                <span>Live Corridor Navigation & Give-Way Circle</span>
              </div>
              <span className="text-[11px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">
                Radar: {alertRadius}m
              </span>
            </div>

            <div className="flex-1 w-full h-[480px] rounded-xl overflow-hidden relative">
              <LeafletMap
                origin={{ lat: 20.2720, lng: 85.8280, name: 'Ambulance Current Pos' }}
                destination={{ lat: 20.3120, lng: 85.8180, name: 'AIIMS Hospital' }}
                primaryRoute={emergencyRoute}
                vehicleLocation={{ lat: 20.2720, lng: 85.8280, name: 'AMB-108' }}
                vehicleType="ambulance"
                showEmergencyRadius={true}
                alertRadiusMeters={alertRadius}
                citizens={simulatedCitizens}
                className="w-full h-full rounded-xl"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
