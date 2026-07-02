import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileArrowDown, faArrowLeft, faMagnifyingGlass, faFolderOpen } from '@fortawesome/free-solid-svg-icons';
import BottomNav from '../components/BottomNav';
import Header from '../components/Header';
import { exportToCSV } from '../utils/helpers';
import { defaultTransactions } from '../utils/mockData';

export default function RiwayatMitra() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  
  // Filters State
  const [activePeriod, setActivePeriod] = useState('3days'); // '3days', 'week', 'month', 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all', 'organik', 'non-organik'
  const [minKg, setMinKg] = useState('');
  const [maxKg, setMaxKg] = useState('');

  const TRANSACTIONS_KEY = 'samling_transactions';

  useEffect(() => {
    // Auth Check
    const username = localStorage.getItem('username');
    if (!username) {
      navigate('/login');
      return;
    }

    // Load transactions history
    const stored = localStorage.getItem(TRANSACTIONS_KEY);
    if (stored) {
      setTransactions(JSON.parse(stored));
    } else {
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(defaultTransactions));
      setTransactions(defaultTransactions);
    }
  }, [navigate]);

  // Apply filters in memory
  const getFilteredTransactions = () => {
    // 1. Date filter
    const now = new Date();
    let startDate = new Date(0); // The beginning of time

    if (activePeriod === '3days') {
      startDate = new Date(now.setDate(now.getDate() - 3));
    } else if (activePeriod === 'week') {
      startDate = new Date(now.setDate(now.getDate() - 7));
    } else if (activePeriod === 'month') {
      startDate = new Date(now.setMonth(now.getMonth() - 1));
    }

    let filtered = transactions.filter(t => new Date(t.tanggal) >= startDate);

    // 2. Search, category, weight filters (on nested 'sampah' items)
    const minWeight = parseFloat(minKg) || 0;
    const maxWeight = parseFloat(maxKg) || Infinity;

    return filtered.map(trx => {
      const matchingSampah = trx.sampah.filter(item => {
        const matchesSearch = item.tipe.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || item.kategori === categoryFilter;
        const matchesWeight = item.berat >= minWeight && item.berat <= maxWeight;
        return matchesSearch && matchesCategory && matchesWeight;
      });

      if (matchingSampah.length > 0) {
        return { ...trx, sampah: matchingSampah };
      }
      return null;
    }).filter(Boolean);
  };

  const filteredTransactions = getFilteredTransactions();

  const handleResetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setMinKg('');
    setMaxKg('');
    setActivePeriod('3days');
  };

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      alert("Tidak ada data untuk diexport. Ubah filter Anda dan coba lagi.");
      return;
    }

    // Flatten transactions into csv rows
    const csvData = [];
    filteredTransactions.forEach(trx => {
      trx.sampah.forEach(item => {
        csvData.push({
          nama: trx.nama,
          tanggal: new Date(trx.tanggal),
          tipe: item.tipe,
          kategori: item.kategori,
          berat: item.berat
        });
      });
    });

    const headers = ["Nama Mitra", "Tanggal", "Tipe Sampah", "Kategori", "Berat (kg)"];
    const keys = ["nama", "tanggal", "tipe", "kategori", "berat"];
    exportToCSV(csvData, 'riwayat_transaksi_mitra.csv', headers, keys);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col text-gray-900 dark:text-gray-100 pb-24 transition-colors duration-200">
      
      {/* Header */}
      <Header 
        title="Riwayat Transaksi" 
        subtitle="Daftar transaksi dengan mitra daur ulang"
        showBack={true}
        onBack={() => navigate('/mitra')}
        rightContent={
          <button 
            onClick={handleExportCSV} 
            className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-xs text-green-500 border border-gray-150 dark:border-slate-700 hover:bg-green-50 dark:hover:bg-green-950/20 transition flex items-center justify-center cursor-pointer"
            title="Export CSV"
          >
            <FontAwesomeIcon icon={faFileArrowDown} />
          </button>
        }
      />

      <main className="flex-1 px-4 md:px-8 py-6 max-w-xl mx-auto w-full">
        
        {/* Controls Layout */}
        <div className="space-y-4 mb-6">
          {/* Time periods */}
          <div className="bg-white dark:bg-slate-800 shadow-sm border border-gray-100 dark:border-slate-750 p-2 rounded-xl flex flex-wrap items-center gap-2 transition-colors">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 px-2 uppercase tracking-wider">Periode:</span>
            <nav className="inline-flex bg-gray-100 dark:bg-slate-700 p-0.5 rounded-lg transition-colors">
              {['3days', 'week', 'month', 'all'].map(p => {
                const labelMap = { '3days': '3 Hari', 'week': 'Minggu', 'month': 'Bulan', 'all': 'Semua' };
                return (
                  <button
                    key={p}
                    onClick={() => setActivePeriod(p)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                      activePeriod === p
                      ? 'bg-green-600 text-white shadow-xs'
                      : 'text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-white'
                    }`}
                  >
                    {labelMap[p]}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Search, Category, Weight inputs */}
          <div className="bg-white dark:bg-slate-800 shadow-sm border border-gray-100 dark:border-slate-750 p-4 rounded-xl space-y-3 transition-colors">
            
            {/* Search Input */}
            <div className="search-container flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-650 bg-gray-50 dark:bg-slate-900 transition-colors">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="text-gray-400 dark:text-slate-500 text-sm" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari jenis sampah..." 
                className="bg-transparent border-none outline-none text-sm text-gray-900 dark:text-white w-full placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

            {/* Sub Filter Row */}
            <div className="grid grid-cols-2 gap-2">
              <select 
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-gray-55 dark:bg-slate-700 text-gray-900 dark:text-white text-xs border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2.5 outline-none cursor-pointer w-full transition-colors"
              >
                <option value="all">Semua Kategori</option>
                <option value="organik">Organik</option>
                <option value="non-organik">Non-Organik</option>
              </select>

              <button 
                onClick={handleResetFilters} 
                className="bg-red-500 hover:bg-red-650 text-white rounded-xl py-2 px-3 text-xs font-bold transition cursor-pointer"
              >
                Reset Filter
              </button>
            </div>

            {/* Min-Max Weights */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-50 dark:border-slate-750">
              <input 
                type="number" 
                value={minKg} 
                onChange={(e) => setMinKg(e.target.value)}
                placeholder="Min kg" 
                className="bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-xs border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2.5 outline-none w-full placeholder-gray-400 dark:placeholder-gray-500 transition-colors" 
              />
              <input 
                type="number" 
                value={maxKg} 
                onChange={(e) => setMaxKg(e.target.value)}
                placeholder="Max kg" 
                className="bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-xs border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2.5 outline-none w-full placeholder-gray-400 dark:placeholder-gray-500 transition-colors" 
              />
            </div>

          </div>
        </div>

        {/* Transaction History List */}
        <section className="space-y-4">
          {filteredTransactions.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-16 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-750 transition-colors">
              <FontAwesomeIcon icon={faFolderOpen} className="text-4xl text-gray-300 dark:text-slate-650 mb-4" />
              <p className="text-sm font-semibold">Tidak ada riwayat transaksi yang sesuai.</p>
            </div>
          ) : (
            filteredTransactions.map(trx => {
              const totalWeight = trx.sampah.reduce((sum, item) => sum + item.berat, 0);
              
              return (
                <div 
                  key={trx.id} 
                  className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-gray-150 dark:border-slate-750 transition-colors duration-200"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-extrabold text-gray-900 dark:text-white text-md">
                        {trx.nama}
                      </h3>
                      <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">
                        {new Date(trx.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-green-600 dark:text-emerald-400 text-md">
                        {totalWeight.toFixed(1)} kg
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-slate-500">Total Berat</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 border-t border-gray-100 dark:border-slate-700/60 pt-4">
                    <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                      Rincian Sampah (Sesuai Filter):
                    </p>
                    <ul className="space-y-2">
                      {trx.sampah.map((item, i) => (
                        <li key={i} className="flex justify-between items-center text-xs">
                          <span className="text-gray-700 dark:text-gray-300 font-medium">
                            {item.tipe}{' '}
                            <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ml-1.5 ${
                              item.kategori === 'organik' ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-emerald-400' : 'bg-blue-100 text-blue-750 dark:bg-blue-950/40 dark:text-blue-400'
                            }`}>
                              {item.kategori}
                            </span>
                          </span>
                          <span className="font-bold text-gray-800 dark:text-slate-300">
                            {item.berat} kg
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })
          )}
        </section>

      </main>

      <BottomNav />
    </div>
  );
}
