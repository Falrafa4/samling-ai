import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faSpinner, faMapPin, faMicrochip, faChartSimple, faPercent, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';

const SENSOR_TYPES = [
  { value: 'Ultrasonic-Organic', label: 'Ultrasonic - Organik (Kapasitas)' },
  { value: 'Ultrasonic-Anorganic', label: 'Ultrasonic - Anorganik (Kapasitas)' },
  { value: 'MQ-135', label: 'MQ-135 (Gas)' },
  { value: 'DHT-22-Temp', label: 'DHT-22 - Suhu (°C)' },
  { value: 'DHT-22-Humid', label: 'DHT-22 - Kelembapan (%)' }
];

export default function SensorModal({ isOpen, onClose, sensor = null, zones = [], onSave }) {
  const [zoneId, setZoneId] = useState('');
  const [sensorType, setSensorType] = useState('Ultrasonic-Organic');
  const [value, setValue] = useState('0');
  const [fillPercentage, setFillPercentage] = useState('0');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isUltrasonic = sensorType.startsWith('Ultrasonic');

  useEffect(() => {
    if (isOpen) {
      if (sensor) {
        setZoneId(sensor.zone_id || '');
        setSensorType(sensor.sensor_type || 'Ultrasonic-Organic');
        setValue(sensor.value?.toString() || '0');
        setFillPercentage(sensor.fill_percentage?.toString() || '0');
      } else {
        setZoneId(zones.length > 0 ? zones[0].id : '');
        setSensorType('Ultrasonic-Organic');
        setValue('0');
        setFillPercentage('0');
      }
      setError('');
    }
  }, [isOpen, sensor, zones]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!zoneId || !sensorType || !value) {
      setError('Harap isi semua bidang wajib.');
      return;
    }

    const payload = {
      zone_id: Number(zoneId),
      sensor_type: sensorType,
      value: parseFloat(value),
      fill_percentage: isUltrasonic ? parseFloat(fillPercentage) : 0.0,
    };

    if (isNaN(payload.value) || (isUltrasonic && isNaN(payload.fill_percentage))) {
      setError('Nilai sensor harus berupa angka.');
      return;
    }

    if (isUltrasonic && (payload.fill_percentage < 0 || payload.fill_percentage > 100)) {
      setError('Persentase kapasitas harus di antara 0% - 100%.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err.message || 'Gagal menyimpan data sensor.');
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
            {sensor ? 'Edit Data Sensor' : 'Pasang Sensor Baru'}
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

          {/* Zone ID Selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Pilih TPS Lokasi</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <FontAwesomeIcon icon={faMapPin} className="text-xs" />
              </span>
              <select
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white focus:border-emerald-500 cursor-pointer"
                required
                disabled={!!sensor} // Jangan izinkan ubah wilayah setelah terpasang, admin harus delete & recreate demi konsistensi data IoT
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} ({z.kecamatan})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sensor Type */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tipe Perangkat Sensor</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <FontAwesomeIcon icon={faMicrochip} className="text-xs" />
              </span>
              <select
                value={sensorType}
                onChange={(e) => setSensorType(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white focus:border-emerald-500 cursor-pointer"
                required
                disabled={!!sensor} // Sensor type tidak boleh diubah pada edit
              >
                {SENSOR_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Value */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
              Nilai Pembacaan ({sensorType.includes('Temp') ? '°C' : sensorType.includes('Humid') ? '%' : sensorType.includes('Gas') ? 'ppm' : 'cm'})
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <FontAwesomeIcon icon={faChartSimple} className="text-xs" />
              </span>
              <input
                type="number"
                step="0.01"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="cth. 25.50"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                required
              />
            </div>
          </div>

          {/* Fill Percentage (Ultrasonic only) */}
          {isUltrasonic && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Persentase Kapasitas Tampung (0% - 100%)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                  <FontAwesomeIcon icon={faPercent} className="text-xs" />
                </span>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={fillPercentage}
                  onChange={(e) => setFillPercentage(e.target.value)}
                  placeholder="cth. 75.0"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  required
                />
              </div>
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
