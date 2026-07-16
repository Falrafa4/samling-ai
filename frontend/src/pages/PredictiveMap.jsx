import { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSliders,
  faLocationCrosshairs,
  faSpinner,
  faXmark,
  faTriangleExclamation
} from '@fortawesome/free-solid-svg-icons';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import { api } from '../services/api';
import ZoneDetailModal from '../components/fragments/ZoneDetailModal';

// Fix Leaflet's default icon assets issue in bundlers (Vite)
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export default function PredictiveMap() {
  const [selectedStatuses, setSelectedStatuses] = useState({
    Normal: true,
    Warning: true,
    'High Priority': true,
    Offline: true
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedBasemap, setSelectedBasemap] = useState('Carto');
  const [selectedRegions, setSelectedRegions] = useState({
    'KAB. KEPULAUAN SERIBU': true,
    'KOTA ADM. JAKARTA PUSAT': true,
    'KOTA ADM. JAKARTA UTARA': true,
    'KOTA ADM. JAKARTA BARAT': true,
    'KOTA ADM. JAKARTA SELATAN': true,
    'KOTA ADM. JAKARTA TIMUR': true
  });

  // Tile layer management
  const tileLayerRef = useRef(null);

  // API States
  const [zones, setZones] = useState([]);
  const [sensorData, setSensorData] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Detail Modal States (Tahap 1)
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailZone, setDetailZone] = useState(null);

  const handleOpenDetail = (zone) => {
    setDetailZone(zone);
    setDetailModalOpen(true);
  };

  // Selected Node Details
  const [selectedZone, setSelectedZone] = useState(null);
  const [selectedSensor, setSelectedSensor] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);

  // Leaflet Map Refs
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const clusterGroupRef = useRef(null);

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

  // Sync Base Tile Layer based on selected basemap radio button
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove old layer
    if (tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }

    let url = "";
    let attribution = "";

    if (selectedBasemap === 'Carto') {
      url =
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
      attribution = "© OpenStreetMap contributors";
    } else {
      // JakartaSatu light gray canvas layer
      url = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}";
      attribution = "© Esri | Jakarta Satu";
    }

    tileLayerRef.current = L.tileLayer(url, { attribution }).addTo(mapRef.current);
  }, [selectedBasemap]);

  // Force map to invalidate size when loading is finished
  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 200);
    }
  }, [loading]);

  // Render & Sync Markers on Map
  useEffect(() => {
    if (!mapRef.current || zones.length === 0) return;

    // Bind popupopen listener on map (Tahap 1)
    const handlePopupOpen = (e) => {
      const popup = e.popup;
      const btn = popup.getElement()?.querySelector('[id^="btn-detail-"]');
      if (btn) {
        const zoneId = parseInt(btn.id.replace('btn-detail-', ''), 10);
        const zone = zones.find(z => z.id === zoneId);
        if (zone) {
          btn.addEventListener('click', (event) => {
            event.preventDefault();
            handleOpenDetail(zone);
            mapRef.current.closePopup();
          });
        }
      }
    };

    mapRef.current.on('popupopen', handlePopupOpen);

    // Bersihkan cluster group sebelumnya
    if (clusterGroupRef.current) {
      mapRef.current.removeLayer(clusterGroupRef.current);
      clusterGroupRef.current = null;
    }
    markersRef.current = [];

    // Filter berdasarkan Tampilan Area Normal, Status Lainnya, dan Kabupaten/Kota
    const filteredZones = zones.filter((z) => {
      // 1. Filter status
      const sensor = sensorData.find((s) => s.zone_id === z.id && s.sensor_type?.startsWith('Ultrasonic'));
      const status = sensor ? z.risk_status : 'Offline';
      if (selectedStatuses[status] !== true) {
        return false;
      }

      // 2. Filter wilayah/kabupaten/kota
      const normZone = z.wilayah.toLowerCase().replace("kota adm. ", "").replace("kab. adm. ", "").trim();
      
      if (selectedRegions['KAB. KEPULAUAN SERIBU'] && (normZone.includes('kepulauan seribu') || normZone.includes('pulau seribu'))) {
        return true;
      }
      if (selectedRegions['KOTA ADM. JAKARTA PUSAT'] && normZone.includes('jakarta pusat')) {
        return true;
      }
      if (selectedRegions['KOTA ADM. JAKARTA UTARA'] && normZone.includes('jakarta utara')) {
        return true;
      }
      if (selectedRegions['KOTA ADM. JAKARTA BARAT'] && normZone.includes('jakarta barat')) {
        return true;
      }
      if (selectedRegions['KOTA ADM. JAKARTA SELATAN'] && normZone.includes('jakarta selatan')) {
        return true;
      }
      if (selectedRegions['KOTA ADM. JAKARTA TIMUR'] && normZone.includes('jakarta timur')) {
        return true;
      }
      
      return false;
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
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full ${pingClass} opacity-70"></span>
            <span class="relative inline-flex rounded-full h-4.5 w-4.5 ${bgColorClass} border-2 ${borderClass} shadow-soft ring-1 ring-white/20"></span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
    };

    const clusterGroup = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 50
    });

    // Tambahkan marker untuk setiap zone
    filteredZones.forEach((zone) => {
      const sensor = sensorData.find((s) => s.zone_id === zone.id && s.sensor_type?.startsWith('Ultrasonic'));
      const capacity = sensor ? `${Math.round(sensor.fill_percentage)}%` : 'Offline';
      const status = sensor ? zone.risk_status : 'Offline';

      const marker = L.marker([zone.latitude, zone.longitude], {
        icon: createMarkerIcon(status)
      });

      // Custom popup HTML (Tahap 1: Tambahkan tombol Lihat Detail)
      const popupContent = `
        <div class="font-sans p-2.5 min-w-44 text-slate-800">
          <div class="flex items-center gap-2 mb-2 pb-1.5 border-b border-slate-100/60">
            <span class="w-1.5 h-1.5 rounded-full ${
              status === 'High Priority' ? 'bg-red-500' : status === 'Warning' ? 'bg-amber-500' : status === 'Offline' ? 'bg-slate-400' : 'bg-emerald-500'
            }"></span>
            <h4 class="font-bold text-xs text-slate-800">${zone.name}</h4>
          </div>
          <div class="space-y-1 text-[11px] mb-3">
            <div class="flex justify-between items-center">
              <span class="text-slate-400">Kapasitas IoT</span>
              <span class="font-semibold text-slate-700">${capacity}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-400">Status Risiko</span>
              <span class="font-bold text-[10px] px-1.5 py-0.5 rounded-full ${
                status === 'High Priority' ? 'text-red-600 bg-red-50' : status === 'Warning' ? 'text-amber-600 bg-amber-50' : status === 'Offline' ? 'text-slate-600 bg-slate-50' : 'text-emerald-600 bg-emerald-50'
              }">${status}</span>
            </div>
          </div>
          <button class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 px-3 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors text-[10px]" id="btn-detail-${zone.id}">
            <span>Lihat Detail</span>
            <svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      `;

      marker.bindPopup(popupContent, {
        closeButton: false,
        offset: [0, -8]
      });

      marker.on('click', async () => {
        setSelectedZone(zone);
        setSelectedSensor(sensor);
        setSelectedDriver(null); // Reset sementara loading

        try {
          const onDutyDrivers = drivers.filter(d => d.status === 'On Duty');
          let foundDriver = null;
          for (const d of onDutyDrivers) {
            const res = await api.getDriverActiveRoute(d.id);
            if (res.success && res.data && res.data.length > 0) {
              const activeRoute = res.data[0];
              const zoneIds = JSON.parse(activeRoute.route_json || '[]');
              if (zoneIds.includes(zone.id)) {
                foundDriver = d;
                break;
              }
            }
          }
          setSelectedDriver(foundDriver);
        } catch (err) {
          console.error("Gagal mencocokkan driver aktif untuk wilayah ini:", err);
        }
      });

      clusterGroup.addLayer(marker);
      markersRef.current.push(marker);
    });

    mapRef.current.addLayer(clusterGroup);
    clusterGroupRef.current = clusterGroup;

    // Auto-fit bounds if we have markers
    if (markersRef.current.length > 0) {
      const group = L.featureGroup(markersRef.current);
      mapRef.current.fitBounds(group.getBounds().pad(0.15));
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.off('popupopen', handlePopupOpen);
      }
    };
  }, [zones, sensorData, drivers, selectedStatuses, selectedRegions]);

  // Recenter map focus to primary bounds
  const handleRecenter = () => {
    if (mapRef.current && markersRef.current.length > 0) {
      const group = L.featureGroup(markersRef.current);
      mapRef.current.flyToBounds(group.getBounds().pad(0.15), {
        duration: 1.2
      });
    }
  };

  return (
    <div className="flex-1 flex h-full relative overflow-hidden bg-slate-100">
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-xs flex flex-col items-center justify-center z-50 text-slate-500">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-xl animate-pulse" />
            <FontAwesomeIcon icon={faSpinner} className="text-3xl animate-spin text-emerald-500 relative" />
          </div>
          <p className="text-sm font-semibold tracking-wide">Memuat peta pemantauan</p>
          <div className="mt-3 flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}

      {/* Main Map Viewport — full screen */}
      <div className="flex-1 h-full relative z-0">
        {/* Container Peta Leaflet */}
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Floating Filter Toggle */}
        <button
          onClick={() => setFilterOpen((v) => !v)}
          className="absolute top-4 left-4 z-[1010] w-11 h-11 rounded-2xl bg-white/90 backdrop-blur-md shadow-soft active:scale-90 transition-all duration-200 ease-out flex items-center justify-center text-slate-500 hover:text-emerald-600 cursor-pointer group"
          title="Filter Peta"
        >
          <FontAwesomeIcon
            icon={faSliders}
            className={`transition-transform duration-300 ease-out ${filterOpen ? 'rotate-90 scale-110' : ''}`}
          />
        </button>

        {/* Floating Filter Panel — animated glass card */}
        <div
          className={`absolute top-16 left-4 right-4 sm:top-4 sm:left-18 sm:right-auto z-[1010] sm:w-72 max-h-[calc(100%-6rem)] overflow-y-auto transition-all duration-200 ease-out origin-top-left rounded-2xl ${
            filterOpen
              ? 'opacity-100 scale-100 pointer-events-auto'
              : 'opacity-0 scale-95 pointer-events-none'
          }`}
        >
          <div className="relative bg-white/75 backdrop-blur-xl border border-white/30 rounded-2xl shadow-soft p-5 overflow-hidden">
            {/* Subtle top accent glow */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />

            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Filter Peta Pemantauan</h3>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                  Saring lokasi TPS berdasarkan tingkat risiko.
                </p>
              </div>
              <button
                onClick={() => setFilterOpen(false)}
                className="w-6 h-6 rounded-lg bg-slate-100/80 hover:bg-slate-200/80 backdrop-blur-sm flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all duration-150 cursor-pointer shrink-0 active:scale-90"
              >
                <FontAwesomeIcon icon={faXmark} className="text-xs" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-2.5 mb-3 bg-red-50/80 backdrop-blur-sm border border-red-200/60 text-red-700 text-[10px] font-semibold rounded-xl leading-relaxed">
                <FontAwesomeIcon icon={faTriangleExclamation} className="mr-1.5" /> {errorMessage}
              </div>
            )}

            <div className="space-y-3 mb-4">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filter Status TPS</h4>
              
              {[
                { key: 'Normal', label: 'Normal', color: 'bg-emerald-500', ping: 'bg-emerald-400' },
                { key: 'Warning', label: 'Warning / Waspada', color: 'bg-amber-500', ping: 'bg-amber-400' },
                { key: 'High Priority', label: 'High Priority / Awas', color: 'bg-red-500', ping: 'bg-red-400' },
                { key: 'Offline', label: 'Offline / Tanpa Sensor', color: 'bg-slate-400', ping: 'bg-slate-300' }
              ].map(({ key, label, color, ping }) => (
                <label key={key} className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer select-none group/label">
                  <div className="relative w-4 h-4 shrink-0">
                    <input
                      type="checkbox"
                      checked={selectedStatuses[key]}
                      onChange={(e) => setSelectedStatuses(prev => ({ ...prev, [key]: e.target.checked }))}
                      className="peer appearance-none w-4 h-4 border-2 border-slate-300 rounded-md checked:border-emerald-500 checked:bg-emerald-500 transition-all duration-150 cursor-pointer"
                    />
                    <svg
                      className="absolute inset-0 w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-150 pointer-events-none"
                      viewBox="0 0 16 16"
                      fill="none"
                    >
                      <path d="M4 8.5L6.5 11L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="flex items-center gap-2 group-hover/label:text-slate-900 transition-colors">
                    <span className="relative flex h-3 w-3 items-center justify-center shrink-0">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${ping} opacity-75`} />
                      <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${color} ring-1 ring-white/10`} />
                    </span>
                    <span>{label}</span>
                  </div>
                </label>
              ))}
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-100/60">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Legenda Status</h4>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
                <div className="flex items-center gap-2 text-[10px] font-medium text-slate-600">
                  <span className="relative flex h-3 w-3 items-center justify-center shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500 ring-1 ring-red-300/50" />
                  </span>
                  <span>High Priority</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-medium text-slate-600">
                  <span className="relative flex h-3 w-3 items-center justify-center shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500 ring-1 ring-amber-300/50" />
                  </span>
                  <span>Warning</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-medium text-slate-600">
                  <span className="relative flex h-3 w-3 items-center justify-center shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500 ring-1 ring-emerald-300/50" />
                  </span>
                  <span>Normal</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-medium text-slate-600">
                  <span className="relative flex h-3 w-3 items-center justify-center shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-300 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-slate-400 ring-1 ring-slate-300/50 border border-dashed border-slate-200" />
                  </span>
                  <span>Offline</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Controls & Legend Ref Filter Panel — right side */}
        <div className="absolute top-4 right-4 z-[1010] flex flex-col gap-3 items-end">
          {/* Recenter Button */}
          <button
            onClick={handleRecenter}
            className="w-11 h-11 rounded-2xl bg-white/90 backdrop-blur-md shadow-soft active:scale-90 transition-all duration-200 ease-out flex items-center justify-center text-slate-500 hover:text-emerald-600 cursor-pointer shrink-0"
            title="Pusatkan Peta"
          >
            <FontAwesomeIcon icon={faLocationCrosshairs} className="transition-transform duration-200 hover:rotate-45" />
          </button>

          {/* Legend Control Box matching legend-ref.png */}
          <div className="w-56 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl shadow-md p-4 text-[10px] text-slate-700 font-sans">
            {/* Basemap Selection */}
            <div className="space-y-2 mb-3 pb-3 border-b border-slate-100 flex flex-col">
              <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] font-bold text-emerald-600 uppercase tracking-wide">
                <input
                  type="radio"
                  name="basemap"
                  checked={selectedBasemap === 'Carto'}
                  onChange={() => setSelectedBasemap('Carto')}
                  className="w-4 h-4 accent-blue-600 cursor-pointer"
                />
                <span>Carto</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] font-bold text-emerald-600 uppercase tracking-wide">
                <input
                  type="radio"
                  name="basemap"
                  checked={selectedBasemap === 'jakartasatu'}
                  onChange={() => setSelectedBasemap('jakartasatu')}
                  className="w-4 h-4 accent-blue-600 cursor-pointer"
                />
                <span>jakartasatu</span>
              </label>
            </div>

            {/* Region Overlays Selection */}
            <div className="space-y-2 flex flex-col">
              {[
                'KAB. KEPULAUAN SERIBU',
                'KOTA ADM. JAKARTA PUSAT',
                'KOTA ADM. JAKARTA UTARA',
                'KOTA ADM. JAKARTA BARAT',
                'KOTA ADM. JAKARTA SELATAN',
                'KOTA ADM. JAKARTA TIMUR'
              ].map((region) => (
                <label key={region} className="flex items-center gap-2 cursor-pointer select-none text-[11px] font-bold text-emerald-600 uppercase tracking-wide">
                  <input
                    type="checkbox"
                    checked={selectedRegions[region]}
                    onChange={(e) => setSelectedRegions(prev => ({ ...prev, [region]: e.target.checked }))}
                    className="w-4 h-4 rounded accent-blue-650 cursor-pointer"
                  />
                  <span>{region}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Floating Summary Overlay */}
        <div className="absolute bottom-4 left-4 right-4 md:right-auto md:w-96 z-[1010] bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl shadow-soft p-5 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />

          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="text-sm font-bold text-slate-800">Detail TPS Terpilih</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">Klik pin lokasi TPS di peta untuk memuat detail</p>
            </div>
            {selectedZone ? (
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize backdrop-blur-sm ${
                  !selectedSensor
                    ? 'text-slate-600 bg-slate-100/60 border border-slate-200/50'
                    : selectedZone.risk_status === 'High Priority'
                    ? 'text-red-600 bg-red-50/80 border border-red-200/50'
                    : selectedZone.risk_status === 'Warning'
                    ? 'text-amber-600 bg-amber-50/80 border border-amber-200/50'
                    : 'text-emerald-600 bg-emerald-50/80 border border-emerald-200/50'
                }`}
              >
                {!selectedSensor ? 'Offline' : selectedZone.risk_status}
              </span>
            ) : null}
          </div>
          
          {selectedZone ? (
            <div className="space-y-2.5 border-t border-slate-100/60 pt-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Nama TPS</span>
                <span className="font-semibold text-slate-700">{selectedZone.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Kapasitas Aktual</span>
                <span className="font-semibold text-slate-700">
                  {selectedSensor ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        selectedSensor.fill_percentage > 80 ? 'bg-red-500' :
                        selectedSensor.fill_percentage > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`} />
                      {Math.round(selectedSensor.fill_percentage)}%
                    </span>
                  ) : 'Koneksi Terputus'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Driver Ditugaskan</span>
                <span className="font-semibold text-slate-700">
                  {selectedDriver ? selectedDriver.name : (
                    <span className="text-slate-400 font-normal">Belum Ditugaskan</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Status Driver</span>
                <span
                  className={`font-semibold inline-flex items-center gap-1.5 ${
                    selectedDriver?.status === 'Available'
                      ? 'text-emerald-600'
                      : selectedDriver?.status === 'On Duty'
                      ? 'text-amber-600'
                      : 'text-red-500'
                  }`}
                >
                  {selectedDriver && (
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      selectedDriver.status === 'Available' ? 'bg-emerald-500' :
                      selectedDriver.status === 'On Duty' ? 'bg-amber-500' : 'bg-red-500'
                    }`} />
                  )}
                  {selectedDriver ? selectedDriver.status : '-'}
                </span>
              </div>
            </div>
          ) : (
            <div className="py-6 border-t border-slate-100/60 flex flex-col items-center justify-center text-xs text-slate-400 gap-2">
              <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              <span>Klik penanda TPS di peta untuk detail</span>
            </div>
          )}
        </div>
      </div>

      {/* DETAIL MODAL (Tahap 1) */}
      <ZoneDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        zone={detailZone}
        onZoneChange={(updatedZone) => {
          setDetailZone(updatedZone);
          // Sync data zones
          setZones(prev => prev.map(z => z.id === updatedZone.id ? updatedZone : z));
        }}
      />
    </div>
  );
}
