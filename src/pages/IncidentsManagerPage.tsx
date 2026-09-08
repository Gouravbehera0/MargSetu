import { useState } from 'react';
import NavigationNavbar from '@/components/NavigationNavbar';
import {
  AlertTriangle,
  Flame,
  Construction,
  ShieldAlert,
  Plus,
  Trash2,
  CheckCircle,
  MapPin,
  Clock
} from 'lucide-react';
import type { IncidentRecord } from '@/types';

const INITIAL_INCIDENTS: IncidentRecord[] = [
  {
    id: 'inc-1',
    type: 'accident',
    description: 'Minor 2-wheeler collision near Master Canteen Chowk',
    location: { lat: 20.2685, lng: 85.8360, name: 'Master Canteen Chowk' },
    affected_nodes: ['N1', 'N2'],
    severity: 'warning',
    reported_at: '10 mins ago',
    active: true
  },
  {
    id: 'inc-2',
    type: 'roadblock',
    description: 'Culvert drainage excavation on Sachivalaya Marg (Unit-4)',
    location: { lat: 20.2850, lng: 85.8240, name: 'Sachivalaya Marg' },
    affected_nodes: ['N4', 'N5'],
    severity: 'critical',
    reported_at: '25 mins ago',
    active: true
  },
  {
    id: 'inc-3',
    type: 'construction',
    description: 'Smart City flyover girder assembly on Janpath Road',
    location: { lat: 20.2920, lng: 85.8450, name: 'Janpath Central' },
    affected_nodes: ['N6', 'N7'],
    severity: 'info',
    reported_at: '1 hour ago',
    active: true
  }
];

export default function IncidentsManagerPage() {
  const [incidents, setIncidents] = useState<IncidentRecord[]>(INITIAL_INCIDENTS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<'accident' | 'roadblock' | 'construction' | 'fire'>('accident');
  const [newSeverity, setNewSeverity] = useState<'info' | 'warning' | 'critical'>('warning');

  function handleCreateIncident(e: React.FormEvent) {
    e.preventDefault();
    if (!newDesc) return;
    const newInc: IncidentRecord = {
      id: `inc-${Date.now().toString().slice(-4)}`,
      type: newType,
      description: newDesc,
      location: { lat: 20.2780, lng: 85.8310, name: 'Reported Location' },
      affected_nodes: ['N4', 'N6'],
      severity: newSeverity,
      reported_at: 'Just now',
      active: true
    };
    setIncidents([newInc, ...incidents]);
    setShowAddModal(false);
    setNewDesc('');
  }

  function handleResolveIncident(id: string) {
    setIncidents(incidents.filter((i) => i.id !== id));
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <NavigationNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center space-x-2">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
              <span>Road Incident & Hazard Management</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Real-time accidents, road closures, and construction zones that automatically influence QPSO risk and blockage weights.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Report Road Incident</span>
          </button>
        </div>

        {/* Incidents List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {incidents.map((inc) => (
            <div
              key={inc.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                      inc.severity === 'critical'
                        ? 'bg-red-100 text-red-800'
                        : inc.severity === 'warning'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {inc.severity}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">{inc.reported_at}</span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mt-3">{inc.description}</h3>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{inc.location.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    <span>Affects Corridor Nodes: {inc.affected_nodes.join(' ↔ ')}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-600">Active Impediment</span>
                <button
                  onClick={() => handleResolveIncident(inc.id)}
                  className="flex items-center space-x-1.5 text-xs text-slate-600 hover:text-red-600 bg-slate-50 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Resolve & Clear</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal: Report Incident */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn">
              <h3 className="text-base font-bold text-slate-900 mb-4">Report Road Obstruction / Incident</h3>

              <form onSubmit={handleCreateIncident} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Incident Type</label>
                  <select
                    value={newType}
                    onChange={(e: any) => setNewType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none"
                  >
                    <option value="accident">Traffic Accident</option>
                    <option value="roadblock">Complete Roadblock / Closure</option>
                    <option value="construction">Roadwork / Construction</option>
                    <option value="fire">Fire Emergency Zone</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="e.g. Overturned vehicle blocking right 2 lanes..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Severity Level</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['info', 'warning', 'critical'] as const).map((lvl) => (
                      <button
                        type="button"
                        key={lvl}
                        onClick={() => setNewSeverity(lvl)}
                        className={`p-2 rounded-xl uppercase font-bold text-[10px] border transition-all ${
                          newSeverity === lvl
                            ? 'bg-navy-900 text-white border-navy-900'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md"
                  >
                    Submit Incident
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
