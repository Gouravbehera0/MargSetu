import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavigationNavbar from '@/components/NavigationNavbar';
import LeafletMap from '@/components/LeafletMap';
import MobileBottomNav from '@/components/MobileBottomNav';
import { useApp } from '@/context/AppContext';
import {
  fetchTrafficStatuses,
  updateTrafficStatus,
  fetchTrafficAnalytics,
  fetchTrafficPredictions,
  fetchRoadConditionReports,
  submitRoadConditionReport,
  submitSpeedObservation
} from '@/services/apiService';
import type {
  TrafficAnalyticsSummaryData,
  TrafficPredictionItem,
  RoadConditionReportItem,
  RoadSegmentIntelligence
} from '@/types';
import {
  Activity,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  Sliders,
  Sparkles,
  MapPin,
  Clock,
  ShieldAlert,
  Gauge,
  Users,
  Send,
  PlusCircle,
  X,
  Compass,
  ArrowLeft,
  Search,
  Filter
} from 'lucide-react';

interface RoadSegmentStatus {
  edge_id: string;
  name: string;
  from_node?: string;
  to_node?: string;
  distance_km?: number;
  travel_time_min?: number;
  speed_limit_kmh?: number;
  traffic_level: string;
  congestion_factor: number;
  is_blocked: boolean;
  reference_speed_kmh?: number;
  current_average_speed_kmh?: number;
  historical_average_speed_kmh?: number;
  observations_count?: number;
  congestion_score?: number;
  confidence_score?: number;
  coordinates?: [number, number][];
}

