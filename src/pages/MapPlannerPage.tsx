import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import NavigationNavbar from '@/components/NavigationNavbar';
import HighwayCorridorBanner from '@/components/HighwayCorridorBanner';
import LeafletMap from '@/components/LeafletMap';
import { optimizeRouteWithQPSO, fetchActiveAmbulanceAlert, stepEmergencyVehicle } from '@/services/apiService';
import {
  reverseGeocodeLocation,
  searchPlacesAutocomplete,
  getIntelligentDestinationSetup,
  CITY_PROFILES,
  findClosestCityProfile,
  type LocationSearchResult,
  type PresetDestination
} from '@/services/geocodingService';
import type {
  GeneralVehicleType,
  RoutePreference,
  GeoPoint,
  QPSOOptimizationResult,
  RouteCandidateAlternative,
  ActiveAmbulanceAlertData
} from '@/types';
import {
  Compass,
  MapPin,
  Navigation,
  Car,
  Bike,
  Bus,
  Truck,
  Package,
  Siren,
  Flame,
  Shield,
  Zap,
  Route as RouteIcon,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  TrendingDown,
  MousePointerClick,
  ArrowUpDown,
  Search,
  Loader2,
  LocateFixed,
  Building2,
  Train,
  Plane,
  Cross,
  Radio,
  Play,
  Pause,
  FastForward,
  RotateCcw,
  AlertTriangle,
  Activity,
  Volume2,
  CheckCircle2,
  ShieldAlert,
  Menu,
  X,
  ChevronUp,
  ChevronDown,
  Layers,
  ArrowRight
} from 'lucide-react';

const VEHICLES: { type: GeneralVehicleType; label: string; icon: any; isEmergency?: boolean }[] = [
  { type: 'car', label: 'Car', icon: Car },
  { type: 'bike', label: 'Bike', icon: Bike },
  { type: 'bus', label: 'Bus', icon: Bus },
  { type: 'truck', label: 'Truck', icon: Truck },
  { type: 'taxi', label: 'Taxi', icon: Car },
  { type: 'delivery', label: 'Delivery', icon: Package },
  { type: 'ambulance', label: 'Ambulance', icon: Siren, isEmergency: true },
  { type: 'fire', label: 'Fire Truck', icon: Flame, isEmergency: true },
  { type: 'police', label: 'Police', icon: Shield, isEmergency: true }
];

const PREFERENCES: { key: RoutePreference; label: string; desc: string }[] = [
  { key: 'balanced', label: 'Balanced', desc: 'Optimal compromise across all metrics' },
  { key: 'fastest', label: 'Fastest', desc: 'Prioritizes lowest travel time' },
  { key: 'shortest', label: 'Shortest', desc: 'Minimizes total distance' },
  { key: 'safest', label: 'Safest', desc: 'Avoids accident-prone and high-risk roads' },
  { key: 'low_traffic', label: 'Low Traffic', desc: 'Heavily penalizes congested segments' },
  { key: 'eco', label: 'Eco-Friendly', desc: 'Low emissions and steady speed' },
  { key: 'emergency', label: 'Emergency Priority', desc: 'Maximum time savings and clearance' }
];

// Initial default aligned with Raipur (detected user region)
const INITIAL_CITY = CITY_PROFILES[0]; // Raipur

function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const isSmall = window.innerWidth < 1024;
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    return isSmall || isMobileDevice;
  });

  useEffect(() => {
    const check = () => {
      const isSmall = window.innerWidth < 1024;
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isSmall || (isMobileDevice && window.innerWidth < 1200));
    };

    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return isMobile;
}

