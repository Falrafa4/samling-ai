import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileArrowDown, faPlus, faHistory, faMagnifyingGlass, faBuilding, faCheck, faChevronRight, faMapLocationDot, faWeightHanging, faLocationDot, faCircleCheck, faTimes, faPenToSquare, faTrash, faLeaf, faIndustry, faXmark, faCheckCircle, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import Chart from 'chart.js/auto';

import BottomNav from '../components/BottomNav';
import Header from '../components/Header';
import LeafletMap from '../components/LeafletMap';
import AuthModal from '../fragments/AuthModal';
import { exportToCSV, getCapacityValue } from '../utils/helpers';
import { defaultPartners } from '../utils/mockData';

export default function Mitra() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Core App State
  const [partners, setPartners] = useState([]);
  const [activeCategory, setActiveCategory] = useState('organik');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Modals & Details State
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [editPartnerId, setEditPartnerId] = useState(null);

  // Form Fields State
  const [formName, setFormName] = useState('');
  const [formVerified, setFormVerified] = useState(false);
  const [formDesc, setFormDesc] = useState('');
  const [formCategory, setFormCategory] = useState('organik');
  const [formDistance, setFormDistance] = useState('');
  const [formReq, setFormReq] = useState('');
  const [formPhoneRaw, setFormPhoneRaw] = useState('');

  // Toast Notification State
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' }

  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const STORAGE_KEY = 'samling_pro_sidoarjo_v1';

  // Auth Validation on mount
  useEffect(() => {
    const isAuth = sessionStorage.getItem('mitraPageAuthenticated') === 'true';
    if (isAuth) {
      setIsAuthenticated(true);
      loadPartnersData();
    } else {
      setShowAuthModal(true);
    }
  }, []);

  const handleAuthSuccess = () => {
    sessionStorage.setItem('mitraPageAuthenticated', 'true');
    setIsAuthenticated(true);
    setShowAuthModal(false);
    loadPartnersData();
    triggerToast('Akses dikonfirmasi', 'success');
  };

  const handleAuthClose = () => {
    setShowAuthModal(false);
    navigate('/dashboard');
  };

  const loadPartnersData = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setPartners(JSON.parse(stored));
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultPartners));
      setPartners(defaultPartners);
    }
  };

  const triggerToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // Filter and Sort Data
  const getFilteredPartners = () => {
    let list = partners.filter(p => 
      p.category === activeCategory &&
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (sortBy === 'nearest') {
      list.sort((a, b) => a.distance - b.distance);
    } else if (sortBy === 'capacity') {
      list.sort((a, b) => getCapacityValue(b.req) - getCapacityValue(a.req));
    } else {
      list.sort((a, b) => b.id - a.id);
    }
    return list;
  };

  const filteredPartners = getFilteredPartners();

  // Render Doughnut Chart
  useEffect(() => {
    if (!isAuthenticated || !chartRef.current) return;

    // Destroy existing chart if it exists
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const labels = filteredPartners.map(p => p.name.length > 12 ? p.name.substring(0, 12) + '...' : p.name);
    const values = filteredPartners.map(p => getCapacityValue(p.req));
    const colors = filteredPartners.map((p, i) => {
      const hue = p.category === 'organik' ? 142 : 190;
      const lightness = 45 + (i * 8) % 30;
      return `hsl(${hue}, 70%, ${lightness}%)`;
    });

    const ctx = chartRef.current.getContext('2d');
    chartInstanceRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: colors,
          borderWidth: 1,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        cutout: '75%'
      }
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [filteredPartners, isAuthenticated]);

  // CSV Export
  const handleExportCSV = () => {
    const headers = ["ID", "Nama Mitra", "Kategori", "Deskripsi", "Kebutuhan", "Jarak(km)", "No.HP", "Verified"];
    const keys = ["id", "name", "category", "desc", "req", "distance", "phone", "verified"];
    exportToCSV(filteredPartners, 'data_mitra_samling.csv', headers, keys);
    triggerToast("Data berhasil diekspor!", "success");
  };

  // WhatsApp cooperating call
  const handleCallWhatsApp = (partner) => {
    if (!partner || !partner.phone) {
      triggerToast("Nomor telepon tidak tersedia", "error");
      return;
    }
    let num = partner.phone.toString().replace(/^0/, '');
    if (!num.startsWith('62')) num = '62' + num;
    window.open(`https://wa.me/${num}?text=Halo ${encodeURIComponent(partner.name)}, saya dari Samling ingin bekerjasama dalam penyaluran sampah terpilah.`, '_blank');
  };

  // CRUD Actions
  const openAddModal = () => {
    setEditPartnerId(null);
    setFormName('');
    setFormVerified(false);
    setFormDesc('');
    setFormCategory(activeCategory);
    setFormDistance('');
    setFormReq('');
    setFormPhoneRaw('');
    setShowAddEditModal(true);
  };

  const openEditModal = (partner) => {
    setEditPartnerId(partner.id);
    setFormName(partner.name);
    setFormVerified(!!partner.verified);
    setFormDesc(partner.desc);
    setFormCategory(partner.category);
    setFormDistance(partner.distance.toString());
    setFormReq(partner.req);
    
    // strip phone code
    let ph = partner.phone ? partner.phone.toString() : '';
    if (ph.startsWith('62')) ph = ph.substring(2);
    else if (ph.startsWith('0')) ph = ph.substring(1);
    setFormPhoneRaw(ph);
    
    setShowDetailModal(false);
    setShowAddEditModal(true);
  };

  const handleDeletePartner = (id) => {
    if (window.confirm('Hapus mitra ini?')) {
      const updated = partners.filter(p => p.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setPartners(updated);
      setShowDetailModal(false);
      triggerToast('Mitra berhasil dihapus', 'success');
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formName.trim() || !formDesc.trim() || !formReq.trim() || !formDistance || !formPhoneRaw) {
      triggerToast('Semua field wajib diisi', 'error');
      return;
    }

    const distNum = parseFloat(formDistance);
    const phone = '62' + formPhoneRaw.replace(/^0+/, '');
    const icon = formCategory === 'organik' ? 'fa-leaf' : 'fa-industry';

    // Randomize latlng around Sidoarjo
    const lat = -7.4478 + (Math.random() * 0.1 - 0.05);
    const lng = 112.7183 + (Math.random() * 0.1 - 0.05);

    let updatedList = [];
    if (editPartnerId) {
      // Edit mode
      updatedList = partners.map(p => {
        if (p.id === editPartnerId) {
          return {
            ...p,
            name: formName,
            verified: formVerified,
            desc: formDesc,
            category: formCategory,
            distance: distNum,
            req: formReq,
            phone,
            icon,
          };
        }
        return p;
      });
      triggerToast('Data mitra berhasil diperbarui', 'success');
    } else {
      // Add mode
      const newPartner = {
        id: Date.now(),
        name: formName,
        verified: formVerified,
        desc: formDesc,
        category: formCategory,
        distance: distNum,
        req: formReq,
        phone,
        icon,
        lat,
        lng
      };
      updatedList = [...partners, newPartner];
      triggerToast('Mitra baru berhasil ditambahkan', 'success');
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    setPartners(updatedList);
    setShowAddEditModal(false);
    
    // Auto switch category to match the added item's category
    if (formCategory !== activeCategory) {
      setActiveCategory(formCategory);
    }
  };

  if (!isAuthenticated) {
    return (
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={handleAuthClose} 
        onSuccess={handleAuthSuccess} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col text-gray-900 dark:text-gray-100 pb-24 transition-colors duration-200">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-slide-in">
          <div className="bg-white dark:bg-slate-800 border-l-4 border-emerald-500 shadow-2xl rounded-lg p-4 flex items-center gap-4 min-w-[280px]">
            <div className={`p-2 rounded-full ${toast.type === 'error' ? 'bg-red-100 text-red-500' : 'bg-green-100 text-green-600'}`}>
              <FontAwesomeIcon icon={toast.type === 'error' ? faExclamationCircle : faCheckCircle} className="text-lg" />
            </div>
            <span className="text-sm font-semibold">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <Header 
        title="Mitra Industri" 
        subtitle="Jaringan Daur Ulang Sidoarjo"
        rightContent={
          <div className="flex gap-2">
            <button 
              onClick={handleExportCSV} 
              className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-xs text-green-500 border border-gray-150 dark:border-slate-700 hover:bg-green-50 dark:hover:bg-green-950/20 transition flex items-center justify-center cursor-pointer"
              title="Export CSV"
            >
              <FontAwesomeIcon icon={faFileArrowDown} />
            </button>
            <button 
              onClick={openAddModal}
              className="w-10 h-10 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-sm flex items-center justify-center cursor-pointer"
              title="Tambah Mitra"
            >
              <FontAwesomeIcon icon={faPlus} />
            </button>
          </div>
        }
      />

      {/* Main Container */}
      <main className="flex-1 px-4 md:px-8 py-6 max-w-7xl mx-auto w-full">
        
        {/* Controls Layout */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center mb-6">
          <nav className="bg-white dark:bg-slate-800 shadow-sm border border-gray-100 dark:border-slate-750 p-1 rounded-xl inline-flex self-start transition-colors">
            <button 
              onClick={() => setActiveCategory('organik')} 
              className={`px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                activeCategory === 'organik' 
                ? "bg-green-600 text-white shadow-sm" 
                : "text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Organik
            </button>
            <button 
              onClick={() => setActiveCategory('non-organik')} 
              className={`px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                activeCategory === 'non-organik' 
                ? "bg-cyan-600 text-white shadow-sm" 
                : "text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Non-Organik
            </button>
          </nav>

          <div className="flex flex-row gap-2 items-center w-full md:w-auto">
            <button 
              onClick={() => navigate('/riwayat-mitra')} 
              className="bg-white dark:bg-slate-800 border border-gray-150 dark:border-slate-700 flex items-center justify-center w-11 h-11 rounded-xl text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-emerald-400 hover:border-green-300 transition duration-200 cursor-pointer"
              title="Lihat Riwayat Transaksi"
            >
              <FontAwesomeIcon icon={faHistory} className="text-md" />
            </button>
            
            <div className="search-container bg-white dark:bg-slate-800 border border-gray-155 dark:border-slate-700 flex items-center gap-2 px-3 py-2 rounded-xl flex-1 md:w-60 transition-colors">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="text-gray-400 dark:text-slate-500 text-sm" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama mitra..." 
                className="bg-transparent border-none outline-none text-sm text-gray-900 dark:text-white w-full placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
            
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white dark:bg-slate-800 shadow-sm text-gray-800 dark:text-white text-sm border border-gray-160 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-green-500 cursor-pointer transition-colors"
            >
              <option value="newest">Terbaru</option>
              <option value="nearest">Jarak Terdekat</option>
              <option value="capacity">Kebutuhan Tertinggi</option>
            </select>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Partners Card List */}
          <section className="lg:col-span-2 space-y-3">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-md font-bold text-gray-850 dark:text-white">Daftar Mitra</h3>
              <span className="text-xs font-semibold text-gray-400 dark:text-slate-500 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-750 px-2.5 py-1 rounded-md transition-colors">
                {filteredPartners.length} Mitra
              </span>
            </div>
            
            {filteredPartners.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-10 text-center border border-dashed border-gray-200 dark:border-slate-700 transition-colors duration-250">
                <FontAwesomeIcon icon={faMagnifyingGlass} className="text-4xl text-gray-300 dark:text-slate-650 mb-3" />
                <p className="text-gray-500 dark:text-gray-400">Tidak ada mitra ditemukan.</p>
                <button 
                  onClick={() => setSearchQuery('')}
                  className="text-green-600 dark:text-emerald-400 text-xs font-bold mt-2 hover:underline focus:outline-none"
                >
                  Reset Filter Pencarian
                </button>
              </div>
            ) : (
              filteredPartners.map(p => {
                const isOrg = p.category === 'organik';
                const themeColor = isOrg ? 'text-green-500 bg-green-500/10' : 'text-cyan-500 bg-cyan-500/10';
                const borderColor = isOrg ? 'border-l-green-500' : 'border-l-cyan-500';

                return (
                  <div 
                    key={p.id}
                    onClick={() => {
                      setSelectedPartner(p);
                      setShowDetailModal(true);
                    }}
                    className={`partner-card bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border-l-4 ${borderColor} border-t border-r border-b border-gray-100 dark:border-slate-750 cursor-pointer hover:shadow-lg transition transform hover:-translate-y-0.5 group relative overflow-hidden transition-colors duration-200`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-xl ${themeColor} flex items-center justify-center text-xl shrink-0`}>
                        <i className={`fa-solid ${p.icon || 'fa-building'}`}></i>
                      </div>
                      
                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 dark:text-white text-md truncate flex items-center gap-1.5">
                          {p.name}
                          {p.verified && (
                            <FontAwesomeIcon icon={faCircleCheck} className="text-blue-500 text-sm" />
                          )}
                        </h4>
                        <p className="text-gray-500 dark:text-gray-400 text-xs line-clamp-1 mb-2.5">
                          {p.desc}
                        </p>
                        <div className="flex items-center gap-3 text-xs font-semibold text-gray-600 dark:text-gray-400">
                          <span className="bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded flex items-center gap-1.5">
                            <FontAwesomeIcon icon={faWeightHanging} className="text-gray-400 dark:text-slate-500" />
                            {p.req}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <FontAwesomeIcon icon={faLocationDot} className="text-gray-400 dark:text-slate-500" />
                            {p.distance} km
                          </span>
                        </div>
                      </div>
                      <div className="text-gray-300 dark:text-slate-650 group-hover:text-green-600 dark:group-hover:text-emerald-400 transition self-center pr-1">
                        <FontAwesomeIcon icon={faChevronRight} />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </section>

          {/* Right: Analysis & Stats */}
          <aside className="flex flex-col gap-4">
            {/* Chart Analysis */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-750 transition-colors">
              <h4 className="text-gray-900 dark:text-white font-bold mb-1 text-md">Analisis Kapasitas</h4>
              <p className="text-xs text-gray-550 dark:text-gray-400 mb-4">Proporsi kebutuhan per mitra</p>
              <div className="relative h-48 flex justify-center">
                <canvas ref={chartRef} id="partnersChart"></canvas>
              </div>
            </div>

            {/* Summary details */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-750 transition-colors">
              <h4 className="text-gray-900 dark:text-white font-bold mb-3 text-md">Ringkasan Halaman</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 dark:bg-slate-750 border border-gray-100 dark:border-slate-700/50 p-3 rounded-xl text-center">
                  <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-slate-500">Total Mitra</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-white mt-1">{filteredPartners.length}</p>
                </div>
                <div className="bg-gray-50 dark:bg-slate-750 border border-gray-100 dark:border-slate-700/50 p-3 rounded-xl text-center flex flex-col justify-center">
                  <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-slate-500">Kategori Aktif</p>
                  <p className={`text-xs font-extrabold uppercase mt-1 ${activeCategory === 'organik' ? 'text-green-500' : 'text-cyan-500'}`}>
                    {activeCategory}
                  </p>
                </div>
              </div>
            </div>
          </aside>

        </div>
      </main>

      {/* MODAL 1: ADD / EDIT PARTNER */}
      {showAddEditModal && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex justify-center items-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6 relative animate-slide-in transition-colors duration-200">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {editPartnerId ? 'Edit Data Mitra' : 'Tambah Mitra Baru'}
              </h3>
              <button 
                onClick={() => setShowAddEditModal(false)} 
                className="text-gray-400 hover:text-red-500"
              >
                <FontAwesomeIcon icon={faXmark} className="text-xl" />
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nama Perusahaan</label>
                <input 
                  type="text" 
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required 
                  className="w-full bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm focus:ring-1 focus:ring-green-500 outline-none" 
                  placeholder="Nama Perusahaan"
                />
              </div>

              <div className="flex items-center gap-2 py-1">
                <input 
                  type="checkbox" 
                  id="inputVerified" 
                  checked={formVerified}
                  onChange={(e) => setFormVerified(e.target.checked)}
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500 bg-gray-100 dark:bg-slate-700 border-gray-300 dark:border-slate-600" 
                />
                <label htmlFor="inputVerified" className="text-sm text-gray-700 dark:text-gray-300 select-none flex items-center gap-1.5 cursor-pointer">
                  Tandai Mitra Terverifikasi 
                  <FontAwesomeIcon icon={faCircleCheck} className="text-blue-500 text-xs" />
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Keterangan / Jenis Sampah</label>
                <input 
                  type="text" 
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  required 
                  className="w-full bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm focus:ring-1 focus:ring-green-500 outline-none" 
                  placeholder="Jenis sampah cth: Botol, Kaleng, Makanan"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Kategori</label>
                  <select 
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm outline-none cursor-pointer"
                  >
                    <option value="organik">Organik</option>
                    <option value="non-organik">Non-Organik</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Jarak (KM)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    value={formDistance}
                    onChange={(e) => setFormDistance(e.target.value)}
                    required 
                    className="w-full bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm outline-none" 
                    placeholder="0.0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Kebutuhan Pasokan</label>
                <input 
                  type="text" 
                  value={formReq}
                  onChange={(e) => setFormReq(e.target.value)}
                  required 
                  className="w-full bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm outline-none mb-3" 
                  placeholder="Kapasitas (Contoh: 500 kg/minggu)"
                />
                
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nomor Telepon (WhatsApp)</label>
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2.5">
                  <span className="text-gray-400 dark:text-slate-500 text-sm font-bold">62</span>
                  <input 
                    type="number" 
                    value={formPhoneRaw}
                    onChange={(e) => setFormPhoneRaw(e.target.value)}
                    required 
                    className="w-full bg-transparent text-gray-900 dark:text-white outline-none text-sm" 
                    placeholder="81234567890"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowAddEditModal(false)} 
                  className="flex-1 py-2.5 rounded-xl font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-750 transition cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 rounded-xl font-semibold text-white bg-green-600 hover:bg-green-700 shadow-sm shadow-green-600/30 transition cursor-pointer"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PARTNER DETAIL (WITH MAP & ACTION BAR) */}
      {showDetailModal && selectedPartner && (
        <div className="fixed inset-0 bg-black/80 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden h-[90vh] sm:h-auto flex flex-col animate-modalFade max-h-[90vh] transition-colors duration-200">
            
            {/* Header */}
            <div className="relative h-24 flex items-center justify-between px-6 bg-gray-50 dark:bg-slate-850 border-b border-gray-100 dark:border-slate-750 shrink-0">
              <div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider mb-1 inline-block ${
                  selectedPartner.category === 'organik' ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-emerald-400' : 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400'
                }`}>
                  {selectedPartner.category}
                </span>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight truncate w-64">
                  {selectedPartner.name}
                </h2>
              </div>
              <button 
                onClick={() => setShowDetailModal(false)} 
                className="w-8 h-8 rounded-full bg-gray-250 hover:bg-gray-350 dark:bg-slate-700 dark:hover:bg-slate-650 text-gray-600 dark:text-gray-300 flex items-center justify-center transition focus:outline-none"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            {/* Scrollable details */}
            <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-800">
              
              {/* Leaflet Location Map */}
              <div className="w-full h-48 bg-gray-250 relative z-0">
                <LeafletMap 
                  lat={selectedPartner.lat || -7.4478} 
                  lng={selectedPartner.lng || 112.7183} 
                  zoom={14} 
                  popupText={selectedPartner.name}
                />
              </div>

              <div className="p-6">
                {/* Verified Badge info */}
                {selectedPartner.verified && (
                  <div className="mb-4 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 px-3 py-2 rounded-lg text-xs font-bold border border-blue-100 dark:border-blue-900/30 flex items-center gap-2">
                    <FontAwesomeIcon icon={faCircleCheck} className="text-base" /> 
                    <span>Mitra Terverifikasi Resmi Samling</span>
                  </div>
                )}

                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Jenis Sampah</label>
                <p className="text-gray-700 dark:text-gray-300 text-sm mb-6 leading-relaxed">
                  {selectedPartner.desc}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 dark:bg-slate-750 p-3 rounded-xl border border-gray-100 dark:border-slate-700/50">
                    <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-slate-500 mb-0.5">Jarak</p>
                    <p className="text-base font-bold text-gray-900 dark:text-white">{selectedPartner.distance} km</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-slate-750 p-3 rounded-xl border border-gray-100 dark:border-slate-700/50">
                    <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-slate-500 mb-0.5">Kebutuhan</p>
                    <p className="text-base font-bold text-gray-900 dark:text-white truncate" title={selectedPartner.req}>
                      {selectedPartner.req}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons footer */}
            <div className="p-4 border-t border-gray-100 dark:border-slate-750 bg-gray-50 dark:bg-slate-850 grid grid-cols-4 gap-3 shrink-0">
              <button 
                onClick={() => handleCallWhatsApp(selectedPartner)}
                className="col-span-2 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white shadow-sm transition cursor-pointer"
              >
                <FontAwesomeIcon icon={faWhatsapp} className="text-lg" />
                <span className="text-sm font-bold">WhatsApp</span>
              </button>
              
              <button 
                onClick={() => openEditModal(selectedPartner)}
                className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-yellow-50 dark:hover:bg-yellow-950/20 hover:border-yellow-200 hover:text-yellow-600 transition text-gray-500 dark:text-gray-450 cursor-pointer"
                title="Edit Mitra"
              >
                <FontAwesomeIcon icon={faPenToSquare} />
              </button>
              
              <button 
                onClick={() => handleDeletePartner(selectedPartner.id)}
                className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-200 hover:text-red-600 transition text-gray-500 dark:text-gray-450 cursor-pointer"
                title="Hapus Mitra"
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <BottomNav />
    </div>
  );
}
