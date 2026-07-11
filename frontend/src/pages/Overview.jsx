import { useState, useEffect, useRef } from 'react';
import { useLocalStorage } from 'react-use';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTriangleExclamation,
  faCircleCheck,
  faCloudSun,
  faFileExport,
  faCalendarDays,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import { api } from '../services/api';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export default function Overview() {
  const [adminUser] = useLocalStorage('admin_user', null);
  const [activeDateFilter, setActiveDateFilter] = useState('7hari');

  // API States
  const [summary, setSummary] = useState(null);
  const [zones, setZones] = useState([]);
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [projections, setProjections] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingProjections, setLoadingProjections] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Chart Refs
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  // Fetch summary & zones on mount
  useEffect(() => {
    async function initData() {
      try {
        setLoadingSummary(true);
        const [summaryRes, zonesRes] = await Promise.all([
          api.getDashboardSummary(),
          api.getZones()
        ]);

        if (summaryRes.success) {
          setSummary(summaryRes.data);
        }
        if (zonesRes.success && zonesRes.data.length > 0) {
          setZones(zonesRes.data);
          setSelectedZoneId(zonesRes.data[0].id); // Default to first zone
        }
      } catch (err) {
        setErrorMessage(err.message || 'Gagal memuat data ringkasan dashboard.');
      } finally {
        setLoadingSummary(false);
      }
    }

    initData();
  }, []);

  // Fetch projections whenever selectedZoneId changes
  useEffect(() => {
    if (!selectedZoneId) return;

    async function fetchProjections() {
      try {
        setLoadingProjections(true);
        const res = await api.getZoneProjections(selectedZoneId);
        if (res.success) {
          setProjections(res.data || []);
        }
      } catch (err) {
        console.error('Gagal memuat proyeksi AI:', err);
      } finally {
        setLoadingProjections(false);
      }
    }

    fetchProjections();
  }, [selectedZoneId]);

  // Render/Update Chart.js instance when projections update
  useEffect(() => {
    if (!chartRef.current || projections.length === 0) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    // Parse labels and values
    const labels = projections.map(item => {
      const date = new Date(item.target_time);
      return date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
    });
    const dataValues = projections.map(item => item.predicted_volume);
    const confidenceValues = projections.map(item => item.confidence_score);

    const ctx = chartRef.current.getContext('2d');
    chartInstanceRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Estimasi Volume Sampah (m³)',
            data: dataValues,
            borderColor: '#10b981', // Emerald 500
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            fill: true,
            tension: 0.35,
            borderWidth: 3,
            pointBackgroundColor: '#10b981',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            padding: 12,
            backgroundColor: 'rgba(15, 23, 42, 0.9)', // Slate 900
            titleFont: { size: 12, weight: 'bold' },
            bodyFont: { size: 12 },
            callbacks: {
              label: function (context) {
                const confidence = confidenceValues[context.dataIndex] || 0;
                return [
                  ` Volume: ${context.parsed.y} m³`,
                  ` Akurasi AI: ${Math.round(confidence * 100)}%`
                ];
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: { size: 10 }
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(226, 232, 240, 0.6)' // Slate 200/60
            },
            ticks: {
              font: { size: 10 },
              callback: function(value) {
                return value + ' m³';
              }
            }
          }
        }
      }
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [projections]);

  const metrics = [
    {
      title: 'Laporan Warga Aktif',
      value: summary?.total_citizen_reports ?? '0',
      change: 'Menunggu konfirmasi admin',
      status: 'Aduan Baru',
      color: 'border-amber-400 bg-amber-50 text-amber-700'
    },
    {
      title: 'TPS Status Kritis',
      value: summary?.alert_zones_count ?? '0',
      change: `Total terdaftar ${zones.length} wilayah TPS`,
      status: 'Urgensi Tinggi',
      color: 'border-red-400 bg-red-50 text-red-700'
    },
    {
      title: 'Rata-rata Kapasitas TPS',
      value: `${Math.round(summary?.average_fill_percentage ?? 0)}%`,
      change: 'Akumulasi dari sensor IoT aktif',
      status: 'Real-time',
      color: 'border-emerald-400 bg-emerald-50 text-emerald-700'
    }
  ];

  const dateFilters = [
    { id: 'hariIni', label: 'Hari Ini' },
    { id: 'besok', label: 'Besok' },
    { id: '7hari', label: '7 Hari Ke Depan' }
  ];

  if (loadingSummary) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 text-slate-500">
        <FontAwesomeIcon icon={faSpinner} className="text-3xl animate-spin text-emerald-500 mb-3" />
        <p className="text-sm font-semibold">Memuat metrik dashboard utama...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50">
      {/* Top Header / Action Bar */}
      <header className="px-4 sm:px-8 py-4 sm:py-6 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
            Selamat Datang, {adminUser?.name || 'Admin'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Berikut ringkasan situasi darurat sampah kota hari ini.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Global Date Filter */}
          <div className="bg-slate-100 p-1 rounded-lg flex items-center gap-1 border border-slate-200 w-full sm:w-auto overflow-x-auto">
            {dateFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveDateFilter(filter.id)}
                className={`flex-1 sm:flex-initial text-center px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
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
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700 transition-colors shadow-sm cursor-pointer w-full sm:w-auto">
            <FontAwesomeIcon icon={faFileExport} />
            <span>Ekspor PDF</span>
          </button>
        </div>
      </header>

      {/* Main Grid Content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl">
            ⚠️ {errorMessage}
          </div>
        )}

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
          {/* AI Projections (Line Chart) */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-4 sm:p-6 flex flex-col justify-between shadow-sm min-h-[380px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
              <div>
                <h3 className="text-sm sm:text-md font-bold text-slate-800">Proyeksi Estimasi Volume Sampah (7 Hari Ke Depan)</h3>
                <p className="text-xs text-slate-500">Hasil prediksi algoritma AI Amadeus berdasarkan kalender event</p>
              </div>
              
              {/* Dropdown Pemilihan Wilayah TPS */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">Pilih TPS:</span>
                <select
                  value={selectedZoneId}
                  onChange={(e) => setSelectedZoneId(e.target.value)}
                  className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 cursor-pointer w-full sm:w-auto"
                >
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Line Chart Viewport */}
            <div className="flex-1 min-h-[220px] relative">
              {loadingProjections ? (
                <div className="absolute inset-0 bg-white/60 flex items-center justify-center text-slate-500 z-10">
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xl text-emerald-500 mr-2" />
                  <span className="text-xs font-medium">Memuat proyeksi AI...</span>
                </div>
              ) : null}

              {projections.length > 0 ? (
                <canvas ref={chartRef} />
              ) : (
                <div className="w-full h-full bg-slate-50 border border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center p-6 text-slate-400">
                  <FontAwesomeIcon icon={faCalendarDays} className="text-4xl mb-3 text-slate-300" />
                  <p className="text-xs font-semibold">Tidak Ada Proyeksi AI Tersedia</p>
                  <p className="text-[10px] mt-1 text-slate-500">
                    Gagal menemukan data proyeksi model AI untuk TPS terpilih.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Aktivitas Terbaru & Driver Response Tracker */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col shadow-sm">
            <h3 className="text-md font-bold text-slate-800 mb-4">Aktivitas &amp; Respons Driver</h3>
            <div className="flex-1 space-y-4 overflow-y-auto pr-1">
              {/* Driver 1 */}
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                  <FontAwesomeIcon icon={faCircleCheck} className="text-xs" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-slate-700">Driver Budi Utomo - Siap Bertugas</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Konfirmasi manifes rute TPS 01 berhasil ditugaskan ke driver.</p>
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
