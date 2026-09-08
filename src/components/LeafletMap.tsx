import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { GeoPoint, GeneralVehicleType, ActiveAmbulanceAlertData } from '@/types';

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
  onSelectAlternative
}: LeafletMapProps) {

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    const initialCenter: [number, number] = origin
      ? [origin.lat, origin.lng]
      : center;

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: false
    }).setView(initialCenter, zoom);

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
    if (activeAmbulanceAlert && activeAmbulanceAlert.has_active_ambulance) {
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
        boundsPoints.push([ambLoc.lat, ambLoc.lng]);

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

    // Force size recalculation and auto fit bounds if route/points exist
    map.invalidateSize();

    if (boundsPoints.length >= 2) {
      try {
        map.fitBounds(L.latLngBounds(boundsPoints), {
          padding: [50, 50],
          maxZoom: 15,
          animate: true
        });
      } catch (e) {}
    } else if (origin) {
      map.setView([origin.lat, origin.lng], 13);
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
    showEmergencyRadius
  ]);


  return (
    <div
      className={`relative overflow-hidden shadow-inner border border-slate-200 z-0 ${className}`}
      style={{ isolation: 'isolate' }}
    >
      <div ref={mapContainerRef} className="w-full h-full min-h-[350px]" />
    </div>
  );
}
