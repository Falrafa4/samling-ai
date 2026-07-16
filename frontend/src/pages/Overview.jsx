import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useLocalStorage } from "react-use";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTriangleExclamation,
  faCircleCheck,
  faCalendarDays,
  faSpinner,
  faMapMarkerAlt,
  faRoute,
  faBrain,
  faTruck,
  faClock,
  faChartLine,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import { api } from "../services/api";
import Header from "../components/Header";
import { Chart, registerables } from "chart.js";
import SearchableSelect from "../components/fragments/SearchableSelect";

Chart.register(...registerables);

export default function Overview() {
  const navigate = useNavigate();
  const [adminUser] = useLocalStorage("admin_user", null);
  const [activeDateFilter, setActiveDateFilter] = useState("hariIni");

  // API States
  const [summary, setSummary] = useState(null);
  const [predictionSummary, setPredictionSummary] = useState(null);
  const [zones, setZones] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [latestRoutes, setLatestRoutes] = useState([]);
  const [selectedZoneId, setSelectedZoneId] = useState("");
  const [projections, setProjections] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingProjections, setLoadingProjections] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const zoneOptions = zones.map((zone) => ({
    value: zone.id,
    label: zone.name,
  }));

  // Chart Refs
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  // Fetch dashboard data on mount
  useEffect(() => {
    async function initData() {
      try {
        setLoadingSummary(true);
        setErrorMessage("");

        const [
          summaryResult,
          zonesResult,
          predictionSummaryResult,
          routesResult,
          driversResult,
          sensorDataResult,
        ] = await Promise.allSettled([
          api.getDashboardSummary(),
          api.getZones(),
          api.getPredictionsSummary(),
          api.getLatestRouteRecommendation(),
          api.getDrivers(),
          api.getLatestSensorData(),
        ]);

        if (
          summaryResult.status === "fulfilled" &&
          summaryResult.value.success
        ) {
          setSummary(summaryResult.value.data);
        }

        let sensorZoneIds = new Set();
        if (
          sensorDataResult.status === "fulfilled" &&
          sensorDataResult.value.success
        ) {
          const sensorRecords = sensorDataResult.value.data || [];
          sensorRecords.forEach((record) => {
            if (record.zone_id) {
              sensorZoneIds.add(record.zone_id);
            }
          });
        }

        if (zonesResult.status === "fulfilled" && zonesResult.value.success) {
          const zoneList = zonesResult.value.data || [];
          // Filter zones that have IoT sensors
          const filteredZones = sensorZoneIds.size > 0 
            ? zoneList.filter((zone) => sensorZoneIds.has(zone.id))
            : zoneList;

          setZones(filteredZones);
          if (filteredZones.length > 0) {
            setSelectedZoneId(filteredZones[0].id);
          }
        }

        if (
          predictionSummaryResult.status === "fulfilled" &&
          predictionSummaryResult.value.success
        ) {
          setPredictionSummary(predictionSummaryResult.value.data);
        }

        if (routesResult.status === "fulfilled" && routesResult.value.success) {
          setLatestRoutes(routesResult.value.data || []);
        } else {
          // Endpoint route terbaru mengembalikan 404 saat belum ada batch rute.
          // Kondisi ini valid untuk dashboard dan ditampilkan sebagai empty state.
          setLatestRoutes([]);
        }

        if (
          driversResult.status === "fulfilled" &&
          driversResult.value.success
        ) {
          setDrivers(driversResult.value.data || []);
        }
      } catch (err) {
        setErrorMessage(
          err.message || "Gagal memuat data ringkasan dashboard.",
        );
      } finally {
        setLoadingSummary(false);
      }
    }

    initData();
  }, []);

  // Fetch projections whenever selectedZoneId changes
  useEffect(() => {
    if (!selectedZoneId) {
      setProjections([]);
      return;
    }

    async function fetchProjections() {
      try {
        setLoadingProjections(true);
        const res = await api.getZoneProjections(selectedZoneId);
        if (res.success) {
          setProjections(res.data || []);
        }
      } catch (err) {
        console.error("Gagal memuat prediksi AI:", err);
        setProjections([]);
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

    const labels = projections.map((item) => {
      const date = new Date(item.target_time || item.created_at);
      return date.toLocaleDateString("id-ID", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
    });
    const dataValues = projections.map(
      (item) => item.predicted_volume ?? item.predicted_volume_percentage ?? 0,
    );
    const confidenceValues = projections.map(
      (item) => item.confidence_score ?? 0,
    );

    const ctx = chartRef.current.getContext("2d");
    chartInstanceRef.current = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Prediksi Kepenuhan TPS (%)",
            data: dataValues,
            borderColor: "#10b981",
            backgroundColor: "rgba(16, 185, 129, 0.08)",
            fill: true,
            tension: 0.35,
            borderWidth: 3,
            pointBackgroundColor: "#10b981",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            padding: 12,
            backgroundColor: "rgba(15, 23, 42, 0.9)",
            titleFont: { size: 12, weight: "bold" },
            bodyFont: { size: 12 },
            callbacks: {
              label: function (context) {
                const confidence = confidenceValues[context.dataIndex] || 0;
                return [
                  ` Kepenuhan: ${Math.round(context.parsed.y)}%`,
                  ` Confidence AI: ${Math.round(confidence * 100)}%`,
                ];
              },
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              font: { size: 10 },
            },
          },
          y: {
            beginAtZero: true,
            suggestedMax: 100,
            grid: {
              color: "rgba(226, 232, 240, 0.6)",
            },
            ticks: {
              font: { size: 10 },
              callback: function (value) {
                return value + "%";
              },
            },
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [projections]);

  const routeStats = latestRoutes.reduce(
    (acc, route) => {
      acc.total += 1;
      acc.totalStops += route.total_stops || 0;
      if (route.status === "Pending") acc.pending += 1;
      if (route.status === "In Progress") acc.inProgress += 1;
      if (route.status === "Completed") acc.completed += 1;
      return acc;
    },
    { total: 0, totalStops: 0, pending: 0, inProgress: 0, completed: 0 },
  );

  const driverStats = drivers.reduce(
    (acc, driver) => {
      acc.total += 1;
      if (driver.status === "Available") acc.available += 1;
      if (driver.status === "On Duty") acc.onDuty += 1;
      if (driver.status === "Offline") acc.offline += 1;
      return acc;
    },
    { total: 0, available: 0, onDuty: 0, offline: 0 },
  );

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const predictionTime = 7 * 60;
  const routeGenerationTime = 7 * 60 + 30;

  const getOperationalInsight = () => {
    const criticalZones = summary?.alert_zones_count ?? 0;

    if (currentMinutes < predictionTime) {
      return {
        title: "Menunggu Prediksi Volume Harian Pukul 07.00",
        description:
          "AI akan membaca data historis, sensor IoT, pola wilayah, cuaca, dan event untuk menentukan prioritas TPS hari ini.",
        status: "Pra-prediksi",
        icon: faClock,
        classes:
          "from-slate-50 to-slate-100/70 border-slate-200 text-slate-700 bg-slate-100",
      };
    }

    if (currentMinutes < routeGenerationTime) {
      return {
        title: "Prediksi Volume Hari Ini Telah Masuk Fase Operasional",
        description:
          "Hasil prediksi pukul 07.00 menjadi dasar scheduler untuk membuat route recommendation pukul 07.30.",
        status: "Menunggu Rute 07.30",
        icon: faBrain,
        classes:
          "from-amber-50 to-amber-100/60 border-amber-200 text-amber-800 bg-amber-100",
      };
    }

    if (routeStats.total > 0) {
      return {
        title: `${routeStats.total} Rute Rekomendasi Hari Ini Siap Ditindaklanjuti`,
        description: `${routeStats.totalStops} TPS prioritas telah masuk rute hasil prediksi volume. ${routeStats.pending} pending, ${routeStats.inProgress} sedang berjalan, ${routeStats.completed} selesai.`,
        status:
          routeStats.inProgress > 0
            ? "Driver Bergerak"
            : routeStats.pending > 0
              ? "Siap Dispatch"
              : "Terkendali",
        icon: faRoute,
        classes:
          routeStats.pending > 0
            ? "from-amber-50 to-amber-100/60 border-amber-200 text-amber-800 bg-amber-100"
            : "from-emerald-50 to-emerald-100/60 border-emerald-200 text-emerald-800 bg-emerald-100",
      };
    }

    return {
      title:
        criticalZones > 0
          ? "TPS Prioritas Terdeteksi, Rute Belum Digenerate"
          : "Menunggu Route Recommendation Hari Ini",
      description:
        criticalZones > 0
          ? `${criticalZones} TPS masuk status warning/kritis. Jalankan scheduler AI untuk mengubah prediksi volume menjadi rute pengangkutan.`
          : "Prediksi volume tersedia sebagai dasar pengambilan keputusan. Route recommendation dijadwalkan pukul 07.30 atau dapat dijalankan manual di Fleet Dispatch.",
      status: criticalZones > 0 ? "Perlu Aksi" : "Standby",
      icon: criticalZones > 0 ? faTriangleExclamation : faClock,
      classes:
        criticalZones > 0
          ? "from-red-50 to-red-100/60 border-red-200 text-red-800 bg-red-100"
          : "from-slate-50 to-slate-100/70 border-slate-200 text-slate-700 bg-slate-100",
    };
  };

  const operationalInsight = getOperationalInsight();

  const workflowSteps = [
    {
      time: "07.00",
      title: "Prediksi Volume",
      description:
        "AI menghitung kepenuhan TPS hari ini dari historis, sensor, cuaca, dan pola wilayah.",
      icon: faBrain,
      metric: `${predictionSummary?.total_predictions ?? 0} total prediksi`,
      status: `${Math.round((predictionSummary?.avg_confidence_score ?? 0) * 100)}% confidence`,
      color: "blue",
    },
    {
      time: "07.30",
      title: "Generate Rute",
      description:
        "Scheduler mengubah TPS prioritas menjadi urutan rute pengangkutan optimal.",
      icon: faRoute,
      metric: `${routeStats.total} rute aktif`,
      status: `${routeStats.totalStops} TPS stop`,
      color: "emerald",
    },
    {
      time: "Setelah 07.30",
      title: "Dispatch Driver",
      description:
        "Admin meninjau rute dan mengirim manifes tugas ke driver yang tersedia.",
      icon: faTruck,
      metric: `${driverStats.available} driver siap`,
      status: `${driverStats.onDuty} on duty`,
      color: "amber",
    },
  ];

  const dateFilters = [
    { id: "hariIni", label: "Hari Ini" },
    { id: "besok", label: "Besok" },
  ];

  const getRouteStatusClasses = (status) => {
    switch (status) {
      case "Completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "In Progress":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  if (loadingSummary) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 text-slate-500">
        <FontAwesomeIcon
          icon={faSpinner}
          className="text-3xl animate-spin text-emerald-500 mb-3"
        />
        <p className="text-sm font-semibold">
          Memuat command center prediksi harian...
        </p>
      </div>
    );
  }

  // Dynamic Weather & Event Alert Banner
  const alertBanner = (() => {
    const hasCritical = (summary?.tps_predicted_critical_90_count ?? 0) > 0;
    const hasWarning = (summary?.tps_predicted_warning_critical_count ?? 0) > 0;
    
    if (hasCritical) {
      return {
        title: "⚠️ Peringatan Kota: Alokasi Rute Kritis Diperlukan",
        message: `Terdeteksi ${summary.tps_predicted_critical_90_count} TPS kritis dengan volume sampah ≥ 90% hari ini. Pengaruh cuaca hujan dan potensi pembusukan cepat terdeteksi.`,
        classes: "from-red-50 to-red-100/60 border-red-200 text-red-800 bg-red-100",
        icon: faTriangleExclamation
      };
    } else if (hasWarning) {
      return {
        title: "⚠️ Waspada Operasional: Peningkatan Volume Sampah Terdeteksi",
        message: `Terdapat ${summary.tps_predicted_warning_critical_count} TPS dalam status waspada (Warning) hari ini. Harap persiapkan driver cadangan untuk antisipasi penjemputan.`,
        classes: "from-amber-50 to-amber-100/60 border-amber-200 text-amber-800 bg-amber-100",
        icon: faTriangleExclamation
      };
    }
    return {
      title: "🌤️ Status Kota: Kondisi Operasional Terkendali",
      message: "Tidak ada indikasi penumpukan sampah kritis atau cuaca buruk hari ini. Rute armada berjalan sesuai jadwal.",
      classes: "from-emerald-50 to-emerald-100/60 border-emerald-200 text-emerald-855 bg-emerald-50",
      icon: faCircleCheck
    };
  })();

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
      <div className="flex-1 overflow-y-auto">
        <Header
          title={`Selamat Datang, ${adminUser?.name || "Admin"}`}
          subtitle="Pantau prediksi volume TPS pukul 07.00 dan kesiapan route recommendation pukul 07.30."
          rightContent={
            <div className="bg-slate-100 p-1 rounded-lg hidden md:flex items-center gap-1 border border-slate-200 w-full sm:w-auto overflow-x-auto">
              {dateFilters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setActiveDateFilter(filter.id)}
                  className={`flex-1 sm:flex-initial text-center px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                    activeDateFilter === filter.id
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          }
        />

        <div className="sticky top-0 z-20 md:hidden flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 w-full sm:w-auto overflow-x-auto">
          {dateFilters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveDateFilter(filter.id)}
              className={`flex-1 sm:flex-initial text-center px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                activeDateFilter === filter.id
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="px-4 sm:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl">
              <FontAwesomeIcon
                icon={faTriangleExclamation}
                className="mr-1.5"
              />{" "}
              {errorMessage}
            </div>
          )}

          {/* Contextual Alert Banner */}
          <div
            className={`p-4 bg-gradient-to-r ${alertBanner.classes} border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/70 flex items-center justify-center shrink-0">
                <FontAwesomeIcon
                  icon={alertBanner.icon}
                  className="text-lg"
                />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800 leading-snug">
                  {alertBanner.title}
                </h4>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  {alertBanner.message}
                </p>
              </div>
            </div>
            <span className="text-xs font-bold bg-white/70 px-3 py-1 rounded-full border border-white/80 self-start sm:self-center whitespace-nowrap">
              {(summary?.tps_predicted_critical_90_count ?? 0) > 0 ? "Tindakan Cepat" : "Normal"}
            </span>
          </div>

          {/* Dynamic Operational Insight */}
          <div
            className={`p-4 bg-gradient-to-r ${operationalInsight.classes} border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/70 flex items-center justify-center shrink-0">
                <FontAwesomeIcon
                  icon={operationalInsight.icon}
                  className="text-lg"
                />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800 leading-snug">
                  {operationalInsight.title}
                </h4>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  {operationalInsight.description}
                </p>
              </div>
            </div>
            <span className="text-xs font-bold bg-white/70 px-3 py-1 rounded-full border border-white/80 self-start sm:self-center whitespace-nowrap">
              {operationalInsight.status}
            </span>
          </div>

          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
            {/* Card 1: TPS Diprediksi */}
            <div
              className="p-5 bg-white border border-slate-200 rounded-xl hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
              onClick={() => navigate("/admin/predictions")}
            >
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  TPS Diprediksi
                </p>
                <h3 className="text-3xl font-extrabold text-slate-800">
                  {summary?.tps_predicted_warning_critical_count ?? 0}
                </h3>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-slate-500">Target penjemputan hari ini</span>
                  <span className="px-2 py-0.5 rounded font-bold uppercase text-[9px] border bg-blue-50 border-blue-400 text-blue-700 whitespace-nowrap">
                    AI Forecast
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/admin/predictions");
                  }}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  Lihat Prediksi <span>→</span>
                </button>
              </div>
            </div>

            {/* Card 2: Total TPS Critical */}
            <div
              className="p-5 bg-white border border-slate-200 rounded-xl hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
              onClick={() => navigate("/admin/map")}
            >
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Total TPS Critical
                </p>
                <div className="flex items-center">
                  <h3 className="text-3xl font-extrabold text-slate-800">
                    {summary?.tps_predicted_critical_90_count ?? 0}
                  </h3>
                  {(summary?.tps_predicted_critical_90_count ?? 0) > 0 && (
                    <span className="flex h-3 w-3 relative ml-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-slate-500">Butuh dispatch armada segera</span>
                  <span className="px-2 py-0.5 rounded font-bold uppercase text-[9px] border bg-red-50 border-red-400 text-red-700 whitespace-nowrap">
                    Critical
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/admin/map");
                  }}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  Lihat Peta <span>→</span>
                </button>
              </div>
            </div>

            {/* Card 3 & 4: Top 10 TPS Perlu Diambil */}
            <div className="p-5 bg-white border border-slate-200 rounded-xl xl:col-span-2 flex flex-col justify-between shadow-sm min-h-[160px]">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Top 10 TPS Perlu Diambil Hari Ini
                </p>
                <div className="overflow-x-auto max-h-[110px] overflow-y-auto pr-1">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold">
                        <th className="py-1">Nama TPS</th>
                        <th className="py-1">Kecamatan</th>
                        <th className="py-1 text-right">Prediksi (%)</th>
                        <th className="py-1 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-slate-700">
                      {summary?.top_10_critical_predictions?.length > 0 ? (
                        summary.top_10_critical_predictions.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="py-1 text-slate-800 font-medium truncate max-w-[120px]">{item.tps_name}</td>
                            <td className="py-1 text-slate-500 truncate max-w-[90px]">{item.kecamatan}</td>
                            <td className="py-1 text-right font-bold text-slate-800">{Math.round(item.predicted_volume_percentage)}%</td>
                            <td className="py-1 text-center">
                              <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold ${
                                item.prediction_status === 'CRITICAL' 
                                  ? 'bg-red-50 text-red-700 border border-red-200' 
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                                {item.prediction_status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-center py-4 text-slate-400 text-[10px]">
                            Tidak ada TPS kritis terdeteksi untuk hari ini.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Primary Split: Grafik Prediksi & Alur Operasional */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Sisi Kiri (8 Kolom): AI Prediction Chart */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-4 sm:p-6 flex flex-col justify-between shadow-sm min-h-[380px]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
                <div>
                  <h3 className="text-sm sm:text-md font-bold text-slate-800 uppercase tracking-tight">
                    PREDIKSI KEPENUHAN TPS & RUTE REKOMENDASI HARI INI
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Prediksi pukul 07.00 berbasis historis, sensor IoT, cuaca,
                    event, dan pola wilayah. Grafik menampilkan riwayat prediksi
                    terakhir untuk TPS terpilih.
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">
                    Pilih TPS:
                  </span>
                  <SearchableSelect
                    options={zoneOptions}
                    value={selectedZoneId}
                    onChange={(value) => setSelectedZoneId(value)}
                    placeholder="Pilih Wilayah TPS"
                    icon={faMapMarkerAlt}
                    emptyMessage="Tidak ada wilayah ditemukan"
                  />
                </div>
              </div>

              <div className="flex-1 min-h-[220px] relative">
                {loadingProjections ? (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center text-slate-500 z-10">
                    <FontAwesomeIcon
                      icon={faSpinner}
                      className="animate-spin text-xl text-emerald-500 mr-2"
                    />
                    <span className="text-xs font-medium">
                      Memuat prediksi AI...
                    </span>
                  </div>
                ) : null}

                {projections.length > 0 ? (
                  <canvas ref={chartRef} />
                ) : (
                  <div className="w-full h-full bg-slate-50 border border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center p-6 text-slate-400">
                    <FontAwesomeIcon
                      icon={faCalendarDays}
                      className="text-4xl mb-3 text-slate-300"
                    />
                    <p className="text-xs font-semibold">
                      Belum Ada Prediksi untuk TPS Ini
                    </p>
                    <p className="text-[10px] mt-2 text-slate-500 text-center">
                      Prediksi harian dijalankan pukul 07.00. Pastikan sensor
                      IoT dan data historis TPS tersedia.
                    </p>
                  </div>
                )}
              </div>

              {projections.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>{" "}
                    Prediksi Kepenuhan TPS (%)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-slate-400 rounded-full"></span>{" "}
                    Confidence Prediksi AI
                  </span>
                </div>
              )}
            </div>

            {/* Sisi Kanan (4 Kolom): Alur Operasional Harian */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 sm:p-6 flex flex-col justify-between shadow-sm min-h-[380px]">
              <div>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <h3 className="text-sm font-bold text-slate-800">
                    Alur Operasional Harian
                  </h3>
                  <button
                    onClick={() => navigate("/admin/fleet")}
                    className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    Kelola Rute
                    <FontAwesomeIcon icon={faArrowRight} className="text-[8px]" />
                  </button>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  Siklus pagi untuk mengubah prediksi volume sampah menjadi aksi pengangkutan TPS prioritas.
                </p>
                <div className="space-y-4">
                  {workflowSteps.map((step) => (
                    <div
                      key={step.title}
                      className="p-3 bg-slate-50 border border-slate-100 rounded-lg"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border text-xs ${
                            step.color === "blue"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : step.color === "emerald"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          <FontAwesomeIcon icon={step.icon} />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                            {step.time}
                          </span>
                          <h4 className="text-xs font-bold text-slate-800 mt-0.5">
                            {step.title}
                          </h4>
                          <p className="text-[9px] text-slate-500 mt-0.5 leading-relaxed truncate">
                            {step.description}
                          </p>
                          <div className="mt-2 flex gap-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[8px] font-bold text-slate-700">
                              {step.metric}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[8px] font-bold text-slate-500">
                              {step.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Layout Section: Rute Hari Ini & Driver Siap */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Rute Hari Ini (8 Kolom) */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-4 sm:p-6 flex flex-col shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">RUTE HARI INI</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Dibuat pukul 07.30 dari hasil prediksi volume TPS.
                  </p>
                </div>
                <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <FontAwesomeIcon icon={faRoute} />
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto pr-1 max-h-[320px]">
                {latestRoutes.length > 0 ? (
                  latestRoutes.slice(0, 5).map((route) => (
                    <div
                      key={route.id}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-700">
                            Rute #{route.id} ·{" "}
                            {route.coverage_area || "Semua Wilayah"}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {route.total_stops || 0} TPS stop • Driver:{" "}
                            <span className="font-semibold text-slate-700">
                              {route.driver?.name || "Belum ditugaskan"}
                            </span>
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase border whitespace-nowrap ${getRouteStatusClasses(
                            route.status,
                          )}`}
                        >
                          {route.status}
                        </span>
                      </div>
                      <button
                        onClick={() => navigate("/admin/fleet")}
                        className="mt-3 text-[10px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                      >
                        Kelola Rute
                        <FontAwesomeIcon
                          icon={faArrowRight}
                          className="text-[9px]"
                        />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="h-full min-h-[220px] bg-slate-50 border border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-3">
                      <FontAwesomeIcon icon={faClock} />
                    </div>
                    <p className="text-xs font-bold text-slate-700">
                      Belum Ada Rute Rekomendasi
                    </p>
                    <p className="text-[10px] mt-2 text-slate-500 leading-relaxed">
                      Scheduler route recommendation dijadwalkan pukul 07.30
                      setelah prediksi volume pukul 07.00 selesai.
                    </p>
                    <button
                      onClick={() => navigate("/admin/fleet")}
                      className="mt-4 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                    >
                      Buka Fleet Dispatch
                    </button>
                  </div>
                )}
              </div>

              {latestRoutes.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-extrabold text-amber-600">
                      {routeStats.pending}
                    </p>
                    <p className="text-[9px] font-semibold text-slate-400 uppercase">
                      Pending
                    </p>
                  </div>
                  <div>
                    <p className="text-lg font-extrabold text-blue-600">
                      {routeStats.inProgress}
                    </p>
                    <p className="text-[9px] font-semibold text-slate-400 uppercase">
                      Berjalan
                    </p>
                  </div>
                  <div>
                    <p className="text-lg font-extrabold text-emerald-600">
                      {routeStats.completed}
                    </p>
                    <p className="text-[9px] font-semibold text-slate-400 uppercase">
                      Selesai
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Driver Siap (Online) (4 Kolom) */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 sm:p-6 flex flex-col shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">DRIVER SIAP (ONLINE)</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Supir armada yang saat ini online dan siap menerima dispatch tugas.
                  </p>
                </div>
                <div className="w-9 h-9 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                  <FontAwesomeIcon icon={faTruck} />
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto pr-1 max-h-[320px]">
                {drivers.filter((d) => d.status === "Available").length > 0 ? (
                  drivers
                    .filter((d) => d.status === "Available")
                    .map((driver) => (
                      <div
                        key={driver.id}
                        className="p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-amber-200 hover:bg-amber-50/30 transition-colors flex items-center justify-between"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-700 truncate">{driver.name}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                            {driver.phone || "-"}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap animate-pulse">
                          Ready
                        </span>
                      </div>
                    ))
                ) : (
                  <div className="h-full min-h-[220px] bg-slate-50 border border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center p-6 text-center text-slate-400">
                    <FontAwesomeIcon
                      icon={faTriangleExclamation}
                      className="text-3xl mb-2 text-slate-300"
                    />
                    <p className="text-xs font-bold text-slate-700">Tidak ada Driver Siap</p>
                    <p className="text-[10px] mt-2 text-slate-500">
                      Semua driver sedang bertugas atau offline.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Small supporting signal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <FontAwesomeIcon icon={faChartLine} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  Rata-rata Kepenuhan TPS:{" "}
                  {Math.round(summary?.average_fill_percentage ?? 0)}%
                </p>
                <p className="text-[10px] text-slate-500">
                  Data sensor terbaru digunakan sebagai konteks prediksi harian.
                </p>
              </div>
            </div>
            <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <FontAwesomeIcon icon={faCircleCheck} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  {summary?.total_citizen_reports ?? 0} laporan warga tercatat
                </p>
                <p className="text-[10px] text-slate-500">
                  Laporan warga menjadi sinyal tambahan untuk validasi prioritas
                  wilayah.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}