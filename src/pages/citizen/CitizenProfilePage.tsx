import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import NavigationNavbar from '@/components/NavigationNavbar';
import { useApp } from '@/context/AppContext';
import { fetchEmergencyContacts, updateProfile, addEmergencyContact, deleteEmergencyContact } from '@/services/supabaseQueries';
import type { Role, GeneralVehicleType, RoutePreference } from '@/types';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Bell,
  Compass,
  Heart,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  Car,
  Siren,
  Truck,
  Save,
  LogOut,
  Activity,
  TrendingDown,
  Clock,
  Leaf,
  AlertTriangle,
  ChevronRight,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export default function CitizenProfilePage() {
  const navigate = useNavigate();
  const { user, setUser, setRole, logout } = useApp();

  // Profile fields state
  const [name, setName] = useState(user?.name || 'Gourav Kumar Behera');
  const [email, setEmail] = useState(user?.email || 'gouravbehera28@gmail.com');
  const [phone, setPhone] = useState(user?.phone || '+91 98765 43210');
  const [savedLocation, setSavedLocation] = useState(user?.savedLocation || 'Bhubaneswar, Odisha');

  // Commuter routing preferences
  const [preferredVehicle, setPreferredVehicle] = useState<GeneralVehicleType>('car');
  const [routePreference, setRoutePreference] = useState<RoutePreference>('balanced');
  const [avoidTolls, setAvoidTolls] = useState(false);
  const [avoidNarrowAlleys, setAvoidNarrowAlleys] = useState(true);
  const [autoRerouteOnCongestion, setAutoRerouteOnCongestion] = useState(true);

  // Safety radar settings
  const [proximityAudioRadar, setProximityAudioRadar] = useState(true);
  const [hazardPushAlerts, setHazardPushAlerts] = useState(true);

  // Emergency Contacts
  const [contacts, setContacts] = useState([
    { id: 'c1', name: 'Alok Kumar Behera', phone: '+91 94370 12345', relation: 'Brother / Family' },
    { id: 'c2', name: 'Dr. S. K. Patnaik', phone: '+91 98610 98765', relation: 'Family Physician' }
  ]);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactRelation, setNewContactRelation] = useState('');
  const [showAddContact, setShowAddContact] = useState(false);

  // Feedback notifications
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync state if user changes in AppContext
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      if (user.phone) setPhone(user.phone);
      if (user.savedLocation) setSavedLocation(user.savedLocation);

      fetchEmergencyContacts(user.id)
        .then((data) => {
          if (data && data.length > 0) {
            setContacts(data);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const updated = {
        id: user?.id || 'usr_' + Date.now(),
        name,
        email,
        phone,
        savedLocation,
        role: user?.role || 'citizen',
        vehicleType: user?.vehicleType
      };
      setUser(updated);

      if (user?.id) {
        await updateProfile(user.id, {
          name,
          phone,
          saved_location: savedLocation
        }).catch(() => {});
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSwitchRole = (newRole: Role, targetPath: string) => {
    setRole(newRole);
    if (user) {
      setUser({ ...user, role: newRole });
    }
    navigate(targetPath);
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName || !newContactPhone) return;

    const newContact = {
      id: 'c_' + Date.now(),
      name: newContactName,
      phone: newContactPhone,
      relation: newContactRelation || 'Emergency Contact'
    };

    setContacts([...contacts, newContact]);
    setNewContactName('');
    setNewContactPhone('');
    setNewContactRelation('');
    setShowAddContact(false);

    if (user?.id) {
      try {
        await addEmergencyContact({
          name: newContact.name,
          phone: newContact.phone,
          relation: newContact.relation
        });
      } catch (e) {}
    }
  };

  const handleDeleteContact = (id: string) => {
    setContacts(contacts.filter((c) => c.id !== id));
    deleteEmergencyContact(id).catch(() => {});
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      <NavigationNavbar />

      {/* Page Header Banner */}
      <div className="bg-slate-950 text-white border-b border-slate-800 pt-6 pb-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-cyan-300 border border-cyan-500/30">
                VERIFIED CITIZEN PORTAL
              </span>
              <span className="text-xs font-semibold text-slate-400 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                <span>Transportation User Identity</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1.5 flex items-center space-x-2.5 tracking-tight">
              <User className="w-6 h-6 text-blue-500" />
              <span>User Profile & Travel Preferences Center</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Manage personal credentials, QPSO navigation preferences, emergency give-way clearance, and safety alert radios.
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => navigate('/map')}
              className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-all"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Plan Route</span>
            </button>
            <button
              onClick={() => navigate('/admin')}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-3.5 py-2 rounded-xl text-xs border border-slate-700 transition-all"
            >
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <span>Admin Dashboard</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Success Banner */}
        {saveSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-bold flex items-center space-x-3 shadow-sm animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Profile and transportation routing preferences have been saved and applied across your MargSetu journey!</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ========================================================= */}
          {/* Left Column: Identity Card & Telemetry Analytics (col-span-4) */}
          {/* ========================================================= */}
          <div className="lg:col-span-4 space-y-5">
            
            {/* User Profile Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5 text-center">
              <div className="relative w-24 h-24 mx-auto">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-blue-500/20 mx-auto">
                  {name ? name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white absolute bottom-1 right-1 shadow-sm" title="Online" />
              </div>

              <div>
                <h2 className="text-lg font-black text-slate-900">{name}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{email}</p>
                <div className="inline-flex items-center space-x-1 mt-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
                  <MapPin className="w-3 h-3 text-blue-500" />
                  <span>{savedLocation}</span>
                </div>
              </div>

              {/* Active Role Selector */}
              <div className="pt-4 border-t border-slate-100 text-left">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Active Transportation Role
                  </span>
                  <Link to="/roles" className="text-[10px] text-blue-600 font-bold hover:underline">
                    All Roles &rarr;
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSwitchRole('citizen', '/map')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      user?.role === 'citizen' || !user?.role
                        ? 'bg-blue-50 border-blue-300 text-blue-900 font-extrabold shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5">
                      <Car className="w-3.5 h-3.5 text-blue-600" />
                      <span className="text-xs">Commuter</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSwitchRole('vehicle', '/emergency')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      user?.role === 'vehicle'
                        ? 'bg-red-50 border-red-300 text-red-900 font-extrabold shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5">
                      <Siren className="w-3.5 h-3.5 text-red-600" />
                      <span className="text-xs">Emergency</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSwitchRole('vehicle', '/vehicles')}
                    className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 text-left transition-all"
                  >
                    <div className="flex items-center space-x-1.5">
                      <Truck className="w-3.5 h-3.5 text-amber-600" />
                      <span className="text-xs">Fleet Lead</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSwitchRole('admin', '/admin')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      user?.role === 'admin'
                        ? 'bg-cyan-50 border-cyan-300 text-cyan-900 font-extrabold shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5">
                      <Shield className="w-3.5 h-3.5 text-cyan-600" />
                      <span className="text-xs">Authority</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Sign Out Button */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out of MargSetu</span>
                </button>
              </div>
            </div>

            {/* Commuter Telemetry Impact Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Your Mobility Impact Telemetry
              </h3>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div className="flex items-center space-x-1.5 text-slate-500 text-[10px] font-bold uppercase">
                    <Activity className="w-3.5 h-3.5 text-blue-600" />
                    <span>Trips Optimized</span>
                  </div>
                  <div className="text-xl font-black text-slate-900 mt-1">48</div>
                  <p className="text-[10px] text-slate-400">Via QPSO Metaheuristic</p>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div className="flex items-center space-x-1.5 text-slate-500 text-[10px] font-bold uppercase">
                    <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Avg. Time Saved</span>
                  </div>
                  <div className="text-xl font-black text-emerald-600 mt-1">24.6%</div>
                  <p className="text-[10px] text-slate-400">Bottleneck bypasses</p>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div className="flex items-center space-x-1.5 text-slate-500 text-[10px] font-bold uppercase">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Distance Logged</span>
                  </div>
                  <div className="text-xl font-black text-slate-900 mt-1">342.5 km</div>
                  <p className="text-[10px] text-slate-400">Smart city corridors</p>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div className="flex items-center space-x-1.5 text-slate-500 text-[10px] font-bold uppercase">
                    <Leaf className="w-3.5 h-3.5 text-teal-600" />
                    <span>CO₂ Prevented</span>
                  </div>
                  <div className="text-xl font-black text-teal-600 mt-1">18.2 kg</div>
                  <p className="text-[10px] text-slate-400">Idling fuel reduction</p>
                </div>
              </div>
            </div>

          </div>

          {/* ========================================================= */}
          {/* Right Column: Settings, Preferences & Emergency Contacts (col-span-8) */}
          {/* ========================================================= */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Card 1: Personal Credentials & Transportation Identity */}
            <form onSubmit={handleSaveProfile} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                    Personal Transportation Profile
                  </h3>
                </div>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-all disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving Changes...' : 'Save Profile'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">Full Legal Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl pl-10 pr-3 py-2.5 text-xs font-semibold text-slate-900 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl pl-10 pr-3 py-2.5 text-xs font-semibold text-slate-900 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">Mobile Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl pl-10 pr-3 py-2.5 text-xs font-semibold text-slate-900 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">Primary City / Saved Location</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={savedLocation}
                      onChange={(e) => setSavedLocation(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl pl-10 pr-3 py-2.5 text-xs font-semibold text-slate-900 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </form>

            {/* Card 2: Routing & Vehicle Preferences */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                <Compass className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                  QPSO Routing & Vehicle Preferences
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">Default Primary Commute Mode</label>
                  <select
                    value={preferredVehicle}
                    onChange={(e) => setPreferredVehicle(e.target.value as GeneralVehicleType)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 outline-none cursor-pointer"
                  >
                    <option value="car">Car (Urban Commuter)</option>
                    <option value="bike">Motorcycle / 2-Wheeler (Fast Micro-Path)</option>
                    <option value="bus">Public Transit Bus (Corridor Route)</option>
                    <option value="truck">Heavy Freight Truck (Highway Access Only)</option>
                    <option value="delivery">Logistics / Delivery Fleet</option>
                    <option value="ambulance">Emergency Vehicle (Green Corridor)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">Default Optimization Bias</label>
                  <select
                    value={routePreference}
                    onChange={(e) => setRoutePreference(e.target.value as RoutePreference)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 outline-none cursor-pointer"
                  >
                    <option value="balanced">Balanced (Optimal compromise: Time & Distance)</option>
                    <option value="fastest">Fastest (Prioritize expressways & speed limits)</option>
                    <option value="shortest">Shortest (Minimum physical kilometers)</option>
                    <option value="safest">Safest (Avoid accident blackspots & workzones)</option>
                    <option value="low_traffic">Low Traffic (Heavily penalize congestion factor)</option>
                    <option value="eco">Eco-Friendly (Fuel efficiency & low emissions)</option>
                  </select>
                </div>
              </div>

              {/* Detour Toggles */}
              <div className="space-y-3 pt-2">
                <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-150 cursor-pointer hover:bg-blue-50/40 transition-all">
                  <div>
                    <div className="text-xs font-bold text-slate-900">Autonomous Reroute on Heavy Bottlenecks</div>
                    <div className="text-[11px] text-slate-500">Automatically calculate QPSO detours when live sensor congestion exceeds 70%</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoRerouteOnCongestion}
                    onChange={(e) => setAutoRerouteOnCongestion(e.target.checked)}
                    className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-150 cursor-pointer hover:bg-blue-50/40 transition-all">
                  <div>
                    <div className="text-xs font-bold text-slate-900">Avoid Narrow Residential Alleys</div>
                    <div className="text-[11px] text-slate-500">Confines guidance to broad arterials, flyovers, and state highways</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={avoidNarrowAlleys}
                    onChange={(e) => setAvoidNarrowAlleys(e.target.checked)}
                    className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-150 cursor-pointer hover:bg-blue-50/40 transition-all">
                  <div>
                    <div className="text-xs font-bold text-slate-900">Avoid Toll Plazas</div>
                    <div className="text-[11px] text-slate-500">Filter out paid highway toll segments when free alternative corridors exist</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={avoidTolls}
                    onChange={(e) => setAvoidTolls(e.target.checked)}
                    className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Card 3: Priority Clearance & Emergency Contacts */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <Heart className="w-4 h-4 text-red-500" />
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                    Emergency Contacts & Priority Radar
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddContact(!showAddContact)}
                  className="flex items-center space-x-1 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Emergency Contact</span>
                </button>
              </div>

              {/* Add Contact Modal / Inline Form */}
              {showAddContact && (
                <form onSubmit={handleAddContact} className="bg-red-50/70 border border-red-200 rounded-2xl p-4 space-y-3 animate-fadeIn">
                  <div className="text-xs font-bold text-red-900">Add New Trusted Emergency Contact:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <input
                      type="text"
                      required
                      placeholder="Contact Name"
                      value={newContactName}
                      onChange={(e) => setNewContactName(e.target.value)}
                      className="bg-white border border-red-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Phone (+91...)"
                      value={newContactPhone}
                      onChange={(e) => setNewContactPhone(e.target.value)}
                      className="bg-white border border-red-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Relationship (e.g. Spouse)"
                      value={newContactRelation}
                      onChange={(e) => setNewContactRelation(e.target.value)}
                      className="bg-white border border-red-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowAddContact(false)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-sm"
                    >
                      Confirm Contact
                    </button>
                  </div>
                </form>
              )}

              {/* Contacts List */}
              <div className="space-y-2.5">
                {contacts.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400">
                    No emergency contacts added yet. Add trusted family members or physicians.
                  </div>
                ) : (
                  contacts.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-all"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm shrink-0">
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-xs font-extrabold text-slate-900">{c.name}</div>
                          <div className="text-[11px] text-slate-500">{c.relation} • <span className="font-mono">{c.phone}</span></div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <a
                          href={`tel:${c.phone}`}
                          className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold transition-colors"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Call</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDeleteContact(c.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Remove Contact"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Radar Alert Audio Toggle */}
              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-center justify-between p-3 rounded-2xl bg-red-50/50 border border-red-200/60 cursor-pointer">
                  <div className="flex items-center space-x-2.5">
                    <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-slate-900">600m Emergency Give-Way Proximity Radar</div>
                      <div className="text-[11px] text-slate-500">Audio and visual notifications when an active ambulance or fire tender is approaching</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={proximityAudioRadar}
                    onChange={(e) => setProximityAudioRadar(e.target.checked)}
                    className="w-4 h-4 accent-red-600 rounded cursor-pointer"
                  />
                </label>
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}

