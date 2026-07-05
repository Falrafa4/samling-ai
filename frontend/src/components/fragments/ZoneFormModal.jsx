import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faSpinner } from '@fortawesome/free-solid-svg-icons';

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
    latitude: '',
    longitude: '',
    risk_status: 'Normal'
  });

  // Sync form data with editingZone
  useEffect(() => {
    if (editingZone) {
      setFormData({
        name: editingZone.name,
        latitude: editingZone.latitude.toString(),
        longitude: editingZone.longitude.toString(),
        risk_status: editingZone.risk_status
      });
    } else {
      setFormData({
        name: '',
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
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-slide-in">
        {/* Form Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center select-none">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">
              {editingZone ? 'Perbarui Wilayah TPS' : 'Daftarkan Wilayah Baru'}
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Isi data koordinat dan level urgensi wilayah untuk dipetakan.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-lg">
              ⚠️ {errorMessage}
            </div>
          )}

          {/* Name Field */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Nama Wilayah TPS
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Contoh: TPS 06 - Bratang Gede"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-850 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              required
            />
          </div>

          {/* Coordinates Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Garis Lintang (Lat)
              </label>
              <input
                type="text"
                name="latitude"
                value={formData.latitude}
                onChange={handleInputChange}
                placeholder="Contoh: -6.194400"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-mono text-slate-850 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Garis Bujur (Lng)
              </label>
              <input
                type="text"
                name="longitude"
                value={formData.longitude}
                onChange={handleInputChange}
                placeholder="Contoh: 106.767200"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-mono text-slate-850 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          {/* Risk Status Select */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Tingkat Urgensi AI (Risk Status)
            </label>
            <select
              name="risk_status"
              value={formData.risk_status}
              onChange={handleInputChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:bg-white focus:border-emerald-500 cursor-pointer"
            >
              <option value="Normal">Normal (Aman)</option>
              <option value="Warning">Warning (Waspada)</option>
              <option value="High Priority">High Priority (Kritis)</option>
            </select>
          </div>

          {/* Form Footer */}
          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
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
