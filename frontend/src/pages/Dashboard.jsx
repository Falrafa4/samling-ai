import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faBuilding, faChartLine, faSearch, faTrashCan, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import BottomNav from '../components/BottomNav';
import LeafletMap from '../components/LeafletMap';
import { timeAgo } from '../utils/helpers';

export default function Dashboard() {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('Gregorius Olvans');
  const [avatarUrl, setAvatarUrl] = useState('/img/avatar1.jpeg');
  const [mitraCount, setMitraCount] = useState(0);
  const [tpsCount, setTpsCount] = useState(6);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const NOTIFICATIONS_KEY = 'samling_notifications';
  const PARTNERS_KEY = 'samling_pro_sidoarjo_v1';

  useEffect(() => {
    // Auth Check
    const username = localStorage.getItem('username');
    if (!username) {
      navigate('/login');
      return;
    }

    // Load profile
    const savedName = localStorage.getItem('userDisplayName');
    if (savedName) setDisplayName(savedName);
    const savedAvatar = localStorage.getItem('userAvatarUrl');
    if (savedAvatar) setAvatarUrl(savedAvatar);

    // Load stats
    try {
      const partners = JSON.parse(localStorage.getItem(PARTNERS_KEY)) || [];
      setMitraCount(partners.length);
    } catch (e) {
      setMitraCount(0);
    }

    // Load notifications
    loadNotificationsFromStorage();
  }, [navigate]);

  const loadNotificationsFromStorage = () => {
    try {
      const notifs = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY)) || [];
      setNotifications(notifs);
    } catch (e) {
      setNotifications([]);
    }
  };

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    
    // Mark all as read after opening
    if (notifications.some(n => !n.read)) {
      const updated = notifications.map(n => ({ ...n, read: true }));
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
      setNotifications(updated);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/tps?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const hasUnread = notifications.some(n => !n.read);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col text-gray-900 dark:text-gray-100 pb-24 transition-colors duration-200">
      
      {/* Header */}
      <header className="flex items-center justify-between px-4 md:px-8 pb-6 pt-10 sticky top-0 bg-gray-50/90 dark:bg-slate-900/90 backdrop-blur-sm z-30 transition-colors duration-200">
        <div className="flex items-center gap-4">
          <img 
            src={avatarUrl} 
            alt="Foto Profil"
            className="w-14 h-14 rounded-full object-cover shadow-md border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-800"
            onError={(e) => {
              e.target.src = "https://api.dicebear.com/9.x/avataaars/svg?seed=Greg";
            }}
          />
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold leading-tight text-gray-900 dark:text-white">
              Halo, {displayName}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Samling Dashboard</p>
          </div>
        </div>

        {/* Notifications Button & Dropdown */}
        <div className="relative">
          <button 
            onClick={handleNotificationClick}
            className="relative text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-emerald-400 focus:outline-none transition-colors w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-slate-850 shadow-xs border border-gray-100 dark:border-slate-700 cursor-pointer"
          >
            <FontAwesomeIcon icon={faBell} className="text-xl" />
            {hasUnread && (
              <span className="absolute top-2 right-2 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900 animate-pulse"></span>
            )}
          </button>

          {/* Dropdown Overlay */}
          {showNotifications && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 mt-3 w-80 max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 border border-gray-150 dark:border-slate-700 animate-slide-in">
                <div className="py-3 px-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                  <h3 className="text-md font-bold text-gray-800 dark:text-white">Notifikasi</h3>
                  {hasUnread && (
                    <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">Baru</span>
                  )}
                </div>
                
                <div className="divide-y divide-gray-100 dark:divide-slate-700 max-h-96 overflow-y-auto custom-scroll">
                  {notifications.length === 0 ? (
                    <div className="text-center py-10 px-4">
                      <FontAwesomeIcon icon={faCheckCircle} className="text-3xl text-gray-300 dark:text-slate-650" />
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Tidak ada notifikasi baru.</p>
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div key={notif.id} className="flex items-start px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-100 dark:bg-slate-700">
                            <i className={`${notif.icon || 'fa-solid fa-bell'} ${notif.iconColor || 'text-gray-500'} text-base`}></i>
                          </div>
                        </div>
                        <div className="ml-3 flex-grow">
                          <p className="text-xs font-bold text-gray-850 dark:text-white leading-tight">
                            {notif.title}
                          </p>
                          <p className="text-[11px] text-gray-550 dark:text-gray-450 mt-0.5">
                            {notif.message}
                          </p>
                          <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">
                            {timeAgo(notif.time)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 px-4 md:px-8 pb-10">
        
        {/* Statistics Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Card 1: Daftar Mitra */}
          <button 
            onClick={() => navigate('/mitra')}
            className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700/50 rounded-2xl p-4 flex items-center gap-4 w-full text-left hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-50 dark:bg-green-950/30 text-green-500 dark:text-emerald-400 text-lg">
              <FontAwesomeIcon icon={faBuilding} />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Daftar Mitra</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{mitraCount}</p>
            </div>
          </button>

          {/* Card 2: Daftar TPS */}
          <button 
            onClick={() => navigate('/tps')}
            className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700/50 rounded-2xl p-4 flex items-center gap-4 w-full text-left hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-50 dark:bg-blue-950/30 text-blue-500 dark:text-blue-400 text-lg">
              <FontAwesomeIcon icon={faTrashCan} />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Daftar TPS</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{tpsCount}</p>
            </div>
          </button>
        </section>

        {/* Call Garbage Truck Button Link */}
        <button 
          onClick={() => navigate('/cari-truk')}
          className="flex flex-row justify-between items-center w-full p-5 mb-6 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700/50 hover:border-brand dark:hover:border-emerald-400 rounded-2xl shadow-sm hover:shadow-md transition-all duration-250 cursor-pointer"
        >
          <div className="flex flex-row justify-start items-center gap-3">
            <div className="text-green-600 dark:text-emerald-400">
              <FontAwesomeIcon icon={faSearch} className="text-lg" />
            </div>
            <p className="font-bold text-gray-900 dark:text-white text-md">Cari & Panggil Truk Sampah</p>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400 dark:text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Map Container */}
        <section className="relative rounded-3xl overflow-hidden border border-gray-100 dark:border-slate-700 shadow-sm h-[50vh] min-h-[400px]">
          
          {/* Map Component */}
          <LeafletMap 
            lat={-7.4478} 
            lng={112.7183} 
            zoom={12} 
            popupText="Live Map Sidoarjo"
          />

          {/* Status Indicator Legend */}
          <main className="absolute flex flex-col items-start justify-center bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm p-3 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 z-20 top-20 right-4 w-40">
            <p className="font-bold text-xs text-gray-800 dark:text-gray-250 mb-2 uppercase tracking-wider">Status Sampah</p>
            <div className="space-y-2 text-xs font-semibold text-gray-650 dark:text-gray-400 w-full">
              <div className="flex flex-row justify-start items-center gap-2">
                <span className="block bg-[#24C529] w-2.5 h-2.5 rounded-full shadow-sm"></span>
                <p>0-40%</p>
              </div>
              <div className="flex flex-row justify-start items-center gap-2">
                <span className="block bg-[#FFA600] w-2.5 h-2.5 rounded-full shadow-sm"></span>
                <p>40-70%</p>
              </div>
              <div className="flex flex-row justify-start items-center gap-2">
                <span className="block bg-[#FF0000] w-2.5 h-2.5 rounded-full shadow-sm"></span>
                <p>70-100%</p>
              </div>
            </div>
          </main>

          {/* Top Floating Search bar */}
          <main className="absolute top-4 left-4 right-4 flex flex-row justify-between z-20 bg-white/90 dark:bg-slate-850/90 backdrop-blur-xs p-2 rounded-2xl shadow-md border border-gray-100 dark:border-slate-700/80">
            <div className="hidden sm:flex flex-row justify-center items-center gap-1.5 text-gray-800 dark:text-white px-3 py-1 rounded-full text-xs font-bold bg-gray-50 dark:bg-slate-750">
              <FontAwesomeIcon icon={faChartLine} className="text-brand dark:text-emerald-400" />
              <span>Live Map</span>
            </div>
            
            <form onSubmit={handleSearchSubmit} className="w-full sm:w-[60%] flex gap-2">
              <input 
                type="search" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-650 px-3.5 py-1.5 text-gray-900 dark:text-white text-sm focus:ring-1 focus:ring-brand focus:border-brand dark:focus:ring-emerald-400 block w-full placeholder:text-gray-450 rounded-xl shadow-inner outline-none transition-all duration-200" 
                placeholder="Cari TPS..." 
              />
              <button 
                type="submit" 
                className="text-white bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-300 shadow-sm font-semibold rounded-xl text-sm px-4 py-1.5 focus:outline-none transition-colors duration-200 cursor-pointer"
              >
                Cari
              </button>
            </form>
          </main>

        </section>
      </main>

      {/* Shared Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
