import React from 'react';

interface CarLoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  subMessage?: string;
  className?: string;
}

export default function CarLoadingSpinner({
  size = 'md',
  message = 'Loading...',
  subMessage = 'MargSetu Swarm Route Engine Initializing...',
  className = '',
}: CarLoadingSpinnerProps) {
  const dimensions = {
    sm: { circle: 'w-16 h-16', text: 'text-xs', sub: 'text-[10px]' },
    md: { circle: 'w-20 h-20 sm:w-28 sm:h-28', text: 'text-xs sm:text-sm', sub: 'text-[11px] sm:text-xs' },
    lg: { circle: 'w-28 h-28 sm:w-36 sm:h-36', text: 'text-sm sm:text-base', sub: 'text-xs sm:text-sm' },
  }[size];

  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      {/* Clean Circle Container with Moving Car Inside (Driving in place) */}
      <div
        className={`${dimensions.circle} relative rounded-full overflow-hidden shadow-xl border-2 border-cyan-500/50 bg-[#09101f] flex items-center justify-center`}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Clip everything strictly inside the circle */}
            <clipPath id="carCircleClip">
              <circle cx="50" cy="50" r="49" />
            </clipPath>

            {/* Car body gradient */}
            <linearGradient id="simpleCarBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>

            {/* Headlight beam gradient */}
            <linearGradient id="simpleHeadlightBeam" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fef08a" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#fef08a" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
            </linearGradient>
          </defs>

          <g clipPath="url(#carCircleClip)">
            {/* Dark Night Sky */}
            <rect x="0" y="0" width="100" height="100" fill="#09101f" />

            {/* Asphalt Road Surface */}
            <rect x="0" y="68" width="100" height="32" fill="#0b1120" />
            <line x1="0" y1="68" x2="100" y2="68" stroke="#334155" strokeWidth="1.5" />

            {/* Scrolling Road Lane Dash */}
            <line
              x1="-20"
              y1="82"
              x2="120"
              y2="82"
              stroke="#e2e8f0"
              strokeWidth="2.5"
              strokeDasharray="10 8"
              strokeLinecap="round"
              className="animate-road-scroll"
              opacity="0.85"
            />
            <line
              x1="-20"
              y1="92"
              x2="120"
              y2="92"
              stroke="#334155"
              strokeWidth="1.2"
              strokeDasharray="6 10"
              className="animate-road-scroll"
              opacity="0.45"
            />

            {/* Headlight Forward Beam */}
            <polygon
              points="70,58 100,48 100,74 70,62"
              fill="url(#simpleHeadlightBeam)"
            />

            {/* Car Ground Shadow */}
            <ellipse
              cx="50"
              cy="68.5"
              rx="23"
              ry="2"
              fill="#000000"
              opacity="0.6"
              className="animate-car-shadow"
            />

            {/* Car Driving in Place (Moving Still with Suspension Bounce) */}
            <g className="animate-car-bounce">
              {/* Car Body Chassis with wheel arch curves */}
              <path
                d="M 30 61 
                   L 31 56.5 
                   C 32 54.5, 33.5 54, 35.5 54 
                   L 40.5 54 
                   L 45.5 48.5 
                   C 46.5 47.5, 48 47, 49.5 47 
                   L 59.5 47 
                   C 61 47, 62.5 48, 64 49.5 
                   L 66.5 54 
                   L 68.5 55.5 
                   C 70 56.5, 71 57.5, 71 59 
                   L 71 61.5 
                   C 71 62.5, 70 62.5, 68.5 62.5 
                   L 66 62.5 
                   C 66 58.5, 56 58.5, 56 62.5 
                   L 44 62.5 
                   C 44 58.5, 34 58.5, 34 62.5 
                   L 30.5 62.5 
                   C 29.8 62.5, 29.5 61.8, 29.5 61 Z"
                fill="url(#simpleCarBodyGrad)"
                stroke="#38bdf8"
                strokeWidth="0.9"
                strokeLinejoin="round"
              />

              {/* Windows */}
              <polygon points="46,53.5 41.5,53.5 46,49 49,49" fill="#38bdf8" opacity="0.75" />
              <polygon points="50.5,49 59,49 63,53.5 50.5,53.5" fill="#67e8f9" opacity="0.85" />

              {/* Rear Wheel (Centered at x=39, y=63, radius=5, touches road at y=68) */}
              <g transform="translate(39, 63)">
                {/* Outer Rubber Tire */}
                <circle cx="0" cy="0" r="5" fill="#090d16" stroke="#1e293b" strokeWidth="1.2" />
                {/* Inner Rim Base */}
                <circle cx="0" cy="0" r="3.2" fill="#0f172a" stroke="#06b6d4" strokeWidth="0.8" />
                {/* Spinning Alloy Spokes (Pure SVG rotation around 0 0 0 - 100% stable!) */}
                <g>
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0 0 0"
                    to="360 0 0"
                    dur="0.45s"
                    repeatCount="indefinite"
                  />
                  <line x1="0" y1="-3" x2="0" y2="3" stroke="#38bdf8" strokeWidth="0.9" strokeLinecap="round" />
                  <line x1="-3" y1="0" x2="3" y2="0" stroke="#38bdf8" strokeWidth="0.9" strokeLinecap="round" />
                  <line x1="-2.1" y1="-2.1" x2="2.1" y2="2.1" stroke="#38bdf8" strokeWidth="0.7" strokeLinecap="round" />
                  <line x1="2.1" y1="-2.1" x2="-2.1" y2="2.1" stroke="#38bdf8" strokeWidth="0.7" strokeLinecap="round" />
                  <circle cx="0" cy="0" r="1.1" fill="#67e8f9" />
                </g>
              </g>

              {/* Front Wheel (Centered at x=61, y=63, radius=5, touches road at y=68) */}
              <g transform="translate(61, 63)">
                {/* Outer Rubber Tire */}
                <circle cx="0" cy="0" r="5" fill="#090d16" stroke="#1e293b" strokeWidth="1.2" />
                {/* Inner Rim Base */}
                <circle cx="0" cy="0" r="3.2" fill="#0f172a" stroke="#06b6d4" strokeWidth="0.8" />
                {/* Spinning Alloy Spokes (Pure SVG rotation around 0 0 0 - 100% stable!) */}
                <g>
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0 0 0"
                    to="360 0 0"
                    dur="0.45s"
                    repeatCount="indefinite"
                  />
                  <line x1="0" y1="-3" x2="0" y2="3" stroke="#38bdf8" strokeWidth="0.9" strokeLinecap="round" />
                  <line x1="-3" y1="0" x2="3" y2="0" stroke="#38bdf8" strokeWidth="0.9" strokeLinecap="round" />
                  <line x1="-2.1" y1="-2.1" x2="2.1" y2="2.1" stroke="#38bdf8" strokeWidth="0.7" strokeLinecap="round" />
                  <line x1="2.1" y1="-2.1" x2="-2.1" y2="2.1" stroke="#38bdf8" strokeWidth="0.7" strokeLinecap="round" />
                  <circle cx="0" cy="0" r="1.1" fill="#67e8f9" />
                </g>
              </g>

              {/* Taillight dot */}
              <circle cx="30" cy="57" r="1.2" fill="#ef4444" />

              {/* Headlight dot */}
              <circle cx="70.5" cy="58.5" r="1.2" fill="#fef08a" />
            </g>

            {/* Inner Border Rim */}
            <circle
              cx="50"
              cy="50"
              r="48.5"
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2"
              opacity="0.8"
            />
          </g>
        </svg>
      </div>

      {/* Typography: "Loading..." with animated bouncing dots */}
      <div className="mt-3.5 flex flex-col items-center text-center">
        <div className={`font-extrabold tracking-wider text-slate-800 dark:text-white uppercase flex items-center gap-0.5 ${dimensions.text}`}>
          <span>{message.replace(/\.+$/, '')}</span>
          <span className="inline-flex items-center ml-0.5">
            <span className="animate-dot-1 inline-block text-cyan-500 font-extrabold text-sm leading-none">.</span>
            <span className="animate-dot-2 inline-block text-blue-500 font-extrabold text-sm leading-none">.</span>
            <span className="animate-dot-3 inline-block text-emerald-500 font-extrabold text-sm leading-none">.</span>
          </span>
        </div>

        {subMessage && (
          <p className={`mt-1 font-medium text-slate-500 dark:text-slate-400 max-w-[220px] transition-opacity duration-300 line-clamp-2 ${dimensions.sub}`}>
            {subMessage}
          </p>
        )}

        {/* Micro glowing progress tracker */}
        <div className="mt-2.5 w-24 h-1 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden relative">
          <div
            className="absolute top-0 bottom-0 left-0 rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400 animate-shimmer w-full"
            style={{ animationDuration: '1.5s' }}
          />
        </div>
      </div>
    </div>
  );
}