export default function MapPlannerPage() {
  const navigate = useNavigate();

  // Responsive layout check: Mobile (Android & iOS) vs Laptop
  const isMobile = useIsMobile();

  // Mobile Lyft UI Drawer & Sheet States
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileTrafficEnabled, setMobileTrafficEnabled] = useState(true);

  // Mobile Draggable Bottom Sheet Gestures & Anchors
  const PEEK_HEIGHT = 92;
  const [sheetHeight, setSheetHeight] = useState<number>(PEEK_HEIGHT);
  const [isDraggingSheet, setIsDraggingSheet] = useState<boolean>(false);
  const dragStartYRef = useRef<number>(0);
  const dragStartHeightRef = useRef<number>(PEEK_HEIGHT);
  const dragStartTimeRef = useRef<number>(0);
  const dragDistanceRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);

  const getMidHeight = useCallback(() => {
    return Math.min(440, Math.max(360, Math.round(window.innerHeight * 0.52)));
  }, []);

  const getFullHeight = useCallback(() => {
    return Math.min(760, Math.max(540, Math.round(window.innerHeight * 0.84)));
  }, []);

  const handleDragStart = useCallback((clientY: number) => {
    isDraggingRef.current = true;
    setIsDraggingSheet(true);
    dragStartYRef.current = clientY;
    dragStartHeightRef.current = sheetHeight;
    dragStartTimeRef.current = Date.now();
    dragDistanceRef.current = 0;
  }, [sheetHeight]);

  const handleDragMove = useCallback((clientY: number) => {
    if (!isDraggingRef.current) return;
    const deltaY = dragStartYRef.current - clientY;
    dragDistanceRef.current = Math.max(dragDistanceRef.current, Math.abs(deltaY));
    const fullH = getFullHeight();
    const minH = PEEK_HEIGHT;
    const maxH = fullH + 25;
    const nextH = Math.max(minH, Math.min(maxH, dragStartHeightRef.current + deltaY));
    setSheetHeight(nextH);
  }, [getFullHeight]);

  const handleDragEnd = useCallback((clientY: number) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDraggingSheet(false);

    const deltaY = dragStartYRef.current - clientY;
    const deltaTime = Math.max(1, Date.now() - dragStartTimeRef.current);
    const velocity = deltaY / deltaTime; // px/ms

    const midH = getMidHeight();
    const fullH = getFullHeight();
    const snapPoints = [PEEK_HEIGHT, midH, fullH];

    let targetHeight = PEEK_HEIGHT;

    if (velocity > 0.35) {
      // Swiped UP fast
      if (dragStartHeightRef.current <= PEEK_HEIGHT + 40) {
        targetHeight = midH;
      } else {
        targetHeight = fullH;
      }
    } else if (velocity < -0.35) {
      // Swiped DOWN fast
      if (dragStartHeightRef.current >= fullH - 40) {
        targetHeight = midH;
      } else {
        targetHeight = PEEK_HEIGHT;
      }
    } else {
      // Snap to closest anchor
      targetHeight = snapPoints.reduce((prev, curr) =>
        Math.abs(curr - sheetHeight) < Math.abs(prev - sheetHeight) ? curr : prev
      );
    }

    setSheetHeight(targetHeight);
  }, [sheetHeight, getMidHeight, getFullHeight]);

  const toggleSheet = useCallback(() => {
    if (dragDistanceRef.current > 8) return;
    const midH = getMidHeight();
    if (sheetHeight <= PEEK_HEIGHT + 20) {
      setSheetHeight(midH);
    } else {
      setSheetHeight(PEEK_HEIGHT);
    }
  }, [sheetHeight, getMidHeight]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        handleDragMove(e.clientY);
      }
    };
    const onMouseUp = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        handleDragEnd(e.clientY);
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [handleDragMove, handleDragEnd]);

  const [origin, setOrigin] = useState<GeoPoint>(INITIAL_CITY.center);
  const [destination, setDestination] = useState<GeoPoint | null>(null);
  const [presets, setPresets] = useState<PresetDestination[]>(INITIAL_CITY.presets);
  const [selectedCityId, setSelectedCityId] = useState<string>(INITIAL_CITY.id);
  const [activeRegionNotice, setActiveRegionNotice] = useState<string>('Raipur, Chhattisgarh');

  const [vehicleType, setVehicleType] = useState<GeneralVehicleType>('car');
  const [preference, setPreference] = useState<RoutePreference>('balanced');
  const [loading, setLoading] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<QPSOOptimizationResult | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<RouteCandidateAlternative | null>(null);

  // Real-Time Emergency Vehicle Approaching Radar state (for regular users)
  const [activeAmbulance, setActiveAmbulance] = useState<ActiveAmbulanceAlertData | null>(null);
  const [isRadarActive, setIsRadarActive] = useState<boolean>(true);
  const [isSimulatedActive, setIsSimulatedActive] = useState<boolean>(false);
  const [isAutoSteppingAmbulance, setIsAutoSteppingAmbulance] = useState<boolean>(false);
  const [ambulanceStepLoading, setAmbulanceStepLoading] = useState<boolean>(false);
  const [giveWayAcknowledged, setGiveWayAcknowledged] = useState<boolean>(false);

  // Search autocomplete state for Origin
  const [originQuery, setOriginQuery] = useState(INITIAL_CITY.center.name || 'Jaistambh Chowk, Raipur');
  const [originSuggestions, setOriginSuggestions] = useState<LocationSearchResult[]>([]);
  const [isSearchingOrigin, setIsSearchingOrigin] = useState(false);
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);

  // Search autocomplete state for Destination
  const [destQuery, setDestQuery] = useState('');
  const [destSuggestions, setDestSuggestions] = useState<LocationSearchResult[]>([]);
  const [isSearchingDest, setIsSearchingDest] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);

  const originInputRef = useRef<HTMLInputElement>(null);
  const destInputRef = useRef<HTMLInputElement>(null);

  const isEmergency = ['ambulance', 'fire', 'police'].includes(vehicleType);

  // Auto-switch to emergency preference when emergency vehicle selected
  useEffect(() => {
    if (isEmergency && preference !== 'emergency') {
      setPreference('emergency');
    }
  }, [vehicleType, isEmergency]);

  // Keep search input strings synced when points change programmatically
  useEffect(() => {
    if (origin.name) setOriginQuery(origin.name);
  }, [origin.name]);

  useEffect(() => {
    if (destination?.name) setDestQuery(destination.name);
    else if (!destination) setDestQuery('');
  }, [destination?.name]);

  // Real-Time Radar Polling: Listen for active emergency vehicles approaching citizen/origin location
  useEffect(() => {
    if (!isRadarActive) {
      setActiveAmbulance(null);
      setIsSimulatedActive(false);
      setIsAutoSteppingAmbulance(false);
      return;
    }
    let isMounted = true;
    const pollAmbulanceAlert = async () => {
      try {
        const alert = await fetchActiveAmbulanceAlert(origin.lat, origin.lng, 1800, isSimulatedActive);
        if (isMounted) {
          setActiveAmbulance(alert);
        }
      } catch (e) {
        console.error('Failed to poll emergency vehicle alert on map:', e);
      }
    };

    pollAmbulanceAlert();
    const interval = setInterval(pollAmbulanceAlert, 2500);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [origin.lat, origin.lng, isRadarActive, isSimulatedActive]);

  // Auto-advance ambulance along corridor when continuous simulation mode is enabled
  useEffect(() => {
    if (!isAutoSteppingAmbulance || !isRadarActive) return;

    const autoTimer = setInterval(async () => {
      try {
        const vehId = activeAmbulance?.vehicle_id || (Math.abs(origin.lng - 81.63) < 1.5 ? 'ev-raipur-1' : 'ev-1');
        await stepEmergencyVehicle(vehId);
        const updated = await fetchActiveAmbulanceAlert(origin.lat, origin.lng, 1800, true);
        setActiveAmbulance(updated);
      } catch (e) {
        console.error('Auto step simulation error:', e);
      }
    }, 2200);

    return () => clearInterval(autoTimer);
  }, [isAutoSteppingAmbulance, isRadarActive, origin.lat, origin.lng, activeAmbulance?.vehicle_id]);

  // Step emergency vehicle manually along corridor
  const handleStepAmbulance = async () => {
    setAmbulanceStepLoading(true);
    try {
      const vehId = activeAmbulance?.vehicle_id || (Math.abs(origin.lng - 81.63) < 1.5 ? 'ev-raipur-1' : 'ev-1');
      await stepEmergencyVehicle(vehId);
      const updated = await fetchActiveAmbulanceAlert(origin.lat, origin.lng, 1800, true);
      setActiveAmbulance(updated);
    } catch (e) {
      console.error('Ambulance step error:', e);
    } finally {
      setAmbulanceStepLoading(false);
    }
  };

  // Immediate simulation seed / trigger
  const handleTriggerAmbulanceDemo = async () => {
    setIsRadarActive(true);
    setIsSimulatedActive(true);
    setGiveWayAcknowledged(false);
    try {
      const updated = await fetchActiveAmbulanceAlert(origin.lat, origin.lng, 1800, true);
      setActiveAmbulance(updated);
    } catch (e) {
      console.error('Simulation trigger error:', e);
    }
  };

  // Try auto-detecting user location on initial mount once
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const userLat = Number(pos.coords.latitude.toFixed(5));
          const userLng = Number(pos.coords.longitude.toFixed(5));
          await applyUserCoordinates(userLat, userLng);
        },
        () => {
          // Gracefully default to Raipur
        },
        { timeout: 6000 }
      );
    }
  }, []);

  // Recalculate route whenever origin, destination, vehicleType, or preference changes
  useEffect(() => {
    if (!destination) {
      setOptimizationResult(null);
      setSelectedCandidate(null);
      return;
    }
    const timer = setTimeout(() => {
      handleRunOptimization();
    }, 150);
    return () => clearTimeout(timer);
  }, [origin.lat, origin.lng, destination?.lat, destination?.lng, vehicleType, preference]);

  async function handleRunOptimization() {
    if (!destination) return;
    setLoading(true);
    try {
      const res = await optimizeRouteWithQPSO({
        origin,
        destination,
        vehicle_type: vehicleType,
        preference: preference,
        particle_count: 25,
        max_iterations: 35,
        beta: 0.75
      });
      setOptimizationResult(res);
      if (res.candidate_alternatives && res.candidate_alternatives.length > 0) {
        setSelectedCandidate(res.candidate_alternatives[0]);
      } else {
        setSelectedCandidate(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Applies user coordinates and reverse-geocodes origin (does NOT randomly assign a destination)
   */
  async function applyUserCoordinates(lat: number, lng: number) {
    setIsDetectingLocation(true);
    try {
      const resolvedPlaceName = await reverseGeocodeLocation(lat, lng);
      const newOrigin: GeoPoint = {
        lat,
        lng,
        name: resolvedPlaceName
      };
      setOrigin(newOrigin);
      setOriginQuery(resolvedPlaceName);

      // Dynamically configure local destination presets for the user's detected region
      const intelligentSetup = getIntelligentDestinationSetup(lat, lng, resolvedPlaceName);
      setPresets(intelligentSetup.presets);
      setActiveRegionNotice(intelligentSetup.detectedCityName);

      // Match city profile if any
      const matchedCity = findClosestCityProfile(lat, lng);
      if (matchedCity) {
        setSelectedCityId(matchedCity.id);
      } else {
        setSelectedCityId('custom');
      }

      // Reset any active simulation state on new location
      setIsSimulatedActive(false);
      setIsAutoSteppingAmbulance(false);
      setActiveAmbulance(null);
    } catch (e) {
      console.warn('Could not reverse geocode position:', e);
    } finally {
      setIsDetectingLocation(false);
    }
  }

  function handleUseMyLocation() {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const userLat = Number(pos.coords.latitude.toFixed(5));
        const userLng = Number(pos.coords.longitude.toFixed(5));
        await applyUserCoordinates(userLat, userLng);
      },
      (err) => {
        setIsDetectingLocation(false);
        alert(`Location access notice: ${err.message}. Showing default regional hubs.`);
      },
      { enableHighAccuracy: true, timeout: 9000 }
    );
  }

  /**
   * Switches active city: sets starting and ending point according to that city
   */
  function handleSelectCity(cityId: string) {
    const city = CITY_PROFILES.find((c) => c.id === cityId);
    if (!city) return;

    setSelectedCityId(city.id);
    setActiveRegionNotice(`${city.cityName}, ${city.stateName}`);
    setOrigin(city.center);
    setOriginQuery(city.center.name || city.cityName);
    setDestination(null);
    setDestQuery('');
    setOptimizationResult(null);
    setSelectedCandidate(null);
    setPresets(city.presets);
    setShowOriginDropdown(false);
    setShowDestDropdown(false);
    setIsSimulatedActive(false);
    setIsAutoSteppingAmbulance(false);
    setActiveAmbulance(null);
  }

  /**
   * Swaps Origin and Destination
   */
  function handleSwapPoints() {
    if (!destination) return;
    const prevOrigin = { ...origin };
    const prevDest = { ...destination };
    setOrigin(prevDest);
    setDestination(prevOrigin);
    setOriginQuery(prevDest.name || '');
    setDestQuery(prevOrigin.name || '');
  }

  /**
   * Handles user clicking anywhere on the map
   */
  async function handleMapClick(lat: number, lng: number) {
    const formattedLat = Number(lat.toFixed(5));
    const formattedLng = Number(lng.toFixed(5));
    const placeName = await reverseGeocodeLocation(formattedLat, formattedLng);

    setDestination({
      lat: formattedLat,
      lng: formattedLng,
      name: placeName
    });
    setDestQuery(placeName);
    setShowDestDropdown(false);
  }

  // Origin search input change with debouncing
  useEffect(() => {
    if (!originQuery || originQuery.length < 2) {
      setOriginSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingOrigin(true);
      const results = await searchPlacesAutocomplete(originQuery, origin.lat, origin.lng);
      setOriginSuggestions(results);
      setIsSearchingOrigin(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [originQuery]);

  // Destination search input change with debouncing
  useEffect(() => {
    if (!destQuery || destQuery.length < 2) {
      setDestSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingDest(true);
      const refLat = destination?.lat || origin.lat;
      const refLng = destination?.lng || origin.lng;
      const results = await searchPlacesAutocomplete(destQuery, refLat, refLng);
      setDestSuggestions(results);
      setIsSearchingDest(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [destQuery, destination, origin.lat, origin.lng]);

  function handleSelectOriginSuggestion(item: LocationSearchResult) {
    const newOrigin: GeoPoint = {
      lat: item.lat,
      lng: item.lng,
      name: item.name
    };
    setOrigin(newOrigin);
    setOriginQuery(item.name);
    setShowOriginDropdown(false);

    // Update nearby destination presets based on new origin, without forcing a destination
    const intelligentSetup = getIntelligentDestinationSetup(item.lat, item.lng, item.name);
    setPresets(intelligentSetup.presets);
    setActiveRegionNotice(intelligentSetup.detectedCityName);
  }

  function handleSelectDestSuggestion(item: LocationSearchResult) {
    setDestination({
      lat: item.lat,
      lng: item.lng,
      name: item.name
    });
    setDestQuery(item.name);
    setShowDestDropdown(false);
  }

  // Helper icon for category
  function getCategoryIcon(type: string) {
    switch (type) {
      case 'railway':
        return <Train className="w-4 h-4 text-amber-500" />;
      case 'hospital':
        return <Cross className="w-4 h-4 text-red-500" />;
      case 'airport':
        return <Plane className="w-4 h-4 text-sky-500" />;
      case 'tech':
        return <Building2 className="w-4 h-4 text-indigo-500" />;
      default:
        return <MapPin className="w-4 h-4 text-blue-500" />;
    }
  }

  // Active polylines to render on both Mobile and Desktop maps (only when destination is chosen)
  const activeRoutePolyline = destination ? (selectedCandidate?.coordinates || optimizationResult?.route_geometry) : undefined;
  const alternativePolylines = destination ? (optimizationResult?.candidate_alternatives
    ?.filter((c) => c.id !== selectedCandidate?.id)
    .map((c) => c.coordinates) || []) : [];

  const handleStartNavigation = () => {
    if (!destination) return;
    const activeEta = selectedCandidate?.travel_time_min || optimizationResult?.eta_minutes || 11;
    const activeDist = selectedCandidate?.distance_km || optimizationResult?.distance_km || 8.8;
    const candidateName = selectedCandidate?.name || optimizationResult?.primary_route?.name || 'QPSO Optimized Corridor';

    navigate('/navigate', {
      state: {
        origin,
        destination,
        vehicleType,
        polyline: activeRoutePolyline,
        alternatives: alternativePolylines,
        etaMinutes: activeEta,
        distanceKm: activeDist,
        corridorName: candidateName,
        optimizationResult,
        selectedCandidate,
        activeAmbulance
      }
    });
  };

  // =========================================================================
  // MOBILE VIEW: Lyft iOS Transit Route Map Experience for Android & iOS Users
  // (Full-screen map, floating search capsule, floating action buttons, transit bottom sheet)
  // =========================================================================
  if (isMobile) {
    return (
      <div className="h-[100dvh] w-full relative overflow-hidden bg-slate-900 select-none font-sans flex flex-col">
        {/* 1. Fullscreen Map Layer */}
        <div className="absolute inset-0 z-0">
          <LeafletMap
            origin={origin}
            destination={destination}
            primaryRoute={activeRoutePolyline}
            alternativeRoutes={alternativePolylines}
            vehicleLocation={origin}
            vehicleType={vehicleType}
            activeAmbulanceAlert={
              isRadarActive && activeAmbulance?.has_active_ambulance && activeAmbulance?.is_relevant_to_user
                ? activeAmbulance
                : null
            }
            showEmergencyRadius={isEmergency}
            alertRadiusMeters={600}
            trafficEnabled={mobileTrafficEnabled}
            onMapClick={handleMapClick}
            onSelectAlternative={(altIdx) => {
              const remaining = optimizationResult?.candidate_alternatives?.filter(
                (c) => c.id !== selectedCandidate?.id
              );
              if (remaining && remaining[altIdx]) {
                setSelectedCandidate(remaining[altIdx]);
              }
            }}
            className="w-full h-full"
          />
        </div>

        {/* 2. Top Floating Navigation & Search Bar (Lyft iOS Style) */}
        <div className="absolute top-3 left-3 right-3 z-20 flex items-center space-x-2 pt-[max(env(safe-area-inset-top),4px)]">
          {/* Hamburger Menu Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="w-11 h-11 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200/90 flex items-center justify-center text-slate-800 active:scale-95 transition-all shrink-0"
            title="Open City & Navigation Menu"
          >
            <Menu className="w-5 h-5 text-slate-700" />
          </button>

          {/* Capsule Route Pill / Search Bar */}
          <button
            type="button"
            onClick={() => setIsMobileSearchOpen(true)}
            className="flex-1 bg-white/95 backdrop-blur-md rounded-2xl px-3.5 py-2.5 shadow-lg border border-slate-200/90 flex items-center justify-between active:scale-[0.99] transition-all text-left"
          >
            <div className="flex items-center space-x-2 overflow-hidden mr-2">
              <div className="flex items-center space-x-1.5 truncate text-xs font-bold text-slate-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="truncate max-w-[100px] sm:max-w-[140px]">
                  {origin.name ? origin.name.split(',')[0] : 'Origin'}
                </span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <div className="flex items-center space-x-1.5 truncate text-xs font-bold text-slate-800">
                <span className={`w-2 h-2 rounded-full shrink-0 ${destination ? 'bg-rose-500' : 'bg-slate-400'}`} />
                <span className={`truncate max-w-[100px] sm:max-w-[140px] ${destination ? 'text-slate-800 font-bold' : 'text-slate-500 font-medium'}`}>
                  {destination ? (destination.name ? destination.name.split(',')[0] : 'Destination') : 'Where to?'}
                </span>
              </div>
            </div>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
              <Search className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>

        {/* 3. Ambient Give-Way Banner (if emergency ambulance is approaching) */}
        {isRadarActive && activeAmbulance && activeAmbulance.has_active_ambulance && activeAmbulance.is_relevant_to_user && !giveWayAcknowledged && (
          <div className="absolute top-18 left-3 right-3 z-20 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white p-3 rounded-2xl shadow-xl border border-red-400 animate-pulse flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2.5 truncate">
              <Siren className="w-4 h-4 text-yellow-300 shrink-0" />
              <div className="truncate">
                <div className="font-extrabold text-[11px] uppercase tracking-wide">
                  🚨 {activeAmbulance.vehicle_code || 'AMB-108'} Approaching ({activeAmbulance.distance_meters}m)
                </div>
                <div className="text-[10px] text-red-100 truncate">
                  ETA: {activeAmbulance.eta_seconds}s • Yield to left shoulder
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setGiveWayAcknowledged(true)}
              className="bg-white text-red-700 text-[10px] font-black px-2.5 py-1 rounded-lg shrink-0 ml-2 shadow-xs"
            >
              Yielded
            </button>
          </div>
        )}

        {/* 4. Floating Map Controls (Bottom Right, dynamic height tracking above bottom sheet) */}
        <div
          className="absolute right-3 z-20 flex flex-col space-y-2.5"
          style={{
            bottom: `${sheetHeight + 14}px`,
            transition: isDraggingSheet
              ? 'none'
              : 'bottom 0.32s cubic-bezier(0.18, 0.89, 0.32, 1.1)',
          }}
        >
          {/* Traffic Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileTrafficEnabled(!mobileTrafficEnabled)}
            className={`w-11 h-11 rounded-2xl shadow-lg border flex items-center justify-center transition-all active:scale-95 ${
              mobileTrafficEnabled
                ? 'bg-blue-600 text-white border-blue-500 shadow-blue-500/25'
                : 'bg-white/95 backdrop-blur-md text-slate-700 border-slate-200/90'
            }`}
            title={mobileTrafficEnabled ? 'Hide Live Traffic Layer' : 'Show Live Traffic Layer'}
          >
            <Activity className="w-5 h-5" />
          </button>

          {/* Recenter / GPS Button */}
          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={isDetectingLocation}
            className="w-11 h-11 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200/90 flex items-center justify-center text-slate-700 active:scale-95 transition-all disabled:opacity-50"
            title="Locate GPS position"
          >
            {isDetectingLocation ? (
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            ) : (
              <LocateFixed className="w-5 h-5 text-blue-600" />
            )}
          </button>
        </div>

        {/* 5. Bottom Floating Route Pill & Draggable Sheet (Lyft Transit Map style) */}
        <div
          className="absolute left-0 right-0 bottom-0 z-30 bg-white/98 backdrop-blur-xl rounded-t-3xl shadow-2xl border-t border-slate-200/90 flex flex-col overflow-hidden will-change-[height]"
          style={{
            height: `${sheetHeight}px`,
            transition: isDraggingSheet
              ? 'none'
              : 'height 0.32s cubic-bezier(0.18, 0.89, 0.32, 1.1)',
          }}
        >
          {/* Drag Handle Bar */}
          <div
            className="w-full pt-3 pb-1.5 cursor-grab active:cursor-grabbing flex flex-col items-center justify-center shrink-0 select-none touch-none"
            onTouchStart={(e) => {
              if (e.touches[0]) handleDragStart(e.touches[0].clientY);
            }}
            onTouchMove={(e) => {
              if (e.touches[0]) handleDragMove(e.touches[0].clientY);
            }}
            onTouchEnd={(e) => {
              if (e.changedTouches[0]) handleDragEnd(e.changedTouches[0].clientY);
            }}
            onMouseDown={(e) => handleDragStart(e.clientY)}
            onClick={toggleSheet}
          >
            <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
          </div>

          {/* Collapsed Pill Row (Lyft transit sequence) */}
          <div
            className="px-4 pb-2.5 cursor-pointer shrink-0 select-none touch-none"
            onTouchStart={(e) => {
              if (e.touches[0]) handleDragStart(e.touches[0].clientY);
            }}
            onTouchMove={(e) => {
              if (e.touches[0]) handleDragMove(e.touches[0].clientY);
            }}
            onTouchEnd={(e) => {
              if (e.changedTouches[0]) handleDragEnd(e.changedTouches[0].clientY);
            }}
            onMouseDown={(e) => handleDragStart(e.clientY)}
            onClick={toggleSheet}
          >
            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-2xs">
              {destination ? (
                <div className="flex items-center space-x-1.5 text-xs overflow-x-auto scrollbar-none py-0.5">
                  {/* Vehicle Pill */}
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-white border border-slate-200 shadow-2xs font-bold text-slate-800 shrink-0">
                    {(() => {
                      const veh = VEHICLES.find((v) => v.type === vehicleType);
                      const Icon = veh ? veh.icon : Car;
                      return <Icon className="w-3.5 h-3.5 text-blue-600" />;
                    })()}
                    <span className="capitalize">{vehicleType}</span>
                  </span>

                  <span className="text-slate-400 font-bold text-xs shrink-0">›</span>

                  {/* Corridor Badge */}
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-blue-100/90 border border-blue-200 font-bold text-blue-900 shrink-0">
                    <RouteIcon className="w-3 h-3 text-blue-600" />
                    <span className="truncate max-w-[120px]">
                      {selectedCandidate?.name?.split('(')[0] || 'Corridor A'}
                    </span>
                  </span>

                  <span className="text-slate-400 font-bold text-xs shrink-0">›</span>

                  {/* ETA & Distance */}
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-emerald-100/90 border border-emerald-200 font-black text-emerald-900 shrink-0">
                    <span>⏱️ {selectedCandidate?.travel_time_min || optimizationResult?.eta_minutes || 11}m</span>
                    <span className="text-emerald-700 font-semibold">• {selectedCandidate?.distance_km || optimizationResult?.distance_km || 8.8}km</span>
                  </span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-xs py-0.5" onClick={(e) => { e.stopPropagation(); setIsMobileSearchOpen(true); }}>
                  <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Search className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">Where are you going?</span>
                    <span className="text-slate-400 block text-[11px]">Tap to search destination or pick preset</span>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-1 ml-2 text-slate-500 shrink-0">
                <span className="text-[11px] font-bold text-blue-600 hidden sm:inline">
                  {destination ? 'Details' : 'Explore'}
                </span>
                <ChevronUp
                  className={`w-4 h-4 text-slate-600 transition-transform duration-300 ${
                    sheetHeight > PEEK_HEIGHT + 20 ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Expanded Bottom Sheet Content */}
          <div
            className={`flex-1 overflow-y-auto px-4 pb-6 space-y-4 transition-opacity duration-200 ${
              sheetHeight > PEEK_HEIGHT + 15 ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            {!destination ? (
              <div className="space-y-4 pt-1">
                {/* Search Bar CTA */}
                <button
                  type="button"
                  onClick={() => setIsMobileSearchOpen(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 px-4 rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2 text-sm transition-all"
                >
                  <Search className="w-4 h-4" />
                  <span>Choose Destination to Calculate Route</span>
                </button>

                {/* Local Presets for 1-tap route selection */}
                <div>
                  <div className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2 flex items-center justify-between">
                    <span>1-Tap Regional Destinations</span>
                    <span className="text-[10px] text-blue-600 font-semibold">{activeRegionNotice}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {presets.slice(0, 4).map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setDestination(p.point);
                          setDestQuery(p.point.name || p.label);
                        }}
                        className="flex items-center space-x-2.5 p-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-left text-xs transition-all active:scale-98"
                      >
                        <span className="p-2 rounded-xl bg-white shadow-2xs">
                          {getCategoryIcon(p.category)}
                        </span>
                        <div className="truncate">
                          <div className="font-bold text-slate-800 truncate">{p.label}</div>
                          <div className="text-[10px] text-slate-500 truncate capitalize">{p.category}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Vehicle Mode Selector */}
                <div>
                  <div className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
                    Vehicle Mode
                  </div>
                  <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none">
                    {VEHICLES.map((v) => {
                      const Icon = v.icon;
                      const isSelected = vehicleType === v.type;
                      return (
                        <button
                          key={v.type}
                          type="button"
                          onClick={() => setVehicleType(v.type)}
                          className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                            isSelected
                              ? v.isEmergency
                                ? 'bg-red-600 text-white border-red-600 shadow-sm'
                                : 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{v.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Route Summary Metrics */}
                <div
                  className="flex items-center justify-between pt-1 cursor-grab active:cursor-grabbing select-none"
                  onTouchStart={(e) => {
                    if (e.touches[0]) handleDragStart(e.touches[0].clientY);
                  }}
                  onTouchMove={(e) => {
                    if (e.touches[0]) handleDragMove(e.touches[0].clientY);
                  }}
                  onTouchEnd={(e) => {
                    if (e.changedTouches[0]) handleDragEnd(e.changedTouches[0].clientY);
                  }}
                  onMouseDown={(e) => handleDragStart(e.clientY)}
                >
                  <div>
                    <div className="text-2xl font-black text-slate-900">
                      {selectedCandidate?.travel_time_min || optimizationResult?.eta_minutes || 11} min
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      {selectedCandidate?.distance_km || optimizationResult?.distance_km || 8.8} km • QPSO Optimized
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                      🟢 Free Flow
                    </span>
                  </div>
                </div>

                {/* Start Live Navigation Primary Action Button */}
                <button
                  type="button"
                  onClick={handleStartNavigation}
                  className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-extrabold py-3.5 px-4 rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2 transition-all text-sm"
                >
                  <Navigation className="w-4 h-4 text-white" />
                  <span>Start Navigation ({selectedCandidate?.travel_time_min || optimizationResult?.eta_minutes || 11} min)</span>
                  <ArrowRight className="w-4 h-4 text-blue-200" />
                </button>

                {/* Candidate Corridors Horizontal Carousel */}
                <div>
                  <div className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2 flex items-center justify-between">
                    <span>Corridor Options ({optimizationResult?.candidate_alternatives?.length || 1})</span>
                    <span className="text-[10px] text-blue-600 font-semibold">QPSO Quantum Ranked</span>
                  </div>
                  <div className="flex space-x-2.5 overflow-x-auto pb-1 scrollbar-none">
                    {optimizationResult?.candidate_alternatives?.map((cand) => {
                      const isCandSelected = selectedCandidate?.id === cand.id;
                      return (
                        <div
                          key={cand.id}
                          onClick={() => setSelectedCandidate(cand)}
                          className={`min-w-[170px] p-3 rounded-2xl border text-left cursor-pointer transition-all active:scale-95 ${
                            isCandSelected
                              ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-400/40 shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="text-xs font-bold text-slate-800 truncate">{cand.name}</div>
                          <div className="flex items-center justify-between mt-1 text-xs">
                            <span className="font-extrabold text-blue-600">{cand.travel_time_min} min</span>
                            <span className="text-slate-500 text-[11px]">{cand.distance_km} km</span>
                          </div>
                          <div className="mt-1 text-[10px] font-semibold text-slate-400">
                            Fitness: {cand.composite_fitness}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Vehicle Type Horizontal Selector */}
                <div>
                  <div className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
                    Vehicle Mode
                  </div>
                  <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none">
                    {VEHICLES.map((v) => {
                      const Icon = v.icon;
                      const isSelected = vehicleType === v.type;
                      return (
                        <button
                          key={v.type}
                          type="button"
                          onClick={() => setVehicleType(v.type)}
                          className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                            isSelected
                              ? v.isEmergency
                                ? 'bg-red-600 text-white border-red-600 shadow-sm'
                                : 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{v.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Route Preference Horizontal Selector */}
                <div>
                  <div className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
                    Routing Preference
                  </div>
                  <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none">
                    {PREFERENCES.map((p) => {
                      const isSelected = preference === p.key;
                      return (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => setPreference(p.key)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                            isSelected
                              ? 'bg-slate-900 text-white border-slate-900 shadow-sm font-bold'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Turn Directions Summary */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700">Key Waypoints</span>
                    <button
                      type="button"
                      onClick={() => {
                        setDestination(null);
                        setDestQuery('');
                        setOptimizationResult(null);
                        setSelectedCandidate(null);
                      }}
                      className="text-[11px] font-bold text-red-600 hover:text-red-700"
                    >
                      Clear Destination
                    </button>
                  </div>
                  <div className="space-y-2 text-xs text-slate-600">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                      <span>Depart: <strong>{origin.name || 'Start Point'}</strong></span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                      <span>Via: <strong>{selectedCandidate?.name || 'Optimal Road Corridor'}</strong></span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                      <span>Arrive: <strong>{destination?.name || 'Destination Point'}</strong></span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 6. Mobile Route Search Modal / Sheet */}
        {isMobileSearchOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end p-0">
            <div className="bg-white rounded-t-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2">
                  <Compass className="w-5 h-5 text-blue-600" />
                  <span>Plan Route</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsMobileSearchOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto space-y-4">
                {/* Inputs with Swap Button */}
                <div className="space-y-3 relative">
                  {/* Origin */}
                  <div className="relative">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Origin (Start)
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                      <input
                        type="text"
                        value={originQuery}
                        onChange={(e) => {
                          setOriginQuery(e.target.value);
                          setShowOriginDropdown(true);
                        }}
                        onFocus={() => setShowOriginDropdown(true)}
                        placeholder="Search origin address or landmark..."
                        className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={handleUseMyLocation}
                        className="absolute right-2.5 text-blue-600 hover:text-blue-800"
                        title="Use Current Location"
                      >
                        <LocateFixed className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Origin Autocomplete dropdown */}
                    {showOriginDropdown && originSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-30 max-h-48 overflow-y-auto">
                        {originSuggestions.map((item, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              handleSelectOriginSuggestion(item);
                              setShowOriginDropdown(false);
                            }}
                            className="p-2.5 text-xs hover:bg-blue-50 border-b border-slate-100 last:border-0 cursor-pointer flex items-center space-x-2"
                          >
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate text-slate-700 font-medium">{item.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Swap Button */}
                  <div className="flex justify-center -my-1">
                    <button
                      type="button"
                      onClick={handleSwapPoints}
                      className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 shadow-xs"
                      title="Swap Origin and Destination"
                    >
                      <ArrowUpDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Destination */}
                  <div className="relative">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Destination (End)
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 w-3 h-3 rounded-full bg-rose-500 ring-4 ring-rose-100" />
                      <input
                        type="text"
                        value={destQuery}
                        onChange={(e) => {
                          setDestQuery(e.target.value);
                          setShowDestDropdown(true);
                        }}
                        onFocus={() => setShowDestDropdown(true)}
                        placeholder="Search destination..."
                        className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Destination Autocomplete dropdown */}
                    {showDestDropdown && destSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-30 max-h-48 overflow-y-auto">
                        {destSuggestions.map((item, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              handleSelectDestSuggestion(item);
                              setShowDestDropdown(false);
                            }}
                            className="p-2.5 text-xs hover:bg-rose-50 border-b border-slate-100 last:border-0 cursor-pointer flex items-center space-x-2"
                          >
                            <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span className="truncate text-slate-700 font-medium">{item.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Presets Chips */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Quick Destination Presets ({activeRegionNotice})
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {presets.slice(0, 4).map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setDestination(p.point);
                          setDestQuery(p.point.name || p.label);
                          setIsMobileSearchOpen(false);
                        }}
                        className="flex items-center space-x-2 p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-left text-xs transition-all"
                      >
                        <span className="p-1.5 rounded-lg bg-white shadow-2xs">
                          {getCategoryIcon(p.category)}
                        </span>
                        <div className="truncate">
                          <div className="font-bold text-slate-800 truncate">{p.label}</div>
                          <div className="text-[10px] text-slate-400 truncate">{p.category}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Apply Button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileSearchOpen(false);
                    handleRunOptimization();
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md"
                >
                  <Search className="w-4 h-4 text-white" />
                  <span>Apply & Find Best Route</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 7. Mobile Slide-in Menu Drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex">
            <div className="w-[82%] max-w-[320px] bg-white h-full shadow-2xl flex flex-col p-5">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-md">
                    M
                  </div>
                  <div>
                    <span className="font-black text-slate-900 tracking-tight text-base">MargSetu</span>
                    <span className="text-[10px] font-bold text-blue-600 block -mt-1">Urban AI Corridor</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 space-y-5">
                {/* City Hub Switcher */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Switch Regional Hub
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {CITY_PROFILES.map((city) => (
                      <button
                        key={city.id}
                        type="button"
                        onClick={() => {
                          handleSelectCity(city.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`text-xs px-2.5 py-2 rounded-xl font-bold transition-all text-left truncate ${
                          selectedCityId === city.id
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {city.cityName}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Navigation Links */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Navigation & Modules
                  </label>
                  <div className="space-y-1">
                    {[
                      { path: '/navigate', label: 'Navigation HUD', icon: Navigation },
                      { path: '/traffic', label: 'Traffic Analytics', icon: Activity },
                      { path: '/emergency', label: 'Emergency Command', icon: Siren },
                      { path: '/vehicles', label: 'Vehicle Fleet', icon: Car },
                      { path: '/optimization', label: 'QPSO Visualizer', icon: Zap },
                      { path: '/benchmark', label: 'Benchmark Suite', icon: TrendingDown },
                      { path: '/settings', label: 'Settings', icon: Compass }
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.path}
                          type="button"
                          onClick={() => {
                            navigate(item.path);
                            setIsMobileMenuOpen(false);
                          }}
                          className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all text-left"
                        >
                          <Icon className="w-4 h-4 text-slate-500" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            {/* Backdrop Dismiss */}
            <div className="flex-1" onClick={() => setIsMobileMenuOpen(false)} />
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // LAPTOP / DESKTOP VIEW: Existing Two-Column Layout (100% Intact & Untouched)
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <NavigationNavbar />
      <HighwayCorridorBanner />

      {/* Emergency Mode Notification Banner */}
      {isEmergency && (
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white px-4 py-2 text-xs sm:text-sm font-bold flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-full bg-white/20 animate-pulse">
              <Siren className="w-4 h-4 text-white" />
            </span>
            <span>🚨 EMERGENCY MODE ACTIVE: Quantum Green-Corridor Prioritization Engaged</span>
          </div>
          <span className="hidden sm:inline-block bg-white/20 px-2.5 py-0.5 rounded text-[11px] uppercase tracking-wider">
            High Priority Dispatch
          </span>
        </div>
      )}

      {/* City Switcher Banner */}
      <div className="bg-white border-b border-slate-200/80 px-4 py-2 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-500">Active Region:</span>
            <span className="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {activeRegionNotice}
            </span>
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto py-1 scrollbar-thin">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mr-1">
              Switch City Hub:
            </span>
            {CITY_PROFILES.map((city) => (
              <button
                key={city.id}
                onClick={() => handleSelectCity(city.id)}
                className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  selectedCityId === city.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/60'
                }`}
              >
                {city.cityName}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Route Controls & Candidates */}
        <section className="lg:col-span-5 space-y-5">
          {/* Card: Origin & Destination Inputs */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 relative">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-800 flex items-center space-x-2">
                <Compass className="w-5 h-5 text-blue-600" />
                <span>Intelligent Route Planner</span>
              </h2>
              <button
                onClick={handleUseMyLocation}
                disabled={isDetectingLocation}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
                title="Detect GPS coordinates and automatically match local destination"
              >
                {isDetectingLocation ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    <span>Detecting...</span>
                  </>
                ) : (
                  <>
                    <LocateFixed className="w-3.5 h-3.5 text-blue-600" />
                    <span>Use My Location</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-3 relative">
              {/* Origin Field */}
              <div className="relative">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block ring-2 ring-emerald-200" />
                    <span>Origin (Starting Point)</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-mono">
                    {origin.lat.toFixed(4)}°, {origin.lng.toFixed(4)}°
                  </span>
                </label>
                <div className="relative">
                  <input
                    ref={originInputRef}
                    type="text"
                    value={originQuery}
                    onChange={(e) => {
                      setOriginQuery(e.target.value);
                      setShowOriginDropdown(true);
                    }}
                    onFocus={() => setShowOriginDropdown(true)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-inner"
                    placeholder="Search start locality, junction, or street..."
                  />
                  <div className="absolute right-3 top-3 flex items-center space-x-1">
                    {isSearchingOrigin ? (
                      <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Origin Autocomplete Dropdown */}
                {showOriginDropdown && originSuggestions.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden divide-y divide-slate-100 max-h-56 overflow-y-auto">
                    {originSuggestions.map((item) => (
                      <div
                        key={item.placeId}
                        onClick={() => handleSelectOriginSuggestion(item)}
                        className="p-2.5 hover:bg-blue-50/80 cursor-pointer flex items-center space-x-2.5 transition-colors"
                      >
                        <div className="p-1.5 bg-slate-100 rounded-lg text-slate-600">
                          {getCategoryIcon(item.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
                          <p className="text-[10px] text-slate-500 truncate">{item.displayName}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Swap Origin & Destination Button */}
              <div className="flex items-center justify-center -my-1 relative z-10">
                <button
                  type="button"
                  onClick={handleSwapPoints}
                  className="bg-white hover:bg-slate-100 text-slate-600 hover:text-blue-600 p-1.5 rounded-full border border-slate-300 shadow-sm transition-transform hover:scale-110 flex items-center space-x-1 text-[11px] font-semibold px-2.5"
                  title="Swap Origin and Destination"
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-blue-600" />
                  <span>Swap Points</span>
                </button>
              </div>

              {/* Destination Field */}
              <div className="relative">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block ring-2 ring-rose-200" />
                    <span>Destination (Ending Point)</span>
                  </div>
                  {destination ? (
                    <span className="text-[10px] text-rose-600 font-mono">
                      {destination.lat.toFixed(4)}°, {destination.lng.toFixed(4)}°
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium">
                      Not set
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    ref={destInputRef}
                    type="text"
                    value={destQuery}
                    onChange={(e) => {
                      setDestQuery(e.target.value);
                      setShowDestDropdown(true);
                    }}
                    onFocus={() => setShowDestDropdown(true)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-inner"
                    placeholder="Enter destination, landmark or click on map..."
                  />
                  <div className="absolute right-3 top-3 flex items-center space-x-1">
                    {isSearchingDest ? (
                      <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Destination Autocomplete Dropdown */}
                {showDestDropdown && destSuggestions.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden divide-y divide-slate-100 max-h-56 overflow-y-auto">
                    {destSuggestions.map((item) => (
                      <div
                        key={item.placeId}
                        onClick={() => handleSelectDestSuggestion(item)}
                        className="p-2.5 hover:bg-rose-50/80 cursor-pointer flex items-center space-x-2.5 transition-colors"
                      >
                        <div className="p-1.5 bg-slate-100 rounded-lg text-slate-600">
                          {getCategoryIcon(item.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
                          <p className="text-[10px] text-slate-500 truncate">{item.displayName}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Preset Destinations Chips (Matched with current region) */}
              <div className="pt-1">
                <p className="text-[11px] font-bold text-slate-500 mb-1.5 flex items-center justify-between">
                  <span>Local Destination Presets ({activeRegionNotice}):</span>
                  <span className="text-[10px] text-blue-600 font-normal">Click to set</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {presets.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => {
                        const newDest: GeoPoint = {
                          lat: preset.lat,
                          lng: preset.lng,
                          name: preset.name
                        };
                        setDestination(newDest);
                        setDestQuery(preset.name);
                        setShowDestDropdown(false);
                      }}
                      className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all flex items-center space-x-1.5 ${
                        destination?.name === preset.name
                          ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-sm scale-[1.02]'
                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      <span>{preset.icon || '📍'}</span>
                      <span>{preset.shortLabel || preset.name.split(',')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Card: Emergency Vehicles Approaching (Live Citizen Radar) */}
          <div className={`rounded-2xl p-5 shadow-sm border transition-all duration-300 ${
            activeAmbulance && activeAmbulance.has_active_ambulance && isRadarActive
              ? activeAmbulance.is_relevant_to_user
                ? 'bg-gradient-to-br from-red-50/90 via-white to-rose-50/40 border-red-300 shadow-red-500/10'
                : 'bg-gradient-to-br from-amber-50/80 via-white to-orange-50/30 border-amber-300 shadow-amber-500/10'
              : 'bg-white border-slate-200/80'
          }`}>
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center space-x-2.5">
                <div className={`p-2 rounded-xl transition-all ${
                  activeAmbulance && activeAmbulance.has_active_ambulance && isRadarActive
                    ? 'bg-red-600 text-white shadow-md shadow-red-500/30 animate-pulse'
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  <Siren className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Emergency Vehicles Approaching
                    </h3>
                    <span className="flex h-2 w-2 relative">
                      {isRadarActive && (
                        <>
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                            activeAmbulance?.has_active_ambulance ? 'bg-red-400' : 'bg-emerald-400'
                          }`} />
                          <span className={`relative inline-flex rounded-full h-2 w-2 ${
                            activeAmbulance?.has_active_ambulance ? 'bg-red-500' : 'bg-emerald-500'
                          }`} />
                        </>
                      )}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">Live Citizen Radar & Corridor Give-Way Alert</p>
                </div>
              </div>

              {/* Radar Status Badge & Toggle */}
              <div className="flex items-center space-x-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                  !isRadarActive
                    ? 'bg-slate-100 text-slate-500 border-slate-200'
                    : activeAmbulance?.has_active_ambulance && activeAmbulance.is_relevant_to_user
                    ? 'bg-red-100 text-red-700 border-red-300 animate-pulse'
                    : activeAmbulance?.has_active_ambulance
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}>
                  {!isRadarActive
                    ? 'RADAR OFF'
                    : activeAmbulance?.has_active_ambulance && activeAmbulance.is_relevant_to_user
                    ? '🚨 NEARBY (<1.8km)'
                    : activeAmbulance?.has_active_ambulance
                    ? '⚠️ ON CORRIDOR'
                    : '🛡️ ALL CLEAR'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsRadarActive(!isRadarActive)}
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg border transition-all ${
                    isRadarActive
                      ? 'bg-slate-900 text-white border-slate-800 hover:bg-slate-800'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                  }`}
                  title={isRadarActive ? 'Disable Radar Scanning' : 'Enable Radar Scanning'}
                >
                  {isRadarActive ? 'Enabled' : 'Paused'}
                </button>
              </div>
            </div>

            {/* Content: Active Ambulance Approaching */}
            {isRadarActive && activeAmbulance && activeAmbulance.has_active_ambulance ? (
              <div className="space-y-3">
                {/* Vehicle Identity & Real-time Tag */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-red-200 shadow-sm">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center font-black text-sm shadow">
                      🚑
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-black text-red-700 tracking-tight">
                          {activeAmbulance.vehicle_code || 'AMB-108'}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-red-100 text-red-800 uppercase">
                          Priority 1 Mission
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {activeAmbulance.ambulance_location?.name || 'En route via Priority Clearway'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-black text-slate-800">
                      {activeAmbulance.distance_meters} m
                    </div>
                    <div className="text-[10px] font-bold text-red-600">
                      ETA: ~{activeAmbulance.eta_seconds}s
                    </div>
                  </div>
                </div>

                {/* 4-Item Live Telemetry Grid */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-white/90 border border-slate-200 rounded-xl p-2 text-center shadow-2xs">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Distance</div>
                    <div className={`text-xs font-black mt-0.5 ${
                      activeAmbulance.distance_meters < 500 ? 'text-red-600' : 'text-slate-800'
                    }`}>
                      {activeAmbulance.distance_meters} m
                    </div>
                    <div className="text-[9px] text-slate-400 font-medium truncate">To route</div>
                  </div>

                  <div className="bg-white/90 border border-slate-200 rounded-xl p-2 text-center shadow-2xs">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Est. Arrival</div>
                    <div className="text-xs font-black text-emerald-600 mt-0.5">
                      {activeAmbulance.eta_seconds} sec
                    </div>
                    <div className="text-[9px] text-slate-400 font-medium truncate">Intercept ETA</div>
                  </div>

                  <div className="bg-white/90 border border-slate-200 rounded-xl p-2 text-center shadow-2xs">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Bearing</div>
                    <div className="flex items-center justify-center space-x-1 mt-0.5 text-xs font-black text-amber-600">
                      <span
                        className="inline-block transition-transform duration-300 font-black text-amber-500"
                        style={{ transform: `rotate(${activeAmbulance.heading_degrees || 0}deg)` }}
                      >
                        ↑
                      </span>
                      <span className="truncate">{activeAmbulance.heading_degrees}°</span>
                    </div>
                    <div className="text-[9px] text-slate-400 font-medium truncate">
                      {activeAmbulance.heading_direction || 'North'}
                    </div>
                  </div>

                  <div className="bg-white/90 border border-slate-200 rounded-xl p-2 text-center shadow-2xs">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Live Speed</div>
                    <div className="text-xs font-black text-blue-600 mt-0.5">
                      {activeAmbulance.speed_kmh}
                    </div>
                    <div className="text-[9px] text-slate-400 font-medium truncate">km/h</div>
                  </div>
                </div>

                {/* Commuter Give-Way Action Alert Box */}
                <div className="p-3 rounded-xl bg-red-600 text-white shadow-sm flex items-start space-x-2.5">
                  <AlertTriangle className="w-4 h-4 text-yellow-300 shrink-0 mt-0.5 animate-bounce" />
                  <div className="text-xs">
                    <div className="font-bold text-yellow-200 uppercase tracking-wide text-[11px]">
                      Citizen Give-Way Advisory
                    </div>
                    <p className="mt-0.5 leading-snug font-medium text-white/95">
                      {activeAmbulance.give_way_action ||
                        'Move left safely and yield the right-of-way. Maintain clearway until ambulance passes.'}
                    </p>
                  </div>
                </div>

                {/* Interactive Simulation Controls */}
                <div className="pt-1 flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={handleStepAmbulance}
                      disabled={ambulanceStepLoading}
                      className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center space-x-1 transition-all shadow-xs"
                      title="Advance emergency vehicle by one coordinate step"
                    >
                      {ambulanceStepLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <FastForward className="w-3.5 h-3.5 text-yellow-400" />
                      )}
                      <span>Step ⏩</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsAutoSteppingAmbulance(!isAutoSteppingAmbulance)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 transition-all border ${
                        isAutoSteppingAmbulance
                          ? 'bg-amber-500 text-slate-950 border-amber-600 font-black shadow-xs animate-pulse'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                      }`}
                      title={isAutoSteppingAmbulance ? 'Pause continuous movement' : 'Start auto-moving vehicle'}
                    >
                      {isAutoSteppingAmbulance ? (
                        <>
                          <Pause className="w-3.5 h-3.5" />
                          <span>Moving (Auto)</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 text-blue-600" />
                          <span>Auto Play</span>
                        </>
                      )}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate('/emergency')}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center space-x-1"
                  >
                    <span>Dispatcher View ↗</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Content: Standby / Clear State */
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
                  <div className="p-2 rounded-lg bg-emerald-600 text-white shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950">All Corridors Clear</h4>
                    <p className="text-[11px] text-emerald-800/90 leading-tight mt-0.5">
                      No emergency vehicles within 1,800m of your route. MargSetu Citizen Radar is continuously listening for siren dispatches.
                    </p>
                  </div>
                </div>

                {/* Simulation Trigger Button */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400 font-medium">Test & Demo</span>
                  <button
                    type="button"
                    onClick={handleTriggerAmbulanceDemo}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-2xs hover:shadow-xs active:scale-98"
                  >
                    <Siren className="w-3.5 h-3.5 text-red-600 animate-pulse" />
                    <span>Simulate Approaching Ambulance</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Card: Vehicle Profile Selector */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
              <span>Vehicle Profile</span>
              <span className="text-[11px] text-blue-600 font-medium">9 Profiles</span>
            </h3>

            <div className="grid grid-cols-3 gap-2">
              {VEHICLES.map((v) => {
                const Icon = v.icon;
                const isSelected = vehicleType === v.type;
                return (
                  <button
                    key={v.type}
                    onClick={() => setVehicleType(v.type)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                      isSelected
                        ? v.isEmergency
                          ? 'bg-red-500 text-white border-red-600 shadow-md shadow-red-500/20 scale-[1.02]'
                          : 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 scale-[1.02]'
                        : v.isEmergency
                        ? 'bg-red-50/50 text-red-700 border-red-200 hover:bg-red-50'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-1" />
                    <span className="text-xs font-semibold">{v.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card: Optimization Preference Selector */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Route Optimization Criteria
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {PREFERENCES.map((pref) => {
                const isSelected = preference === pref.key;
                return (
                  <button
                    key={pref.key}
                    onClick={() => setPreference(pref.key)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-xs font-bold">{pref.label}</div>
                    <div className={`text-[10px] mt-0.5 line-clamp-1 ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                      {pref.desc}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Run Optimization Button */}
            <button
              onClick={handleRunOptimization}
              disabled={loading}
              className="mt-4 w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              <span>{loading ? 'Optimizing Real Road Network...' : 'Recalculate QPSO Route'}</span>
            </button>
          </div>

          {/* Route Alternatives List */}
          {optimizationResult && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
                Candidate Corridors Evaluated
              </h3>

              {/* Active / Best QPSO Route Card */}
              {(() => {
                const activeCand = selectedCandidate || (optimizationResult.candidate_alternatives && optimizationResult.candidate_alternatives[0]);
                const isOptimalPrimary = !selectedCandidate || selectedCandidate.id === optimizationResult.candidate_alternatives?.[0]?.id;
                const activeName = activeCand?.name || optimizationResult.route_name;
                const activeEta = activeCand?.travel_time_min ?? optimizationResult.eta_minutes;
                const activeDist = activeCand?.distance_km ?? optimizationResult.distance_km;
                const activeFit = activeCand?.composite_fitness ?? optimizationResult.fitness;
                const activeTraff = activeCand?.traffic_score ?? optimizationResult.traffic_score;

                return (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-500 rounded-2xl p-4 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-bl-xl uppercase tracking-wider flex items-center space-x-1">
                      <Sparkles className="w-3 h-3" />
                      <span>{isOptimalPrimary ? 'QPSO Optimal Route' : 'Selected Corridor'}</span>
                    </div>

                    <div className="pr-20">
                      <h4 className="text-sm font-extrabold text-slate-900">{activeName}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Real road geometry • {optimizationResult.algorithm}</p>
                    </div>

                    <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-blue-200/60 text-center">
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">ETA</div>
                        <div className="text-sm font-extrabold text-blue-700">{activeEta} min</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">Distance</div>
                        <div className="text-sm font-extrabold text-slate-800">{activeDist} km</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">Fitness F</div>
                        <div className="text-sm font-extrabold text-emerald-600">{activeFit}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">Traffic</div>
                        <div className="text-sm font-extrabold text-indigo-600 flex items-center justify-center">
                          <TrendingDown className="w-3 h-3 mr-0.5" /> {Math.round(activeTraff * 100)}%
                        </div>
                      </div>
                    </div>

                    {/* Explainability Breakdown */}
                    <div className="mt-3 p-2.5 rounded-xl bg-white/80 border border-blue-200/70 text-xs">
                      <div className="font-bold text-slate-700 flex items-center space-x-1 mb-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                        <span>Why QPSO selected this route:</span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        {optimizationResult.explainability?.explanation_text}
                      </p>
                      <div className="grid grid-cols-5 gap-1 mt-2 text-[10px] text-center font-mono">
                        <div className="bg-slate-100 p-1 rounded">Time: {optimizationResult.explainability?.time_contribution}</div>
                        <div className="bg-slate-100 p-1 rounded">Cong: {optimizationResult.explainability?.congestion_contribution}</div>
                        <div className="bg-slate-100 p-1 rounded">Dist: {optimizationResult.explainability?.distance_contribution}</div>
                        <div className="bg-slate-100 p-1 rounded">Risk: {optimizationResult.explainability?.risk_contribution}</div>
                        <div className="bg-slate-100 p-1 rounded">Blk: {optimizationResult.explainability?.blockage_contribution}</div>
                      </div>
                    </div>

                    {/* Start Navigation Action */}
                    <button
                      onClick={handleStartNavigation}
                      className="mt-3.5 w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs shadow transition-all"
                    >
                      <Navigation className="w-4 h-4" />
                      <span>Start Turn-by-Turn Navigation</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                );
              })()}

              {/* Candidate Alternatives List */}
              {optimizationResult.candidate_alternatives?.map((cand, idx) => {
                const isCandSelected = selectedCandidate?.id === cand.id;
                const corridorStyles = [
                  { badgeBg: 'bg-blue-100 text-blue-800 border-blue-200', activeRing: 'ring-blue-400 border-blue-400 bg-blue-50/70', dot: 'bg-blue-600' },
                  { badgeBg: 'bg-amber-100 text-amber-800 border-amber-200', activeRing: 'ring-amber-400 border-amber-400 bg-amber-50/70', dot: 'bg-amber-500' },
                  { badgeBg: 'bg-purple-100 text-purple-800 border-purple-200', activeRing: 'ring-purple-400 border-purple-400 bg-purple-50/70', dot: 'bg-purple-500' },
                  { badgeBg: 'bg-cyan-100 text-cyan-800 border-cyan-200', activeRing: 'ring-cyan-400 border-cyan-400 bg-cyan-50/70', dot: 'bg-cyan-500' },
                ];
                const cStyle = corridorStyles[idx % corridorStyles.length];

                return (
                  <div
                    key={cand.id || idx}
                    onClick={() => setSelectedCandidate(cand)}
                    className={`rounded-xl p-3.5 border transition-all cursor-pointer flex items-center justify-between ${
                      isCandSelected
                        ? `${cStyle.activeRing} shadow-sm ring-1`
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-start space-x-2.5 min-w-0">
                      <span className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${cStyle.dot}`} />
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <h5 className="text-xs font-bold text-slate-800 truncate">{cand.name}</h5>
                          {idx === 0 && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 uppercase">
                              Primary
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-1">
                          <span className="font-semibold text-slate-700">{cand.travel_time_min} min</span>
                          <span>•</span>
                          <span>{cand.distance_km} km</span>
                          <span>•</span>
                          <span className={cand.traffic_score < 0.25 ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
                            Traffic: {Math.round(cand.traffic_score * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <span className="text-xs font-mono font-bold text-slate-600">F = {cand.composite_fitness}</span>
                      <div className="text-[10px] font-semibold mt-0.5">
                        {isCandSelected ? (
                          <span className="text-blue-600 font-bold flex items-center justify-end">
                            Active on Map
                          </span>
                        ) : (
                          <span className="text-slate-400 hover:text-blue-600">
                            Click to View
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Right Side: Interactive Leaflet Map (Sticky in Viewport) */}
        <section className="lg:col-span-7 lg:sticky lg:top-24 lg:h-[calc(100vh-7.5rem)] flex flex-col self-start space-y-3 z-0">

          {/* Ambient Emergency Approaching Give-Way Alert Banner (Citizen Map View) */}
          {isRadarActive && activeAmbulance && activeAmbulance.has_active_ambulance && activeAmbulance.is_relevant_to_user && !giveWayAcknowledged && (
            <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white p-3.5 rounded-2xl shadow-xl border-2 border-red-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-pulse shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-white/20 rounded-xl shrink-0">
                  <Siren className="w-5 h-5 text-yellow-300 animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-xs sm:text-sm tracking-wide uppercase">
                      🚨 EMERGENCY VEHICLE APPROACHING YOUR ROUTE ({activeAmbulance.vehicle_code || 'AMB-108'})
                    </span>
                    <span className="bg-yellow-400 text-red-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                      GIVE WAY
                    </span>
                  </div>
                  <p className="text-xs text-red-100 mt-0.5">
                    {activeAmbulance.give_way_action || 'Move to the left shoulder and clear the emergency corridor immediately.'}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] font-bold">
                    <span className="bg-red-950/70 border border-red-400/40 px-2 py-0.5 rounded text-white">
                      📏 {activeAmbulance.distance_meters}m away
                    </span>
                    <span className="bg-red-950/70 border border-red-400/40 px-2 py-0.5 rounded text-white">
                      ⏱️ ETA: {activeAmbulance.eta_seconds}s
                    </span>
                    <span className="bg-red-950/70 border border-red-400/40 px-2 py-0.5 rounded text-white flex items-center gap-1">
                      <span>🧭 Heading: {activeAmbulance.heading_direction} ({activeAmbulance.heading_degrees}°)</span>
                      <span
                        className="inline-block transition-transform duration-300 text-yellow-300 font-bold"
                        style={{ transform: `rotate(${activeAmbulance.heading_degrees || 0}deg)` }}
                      >
                        ↑
                      </span>
                    </span>
                    <span className="bg-red-950/70 border border-red-400/40 px-2 py-0.5 rounded text-white">
                      ⚡ {activeAmbulance.speed_kmh} km/h
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2 w-full sm:w-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setGiveWayAcknowledged(true)}
                  className="flex-1 sm:flex-initial bg-white hover:bg-red-50 text-red-700 font-extrabold px-3 py-1.5 rounded-xl text-xs shadow-md transition-all active:scale-95 whitespace-nowrap"
                >
                  Acknowledge & Yield
                </button>
              </div>
            </div>
          )}

          {isRadarActive && activeAmbulance && activeAmbulance.has_active_ambulance && activeAmbulance.is_relevant_to_user && giveWayAcknowledged && (
            <div className="bg-red-950/90 border border-red-600/60 text-red-200 text-xs px-3.5 py-2 rounded-xl flex items-center justify-between shadow-md shrink-0">
              <div className="flex items-center space-x-2">
                <Siren className="w-4 h-4 text-red-400 animate-pulse shrink-0" />
                <span>
                  Clearway active for <b>{activeAmbulance.vehicle_code}</b> • <b>{activeAmbulance.distance_meters}m away</b> (ETA: <b>{activeAmbulance.eta_seconds}s</b> • Heading: <b>{activeAmbulance.heading_direction}</b>)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setGiveWayAcknowledged(false)}
                className="text-[11px] font-bold text-red-300 hover:text-white underline ml-3 shrink-0"
              >
                Reopen Alert
              </button>
            </div>
          )}

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex-1 flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between mb-2 shrink-0">
              <div className="flex items-center space-x-2">
                <RouteIcon className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-bold text-slate-800">
                  Real Highway & Urban Network ({activeRegionNotice})
                </span>
              </div>
              <div className="flex items-center space-x-2 text-xs font-medium">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                  OpenStreetMap Real Roads
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold">
                  Live Traffic Layer
                </span>
              </div>
            </div>

            {/* Hint for setting destination */}
            <div className="bg-blue-50/70 border border-blue-200 text-blue-800 px-3 py-1.5 rounded-xl text-xs flex items-center space-x-2 mb-2 shrink-0">
              <MousePointerClick className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Click anywhere on the map to set a new destination with automatic street naming!</span>
            </div>

            {/* Map Container */}
            <div className="flex-1 w-full relative rounded-xl overflow-hidden min-h-[350px]">
              <LeafletMap
                origin={origin}
                destination={destination}
                primaryRoute={activeRoutePolyline}
                alternativeRoutes={alternativePolylines}
                vehicleLocation={origin}
                vehicleType={vehicleType}
                activeAmbulanceAlert={isRadarActive && activeAmbulance?.has_active_ambulance && activeAmbulance?.is_relevant_to_user ? activeAmbulance : null}
                showEmergencyRadius={isEmergency}
                alertRadiusMeters={600}
                onMapClick={handleMapClick}
                onSelectAlternative={(altIdx) => {
                  const remaining = optimizationResult?.candidate_alternatives?.filter((c) => c.id !== selectedCandidate?.id);
                  if (remaining && remaining[altIdx]) {
                    setSelectedCandidate(remaining[altIdx]);
                  }
                }}
                className="w-full h-full rounded-xl"
              />
            </div>

            {/* Map Legend */}
            <div className="flex flex-wrap items-center gap-3 mt-2.5 pt-2.5 border-t border-slate-100 text-[11px] text-slate-600 shrink-0">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
                <span>Origin: <strong className="text-slate-800">{origin.name ? origin.name.split(',')[0] : 'Start'}</strong></span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-200" />
                <span>Destination: <strong className="text-slate-800">{destination ? (destination.name ? destination.name.split(',')[0] : 'End') : 'Not Set'}</strong></span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className={`w-3.5 h-1.5 rounded-full ${isEmergency ? 'bg-red-600' : 'bg-blue-600'}`} />
                <span>Active Selected Corridor</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3.5 h-1 bg-amber-500 rounded-sm" />
                <span>Corridor B (Sector Arterial)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3.5 h-1 bg-purple-500 rounded-sm" />
                <span>Corridor C (Perimeter Bypass)</span>
              </div>
              {isRadarActive && activeAmbulance && activeAmbulance.has_active_ambulance && (
                <>
                  <div className="flex items-center space-x-1.5 text-red-600 font-semibold">
                    <span className="w-3.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
                    <span>Ambulance Clearway ({activeAmbulance.vehicle_code || 'AMB-108'})</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-red-700 font-semibold">
                    <span>🚑 Approaching ({activeAmbulance.speed_kmh} km/h • {activeAmbulance.heading_direction})</span>
                  </div>
                </>
              )}
              {isEmergency && (
                <div className="flex items-center space-x-1.5 text-red-600 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full border border-red-500 bg-red-100 animate-pulse" />
                  <span>Give-Way Proximity (600m)</span>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
