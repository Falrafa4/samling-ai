import { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPaperPlane,
  faCircleCheck,
  faTriangleExclamation,
  faRoute,
  faSpinner,
  faCheckCircle,
  faImages
} from '@fortawesome/free-solid-svg-icons';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../services/api';

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

export default function FleetDispatch() {
  const [drivers, setDrivers] = useState([]);
  const [zones, setZones] = useState([]);
  const [selectedDriverId, setSelectedDriverId] = useState(null);
  
  // Route details
  const [activeRoute, setActiveRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Mini Leaflet Map Refs
  const miniMapContainerRef = useRef(null);
  const miniMapRef = useRef(null);
  const mapMarkersRef = useRef([]);
  const polylineRef = useRef(null);

  // Fetch initial drivers & zones
  useEffect(() => {
    async function initData() {
      try {
        setLoading(true);
        const [driversRes, zonesRes] = await Promise.all([
          api.getDrivers(),
          api.getZones()
        ]);

        if (driversRes.success) {
          const list = driversRes.data || [];
          setDrivers(list);
          if (list.length > 0) {
            setSelectedDriverId(list[0].id); // Default select first driver
          }
        }
        if (zonesRes.success) {
          setZones(zonesRes.data || []);
        }
      } catch (err) {
        setErrorMessage(err.message || 'Gagal memuat data driver & wilayah.');
      } finally {
        setLoading(false);
      }
    }

    initData();
  }, []);

  // Fetch driver active route whenever selectedDriverId changes
  useEffect(() => {
    if (!selectedDriverId) return;

    async function fetchActiveRoute() {
      try {
        setLoadingRoute(true);
        setSuccessMessage('');
        const res = await api.getDriverActiveRoute(selectedDriverId);
        if (res.success && res.data && res.data.length > 0) {
          // get the first active route (Pending/In Progress)
          setActiveRoute(res.data[0]);
        } else {
          setActiveRoute(null);
        }
      } catch (err) {
        console.error('Gagal mengambil rute aktif driver:', err);
        setActiveRoute(null);
      } finally {
        setLoadingRoute(false);
      }
    }

    fetchActiveRoute();
  }, [selectedDriverId]);

  // Initialize and update Mini Map
  useEffect(() => {
    if (!miniMapContainerRef.current) return;

    // Initialize map if not yet done
    if (!miniMapRef.current) {
      miniMapRef.current = L.map(miniMapContainerRef.current, {
        zoomControl: true,
        attributionControl: false,
        scrollWheelZoom: true,
        dragging: true
      }).setView([-6.1944, 106.7672], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(miniMapRef.current);
    }

    return () => {
      if (miniMapRef.current) {
        miniMapRef.current.remove();
        miniMapRef.current = null;
      }
    };
  }, []);

  // Force map to invalidate size when loading is finished
  useEffect(() => {
    if (miniMapRef.current) {
      setTimeout(() => {
        if (miniMapRef.current) {
          miniMapRef.current.invalidateSize();
        }
      }, 200);
    }
  }, [loading]);

  // Render polyline and markers on mini map when activeRoute updates
  useEffect(() => {
    if (!miniMapRef.current || zones.length === 0) return;

    // Clear old markers
    mapMarkersRef.current.forEach((marker) => miniMapRef.current.removeLayer(marker));
    mapMarkersRef.current = [];

    // Clear old polyline
    if (polylineRef.current) {
      miniMapRef.current.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }

    if (!activeRoute) {
      // Default to general coordinates if no active route
      miniMapRef.current.setView([-6.1944, 106.7672], 12);
      return;
    }

    try {
      const zoneIds = JSON.parse(activeRoute.route_json);
      const routeZones = zoneIds
        .map((id) => zones.find((z) => z.id === id))
        .filter(Boolean);

      const latlngs = routeZones.map((z) => [z.latitude, z.longitude]);

      // Add custom numbered markers
      routeZones.forEach((z, index) => {
        const marker = L.marker([z.latitude, z.longitude], {
          icon: L.divIcon({
            className: 'custom-mini-marker',
            html: `
              <div class="w-6 h-6 rounded-full bg-emerald-600 border border-white text-white flex items-center justify-center font-bold text-xs shadow-md">
                ${index + 1}
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          })
        }).addTo(miniMapRef.current);

        marker.bindTooltip(`<b>${z.name}</b>`, { direction: 'top', offset: [0, -6] });
        mapMarkersRef.current.push(marker);
      });

      // Draw polyline connecting markers
      if (latlngs.length > 1) {
        polylineRef.current = L.polyline(latlngs, {
          color: '#10b981', // Emerald 500
          weight: 4,
          dashArray: '5, 10',
          lineCap: 'round'
        }).addTo(miniMapRef.current);
      }

      // Fit map bounds
      if (latlngs.length > 0) {
        const bounds = L.latLngBounds(latlngs);
        miniMapRef.current.fitBounds(bounds.pad(0.3));
      }
    } catch (e) {
      console.error('Gagal merender rute pada mini map:', e);
    }
  }, [activeRoute, zones]);

  // Handle WhatsApp Dispatch
  const handleDispatch = async () => {
    if (!selectedDriverId) return;
    try {
      setDispatching(true);
      setErrorMessage('');
      setSuccessMessage('');
      const res = await api.dispatchRoute(selectedDriverId);
      if (res.success) {
        setSuccessMessage(res.message || 'Manifes rute dikirim ke WhatsApp Driver!');
        // Refresh driver lists & active route to sync status
        const [driversRes, routeRes] = await Promise.all([
          api.getDrivers(),
          api.getDriverActiveRoute(selectedDriverId)
        ]);
        if (driversRes.success) setDrivers(driversRes.data || []);
        if (routeRes.success && routeRes.data && routeRes.data.length > 0) {
          setActiveRoute(routeRes.data[0]);
        }
      }
    } catch (err) {
      setErrorMessage(err.message || 'Gagal mengirim manifest rute supir.');
    } finally {
      setDispatching(false);
    }
  };

  // Handle manual Complete Route
  const handleCompleteRoute = async () => {
    if (!activeRoute) return;
    try {
      setCompleting(true);
      setErrorMessage('');
      const res = await api.updateRouteStatus(activeRoute.id, 'Completed');
      if (res.success) {
        setSuccessMessage('Tugas pengangkutan rute berhasil diselesaikan!');
        // Refresh driver lists & active route
        const [driversRes, routeRes] = await Promise.all([
          api.getDrivers(),
          api.getDriverActiveRoute(selectedDriverId)
        ]);
        if (driversRes.success) setDrivers(driversRes.data || []);
        if (routeRes.success && routeRes.data && routeRes.data.length > 0) {
          setActiveRoute(routeRes.data[0]);
        } else {
          setActiveRoute(null);
        }
      }
    } catch (err) {
      setErrorMessage(err.message || 'Gagal menyelesaikan rute tugas.');
    } finally {
      setCompleting(false);
    }
  };

  const selectedDriver = drivers.find((d) => d.id === selectedDriverId);

  // Helper to translate status color classes
  const getStatusClasses = (status) => {
    switch (status) {
      case 'Available':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'On Duty':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      default:
        return 'text-slate-500 bg-slate-100 border-slate-200';
    }
  };

  // Helper to parse route_json and return readable names
  const getRouteMilestones = () => {
    if (!activeRoute) return [];
    try {
      const ids = JSON.parse(activeRoute.route_json);
      return ids.map((id) => zones.find((z) => z.id === id)).filter(Boolean);
    } catch (e) {
      return [];
    }
  };

  const milestones = getRouteMilestones();

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 relative">
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-xs flex flex-col items-center justify-center z-50 text-slate-500">
          <FontAwesomeIcon icon={faSpinner} className="text-3xl animate-spin text-emerald-500 mb-3" />
          <p className="text-sm font-semibold">Memuat data armada & supir...</p>
        </div>
      )}

      {/* Header */}
      <header className="px-8 py-6 bg-white border-b border-slate-200 shrink-0">
        <h2 className="text-2xl font-bold text-slate-800">Manajemen Rute &amp; Armada</h2>
        <p className="text-sm text-slate-500">
          Kirim manifes rute prioritas hasil prediksi AI ke driver supir via WhatsApp Gateway.
        </p>
      </header>

      {/* Main Grid Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (7 Columns): Rute Rekomendasi AI & Mini Map */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between min-h-[420px]">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-md font-bold text-slate-800">Rute Pengangkutan Optimal</h3>
              {activeRoute && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase">
                  Status: {activeRoute.status}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mb-6">
              Urutan pengangkutan TPS terbaik yang dihitung berdasarkan volume urgensi dan jarak tempuh.
            </p>
          </div>

          {/* Map Preview Container */}
          <div className="flex-1 min-h-[220px] rounded-lg border border-slate-200 overflow-hidden relative mb-6">
            <div ref={miniMapContainerRef} className="w-full h-full z-0" />
            {!activeRoute && (
              <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-xs flex flex-col items-center justify-center text-slate-600 z-10 p-4">
                <FontAwesomeIcon icon={faRoute} className="text-3xl text-slate-400 mb-2" />
                <p className="text-xs font-bold">Tidak Ada Rute Aktif</p>
                <p className="text-[10px] text-slate-505 mt-0.5">Pilih supir berstatus 'Available' untuk mengirim rute.</p>
              </div>
            )}
          </div>

          {/* Route Milestones */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tahapan Jalur</h4>
            {milestones.length > 0 ? (
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                {milestones.map((milestone, idx) => (
                  <div key={milestone.id} className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg shadow-2xs">
                      <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[9px]">
                        {idx + 1}
                      </span>
                      <span>{milestone.name}</span>
                    </div>
                    {idx < milestones.length - 1 && <span className="text-slate-400 font-bold">&rarr;</span>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Belum ada tahapan manifes ditugaskan.</p>
            )}
          </div>
        </div>

        {/* Right Column (5 Columns): Driver Readiness Panel & Execution CTA */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Messages Alerts */}
          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl">
              ⚠️ {errorMessage}
            </div>
          )}
          {successMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl">
              ✅ {successMessage}
            </div>
          )}

          {/* Driver Readiness Tracker Panel */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col flex-1 min-h-[250px]">
            <h3 className="text-md font-bold text-slate-800 mb-4">Kesiapan Driver (WhatsApp Chatbot)</h3>
            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              {drivers.map((driver) => {
                const assignedZone = zones.find((z) => z.id === driver.zone_id);
                return (
                  <div
                    key={driver.id}
                    onClick={() => setSelectedDriverId(driver.id)}
                    className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 flex justify-between items-center ${
                      selectedDriverId === driver.id
                        ? 'border-emerald-500 bg-emerald-50/20'
                        : 'border-slate-100 bg-slate-50/40 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{driver.name}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Wilayah: {assignedZone ? assignedZone.name : '-'}
                      </p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${getStatusClasses(driver.status)}`}>
                      {driver.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dispatch Execution Module */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-md font-bold text-slate-800">Eksekusi Penugasan Rute</h3>
            
            {loadingRoute ? (
              <div className="py-2 flex items-center justify-center text-xs text-slate-500">
                <FontAwesomeIcon icon={faSpinner} className="animate-spin text-emerald-500 mr-2" />
                <span>Memeriksa status rute driver...</span>
              </div>
            ) : selectedDriver ? (
              <div className="space-y-3 text-xs">
                <p className="text-slate-500">
                  Supir: <span className="font-bold text-slate-800">{selectedDriver.name}</span> ({selectedDriver.whatsapp_number})
                </p>

                {/* If Driver is On Duty, allow resolving / complete manually */}
                {selectedDriver.status === 'On Duty' && activeRoute ? (
                  <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-lg space-y-3">
                    <p className="text-[11px] text-amber-800 leading-relaxed font-semibold">
                      Supir saat ini sedang berada di rute jalan. Jika tugas selesai dilaporkan via telepon, admin dapat menandai rute selesai secara manual.
                    </p>
                    <button
                      onClick={handleCompleteRoute}
                      disabled={completing}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      {completing ? (
                        <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                      ) : (
                        <FontAwesomeIcon icon={faCheckCircle} />
                      )}
                      <span>Tandai Rute Selesai di Peta</span>
                    </button>
                  </div>
                ) : selectedDriver.status === 'Offline' ? (
                  <p className="text-xs text-slate-400 bg-slate-100 p-2.5 rounded-lg border border-slate-200/80 leading-relaxed">
                    ⚠️ Supir sedang offline. Harap minta supir menyalakan status di aplikasi/chatbot agar dapat dihubungi.
                  </p>
                ) : (
                  <p className="text-xs text-slate-500">
                    Kirim link rute Google Maps dan manifest jalan optimal ke WhatsApp driver.
                  </p>
                )}

                {/* Dispatch WhatsApp Button */}
                {selectedDriver.status === 'Available' && (
                  <button
                    onClick={handleDispatch}
                    disabled={dispatching}
                    className="w-full py-3 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/20 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {dispatching ? (
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                    ) : (
                      <FontAwesomeIcon icon={faPaperPlane} />
                    )}
                    <span>Kirim Manifes via WhatsApp</span>
                  </button>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Pilih driver untuk mengelola penugasan.</p>
            )}
          </div>

          {/* Proof Viewer Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-xs font-bold text-slate-800">Bukti Pengangkutan Driver</h4>
              <FontAwesomeIcon icon={faImages} className="text-slate-400 text-sm" />
            </div>
            <p className="text-[10px] text-slate-500 mb-4">
              Review foto bukti TPS bersih yang dikirim driver via camera WhatsApp.
            </p>
            
            {activeRoute && activeRoute.status === 'Completed' ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <FontAwesomeIcon icon={faCheckCircle} />
                </div>
                <p className="text-[10px] font-semibold text-slate-700 text-center">
                  Rute Selesai &amp; Terverifikasi Bersih
                </p>
              </div>
            ) : (
              <div className="h-24 bg-slate-50 border border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-[10px]">
                Belum ada bukti foto diunggah untuk rute ini.
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
