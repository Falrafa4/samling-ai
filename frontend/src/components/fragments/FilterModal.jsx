import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faRotateLeft, faFilter } from '@fortawesome/free-solid-svg-icons';

export default function FilterModal({ isOpen, onClose, zones, onApply, initialFilters }) {
  const [filters, setFilters] = useState({
    wilayah: '',
    kecamatan: '',
    kelurahan: '',
    jenis_tps: ''
  });

  const uniqueWilayah = [...new Set(zones.map(z => z.wilayah).filter(Boolean))].sort();
  const uniqueJenisTps = [...new Set(zones.map(z => z.jenis_tps).filter(Boolean))].sort();

  const filteredKecamatan = !filters.wilayah
    ? [...new Set(zones.map(z => z.kecamatan).filter(Boolean))].sort()
    : [...new Set(zones.filter(z => z.wilayah === filters.wilayah).map(z => z.kecamatan).filter(Boolean))].sort();

  const filteredKelurahan = !filters.kecamatan
    ? [...new Set(zones.filter(z => !filters.wilayah || z.wilayah === filters.wilayah).map(z => z.kelurahan).filter(Boolean))].sort()
    : [...new Set(zones.filter(z => z.kecamatan === filters.kecamatan).map(z => z.kelurahan).filter(Boolean))].sort();

  useEffect(() => {
    if (isOpen) {
      setFilters(initialFilters || { wilayah: '', kecamatan: '', kelurahan: '', jenis_tps: '' });
    }
  }, [isOpen, initialFilters]);

  useEffect(() => {
    if (filters.wilayah) {
      setFilters(prev => {
        const kecamatanInWilayah = [...new Set(zones.filter(z => z.wilayah === filters.wilayah).map(z => z.kecamatan).filter(Boolean))].sort();
        if (!kecamatanInWilayah.includes(prev.kecamatan)) {
          return { ...prev, kecamatan: '', kelurahan: '' };
        }
        return prev;
      });
    }
  }, [filters.wilayah]);

  useEffect(() => {
    if (filters.kecamatan) {
      setFilters(prev => {
        const kelurahanInKecamatan = [...new Set(zones.filter(z => z.kecamatan === filters.kecamatan).map(z => z.kelurahan).filter(Boolean))].sort();
        if (!kelurahanInKecamatan.includes(prev.kelurahan)) {
          return { ...prev, kelurahan: '' };
        }
        return prev;
      });
    }
  }, [filters.kecamatan]);

  const handleReset = () => {
    setFilters({ wilayah: '', kecamatan: '', kelurahan: '', jenis_tps: '' });
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
              onChange={(e) => setFilters(prev => ({ ...prev, wilayah: e.target.value }))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 appearance-none cursor-pointer"
            >
              <option value="">Semua Wilayah</option>
              {uniqueWilayah.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Kecamatan</label>
            <select
              value={filters.kecamatan}
              onChange={(e) => setFilters(prev => ({ ...prev, kecamatan: e.target.value }))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 appearance-none cursor-pointer"
            >
              <option value="">Semua Kecamatan</option>
              {filteredKecamatan.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Kelurahan</label>
            <select
              value={filters.kelurahan}
              onChange={(e) => setFilters(prev => ({ ...prev, kelurahan: e.target.value }))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 appearance-none cursor-pointer"
            >
              <option value="">Semua Kelurahan</option>
              {filteredKelurahan.map(k => <option key={k} value={k}>{k}</option>)}
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
              {uniqueJenisTps.map(j => <option key={j} value={j}>{j}</option>)}
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
