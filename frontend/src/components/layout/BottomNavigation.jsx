import { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGauge,
  faMap,
  faMicrochip,
  faCommentDots,
  faEllipsis,
  faDatabase,
  faTruck,
  faBrain,
} from '@fortawesome/free-solid-svg-icons';

const primaryNavItems = [
  { path: '/admin/overview', label: 'Overview', icon: faGauge },
  { path: '/admin/map', label: 'Peta', icon: faMap },
  { path: '/admin/monitoring', label: 'Monitoring', icon: faMicrochip },
  { path: '/admin/reports', label: 'Laporan', icon: faCommentDots },
];

const moreNavItems = [
  { path: '/admin/predictions', label: 'Prediksi AI', icon: faBrain },
  { path: '/admin/data', label: 'Kelola Data', icon: faDatabase },
  { path: '/admin/fleet', label: 'Manajemen Rute', icon: faTruck },
];

export default function BottomNavigation() {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreRef = useRef(null);
  const location = useLocation();

  // Close popover on route change
  useEffect(() => {
    setIsMoreOpen(false);
  }, [location.pathname]);

  // Close popover on click outside
  useEffect(() => {
    if (!isMoreOpen) return;
    function handleClickOutside(e) {
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setIsMoreOpen(false);
      }
    }
    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, [isMoreOpen]);

  const isMoreActive = moreNavItems.some((item) => location.pathname.startsWith(item.path));

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-[0_-2px_10px_rgba(0,0,0,0.06)] flex justify-around items-center h-16 md:hidden">
      {primaryNavItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full text-[10px] font-medium transition-colors ${
              isActive
                ? 'text-primary-700'
                : 'text-gray-400 hover:text-gray-600'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute top-0 w-8 h-0.5 rounded-b-full bg-primary-600" />
              )}
              <FontAwesomeIcon icon={item.icon} className="text-lg mb-0.5" />
              <span>{item.label}</span>
            </>
          )}
        </NavLink>
      ))}

      {/* More Button */}
      <div ref={moreRef} className="relative flex flex-col items-center justify-center flex-1 h-full">
        <button
          onClick={() => setIsMoreOpen((v) => !v)}
          className={`flex flex-col items-center justify-center w-full h-full text-[10px] font-medium transition-colors cursor-pointer ${
            isMoreActive || isMoreOpen
              ? 'text-primary-700'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          {(isMoreActive || isMoreOpen) && (
            <span className="absolute top-0 w-8 h-0.5 rounded-b-full bg-primary-600" />
          )}
          <FontAwesomeIcon icon={faEllipsis} className="text-lg mb-0.5" />
          <span>Lainnya</span>
        </button>

        {/* More Popover */}
        {isMoreOpen && (
          <div className="absolute bottom-[calc(100%+8px)] right-0 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 z-50">
            {moreNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-primary-700 bg-primary-50'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                  }`
                }
              >
                <FontAwesomeIcon icon={item.icon} className="w-4 text-center" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}