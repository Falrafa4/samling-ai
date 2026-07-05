import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router';
import { useLocalStorage } from 'react-use';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLeaf,
  faGauge,
  faMap,
  faTruck,
  faCommentDots,
  faLocationDot,
  faRightFromBracket
} from '@fortawesome/free-solid-svg-icons';
import ConfirmModal from '../fragments/ConfirmModal';

export default function Sidebar() {
  const [, setAdminToken] = useLocalStorage('admin_token', null);
  const [adminUser] = useLocalStorage('admin_user', null);
  const navigate = useNavigate();
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

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
    { path: '/admin/fleet', label: 'Manajemen Rute', icon: faTruck },
    { path: '/admin/reports', label: 'Laporan Warga', icon: faCommentDots },
    { path: '/admin/zones', label: 'Kelola Wilayah', icon: faLocationDot },
  ];

  return (
    <aside className="w-[260px] h-screen bg-slate-900 text-white flex flex-col border-r border-slate-800">
      {/* Header / Brand */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <FontAwesomeIcon icon={faLeaf} className="text-emerald-500 text-2xl" />
        <div>
          <h1 className="font-bold text-lg leading-none text-emerald-500">
            Samling AI
          </h1>
          <span className="text-[10px] text-slate-400 font-medium">
            ADMIN DASHBOARD
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/30"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`
            }
          >
            <FontAwesomeIcon icon={item.icon} className="w-5 text-center" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Profile & Logout Section */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3 px-2 py-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400">
            {adminUser?.name?.[0]?.toUpperCase() || "A"}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-slate-200 truncate leading-none">
              {adminUser?.name || "Administrator"}
            </p>
            <span className="text-[10px] text-slate-400 capitalize">
              {adminUser?.role || "Admin"}
            </span>
          </div>
        </div>
        <button
          onClick={() => setLogoutConfirmOpen(true)}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors duration-200 text-left cursor-pointer"
        >
          <FontAwesomeIcon
            icon={faRightFromBracket}
            className="w-4 text-center"
          />
          <span>Keluar Aplikasi</span>
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
