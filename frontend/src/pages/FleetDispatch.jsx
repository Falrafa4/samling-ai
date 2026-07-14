import { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faRoute,
  faSpinner,
  faCheckCircle,
  faImages,
  faPlay,
  faCog,
  faUser,
  faTruck
} from '@fortawesome/free-solid-svg-icons';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../services/api';
import Header from '../components/Header';
import ConfirmModal from '../components/fragments/ConfirmModal';

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
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [zones, setZones] = useState([]);
  const [fleets, setFleets] = useState([]);

  // States
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Mini Leaflet Map Refs
  const miniMapContainerRef = useRef(null);
  const miniMapRef = useRef(null);
  const mapMarkersRef = useRef([]);
  const polylineRef = useRef(null);

  // Fetch initial routes, zones & fleets
  async function loadData(showLoading = true) {
    try {
      if (showLoading) setLoading(true);
      const [routesRes, zonesRes, fleetsRes] = await Promise.all([
        api.getLatestRouteRecommendation(),
        api.getZones(),
        api.getFleets()
      ]);

      if (zonesRes.success) {
        setZones(zonesRes.data || []);
      }
      if (fleetsRes.success) {
        setFleets(fleetsRes.data || []);
      }
      if (routesRes.success) {
        const list = routesRes.data || [];
        setRoutes(list);
        if (list.length > 0) {
          // Keep current selection or default to first route
          setSelectedRoute(prev => {
            if (prev) {
              const updated = list.find(r => r.id === prev.id);
              return updated || list[0];
            }
            return list[0];
          });
        } else {
          setSelectedRoute(null);
        }
      }
    } catch (err) {
      setErrorMessage(err.message || 'Gagal memuat data rute, wilayah & armada.');
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!miniMapContainerRef.current) return;

    if (!miniMapRef.current) {
      miniMapRef.current = L.map(miniMapContainerRef.current, {
        zoomControl: true,
        attributionControl: false,
        scrollWheelZoom: true,
        dragging: true
      }).setView([-6.1944, 106.7672], 12);

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      ).addTo(miniMapRef.current);
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

  // Render polyline and markers on mini map when selectedRoute updates
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

    if (!selectedRoute) {
      miniMapRef.current.setView([-6.1944, 106.7672], 12);
      return;
    }

    try {
      const stops = JSON.parse(selectedRoute.route_json || '[]');
      const tpsStops = stops.filter(s => s.type === 'TPS');
      const latlngs = tpsStops.map(s => [s.latitude, s.longitude]);

      const driver = selectedRoute.driver;
      if (driver && driver.depot_latitude && driver.depot_longitude) {
        const depotLat = driver.depot_latitude;
        const depotLng = driver.depot_longitude;
        
        // Add Depot marker
        const depotMarker = L.marker([depotLat, depotLng], {
          icon: L.divIcon({
            className: 'custom-depot-marker',
            html: `
              <div class="w-8 h-8 rounded-full bg-blue-600 border border-white text-white flex items-center justify-center font-bold text-sm shadow-md animate-pulse">
                🏢
              </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          })
        }).addTo(miniMapRef.current);
        
        depotMarker.bindTooltip(`<b>Pool Depot DLH: ${selectedRoute.coverage_area}</b>`, { direction: 'top', offset: [0, -10] });
        mapMarkersRef.current.push(depotMarker);

        // Prepend depot to latlngs
        latlngs.unshift([depotLat, depotLng]);
      }

      // Add custom numbered markers for TPS stops
      tpsStops.forEach((stop, index) => {
        const marker = L.marker([stop.latitude, stop.longitude], {
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

        const zone = zones.find(z => z.id === stop.tps_id);
        const name = zone ? zone.name : `TPS #${stop.tps_id}`;
        marker.bindTooltip(`<b>${name}</b><br/>Urutan: ${index + 1}<br/>Vol: ${Math.round(stop.prediction)}%`, { direction: 'top', offset: [0, -6] });
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
  }, [selectedRoute, zones]);

  // Handle Pipeline Trigger Route Scheduler
  const handleTriggerAIScheduler = async () => {
    try {
      setTriggering(true);
      setErrorMessage('');
      setSuccessMessage('');
      const res = await api.triggerRouteGeneration();
      if (res.success) {
        setSuccessMessage('Pipeline optimasi rute AI berhasil dimulai di background. Menyegarkan rute...');
        // Refresh data after short delay to let scheduler process
        setTimeout(() => {
          loadData(false);
        }, 1500);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Gagal menjalankan scheduler optimasi rute.');
    } finally {
      setTriggering(false);
    }
  };

  // Handle Route Assignment / Dispatch
  const handleDispatch = async () => {
    if (!selectedRoute || !selectedRoute.driver_id) return;
    try {
      setDispatching(true);
      setErrorMessage('');
      setSuccessMessage('');
      const res = await api.dispatchRoute(selectedRoute.driver_id);
      if (res.success) {
        setSuccessMessage(`Manifes rute berhasil dikirimkan ke supir ${selectedRoute.driver ? selectedRoute.driver.name : ''}!`);
        setIsConfirmOpen(false);
        await loadData(false);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Gagal mengirim penugasan rute.');
      setIsConfirmOpen(false);
    } finally {
      setDispatching(false);
    }
  };

  // Handle Complete Route
  const handleCompleteRoute = async () => {
    if (!selectedRoute) return;
    try {
      setCompleting(true);
      setErrorMessage('');
      const res = await api.updateRouteStatus(selectedRoute.id, 'Completed');
      if (res.success) {
        setSuccessMessage('Tugas pengangkutan rute berhasil diselesaikan!');
        await loadData(false);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Gagal menyelesaikan rute tugas.');
    } finally {
      setCompleting(false);
    }
  };

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

  const getRouteMilestones = () => {
    if (!selectedRoute) return [];
    try {
      const stops = JSON.parse(selectedRoute.route_json || '[]');
      const tpsStops = stops.filter(s => s.type === 'TPS');
      return tpsStops.map(stop => {
        const zone = zones.find(z => z.id === stop.tps_id);
        return {
          ...stop,
          name: zone ? zone.name : `TPS #${stop.tps_id}`
        };
      });
    } catch (e) {
      return [];
    }
  };

  const milestones = getRouteMilestones();
  const selectedDriver = selectedRoute?.driver;
  const selectedDriverFleet = fleets.find(f => f.id === selectedDriver?.fleet_id);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50 relative">
      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDispatch}
        title="Konfirmasi Pengiriman Rute"
        message={`Apakah Anda yakin ingin mengirim manifes rute ini kepada driver ${selectedDriver ? selectedDriver.name : ''}?`}
        confirmText="Kirim"
        confirmBgColorClass="bg-emerald-600 hover:bg-emerald-500"
        icon={faRoute}
        submitting={dispatching}
      />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-xs flex flex-col items-center justify-center z-50 text-slate-500">
          <FontAwesomeIcon icon={faSpinner} className="text-3xl animate-spin text-emerald-500 mb-3" />
          <p className="text-sm font-semibold">Memuat rute & armada...</p>
        </div>
      )}

      {/* Scrollable wrapper */}
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Manajemen Rute &amp; Armada</h1>
            <p className="text-xs text-slate-500 mt-1">Pantau dan verifikasi rute optimal yang telah di-assign oleh AI scheduler.</p>
          </div>
          <button
            onClick={handleTriggerAIScheduler}
            disabled={triggering}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors self-start sm:self-auto"
          >
            {triggering ? (
              <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
            ) : (
              <FontAwesomeIcon icon={faCog} />
            )}
            <span>Jalankan Scheduler AI</span>
          </button>
        </div>

        {/* Main Grid Content */}
        <div className="px-4 sm:px-8 py-4 sm:py-6 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          
          {/* Left Column (7 Columns): horizontal route selection, Leaflet map, and Milestones */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm flex flex-col justify-between min-h-[350px] sm:min-h-[420px] gap-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-md font-bold text-slate-800">Rute Pengangkutan Optimal</h3>
                {selectedRoute && (
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                    selectedRoute.status === 'Completed' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                    selectedRoute.status === 'In Progress' ? 'text-blue-700 bg-blue-50 border-blue-200' :
                    'text-slate-500 bg-slate-100 border-slate-200'
                  }`}>
                    STATUS: {selectedRoute.status}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Pilih salah satu rute rekomendasi hasil scheduler AI di bawah ini untuk memantau jalurnya.
              </p>
            </div>

            {/* Horizontal Scroll List of Route recommendations */}
            <div className="flex gap-3 overflow-x-auto pb-3 mb-2 select-none scrollbar-thin">
              {routes.map((route) => {
                const isSelected = selectedRoute?.id === route.id;
                return (
                  <div
                    key={route.id}
                    onClick={() => setSelectedRoute(route)}
                    className={`min-w-[210px] p-4 border rounded-xl cursor-pointer transition-all duration-200 flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/10 shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100/50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-slate-800">Rute #{route.id}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border ${
                        route.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        route.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {route.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-600">{route.coverage_area || 'Tidak ada wilayah'}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{route.total_stops} TPS</p>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-505 font-medium">
                      <span className="text-slate-400">Driver:</span>
                      <span className="font-semibold text-slate-750 truncate max-w-[110px]">
                        {route.driver ? route.driver.name : 'Belum Ditugaskan'}
                      </span>
                    </div>
                  </div>
                );
              })}
              {routes.length === 0 && (
                <div className="w-full text-center py-6 text-xs text-slate-400 italic">
                  Tidak ada rute rekomendasi aktif dari scheduler.
                </div>
              )}
            </div>

            {/* Map Preview Container */}
            <div className="flex-1 min-h-[220px] rounded-lg border border-slate-200 overflow-hidden relative">
              <div ref={miniMapContainerRef} className="w-full h-full z-0" />
              {!selectedRoute && (
                <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-xs flex flex-col items-center justify-center text-slate-600 z-10 p-4">
                  <FontAwesomeIcon icon={faRoute} className="text-3xl text-slate-400 mb-2" />
                  <p className="text-xs font-bold">Tidak Ada Rute Dipilih</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Pilih salah satu kartu rute untuk menampilkan jalur.</p>
                </div>
              )}
            </div>

            {/* Route Milestones */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tahapan Jalur</h4>
              {milestones.length > 0 ? (
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                  {milestones.map((milestone, idx) => (
                    <div key={milestone.tps_id} className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg shadow-2xs">
                        <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[9px]">
                          {idx + 1}
                        </span>
                        <span>{milestone.name}</span>
                        <span className="text-[10px] text-slate-400">({Math.round(milestone.prediction)}%)</span>
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

          {/* Right Column (5 Columns): Driver profile details & status action triggers */}
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

            {/* Driver & Fleet Info Details */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm flex flex-col gap-4">
              <h3 className="text-sm sm:text-md font-bold text-slate-800 flex items-center gap-2">
                <FontAwesomeIcon icon={faUser} className="text-slate-400" />
                <span>Supir Tugas &amp; Armada</span>
              </h3>
              
              {selectedDriver ? (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{selectedDriver.name}</h4>
                        <p className="text-[10px] text-slate-505 mt-0.5">
                          No. WA: {selectedDriver.whatsapp_number}
                        </p>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold uppercase border ${getStatusClasses(selectedDriver.status)}`}>
                        {selectedDriver.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-[10px] text-slate-500">
                      <div>
                        <span className="block text-slate-400 font-semibold uppercase text-[8px] tracking-wider mb-0.5">Armada</span>
                        <span className="font-bold text-slate-700 flex items-center gap-1">
                          <FontAwesomeIcon icon={faTruck} className="text-[10px] text-slate-400" />
                          <span>{selectedDriverFleet ? selectedDriverFleet.name : 'Tanpa Kendaraan'}</span>
                        </span>
                      </div>
                      <div>
                        <span className="block text-slate-400 font-semibold uppercase text-[8px] tracking-wider mb-0.5">Wilayah Tugas</span>
                        <span className="font-bold text-slate-700">{selectedRoute.coverage_area || 'Semua Wilayah'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl text-xs text-slate-400 italic">
                  Tidak ada supir yang ditugaskan untuk rute ini.
                </div>
              )}
            </div>

            {/* Action dispatch panel */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm space-y-4">
              <h3 className="text-sm sm:text-md font-bold text-slate-800">Eksekusi Penugasan Rute</h3>
              
              {selectedRoute && selectedDriver ? (
                <div className="space-y-3 text-xs">
                  <p className="text-slate-500">
                    Rute untuk supir: <span className="font-bold text-slate-800">{selectedDriver.name}</span> | Wilayah: <span className="font-semibold text-slate-700">{selectedRoute.coverage_area || 'Semua Wilayah'}</span>
                  </p>

                  {/* If Route is In Progress, allow resolving / complete manually */}
                  {selectedRoute.status === 'In Progress' ? (
                    <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-lg space-y-3">
                      <p className="text-[11px] text-amber-800 leading-relaxed font-semibold">
                        Supir sedang melaksanakan pengangkutan. Jika tugas telah dilaporkan selesai secara manual, admin dapat menutup rute ini.
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
                        <span>Tandai Rute Selesai</span>
                      </button>
                    </div>
                  ) : selectedDriver.status === 'Offline' ? (
                    <p className="text-xs text-slate-400 bg-slate-100 p-2.5 rounded-lg border border-slate-200/80 leading-relaxed">
                      ⚠️ Supir sedang offline. Harap minta supir menyalakan status di aplikasi driver agar dapat ditugaskan.
                    </p>
                  ) : selectedRoute.status === 'Completed' ? (
                    <p className="text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200/80 font-medium">
                      ✓ Rute optimal ini telah selesai dikerjakan secara menyeluruh.
                    </p>
                  ) : (
                    <p className="text-xs text-slate-505 mt-0.5">
                      Kirim manifes rute prioritas ini ke dasbor aplikasi supir yang bertugas.
                    </p>
                  )}

                  {/* Dispatch Button */}
                  {selectedRoute.status === 'Pending' && selectedDriver.status === 'Available' && (
                    <button
                      onClick={() => setIsConfirmOpen(true)}
                      disabled={dispatching}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-950/20"
                    >
                      {dispatching ? (
                        <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                      ) : (
                        <FontAwesomeIcon icon={faRoute} />
                      )}
                      <span>Kirim Rute ke Supir</span>
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Pilih rute untuk mengelola penugasan.</p>
              )}
            </div>

            {/* Proof Viewer Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-xs font-bold text-slate-800">Bukti Pengangkutan Driver</h4>
                <FontAwesomeIcon icon={faImages} className="text-slate-400 text-sm" />
              </div>
              <p className="text-[10px] text-slate-500 mb-4">
                Review foto bukti TPS bersih yang dikirim driver melalui aplikasi.
              </p>
              
              {selectedRoute && selectedRoute.status === 'Completed' ? (
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
    </div>
  );
}
