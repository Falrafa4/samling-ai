import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXmark,
  faSpinner,
  faChevronDown,
  faChevronUp,
  faMapPin,
  faGlobe
} from '@fortawesome/free-solid-svg-icons';

export default function ZoneFormModal({
  isOpen,
  onClose,
  onSubmit,
  editingZone,
  submitting,
  errorMessage,
  clearError
}) {
  const [formData, setFormData] = useState({
    name: '',
    wilayah: '',
    kecamatan: '',
    kelurahan: '',
    jenis_tps: '',
    alamat: '',
    latitude: '',
    longitude: '',
    risk_status: 'Normal'
  });
  const [showCoord, setShowCoord] = useState(false);

  useEffect(() => {
    if (editingZone) {
      setFormData({
        name: editingZone.name || '',
        wilayah: editingZone.wilayah || '',
        kecamatan: editingZone.kecamatan || '',
        kelurahan: editingZone.kelurahan || '',
        jenis_tps: editingZone.jenis_tps || '',
        alamat: editingZone.alamat || '',
        latitude: editingZone.latitude?.toString() || '',
        longitude: editingZone.longitude?.toString() || '',
        risk_status: editingZone.risk_status || 'Normal'
      });
    } else {
      setFormData({
        name: '',
        wilayah: '',
        kecamatan: '',
        kelurahan: '',
        jenis_tps: '',
        alamat: '',
        latitude: '',
        longitude: '',
        risk_status: 'Normal'
      });
    }
  }, [editingZone, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    if (clearError) clearError();
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-slide-in">
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <FontAwesomeIcon icon={editingZone ? faMapPin : faGlobe} className="text-[11px]" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                {editingZone ? 'Perbarui Wilayah TPS' : 'Daftarkan Wilayah Baru'}
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Lengkapi data wilayah TPS untuk pemetaan dan monitoring
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center cursor-pointer shrink-0"
          >
            <FontAwesomeIcon icon={faXmark} className="text-xs" />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="p-5 space-y-2.5">
          {errorMessage && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-[11px] font-semibold rounded-lg">
              ⚠️ {errorMessage}
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
              Nama Wilayah TPS <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="TPS RW 01 Semper Barat"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Wilayah</label>
              <input
                type="text"
                name="wilayah"
                value={formData.wilayah}
                onChange={handleInputChange}
                placeholder="Jakarta Timur"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Kecamatan</label>
              <input
                type="text"
                name="kecamatan"
                value={formData.kecamatan}
                onChange={handleInputChange}
                placeholder="Cilincing"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Kelurahan</label>
              <input
                type="text"
                name="kelurahan"
                value={formData.kelurahan}
                onChange={handleInputChange}
                placeholder="Semper Barat"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Jenis TPS</label>
              <input
                type="text"
                name="jenis_tps"
                value={formData.jenis_tps}
                onChange={handleInputChange}
                placeholder="Tipe 4"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Alamat</label>
            <input
              type="text"
              name="alamat"
              value={formData.alamat}
              onChange={handleInputChange}
              placeholder="Jl Belibis IV, RW 01"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                Status Risiko AI <span className="text-red-400">*</span>
              </label>
              <select
                name="risk_status"
                value={formData.risk_status}
                onChange={handleInputChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 appearance-none cursor-pointer"
              >
                <option value="Normal">Normal (Aman)</option>
                <option value="Warning">Warning (Waspada)</option>
                <option value="High Priority">High Priority (Kritis)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                Koordinat
              </label>
              <button
                type="button"
                onClick={() => setShowCoord(!showCoord)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-between cursor-pointer"
              >
                <span className="font-medium">{showCoord ? 'Sembunyikan' : 'Tampilkan'}</span>
                <FontAwesomeIcon icon={showCoord ? faChevronUp : faChevronDown} className="text-[9px]" />
              </button>
            </div>
          </div>

          {showCoord && (
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Latitude <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  placeholder="-6.194400"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[11px] font-mono text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Longitude <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  placeholder="106.767200"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[11px] font-mono text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
            >
              {submitting ? (
                <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
              ) : (
                <span>{editingZone ? 'Simpan Perubahan' : 'Daftarkan Wilayah'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
