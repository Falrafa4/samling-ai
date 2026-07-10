import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faSpinner, faTruck, faFolderOpen, faGaugeHigh, faHashtag } from '@fortawesome/free-solid-svg-icons';

const FLEET_TYPES = [
  'Motor Gerobak',
  'Gerobak',
  'Mini Dump Truck',
  'Dump Truck',
  'Arm Roll',
  'Compactor',
  'Truk Tronton',
  'Sweeper',
  'Excavator',
  'Bulldozer',
  'Loader',
  'Lainnya'
];

export default function FleetModal({ isOpen, onClose, fleet = null, onSave }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Tengah');
  const [type, setType] = useState('Dump Truck');
  const [capacity, setCapacity] = useState('');
  const [totalUnits, setTotalUnits] = useState('0');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (fleet) {
        setName(fleet.name || '');
        setCategory(fleet.category || 'Tengah');
        setType(fleet.type || 'Dump Truck');
        setCapacity(fleet.capacity || '');
        setTotalUnits(fleet.total_units?.toString() || '0');
      } else {
        setName('');
        setCategory('Tengah');
        setType('Dump Truck');
        setCapacity('');
        setTotalUnits('0');
      }
      setError('');
    }
  }, [isOpen, fleet]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !category || !type) {
      setError('Harap isi semua bidang wajib.');
      return;
    }

    const payload = {
      name,
      category,
      type,
      capacity: capacity || null,
      total_units: parseInt(totalUnits) || 0,
    };

    if (payload.total_units < 0) {
      setError('Jumlah unit tidak boleh negatif.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err.message || 'Gagal menyimpan data armada.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-slide-in overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white sticky top-0 z-10 select-none">
          <h3 className="text-sm font-bold text-slate-800">
            {fleet ? 'Edit Tipe Armada' : 'Tambah Tipe Armada Baru'}
          </h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center cursor-pointer shrink-0"
          >
            <FontAwesomeIcon icon={faXmark} className="text-sm" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs font-semibold text-red-600">
              ⚠️ {error}
            </div>
          )}

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Nama Armada</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <FontAwesomeIcon icon={faTruck} className="text-xs" />
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="cth. Truk Compactor RDF"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                required
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Kategori Operasional</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <FontAwesomeIcon icon={faFolderOpen} className="text-xs" />
              </span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white focus:border-emerald-500 cursor-pointer"
                required
              >
                <option value="Hulu">Hulu (Kolektor Lingkungan)</option>
                <option value="Tengah">Tengah (Transportasi Makro)</option>
                <option value="Hilir">Hilir (Alat Berat TPST)</option>
              </select>
            </div>
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Jenis Kendaraan</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <FontAwesomeIcon icon={faTruck} className="text-xs" />
              </span>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white focus:border-emerald-500 cursor-pointer"
                required
              >
                {FLEET_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Capacity */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Kapasitas Muatan (Opsional)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <FontAwesomeIcon icon={faGaugeHigh} className="text-xs" />
              </span>
              <input
                type="text"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="cth. 5 Ton / 8 m3"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Total Units */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Jumlah Unit Armada</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <FontAwesomeIcon icon={faHashtag} className="text-xs" />
              </span>
              <input
                type="number"
                min="0"
                value={totalUnits}
                onChange={(e) => setTotalUnits(e.target.value)}
                placeholder="cth. 148"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                required
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-950/15 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {loading && <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs" />}
              <span>Simpan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
