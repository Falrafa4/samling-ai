import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faUser, faLock, faBell, faMoon, faCircleInfo, faArrowRightFromBracket, faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';
import BottomNav from '../components/BottomNav';
import Header from '../components/Header';
import EditProfileModal from '../fragments/EditProfileModal';
import AboutModal from '../fragments/AboutModal';

export default function Akun() {
  const navigate = useNavigate();

  // Profile data state
  const [displayName, setDisplayName] = useState('admin');
  const [avatarUrl, setAvatarUrl] = useState('https://api.dicebear.com/9.x/avataaars/svg?seed=Greg');
  const [email, setEmail] = useState('admin@admin.com');

  // Modals state
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Password change form state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Preference state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  useEffect(() => {
    // Auth Check
    const username = localStorage.getItem('username');
    if (!username) {
      navigate('/login');
      return;
    }

    // Load Profile details
    const savedName = localStorage.getItem('userDisplayName');
    if (savedName) setDisplayName(savedName);
    
    const savedAvatar = localStorage.getItem('userAvatarUrl');
    if (savedAvatar) setAvatarUrl(savedAvatar);

    // Cross-reference email from appUsers database
    try {
      const users = JSON.parse(localStorage.getItem('appUsers')) || [];
      const currUser = users.find(u => u.username === username);
      if (currUser) {
        setEmail(currUser.email);
      }
    } catch (e) {
      console.error(e);
    }

    // Load Theme Preference
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark' || document.body.classList.contains('dark');
    setDarkModeEnabled(isDark);
    if (isDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [navigate]);

  // Handle Dark mode change
  const handleDarkModeToggle = () => {
    const nextVal = !darkModeEnabled;
    setDarkModeEnabled(nextVal);
    if (nextVal) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Handle Profile Save
  const handleSaveProfile = (name, avatar) => {
    localStorage.setItem('userDisplayName', name);
    localStorage.setItem('userAvatarUrl', avatar);
    setDisplayName(name);
    setAvatarUrl(avatar);
    setShowEditModal(false);
    alert("Profil berhasil diperbarui!");
  };

  // Handle Password Submission
  const handlePasswordSubmit = (e) => {
    e.preventDefault();

    if (!oldPassword || !newPassword || !confirmPassword) {
      alert("Semua field wajib diisi!");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Konfirmasi sandi baru tidak cocok!");
      return;
    }

    const username = localStorage.getItem('username');
    try {
      const users = JSON.parse(localStorage.getItem('appUsers')) || [];
      const userIndex = users.findIndex(u => u.username === username);

      if (userIndex === -1) {
        alert("Error: Pengguna tidak ditemukan.");
        return;
      }

      if (users[userIndex].password !== oldPassword) {
        alert("Kata sandi lama salah!");
        return;
      }

      // Update password
      users[userIndex].password = newPassword;
      localStorage.setItem('appUsers', JSON.stringify(users));

      alert("Kata sandi berhasil diubah! Anda akan dialihkan ke halaman login.");
      handleLogout();
    } catch (err) {
      alert("Gagal memperbarui sandi.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('username');
    localStorage.removeItem('userDisplayName');
    sessionStorage.removeItem('mitraPageAuthenticated');
    setShowLogoutModal(false);
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col text-gray-900 dark:text-gray-100 pb-24 transition-colors duration-200">
      
      {/* Header */}
      <Header title="Akun Kamu" subtitle="Tempat mengatur detail akun profil" />

      {/* Main Container */}
      <main className="flex-1 p-5 space-y-6 max-w-lg mx-auto w-full">
        
        {/* Profile Card Section */}
        <section className="bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow duration-200 rounded-2xl p-5 flex items-center gap-5 border border-gray-100 dark:border-slate-700/60">
          <div className="relative shrink-0">
            <img 
              id="profileAvatar" 
              src={avatarUrl} 
              alt="Avatar" 
              className="w-20 h-20 rounded-full object-cover border-4 border-emerald-50 dark:border-emerald-950/20 bg-gray-100 dark:bg-slate-700" 
              onError={(e) => {
                e.target.src = "https://api.dicebear.com/9.x/avataaars/svg?seed=Greg";
              }}
            />
            <div className="absolute bottom-0 right-0 bg-emerald-500 border-2 border-white dark:border-slate-800 w-6 h-6 rounded-full flex items-center justify-center">
              <FontAwesomeIcon icon={faCheck} className="text-white text-[10px]" />
            </div>
          </div>
          <div className="min-w-0">
            <h2 id="displayProfileName" className="text-xl font-bold truncate">{displayName}</h2> 
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{email}</p> 
            <div className="flex items-center gap-2 mt-1.5">
              <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Pengguna Terverifikasi
              </span>
            </div>
          </div>
        </section>

        {/* Setting items list */}
        <div className="space-y-5">
          {/* Section: Account Settings */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-2.5 ml-1">
              Pengaturan Akun
            </h3>
            <ul className="bg-white dark:bg-slate-800 shadow-sm rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-750 divide-y divide-gray-100 dark:divide-slate-750 transition-colors">
              {/* Edit Profile */}
              <li 
                onClick={() => setShowEditModal(true)}
                className="group cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors"
              >
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/20 text-blue-500 flex items-center justify-center">
                      <FontAwesomeIcon icon={faUser} className="text-sm" />
                    </div>
                    <span className="font-semibold text-sm">Edit Profil</span>
                  </div>
                  <FontAwesomeIcon icon={faChevronRight} className="text-gray-300 dark:text-slate-600 text-xs group-hover:translate-x-0.5 transition-transform" />
                </div>
              </li>

              {/* Edit Password */}
              <li 
                onClick={() => {
                  setOldPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setShowPasswordModal(true);
                }}
                className="group cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors"
              >
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-950/20 text-orange-500 flex items-center justify-center">
                      <FontAwesomeIcon icon={faLock} className="text-sm" />
                    </div>
                    <span className="font-semibold text-sm">Ubah Kata Sandi</span>
                  </div>
                  <FontAwesomeIcon icon={faChevronRight} className="text-gray-300 dark:text-slate-600 text-xs group-hover:translate-x-0.5 transition-transform" />
                </div>
              </li>
            </ul>
          </div>

          {/* Section: Preferensi */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-2.5 ml-1">
              Preferensi
            </h3>
            <ul className="bg-white dark:bg-slate-800 shadow-sm rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-750 divide-y divide-gray-100 dark:divide-slate-750 transition-colors">
              {/* Enable notification */}
              <li className="p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-950/20 text-purple-500 flex items-center justify-center">
                    <FontAwesomeIcon icon={faBell} className="text-sm" />
                  </div>
                  <span className="font-semibold text-sm">Notifikasi</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={notificationsEnabled}
                    onChange={(e) => setNotificationsEnabled(e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500"></div>
                </label>
              </li>

              {/* Dark Mode toggle */}
              <li className="p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 flex items-center justify-center">
                    <FontAwesomeIcon icon={faMoon} className="text-sm" />
                  </div>
                  <span className="font-semibold text-sm">Mode Gelap</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={darkModeEnabled}
                    onChange={handleDarkModeToggle}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500"></div>
                </label>
              </li>
            </ul>
          </div>

          {/* Section: Lainnya */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-2.5 ml-1">
              Lainnya
            </h3>
            <ul className="bg-white dark:bg-slate-800 shadow-sm rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-750 divide-y divide-gray-100 dark:divide-slate-750 transition-colors">
              {/* About Samling */}
              <li 
                onClick={() => setShowAboutModal(true)}
                className="group cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors"
              >
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-55 dark:bg-emerald-950/20 text-emerald-500 flex items-center justify-center">
                      <FontAwesomeIcon icon={faCircleInfo} className="text-sm" />
                    </div>
                    <span className="font-semibold text-sm">Tentang Samling</span>
                  </div>
                  <FontAwesomeIcon icon={faChevronRight} className="text-gray-300 dark:text-slate-660 text-xs group-hover:translate-x-0.5 transition-transform" />
                </div>
              </li>

              {/* Logout button */}
              <li 
                onClick={() => setShowLogoutModal(true)}
                className="cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
              >
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-950/20 text-red-500 flex items-center justify-center">
                      <FontAwesomeIcon icon={faArrowRightFromBracket} className="text-sm" />
                    </div>
                    <span className="font-semibold text-sm text-red-500">Keluar</span>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-slate-500 py-6 transition-colors">
          Samling • Manajemen Sampah Berbasis Data
        </p>

      </main>

      {/* ==================== SUB-MODALS ==================== */}

      {/* Edit Profile Modal Fragment */}
      <EditProfileModal 
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveProfile}
        currentName={displayName}
        currentAvatar={avatarUrl}
      />

      {/* About Samling Modal Fragment */}
      <AboutModal 
        isOpen={showAboutModal}
        onClose={() => setShowAboutModal(false)}
      />

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="absolute inset-0 bg-transparent" onClick={() => setShowPasswordModal(false)} />
          <div className="bg-white dark:bg-slate-800 w-full sm:max-w-md p-6 rounded-t-3xl sm:rounded-3xl shadow-2xl relative z-10 animate-modalFade flex flex-col max-h-[90vh] transition-colors duration-200">
            
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-50 dark:border-slate-750">
              <h3 className="text-xl font-bold dark:text-white">Ubah Kata Sandi</h3>
              <button 
                onClick={() => setShowPasswordModal(false)} 
                className="w-8 h-8 rounded-full bg-gray-150 dark:bg-slate-700 flex items-center justify-center hover:bg-gray-250 dark:hover:bg-slate-655 transition"
              >
                <FontAwesomeIcon icon={faXmark} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            
            <form onSubmit={handlePasswordSubmit} className="space-y-4 pb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Sandi Lama</label>
                <input 
                  type="password" 
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-650 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition outline-none text-gray-900 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Sandi Baru</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-650 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition outline-none text-gray-900 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Konfirmasi Sandi Baru</label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-650 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition outline-none text-gray-900 dark:text-white text-sm"
                />
              </div>
              
              <div className="pt-4">
                <button 
                  type="submit" 
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/30 transition active:scale-95 cursor-pointer"
                >
                  Ubah Sandi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-black/60 backdrop-blur-xs">
          <div className="absolute inset-0 bg-transparent" onClick={() => setShowLogoutModal(false)} />
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm p-6 rounded-2xl shadow-2xl relative z-10 animate-modalFade text-center transition-colors">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-950/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faArrowRightFromBracket} className="text-2xl" />
            </div>
            <h3 className="text-xl font-bold mb-2 dark:text-white">Ingin Keluar?</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">Apakah Anda yakin ingin keluar dari akun Anda?</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 px-4 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-slate-650 transition cursor-pointer"
              >
                Batal
              </button>
              <button 
                onClick={handleLogout}
                className="flex-1 py-2.5 px-4 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 shadow-lg shadow-red-500/30 transition cursor-pointer"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shared Bottom Nav */}
      <BottomNav />
    </div>
  );
}
