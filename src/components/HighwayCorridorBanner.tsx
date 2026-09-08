import { useState } from 'react';
import highwayMovingVehiclesImg from '@/assets/highway_moving_vehicles.jpg';
import heroHighwayImg from '@/assets/hero-highway.jpg';
import {
  Car,
  Siren,
  Truck,
  Bus,
  Activity,
  Zap,
  ChevronUp,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  Radio,
  Sun,
  Moon
} from 'lucide-react';

export default function HighwayCorridorBanner() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedScene, setSelectedScene] = useState<'night' | 'day'>('night');

  const activeImage = selectedScene === 'night' ? highwayMovingVehiclesImg : heroHighwayImg;

  return (
    <div className="relative w-full overflow-hidden bg-slate-950 -mt-14 sm:-mt-16 transition-all duration-300 select-none z-0 border-b border-slate-800/80">
      {/* Highway Image Container extending behind the floating navbar */}
      <div
        className={`relative w-full transition-all duration-500 ease-in-out ${
          isCollapsed ? 'h-36 sm:h-40' : 'h-80 sm:h-96 lg:h-[28rem]'
        }`}
      >
        <img
          key={selectedScene}
          src={activeImage}
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/images/highway_moving_vehicles.jpg';
          }}
          alt="Multi-lane smart highway transportation corridor with moving vehicles"
          className={`w-full h-full object-cover object-center transform transition-all duration-700 ${
            isCollapsed ? 'scale-105 opacity-55 brightness-75' : 'scale-100 opacity-95 brightness-[0.82] contrast-105'
          }`}
        />

        {/* 20-30% Dark Tint Overlay: Provides crisp contrast for overlay cards without obscuring vehicles or lights */}
        <div className="absolute inset-0 bg-slate-950/25 pointer-events-none" />

        {/* Soft edge blend gradients to float navbar and blend bottom with page */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/55 via-transparent to-slate-950/75 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/25 via-transparent to-slate-950/25 pointer-events-none" />


        {/* Subtle dynamic lane glow lines */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
          <div className="absolute bottom-0 left-1/4 w-0.5 h-32 bg-gradient-to-t from-cyan-400 to-transparent animate-pulse" />
          <div className="absolute bottom-0 left-1/3 w-0.5 h-44 bg-gradient-to-t from-blue-400 to-transparent animate-pulse delay-300" />
          <div className="absolute bottom-0 right-1/3 w-0.5 h-36 bg-gradient-to-t from-amber-400 to-transparent animate-pulse delay-500" />
          <div className="absolute bottom-0 right-1/4 w-0.5 h-48 bg-gradient-to-t from-emerald-400 to-transparent animate-pulse delay-700" />
        </div>

        {/* Foreground Content & Live Telemetry Overlays */}
        {/* Note the pt-16 sm:pt-20 padding ensures content sits below the floating navbar */}
        <div className="absolute inset-0 max-w-7xl mx-auto px-4 sm:px-6 flex flex-col justify-between pt-16 sm:pt-20 pb-3 sm:pb-4">
          {/* Top Info Bar inside Banner */}
          <div className="flex items-center justify-between z-10 flex-wrap gap-2">
            <div className="flex items-center space-x-2.5">
              <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-500/30 border border-cyan-400/50 text-cyan-300 backdrop-blur-md shadow-lg">
                <Radio className="w-4 h-4 text-cyan-300 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs sm:text-sm font-black text-white tracking-wide uppercase flex items-center gap-1.5 drop-shadow-lg">
                    Live Highway Transportation Grid
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  </span>
                  <span className="hidden md:inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 backdrop-blur-md shadow-sm">
                    V2X Connected Highway
                  </span>
                </div>
                {!isCollapsed && (
                  <p className="text-[11px] text-slate-100 font-medium hidden sm:block mt-0.5 drop-shadow-md">
                    All vehicle classes tracked in real time • Dedicated emergency priority lane &amp; autonomous swarm flow
                  </p>
                )}
              </div>
            </div>

            {/* Top controls: Scene switcher & Expand/Collapse */}
            <div className="flex items-center space-x-2">
              {/* Day / Night Scene Toggle */}
              <button
                onClick={() => setSelectedScene(selectedScene === 'night' ? 'day' : 'night')}
                className="px-2.5 py-1 sm:py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 text-slate-200 hover:text-white border border-slate-700/60 text-xs font-bold backdrop-blur-md transition-all flex items-center space-x-1.5 shadow-md"
                title="Switch highway camera view (Day / Night)"
              >
                {selectedScene === 'night' ? (
                  <>
                    <Moon className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-[11px]">Night Corridor</span>
                  </>
                ) : (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[11px]">Day Corridor</span>
                  </>
                )}
              </button>

              {/* Toggle button to expand/collapse banner */}
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="px-2.5 py-1 sm:py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 text-slate-200 hover:text-white border border-slate-700/60 text-xs font-bold backdrop-blur-md transition-all flex items-center space-x-1.5 shadow-md group"
                title={isCollapsed ? 'Expand highway banner' : 'Collapse highway banner'}
              >
                <span>{isCollapsed ? 'Expand View' : 'Minimize'}</span>
                {isCollapsed ? (
                  <ChevronDown className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-y-0.5 transition-transform" />
                ) : (
                  <ChevronUp className="w-3.5 h-3.5 text-cyan-400 group-hover:-translate-y-0.5 transition-transform" />
                )}
              </button>
            </div>
          </div>


          {/* Expanded Bottom Telemetry Deck (Hidden when collapsed) */}
          {!isCollapsed && (
            <div className="z-10 mt-auto pt-3">
              {/* Vehicle Class Badges Streaming along the Highway */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {/* 1. Emergency Ambulance Clearway */}
                <div className="bg-slate-950/80 hover:bg-slate-900/90 backdrop-blur-md rounded-xl p-2.5 border border-red-500/40 flex items-center space-x-2.5 shadow-xl transition-all group">
                  <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0 border border-red-500/40 group-hover:scale-105 transition-transform">
                    <Siren className="w-4 h-4 text-red-400 animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-white truncate flex items-center gap-1">
                      <span>Emergency Clearway</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                    </div>
                    <div className="text-[10px] text-red-300 font-semibold truncate">Lane 1 • Green Corridor Active</div>
                  </div>
                </div>

                {/* 2. Rapid Public Transit / Electric Bus */}
                <div className="bg-slate-950/80 hover:bg-slate-900/90 backdrop-blur-md rounded-xl p-2.5 border border-cyan-500/40 flex items-center space-x-2.5 shadow-xl transition-all group">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center shrink-0 border border-cyan-500/40 group-hover:scale-105 transition-transform">
                    <Bus className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-white truncate">Electric Transit Bus</div>
                    <div className="text-[10px] text-cyan-300 font-semibold truncate">Lane 2 • 84 km/h Cruise</div>
                  </div>
                </div>

                {/* 3. Connected Freight & Logistics Truck */}
                <div className="bg-slate-950/80 hover:bg-slate-900/90 backdrop-blur-md rounded-xl p-2.5 border border-amber-500/40 flex items-center space-x-2.5 shadow-xl transition-all group">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0 border border-amber-500/40 group-hover:scale-105 transition-transform">
                    <Truck className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-white truncate">Commercial Fleet</div>
                    <div className="text-[10px] text-amber-300 font-semibold truncate">Lane 3 • Platooning Active</div>
                  </div>
                </div>

                {/* 4. Connected Smart Cars */}
                <div className="bg-slate-950/80 hover:bg-slate-900/90 backdrop-blur-md rounded-xl p-2.5 border border-emerald-500/40 flex items-center space-x-2.5 shadow-xl transition-all group">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-500/40 group-hover:scale-105 transition-transform">
                    <Car className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-white truncate">Commuter Stream</div>
                    <div className="text-[10px] text-emerald-300 font-semibold truncate">Optimal QPSO Velocity</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
