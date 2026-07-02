import { NavLink } from 'react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouse, faChartLine, faIndustry, faUser } from '@fortawesome/free-solid-svg-icons';

export default function BottomNav() {
  const activeClass = "flex flex-col items-center gap-1 text-brand dark:text-emerald-400";
  const inactiveClass = "flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500 hover:text-brand dark:hover:text-emerald-400 transition-colors";

  return (
    <nav className="navbar-bottom fixed bottom-0 left-0 w-full bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 shadow-lg flex justify-around items-center py-2.5 px-4 sm:px-10 md:px-20 lg:px-40 xl:px-60 z-50 transition-colors duration-200">
      <NavLink 
        to="/dashboard" 
        className={({ isActive }) => isActive ? activeClass : inactiveClass}
      >
        <FontAwesomeIcon icon={faHouse} className="text-xl md:text-22" />
        <span className="text-xs font-semibold">Beranda</span>
      </NavLink>

      <NavLink 
        to="/aktivitas" 
        className={({ isActive }) => isActive ? activeClass : inactiveClass}
      >
        <FontAwesomeIcon icon={faChartLine} className="text-xl md:text-22" />
        <span className="text-xs font-semibold">Aktivitas</span>
      </NavLink>

      <NavLink 
        to="/mitra" 
        className={({ isActive }) => isActive ? activeClass : inactiveClass}
      >
        <FontAwesomeIcon icon={faIndustry} className="text-xl md:text-22" />
        <span className="text-xs font-semibold">Mitra</span>
      </NavLink>

      <NavLink 
        to="/akun" 
        className={({ isActive }) => isActive ? activeClass : inactiveClass}
      >
        <FontAwesomeIcon icon={faUser} className="text-xl md:text-22" />
        <span className="text-xs font-semibold">Akun</span>
      </NavLink>
    </nav>
  );
}
