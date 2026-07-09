import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router';
import { useLocalStorage } from 'react-use';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGauge,
  faMap,
  faTruck,
  faCommentDots,
  faLocationDot,
  faMicrochip,
  faRightFromBracket,
  faChevronLeft,
  faChevronRight,
  faDatabase
} from '@fortawesome/free-solid-svg-icons';
import ConfirmModal from '../fragments/ConfirmModal';

export default function Sidebar() {
  const [, setAdminToken] = useLocalStorage('admin_token', null);
  const [adminUser] = useLocalStorage('admin_user', null);
  const navigate = useNavigate();
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    setAdminToken(null);
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setLogoutConfirmOpen(false);
    navigate('/login');
  };

  const navItems = [
    { path: '/admin/overview', label: 'Overview', icon: faGauge },
    { path: '/admin/map', label: 'Peta Pemantauan', icon: faMap },
    { path: '/admin/monitoring', label: 'Wilayah dan Monitoring', icon: faMicrochip },
    { path: '/admin/data', label: 'Kelola Data', icon: faDatabase },
    { path: '/admin/fleet', label: 'Manajemen Rute', icon: faTruck },
    { path: '/admin/reports', label: 'Laporan Warga', icon: faCommentDots },
  ];

  return (
    <aside className={`h-screen bg-white text-gray-700 flex flex-col border-r border-gray-200 transition-all duration-300 ease-in-out ${collapsed ? 'w-[72px]' : 'w-[260px]'}`}>
      {/* Header / Brand */}
      <div className={`relative flex items-center border-b border-gray-200 transition-all duration-300 ${collapsed ? 'justify-center p-4' : 'p-5'}`}>
        <img src="/img/SAMLING%20AI%20-%20WEB.png" alt="Samling AI" className="h-9 w-auto" />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`absolute -right-3 top-1/2 z-30 -translate-y-1/2 w-6 h-6 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-all shadow-xs cursor-pointer ${collapsed ? 'rotate-180' : ''}`}
        >
          <FontAwesomeIcon icon={faChevronLeft} className="text-[10px]" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-5 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center rounded-lg text-sm font-medium transition-all duration-200 ${
                collapsed
                  ? 'justify-center w-full px-0 py-3'
                  : 'gap-3 px-3.5 py-2.5'
              } ${
                isActive
                  ? "bg-primary-50 text-primary-700"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              }`
            }
          >
            <FontAwesomeIcon icon={item.icon} className="w-5 text-center shrink-0" />
            <span className={`overflow-hidden transition-all duration-300 ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* User Profile & Logout Section */}
      <div className={`border-t border-gray-200 bg-gray-50/80 transition-all duration-300 ${collapsed ? 'p-3' : 'p-4'}`}>
        <div className={`flex items-center ${collapsed ? 'justify-center mb-3' : 'gap-3 px-2 py-2 mb-3'}`}>
          <div className="w-8 h-8 rounded-full bg-primary-100 border border-primary-200 flex items-center justify-center font-bold text-primary-600 shrink-0">
            {adminUser?.name?.[0]?.toUpperCase() || "A"}
          </div>
          <div className={`overflow-hidden transition-all duration-300 ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
            <p className="text-xs font-semibold text-gray-700 truncate leading-none">
              {adminUser?.name || "Administrator"}
            </p>
            <span className="text-[10px] text-gray-400 capitalize">
              {adminUser?.role || "Admin"}
            </span>
          </div>
        </div>
        <button
          onClick={() => setLogoutConfirmOpen(true)}
          className={`w-full flex items-center rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 transition-colors duration-200 cursor-pointer ${
            collapsed ? 'justify-center p-2.5' : 'gap-3 px-3.5 py-2.5'
          }`}
        >
          <FontAwesomeIcon icon={faRightFromBracket} className="w-4 text-center shrink-0" />
          <span className={`overflow-hidden transition-all duration-300 ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
            Keluar Aplikasi
          </span>
        </button>
      </div>

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
    </aside>
  );
}
