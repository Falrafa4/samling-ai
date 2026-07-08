import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXmark,
  faSpinner,
  faTriangleExclamation,
  faCircleCheck,
  faLocationDot,
  faMicrochip,
  faClock,
  faThermometer,
  faDroplet,
  faWeightHanging,
  faWind
} from '@fortawesome/free-solid-svg-icons';
import { api } from '../../services/api';
import CircularProgress from '../CircularProgress';

export default function ZoneDetailModal({ isOpen, onClose, zone }) {
  const [loading, setLoading] = useState(true);
  const [sensors, setSensors] = useState({
    ultrasonicOrg: null,
    ultrasonicAnorg: null,
    gas: null,
    temp: null,
    humid: null,
    organic: null, // loadcell organik (commented)
    inorganic: null, // loadcell anorganik (commented)
    hasAny: false,
    updatedAt: null
  });
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
          const zoneSensors = res.data.filter(s => s.zone_id === zone.id);
          
          if (zoneSensors.length > 0) {
            const ultrasonicOrg = zoneSensors.find(s => s.sensor_type === 'Ultrasonic-Organic');
            const ultrasonicAnorg = zoneSensors.find(s => s.sensor_type === 'Ultrasonic-Anorganic');
            const gas = zoneSensors.find(s => s.sensor_type === 'MQ-135');
            const temp = zoneSensors.find(s => s.sensor_type === 'DHT-22-Temp');
            const humid = zoneSensors.find(s => s.sensor_type === 'DHT-22-Humid');
            const organic = zoneSensors.find(s => s.sensor_type === 'Loadcell-Organic');
            const inorganic = zoneSensors.find(s => s.sensor_type === 'Loadcell-Inorganic');

            const timestamps = zoneSensors.map(s => new Date(s.updated_at || s.created_at).getTime());
            const maxTimestamp = new Date(Math.max(...timestamps));

            setSensors({
              ultrasonicOrg,
              ultrasonicAnorg,
              gas,
              temp,
              humid,
              organic,
              inorganic,
              hasAny: true,
              updatedAt: maxTimestamp
            });
          } else {
            setSensors({
              ultrasonicOrg: null,
              ultrasonicAnorg: null,
              gas: null,
              temp: null,
              humid: null,
              organic: null,
              inorganic: null,
              hasAny: false,
              updatedAt: null
            });
          }
        } else {
          setError('Gagal membaca data dari server.');
        }
      } catch (err) {
        setError(err.message || 'Gagal memuat data sensor.');
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

  const timeSinceUpdate = sensors.updatedAt
    ? Math.round((Date.now() - sensors.updatedAt.getTime()) / 60000)
    : null;

  // Gas status evaluation
  const getGasStatus = (ppm) => {
    if (ppm < 150) return { text: 'Aman', color: 'text-emerald-600 bg-emerald-50' };
    if (ppm <= 300) return { text: 'Waspada', color: 'text-amber-600 bg-amber-50' };
    return { text: 'Bahaya', color: 'text-red-600 bg-red-50 font-bold' };
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-in">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 sticky top-0 bg-white z-10 select-none">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <FontAwesomeIcon icon={faLocationDot} className="text-sm animate-bounce" />
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
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin text-2xl text-emerald-500 mb-3" />
            <span className="text-xs font-semibold">Memuat data sensor...</span>
          </div>
        ) : error ? (
          <div className="py-20 flex flex-col items-center justify-center text-red-400">
            <FontAwesomeIcon icon={faTriangleExclamation} className="text-2xl mb-3" />
            <span className="text-xs font-semibold">{error}</span>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            
            {/* Informasi TPS Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider select-none">Informasi Lokasi</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Wilayah</p>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">{zone.wilayah || '-'}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Kecamatan</p>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">{zone.kecamatan || '-'}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Kelurahan</p>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">{zone.kelurahan || '-'}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Jenis TPS</p>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">{zone.jenis_tps || '-'}</p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Alamat Lengkap</p>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{zone.alamat || '-'}</p>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Status Risiko AI</p>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${getRiskBadgeClasses(zone.risk_status)}`}>
                  <FontAwesomeIcon icon={getRiskIcon(zone.risk_status)} />
                  {zone.risk_status}
                </span>
              </div>
            </div>

            {/* Monitoring Sensor Section */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider select-none">Urgensi Telemetri Sensor</h4>
              
              {!sensors.hasAny ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 bg-slate-50 border border-slate-200 rounded-xl">
                  <FontAwesomeIcon icon={faMicrochip} className="text-3xl text-slate-350 mb-2 animate-pulse" />
                  <span className="text-xs font-bold">TPS ini belum memiliki sensor IoT di lokasi</span>
                </div>
              ) : (
                <div className="space-y-4">
                  
                  {/* Grid Layout: Circular capacity & Sensor Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                    
                    {/* Left Column (6 Cols): Two Ultrasonic Capacities (Organik vs Anorganik) */}
                    <div className="md:col-span-6 bg-white border border-slate-200 rounded-xl p-5 flex flex-col items-center justify-center shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4 select-none text-center">
                        Kapasitas Tampung (Ultrasonik)
                      </span>
                      <div className="grid grid-cols-2 gap-4 w-full justify-items-center">
                        <div className="flex flex-col items-center">
                          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mb-2">Organik</span>
                          {sensors.ultrasonicOrg ? (
                            <CircularProgress
                              percent={Math.round(sensors.ultrasonicOrg.fill_percentage)}
                              size={110}
                              label="Penuh"
                            />
                          ) : (
                            <div className="py-6 text-center text-[10px] text-slate-400 italic">Offline</div>
                          )}
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mb-2">Anorganik</span>
                          {sensors.ultrasonicAnorg ? (
                            <CircularProgress
                              percent={Math.round(sensors.ultrasonicAnorg.fill_percentage)}
                              size={110}
                              label="Penuh"
                            />
                          ) : (
                            <div className="py-6 text-center text-[10px] text-slate-400 italic">Offline</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Column (6 Cols): Grid of Cards for Gas & DHT (Loadcell commented out) */}
                    <div className="md:col-span-6 grid grid-cols-1 gap-4">
                      
                      {/* Card 1: MQ-135 Gas */}
                      <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gas (MQ-135)</span>
                          <FontAwesomeIcon icon={faWind} className="text-sky-500 text-sm" />
                        </div>
                        <div className="mt-2">
                          <p className="text-lg font-extrabold text-slate-850">
                            {sensors.gas ? `${Math.round(sensors.gas.value)} ppm` : '-'}
                          </p>
                          {sensors.gas && (
                            <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded-md mt-1 font-bold ${getGasStatus(sensors.gas.value).color}`}>
                              {getGasStatus(sensors.gas.value).text}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card 2: DHT-22 Temp & Humidity */}
                      <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DHT-22 Lingkungan</span>
                          <FontAwesomeIcon icon={faThermometer} className="text-orange-500 text-sm animate-pulse" />
                        </div>
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-400">Suhu:</span>
                            <span className="text-xs font-bold text-slate-700">
                              {sensors.temp ? `${sensors.temp.value.toFixed(1)}°C` : '-'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <FontAwesomeIcon icon={faDroplet} className="text-sky-400 text-[10px]" />
                            <span className="text-[10px] text-slate-400">Lembap:</span>
                            <span className="text-xs font-bold text-slate-700">
                              {sensors.humid ? `${Math.round(sensors.humid.value)}%` : '-'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 
                      LOADCELL WEIGHT SENSOR (JAGA-JAGA DINONAKTIFKAN SEMENTARA KARENA REVISI HARDWARE IOT)
                      Card 3: Organic Loadcell
                      <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Berat Organik</span>
                          <FontAwesomeIcon icon={faWeightHanging} className="text-emerald-500 text-xs" />
                        </div>
                        <div className="mt-3">
                          <p className="text-base font-extrabold text-slate-800">
                            {sensors.organic ? `${sensors.organic.value.toFixed(1)} kg` : '-'}
                          </p>
                          <span className="text-[9px] text-slate-400 font-medium mt-0.5 block">
                            Loadcell Sensor
                          </span>
                        </div>
                      </div>

                      Card 4: Inorganic Loadcell
                      <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Berat Anorganik</span>
                          <FontAwesomeIcon icon={faWeightHanging} className="text-blue-500 text-xs" />
                        </div>
                        <div className="mt-3">
                          <p className="text-base font-extrabold text-slate-800">
                            {sensors.inorganic ? `${sensors.inorganic.value.toFixed(1)} kg` : '-'}
                          </p>
                          <span className="text-[9px] text-slate-400 font-medium mt-0.5 block">
                            Loadcell Sensor
                          </span>
                        </div>
                      </div>
                      */}

                    </div>
                  </div>

                  {/* Telemetry Status Footer */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 select-none">
                      <FontAwesomeIcon icon={faMicrochip} className="text-emerald-500" />
                      <span className="font-semibold">Integrated IoT Network (MQ-135, DHT-22, HCSR-Organic, HCSR-Anorganic)</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 select-none">
                      <FontAwesomeIcon icon={faClock} className="text-slate-400" />
                      <span className="font-semibold">Sinkronisasi:</span>
                      <span className="text-slate-700">
                        {timeSinceUpdate != null
                          ? timeSinceUpdate < 1
                            ? 'Baru saja'
                            : timeSinceUpdate < 60
                            ? `${timeSinceUpdate} menit lalu`
                            : `${Math.round(timeSinceUpdate / 60)} jam lalu`
                          : '-'}
                      </span>
                    </div>
                  </div>

                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
