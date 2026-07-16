import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router';
import { useEffectOnce } from 'react-use';
import Splash from './pages/Splash';
import Login from './pages/Login';

// Placeholder Pages (akan diimplementasikan bertahap)
import Overview from './pages/Overview';
import PredictiveMap from './pages/PredictiveMap';
import FleetDispatch from './pages/FleetDispatch';
import CitizenReports from './pages/CitizenReports';
import Zones from './pages/Zones';
import Monitoring from './pages/Monitoring';
import MasterData from './pages/MasterData';
import VolumePredictions from './pages/VolumePredictions';

// Layout
import AdminLayout from './components/layout/AdminLayout';
import './App.css';
import LandingPage from './pages/LandingPage';
import SensorDashboard from './pages/SensorDashboard';

// Komponen penolong untuk mereset posisi scroll ke atas pada setiap perubahan rute
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffectOnce(() => {
    // Memulai transisi pudar setelah 2 detik
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, 1500);

    // Menghapus splash screen sepenuhnya setelah transisi selesai (2.5 detik)
    const removeTimer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  });

  return (
    <>
      {/* Global Splash Screen Overlay */}
      {showSplash && (
        <div
          className={`fixed inset-0 z-1000 transition-opacity duration-500 ease-out ${
            isFading ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          <Splash />
        </div>
      )}

      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* Landing Page */}
          <Route path="/" element={<LandingPage />} />

          <Route path="/sensor" element={<SensorDashboard />} />

          {/* Auth Route */}
          <Route path="/login" element={<Login />} />

          {/* Admin Protected Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/overview" replace />} />
            <Route path="overview" element={<Overview />} />
            <Route path="map" element={<PredictiveMap />} />
            <Route path="fleet" element={<FleetDispatch />} />
            <Route path="reports" element={<CitizenReports />} />
            <Route path="monitoring" element={<Zones />} />
            <Route path="predictions" element={<VolumePredictions />} />
            <Route path="data" element={<MasterData />} />
          </Route>

          {/* Fallback Redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}