export default function TrafficSimulationPage() {
  const { mapState } = useApp();
  const safeOrigin = mapState?.origin || {
    lat: 21.2514,
    lng: 81.6296,
    name: 'Raipur Urban Center'
  };
  const [roads, setRoads] = useState<RoadSegmentStatus[]>([]);
  const [analytics, setAnalytics] = useState<TrafficAnalyticsSummaryData | null>(null);
  const [predictions, setPredictions] = useState<TrafficPredictionItem[]>([]);
  const [reports, setReports] = useState<RoadConditionReportItem[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<RoadSegmentStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [predictionHorizon, setPredictionHorizon] = useState<15 | 30>(15);

  // Road condition report modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState('pothole');
  const [reportSeverity, setReportSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [reportSegmentId, setReportSegmentId] = useState('E1');
  const [reportDesc, setReportDesc] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  // Telemetry ping simulator state
  const [pingSpeed, setPingSpeed] = useState<number>(24);
  const [pingSegmentId, setPingSegmentId] = useState<string>('E1');
  const [sendingPing, setSendingPing] = useState(false);

  // Mobile Android/iOS responsive state
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [mobileTab, setMobileTab] = useState<'map' | 'segments' | 'forecast' | 'ping'>('map');
  const [segmentSearch, setSegmentSearch] = useState('');
  const [segmentFilter, setSegmentFilter] = useState<'all' | 'congested' | 'free'>('all');

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

  useEffect(() => {
    loadAllTrafficData();
  }, [predictionHorizon]);

  async function loadAllTrafficData() {
    setLoading(true);
    try {
      const [roadsData, analyticsData, predsData, reportsData] = await Promise.all([
        fetchTrafficStatuses(),
        fetchTrafficAnalytics(),
        fetchTrafficPredictions(undefined, predictionHorizon),
        fetchRoadConditionReports()
      ]);
      setRoads(roadsData);
      setAnalytics(analyticsData);
      setPredictions(predsData);
      setReports(reportsData);
      if (!selectedSegment && roadsData.length > 0) {
        setSelectedSegment(roadsData[0]);
      }
    } catch (e) {
      console.error('Failed to load traffic data:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateLevel(edgeId: string, level: any, isBlocked: boolean = false) {
    try {
      await updateTrafficStatus(edgeId, level, isBlocked);
      setRoads((prev) =>
        prev.map((r) =>
          r.edge_id === edgeId
            ? {
                ...r,
                traffic_level: level,
                is_blocked: isBlocked,
                congestion_factor: level === 'blocked' ? 1.0 : level === 'high' ? 0.7 : level === 'medium' ? 0.35 : 0.15,
                congestion_score: level === 'blocked' ? 100 : level === 'high' ? 70 : level === 'medium' ? 35 : 15
              }
            : r
        )
      );

      // Refresh analytics and predictions after edge weight shift
      fetchTrafficAnalytics().then(setAnalytics);
      fetchTrafficPredictions(undefined, predictionHorizon).then(setPredictions);

      setToastMessage(
        `Dynamic Edge Weight Updated: Road segment ${edgeId} shifted to ${level.toUpperCase()}. QPSO metaheuristic recalculating routes...`
      );
      setTimeout(() => setToastMessage(null), 4000);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleSendTelemetryPing() {
    setSendingPing(true);
    try {
      const targetRoad = roads.find((r) => r.edge_id === pingSegmentId) || roads[0];
      const coords = targetRoad?.coordinates?.[0] || [20.2685, 85.836];

      const res = await submitSpeedObservation({
        latitude: coords[0],
        longitude: coords[1],
        speed_kmh: pingSpeed,
        heading_degrees: 180,
        segment_id: pingSegmentId
      });

      setToastMessage(
        `📡 Anonymized GPS Telemetry Ingested: Recorded ${pingSpeed} km/h on ${targetRoad?.name || pingSegmentId}. Active observations & confidence recalculated!`
      );
      setTimeout(() => setToastMessage(null), 4000);

      // Refresh segment data
      loadAllTrafficData();
    } catch (e) {
      console.error(e);
    } finally {
      setSendingPing(false);
    }
  }

  async function handleSubmitReport(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingReport(true);
    try {
      const targetRoad = roads.find((r) => r.edge_id === reportSegmentId) || roads[0];
      const coords = targetRoad?.coordinates?.[0] || [20.2685, 85.836];

      await submitRoadConditionReport({
        segment_id: reportSegmentId,
        latitude: coords[0],
        longitude: coords[1],
        report_type: reportType,
        severity: reportSeverity,
        description: reportDesc || `Reported ${reportType} on ${targetRoad?.name}`
      });

      setShowReportModal(false);
      setReportDesc('');
      setToastMessage(`⚠️ Road Condition Hazard Reported on ${targetRoad?.name}. Segment risk factor updated.`);
      setTimeout(() => setToastMessage(null), 4000);

      loadAllTrafficData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReport(false);
    }
  }

  const freeFlowCount = roads.filter((r) => (r.traffic_level || '').toLowerCase() === 'low' || (r.traffic_level || '').toLowerCase() === 'normal').length;
  const moderateCount = roads.filter((r) => (r.traffic_level || '').toLowerCase() === 'medium' || (r.traffic_level || '').toLowerCase() === 'moderate').length;
  const heavyCount = roads.filter((r) => (r.traffic_level || '').toLowerCase() === 'high' || (r.traffic_level || '').toLowerCase() === 'heavy' || (r.traffic_level || '').toLowerCase() === 'severe').length;
  const blockedCount = roads.filter((r) => r.is_blocked || (r.traffic_level || '').toLowerCase() === 'blocked').length;

  // =========================================================================
  // ANDROID & IOS MOBILE VIEW (Theme consistent, touch-optimized, full map & tabs)
  // =========================================================================
  if (isMobile) {
    const filteredRoads = roads.filter((r) => {
      const matchesSearch =
        !segmentSearch ||
        r.name.toLowerCase().includes(segmentSearch.toLowerCase()) ||
        r.edge_id.toLowerCase().includes(segmentSearch.toLowerCase());
      if (!matchesSearch) return false;
      const level = (r.traffic_level || '').toLowerCase();
      if (segmentFilter === 'congested') return level === 'high' || level === 'heavy' || level === 'severe' || r.is_blocked;
      if (segmentFilter === 'free') return level === 'low' || level === 'normal';
      return true;
    });

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
                <h1 className="text-sm font-extrabold text-white truncate tracking-tight">Traffic Analytics</h1>
                <span className="flex h-2 w-2 relative shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">QPSO Edge Telemetry & Forecasts</p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowReportModal(true)}
              className="flex items-center space-x-1 bg-rose-600/90 hover:bg-rose-600 text-white font-bold px-2.5 py-1.5 rounded-xl text-xs active:scale-95 shadow-xs transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Report</span>
            </button>
            <button
              type="button"
              onClick={loadAllTrafficData}
              disabled={loading}
              className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 active:scale-95 transition-all disabled:opacity-50"
              title="Refresh Analytics"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Dynamic Toast Banner on Mobile */}
        {toastMessage && (
          <div className="mx-3 mt-2.5 p-3 rounded-2xl bg-blue-950/90 border border-blue-500/40 text-blue-200 text-xs flex items-center space-x-2 animate-fadeIn shadow-lg">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 animate-pulse" />
            <span className="leading-tight font-medium text-[11px]">{toastMessage}</span>
          </div>
        )}

        {/* Swipeable Metrics KPI Pill Row */}
        <div className="flex space-x-2.5 overflow-x-auto px-3 py-2.5 scrollbar-none shrink-0">
          <div className="min-w-[130px] p-2.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-2xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Avg Speed</span>
              <Gauge className="w-3 h-3 text-blue-400" />
            </div>
            <div className="text-lg font-black text-white mt-0.5">
              {analytics?.network_average_speed_kmh || 38.4} <span className="text-[10px] font-semibold text-slate-400">km/h</span>
            </div>
            <div className="text-[9px] text-emerald-400 font-semibold truncate">Ref: 45 km/h</div>
          </div>

          <div className="min-w-[130px] p-2.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-2xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Congested</span>
              <AlertTriangle className="w-3 h-3 text-amber-400" />
            </div>
            <div className="text-lg font-black text-amber-400 mt-0.5">
              {heavyCount} <span className="text-[10px] font-semibold text-slate-400">/ {roads.length} links</span>
            </div>
            <div className="text-[9px] text-slate-400 font-medium truncate">
              {blockedCount > 0 ? `${blockedCount} blocked` : 'Corridors active'}
            </div>
          </div>

          <div className="min-w-[130px] p-2.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-2xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Observers</span>
              <Users className="w-3 h-3 text-emerald-400" />
            </div>
            <div className="text-lg font-black text-emerald-400 mt-0.5">
              {analytics?.active_observers_count || 48} <span className="text-[10px] font-semibold text-slate-400">users</span>
            </div>
            <div className="text-[9px] text-slate-400 font-medium truncate">IQR Outlier Filtered</div>
          </div>

          <div className="min-w-[130px] p-2.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-2xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Flow Status</span>
              <CheckCircle2 className="w-3 h-3 text-cyan-400" />
            </div>
            <div className="text-sm font-black text-cyan-300 mt-1 truncate">
              {analytics?.system_status || 'OPTIMAL'}
            </div>
            <div className="text-[9px] text-slate-400 font-medium truncate">Swarm Converged</div>
          </div>
        </div>

        {/* Tab Switcher Pills */}
        <div className="px-3 pb-2">
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-800/80 rounded-2xl border border-slate-700/70">
            {[
              { key: 'map', label: 'Map' },
              { key: 'segments', label: 'Roads' },
              { key: 'forecast', label: 'Forecast' },
              { key: 'ping', label: 'Speed Ping' }
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setMobileTab(tab.key as any)}
                className={`py-2 rounded-xl text-xs font-bold transition-all text-center ${
                  mobileTab === tab.key
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab 1: Live Traffic Map View */}
        {mobileTab === 'map' && (
          <div className="flex-1 px-3 flex flex-col space-y-3">
            <div className="h-[360px] rounded-2xl overflow-hidden border border-slate-700/80 relative shadow-inner">
              <LeafletMap
                showTrafficLayer={true}
                trafficSegments={roads}
                onSegmentClick={(seg) => setSelectedSegment(seg)}
                origin={safeOrigin}
                destination={mapState.destination}
                primaryRoute={mapState.primaryRoute}
                alternativeRoutes={mapState.alternativeRoutes}
                vehicleLocation={safeOrigin}
                vehicleType={mapState.vehicleType}
                activeAmbulanceAlert={mapState.activeAmbulance}
                center={[safeOrigin.lat, safeOrigin.lng]}
                zoom={13}
                className="w-full h-full"
              />

              {/* Legend overlay */}
              <div className="absolute top-2.5 left-2.5 right-2.5 z-10 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 flex items-center justify-between text-[10px] font-bold text-slate-300 shadow-md">
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Normal</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-yellow-500" />
                  <span>Moderate</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  <span>Heavy</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span>Severe</span>
                </span>
              </div>
            </div>

            {/* Selected Segment Inspection Card */}
            {selectedSegment && (
              <div className="p-4 rounded-2xl bg-slate-800/95 border border-slate-700 shadow-xl space-y-3">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-700/70">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-700 text-cyan-300 font-bold border border-slate-600">
                      {selectedSegment.edge_id}
                    </span>
                    <h3 className="text-xs font-black text-white truncate max-w-[160px]">
                      {selectedSegment.name}
                    </h3>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                      (selectedSegment.traffic_level || '').toLowerCase() === 'severe' || selectedSegment.is_blocked
                        ? 'bg-rose-900/80 text-rose-300 border border-rose-700'
                        : (selectedSegment.traffic_level || '').toLowerCase() === 'high' || (selectedSegment.traffic_level || '').toLowerCase() === 'heavy'
                        ? 'bg-orange-900/80 text-orange-300 border border-orange-700'
                        : (selectedSegment.traffic_level || '').toLowerCase() === 'medium' || (selectedSegment.traffic_level || '').toLowerCase() === 'moderate'
                        ? 'bg-amber-900/80 text-amber-300 border border-amber-700'
                        : 'bg-emerald-900/80 text-emerald-300 border border-emerald-700'
                    }`}
                  >
                    {selectedSegment.is_blocked ? 'BLOCKED' : selectedSegment.traffic_level || 'Normal'}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-slate-900/70 border border-slate-700/60">
                    <div className="text-[9px] uppercase font-bold text-slate-400">Current</div>
                    <div className="text-xs font-black text-blue-400 mt-0.5">
                      {selectedSegment.current_average_speed_kmh || 18} km/h
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/70 border border-slate-700/60">
                    <div className="text-[9px] uppercase font-bold text-slate-400">Ref Speed</div>
                    <div className="text-xs font-black text-slate-200 mt-0.5">
                      {selectedSegment.reference_speed_kmh || selectedSegment.speed_limit_kmh || 45} km/h
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/70 border border-slate-700/60">
                    <div className="text-[9px] uppercase font-bold text-slate-400">Observers</div>
                    <div className="text-xs font-black text-emerald-400 mt-0.5">
                      {selectedSegment.observations_count ?? 15}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/70 border border-slate-700/60">
                    <div className="text-[9px] uppercase font-bold text-slate-400">Congestion</div>
                    <div className="text-xs font-black text-rose-400 mt-0.5">
                      {selectedSegment.congestion_score ?? 65}/100
                    </div>
                  </div>
                </div>

                {/* Quick Simulation Shift Buttons */}
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Simulate Shift on this Edge:
                  </div>
                  <div className="grid grid-cols-5 gap-1 text-[10px] font-bold">
                    {[
                      { level: 'low', label: 'Normal', color: 'bg-emerald-900/50 text-emerald-300 border-emerald-700' },
                      { level: 'medium', label: 'Mod', color: 'bg-amber-900/50 text-amber-300 border-amber-700' },
                      { level: 'high', label: 'Heavy', color: 'bg-orange-900/50 text-orange-300 border-orange-700' },
                      { level: 'severe', label: 'Severe', color: 'bg-rose-900/50 text-rose-300 border-rose-700' },
                      { level: 'blocked', label: 'Block', color: 'bg-red-950 text-red-300 border-red-800', isBlocked: true }
                    ].map((btn) => (
                      <button
                        key={btn.level}
                        type="button"
                        onClick={() => handleUpdateLevel(selectedSegment.edge_id, btn.level, !!btn.isBlocked)}
                        className={`py-1.5 rounded-lg border text-center transition-all active:scale-95 ${btn.color}`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Roads List View */}
        {mobileTab === 'segments' && (
          <div className="px-3 space-y-3">
            {/* Search & Filter */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={segmentSearch}
                  onChange={(e) => setSegmentSearch(e.target.value)}
                  placeholder="Search road name or edge ID (e.g. E1)..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex space-x-1.5 overflow-x-auto pb-0.5 scrollbar-none text-[11px] font-bold">
                {[
                  { key: 'all', label: `All (${roads.length})` },
                  { key: 'congested', label: `Congested (${heavyCount + blockedCount})` },
                  { key: 'free', label: `Free Flow (${freeFlowCount})` }
                ].map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setSegmentFilter(f.key as any)}
                    className={`px-3 py-1 rounded-xl border whitespace-nowrap transition-all ${
                      segmentFilter === f.key
                        ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="space-y-2 max-h-[calc(100vh-270px)] overflow-y-auto pr-0.5">
              {filteredRoads.map((road) => {
                const isSelected = selectedSegment?.edge_id === road.edge_id;
                const level = (road.traffic_level || '').toLowerCase();
                return (
                  <div
                    key={road.edge_id}
                    onClick={() => {
                      setSelectedSegment(road);
                      setMobileTab('map');
                    }}
                    className={`p-3 rounded-2xl border transition-all active:scale-[0.99] cursor-pointer ${
                      isSelected
                        ? 'bg-blue-950/60 border-blue-500 ring-1 ring-blue-500'
                        : 'bg-slate-800/90 border-slate-700/80 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-700 text-cyan-300">
                          {road.edge_id}
                        </span>
                        <span className="text-xs font-bold text-white truncate max-w-[170px]">{road.name}</span>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          level === 'severe' || road.is_blocked
                            ? 'bg-rose-900/60 text-rose-300'
                            : level === 'high' || level === 'heavy'
                            ? 'bg-orange-900/60 text-orange-300'
                            : level === 'medium' || level === 'moderate'
                            ? 'bg-amber-900/60 text-amber-300'
                            : 'bg-emerald-900/60 text-emerald-300'
                        }`}
                      >
                        {road.is_blocked ? 'BLOCKED' : road.traffic_level || 'Normal'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
                      <span>Speed: <strong className="text-white">{road.current_average_speed_kmh || 20} km/h</strong></span>
                      <span>Ref: <strong>{road.reference_speed_kmh || 45} km/h</strong></span>
                      <span>Users: <strong className="text-emerald-400">{road.observations_count ?? 12}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Forecast & Hazards */}
        {mobileTab === 'forecast' && (
          <div className="px-3 space-y-4">
            {/* Horizon Selector */}
            <div className="p-3 rounded-2xl bg-slate-800/90 border border-slate-700 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">Forecast Horizon</div>
                <div className="text-[10px] text-slate-400">Predictive traffic congestion model</div>
              </div>
              <div className="flex space-x-1 p-1 bg-slate-900 rounded-xl border border-slate-700">
                <button
                  type="button"
                  onClick={() => setPredictionHorizon(15)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    predictionHorizon === 15 ? 'bg-blue-600 text-white' : 'text-slate-400'
                  }`}
                >
                  15m
                </button>
                <button
                  type="button"
                  onClick={() => setPredictionHorizon(30)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    predictionHorizon === 30 ? 'bg-blue-600 text-white' : 'text-slate-400'
                  }`}
                >
                  30m
                </button>
              </div>
            </div>

            {/* Predictions List */}
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {predictionHorizon}-Minute Congestion Forecasts
              </div>
              {predictions.slice(0, 5).map((pred, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-slate-800/90 border border-slate-700 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">{pred.segment_name || `Segment ${pred.segment_id}`}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Predicted Speed: <span className="font-bold text-blue-400">{pred.predicted_speed_kmh} km/h</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-700 text-slate-200">
                      {pred.predicted_traffic_level}
                    </span>
                    <div className="text-[10px] font-semibold text-slate-400 mt-0.5">
                      Confidence: {Math.round((pred.confidence || 0.85) * 100)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Road Condition Reports */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Community Hazards</span>
                <button
                  type="button"
                  onClick={() => setShowReportModal(true)}
                  className="text-xs font-bold text-rose-400 hover:text-rose-300"
                >
                  + Add Hazard
                </button>
              </div>
              {reports.map((rep) => (
                <div key={rep.id} className="p-3 rounded-2xl bg-slate-800/90 border border-slate-700 flex items-start space-x-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white capitalize">{rep.report_type}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 uppercase">
                        {rep.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{rep.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Telemetry Ping Simulator */}
        {mobileTab === 'ping' && (
          <div className="px-3 space-y-4">
            <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700 space-y-3">
              <div className="flex items-center space-x-2">
                <Send className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-extrabold text-white">Simulate GPS Telemetry Ping</h3>
              </div>
              <p className="text-[11px] text-slate-400">
                Emulate an individual vehicle driving along a corridor. Speed data is anonymized and aggregated into edge traffic indices.
              </p>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Target Road Segment</label>
                <select
                  value={pingSegmentId}
                  onChange={(e) => setPingSegmentId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                >
                  {roads.map((r) => (
                    <option key={r.edge_id} value={r.edge_id}>
                      {r.edge_id} - {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-400 font-bold">Observed Speed:</span>
                  <span className="font-black text-blue-400 text-sm">{pingSpeed} km/h</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="90"
                  value={pingSpeed}
                  onChange={(e) => setPingSpeed(Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>

              <button
                type="button"
                onClick={handleSendTelemetryPing}
                disabled={sendingPing}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/30 transition-all active:scale-98 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sendingPing ? 'Ingesting Observation...' : 'Transmit Telemetry Ping'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Hazard Modal */}
        {showReportModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex flex-col justify-end p-0">
            <div className="bg-slate-900 rounded-t-3xl max-h-[90vh] flex flex-col overflow-hidden border-t border-slate-700 shadow-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  <span>Report Road Hazard</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitReport} className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Road Segment</label>
                  <select
                    value={reportSegmentId}
                    onChange={(e) => setReportSegmentId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    {roads.map((r) => (
                      <option key={r.edge_id} value={r.edge_id}>{r.edge_id} - {r.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Hazard Type</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {['pothole', 'waterlogging', 'roadblock', 'accident', 'construction'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setReportType(t)}
                        className={`py-1.5 rounded-lg text-xs font-bold capitalize border ${
                          reportType === t ? 'bg-rose-600 text-white border-rose-500' : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Severity</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['low', 'medium', 'high', 'critical'] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setReportSeverity(s)}
                        className={`py-1.5 rounded-lg text-xs font-bold capitalize border ${
                          reportSeverity === s ? 'bg-amber-600 text-white border-amber-500' : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Description</label>
                  <input
                    type="text"
                    value={reportDesc}
                    onChange={(e) => setReportDesc(e.target.value)}
                    placeholder="Details (e.g. Deep pothole right lane)..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReport}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl text-xs shadow-md transition-all disabled:opacity-50"
                >
                  {submittingReport ? 'Submitting Hazard...' : 'Submit Road Hazard Report'}
                </button>
              </form>
            </div>
          </div>
        )}

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
        {/* Dynamic Toast Notification */}
        {toastMessage && (
          <div className="bg-navy-900 text-white p-4 rounded-2xl shadow-xl border border-blue-500/30 flex items-center space-x-3 animate-fadeIn">
            <span className="p-2 bg-blue-500/20 rounded-xl text-cyan-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </span>
            <div className="text-xs font-semibold">{toastMessage}</div>
          </div>
        )}

        {/* Dashboard Header & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center space-x-2">
              <Activity className="w-6 h-6 text-blue-600" />
              <span>AI Traffic Intelligence & Real-Time Analytics</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Crowdsourced GPS telemetry aggregation, IQR outlier rejection, 15–30m forecasting, and QPSO dynamic edge recalculation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowReportModal(true)}
              className="flex items-center space-x-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold px-3.5 py-2 rounded-xl text-xs shadow-sm transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Report Hazard</span>
            </button>

            <button
              onClick={loadAllTrafficData}
              className="flex items-center space-x-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold px-3.5 py-2 rounded-xl text-xs shadow-sm transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Analytics</span>
            </button>
          </div>
        </div>

        {/* 1. Real-Time Network Analytics KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Network Avg Speed</div>
              <Gauge className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {analytics?.network_average_speed_kmh || 38.4} <span className="text-xs font-bold text-slate-500">km/h</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center space-x-1">
              <span className="text-emerald-600 font-bold">● Free-flow reference: 45 km/h</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Congested Links</div>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-amber-600 mt-1">
              {analytics?.congested_segments_count || heavyCount} <span className="text-xs font-bold text-slate-500">/ {roads.length || 22}</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {blockedCount > 0 ? `${blockedCount} corridor blocked` : 'All corridors open'}
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Observers</div>
              <Users className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {analytics?.active_observers_count || 48} <span className="text-xs font-bold text-slate-500">vehicles</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Privacy-safe anonymous telemetry
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Network Status</div>
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-lg font-black text-blue-700 mt-1 truncate">
              {analytics?.system_status || 'OPTIMAL_FLOW'}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              QPSO swarm convergence active
            </div>
          </div>
        </div>

        {/* 2. Interactive Map & Road Segment Analysis Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map with Live Congestion Layer */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Compass className="w-4 h-4 text-blue-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Live Traffic Network Map (Click Any Segment)
                </h2>
              </div>
              <div className="flex items-center space-x-3 text-[11px] font-semibold">
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-slate-600">Normal</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  <span className="text-slate-600">Moderate</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                  <span className="text-slate-600">Heavy</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span className="text-slate-600">Severe</span>
                </span>
              </div>
            </div>

            <div className="h-[360px] sm:h-[420px] rounded-xl overflow-hidden border border-slate-200 relative">
              <LeafletMap
                showTrafficLayer={true}
                trafficSegments={roads}
                onSegmentClick={(seg) => setSelectedSegment(seg)}
                origin={safeOrigin}
                destination={mapState.destination}
                primaryRoute={mapState.primaryRoute}
                alternativeRoutes={mapState.alternativeRoutes}
                vehicleLocation={safeOrigin}
                vehicleType={mapState.vehicleType}
                activeAmbulanceAlert={mapState.activeAmbulance}
                center={[safeOrigin.lat, safeOrigin.lng]}
                zoom={13}
                className="w-full h-full"
              />
            </div>
          </div>

          {/* Road Segment Detailed Inspection Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold border border-slate-200">
                    {selectedSegment?.edge_id || 'E1'}
                  </span>
                  <h3 className="text-base font-black text-slate-900 mt-1">
                    {selectedSegment?.name || 'Janpath South'}
                  </h3>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-black uppercase tracking-wider ${
                    (selectedSegment?.traffic_level || '').toLowerCase() === 'severe' || selectedSegment?.is_blocked
                      ? 'bg-rose-100 text-rose-700'
                      : (selectedSegment?.traffic_level || '').toLowerCase() === 'high' || (selectedSegment?.traffic_level || '').toLowerCase() === 'heavy'
                      ? 'bg-orange-100 text-orange-700'
                      : (selectedSegment?.traffic_level || '').toLowerCase() === 'medium' || (selectedSegment?.traffic_level || '').toLowerCase() === 'moderate'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {selectedSegment?.is_blocked ? 'BLOCKED' : selectedSegment?.traffic_level || 'Normal'}
                </span>
              </div>

              {/* Exact format requested by user */}
              <div className="mt-4 space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Reference Speed:</span>
                  <span className="font-bold text-slate-800">
                    {selectedSegment?.reference_speed_kmh || selectedSegment?.speed_limit_kmh || 45} km/h
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Current Average Speed:</span>
                  <span className="font-black text-blue-600 text-sm">
                    {selectedSegment?.current_average_speed_kmh || 18} km/h
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Historical Baseline:</span>
                  <span className="font-semibold text-slate-700">
                    {selectedSegment?.historical_average_speed_kmh || 35} km/h
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Observations:</span>
                  <span className="font-bold text-slate-800">
                    {selectedSegment?.observations_count !== undefined ? selectedSegment.observations_count : 15} active users
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Traffic Level:</span>
                  <span className="font-bold text-slate-800 uppercase">
                    {selectedSegment?.traffic_level || 'Heavy'}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Congestion Score:</span>
                  <span className="font-black text-rose-600">
                    {selectedSegment?.congestion_score !== undefined ? selectedSegment.congestion_score : 65}/100
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Confidence:</span>
                  <span className="font-bold text-emerald-600">
                    {selectedSegment?.confidence_score !== undefined ? selectedSegment.confidence_score : 92}%
                  </span>
                </div>

                <div className="flex justify-between py-1">
                  <span className="text-slate-500 font-medium">Estimated Travel Time:</span>
                  <span className="font-bold text-slate-800">
                    {selectedSegment?.travel_time_min || 4.2} min
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Live Modifier Buttons */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Simulate Shift on this Segment:
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  onClick={() => selectedSegment && handleUpdateLevel(selectedSegment.edge_id, 'low', false)}
                  className="py-1 px-1 text-[11px] font-bold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-all text-center"
                >
                  Normal
                </button>
                <button
                  onClick={() => selectedSegment && handleUpdateLevel(selectedSegment.edge_id, 'medium', false)}
                  className="py-1 px-1 text-[11px] font-bold rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-all text-center"
                >
                  Moderate
                </button>
                <button
                  onClick={() => selectedSegment && handleUpdateLevel(selectedSegment.edge_id, 'high', false)}
                  className="py-1 px-1 text-[11px] font-bold rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 transition-all text-center"
                >
                  Heavy
                </button>
                <button
                  onClick={() => selectedSegment && handleUpdateLevel(selectedSegment.edge_id, 'blocked', true)}
                  className="py-1 px-1 text-[11px] font-bold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-all text-center"
                >
                  Block
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3. 15–30 Minute AI Traffic Predictions & Bottlenecks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 15m / 30m Prediction Trajectory */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-purple-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  AI Traffic Forecast (Double-Exponential Smoothing)
                </h3>
              </div>

              {/* 15m / 30m Toggle Tabs */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
                <button
                  onClick={() => setPredictionHorizon(15)}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    predictionHorizon === 15 ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  +15 Min
                </button>
                <button
                  onClick={() => setPredictionHorizon(30)}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    predictionHorizon === 30 ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  +30 Min
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {predictions.slice(0, 4).map((p) => {
                const segInfo = roads.find((r) => r.edge_id === p.segment_id);
                return (
                  <div
                    key={`${p.segment_id}-${p.horizon_minutes}`}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-slate-700">{p.segment_id}</span>
                        <span className="text-xs font-bold text-slate-900">{segInfo?.name || 'Corridor Link'}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 flex items-center space-x-2 font-medium">
                        <span>Speed: <strong className="text-slate-700">{p.predicted_speed_kmh} km/h</strong></span>
                        <span>•</span>
                        <span>Congestion: <strong className="text-slate-700">{p.predicted_congestion_score}/100</strong></span>
                        <span>•</span>
                        <span>Confidence: <strong className="text-emerald-600">{p.confidence_score}%</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded uppercase flex items-center space-x-1 ${
                          p.trend === 'IMPROVING'
                            ? 'bg-emerald-100 text-emerald-700'
                            : p.trend === 'WORSENING'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {p.trend === 'IMPROVING' ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : p.trend === 'WORSENING' ? (
                          <TrendingDown className="w-3 h-3" />
                        ) : (
                          <Minus className="w-3 h-3" />
                        )}
                        <span>{p.trend}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Bottlenecks Ranking */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Top Network Bottlenecks (High AI Congestion)
              </h3>
            </div>

            <div className="space-y-3">
              {(analytics?.top_bottlenecks || []).slice(0, 4).map((b, idx) => (
                <div
                  key={b.segment_id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 font-black text-xs flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{b.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Current: <strong className="text-rose-600">{b.current_speed_kmh} km/h</strong> (Ref: {b.reference_speed_kmh} km/h) • {b.observations} users
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-black text-rose-600">{b.congestion_score}/100</div>
                    <div className="text-[10px] text-slate-400 font-semibold">{b.confidence_score}% Conf</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Telemetry Ping Simulator & Active Road Hazard Reports Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live Telemetry Ping Simulator */}
          <div className="bg-gradient-to-br from-navy-900 to-slate-900 text-white p-5 rounded-2xl shadow-xl border border-blue-500/20 space-y-4">
            <div className="flex items-center space-x-2">
              <Send className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                GPS Speed Telemetry Ingestion (Simulator)
              </h3>
            </div>
            <p className="text-xs text-slate-300">
              Simulate an anonymized vehicle GPS ping during navigation. The AI map-matches the point, filters outliers via IQR, and updates congestion.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-semibold">Target Road Segment:</label>
                <select
                  value={pingSegmentId}
                  onChange={(e) => setPingSegmentId(e.target.value)}
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-cyan-400"
                >
                  {roads.map((r) => (
                    <option key={r.edge_id} value={r.edge_id}>
                      {r.edge_id} - {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between text-slate-400 font-semibold">
                  <span>Reported Speed:</span>
                  <span className="text-cyan-400 font-bold">{pingSpeed} km/h</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="90"
                  step="1"
                  value={pingSpeed}
                  onChange={(e) => setPingSpeed(Number(e.target.value))}
                  className="w-full mt-1.5 accent-cyan-400 cursor-pointer"
                />
              </div>

              <button
                type="button"
                onClick={handleSendTelemetryPing}
                disabled={sendingPing}
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sendingPing ? 'Ingesting Telemetry...' : 'Send Anonymized Telemetry Ping'}</span>
              </button>
            </div>
          </div>

          {/* Crowdsourced Hazard Reports */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Active Crowdsourced Road Hazards & Condition Reports
                </h3>
              </div>
              <button
                onClick={() => setShowReportModal(true)}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Submit Report</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {reports.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No active road hazard reports currently logged.
                </div>
              ) : (
                reports.map((rep) => (
                  <div key={rep.id} className="py-3 flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {rep.segment_id || 'Corridor'}
                        </span>
                        <span className="text-xs font-bold text-slate-900 capitalize">
                          {rep.report_type.replace('_', ' ')}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-black uppercase ${
                            rep.severity === 'critical'
                              ? 'bg-rose-100 text-rose-700'
                              : rep.severity === 'high'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {rep.severity}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 font-medium">{rep.description}</p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-[11px] font-bold text-slate-500">👍 {rep.upvotes} verified</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Active</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Road Hazard Reporting Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-scaleIn">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">Report Road Condition Hazard</h3>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className="p-5 space-y-4 text-xs font-medium text-slate-700">
              <div>
                <label className="font-bold text-slate-800">Affected Road Corridor:</label>
                <select
                  value={reportSegmentId}
                  onChange={(e) => setReportSegmentId(e.target.value)}
                  className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 font-semibold focus:outline-none focus:border-blue-500"
                >
                  {roads.map((r) => (
                    <option key={r.edge_id} value={r.edge_id}>
                      {r.edge_id} - {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-800">Hazard Type:</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 font-semibold focus:outline-none focus:border-blue-500"
                >
                  <option value="pothole">Monsoon Pothole / Road Crater</option>
                  <option value="accident">Traffic Accident / Collision</option>
                  <option value="bad_road">Severe Road Degradation</option>
                  <option value="waterlogging">Waterlogging / Flooding</option>
                  <option value="closure">Emergency Roadblock / Closure</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-800">Severity:</label>
                <div className="grid grid-cols-4 gap-2 mt-1">
                  {(['low', 'medium', 'high', 'critical'] as const).map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setReportSeverity(sev)}
                      className={`py-1.5 rounded-lg border text-xs font-bold uppercase transition-all ${
                        reportSeverity === sev
                          ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800">Description / Details:</label>
                <textarea
                  rows={3}
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                  placeholder="e.g. Deep pothole right after traffic signal, causes heavy braking..."
                  className="w-full mt-1 border border-slate-200 rounded-xl p-3 bg-slate-50 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReport}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black shadow-md transition-all disabled:opacity-50"
                >
                  {submittingReport ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
