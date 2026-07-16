import { useEffect, useState, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLocationDot,
  faMicrochip,
  faClock,
  faThermometer,
  faDroplet,
  faWind,
  faSpinner,
  faTriangleExclamation,
  faCircleCheck,
  faMap
} from '@fortawesome/free-solid-svg-icons';
import { api } from '../services/api';
import Header from '../components/Header';
import CircularProgress from '../components/CircularProgress';
import { useSensorWebSocket } from '../hooks/useSensorWebSocket';

export default function Monitoring() {
  const [zones, setZones] = useState([]);
  const [selectedZoneId, setSelectedZoneId] = useState(1);
  const [loading, setLoading] = useState(true);
  const [sensorLoading, setSensorLoading] = useState(false);
  const [sensors, setSensors] = useState({
    ultrasonicOrg: null,
    ultrasonicAnorg: null,
    gas: null,
    temp: null,
    humid: null,
    hasAny: false,
    updatedAt: null
  });
  const [error, setError] = useState('');

  // Fetch all zones on mount
  useEffect(() => {
    async function fetchAllZones() {
      try {
        setLoading(true);
        const res = await api.getZones();
        if (res.success && res.data) {
          setZones(res.data || []);
          // Set default selected zone to 1 if it exists, otherwise use first zone
          const hasZoneOne = res.data.some(z => z.id === 1);
          if (hasZoneOne) {
            setSelectedZoneId(1);
          } else if (res.data.length > 0) {
            setSelectedZoneId(res.data[0].id);
          }
        } else {
          setError('Gagal memuat daftar wilayah TPS.');
        }
      } catch (err) {
        setError(err.message || 'Gagal memuat daftar wilayah TPS.');
      } finally {
        setLoading(false);
      }
    }
    fetchAllZones();
  }, []);

  const activeZone = zones.find(z => z.id === selectedZoneId);

  // Fetch sensors for the selected zone
  const fetchSensorDetail = async (zoneId) => {
    if (!zoneId) return;
    try {
      setSensorLoading(true);
      const res = await api.getLatestSensorData({ zone_id: zoneId });
      if (res.success && res.data) {
        const zoneSensors = res.data.filter(s => s.zone_id === zoneId);
        
        if (zoneSensors.length > 0) {
          const ultrasonicOrg = zoneSensors.find(s => s.sensor_type === 'Ultrasonic-Organic');
          const ultrasonicAnorg = zoneSensors.find(s => s.sensor_type === 'Ultrasonic-Anorganic');
          const gas = zoneSensors.find(s => s.sensor_type === 'MQ-135');
          const temp = zoneSensors.find(s => s.sensor_type === 'DHT-22-Temp');
          const humid = zoneSensors.find(s => s.sensor_type === 'DHT-22-Humid');

          const timestamps = zoneSensors.map(s => new Date(s.updated_at || s.created_at).getTime());
          const maxTimestamp = new Date(Math.max(...timestamps));

          setSensors({
            ultrasonicOrg,
            ultrasonicAnorg,
            gas,
            temp,
            humid,
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
            hasAny: false,
            updatedAt: null
          });
        }
      }
    } catch (err) {
      console.error('Gagal mengambil data sensor:', err);
    } finally {
      setSensorLoading(false);
    }
  };

  // Initial fetch when selected zone changes
  useEffect(() => {
    if (loading || !selectedZoneId) return;
    fetchSensorDetail(selectedZoneId);
  }, [selectedZoneId, loading]);

  // Handle real-time WebSocket sensor updates
  const handleWebSocketMessage = useCallback((payload) => {
    if (payload.event === 'sensor_update') {
      const updatedSensor = payload.data;

      // 1. Update status risiko wilayah di list zones
      setZones((prevZones) =>
        prevZones.map((z) =>
          z.id === updatedSensor.zone_id
            ? { ...z, risk_status: updatedSensor.zone_risk_status }
            : z
        )
      );

      // 2. Jika sensor data ini milik wilayah yang sedang terpilih, update state detailnya
      if (updatedSensor.zone_id === selectedZoneId) {
        setSensors((prevSensors) => {
          const nextSensors = { ...prevSensors };
          let matched = false;

          if (updatedSensor.sensor_type === 'Ultrasonic-Organic') {
            nextSensors.ultrasonicOrg = updatedSensor;
            matched = true;
          } else if (updatedSensor.sensor_type === 'Ultrasonic-Anorganic') {
            nextSensors.ultrasonicAnorg = updatedSensor;
            matched = true;
          } else if (updatedSensor.sensor_type === 'MQ-135') {
            nextSensors.gas = updatedSensor;
            matched = true;
          } else if (updatedSensor.sensor_type === 'DHT-22-Temp') {
            nextSensors.temp = updatedSensor;
            matched = true;
          } else if (updatedSensor.sensor_type === 'DHT-22-Humid') {
            nextSensors.humid = updatedSensor;
            matched = true;
          }

          if (matched) {
            nextSensors.hasAny = true;
            nextSensors.updatedAt = new Date(updatedSensor.updated_at || updatedSensor.created_at);
          }

          return nextSensors;
        });
      }
    }
  }, [selectedZoneId]);

  useSensorWebSocket(handleWebSocketMessage);

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
      case 'Warning':
        return faTriangleExclamation;
      default:
        return faCircleCheck;
    }
  };

  const getGasStatus = (ppm) => {
    if (ppm < 150) return { text: 'Aman', color: 'text-emerald-600 bg-emerald-50' };
    if (ppm <= 300) return { text: 'Waspada', color: 'text-amber-600 bg-amber-50' };
    return { text: 'Bahaya', color: 'text-red-600 bg-red-50 font-bold' };
  };

  const timeSinceUpdate = sensors.updatedAt
    ? Math.round((Date.now() - sensors.updatedAt.getTime()) / 60000)
    : null;

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden h-full">
        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-3xl text-emerald-500 mb-3" />
        <span className="text-xs font-semibold text-slate-500">Menghubungkan jaringan sensor...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden h-full p-8">
        <FontAwesomeIcon icon={faTriangleExclamation} className="text-3xl text-red-500 mb-3" />
        <span className="text-sm font-semibold text-red-500 mb-2">Terjadi Kesalahan</span>
        <span className="text-xs text-slate-500 text-center max-w-md">{error}</span>
      </div>
    );
  }

  const headerRightContent = (
    <div className="flex items-center gap-3 shrink-0">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider select-none">Pilih TPS:</label>
      <select
        value={selectedZoneId}
        onChange={(e) => setSelectedZoneId(Number(e.target.value))}
        className="px-3.5 py-2 bg-slate-50 border border-slate-200 hover:border-slate-350 hover:bg-white rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 cursor-pointer min-w-56 shadow-2xs transition-all duration-200"
      >
        {zones.map((z) => (
          <option key={z.id} value={z.id}>
            {z.name} ({z.kecamatan})
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col bg-slate-50 relative">
      {/* Header */}
      <Header
        title="Monitoring Sensor Real-Time"
        subtitle="Pantau telemetri sensor IoT pada Tempat Pembuangan Sampah (TPS) secara langsung."
        icon={faMicrochip}
        iconColor="text-emerald-600"
        rightContent={headerRightContent}
      />

      {/* Main Content */}
      <div className="p-8 space-y-6">
        {activeZone ? (
          <>
            {/* Informasi TPS Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs">
              <h4 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider select-none flex items-center gap-1.5">
                <FontAwesomeIcon icon={faLocationDot} className="text-slate-400" />
                <span>Informasi TPS & Lokasi</span>
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Wilayah Administrasi</p>
                  <p className="text-xs font-bold text-slate-700 mt-1">{activeZone.wilayah || '-'}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Kecamatan</p>
                  <p className="text-xs font-bold text-slate-700 mt-1">{activeZone.kecamatan || '-'}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Kelurahan</p>
                  <p className="text-xs font-bold text-slate-700 mt-1">{activeZone.kelurahan || '-'}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Jenis TPS</p>
                  <p className="text-xs font-bold text-slate-700 mt-1">{activeZone.jenis_tps || '-'}</p>
                </div>
              </div>
              
              <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Status Urgensi AI & Rute</p>
                  <div className="flex flex-wrap gap-2.5 items-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold border inline-flex items-center gap-1.5 ${getRiskBadgeClasses(activeZone.risk_status)}`}>
                      <FontAwesomeIcon icon={getRiskIcon(activeZone.risk_status)} />
                      {activeZone.risk_status}
                    </span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${activeZone.latitude},${activeZone.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded-full text-[10px] font-bold border border-slate-200 hover:border-slate-350 flex items-center gap-1.5 cursor-pointer transition-all duration-200 shadow-2xs select-none"
                      title="Buka lokasi TPS di Google Maps"
                    >
                      <FontAwesomeIcon icon={faMap} className="text-slate-400 text-[10px]" />
                      <span>Google Maps</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Monitoring Sensor Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider select-none">
                  Urgensi Telemetri Sensor
                </h4>
                {sensorLoading && (
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                    Memperbarui data...
                  </span>
                )}
              </div>
              
              {!sensors.hasAny ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400 bg-white border border-slate-200 rounded-xl shadow-2xs">
                  <FontAwesomeIcon icon={faMicrochip} className="text-4xl text-slate-300 mb-3 animate-pulse" />
                  <span className="text-sm font-bold">TPS ini belum memiliki sensor IoT aktif</span>
                  <p className="text-xs text-slate-400 mt-1 text-center max-w-sm">
                    Gunakan simulator hardware ESP32 atau jalankan telemetri untuk mengirim data sensor ke ID TPS #{selectedZoneId}.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  
                  {/* Grid Layout: Circular capacity & Sensor Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    
                    {/* Left Column (6 Cols): Two Ultrasonic Capacities (Organik vs Anorganik) */}
                    <div className="md:col-span-6 bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-5 select-none text-center">
                        Kapasitas Tampung (Ultrasonik)
                      </span>
                      <div className="grid grid-cols-2 gap-6 w-full justify-items-center">
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full mb-3">Organik</span>
                          {sensors.ultrasonicOrg ? (
                            <CircularProgress
                              percent={Math.round(sensors.ultrasonicOrg.fill_percentage)}
                              size={120}
                              label="Penuh"
                            />
                          ) : (
                            <div className="py-10 text-center text-xs text-slate-400 italic">Offline</div>
                          )}
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full mb-3">Anorganik</span>
                          {sensors.ultrasonicAnorg ? (
                            <CircularProgress
                              percent={Math.round(sensors.ultrasonicAnorg.fill_percentage)}
                              size={120}
                              label="Penuh"
                            />
                          ) : (
                            <div className="py-10 text-center text-xs text-slate-400 italic">Offline</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Column (6 Cols): Grid of Cards for Gas & DHT */}
                    <div className="md:col-span-6 grid grid-cols-1 gap-4">
                      
                      {/* Card 1: MQ-135 Gas */}
                      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between shadow-2xs">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gas (MQ-135)</span>
                          <FontAwesomeIcon icon={faWind} className="text-sky-500 text-base" />
                        </div>
                        <div className="mt-4">
                          <p className="text-2xl font-extrabold text-slate-800">
                            {sensors.gas ? `${Math.round(sensors.gas.value)} ppm` : '-'}
                          </p>
                          {sensors.gas && (
                            <span className={`inline-block text-[10px] px-2 py-0.5 rounded-md mt-2 font-bold ${getGasStatus(sensors.gas.value).color}`}>
                              {getGasStatus(sensors.gas.value).text}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card 2: DHT-22 Temp & Humidity */}
                      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between shadow-2xs">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DHT-22 Lingkungan</span>
                          <FontAwesomeIcon icon={faThermometer} className="text-orange-500 text-base animate-pulse" />
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-4">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wide">Suhu</span>
                            <span className="text-xl font-bold text-slate-700 mt-0.5">
                              {sensors.temp ? `${sensors.temp.value.toFixed(1)}°C` : '-'}
                            </span>
                          </div>
                          <div className="flex flex-col border-l border-slate-100 pl-4">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wide flex items-center gap-1">
                              <FontAwesomeIcon icon={faDroplet} className="text-sky-400" />
                              Kelembapan
                            </span>
                            <span className="text-xl font-bold text-slate-700 mt-0.5">
                              {sensors.humid ? `${Math.round(sensors.humid.value)}%` : '-'}
                            </span>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Telemetry Status Footer */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs select-none">
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <FontAwesomeIcon icon={faMicrochip} className="text-emerald-500 shrink-0" />
                      <span className="font-semibold">Integrated IoT Network (MQ-135, DHT-22, HCSR-Organic, HCSR-Anorganic)</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <FontAwesomeIcon icon={faClock} className="text-slate-400 shrink-0" />
                      <span className="font-semibold">Sinkronisasi:</span>
                      <span className="text-slate-700">
                        {timeSinceUpdate != null
                          ? timeSinceUpdate < 1
                            ? 'Baru saja'
                            : `${timeSinceUpdate} menit lalu`
                          : '-'}
                      </span>
                    </div>
                  </div>

                </div>
              )}
            </div>
          </>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 bg-white border border-slate-200 rounded-xl shadow-2xs">
            <FontAwesomeIcon icon={faLocationDot} className="text-4xl text-slate-350 mb-3 animate-bounce" />
            <span className="text-sm font-bold">Wilayah TPS tidak ditemukan</span>
          </div>
        )}
      </div>
    </div>
  );
}
