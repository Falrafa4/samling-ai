import { useState } from 'react';
import { Navigate, Outlet } from 'react-router';
import { useLocalStorage } from 'react-use';
import Sidebar from './Sidebar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';

// Fungsi utilitas untuk memeriksa kedaluwarsa JWT secara lokal
function isTokenExpired(token) {
  if (!token) return true;
  try {
    let cleanToken = token;
    if (cleanToken.startsWith('"') && cleanToken.endsWith('"')) {
      cleanToken = JSON.parse(cleanToken);
    }
    
    const parts = cleanToken.split('.');
    if (parts.length !== 3) return true;
    
    const payload = JSON.parse(atob(parts[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  } catch (e) {
    return true;
  }
}

export default function AdminLayout() {
  const [adminToken] = useLocalStorage('admin_token', null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Jika token admin tidak ada di localStorage atau telah kedaluwarsa, bersihkan dan redirect
  if (!adminToken || isTokenExpired(adminToken)) {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-800 font-sans relative">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Menu */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto flex flex-col min-w-0">
        {/* Mobile Top Navigation */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shrink-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 focus:outline-none"
            aria-label="Buka menu"
          >
            <FontAwesomeIcon icon={faBars} className="text-xl" />
          </button>
          <img src="/img/SAMLING%20AI%20-%20WEB.png" alt="Samling AI" className="h-7 w-auto" />
          <div className="w-8 h-8 rounded-full bg-primary-100 border border-primary-200 flex items-center justify-center font-bold text-primary-600 text-sm">
            A
          </div>
        </div>

        <Outlet />
      </main>
    </div>
  );
}
