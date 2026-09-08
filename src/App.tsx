import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from '@/context/AppContext';

// Core Platforms & QPSO Routes
import UnifiedDashboardPage from '@/pages/UnifiedDashboardPage';
import MapPlannerPage from '@/pages/MapPlannerPage';
import NavigationHUDPage from '@/pages/NavigationHUDPage';
import RoutesComparisonPage from '@/pages/RoutesComparisonPage';
import VehiclesFleetPage from '@/pages/VehiclesFleetPage';
import EmergencyCommandPage from '@/pages/EmergencyCommandPage';
import TrafficSimulationPage from '@/pages/TrafficSimulationPage';
import IncidentsManagerPage from '@/pages/IncidentsManagerPage';
import QPSOVisualizerPage from '@/pages/QPSOVisualizerPage';
import AlgorithmBenchmarkPage from '@/pages/AlgorithmBenchmarkPage';
import AnalyticsDashboardPage from '@/pages/AnalyticsDashboardPage';
import PlatformSettingsPage from '@/pages/PlatformSettingsPage';

// Auth & Roles
import SplashPage from '@/pages/SplashPage';
import LoginPage from '@/pages/LoginPage';
import RoleSelectionPage from '@/pages/RoleSelectionPage';

// Citizen Mobile Views
import CitizenHomePage from '@/pages/citizen/CitizenHomePage';
import EmergencyRequestPage from '@/pages/citizen/EmergencyRequestPage';
import TrackAmbulancePage from '@/pages/citizen/TrackAmbulancePage';
import LiveMapPage from '@/pages/citizen/LiveMapPage';
import CitizenAlertsPage from '@/pages/citizen/CitizenAlertsPage';
import NearbyServicesPage from '@/pages/citizen/NearbyServicesPage';
import CitizenProfilePage from '@/pages/citizen/CitizenProfilePage';

// Vehicle Mobile Views
import VehicleDashboardPage from '@/pages/vehicle/VehicleDashboardPage';
import QPSOOptimizationPage from '@/pages/vehicle/QPSOOptimizationPage';
import DynamicReroutingPage from '@/pages/vehicle/DynamicReroutingPage';
import LiveNavigationPage from '@/pages/vehicle/LiveNavigationPage';
import VehicleMissionsPage from '@/pages/vehicle/VehicleMissionsPage';
import VehicleAlertsPage from '@/pages/vehicle/VehicleAlertsPage';
import VehicleProfilePage from '@/pages/vehicle/VehicleProfilePage';

// Admin Control Center
import AdminControlCenterPage from '@/pages/admin/AdminControlCenterPage';
import ToastContainer from '@/components/Toast';
import PageLoadingOverlay from '@/components/PageLoadingOverlay';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div id="app-main-content" className="min-h-screen flex flex-col">
          <Routes>
            {/* Main Intelligent Transportation Platform Pages */}
            <Route path="/" element={<MapPlannerPage />} />
            <Route path="/map" element={<MapPlannerPage />} />
            <Route path="/dashboard" element={<UnifiedDashboardPage />} />
            <Route path="/navigate" element={<NavigationHUDPage />} />
            <Route path="/routes" element={<RoutesComparisonPage />} />
            <Route path="/vehicles" element={<VehiclesFleetPage />} />
            <Route path="/emergency" element={<EmergencyCommandPage />} />
            <Route path="/traffic" element={<TrafficSimulationPage />} />
            <Route path="/incidents" element={<IncidentsManagerPage />} />
            <Route path="/optimization" element={<QPSOVisualizerPage />} />
            <Route path="/benchmark" element={<AlgorithmBenchmarkPage />} />
            <Route path="/analytics" element={<AnalyticsDashboardPage />} />
            <Route path="/settings" element={<PlatformSettingsPage />} />

            {/* Auth & Profile */}
            <Route path="/splash" element={<SplashPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/roles" element={<RoleSelectionPage />} />
            <Route path="/profile" element={<CitizenProfilePage />} />

            {/* Citizen Mobile Views */}
            <Route path="/citizen" element={<CitizenHomePage />} />
            <Route path="/citizen/request" element={<EmergencyRequestPage />} />
            <Route path="/citizen/tracking" element={<TrackAmbulancePage />} />
            <Route path="/citizen/map" element={<LiveMapPage />} />
            <Route path="/citizen/alerts" element={<CitizenAlertsPage />} />
            <Route path="/citizen/services" element={<NearbyServicesPage />} />
            <Route path="/citizen/profile" element={<CitizenProfilePage />} />

            {/* Vehicle Driver Views */}
            <Route path="/vehicle" element={<VehicleDashboardPage />} />
            <Route path="/vehicle/optimization" element={<QPSOOptimizationPage />} />
            <Route path="/vehicle/navigation" element={<LiveNavigationPage />} />
            <Route path="/vehicle/reroute" element={<DynamicReroutingPage />} />
            <Route path="/vehicle/route" element={<DynamicReroutingPage />} />
            <Route path="/vehicle/missions" element={<VehicleMissionsPage />} />
            <Route path="/vehicle/alerts" element={<VehicleAlertsPage />} />
            <Route path="/vehicle/profile" element={<VehicleProfilePage />} />

            {/* Admin Control Center View */}
            <Route path="/admin" element={<AdminControlCenterPage />} />

            <Route path="*" element={<Navigate to="/map" replace />} />
          </Routes>
        </div>
        <PageLoadingOverlay />
        <ToastContainer />
      </BrowserRouter>
    </AppProvider>
  );
}
