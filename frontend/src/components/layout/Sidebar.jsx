import { useState } from "react";
import { NavLink } from "react-router";
import { useLocalStorage } from "react-use";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGauge,
  faMap,
  faTruck,
  faCommentDots,
  faMicrochip,
  faChevronLeft,
  faDatabase,
  faBrain,
  faRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";

export default function Sidebar({ onLogout }) {
  const [adminUser] = useLocalStorage("admin_user", null);
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { path: "/admin/overview", label: "Overview", icon: faGauge },
    { path: "/admin/map", label: "Peta Pemantauan", icon: faMap },
    {
      path: "/admin/monitoring",
      label: "Wilayah dan Monitoring",
      icon: faMicrochip,
    },
    { path: "/admin/predictions", label: "Prediksi AI", icon: faBrain },
    { path: "/admin/data", label: "Kelola Data", icon: faDatabase },
    { path: "/admin/fleet", label: "Manajemen Rute", icon: faTruck },
    { path: "/admin/reports", label: "Laporan Warga", icon: faCommentDots },
  ];

  return (
    <aside
      className={`hidden md:flex md:relative h-screen bg-white text-gray-700 flex-col border-r border-gray-200 transition-all duration-300 ease-in-out ${
        collapsed ? "md:w-[72px]" : "md:w-[260px]"
      }`}
    >
      {/* Header / Brand */}
      <div
        className={`relative flex items-center border-b border-gray-200 transition-all duration-300 ${collapsed ? "justify-center p-4" : "p-5"}`}
      >
        <img
          src={collapsed ? "/img/samling-logo-main.webp" : "/img/samling-v1-transparent.webp"}
          alt="Samling AI"
          className="h-9 w-auto shrink-0 object-contain"
        />
        {/* Toggle Sidebar */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`hidden md:flex absolute -right-3 top-1/2 z-30 -translate-y-1/2 w-6 h-6 rounded-full border border-gray-200 bg-white items-center justify-center text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-all shadow-xs cursor-pointer ${collapsed ? "rotate-180" : ""}`}
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
              `group flex items-center rounded-lg text-sm font-medium transition-all duration-200 h-11 relative ${
                collapsed
                  ? "md:justify-center w-full px-0"
                  : "gap-3 px-3.5"
              } ${
                isActive
                  ? "bg-primary-50 text-primary-700"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              }`
            }
          >
            <FontAwesomeIcon
              icon={item.icon}
              className="w-5 text-center shrink-0"
            />
            <span
              className={`overflow-hidden transition-all duration-300 ${collapsed ? "w-0 opacity-0" : "w-auto opacity-100"}`}
            >
              {item.label}
            </span>

            {/* Tooltip (visible only in collapsed mode on hover) */}
            {collapsed && (
              <div className="absolute left-full ml-3 z-50 bg-gray-900 text-white text-xs font-normal px-2.5 py-1.5 rounded-md opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 shadow-md whitespace-nowrap">
                {item.label}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Profile Section (desktop only) */}
      <div
        className={`border-t border-gray-200 bg-gray-50/80 transition-all duration-300 ${collapsed ? "p-3" : "p-4"}`}
      >
        <div
          className={`flex items-center ${collapsed ? "justify-center mb-3" : "gap-3 px-2 py-2 mb-3"}`}
        >
          <div className="w-8 h-8 rounded-full bg-primary-100 border border-primary-200 flex items-center justify-center font-bold text-primary-600 shrink-0">
            {adminUser?.name?.[0]?.toUpperCase() || "A"}
          </div>
          <div
            className={`overflow-hidden transition-all duration-300 ${collapsed ? "w-0 opacity-0" : "w-auto opacity-100"}`}
          >
            <p className="text-xs font-semibold text-gray-700 truncate leading-none">
              {adminUser?.name || "Administrator"}
            </p>
            <span className="text-[10px] text-gray-400 capitalize">
              {adminUser?.role || "Admin"}
            </span>
          </div>
        </div>
        <button
          onClick={onLogout}
          className={`group w-full flex items-center rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 transition-colors duration-200 cursor-pointer h-11 relative ${
            collapsed ? "justify-center px-0" : "gap-3 px-3.5"
          }`}
        >
          <FontAwesomeIcon
            icon={faRightFromBracket}
            className="w-4 text-center shrink-0"
          />
          <span
            className={`overflow-hidden transition-all duration-300 ${collapsed ? "w-0 opacity-0" : "w-auto opacity-100"}`}
          >
            Keluar Aplikasi
          </span>

          {/* Tooltip (visible only in collapsed mode on hover) */}
          {collapsed && (
            <div className="absolute left-full ml-3 z-50 bg-red-600 text-white text-xs font-normal px-2.5 py-1.5 rounded-md opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 shadow-md whitespace-nowrap">
              Keluar Aplikasi
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
