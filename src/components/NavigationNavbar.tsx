import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Compass,
  Navigation,
  GitFork,
  Car,
  Activity,
  AlertTriangle,
  Menu,
  X,
  Shield,
  ShieldAlert,
  ChevronDown,
  User,
  LogOut,
  Sparkles
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import margSetuLogo from '@/assets/margsetu_app_logo.png';

export default function NavigationNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileDropdownOpen]);

  // Core navigation items with crisp, single-line labels (never wraps)
  const navItems = [
    { label: 'Map', path: '/map', icon: Compass },
    { label: 'Navigate', path: '/navigate', icon: Navigation },
    { label: 'Routes', path: '/routes', icon: GitFork },
    { label: 'Traffic', path: '/traffic', icon: Activity },
    { label: 'Incidents', path: '/incidents', icon: AlertTriangle },
    { label: 'Vehicles', path: '/vehicles', icon: Car }
  ];

  const isEmergencyActive = location.pathname.includes('emergency');

  const handleSignOut = async () => {
    setProfileDropdownOpen(false);
    setMobileMenuOpen(false);
    await logout();
    navigate('/login');
  };

  // Check if we are on the map webpage where the highway hero image is directly underneath
  const isMapWebpage = location.pathname === '/' || location.pathname === '/map';

  // Dynamic scroll listener: active only on the map page to manage the highway picture blend
  useEffect(() => {
    if (!isMapWebpage) {
      setScrollProgress(0);
      return;
    }

    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      // Reaches 1.0 (solid normal navbar) after 80px scroll
      const progress = Math.min(Math.max(scrollY / 80, 0), 1);
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMapWebpage]);

  // Dynamic opacity and border styling (MAP PAGE ONLY):
  // At top (scrollProgress = 0): Translucent frosted glass blending with the highway photo
  // When scrolled down (scrollProgress -> 1): Returns smoothly to normal solid dark slate-950 navbar
  const currentBgOpacity = (0.15 + scrollProgress * (0.96 - 0.15)).toFixed(2);
  const borderOpacity = scrollProgress > 0.2 ? (scrollProgress * 0.85).toFixed(2) : '0.06';

  return (
    <header
      style={
        isMapWebpage
          ? {
              backgroundColor: `rgba(2, 6, 23, ${currentBgOpacity})`,
              borderBottomColor:
                scrollProgress > 0.2
                  ? `rgba(30, 41, 59, ${borderOpacity})`
                  : `rgba(255, 255, 255, ${borderOpacity})`,
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow:
                scrollProgress > 0.1 ? '0 12px 32px -8px rgba(0, 0, 0, 0.85)' : 'none'
            }
          : undefined
      }
      className={
        isMapWebpage
          ? 'sticky top-0 z-[9999] text-white border-b transition-all duration-200'
          : 'sticky top-0 z-[9999] bg-slate-950 text-white shadow-xl border-b border-slate-800'
      }
    >
      <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-5 lg:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 lg:gap-4">
          {/* Brand Logo */}
          <Link to="/map" className="flex items-center space-x-2.5 shrink-0 group py-1">
            <img
              src={margSetuLogo}
              alt="MargSetu Logo"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-contain shadow-md shadow-cyan-500/25 group-hover:scale-105 transition-transform shrink-0"
            />
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-black tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-cyan-200 leading-tight">
                MARGSETU
              </span>
              <p className="text-[10px] text-slate-400 font-medium tracking-tight whitespace-nowrap hidden 2xl:block leading-none mt-0.5">
                One Platform. Smarter Routes. Safer Roads.
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links: Streamlined, Single-Line, Never Wraps */}
          <nav className="hidden lg:flex items-center space-x-1 xl:space-x-1.5 overflow-x-auto scrollbar-none py-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Emergency Priority Badge, Admin & Profile Section (Right Side) */}
          <div className="hidden sm:flex items-center space-x-2 shrink-0">
            <Link
              to="/emergency"
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shadow-sm ${
                isEmergencyActive
                  ? 'bg-red-600 text-white ring-4 ring-red-500/30 animate-pulse'
                  : 'bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25'
              }`}
              title="Activate Emergency Dedicated Green-Corridor Clearance"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span>EMERGENCY MODE</span>
            </Link>

            <Link
              to="/admin"
              className="flex items-center space-x-1.5 text-xs font-bold text-slate-200 hover:text-white px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-blue-500 transition-all whitespace-nowrap shadow-sm"
              title="Open Admin Dashboard (QPSO Core, Benchmarks, Analytics, Weights)"
            >
              <Shield className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Admin</span>
            </Link>

            {/* Profile Section: Dynamic Avatar Pill & Dropdown when logged in, Sign In when logged out */}
            {user ? (
              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-2 pl-1.5 pr-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 hover:border-blue-500/60 hover:bg-slate-800/80 transition-all text-left shadow-sm group"
                  title="View Profile & Account Settings"
                >
                  {/* Avatar circle with initial and live status dot */}
                  <div className="relative shrink-0">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center text-white font-black text-xs shadow-sm group-hover:scale-105 transition-transform">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 border-2 border-slate-950 absolute -bottom-0.5 -right-0.5" />
                  </div>

                  <div className="flex flex-col text-left leading-tight max-w-[100px]">
                    <span className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors truncate">
                      {user.name.split(' ')[0]}
                    </span>
                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-tight">
                      {user.role === 'admin' ? 'Admin' : user.role === 'vehicle' ? 'Operator' : 'Commuter'}
                    </span>
                  </div>

                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform duration-200 ${
                      profileDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Profile Floating Dropdown Popover */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/80 py-2.5 z-50 animate-fadeIn text-xs">
                    {/* User Identity Header */}
                    <div className="px-4 py-2 border-b border-slate-800/80">
                      <div className="font-extrabold text-white text-sm truncate">{user.name}</div>
                      <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
                      <div className="mt-2 inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/30 text-cyan-300 text-[10px] font-bold uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>
                          {user.role === 'admin'
                            ? 'Master Authority'
                            : user.role === 'vehicle'
                            ? 'Emergency / Fleet Pilot'
                            : 'Citizen Commuter'}
                        </span>
                      </div>
                    </div>

                    {/* Navigation & Role Shortcuts */}
                    <div className="py-1.5 border-b border-slate-800/80">
                      <Link
                        to="/citizen/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center space-x-2.5 px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800/70 transition-colors"
                      >
                        <User className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span>My Transportation Profile</span>
                      </Link>
                      <Link
                        to="/roles"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center space-x-2.5 px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800/70 transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>Switch Active Role</span>
                      </Link>
                      <Link
                        to="/admin"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center space-x-2.5 px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800/70 transition-colors"
                      >
                        <Shield className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>Admin Control Center</span>
                      </Link>
                    </div>

                    {/* Sign Out Button */}
                    <div className="pt-1.5 px-2">
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors font-bold text-xs"
                      >
                        <LogOut className="w-3.5 h-3.5 shrink-0" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all whitespace-nowrap"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu hamburger toggle */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div
          className={`lg:hidden border-b border-slate-800 px-4 pt-2 pb-4 space-y-2 animate-fadeIn ${
            isMapWebpage ? 'bg-slate-950/95 backdrop-blur-2xl' : 'bg-slate-950'
          }`}
        >
          <div className="pb-2 mb-2 border-b border-slate-800">
            <Link
              to="/emergency"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center space-x-2 w-full py-2.5 rounded-xl text-xs font-bold bg-red-600 text-white shadow-md shadow-red-600/30"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>ACTIVATE EMERGENCY MODE</span>
            </Link>
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-2 border-t border-slate-800 space-y-1">
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-bold text-blue-400 hover:bg-slate-900 transition-colors"
            >
              <Shield className="w-4 h-4" />
              <span>Admin Control Center</span>
            </Link>

            {/* Mobile Profile Card or Sign In Link */}
            {user ? (
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center font-black text-sm text-white shrink-0">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-white truncate">{user.name}</span>
                    <span className="text-[10px] text-slate-400 truncate">{user.email}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/citizen/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
                  >
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    <span>My Profile</span>
                  </Link>
                  <Link
                    to="/roles"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Roles</span>
                  </Link>
                </div>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2.5 rounded-xl bg-blue-600 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition-colors"
              >
                Sign In to Platform
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
