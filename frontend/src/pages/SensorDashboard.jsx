import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTemperatureHigh,
  faMicrochip,
  faClock,
  faCircleInfo,
  faExclamationTriangle,
  faSpinner,
  faMapMarkerAlt,
  faWifi
} from '@fortawesome/free-solid-svg-icons';
import { api } from '../services/api';
import { useSensorWebSocket } from '../hooks/useSensorWebSocket';

function SensorDashboard() {
  const [sensorData, setSensorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [wsConnected, setWsConnected] = useState(false);

  const fetchLatestData = async () => {
    try {
      setLoading(true);
      const result = await api.getLatestSensorData({ zone_id: 1 });
      
      const zoneOneData = Array.isArray(result?.data)
        ? result.data.find((item) => item?.sensor_type === 'DHT-22-Temp') || result.data[0]
        : null;

      setSensorData(zoneOneData ?? null);
      setError('');
    } catch (err) {
      console.error('Gagal mengambil data sensor:', err);
      setError('Gagal memuat data sensor IoT.');
      setSensorData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestData();
  }, []);

  const handleWebSocketMessage = React.useCallback((payload) => {
    // Set connection status when receiving messages
    setWsConnected(true);
    if (payload.event === 'sensor_update') {
      const updatedSensor = payload.data;
      // SensorDashboard hanya menampilkan data zona 1 tipe DHT-22-Temp
      if (updatedSensor.zone_id === 1 && updatedSensor.sensor_type === 'DHT-22-Temp') {
        setSensorData(updatedSensor);
      }
    }
  }, []);

  useSensorWebSocket(handleWebSocketMessage);

  // Monitor connection states
  useEffect(() => {
    const checkInterval = setInterval(() => {
      // Basic heartbeat detection simulation
      setWsConnected((prev) => prev);
    }, 10000);
    return () => clearInterval(checkInterval);
  }, []);

  const temperature = sensorData ? parseFloat(sensorData.value) : 0;
  const isHighTemp = temperature > 40;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 relative">
      {/* Header */}
      <header className="px-4 sm:px-8 py-4 sm:py-6 bg-white border-b border-slate-200 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Monitoring Sensor TPS</h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Pantau suhu tumpukan sampah zona prioritas IoT secara real-time.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-colors ${
              wsConnected 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}>
              <FontAwesomeIcon icon={faWifi} className={wsConnected ? 'animate-pulse' : ''} />
              <span>{wsConnected ? 'Live Connection' : 'Rest API Mode'}</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6 max-w-4xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500">
            <FontAwesomeIcon icon={faSpinner} className="text-3xl animate-spin text-emerald-500 mb-3" />
            <p className="text-sm font-semibold">Menghubungkan ke sensor...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
            <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500" />
            <span>{error}</span>
          </div>
        ) : !sensorData ? (
          <div className="py-16 bg-white border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 gap-2.5">
            <FontAwesomeIcon icon={faCircleInfo} className="text-3xl text-slate-300" />
            <span className="text-sm font-medium">Data sensor zona 1 belum tersedia</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Warning Alert Banner for High Temperature */}
            {isHighTemp && (
              <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold rounded-xl flex items-center gap-2.5 animate-shake">
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-amber-500 text-sm shrink-0" />
                <span>
                  Peringatan: Suhu terdeteksi tinggi ({temperature}°C). Tumpukan sampah mungkin mengalami fermentasi berlebih atau berpotensi terbakar!
                </span>
              </div>
            )}

            {/* Main Sensor Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Temperature Display Card */}
              <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 text-slate-900 pointer-events-none">
                  <FontAwesomeIcon icon={faTemperatureHigh} className="text-8xl" />
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Suhu Saat Ini</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl sm:text-6xl font-extrabold text-slate-800 tracking-tight">
                      {temperature.toFixed(1)}
                    </span>
                    <span className="text-2xl sm:text-3xl font-bold text-slate-400">°C</span>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Kondisi Status:</span>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase border ${
                    isHighTemp 
                      ? 'bg-red-50 text-red-700 border-red-200' 
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {isHighTemp ? 'Kritis / Tinggi' : 'Normal'}
                  </span>
                </div>
              </div>

              {/* Sensor & Location Specs Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Spesifikasi Modul</span>
                  
                  {/* Location info */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="text-xs" />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lokasi TPS</h4>
                      <p className="text-xs font-bold text-slate-700 mt-0.5">
                        {sensorData.zone?.name || 'TPS Zona 1'}
                      </p>
                    </div>
                  </div>

                  {/* Device model */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                      <FontAwesomeIcon icon={faMicrochip} className="text-xs" />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jenis Sensor</h4>
                      <p className="text-xs font-bold text-slate-700 mt-0.5">
                        {sensorData.sensor_type || 'DHT-22 Temp Sensor'}
                      </p>
                    </div>
                  </div>

                  {/* Last updated */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                      <FontAwesomeIcon icon={faClock} className="text-xs" />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pembaruan Terakhir</h4>
                      <p className="text-xs font-bold text-slate-700 mt-0.5">
                        {sensorData.updated_at 
                          ? new Date(sensorData.updated_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                          : 'Baru saja'
                        } WIB
                      </p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Explanatory banner */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex gap-4 items-start">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
                <FontAwesomeIcon icon={faCircleInfo} className="text-sm" />
              </div>
              <div className="text-xs space-y-1.5 leading-relaxed text-slate-600">
                <h4 className="font-bold text-slate-800">Tentang Sistem Integrasi Sensor</h4>
                <p>
                  Sistem monitoring IoT SAMLING AI terhubung langsung dengan perangkat keras mikrokontroler (ESP32) yang dipasang di Tempat Penampungan Sementara (TPS).
                </p>
                <p>
                  Jika suhu naik melebihi batas wajar, sistem akan memicu peringatan untuk mencegah bahaya kebakaran spontan akibat gas metana yang dihasilkan sampah organik.
                </p>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

export default SensorDashboard;
