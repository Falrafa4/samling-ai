import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faSpinner, faCalendarDays, faMapPin, faFileLines, faGaugeHigh, faLocationDot, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';

const WILAYAH_OPTIONS = [
  'Jakarta Pusat',
  'Jakarta Utara',
  'Jakarta Barat',
  'Jakarta Selatan',
  'Jakarta Timur',
  'Kepulauan Seribu'
];

export default function EventModal({ isOpen, onClose, event = null, onSave }) {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState('');
  const [wilayah, setWilayah] = useState('Jakarta Pusat');
  const [kecamatan, setKecamatan] = useState('');
  const [urgencyScore, setUrgencyScore] = useState(0.5);
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (event) {
        setName(event.name || '');
        // format date strings to YYYY-MM-DD for date inputs
        setStartDate(event.start_date ? event.start_date.substring(0, 10) : '');
        setEndDate(event.end_date ? event.end_date.substring(0, 10) : '');
        setLocation(event.location || '');
        setWilayah(event.wilayah || 'Jakarta Pusat');
        setKecamatan(event.kecamatan || '');
        setUrgencyScore(event.urgency_score !== undefined ? event.urgency_score : 0.5);
        setDescription(event.description || '');
      } else {
        setName('');
        setStartDate('');
        setEndDate('');
        setLocation('');
        setWilayah('Jakarta Pusat');
        setKecamatan('');
        setUrgencyScore(0.5);
        setDescription('');
      }
      setError('');
    }
  }, [isOpen, event]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !startDate || !endDate || !wilayah || !kecamatan) {
      setError('Harap isi semua bidang wajib.');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError('Tanggal mulai tidak boleh melebihi tanggal selesai.');
      return;
    }

    const payload = {
      name,
      start_date: startDate,
      end_date: endDate,
      location: location || null,
      wilayah,
      kecamatan,
      urgency_score: parseFloat(urgencyScore),
      description: description || null
    };

    if (isNaN(payload.urgency_score) || payload.urgency_score < 0 || payload.urgency_score > 1) {
      setError('Urgency score harus berada di antara 0.0 dan 1.0.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err.message || 'Gagal menyimpan data event.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-slide-in overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white sticky top-0 z-10 select-none">
          <h3 className="text-sm font-bold text-slate-800">
            {event ? 'Edit Master Event' : 'Tambah Event Baru'}
          </h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center cursor-pointer shrink-0"
          >
            <FontAwesomeIcon icon={faXmark} className="text-sm" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs font-semibold text-red-600">
              <FontAwesomeIcon icon={faTriangleExclamation} className="mr-1.5" /> {error}
            </div>
          )}

          {/* Event Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Nama Event</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <FontAwesomeIcon icon={faCalendarDays} className="text-xs" />
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="cth. Pekan Raya Jakarta"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                required
                maxLength={150}
              />
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tanggal Mulai</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white focus:border-emerald-500 transition-all cursor-pointer"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tanggal Selesai</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white focus:border-emerald-500 transition-all cursor-pointer"
                required
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Detail Lokasi (Opsional)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <FontAwesomeIcon icon={faLocationDot} className="text-xs" />
              </span>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="cth. Gedung JIExpo Kemayoran"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                maxLength={150}
              />
            </div>
          </div>

          {/* Wilayah & Kecamatan */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Wilayah</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                  <FontAwesomeIcon icon={faMapPin} className="text-xs" />
                </span>
                <select
                  value={wilayah}
                  onChange={(e) => setWilayah(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white focus:border-emerald-500 cursor-pointer"
                  required
                >
                  {WILAYAH_OPTIONS.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Kecamatan</label>
              <input
                type="text"
                value={kecamatan}
                onChange={(e) => setKecamatan(e.target.value)}
                placeholder="cth. Kemayoran"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                required
                maxLength={50}
              />
            </div>
          </div>

          {/* Urgency Score */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Urgency Score (0.00 - 1.00)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <FontAwesomeIcon icon={faGaugeHigh} className="text-xs" />
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={urgencyScore}
                onChange={(e) => setUrgencyScore(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Deskripsi Event (Opsional)</label>
            <div className="relative">
              <span className="absolute top-2.5 left-0 pl-3 flex items-start text-slate-400 pointer-events-none">
                <FontAwesomeIcon icon={faFileLines} className="text-xs" />
              </span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tuliskan keterangan detail event..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all min-h-20 max-h-40"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5 bg-white sticky bottom-0">
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
