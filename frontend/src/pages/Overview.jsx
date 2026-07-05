import { useState } from 'react';
import { useLocalStorage } from 'react-use';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTriangleExclamation,
  faCircleCheck,
  faCloudSun,
  faFileExport,
  faCalendarDays
} from '@fortawesome/free-solid-svg-icons';

export default function Overview() {
  const [adminUser] = useLocalStorage('admin_user', null);
  const [activeDateFilter, setActiveDateFilter] = useState('7hari');

  // Contoh data awal (akan dihubungkan ke API FastAPI /dashboard/summary pada Tahap selanjutnya)
  const metrics = [
    {
      title: 'Laporan Warga Aktif',
      value: '11',
      change: '+3 laporan baru hari ini',
      status: 'warning',
      color: 'border-amber-500 bg-amber-50 text-amber-700'
    },
    {
      title: 'TPS Status Kritis',
      value: '3',
      change: 'Dari total 6 TPS kota',
      status: 'danger',
      color: 'border-red-500 bg-red-50 text-red-700'
    },
    {
      title: 'Kesiapan Armada Driver',
      value: '80%',
      change: '4/5 Supir siap bertugas',
      status: 'success',
      color: 'border-emerald-500 bg-emerald-50 text-emerald-700'
    }
  ];

  const dateFilters = [
    { id: 'hariIni', label: 'Hari Ini' },
    { id: 'besok', label: 'Besok' },
    { id: '7hari', label: '7 Hari Ke Depan' }
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50">
      {/* Top Header / Action Bar */}
      <header className="px-8 py-6 bg-white border-b border-slate-200 flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Selamat Datang, {adminUser?.username || 'Admin'}
          </h2>
          <p className="text-sm text-slate-500">
            Berikut ringkasan situasi darurat sampah kota hari ini.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Global Date Filter */}
          <div className="bg-slate-100 p-1 rounded-lg flex items-center gap-1 border border-slate-200">
            {dateFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveDateFilter(filter.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ${
                  activeDateFilter === filter.id
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          {/* Export Report Button */}
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700 transition-colors shadow-sm">
            <FontAwesomeIcon icon={faFileExport} />
            <span>Ekspor PDF</span>
          </button>
        </div>
      </header>

      {/* Main Grid Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
        {/* Contextual Alert Banner */}
        <div className="p-4 bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-200 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
              <FontAwesomeIcon icon={faCloudSun} className="text-lg" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800 leading-snug">
                Peringatan Cuaca Ekstrem (Hujan Deras Diprediksi Sore Ini)
              </h4>
              <p className="text-xs text-slate-600">
                Prediksi AI Amadeus: Kecepatan penumpukan sampah di wilayah TPS 02 Bratang dapat meningkat hingga 35%.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-800 bg-amber-200/50 px-3 py-1 rounded-full border border-amber-300">
            Risiko Sedang
          </span>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {metrics.map((card, idx) => (
            <div
              key={idx}
              className="p-6 bg-white border border-slate-200 rounded-xl hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  {card.title}
                </p>
                <h3 className="text-3xl font-extrabold text-slate-800">{card.value}</h3>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">{card.change}</span>
                <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] border ${card.color}`}>
                  {card.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* 2-Column Split: Grafik Proyeksi & Aktivitas Terbaru */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI Projections (Line Chart Placeholder) */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between shadow-sm min-h-[350px]">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-md font-bold text-slate-800">Proyeksi Estimasi Volume Sampah (7 Hari Ke Depan)</h3>
                <p className="text-xs text-slate-500">Estimasi volume sampah harian hasil perhitungan AI Amadeus</p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
                Amadeus AI Model v2.4
              </span>
            </div>
            {/* Grafik Placeholder */}
            <div className="flex-1 bg-slate-50 border border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center p-6 text-slate-400">
              <FontAwesomeIcon icon={faCalendarDays} className="text-4xl mb-3 text-slate-300" />
              <p className="text-xs font-semibold">Visualisasi Grafik Proyeksi Volume Sampah</p>
              <p className="text-[10px] mt-1 text-slate-400">
                (Integrasi Chart.js akan dihubungkan ke endpoint /volume-predictions pada Tahap 3)
              </p>
            </div>
          </div>

          {/* Aktivitas Terbaru & Driver Response Tracker */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col shadow-sm">
            <h3 className="text-md font-bold text-slate-800 mb-4">Aktivitas & Respons Driver</h3>
            <div className="flex-1 space-y-4 overflow-y-auto pr-1">
              {/* Driver 1 */}
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                  <FontAwesomeIcon icon={faCircleCheck} className="text-xs" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-slate-700">Driver Budi Utomo - Siap Bertugas</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Konfirmasi manifes rute TPS 01 dikirim via WhatsApp.</p>
                  <span className="text-[9px] font-semibold text-slate-400 block mt-1">2 menit yang lalu</span>
                </div>
              </div>

              {/* Driver 2 */}
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                  <FontAwesomeIcon icon={faTriangleExclamation} className="text-xs" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-slate-700">Driver Joko - Belum Merespon</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Sudah 15 menit sejak manifes dikirim. Menunggu konfirmasi.</p>
                  <span className="text-[9px] font-semibold text-slate-400 block mt-1">15 menit yang lalu</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
