import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faSpinner, faUser, faPhone, faMapPin, faLock, faTruck, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';

export default function DriverModal({ isOpen, onClose, driver = null, fleets = [], onSave }) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [fleetId, setFleetId] = useState('');
  const [status, setStatus] = useState('Offline');
  const [coverageArea, setCoverageArea] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (driver) {
        setName(driver.name || '');
        setUsername(driver.username || '');
        setPassword(''); // Kosongkan password saat edit
        setWhatsappNumber(driver.whatsapp_number || '');
        setFleetId(driver.fleet_id || '');
        setCoverageArea(driver.coverage_area || '');
        setStatus(driver.status || 'Offline');
      } else {
        setName('');
        setUsername('');
        setPassword('');
        setWhatsappNumber('628');
        setFleetId('');
        setCoverageArea('');
        setStatus('Offline');
      }
      setError('');
    }
  }, [isOpen, driver, fleets]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !username || !whatsappNumber) {
      setError('Harap isi semua bidang wajib.');
      return;
    }

    if (!driver && !password) {
      setError('Password wajib diisi untuk driver baru.');
      return;
    }

    const payload = {
      name,
      username,
      whatsapp_number: whatsappNumber,
      fleet_id: fleetId ? Number(fleetId) : null,
      coverage_area: coverageArea || null,
    };

    if (password) {
      payload.password = password;
    }

    if (driver) {
      payload.status = status;
    }

    try {
      setLoading(true);
      setError('');
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err.message || 'Gagal menyimpan data driver.');
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
            {driver ? 'Edit Data Driver' : 'Daftarkan Driver Baru'}
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
              <FontAwesomeIcon icon={faTriangleExclamation} className="mr-1.5" /> {error}
            </div>
          )}

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Nama Lengkap</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <FontAwesomeIcon icon={faUser} className="text-xs" />
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="cth. Budi Utomo"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                required
              />
            </div>
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Username Sistem</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <FontAwesomeIcon icon={faUser} className="text-xs" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="cth. driver_budi"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
              {driver ? 'Ganti Password (Opsional)' : 'Password Akun'}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <FontAwesomeIcon icon={faLock} className="text-xs" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={driver ? 'Biarkan kosong jika tidak diganti' : 'cth. password123'}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                required={!driver}
              />
            </div>
          </div>

          {/* WhatsApp Number */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Nomor WhatsApp (Format 62xxx)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <FontAwesomeIcon icon={faPhone} className="text-xs" />
              </span>
              <input
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="cth. 6281234567890"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                required
              />
            </div>
          </div>

          {/* Fleet ID Selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Armada Kendaraan Tugas</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <FontAwesomeIcon icon={faTruck} className="text-xs" />
              </span>
              <select
                value={fleetId}
                onChange={(e) => setFleetId(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white focus:border-emerald-500 cursor-pointer"
              >
                <option value="">-- Belum Ditugaskan / Tanpa Kendaraan --</option>
                {fleets.map((f) => (
                  <option key={f.id} value={f.id}>
                    [{f.category}] {f.name} ({f.capacity || 'Tanpa Kapasitas'})
                  </option>
                ))}
              </select>
            </div>
          </div>
 
          {/* Coverage Area Selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Jangkauan Area Tugas</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <FontAwesomeIcon icon={faMapPin} className="text-xs" />
              </span>
              <select
                value={coverageArea}
                onChange={(e) => setCoverageArea(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white focus:border-emerald-500 cursor-pointer"
                required
              >
                <option value="">-- Pilih Wilayah Tugas --</option>
                <option value="Jakarta Pusat">Jakarta Pusat</option>
                <option value="Jakarta Utara">Jakarta Utara</option>
                <option value="Jakarta Barat">Jakarta Barat</option>
                <option value="Jakarta Selatan">Jakarta Selatan</option>
                <option value="Jakarta Timur">Jakarta Timur</option>
                <option value="Kepulauan Seribu">Kepulauan Seribu</option>
              </select>
            </div>
          </div>

          {/* Status (Only when editing) */}
          {driver && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Status Kerja</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white focus:border-emerald-500 cursor-pointer"
              >
                <option value="Available">Available (Siap Ditugaskan)</option>
                <option value="On Duty">On Duty (Sedang Jalan)</option>
                <option value="Offline">Offline</option>
              </select>
            </div>
          )}

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
