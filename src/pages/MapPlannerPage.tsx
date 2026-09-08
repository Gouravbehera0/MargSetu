import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import NavigationNavbar from '@/components/NavigationNavbar';
import HighwayCorridorBanner from '@/components/HighwayCorridorBanner';
import LeafletMap from '@/components/LeafletMap';
import { optimizeRouteWithQPSO } from '@/services/apiService';
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
  RouteCandidateAlternative
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
  Cross
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

export default function MapPlannerPage() {
  const navigate = useNavigate();

  const [origin, setOrigin] = useState<GeoPoint>(INITIAL_CITY.center);
  const [destination, setDestination] = useState<GeoPoint>(INITIAL_CITY.defaultDestination);
  const [presets, setPresets] = useState<PresetDestination[]>(INITIAL_CITY.presets);
  const [selectedCityId, setSelectedCityId] = useState<string>(INITIAL_CITY.id);
  const [activeRegionNotice, setActiveRegionNotice] = useState<string>('Raipur, Chhattisgarh');

  const [vehicleType, setVehicleType] = useState<GeneralVehicleType>('car');
  const [preference, setPreference] = useState<RoutePreference>('balanced');
  const [loading, setLoading] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<QPSOOptimizationResult | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<RouteCandidateAlternative | null>(null);

  // Search autocomplete state for Origin
  const [originQuery, setOriginQuery] = useState(INITIAL_CITY.center.name || 'Jaistambh Chowk, Raipur');
  const [originSuggestions, setOriginSuggestions] = useState<LocationSearchResult[]>([]);
  const [isSearchingOrigin, setIsSearchingOrigin] = useState(false);
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);

  // Search autocomplete state for Destination
  const [destQuery, setDestQuery] = useState(INITIAL_CITY.defaultDestination.name || 'Raipur Junction Railway Station');
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
    if (destination.name) setDestQuery(destination.name);
  }, [destination.name]);

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
    const timer = setTimeout(() => {
      handleRunOptimization();
    }, 150);
    return () => clearTimeout(timer);
  }, [origin.lat, origin.lng, destination.lat, destination.lng, vehicleType, preference]);

  async function handleRunOptimization() {
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
   * Applies user coordinates, reverse-geocodes origin, and sets destination & presets according to it!
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

      // Dynamically configure ending point and presets according to this starting point
      const intelligentSetup = getIntelligentDestinationSetup(lat, lng, resolvedPlaceName);
      setDestination(intelligentSetup.defaultDestination);
      setDestQuery(intelligentSetup.defaultDestination.name || '');
      setPresets(intelligentSetup.presets);
      setActiveRegionNotice(intelligentSetup.detectedCityName);

      // Match city profile if any
      const matchedCity = findClosestCityProfile(lat, lng);
      if (matchedCity) {
        setSelectedCityId(matchedCity.id);
      } else {
        setSelectedCityId('custom');
      }
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
    setDestination(city.defaultDestination);
    setDestQuery(city.defaultDestination.name || '');
    setPresets(city.presets);
    setShowOriginDropdown(false);
    setShowDestDropdown(false);
  }

  /**
   * Swaps Origin and Destination
   */
  function handleSwapPoints() {
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
      const results = await searchPlacesAutocomplete(destQuery, destination.lat, destination.lng);
      setDestSuggestions(results);
      setIsSearchingDest(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [destQuery]);

  function handleSelectOriginSuggestion(item: LocationSearchResult) {
    const newOrigin: GeoPoint = {
      lat: item.lat,
      lng: item.lng,
      name: item.name
    };
    setOrigin(newOrigin);
    setOriginQuery(item.name);
    setShowOriginDropdown(false);

    // If selected origin is far from current destination, align destination according to it
    const intelligentSetup = getIntelligentDestinationSetup(item.lat, item.lng, item.name);
    setDestination(intelligentSetup.defaultDestination);
    setDestQuery(intelligentSetup.defaultDestination.name || '');
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

  // Active polyline to render on the map
  const activeRoutePolyline = selectedCandidate?.coordinates || optimizationResult?.route_geometry;
  const alternativePolylines = optimizationResult?.candidate_alternatives
    ?.filter((c) => c.id !== selectedCandidate?.id)
    .map((c) => c.coordinates) || [];

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
                  <span className="text-[10px] text-rose-600 font-mono">
                    {destination.lat.toFixed(4)}°, {destination.lng.toFixed(4)}°
                  </span>
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
                        destination.name === preset.name
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
                      onClick={() =>
                        navigate('/navigate', {
                          state: {
                            origin,
                            destination,
                            vehicleType,
                            polyline: activeRoutePolyline,
                            etaMinutes: activeEta,
                            distanceKm: activeDist
                          }
                        })
                      }
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
                <span>Destination: <strong className="text-slate-800">{destination.name ? destination.name.split(',')[0] : 'End'}</strong></span>
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
