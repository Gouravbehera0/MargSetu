import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import CarLoadingSpinner from './CarLoadingSpinner';
import { useApp } from '@/context/AppContext';

// Friendly route subtitles to make each page load feel customized and high-tech
const ROUTE_SUBTITLES: Record<string, string> = {
  '/': 'Plotting Live Multimodal Network...',
  '/map': 'Loading Spatial Map Planner...',
  '/dashboard': 'Syncing System Telemetry & Swarm V2X...',
  '/navigate': 'Calibrating Turn-by-Turn GPS HUD...',
  '/routes': 'Evaluating Multi-Objective Pareto Optimal Paths...',
  '/vehicles': 'Tracking Connected Fleet & Emergency Units...',
  '/emergency': 'Establishing Green Corridor Priority Channels...',
  '/traffic': 'Simulating Quantum Particle Velocity Matrix...',
  '/incidents': 'Scanning Real-Time Incident Feeds...',
  '/optimization': 'Initializing QPSO Quantum Swarm Core...',
  '/benchmark': 'Running Benchmark Against Dijkstra & A*...',
  '/analytics': 'Aggregating Urban Travel & Emission Telemetry...',
  '/settings': 'Loading MargSetu System Configurations...',
  '/login': 'Securing Transportation Authentication...',
  '/roles': 'Preparing Role Clearance Gateway...',
  '/profile': 'Loading Citizen Travel Preferences & Profile...',
  '/citizen/profile': 'Loading Citizen Travel Preferences & Profile...',
  '/admin': 'Connecting to Master Traffic Command Center...',
};

function useIsMobileDevice() {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    return isMobileDevice || window.innerWidth < 768;
  });

  useEffect(() => {
    const handleResize = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileDevice || window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}

export default function PageLoadingOverlay() {
  const location = useLocation();
  const isMobile = useIsMobileDevice();
  const { isGlobalLoading, globalLoadingMessage, hideGlobalLoader } = useApp();

  const [visible, setVisible] = useState(true); // Start true for "loading effect at the starting"
  const [animatingOut, setAnimatingOut] = useState(false);
  const [message, setMessage] = useState('Loading...');
  const [subMessage, setSubMessage] = useState('MargSetu Intelligent Swarm Engine Initializing...');

  const isInitialMount = useRef(true);
  const prevPathname = useRef(location.pathname);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Initial Startup Loading Effect ("at the starting")
  useEffect(() => {
    // Show on initial mount for 1.8 seconds
    const initialTimer = setTimeout(() => {
      setAnimatingOut(true);
      setTimeout(() => {
        setVisible(false);
        setAnimatingOut(false);
        isInitialMount.current = false;
      }, 350); // Matches exit transition duration
    }, 1800);

    return () => clearTimeout(initialTimer);
  }, []);

  // 2. Page Navigation Loading Pop ("pops when the page is load")
  useEffect(() => {
    if (isInitialMount.current) return;

    // Trigger loading pop whenever the route changes
    if (prevPathname.current !== location.pathname) {
      prevPathname.current = location.pathname;

      // Select customized destination subtitle
      const nextSub = ROUTE_SUBTITLES[location.pathname] || 'Loading MargSetu Corridor...';
      setMessage('Loading...');
      setSubMessage(nextSub);
      setAnimatingOut(false);
      setVisible(true);

      if (timerRef.current) clearTimeout(timerRef.current);

      // Snappy, smooth 700ms page load pop
      timerRef.current = setTimeout(() => {
        setAnimatingOut(true);
        setTimeout(() => {
          setVisible(false);
          setAnimatingOut(false);
        }, 300);
      }, 700);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [location.pathname]);

  // 3. Programmatic global loading from AppContext (e.g. clicking "Optimize Route")
  useEffect(() => {
    if (isGlobalLoading) {
      setMessage('Loading...');
      if (globalLoadingMessage) setSubMessage(globalLoadingMessage);
      setAnimatingOut(false);
      setVisible(true);
    } else if (!isInitialMount.current && visible) {
      setAnimatingOut(true);
      const exitTimer = setTimeout(() => {
        setVisible(false);
        setAnimatingOut(false);
      }, 300);
      return () => clearTimeout(exitTimer);
    }
  }, [isGlobalLoading, globalLoadingMessage]);

  // 4. Heavy Background page blur management
  useEffect(() => {
    if (visible && !animatingOut) {
      document.body.classList.add('page-loading-active');
    } else {
      document.body.classList.remove('page-loading-active');
    }
    return () => {
      document.body.classList.remove('page-loading-active');
    };
  }, [visible, animatingOut]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300 ${
        animatingOut
          ? 'opacity-0 backdrop-blur-none pointer-events-none'
          : isMobile
          ? 'opacity-100 backdrop-blur-md'
          : 'opacity-100 backdrop-blur-2xl'
      }`}
      style={{
        backgroundColor: animatingOut
          ? 'transparent'
          : isMobile
          ? 'rgba(10, 17, 36, 0.58)'
          : 'rgba(10, 17, 36, 0.72)',
        backdropFilter: animatingOut ? 'none' : isMobile ? 'blur(10px)' : 'blur(20px)',
        WebkitBackdropFilter: animatingOut ? 'none' : isMobile ? 'blur(10px)' : 'blur(20px)',
      }}
      onClick={() => {
        // Allow user to click to dismiss if waiting
        if (!isInitialMount.current) {
          hideGlobalLoader?.();
          setAnimatingOut(true);
          setTimeout(() => setVisible(false), 250);
        }
      }}
    >
      {/* Pop Container Card with elastic spring entry */}
      <div
        className={`relative ${
          isMobile
            ? 'max-w-[250px] w-auto p-4 rounded-2xl'
            : 'max-w-[280px] w-auto p-6 rounded-3xl'
        } bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-white/30 dark:border-cyan-500/30 shadow-2xl flex flex-col items-center justify-center transform transition-all duration-300 ${
          animatingOut ? 'scale-95 opacity-0' : 'animate-loader-pop'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Core Animated Car in Circle Component */}
        <CarLoadingSpinner
          size="md"
          message={message}
          subMessage={subMessage}
        />

        {/* Small subtle badge at bottom */}
        <div
          className={`${
            isMobile ? 'mt-3 text-[9px] px-2.5 py-0.5' : 'mt-3.5 text-[10px] px-3 py-1'
          } flex items-center gap-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 font-semibold text-cyan-700 dark:text-cyan-300 uppercase tracking-wider`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          Smart Mobility Grid Active
        </div>
      </div>
    </div>
  );
}
