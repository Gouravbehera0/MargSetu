import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Sparkles, Check, Navigation, Loader2 } from 'lucide-react';
import RouteCard from '@/components/RouteCard';
import LoadingState from '@/components/LoadingState';
import { mockRouteService, type RouteOptimizationResult } from '@/services/mockServices';
import { navigationRoutes } from '@/data/navigationData';
import { useApp } from '@/context/AppContext';
import type { RouteOption, NavigationRoute } from '@/types';

export default function QPSOOptimizationPage() {
  const navigate = useNavigate();
  const { setActiveRoute } = useApp();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<RouteOptimizationResult | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<RouteOption | null>(null);

  useEffect(() => {
    mockRouteService().then((res) => {
      setResult(res);
      setSelectedRoute(res.selectedRoute);
      setLoading(false);
    });
  }, []);

  const handleStart = () => {
    if (!selectedRoute) return;
    const navRoute: NavigationRoute =
      navigationRoutes.find((r) => r.name === selectedRoute.name) ?? navigationRoutes.find((r) => r.recommended) ?? navigationRoutes[0];
    setActiveRoute(navRoute);
    navigate('/vehicle/navigation');
  };

  return (
    <div className="mobile-container pb-24">
      {/* Header */}
      <div className="bg-navy-800 text-white px-5 pt-12 pb-6 rounded-b-3xl">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-white/80 active:scale-95 mb-4">
          <ChevronLeft size={20} />
          <span className="text-sm">Back</span>
        </button>
        <div className="flex items-center gap-2">
          <Sparkles size={22} className="text-blue-400" />
          <h1 className="text-xl font-bold">Smart Route (QPSO)</h1>
        </div>
        <p className="text-white/60 text-sm mt-1">Finding the best route for you...</p>
      </div>

      {loading ? (
        <div className="px-5 pt-8">
          <LoadingState
            message="Optimizing routes..."
            subMessage="QPSO engine is analyzing traffic, distance, and road conditions"
          />
          {/* Animated route search visualization */}
          <div className="mt-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-20 rounded-2xl" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Routes */}
          <div className="px-5 pt-5 space-y-3">
            {result?.routes.map((route) => (
              <RouteCard
                key={route.id}
                route={route}
                selected={selectedRoute?.id === route.id}
                onSelect={() => setSelectedRoute(route)}
              />
            ))}
          </div>

          {/* Selected route summary */}
          {selectedRoute && (
            <div className="px-5 pt-5">
              <div className="bg-navy-800 rounded-2xl p-5 text-white shadow-lg animate-scale-in">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                    <Check size={14} className="text-white" strokeWidth={3} />
                  </div>
                  <h3 className="font-bold">Selected Route</h3>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-white/50">ETA</p>
                    <p className="font-bold text-lg">{selectedRoute.duration}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/50">Distance</p>
                    <p className="font-bold text-lg">{selectedRoute.distance}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/50">Traffic</p>
                    <p className="font-bold text-lg capitalize text-green-400">{selectedRoute.traffic}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Start button */}
          <div className="px-5 pt-5">
            <button
              onClick={handleStart}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Navigation size={20} />
              Start Route
            </button>
          </div>

          <div className="px-5 pt-4">
            <p className="text-center text-xs text-gray-400">
              Powered by Quantum-Inspired Particle Swarm Optimization (simulated)
            </p>
          </div>
        </>
      )}
    </div>
  );
}
