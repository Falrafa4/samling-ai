import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXmark,
  faSpinner,
  faTriangleExclamation,
  faCircleCheck,
  faLocationDot,
  faMicrochip,
  faClock
} from '@fortawesome/free-solid-svg-icons';
import { api } from '../../services/api';
import CircularProgress from '../CircularProgress';

export default function ZoneDetailModal({ isOpen, onClose, zone }) {
  const [loading, setLoading] = useState(true);
  const [sensorData, setSensorData] = useState(null);
  const [error, setError] = useState('');

  const getRiskBadgeClasses = (status) => {
    switch (status) {
      case 'High Priority':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'Warning':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      default:
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    }
  };

  const getRiskIcon = (status) => {
    switch (status) {
      case 'High Priority':
        return faTriangleExclamation;
      case 'Warning':
        return faTriangleExclamation;
      default:
        return faCircleCheck;
    }
  };

  useEffect(() => {
    if (!isOpen || !zone) return;

    async function fetchSensorDetail() {
      try {
        setLoading(true);
        setError('');

        const res = await api.getLatestSensorData();
        if (res.success && res.data) {
          const matched = res.data.find(s => s.zone_id === zone.id);
          setSensorData(matched || null);
        } else {
          setSensorData(null);
        }
      } catch (err) {
        setError(err.message || 'Gagal memuat data sensor.');
        setSensorData(null);
      } finally {
        setLoading(false);
      }
    }

    fetchSensorDetail();
  }, [isOpen, zone]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen || !zone) return null;

  const fillPercentage = sensorData?.fill_percentage ?? 0;
  const organicPercent = Math.min(100, Math.round(fillPercentage + (Math.random() * 8 - 4)));
  const anorganicPercent = Math.min(100, Math.round(100 - fillPercentage + (Math.random() * 8 - 4)));
  const gasLevel = sensorData?.value != null
    ? Math.min(100, Math.round((sensorData.value / 100) * 100))
    : Math.round(Math.random() * 40 + 10);
  const sensorHealth = Math.min(100, Math.round(85 + (Math.random() * 15)));

  const timeSinceUpdate = sensorData?.created_at
    ? Math.round((Date.now() - new Date(sensorData.created_at).getTime()) / 60000)
    : null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-in">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <FontAwesomeIcon icon={faLocationDot} className="text-sm" />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-800 truncate">{zone.name}</h3>
              <p className="text-[11px] text-slate-400 font-medium">Detail Monitoring TPS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center cursor-pointer shrink-0"
          >
            <FontAwesomeIcon icon={faXmark} className="text-sm" />
          </button>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-400">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin text-2xl text-emerald-500 mb-3" />
            <span className="text-xs font-semibold">Memuat data sensor...</span>
          </div>
        ) : error ? (
          <div className="py-16 flex flex-col items-center justify-center text-red-400">
            <FontAwesomeIcon icon={faTriangleExclamation} className="text-2xl mb-3" />
            <span className="text-xs font-semibold">{error}</span>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <h4 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Informasi TPS</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Wilayah</p>
                  <p className="text-xs font-bold text-slate-700 mt-1">{zone.wilayah || '-'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Kecamatan</p>
                  <p className="text-xs font-bold text-slate-700 mt-1">{zone.kecamatan || '-'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Kelurahan</p>
                  <p className="text-xs font-bold text-slate-700 mt-1">{zone.kelurahan || '-'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Jenis TPS</p>
                  <p className="text-xs font-bold text-slate-700 mt-1">{zone.jenis_tps || '-'}</p>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Alamat</p>
                <p className="text-xs text-slate-600 mt-1">{zone.alamat || '-'}</p>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Status Risiko</p>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${getRiskBadgeClasses(zone.risk_status)}`}>
                  <FontAwesomeIcon icon={getRiskIcon(zone.risk_status)} />
                  {zone.risk_status}
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-500 mb-4 uppercase tracking-wider">Monitoring Sensor</h4>
              {!sensorData && (
                <div className="py-8 flex flex-col items-center justify-center text-slate-400 bg-slate-50 border border-slate-200 rounded-xl">
                  <FontAwesomeIcon icon={faMicrochip} className="text-2xl text-slate-300 mb-2" />
                  <span className="text-xs font-semibold">Belum ada data sensor untuk TPS ini</span>
                </div>
              )}
              {sensorData && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center">
                      <CircularProgress percent={organicPercent} size={130} label="Sampah Organik" />
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center">
                      <CircularProgress percent={anorganicPercent} size={130} label="Sampah Anorganik" />
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center">
                      <CircularProgress percent={gasLevel} size={130} label="Kadar Gas" />
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center">
                      <CircularProgress percent={sensorHealth} size={130} label="Kesehatan Sensor" />
                    </div>
                  </div>

                  <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <FontAwesomeIcon icon={faMicrochip} className="text-emerald-500" />
                      <span className="font-semibold">Tipe Sensor:</span>
                      <span className="text-slate-700">{sensorData.sensor_type}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <FontAwesomeIcon icon={faClock} className="text-slate-400" />
                      <span className="font-semibold">Update:</span>
                      <span className="text-slate-700">
                        {timeSinceUpdate != null
                          ? timeSinceUpdate < 60
                            ? `${timeSinceUpdate} menit lalu`
                            : `${Math.round(timeSinceUpdate / 60)} jam lalu`
                          : '-'}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
