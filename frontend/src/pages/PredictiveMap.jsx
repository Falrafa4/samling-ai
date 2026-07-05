import { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMapPin,
  faCircleCheck,
  faSliders,
  faLocationCrosshairs,
  faTriangleExclamation,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../services/api';

export default function PredictiveMap() {
  const [showNormalZones, setShowNormalZones] = useState(true);

  // API States
  const [zones, setZones] = useState([]);
  const [sensorData, setSensorData] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Selected Node Details
  const [selectedZone, setSelectedZone] = useState(null);
  const [selectedSensor, setSelectedSensor] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);

  // Leaflet Map Refs
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  // Fetch initial zones, sensors, and drivers
  useEffect(() => {
    async function initMapData() {
      try {
        setLoading(true);
        const [zonesRes, sensorRes, driversRes] = await Promise.all([
          api.getZones(),
          api.getLatestSensorData(),
          api.getDrivers()
        ]);

        if (zonesRes.success) setZones(zonesRes.data || []);
        if (sensorRes.success) setSensorData(sensorRes.data || []);
        if (driversRes.success) setDrivers(driversRes.data || []);
      } catch (err) {
        setErrorMessage(err.message || 'Gagal memuat data koordinat peta.');
      } finally {
        setLoading(false);
      }
    }

    initMapData();
  }, []);

  // Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      // Pusat koordinat di Kebon Jeruk (default)
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        scrollWheelZoom: true
      }).setView([-6.1944, 106.7672], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapRef.current);

      // Pindahkan zoom control ke pojok kanan bawah agar rapi
      L.control.zoom({
        position: 'bottomright'
      }).addTo(mapRef.current);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Render & Sync Markers on Map
  useEffect(() => {
    if (!mapRef.current || zones.length === 0) return;

    // Bersihkan marker sebelumnya
    markersRef.current.forEach((marker) => mapRef.current.removeLayer(marker));
    markersRef.current = [];

    // Filter berdasarkan Tampilan Area Normal
    const filteredZones = zones.filter((z) => {
      if (z.risk_status === 'Normal' && !showNormalZones) {
        return false;
      }
      return true;
    });

    // Buat ikon kustom Leaflet menggunakan Tailwind CSS
    const createMarkerIcon = (status) => {
      let bgColorClass = 'bg-emerald-500';
      let pingClass = 'bg-emerald-400';
      let borderClass = 'border-white';

      if (status === 'High Priority') {
        bgColorClass = 'bg-red-500';
        pingClass = 'bg-red-400';
      } else if (status === 'Warning') {
        bgColorClass = 'bg-amber-500';
        pingClass = 'bg-amber-400';
      } else if (status === 'Offline') {
        bgColorClass = 'bg-slate-400';
        pingClass = 'bg-slate-300';
        borderClass = 'border-slate-200 border-dashed';
      }

      return L.divIcon({
        className: 'custom-map-marker',
        html: `
          <div class="relative w-8 h-8 flex items-center justify-center">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full ${pingClass} opacity-60"></span>
            <span class="relative inline-flex rounded-full h-4.5 w-4.5 ${bgColorClass} border-2 ${borderClass} shadow-md"></span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
    };

    // Tambahkan marker untuk setiap zone
    filteredZones.forEach((zone) => {
      const sensor = sensorData.find((s) => s.zone_id === zone.id);
      const capacity = sensor ? `${Math.round(sensor.fill_percentage)}%` : 'Offline';
      const status = sensor ? zone.risk_status : 'Offline';

      const marker = L.marker([zone.latitude, zone.longitude], {
        icon: createMarkerIcon(status)
      }).addTo(mapRef.current);

      // Custom popup HTML
      const popupContent = `
        <div class="font-sans p-2 min-w-44 text-slate-800">
          <h4 class="font-bold text-xs border-b border-slate-100 pb-1 mb-1.5">${zone.name}</h4>
          <div class="space-y-1 text-[11px]">
            <div class="flex justify-between">
              <span class="text-slate-400">Kapasitas IoT:</span>
              <span class="font-semibold">${capacity}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Status Risiko:</span>
              <span class="font-bold ${
                status === 'High Priority' ? 'text-red-500' : status === 'Warning' ? 'text-amber-500' : 'text-emerald-500'
              }">${status}</span>
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        closeButton: false,
        offset: [0, -8]
      });

      // Event click untuk memuat data detail ke overlay bawah
      marker.on('click', () => {
        const assignedDriver = drivers.find((d) => d.zone_id === zone.id);
        setSelectedZone(zone);
        setSelectedSensor(sensor);
        setSelectedDriver(assignedDriver);
      });

      markersRef.current.push(marker);
    });

    // Auto-fit bounds if we have markers
    if (markersRef.current.length > 0) {
      const group = L.featureGroup(markersRef.current);
      mapRef.current.fitBounds(group.getBounds().pad(0.15));
    }
  }, [zones, sensorData, drivers, showNormalZones]);

  // Recenter map focus to primary bounds
  const handleRecenter = () => {
    if (mapRef.current && markersRef.current.length > 0) {
      const group = L.featureGroup(markersRef.current);
      mapRef.current.flyToBounds(group.getBounds().pad(0.15), {
        duration: 1.2
      });
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 text-slate-500">
        <FontAwesomeIcon icon={faSpinner} className="text-3xl animate-spin text-emerald-500 mb-3" />
        <p className="text-sm font-semibold">Memuat peta pemantauan...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex h-full relative overflow-hidden bg-slate-100">
      {/* Sidebar Control Panel (Fixed 280px) */}
      <div className="w-[280px] h-full bg-white border-r border-slate-200 z-10 p-6 flex flex-col justify-between shrink-0 shadow-sm">
        <div className="space-y-6">
          <div>
            <h3 className="text-md font-bold text-slate-800">Filter Peta Pemantauan</h3>
            <p className="text-xs text-slate-500 mt-1">Saring lokasi TPS berdasarkan tingkat risiko.</p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-[11px] font-semibold rounded-lg">
              ⚠️ {errorMessage}
            </div>
          )}

          {/* Toggle Map Layers */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lapisan Peta</h4>
            <div className="space-y-2">
              <label className="flex items-center gap-3 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showNormalZones}
                  onChange={(e) => setShowNormalZones(e.target.checked)}
                  className="rounded border-slate-350 text-emerald-500 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span>Tampilkan Area Normal</span>
              </label>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Legenda Status</h4>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 text-xs font-medium text-slate-600">
                <span className="relative flex h-3.5 w-3.5 items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span>High Priority (&gt;80% Penuh)</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-medium text-slate-600">
                <span className="relative flex h-3.5 w-3.5 items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span>Warning (50% - 80% Penuh)</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-medium text-slate-600">
                <span className="relative flex h-3.5 w-3.5 items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Normal (&lt;50% Penuh)</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-medium text-slate-600">
                <span className="relative flex h-3.5 w-3.5 items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-300 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-400 border border-slate-200 border-dashed"></span>
                </span>
                <span>Sensor IoT Offline</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <span className="text-[10px] text-slate-400 block text-center">
            Peta menggunakan OpenStreetMap &amp; Leaflet
          </span>
        </div>
      </div>

      {/* Main Map Viewport */}
      <div className="flex-1 h-full relative z-0">
        {/* Container Peta Leaflet */}
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Floating Controls Overlay */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          {/* Recenter Button */}
          <button
            onClick={handleRecenter}
            className="w-10 h-10 rounded-lg bg-white shadow-md border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <FontAwesomeIcon icon={faLocationCrosshairs} />
          </button>
        </div>

        {/* Floating Summary Overlay */}
        <div className="absolute bottom-4 left-4 right-4 md:right-auto md:w-96 z-10 bg-white/95 backdrop-blur border border-slate-200/80 rounded-xl p-5 shadow-lg">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="text-sm font-bold text-slate-800">Detail TPS Terpilih</h4>
              <p className="text-[10px] text-slate-500">Klik pin lokasi TPS di peta untuk memuat detail</p>
            </div>
            {selectedZone ? (
              <span
                className={`text-[10px] font-bold border px-2.5 py-0.5 rounded-full capitalize ${
                  !selectedSensor
                    ? 'text-slate-600 bg-slate-50 border-slate-200'
                    : selectedZone.risk_status === 'High Priority'
                    ? 'text-red-600 bg-red-50 border-red-200'
                    : selectedZone.risk_status === 'Warning'
                    ? 'text-amber-600 bg-amber-50 border-amber-200'
                    : 'text-emerald-600 bg-emerald-50 border-emerald-200'
                }`}
              >
                {!selectedSensor ? 'Offline' : selectedZone.risk_status}
              </span>
            ) : null}
          </div>
          
          {selectedZone ? (
            <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Nama TPS:</span>
                <span className="font-semibold text-slate-700">{selectedZone.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Kapasitas Aktual:</span>
                <span className="font-semibold text-slate-700">
                  {selectedSensor ? `${Math.round(selectedSensor.fill_percentage)}%` : 'Koneksi Terputus (Sensor Offline)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Driver Ditugaskan:</span>
                <span className="font-semibold text-slate-700">
                  {selectedDriver ? selectedDriver.name : 'Belum Ditugaskan'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status Driver WA:</span>
                <span
                  className={`font-semibold ${
                    selectedDriver?.status === 'Available'
                      ? 'text-emerald-600'
                      : selectedDriver?.status === 'On Duty'
                      ? 'text-amber-600'
                      : 'text-red-500'
                  }`}
                >
                  {selectedDriver ? selectedDriver.status : '-'}
                </span>
              </div>
            </div>
          ) : (
            <div className="py-6 border-t border-slate-100 flex items-center justify-center text-xs text-slate-400">
              Belum ada TPS terpilih. Silakan klik penanda di peta.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
