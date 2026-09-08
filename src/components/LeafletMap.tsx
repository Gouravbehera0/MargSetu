import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { GeoPoint, GeneralVehicleType } from '@/types';

interface LeafletMapProps {
  origin?: GeoPoint | null;
  destination?: GeoPoint | null;
  primaryRoute?: [number, number][];
  alternativeRoutes?: [number, number][][];
  vehicleLocation?: GeoPoint | null;
  vehicleType?: GeneralVehicleType;
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
