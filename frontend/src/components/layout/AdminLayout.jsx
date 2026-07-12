import { useState, useEffect, useRef } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router';
import { useLocalStorage } from 'react-use';
import Sidebar from './Sidebar';
import BottomNavigation from './BottomNavigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRightFromBracket, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import ConfirmModal from '../fragments/ConfirmModal';

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
  } catch (_e) {
    return true;
  }
}

export default function AdminLayout() {
  const [adminToken, setAdminToken] = useLocalStorage('admin_token', null);
  const [adminUser] = useLocalStorage('admin_user', null);
  const navigate = useNavigate();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const profileRef = useRef(null);

  const handleLogout = () => {
    setAdminToken(null);
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setLogoutConfirmOpen(false);
    navigate('/login');
  };

  // Close profile dropdown on click outside
  useEffect(() => {
    if (!isProfileOpen) return;
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, [isProfileOpen]);

  // Jika token admin tidak ada di localStorage atau telah kedaluwarsa, bersihkan dan redirect
  if (!adminToken || isTokenExpired(adminToken)) {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    return <Navigate to="/login" replace />;
  }

  const userInitial = adminUser?.name?.[0]?.toUpperCase() || 'A';
  const userName = adminUser?.name || 'Administrator';
  const userRole = adminUser?.role || 'Admin';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-800 font-sans relative">
      {/* Sidebar — desktop only (hidden on mobile via Sidebar component) */}
      <Sidebar onLogout={() => setLogoutConfirmOpen(true)} />

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto flex flex-col min-w-0 pb-16 md:pb-0">
        {/* Mobile Top Navigation */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shrink-0 z-30">
          <img src="/img/SAMLING%20AI%20-%20WEB.png" alt="Samling AI" className="h-7 w-auto" />

          {/* Profile Avatar with Dropdown */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => setIsProfileOpen((v) => !v)}
              className="flex items-center gap-1.5 cursor-pointer rounded-full focus:outline-none"
              aria-label="Menu profil"
            >
              <div className="w-8 h-8 rounded-full bg-primary-100 border border-primary-200 flex items-center justify-center font-bold text-primary-600 text-sm">
                {userInitial}
              </div>
              <FontAwesomeIcon
                icon={faChevronDown}
                className={`text-[10px] text-gray-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Profile Dropdown Popover */}
            {isProfileOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] w-52 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-2.5">
                  <p className="text-sm font-semibold text-gray-800 truncate">{userName}</p>
                  <p className="text-xs text-gray-400 capitalize">{userRole}</p>
                </div>
                <div className="border-t border-gray-100 mx-2" />
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    setLogoutConfirmOpen(true);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <FontAwesomeIcon icon={faRightFromBracket} className="w-4 text-center" />
                  <span>Keluar Aplikasi</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <Outlet />
      </main>

      {/* Bottom Navigation — mobile only */}
      <BottomNavigation />

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        onConfirm={handleLogout}
        title="Keluar Aplikasi?"
        message="Apakah Anda yakin ingin keluar dari Dashboard Admin Samling AI? Anda perlu masuk kembali untuk mengakses data pemantauan sampah."
        confirmText="Keluar Sekarang"
        confirmBgColorClass="bg-red-600 hover:bg-red-500"
        icon={faRightFromBracket}
      />
    </div>
  );
}