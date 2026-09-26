import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import type { GeoPoint, GeneralVehicleType, ActiveAmbulanceAlertData, RoadSegmentIntelligence } from '@/types';
import { Plus, Minus, Crosshair, Siren, MapPin, Activity } from 'lucide-react';
import { fetchTrafficStatuses } from '@/services/apiService';

interface LeafletMapProps {
  origin?: GeoPoint | null;
  destination?: GeoPoint | null;
  primaryRoute?: [number, number][];
  alternativeRoutes?: [number, number][][];
  vehicleLocation?: GeoPoint | null;
  vehicleType?: GeneralVehicleType;
  activeAmbulanceAlert?: ActiveAmbulanceAlertData | null;
  incidents?: Array<{ id: string; lat: number; lng: number; label: string; type: string }>;
  citizens?: Array<{ id: string; lat: number; lng: number; label: string }>;
  alertRadiusMeters?: number;
  showEmergencyRadius?: boolean;
  className?: string;
  zoom?: number;
  center?: [number, number];
  onMapClick?: (lat: number, lng: number) => void;
  onSelectAlternative?: (index: number) => void;
  showTrafficLayer?: boolean;
  trafficSegments?: any[];
  onSegmentClick?: (segment: any) => void;
}

export default function LeafletMap({
  origin,
  destination,
  primaryRoute,
  alternativeRoutes = [],
  vehicleLocation,
  vehicleType = 'car',
  activeAmbulanceAlert,
  incidents = [],
  citizens = [],
  alertRadiusMeters = 500,
  showEmergencyRadius = false,
  className = 'h-96 w-full rounded-2xl',
  zoom = 13,
  center = [20.285, 85.83],
  onMapClick,
  onSelectAlternative,
  showTrafficLayer = true,
  trafficSegments,
  onSegmentClick
}: LeafletMapProps) {

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const routeBoundsRef = useRef<L.LatLngBounds | null>(null);
  const lastRouteKeyRef = useRef<string>('');
  const [currentZoom, setCurrentZoom] = useState<number>(zoom);
  const [trafficEnabled, setTrafficEnabled] = useState<boolean>(showTrafficLayer);
  const [internalTrafficSegments, setInternalTrafficSegments] = useState<any[]>(trafficSegments || []);

  useEffect(() => {
    if (trafficSegments && trafficSegments.length > 0) {
      setInternalTrafficSegments(trafficSegments);
    } else {
      fetchTrafficStatuses().then((data) => {
        if (data && data.length > 0) {
          setInternalTrafficSegments(data);
        }
      });
    }
  }, [trafficSegments]);

  // Initialize Map with Smooth Fractional Zooming
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    const initialCenter: [number, number] = origin
      ? [origin.lat, origin.lng]
      : center;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,       // Controlled via smooth modern floating widget
      attributionControl: false,
      zoomSnap: 0.25,           // Fractional zoom increments for buttery precision
      zoomDelta: 0.5,           // Smooth half-step on zoom actions
      wheelPxPerZoomLevel: 120, // Controlled, fluid mouse wheel & trackpad pinch zoom
      wheelDebounceTime: 40,    // Debounce to prevent scroll wheel stutter
      zoomAnimation: true,
      zoomAnimationThreshold: 5,
      fadeAnimation: true,
      markerZoomAnimation: true,
      inertia: true,
      inertiaDeceleration: 3000,
      inertiaMaxSpeed: 2000,
      easeLinearity: 0.2
    }).setView(initialCenter, zoom);

    map.on('zoomend', () => {
      setCurrentZoom(Math.round(map.getZoom() * 10) / 10);
    });

    // 100% Free, OpenStreetMap Standard Tiles (Zero API Key, Zero Watermarks)
    const baseTileLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });

    baseTileLayer.on('tileerror', () => {
      // High-availability fallback to Humanitarian OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: 'ab'
      }).addTo(map);
    });

    baseTileLayer.addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;
    mapInstanceRef.current = map;

    if (onMapClick) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        onMapClick(e.latlng.lat, e.latlng.lng);
      });
    }

    // Crucial: Invalidate size on initial mount and after layout render to eliminate gray tile areas
    const initTimer1 = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 150);

    const initTimer2 = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 450);

    // Continuous container resize observer to prevent any gray tile gaps when layout or window adjusts
    let resizeObserver: ResizeObserver | null = null;
    if (window.ResizeObserver && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      clearTimeout(initTimer1);
      clearTimeout(initTimer2);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Layers & Elements
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layers = layerGroupRef.current;
    if (!map || !layers) return;

    layers.clearLayers();

    const boundsPoints: L.LatLngExpression[] = [];

    // 0. Render AI Traffic Flow Layer (Green / Yellow / Orange / Red)
    if (trafficEnabled && internalTrafficSegments && internalTrafficSegments.length > 0) {
      internalTrafficSegments.forEach((seg) => {
        if (seg.coordinates && seg.coordinates.length >= 2) {
          const levelStr = (seg.traffic_level || 'Normal').toString().toLowerCase();
          let color = '#22c55e'; // Normal (Green)
          if (levelStr === 'moderate' || levelStr === 'medium') color = '#eab308'; // Moderate (Yellow)
          else if (levelStr === 'heavy' || levelStr === 'high') color = '#f97316'; // Heavy (Orange)
          else if (levelStr === 'severe' || levelStr === 'blocked') color = '#ef4444'; // Severe (Red)

          const refSpeed = seg.reference_speed_kmh || seg.speed_limit_kmh || 45;
          const currSpeed = seg.current_average_speed_kmh !== undefined ? seg.current_average_speed_kmh : Math.round(refSpeed * (1 - (seg.congestion_factor || 0.1)));
          const obsCount = seg.observations_count !== undefined ? seg.observations_count : (seg.active_observations || 0);
          const congScore = seg.congestion_score !== undefined ? seg.congestion_score : Math.round((seg.congestion_factor || 0.1) * 100);
          const confScore = seg.confidence_score !== undefined ? seg.confidence_score : 85;
          const roadName = seg.road_name || seg.name || 'Road Segment';
          const displayLevel = seg.traffic_level ? (seg.traffic_level.charAt(0).toUpperCase() + seg.traffic_level.slice(1)) : 'Normal';

          const trafficPoly = L.polyline(seg.coordinates, {
            color: color,
            weight: 6,
            opacity: 0.82,
            lineCap: 'round',
            lineJoin: 'round'
          }).bindPopup(`
            <div class="p-2.5 font-sans min-w-[210px] text-slate-800">
              <div class="flex items-center justify-between pb-1.5 border-b border-slate-100">
                <span class="font-bold text-xs text-slate-900">${roadName}</span>
                <span class="text-[10px] px-1.5 py-0.5 rounded font-black uppercase" style="background-color: ${color}22; color: ${color}">${displayLevel}</span>
              </div>
              <div class="mt-2 space-y-1.5 text-xs">
                <div class="flex justify-between">
                  <span class="text-slate-500">Reference Speed:</span>
                  <span class="font-semibold text-slate-700">${refSpeed} km/h</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-500">Current Average Speed:</span>
                  <span class="font-bold" style="color: ${color}">${currSpeed} km/h</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-500">Observations:</span>
                  <span class="font-semibold text-slate-700">${obsCount}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-500">Traffic Level:</span>
                  <span class="font-bold" style="color: ${color}">${displayLevel}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-500">Congestion Score:</span>
                  <span class="font-bold text-slate-800">${congScore}/100</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-500">Confidence:</span>
                  <span class="font-semibold text-emerald-600">${confScore}%</span>
                </div>
              </div>
            </div>
          `);

          if (onSegmentClick) {
            trafficPoly.on('click', () => {
              onSegmentClick(seg);
            });
          }

          layers.addLayer(trafficPoly);
        }
      });
    }

    // 1. Render Alternative Candidate Routes with distinctive colors
    const altPalette = [
      { color: '#f59e0b', label: 'Corridor B (Sector Arterial)' }, // Amber/Gold
      { color: '#8b5cf6', label: 'Corridor C (Perimeter Bypass)' }, // Purple/Indigo
      { color: '#06b6d4', label: 'Corridor D (Expressway Link)' }   // Cyan
    ];

    alternativeRoutes.forEach((altRoute, idx) => {
      if (altRoute && altRoute.length >= 2) {
        const itemStyle = altPalette[idx % altPalette.length];
        const poly = L.polyline(altRoute, {
          color: itemStyle.color,
          weight: 5,
          opacity: 0.85,
          dashArray: '8, 6',
          lineCap: 'round',
          lineJoin: 'round'
        }).bindPopup(`
          <div class="p-1 font-sans text-xs">
            <strong style="color: ${itemStyle.color}">📍 ${itemStyle.label}</strong>
            <p class="text-slate-500 text-[11px] mt-0.5">Click candidate card in panel to preview</p>
          </div>
        `);

        if (onSelectAlternative) {
          poly.on('click', () => {
            onSelectAlternative(idx);
          });
        }

        layers.addLayer(poly);

        // Include midpoint to ensure all corridors fit within map view
        boundsPoints.push(altRoute[Math.floor(altRoute.length / 2)]);
      }
    });

    // 2. Render Primary Optimized Route
    if (primaryRoute && primaryRoute.length >= 2) {
      const isEmergency = ['ambulance', 'fire', 'police'].includes(vehicleType);
      const mainColor = isEmergency ? '#dc2626' : '#2563eb';

      const poly = L.polyline(primaryRoute, {
        color: mainColor,
        weight: 6,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round'
      }).bindPopup(
        `<div class="p-1 font-sans text-xs"><strong>${isEmergency ? '🚨 Emergency Priority Route' : '✨ QPSO Optimized Route'}</strong></div>`
      );
      layers.addLayer(poly);
      primaryRoute.forEach((pt) => boundsPoints.push(pt));
    }

    // 3. Render Origin Marker
    if (origin) {
      const originIcon = L.divIcon({
        className: 'custom-origin-pin',
        html: `
          <div class="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs border-2 border-white shadow-lg">
            A
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });
      const marker = L.marker([origin.lat, origin.lng], { icon: originIcon })
        .bindPopup(`<b>Origin:</b> ${origin.name || 'Start Point'}`);
      layers.addLayer(marker);
      boundsPoints.push([origin.lat, origin.lng]);
    }

    // 4. Render Destination Marker
    if (destination) {
      const destIcon = L.divIcon({
        className: 'custom-dest-pin',
        html: `
          <div class="flex items-center justify-center w-7 h-7 rounded-full bg-rose-600 text-white font-bold text-xs border-2 border-white shadow-lg">
            B
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });
      const marker = L.marker([destination.lat, destination.lng], { icon: destIcon })
        .bindPopup(`<b>Destination:</b> ${destination.name || 'Target Destination'}`);
      layers.addLayer(marker);
      boundsPoints.push([destination.lat, destination.lng]);
    }

    // 5. Render Active Vehicle & Give-Way Circle
    if (vehicleLocation) {
      const isEmergency = ['ambulance', 'fire', 'police'].includes(vehicleType);
      const emojiMap: Record<string, string> = {
        car: '🚗',
        bike: '🏍️',
        bus: '🚌',
        truck: '🚚',
        taxi: '🚕',
        delivery: '📦',
        ambulance: '🚑',
        fire: '🚒',
        police: '🚓'
      };

      const vehIcon = L.divIcon({
        className: 'custom-vehicle-pin',
        html: `
          <div class="relative flex items-center justify-center w-9 h-9 rounded-full ${
            isEmergency ? 'bg-red-600 ring-4 ring-red-300 animate-pulse' : 'bg-slate-900 ring-2 ring-white'
          } text-lg shadow-xl">
            ${emojiMap[vehicleType] || '🚗'}
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });
      const vehMarker = L.marker([vehicleLocation.lat, vehicleLocation.lng], { icon: vehIcon })
        .bindPopup(`<b>${vehicleType.toUpperCase()}</b><br/>Speed: 60 km/h`);
      layers.addLayer(vehMarker);
      boundsPoints.push([vehicleLocation.lat, vehicleLocation.lng]);

      // Give-Way Proximity Radius Circle
      if (showEmergencyRadius && isEmergency) {
        const circle = L.circle([vehicleLocation.lat, vehicleLocation.lng], {
          radius: alertRadiusMeters,
          color: '#ef4444',
          fillColor: '#f87171',
          fillOpacity: 0.18,
          weight: 2,
          dashArray: '4, 4'
        }).bindPopup(`<b>Citizen Give-Way Alert Radius</b><br/>${alertRadiusMeters} meters corridor clearance`);
        layers.addLayer(circle);
      }
    }

    // 6. Render Incidents
    incidents.forEach((inc) => {
      const incIcon = L.divIcon({
        className: 'custom-incident-pin',
        html: `
          <div class="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-white font-bold text-xs border border-white shadow">
            ⚠️
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      const incMarker = L.marker([inc.lat, inc.lng], { icon: incIcon })
        .bindPopup(`<b>Incident:</b> ${inc.label}`);
      layers.addLayer(incMarker);
    });

    // 7. Render Citizens
    citizens.forEach((cit) => {
      const citIcon = L.divIcon({
        className: 'custom-citizen-pin',
        html: `
          <div class="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-600 text-white font-bold text-[10px] border border-white shadow">
            👤
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });
      const citMarker = L.marker([cit.lat, cit.lng], { icon: citIcon })
        .bindPopup(`<b>Citizen:</b> ${cit.label}`);
      layers.addLayer(citMarker);
    });

    // 8. Render Active Ambulance Emergency Clearway Corridor, Direction Arrow, Moving Marker & ETA
    if (activeAmbulanceAlert && activeAmbulanceAlert.has_active_ambulance && activeAmbulanceAlert.is_relevant_to_user) {
      const ambRoute = activeAmbulanceAlert.active_route_geometry;
      if (ambRoute && ambRoute.length >= 2) {
        // Outer glowing red aura
        const glowPoly = L.polyline(ambRoute, {
          color: '#ef4444',
          weight: 12,
          opacity: 0.38,
          lineCap: 'round',
          lineJoin: 'round'
        });
        layers.addLayer(glowPoly);

        // Core emergency clearway line
        const corePoly = L.polyline(ambRoute, {
          color: '#dc2626',
          weight: 5,
          opacity: 0.92,
          lineCap: 'round',
          lineJoin: 'round'
        });
        layers.addLayer(corePoly);

        // Inner dashed white line for clearway distinction
        const stripePoly = L.polyline(ambRoute, {
          color: '#ffffff',
          weight: 2,
          opacity: 0.95,
          dashArray: '6, 8',
          lineCap: 'round'
        }).bindPopup(`
          <div class="p-1 font-sans text-xs">
            <strong style="color: #dc2626;">🚨 Emergency Clearway Corridor</strong>
            <p class="text-slate-600 text-[11px] mt-0.5">Active priority route for <b>${activeAmbulanceAlert.vehicle_code || 'AMB-108'}</b></p>
          </div>
        `);
        layers.addLayer(stripePoly);
      }

      // Moving Ambulance Marker with Direction Arrow and Distance / ETA Tag
      if (activeAmbulanceAlert.ambulance_location) {
        const ambLoc = activeAmbulanceAlert.ambulance_location;
        const heading = activeAmbulanceAlert.heading_degrees || 0;
        const code = activeAmbulanceAlert.vehicle_code || 'AMB-108';
        const speed = activeAmbulanceAlert.speed_kmh || 70;
        const dist = activeAmbulanceAlert.distance_meters || 0;
        const eta = activeAmbulanceAlert.eta_seconds || 0;
        const compass = activeAmbulanceAlert.heading_direction || 'North';

        const ambIcon = L.divIcon({
          className: 'custom-ambulance-live-pin',
          html: `
            <div style="position: relative; width: 46px; height: 46px; display: flex; align-items: center; justify-content: center;">
              <!-- Pulsing Siren Strobe Halo -->
              <div style="position: absolute; inset: -5px; border-radius: 9999px; background: rgba(239, 68, 68, 0.45); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="position: absolute; inset: -2px; border-radius: 9999px; background: rgba(220, 38, 38, 0.6); animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;"></div>

              <!-- Direction Arrow Pointer rotated by heading_degrees -->
              <div style="position: absolute; width: 46px; height: 46px; transform: rotate(${heading}deg); pointer-events: none; display: flex; justify-content: center;">
                <div style="width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-bottom: 15px solid #fbbf24; position: absolute; top: -9px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.85));"></div>
              </div>

              <!-- Central Ambulance Vehicle Bubble -->
              <div style="position: relative; z-index: 10; width: 36px; height: 36px; border-radius: 9999px; background: linear-gradient(135deg, #ef4444, #b91c1c); border: 2.5px solid #ffffff; box-shadow: 0 4px 14px rgba(220,38,38,0.65); display: flex; align-items: center; justify-content: center; font-size: 18px; cursor: pointer;">
                🚑
              </div>

              <!-- Floating Real-Time Distance & ETA Tag -->
              <div style="position: absolute; bottom: -20px; left: 50%; transform: translateX(-50%); white-space: nowrap; background: rgba(15, 23, 42, 0.95); color: #ffffff; font-size: 9px; font-weight: 800; padding: 2px 7px; border-radius: 9999px; border: 1px solid rgba(239, 68, 68, 0.8); box-shadow: 0 2px 6px rgba(0,0,0,0.45); display: flex; align-items: center; gap: 3px;">
                <span style="color: #ef4444;">🚨</span>
                <span>${code}</span>
                <span style="color: #4ade80;">• ${dist}m (${eta}s)</span>
              </div>
            </div>
          `,
          iconSize: [46, 46],
          iconAnchor: [23, 23]
        });

        const ambMarker = L.marker([ambLoc.lat, ambLoc.lng], { icon: ambIcon })
          .bindPopup(`
            <div style="font-family: inherit; font-size: 12px; padding: 4px; min-width: 190px;">
              <div style="display: flex; align-items: center; gap: 6px; font-weight: 900; color: #dc2626; font-size: 13px;">
                <span>🚑 ${code} (Active Mission)</span>
              </div>
              <div style="margin-top: 6px; font-size: 11px; color: #334155; line-height: 1.55;">
                <div><b>Speed:</b> ${speed} km/h</div>
                <div><b>Heading:</b> ${heading}° (${compass})</div>
                <div><b>Distance to user:</b> ${dist} m</div>
                <div><b>ETA to user:</b> ${eta} seconds</div>
                <div style="margin-top: 5px; color: #b91c1c; font-weight: 800; background: #fee2e2; padding: 3px 6px; border-radius: 4px;">
                  ⚠️ Emergency Give Way Alert in Effect
                </div>
              </div>
            </div>
          `);
        layers.addLayer(ambMarker);

        // Emergency Proximity Circle around ambulance
        if (activeAmbulanceAlert.is_relevant_to_user) {
          const ambRadiusCircle = L.circle([ambLoc.lat, ambLoc.lng], {
            radius: 400,
            color: '#ef4444',
            fillColor: '#f87171',
            fillOpacity: 0.12,
            weight: 1.5,
            dashArray: '4, 4'
          });
          layers.addLayer(ambRadiusCircle);
        }
      }
    }

    // Force size recalculation
    map.invalidateSize();

    // Cache route bounds for framing
    if (boundsPoints.length >= 2) {
      routeBoundsRef.current = L.latLngBounds(boundsPoints);
    }

    // Crucial: Only auto-fit bounds when route key actually changes (new origin, destination, or new route computed)
    // NEVER re-fit bounds on polling ticks or ambulance steps so user zoom and pan remain completely smooth and uninterrupted!
    const destStr = destination ? `${destination.lat.toFixed(4)},${destination.lng.toFixed(4)}` : 'none';
    const routeKey = `${origin?.lat.toFixed(4)},${origin?.lng.toFixed(4)}_${destStr}_${primaryRoute?.length || 0}_${alternativeRoutes.length}`;

    if (routeKey !== lastRouteKeyRef.current) {
      lastRouteKeyRef.current = routeKey;
      if (routeBoundsRef.current && routeBoundsRef.current.isValid() && boundsPoints.length >= 2) {
        try {
          map.fitBounds(routeBoundsRef.current, {
            padding: [45, 45],
            maxZoom: 15,
            animate: true
          });
        } catch (e) {}
      } else if (origin) {
        map.setView([origin.lat, origin.lng], 14);
      }
    }

    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [
    origin,
    destination,
    primaryRoute,
    alternativeRoutes,
    vehicleLocation,
    vehicleType,
    activeAmbulanceAlert,
    incidents,
    citizens,
    alertRadiusMeters,
    showEmergencyRadius,
    trafficEnabled,
    internalTrafficSegments,
    onSegmentClick
  ]);

  // Smooth Zoom & Framing Action Handlers
  const handleZoomIn = useCallback(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn(0.5, { animate: true });
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut(0.5, { animate: true });
    }
  }, []);

  const handleFitRoute = useCallback(() => {
    if (!mapInstanceRef.current) return;
    if (routeBoundsRef.current && routeBoundsRef.current.isValid()) {
      mapInstanceRef.current.flyToBounds(routeBoundsRef.current, {
        padding: [45, 45],
        maxZoom: 15.5,
        duration: 0.8,
        easeLinearity: 0.25
      });
    } else if (origin) {
      mapInstanceRef.current.flyTo([origin.lat, origin.lng], 13.5, { duration: 0.8 });
    }
  }, [origin]);

  const handleFocusAmbulance = useCallback(() => {
    if (!mapInstanceRef.current || !activeAmbulanceAlert?.ambulance_location) return;
    const loc = activeAmbulanceAlert.ambulance_location;
    mapInstanceRef.current.flyTo([loc.lat, loc.lng], 15.5, {
      duration: 0.9,
      easeLinearity: 0.2
    });
  }, [activeAmbulanceAlert]);

  return (
    <div
      className={`relative overflow-hidden shadow-inner border border-slate-200 z-0 ${className}`}
      style={{ isolation: 'isolate' }}
    >
      {/* Map Surface */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[350px]" />

      {/* Floating Traffic Flow Toggle Pill */}
      <div className="absolute top-3 right-3 z-[1000]">
        <button
          type="button"
          onClick={() => setTrafficEnabled((prev) => !prev)}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl shadow-lg border text-xs font-bold transition-all backdrop-blur-md cursor-pointer ${
            trafficEnabled
              ? 'bg-white/95 text-emerald-700 border-emerald-300 shadow-emerald-500/10'
              : 'bg-white/80 text-slate-500 border-slate-200 opacity-80'
          }`}
          title="Toggle Real-Time AI Traffic Flow Layer"
          aria-label="Toggle Traffic Flow"
        >
          <span className={`w-2 h-2 rounded-full ${trafficEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
          <span>Traffic Flow</span>
        </button>
      </div>

      {/* Floating Smooth Zoom & Framing Control Widget */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-col items-center bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden text-slate-700 divide-y divide-slate-100 select-none">
        {/* Zoom In */}
        <button
          type="button"
          onClick={handleZoomIn}
          className="p-2.5 hover:bg-slate-100 active:bg-slate-200 transition-all text-slate-700 hover:text-blue-600 focus:outline-none"
          title="Zoom In (+0.5x)"
          aria-label="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Current Zoom Level Display */}
        <div
          className="px-2 py-0.5 text-[10px] font-black text-slate-500 bg-slate-50/90 cursor-default tracking-tight"
          title={`Zoom Level: ${currentZoom}x`}
        >
          {currentZoom}x
        </div>

        {/* Zoom Out */}
        <button
          type="button"
          onClick={handleZoomOut}
          className="p-2.5 hover:bg-slate-100 active:bg-slate-200 transition-all text-slate-700 hover:text-blue-600 focus:outline-none"
          title="Zoom Out (-0.5x)"
          aria-label="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>

        {/* Fit Entire Route to Screen */}
        <button
          type="button"
          onClick={handleFitRoute}
          className="p-2.5 hover:bg-blue-50 active:bg-blue-100 transition-all text-slate-700 hover:text-blue-600 focus:outline-none"
          title="Frame Entire Route (Fit View)"
          aria-label="Fit Route"
        >
          <Crosshair className="w-4 h-4 text-blue-600" />
        </button>

        {/* Fly to Active Emergency Ambulance */}
        {activeAmbulanceAlert?.has_active_ambulance && activeAmbulanceAlert?.ambulance_location && (
          <button
            type="button"
            onClick={handleFocusAmbulance}
            className="p-2.5 hover:bg-red-50 active:bg-red-100 transition-all text-red-600 focus:outline-none group relative"
            title="Fly to Emergency Ambulance (🚑)"
            aria-label="Focus Ambulance"
          >
            <Siren className="w-4 h-4 text-red-600 animate-pulse" />
          </button>
        )}
      </div>
    </div>
  );
}
