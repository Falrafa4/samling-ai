import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMapPin,
  faCircleCheck,
  faSliders,
  faLocationCrosshairs,
  faTriangleExclamation
} from '@fortawesome/free-solid-svg-icons';

export default function PredictiveMap() {
  const [showNormalZones, setShowNormalZones] = useState(true);

  // Data TPS Kota Contoh (akan dihubungkan ke endpoint /zones pada Tahap 3)
  const mapNodes = [
    {
      id: 1,
      name: 'TPS 01 - Kebon Jeruk',
      capacity: '85%',
      status: 'High Priority',
      driver: 'Budi Utomo',
      driverStatus: 'On Duty',
      lat: -6.1944,
      lng: 106.7672,
      dataSource: 'Sensor IoT'
    },
    {
      id: 2,
      name: 'TPS 02 - Bratang',
      capacity: '65%',
      status: 'Warning',
      driver: 'Joko Anwar',
      driverStatus: 'Pending',
      lat: -7.2912,
      lng: 112.7584,
      dataSource: 'Prediksi AI'
    },
    {
      id: 3,
      name: 'TPS 03 - Keputih',
      capacity: '30%',
      status: 'Normal',
      driver: 'Asep Sunandar',
      driverStatus: 'Siap',
      lat: -7.2965,
      lng: 112.8021,
      dataSource: 'Sensor IoT'
    }
  ];

  return (
    <div className="flex-1 flex h-full relative overflow-hidden bg-slate-100">
      {/* Sidebar Control Panel (Fixed 260px) */}
      <div className="w-[280px] h-full bg-white border-r border-slate-200 z-10 p-6 flex flex-col justify-between shrink-0 shadow-sm">
        <div className="space-y-6">
          <div>
            <h3 className="text-md font-bold text-slate-800">Filter Peta Pemantauan</h3>
            <p className="text-xs text-slate-500 mt-1">Saring lokasi TPS berdasarkan tingkat risiko.</p>
          </div>

          {/* Toggle Map Layers */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lapisan Peta</h4>
            <div className="space-y-2">
              <label className="flex items-center gap-3 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showNormalZones}
                  onChange={(e) => setShowNormalZones(e.target.checked)}
                  className="rounded text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                />
                <span>Tampilkan Area Normal (Aman)</span>
              </label>
              <label className="flex items-center gap-3 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                />
                <span>Tampilkan Jalur Truk Aktif</span>
              </label>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Legenda Status</h4>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 text-xs font-medium text-slate-600">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                <span>High Priority (&gt;80% Penuh)</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-medium text-slate-600">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span>Warning (50% - 80% Penuh)</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-medium text-slate-600">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Normal (&lt;50% Penuh)</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-medium text-slate-600">
                <div className="w-3 h-3 rounded-full bg-slate-400 border-2 border-dashed border-slate-500"></div>
                <span>Sensor IoT Offline</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <span className="text-[10px] text-slate-400 block text-center">
            Peta menggunakan Leaflet Map Engine
          </span>
        </div>
      </div>

      {/* Main Map Viewport */}
      <div className="flex-1 h-full relative">
        {/* Placeholder Peta interaktif Leaflet */}
        <div className="absolute inset-0 bg-slate-200 flex flex-col items-center justify-center text-slate-400">
          <FontAwesomeIcon icon={faMapPin} className="text-5xl text-emerald-500 mb-4 animate-bounce" />
          <p className="text-sm font-bold text-slate-700">Predictive Map Viewport</p>
          <p className="text-xs mt-1 text-slate-500 max-w-sm text-center">
            (Integrasi Leaflet.js akan dihubungkan ke endpoint /zones dan data koordinat GPS pada Tahap 3)
          </p>
        </div>

        {/* Floating Controls Overlay */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          {/* Recenter Button */}
          <button className="w-10 h-10 rounded-lg bg-white shadow-md border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors">
            <FontAwesomeIcon icon={faLocationCrosshairs} />
          </button>
          <button className="w-10 h-10 rounded-lg bg-white shadow-md border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors">
            <FontAwesomeIcon icon={faSliders} />
          </button>
        </div>

        {/* Floating Summary Overlay */}
        <div className="absolute bottom-4 left-4 right-4 md:right-auto md:w-96 z-10 bg-white/90 backdrop-blur border border-slate-200/80 rounded-xl p-5 shadow-lg">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="text-sm font-bold text-slate-800">Detail TPS Terpilih</h4>
              <p className="text-[10px] text-slate-500">Arahkan kursor ke pin peta untuk melihat detail</p>
            </div>
            <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">
              Kritis
            </span>
          </div>
          
          <div className="space-y-2 border-t border-slate-100/50 pt-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Nama TPS:</span>
              <span className="font-semibold text-slate-700">TPS 01 - Kebon Jeruk</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Kapasitas Aktual:</span>
              <span className="font-semibold text-slate-700">85% (Kritis)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Driver Ditugaskan:</span>
              <span className="font-semibold text-slate-700">Budi Utomo</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Status Driver WA:</span>
              <span className="font-semibold text-red-600">⚠️ Belum Merespon</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
