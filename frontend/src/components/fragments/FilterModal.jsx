import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faRotateLeft, faFilter } from '@fortawesome/free-solid-svg-icons';
import { api } from '../../services/api';

const emptyFilters = {
  wilayah: '',
  kecamatan: '',
  kelurahan: '',
  jenis_tps: ''
};

export default function FilterModal({ isOpen, onClose, onApply, initialFilters }) {
  const [filters, setFilters] = useState(emptyFilters);
  const [filterOptions, setFilterOptions] = useState({
    wilayah: [],
    kecamatan: [],
    kelurahan: [],
    jenis_tps: []
  });

  useEffect(() => {
    if (isOpen) {
      setFilters(initialFilters || emptyFilters);
    }
  }, [isOpen, initialFilters]);

  useEffect(() => {
    if (!isOpen) return;

    async function fetchFilterOptions() {
      try {
        const res = await api.getZonesFilterOptions({
          wilayah: filters.wilayah,
          kecamatan: filters.kecamatan
        });
        if (res.success) {
          setFilterOptions(res.data);
        }
      } catch (err) {
        console.error('Gagal memuat opsi filter:', err);
      }
    }

    fetchFilterOptions();
  }, [isOpen, filters.wilayah, filters.kecamatan]);

  const handleReset = () => {
    setFilters(emptyFilters);
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm mx-4 shadow-2xl animate-slide-in">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FontAwesomeIcon icon={faFilter} className="text-xs" />
            </span>
            <h3 className="text-sm font-bold text-slate-800">Filter Wilayah TPS</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center cursor-pointer"
          >
            <FontAwesomeIcon icon={faXmark} className="text-sm" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Wilayah</label>
            <select
              value={filters.wilayah}
              onChange={(e) => setFilters(prev => ({ ...prev, wilayah: e.target.value, kecamatan: '', kelurahan: '' }))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 appearance-none cursor-pointer"
            >
              <option value="">Semua Wilayah</option>
              {filterOptions.wilayah.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Kecamatan</label>
            <select
              value={filters.kecamatan}
              onChange={(e) => setFilters(prev => ({ ...prev, kecamatan: e.target.value, kelurahan: '' }))}
              disabled={!filters.wilayah}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 appearance-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">{filters.wilayah ? 'Semua Kecamatan' : 'Pilih wilayah terlebih dahulu'}</option>
              {filterOptions.kecamatan.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Kelurahan</label>
            <select
              value={filters.kelurahan}
              onChange={(e) => setFilters(prev => ({ ...prev, kelurahan: e.target.value }))}
              disabled={!filters.kecamatan}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 appearance-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">{filters.kecamatan ? 'Semua Kelurahan' : 'Pilih kecamatan terlebih dahulu'}</option>
              {filterOptions.kelurahan.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Jenis TPS</label>
            <select
              value={filters.jenis_tps}
              onChange={(e) => setFilters(prev => ({ ...prev, jenis_tps: e.target.value }))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 appearance-none cursor-pointer"
            >
              <option value="">Semua Jenis TPS</option>
              {filterOptions.jenis_tps.map(j => <option key={j} value={j}>{j}</option>)}
            </select>
          </div>
        </div>

        <div className="px-6 pb-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FontAwesomeIcon icon={faRotateLeft} />
            <span>Reset</span>
          </button>
          <button
            onClick={handleApply}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer shadow-md shadow-emerald-950/20"
          >
            Terapkan Filter
          </button>
        </div>
      </div>
    </div>
  );
}
