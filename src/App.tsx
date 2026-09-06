import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from '@/context/AppContext';

import SplashPage from '@/pages/SplashPage';
import LoginPage from '@/pages/LoginPage';
import RoleSelectionPage from '@/pages/RoleSelectionPage';

import CitizenHomePage from '@/pages/citizen/CitizenHomePage';
import EmergencyRequestPage from '@/pages/citizen/EmergencyRequestPage';
import TrackAmbulancePage from '@/pages/citizen/TrackAmbulancePage';
import LiveMapPage from '@/pages/citizen/LiveMapPage';
import CitizenAlertsPage from '@/pages/citizen/CitizenAlertsPage';
import NearbyServicesPage from '@/pages/citizen/NearbyServicesPage';
import CitizenProfilePage from '@/pages/citizen/CitizenProfilePage';

import VehicleDashboardPage from '@/pages/vehicle/VehicleDashboardPage';
import QPSOOptimizationPage from '@/pages/vehicle/QPSOOptimizationPage';
import DynamicReroutingPage from '@/pages/vehicle/DynamicReroutingPage';
import LiveNavigationPage from '@/pages/vehicle/LiveNavigationPage';
import VehicleMissionsPage from '@/pages/vehicle/VehicleMissionsPage';
import VehicleAlertsPage from '@/pages/vehicle/VehicleAlertsPage';
import VehicleProfilePage from '@/pages/vehicle/VehicleProfilePage';

import AdminControlCenterPage from '@/pages/admin/AdminControlCenterPage';
import ToastContainer from '@/components/Toast';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SplashPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/roles" element={<RoleSelectionPage />} />

          {/* Citizen routes */}
          <Route path="/citizen" element={<CitizenHomePage />} />
          <Route path="/citizen/request" element={<EmergencyRequestPage />} />
          <Route path="/citizen/tracking" element={<TrackAmbulancePage />} />
          <Route path="/citizen/map" element={<LiveMapPage />} />
          <Route path="/citizen/alerts" element={<CitizenAlertsPage />} />
          <Route path="/citizen/services" element={<NearbyServicesPage />} />
          <Route path="/citizen/profile" element={<CitizenProfilePage />} />

          {/* Vehicle routes */}
          <Route path="/vehicle" element={<VehicleDashboardPage />} />
          <Route path="/vehicle/optimization" element={<QPSOOptimizationPage />} />
          <Route path="/vehicle/navigation" element={<LiveNavigationPage />} />
          <Route path="/vehicle/reroute" element={<DynamicReroutingPage />} />
          <Route path="/vehicle/route" element={<DynamicReroutingPage />} />
          <Route path="/vehicle/missions" element={<VehicleMissionsPage />} />
          <Route path="/vehicle/alerts" element={<VehicleAlertsPage />} />
          <Route path="/vehicle/profile" element={<VehicleProfilePage />} />

          {/* Admin */}
          <Route path="/admin" element={<AdminControlCenterPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ToastContainer />
      </BrowserRouter>
    </AppProvider>
  );
}
