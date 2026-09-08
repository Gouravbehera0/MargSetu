import React from 'react';

interface CarLoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  subMessage?: string;
  showSmoke?: boolean;
  className?: string;
}

export default function CarLoadingSpinner({
  size = 'md',
  message = 'Loading...',
  subMessage = 'MargSetu Swarm Route Engine Initializing...',
  showSmoke = true,
  className = '',
}: CarLoadingSpinnerProps) {
  // Dimensions for different sizes
  const dimensions = {
    sm: { circle: 'w-32 h-32', text: 'text-sm', sub: 'text-xs', svg: 130 },
    md: { circle: 'w-48 h-48', text: 'text-base', sub: 'text-xs', svg: 190 },
    lg: { circle: 'w-60 h-60', text: 'text-lg', sub: 'text-sm', svg: 240 },
  }[size];

  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      {/* Outer ambient aura glow */}
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500/20 via-blue-600/20 to-emerald-400/15 blur-xl animate-pulse-glow" />

        {/* Decorative Rotating Orbital Ring */}
        <div className="absolute -inset-2 rounded-full border border-dashed border-cyan-400/30 animate-spin" style={{ animationDuration: '14s' }} />

        {/* Inner Circle Window Container */}
        <div
          className={`${dimensions.circle} relative rounded-full overflow-hidden shadow-2xl border-2 border-cyan-500/40 bg-gradient-to-b from-slate-900 via-slate-950 to-navy-950 flex items-center justify-center`}
        >
          {/* SVG Canvas with Car, Road, Smoke, Headlights & Wind */}
          <svg
            viewBox="0 0 200 200"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Circular clipping path to keep everything neat inside the circle */}
              <clipPath id="circleClip">
                <circle cx="100" cy="100" r="99" />
              </clipPath>

              {/* Sky / Scene Background Gradient */}
              <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0a1128" />
                <stop offset="60%" stopColor="#101f3c" />
                <stop offset="100%" stopColor="#09101f" />
              </linearGradient>

              {/* Car Body Gradient: Vibrant MargSetu Electric Blue & Cyan */}
              <linearGradient id="carBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="45%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#1d4ed8" />
              </linearGradient>

              {/* Car Roof Gradient */}
              <linearGradient id="carRoofGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#1e40af" />
              </linearGradient>

              {/* Car Glass Gradient */}
              <linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#0f172a" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0.6" />
              </linearGradient>

              {/* Headlight Conic Beam Gradient */}
              <linearGradient id="headlightBeam" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#fef08a" stopOpacity="0.6" />
                <stop offset="35%" stopColor="#fef08a" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
              </linearGradient>

              {/* Smoke Puff Soft Radial Gradient */}
              <radialGradient id="smokeGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f1f5f9" stopOpacity="0.9" />
                <stop offset="40%" stopColor="#cbd5e1" stopOpacity="0.6" />
                <stop offset="85%" stopColor="#94a3b8" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#64748b" stopOpacity="0" />
              </radialGradient>

              {/* Taillight Glow Filter */}
              <filter id="taillightGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            <g clipPath="url(#circleClip)">
              {/* Background Sky */}
              <rect x="0" y="0" width="200" height="200" fill="url(#skyGrad)" />

              {/* Distant horizon glow */}
              <ellipse cx="100" cy="130" rx="90" ry="25" fill="#0284c7" opacity="0.1" />

              {/* High-speed wind streaks */}
              <line x1="130" y1="45" x2="175" y2="45" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" className="animate-wind-1" opacity="0.6" />
              <line x1="150" y1="70" x2="190" y2="70" stroke="#60a5fa" strokeWidth="1" strokeLinecap="round" className="animate-wind-2" opacity="0.5" />
              <line x1="120" y1="90" x2="160" y2="90" stroke="#a7f3d0" strokeWidth="1" strokeLinecap="round" className="animate-wind-3" opacity="0.4" />

              {/* Asphalt Road */}
              <rect x="0" y="130" width="200" height="70" fill="#0b1120" />
              {/* Road curb boundary */}
              <line x1="0" y1="130" x2="200" y2="130" stroke="#334155" strokeWidth="2.5" />

              {/* Moving Road Lane Dashes (Continuous Infinite Scroll) */}
              <line
                x1="-40"
                y1="160"
                x2="240"
                y2="160"
                stroke="#e2e8f0"
                strokeWidth="3.5"
                strokeDasharray="18 14"
                strokeLinecap="round"
                className="animate-road-scroll"
                opacity="0.85"
              />

              {/* Secondary faint lane line */}
              <line
                x1="-40"
                y1="184"
                x2="240"
                y2="184"
                stroke="#475569"
                strokeWidth="1.5"
                strokeDasharray="10 16"
                className="animate-road-scroll"
                opacity="0.4"
              />

              {/* Realistic Exhaust Smoke Puffs (Emitting from rear exhaust pipe at x=61, y=124) */}
              {showSmoke && (
                <g id="exhaust-smoke-trail">
                  {/* Smoke Puff 1 */}
                  <g className="animate-smoke-1">
                    <circle cx="56" cy="123" r="5" fill="url(#smokeGrad)" />
                    <circle cx="53" cy="121" r="3.5" fill="url(#smokeGrad)" />
                  </g>
                  {/* Smoke Puff 2 (staggered delay) */}
                  <g className="animate-smoke-2">
                    <circle cx="55" cy="123" r="6" fill="url(#smokeGrad)" />
                    <circle cx="52" cy="125" r="4.5" fill="url(#smokeGrad)" />
                    <circle cx="49" cy="122" r="3" fill="url(#smokeGrad)" />
                  </g>
                  {/* Smoke Puff 3 (staggered delay) */}
                  <g className="animate-smoke-3">
                    <circle cx="56" cy="123" r="5.5" fill="url(#smokeGrad)" />
                    <circle cx="51" cy="124" r="4" fill="url(#smokeGrad)" />
                  </g>
                  {/* Smoke Puff 4 (staggered delay) */}
                  <g className="animate-smoke-4">
                    <circle cx="54" cy="123" r="6.5" fill="url(#smokeGrad)" />
                    <circle cx="49" cy="122" r="5" fill="url(#smokeGrad)" />
                  </g>
                </g>
              )}

              {/* Headlight Forward Beam (Shining ahead of the car) */}
              <polygon
                points="140,118 200,96 200,146 140,124"
                fill="url(#headlightBeam)"
              />

              {/* Car Ground Shadow (Pulsing micro-shadow) */}
              <ellipse
                cx="103"
                cy="133"
                rx="42"
                ry="4"
                fill="#000000"
                className="animate-car-shadow"
              />

              {/* Animated Car Body Group (Bouncing suspension vibration) */}
              <g className="animate-car-bounce">
                {/* Exhaust Pipe Tip */}
                <rect x="60" y="122.5" width="5" height="3" rx="1" fill="#94a3b8" />
                <ellipse cx="60" cy="124" rx="1" ry="1.5" fill="#334155" />

                {/* Main Car Body Chassis */}
                <path
                  d="M 64 122 
                     L 65 113 
                     C 66 111, 68 110, 71 110 
                     L 82 110 
                     L 92 101 
                     C 94 99, 96 99, 99 99 
                     L 122 99 
                     C 125 99, 128 101, 131 104 
                     L 141 113 
                     L 148 115 
                     C 151 116, 153 118, 153 121 
                     L 153 124 
                     C 153 126, 151 127, 149 127 
                     L 142 127 
                     C 142 122, 137 118, 131 118 
                     C 125 118, 120 122, 120 127 
                     L 96 127 
                     C 96 122, 91 118, 85 118 
                     C 79 118, 74 122, 74 127 
                     L 66 127 
                     C 64.5 127, 64 124, 64 122 Z"
                  fill="url(#carBodyGrad)"
                  stroke="#38bdf8"
                  strokeWidth="0.8"
                />

                {/* Sleek Upper Metallic Roof Curve */}
                <path
                  d="M 83 110 
                     L 93 102 
                     C 95 100, 97 100, 100 100 
                     L 121 100 
                     C 124 100, 127 102, 129 104 
                     L 138 111 Z"
                  fill="url(#carRoofGrad)"
                  opacity="0.9"
                />

                {/* Tinted Front & Side Glass Windows */}
                <path
                  d="M 95 103 
                     L 108 103 
                     L 108 111 
                     L 87 111 
                     C 90 107, 92 104, 95 103 Z"
                  fill="url(#glassGrad)"
                  stroke="#0284c7"
                  strokeWidth="0.5"
                />
                <path
                  d="M 111 103 
                     L 120 103 
                     C 122 103, 124 104, 125 106 
                     L 134 111 
                     L 111 111 Z"
                  fill="url(#glassGrad)"
                  stroke="#0284c7"
                  strokeWidth="0.5"
                />
                {/* Window Diagonal Gloss Reflection Line */}
                <line x1="97" y1="104" x2="104" y2="110" stroke="#ffffff" strokeWidth="1" opacity="0.6" strokeLinecap="round" />
                <line x1="114" y1="104" x2="122" y2="110" stroke="#ffffff" strokeWidth="1" opacity="0.6" strokeLinecap="round" />

                {/* Body Aerodynamic Accent Crease */}
                <line x1="72" y1="117" x2="142" y2="117" stroke="#67e8f9" strokeWidth="0.75" opacity="0.7" />

                {/* Front LED Projector Headlight */}
                <path
                  d="M 148 116 L 152 118 L 148 121 Z"
                  fill="#fef08a"
                />
                <circle cx="150.5" cy="119" r="1.8" fill="#ffffff" />

                {/* Rear Neon Red Taillight */}
                <rect
                  x="63.5"
                  y="114"
                  width="2.5"
                  height="5.5"
                  rx="1"
                  fill="#ef4444"
                  filter="url(#taillightGlow)"
                />
                {/* Taillight Core */}
                <rect x="64" y="115" width="1.5" height="3.5" rx="0.75" fill="#fca5a5" />

                {/* Door handle detail */}
                <rect x="105" y="114" width="5" height="1" rx="0.5" fill="#0f172a" />
              </g>

              {/* Rear Wheel Assembly (Center: 85, 127) */}
              <g>
                {/* Tire Rubber */}
                <circle cx="85" cy="127" r="8.5" fill="#0f172a" stroke="#1e293b" strokeWidth="1.5" />
                {/* Alloy Wheel Rim */}
                <circle cx="85" cy="127" r="5.5" fill="#334155" />
                {/* Spinning Alloy Wheel Spokes */}
                <g className="animate-wheel-spin">
                  <line x1="85" y1="122" x2="85" y2="132" stroke="#e2e8f0" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="80" y1="127" x2="90" y2="127" stroke="#e2e8f0" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="81.5" y1="123.5" x2="88.5" y2="130.5" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" />
                  <line x1="81.5" y1="130.5" x2="88.5" y2="123.5" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" />
                </g>
                {/* Hubcap Center */}
                <circle cx="85" cy="127" r="2" fill="#38bdf8" />
              </g>

              {/* Front Wheel Assembly (Center: 131, 127) */}
              <g>
                {/* Tire Rubber */}
                <circle cx="131" cy="127" r="8.5" fill="#0f172a" stroke="#1e293b" strokeWidth="1.5" />
                {/* Alloy Wheel Rim */}
                <circle cx="131" cy="127" r="5.5" fill="#334155" />
                {/* Spinning Alloy Wheel Spokes */}
                <g className="animate-wheel-spin">
                  <line x1="131" y1="122" x2="131" y2="132" stroke="#e2e8f0" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="126" y1="127" x2="136" y2="127" stroke="#e2e8f0" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="127.5" y1="123.5" x2="134.5" y2="130.5" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" />
                  <line x1="127.5" y1="130.5" x2="134.5" y2="123.5" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" />
                </g>
                {/* Hubcap Center */}
                <circle cx="131" cy="127" r="2" fill="#38bdf8" />
              </g>
            </g>

            {/* Glowing Border Ring */}
            <circle
              cx="100"
              cy="100"
              r="98"
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2"
              opacity="0.75"
            />
          </svg>
        </div>
      </div>

      {/* Typography: "Loading..." with animated bouncing dots */}
      <div className="mt-5 flex flex-col items-center text-center">
        <div className={`font-bold tracking-widest text-slate-800 dark:text-white uppercase flex items-center gap-0.5 ${dimensions.text}`}>
          <span>{message.replace(/\.+$/, '')}</span>
          <span className="inline-flex items-center ml-0.5">
            <span className="animate-dot-1 inline-block text-cyan-500 font-extrabold text-xl leading-none">.</span>
            <span className="animate-dot-2 inline-block text-blue-500 font-extrabold text-xl leading-none">.</span>
            <span className="animate-dot-3 inline-block text-emerald-500 font-extrabold text-xl leading-none">.</span>
          </span>
        </div>

        {subMessage && (
          <p className={`mt-1 font-medium text-slate-500 dark:text-slate-400 max-w-xs transition-opacity duration-300 ${dimensions.sub}`}>
            {subMessage}
          </p>
        )}

        {/* Micro glowing progress tracker */}
        <div className="mt-3 w-36 h-1 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden relative">
          <div
            className="absolute top-0 bottom-0 left-0 rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400 animate-shimmer w-full"
            style={{ animationDuration: '1.6s' }}
          />
        </div>
      </div>
    </div>
  );
}
