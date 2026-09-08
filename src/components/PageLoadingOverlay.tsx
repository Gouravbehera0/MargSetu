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

export default function PageLoadingOverlay() {
  const location = useLocation();
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
          : 'opacity-100 backdrop-blur-2xl'
      }`}
      style={{
        backgroundColor: animatingOut ? 'transparent' : 'rgba(10, 17, 36, 0.72)',
        backdropFilter: animatingOut ? 'none' : 'blur(20px)',
        WebkitBackdropFilter: animatingOut ? 'none' : 'blur(20px)',
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
        className={`relative max-w-sm w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl p-8 border border-white/30 dark:border-cyan-500/30 shadow-2xl flex flex-col items-center justify-center transform transition-all duration-300 ${
          animatingOut ? 'scale-95 opacity-0' : 'animate-loader-pop'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Core Animated Car in Circle Component */}
        <CarLoadingSpinner
          size="md"
          message={message}
          subMessage={subMessage}
          showSmoke={true}
        />

        {/* Small subtle badge at bottom */}
        <div className="mt-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-semibold text-cyan-700 dark:text-cyan-300 uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          Smart Mobility Grid Active
        </div>
      </div>
    </div>
  );
}
