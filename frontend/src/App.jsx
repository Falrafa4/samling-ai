import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import Splash from './pages/Splash';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Aktivitas from './pages/Aktivitas';
import Mitra from './pages/Mitra';
import RiwayatMitra from './pages/RiwayatMitra';
import Tps from './pages/Tps';
import CariTruk from './pages/CariTruk';
import Akun from './pages/Akun';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Splash screen */}
        <Route path="/" element={<Splash />} />
        
        {/* Auth Route */}
        <Route path="/login" element={<Login />} />
        
        {/* Core Main Views */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/aktivitas" element={<Aktivitas />} />
        <Route path="/mitra" element={<Mitra />} />
        
        {/* Subpages / Detail Views */}
        <Route path="/riwayat-mitra" element={<RiwayatMitra />} />
        <Route path="/tps" element={<Tps />} />
        <Route path="/cari-truk" element={<CariTruk />} />
        <Route path="/akun" element={<Akun />} />

        {/* Fallback redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
