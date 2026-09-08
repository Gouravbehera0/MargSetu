import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavigationNavbar from '@/components/NavigationNavbar';
import LeafletMap from '@/components/LeafletMap';
import {
  GitFork,
  CheckCircle2,
  Clock,
  Route,
  Shield,
  Activity,
  Sparkles,
  ArrowRight,
  TrendingDown
} from 'lucide-react';

interface RouteRow {
  id: string;
  name: string;
  etaMin: number;
  distanceKm: number;
  trafficLevel: 'Low' | 'Moderate' | 'High' | 'Severe';
  congestionScore: number;
  riskScore: number;
  blockage: boolean;
  fitness: number;
  recommended?: boolean;
  coordinates: [number, number][];
}

const COMPARISON_ROUTES: RouteRow[] = [
  {
    id: 'corridor-b',
    name: 'Corridor B (Expressway Link)',
    etaMin: 12.4,
    distanceKm: 7.8,
    trafficLevel: 'Low',
    congestionScore: 0.18,
    riskScore: 0.05,
    blockage: false,
    fitness: 0.208,
    recommended: true,
    coordinates: [
      [20.2685, 85.8360],
      [20.2780, 85.8310],
      [20.2920, 85.8270],
      [20.3050, 85.8220],
      [20.3120, 85.8180]
    ]
  },
  {
    id: 'corridor-a',
    name: 'Corridor A (Janpath Direct)',
    etaMin: 17.5,
    distanceKm: 7.2,
    trafficLevel: 'High',
    congestionScore: 0.68,
    riskScore: 0.12,
    blockage: false,
    fitness: 0.412,
    coordinates: [
      [20.2685, 85.8360],
      [20.2850, 85.8340],
      [20.3010, 85.8350],
      [20.3120, 85.8180]
    ]
  },
  {
    id: 'corridor-c',
    name: 'Corridor C (Khandagiri Western Bypass)',
    etaMin: 15.2,
    distanceKm: 9.4,
    trafficLevel: 'Low',
    congestionScore: 0.22,
    riskScore: 0.04,
    blockage: false,
    fitness: 0.265,
    coordinates: [
      [20.2685, 85.8360],
      [20.2610, 85.8340],
      [20.2560, 85.7890],
      [20.3120, 85.8180]
    ]
  },
  {
    id: 'corridor-d',
    name: 'Corridor D (Science Park Arterial)',
    etaMin: 16.8,
    distanceKm: 8.1,
    trafficLevel: 'Moderate',
    congestionScore: 0.45,
    riskScore: 0.09,
    blockage: false,
    fitness: 0.334,
    coordinates: [
      [20.2685, 85.8360],
      [20.2730, 85.8280],
      [20.2940, 85.8390],
      [20.3120, 85.8180]
    ]
  }
];

export default function RoutesComparisonPage() {
  const navigate = useNavigate();
  const [selectedRoute, setSelectedRoute] = useState<RouteRow>(COMPARISON_ROUTES[0]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <NavigationNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center space-x-2">
              <GitFork className="w-6 h-6 text-blue-600" />
              <span>Multi-Criteria Route Evaluation Matrix</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Side-by-side analysis of candidate paths ranked by the Quantum-Inspired Particle Swarm Optimizer.
            </p>
          </div>
          <button
            onClick={() => navigate('/navigate')}
            className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md transition-all"
          >
            <span>Navigate Selected Route</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Comparison Table Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="pb-3 pl-2">Candidate Corridor</th>
                <th className="pb-3">Travel Time (T)</th>
                <th className="pb-3">Distance (D)</th>
                <th className="pb-3">Traffic Level (C)</th>
                <th className="pb-3">Risk Index (R)</th>
                <th className="pb-3">Composite Fitness F</th>
                <th className="pb-3 text-right pr-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {COMPARISON_ROUTES.map((route) => {
                const isSelected = selectedRoute.id === route.id;
                return (
                  <tr
                    key={route.id}
                    onClick={() => setSelectedRoute(route)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50/70 font-semibold' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3.5 pl-2">
                      <div className="flex items-center space-x-2">
                        {route.recommended ? (
                          <span className="p-1 rounded-full bg-blue-600 text-white">
                            <Sparkles className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-600 font-bold">
                            {route.name.split(' ')[1]}
                          </span>
                        )}
                        <div>
                          <span className="text-slate-900">{route.name}</span>
                          {route.recommended && (
                            <span className="ml-2 text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                              QPSO Best
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5">
                      <span className="text-slate-900 font-bold">{route.etaMin} min</span>
                    </td>
                    <td className="py-3.5">{route.distanceKm} km</td>
                    <td className="py-3.5">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                          route.trafficLevel === 'Low'
                            ? 'bg-emerald-100 text-emerald-800'
                            : route.trafficLevel === 'Moderate'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {route.trafficLevel} ({Math.round(route.congestionScore * 100)}%)
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-500">{route.riskScore}</td>
                    <td className="py-3.5">
                      <span className="font-mono font-bold text-blue-700">{route.fitness}</span>
                    </td>
                    <td className="py-3.5 text-right pr-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRoute(route);
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected ? 'Active' : 'Select'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Selected Route Details & Map */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
            <h2 className="text-base font-bold text-slate-800 flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Selected Corridor Assessment</span>
            </h2>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-semibold">Corridor Title</span>
                <span className="text-xs font-bold text-slate-900">{selectedRoute.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-semibold">Travel Duration</span>
                <span className="text-xs font-bold text-blue-600">{selectedRoute.etaMin} minutes</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-semibold">Physical Distance</span>
                <span className="text-xs font-bold text-slate-900">{selectedRoute.distanceKm} kilometers</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-semibold">Congestion Index</span>
                <span className="text-xs font-bold text-slate-900">{selectedRoute.congestionScore}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-semibold">Road Closure / Blockage</span>
                <span className="text-xs font-bold text-emerald-600">None (Clear Flow)</span>
              </div>
            </div>

            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-slate-600">
              <div className="font-bold text-blue-900 mb-1">Explainability Note:</div>
              {selectedRoute.recommended
                ? 'This route minimizes total weighted cost by utilizing free-flowing express links, avoiding Master Canteen bottle-necking.'
                : 'This alternative has slightly longer travel time due to intersections or moderate arterial congestion.'}
            </div>

            <button
              onClick={() => navigate('/navigate')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-xs shadow transition-all flex items-center justify-center space-x-2"
            >
              <span>Commit & Start Navigation</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="lg:col-span-7 bg-white rounded-2xl p-4 shadow-sm border border-slate-200 min-h-[400px]">
            <LeafletMap
              primaryRoute={selectedRoute.coordinates}
              className="w-full h-full min-h-[380px] rounded-xl"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
