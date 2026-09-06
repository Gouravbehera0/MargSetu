import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Role, EmergencyServiceType, EmergencyRequest, AlertItem, NavigationRoute } from '@/types';
import supabase from '@/lib/supabase';
import { fetchProfile, fetchAlerts, fetchActiveRequest, createAlert as dbCreateAlert, dismissAlert as dbDismissAlert } from '@/services/supabaseQueries';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: Role;
  vehicleType?: EmergencyServiceType;
  vehicleCode?: string;
  savedLocation?: string;
}

interface ToastMessage {
  id: string;
  text: string;
  variant: 'success' | 'warning' | 'info';
}

interface AppState {
  user: AuthUser | null;
  role: Role | null;
  serviceType: EmergencyServiceType | null;
  isAuth: boolean;
  authLoading: boolean;
  currentRequest: EmergencyRequest | null;
  alerts: AlertItem[];
  activeRoute: NavigationRoute | null;
  toasts: ToastMessage[];
  setRole: (role: Role) => void;
  setServiceType: (type: EmergencyServiceType) => void;
  login: () => void;
  logout: () => void;
  setUser: (user: AuthUser | null) => void;
  createRequest: (req: EmergencyRequest) => void;
  cancelRequest: () => void;
  dismissAlert: (id: string) => void;
  addAlert: (alert: AlertItem) => void;
  setActiveRoute: (route: NavigationRoute) => void;
  showToast: (text: string, variant?: 'success' | 'warning' | 'info') => void;
  dismissToast: (id: string) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRoleState] = useState<Role | null>(null);
  const [serviceType, setServiceTypeState] = useState<EmergencyServiceType | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentRequest, setCurrentRequest] = useState<EmergencyRequest | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [activeRoute, setActiveRouteState] = useState<NavigationRoute | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const isAuth = !!user;

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        loadUserData(session.user.id, session.user.email ?? '');
      } else {
        setAuthLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserData(session.user.id, session.user.email ?? '');
        } else if (event === 'SIGNED_OUT') {
          if (mounted) {
            setUser(null);
            setRoleState(null);
            setCurrentRequest(null);
            setAlerts([]);
          }
        }
      })();
    });

    async function loadUserData(userId: string, email: string) {
      try {
        const profile = await fetchProfile(userId);
        if (!mounted) return;

        if (profile) {
          setUser({
            id: profile.id,
            email: profile.email || email,
            name: profile.name || 'User',
            phone: profile.phone || '',
            role: (profile.role as Role) || 'citizen',
            vehicleType: profile.vehicle_type as EmergencyServiceType | undefined,
            vehicleCode: profile.vehicle_code || undefined,
            savedLocation: profile.saved_location || undefined,
          });
          setRoleState((profile.role as Role) || 'citizen');

          const [activeReq, userAlerts] = await Promise.all([
            fetchActiveRequest(userId),
            fetchAlerts(userId),
          ]);
          if (!mounted) return;

          if (activeReq) {
            setCurrentRequest({
              id: activeReq.id,
              serviceType: activeReq.service_type,
              emergencyType: activeReq.emergency_type,
              pickupLocation: activeReq.pickup_location,
              patients: activeReq.patients,
              additionalInfo: activeReq.additional_info || '',
              status: activeReq.status,
              vehicleId: activeReq.vehicle_id || undefined,
              createdAt: activeReq.created_at,
            });
          }

          if (userAlerts && userAlerts.length > 0) {
            setAlerts(userAlerts.map((a: { id: string; type: AlertItem['type']; title: string; message: string; severity: AlertItem['severity']; distance: string | null; eta: string | null; created_at: string }) => ({
              id: a.id,
              type: a.type,
              title: a.title,
              message: a.message,
              severity: a.severity,
              distance: a.distance || undefined,
              eta: a.eta || undefined,
              timestamp: timeAgo(a.created_at),
            })));
          }
        }
      } catch (err) {
        console.error('Error loading user data:', err);
      } finally {
        if (mounted) setAuthLoading(false);
      }
    }

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const setRole = useCallback((r: Role) => {
    setRoleState(r);
    if (user) {
      supabase.from('profiles').update({ role: r, updated_at: new Date().toISOString() }).eq('id', user.id).then(() => {});
    }
  }, [user]);

  const setServiceType = useCallback((t: EmergencyServiceType) => setServiceTypeState(t), []);

  const login = useCallback(() => {
    // Legacy mock login — kept for backward compat but real auth uses supabase
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRoleState(null);
    setServiceTypeState(null);
    setCurrentRequest(null);
    setActiveRouteState(null);
    setAlerts([]);
  }, []);

  const createRequest = useCallback((req: EmergencyRequest) => {
    setCurrentRequest(req);
  }, []);

  const cancelRequest = useCallback(() => {
    setCurrentRequest(null);
  }, []);

  const dismissAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    dbDismissAlert(id).catch(() => {});
  }, []);

  const addAlert = useCallback((alert: AlertItem) => {
    setAlerts((prev) => [alert, ...prev]);
    if (user) {
      dbCreateAlert({
        type: alert.type,
        title: alert.title,
        message: alert.message,
        severity: alert.severity,
        distance: alert.distance,
        eta: alert.eta,
      }).catch(() => {});
    }
  }, [user]);

  const setActiveRoute = useCallback((route: NavigationRoute) => {
    setActiveRouteState(route);
  }, []);

  const showToast = useCallback((text: string, variant: 'success' | 'warning' | 'info' = 'success') => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, text, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        role,
        serviceType,
        isAuth,
        authLoading,
        currentRequest,
        alerts,
        activeRoute,
        toasts,
        setRole,
        setServiceType,
        login,
        logout,
        setUser,
        createRequest,
        cancelRequest,
        dismissAlert,
        addAlert,
        setActiveRoute,
        showToast,
        dismissToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.floor(hours / 24)} days ago`;
}
