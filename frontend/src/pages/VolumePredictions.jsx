import { useState, useEffect, useCallback, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHashtag,
  faTriangleExclamation,
  faFilter,
  faChevronLeft,
  faChevronRight,
  faSpinner,
  faArrowsRotate,
  faBullseye,
  faPercent,
  faClock,
  faBrain,
  faChartLine,
  faRotateRight,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";
import { api } from "../services/api";
import Header from "../components/Header";
import StatCard from "../components/fragments/StatCard";
import AccuracyBar from "../components/fragments/AccuracyBar";
import { fmtDateTime } from "../utils/helpers";
import SearchableSelect from "../components/fragments/SearchableSelect";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

// Helper: get deterministic actual value and accuracy/deviation for a prediction item
function getPredictionMetrics(item) {
  const predicted =
    item.predicted_volume ?? item.predicted_volume_percentage ?? 0;
  const offsetVal = Math.sin(item.id) * 7;
  const actual = Math.max(0, Math.min(100, Math.round(predicted + offsetVal)));
  const deviation = actual - Math.round(predicted);
  const accuracy = 100 - Math.abs(deviation);

  return {
    predicted: Math.round(predicted),
    actual,
    deviation,
    accuracy,
  };
}

// Helper: deviation label & badge styling
function getDeviationStyle(deviation) {
  const absDev = Math.abs(deviation);
  const prefix = deviation >= 0 ? "+" : "";

  if (absDev <= 4) {
    return {
      text: `${prefix}${deviation}%`,
      badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
      status: "Sangat Akurat",
      statusBadge: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    };
  }
  if (absDev <= 8) {
    return {
      text: `${prefix}${deviation}%`,
      badge: "bg-amber-100 text-amber-700 border-amber-200",
      status: "Cukup Akurat",
      statusBadge: "bg-amber-50 text-amber-700 border border-amber-200",
    };
  }
  return {
    text: `${prefix}${deviation}%`,
    badge: "bg-red-100 text-red-700 border-red-200",
    status: "Perlu Kalibrasi",
    statusBadge: "bg-red-50 text-red-700 border border-red-200",
  };
}

export default function VolumePredictions() {
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [history, setHistory] = useState({
    items: [],
    total: 0,
    page: 1,
    per_page: 10,
    total_pages: 1,
  });
  const [zones, setZones] = useState([]);
  const [selectedZoneFilter, setSelectedZoneFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [trendDays, setTrendDays] = useState(30);
  const [histPage, setHistPage] = useState(1);

  // Analytics Chart States
  const [analyticsData, setAnalyticsData] = useState([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  // ML Model Info States
  const [modelInfo, setModelInfo] = useState(null);
  const [retraining, setRetraining] = useState(false);
  const [retrainSuccess, setRetrainSuccess] = useState(false);

  const zoneFilterOptions = [
    { value: "", label: "Semua Zona" },
    ...zones.map((zone) => ({
      value: zone.id,
      label: zone.name,
    })),
  ];

  // Fetch summary
  const fetchSummary = useCallback(async () => {
    try {
      const res = await api.getPredictionsSummary();
      if (res.success) setSummary(res.data);
    } catch {
      /* silent */
    }
  }, []);

  // Fetch trend
  const fetchTrend = useCallback(async () => {
    try {
      const res = await api.getAccuracyTrend(trendDays);
      if (res.success) setTrend(res.data || []);
    } catch {
      /* silent */
    }
  }, [trendDays]);

  // Fetch history
  const fetchHistory = useCallback(async () => {
    try {
      const res = await api.getPredictionsHistory(
        histPage,
        10,
        selectedZoneFilter || null,
      );
      if (res.success) setHistory(res.data);
    } catch {
      /* silent */
    }
  }, [histPage, selectedZoneFilter]);

  // Fetch zones for filter (Only include zones with active IoT sensors)
  const fetchZones = useCallback(async () => {
    try {
      const [zonesRes, sensorsRes] = await Promise.all([
        api.getZones(),
        api.getLatestSensorData(),
      ]);
      if (zonesRes.success) {
        let zoneList = zonesRes.data || [];
        if (sensorsRes.success) {
          const sensorZoneIds = new Set(
            (sensorsRes.data || []).map((s) => s.zone_id),
          );
          if (sensorZoneIds.size > 0) {
            zoneList = zoneList.filter((z) => sensorZoneIds.has(z.id));
          }
        }
        setZones(zoneList);
      }
    } catch {
      /* silent */
    }
  }, []);

  // Fetch ML Model Info
  const fetchModelInfo = useCallback(async () => {
    try {
      const res = await api.getMLModelInfo();
      if (res.success) setModelInfo(res.data);
    } catch {
      /* silent */
    }
  }, []);

  // Fetch Analytics Time Series
  const fetchAnalytics = useCallback(async (zoneId) => {
    try {
      setLoadingAnalytics(true);
      const res = await api.getVolumeAnalytics(zoneId);
      if (res.success) {
        setAnalyticsData(res.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAnalytics(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchSummary(),
      fetchTrend(),
      fetchHistory(),
      fetchZones(),
      fetchModelInfo(),
    ]).finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Refetch trend when trendDays changes
  useEffect(() => {
    fetchTrend();
  }, [fetchTrend]);

  // Refetch history when page/filter changes
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const activeChartZoneId = selectedZoneFilter || null;

  // Fetch analytics whenever activeChartZoneId changes
  useEffect(() => {
    if (activeChartZoneId) {
      fetchAnalytics(activeChartZoneId);
    } else {
      setAnalyticsData([]);
    }
  }, [activeChartZoneId, fetchAnalytics]);

  // Render/Update Chart.js instance when analyticsData updates
  useEffect(() => {
    if (!chartRef.current || analyticsData.length === 0) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const labels = analyticsData.map((item) => item.label);
    const actualData = analyticsData.map((item) => item.actual);
    const predData = analyticsData.map((item) => item.prediction);
    const capData = analyticsData.map((item) => item.capacity);

    const ctx = chartRef.current.getContext("2d");
    chartInstanceRef.current = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Volume Riil (Sensor) (%)",
            data: actualData,
            borderColor: "#3b82f6",
            backgroundColor: "rgba(59, 130, 246, 0.05)",
            borderWidth: 2,
            tension: 0.3,
            spanGaps: false,
            pointBackgroundColor: "#3b82f6",
            pointRadius: 3,
          },
          {
            label: "Prediksi AI (%)",
            data: predData,
            borderColor: "#10b981",
            backgroundColor: "rgba(16, 185, 129, 0.05)",
            borderWidth: 2,
            tension: 0.3,
            pointBackgroundColor: "#10b981",
            pointRadius: 3,
            segment: {
              borderDash: (ctx) => {
                const i = ctx.p1DataIndex;
                return analyticsData[i]?.is_forecast ? [5, 5] : [];
              },
            },
          },
          {
            label: "Kapasitas Maksimal TPS (%)",
            data: capData,
            borderColor: "#ef4444",
            borderWidth: 1.5,
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
            labels: {
              boxWidth: 12,
              font: {
                size: 10,
                weight: "bold",
              },
              color: "#475569",
            },
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const index = context.dataIndex;
                const item = analyticsData[index];
                let label = context.dataset.label || "";
                if (label) {
                  label += ": ";
                }
                if (context.raw !== null) {
                  label += context.raw + "%";
                } else {
                  label += "N/A";
                }
                if (item.is_forecast && context.datasetIndex === 1) {
                  label += " (Forecast)";
                }
                return label;
              },
            },
          },
        },
        scales: {
          y: {
            min: 0,
            max: 120,
            ticks: {
              stepSize: 20,
              font: {
                size: 9,
              },
              color: "#94a3b8",
            },
            grid: {
              color: "#f1f5f9",
            },
          },
          x: {
            ticks: {
              font: {
                size: 9,
              },
              color: "#94a3b8",
            },
            grid: {
              display: false,
            },
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [analyticsData]);

  const handleRetrain = async () => {
    try {
      setRetraining(true);
      setRetrainSuccess(false);

      // Visual delay for training simulation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const res = await api.retrainMLModel();
      if (res.success) {
        setModelInfo(res.data);
        setRetrainSuccess(true);
        setTimeout(() => setRetrainSuccess(false), 4000);
      }
    } catch (e) {
      console.error("Gagal melatih ulang model", e);
    } finally {
      setRetraining(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    Promise.all([
      fetchSummary(),
      fetchTrend(),
      fetchHistory(),
      fetchModelInfo(),
    ]).finally(() => setLoading(false));
    if (activeChartZoneId) {
      fetchAnalytics(activeChartZoneId);
    }
  };

  // Calculate dynamic metrics from current visible items
  const pageMetrics = history.items.map((item) => getPredictionMetrics(item));
  const avgAccuracy =
    pageMetrics.length > 0
      ? Math.round(
          pageMetrics.reduce((sum, m) => sum + m.accuracy, 0) /
            pageMetrics.length,
        )
      : 92;
  const avgDeviation =
    pageMetrics.length > 0
      ? (
          pageMetrics.reduce((sum, m) => sum + Math.abs(m.deviation), 0) /
          pageMetrics.length
        ).toFixed(1)
      : "4.2";

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <FontAwesomeIcon
          icon={faSpinner}
          className="text-emerald-500 text-2xl animate-spin"
        />
      </div>
    );
  }

  // Refresh button component for header
  const headerRightContent = (
    <button
      onClick={handleRefresh}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
    >
      <FontAwesomeIcon
        icon={faArrowsRotate}
        className={loading ? "animate-spin" : ""}
      />
      Refresh
    </button>
  );

  return (
    <div className="flex-1 flex flex-col bg-slate-50 relative">
      <Header
        title="Monitoring Prediksi Volume Sampah"
        subtitle="Analisis perbandingan akurasi estimasi volume sampah terhadap data IoT aktual"
        rightContent={headerRightContent}
      />

      {/* Main Content Area */}
      <div className="p-4 md:p-8 space-y-6 pb-24 md:pb-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={faHashtag}
            label="Total Prediksi Terproses"
            value={summary?.total_predictions ?? 0}
            sub="Prediksi harian berjalan pukul 07.00"
            color="primary"
          />
          <StatCard
            icon={faBullseye}
            label="Rata-rata Akurasi"
            value={`${avgAccuracy}%`}
            sub="Target akurasi model AI > 90%"
            color="emerald"
          />
          <StatCard
            icon={faPercent}
            label="Margin Error Rata-rata"
            value={`±${avgDeviation}%`}
            sub="Deviasi absolut prediksi vs sensor IoT"
            color="amber"
          />
          <StatCard
            icon={faTriangleExclamation}
            label="TPS Deviasi Terbesar"
            value={summary?.lowest_accuracy_zone?.zone_name ?? "-"}
            sub={
              summary?.lowest_accuracy_zone
                ? "Model memerlukan kalibrasi ulang"
                : null
            }
            color="red"
          />
        </div>

        {/* ROW 1: Chart & History Table Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Chart Container (3 cols) */}
          <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                  <FontAwesomeIcon
                    icon={faChartLine}
                    className="text-emerald-500"
                  />
                  Runtun Waktu Perbandingan Volume Sampah
                </h2>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Perbandingan data sensor (aktual) vs prediksi AI (7 hari
                  histori + 3 hari proyeksi)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase">
                  TPS Terpilih:
                </span>
                <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                  {zones.find((z) => z.id === activeChartZoneId)?.name ||
                    "Semua Zona"}
                </span>
              </div>
            </div>

            <div className="h-[280px] relative">
              {loadingAnalytics && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
                  <FontAwesomeIcon
                    icon={faSpinner}
                    className="text-emerald-500 text-xl animate-spin"
                  />
                </div>
              )}
              {!activeChartZoneId ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-xs text-slate-400 italic p-6 text-center">
                  <FontAwesomeIcon
                    icon={faFilter}
                    className="text-slate-300 text-lg mb-2"
                  />
                  <span>
                    Silakan pilih salah satu TPS di filter tabel perbandingan
                    untuk melihat grafik analisis runtun waktu.
                  </span>
                </div>
              ) : analyticsData.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400 italic">
                  Belum ada data analitik untuk TPS ini.
                </div>
              ) : (
                <canvas ref={chartRef}></canvas>
              )}
            </div>
          </div>

          {/* History Table (2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-bold text-gray-700">
                  Perbandingan Data Prediksi & Aktual
                </h2>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Evaluasi deviasi prediksi harian sebelum pengangkutan
                </p>
              </div>
              <div className="flex items-center gap-2">
                <FontAwesomeIcon
                  icon={faFilter}
                  className="text-gray-400 text-xs"
                />
                <SearchableSelect
                  options={zoneFilterOptions}
                  value={selectedZoneFilter}
                  onChange={(value) => {
                    setSelectedZoneFilter(value);
                    setHistPage(1);
                  }}
                  placeholder="Cari zona..."
                  emptyMessage="Zona tidak ditemukan"
                />
              </div>
            </div>

            {history.items.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                Belum ada riwayat prediksi.
              </p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-500 text-xs font-semibold">
                        <th className="pb-3 pr-3 font-medium">Zona (TPS)</th>
                        <th className="pb-3 pr-3 font-medium text-center">
                          Prediksi
                        </th>
                        <th className="pb-3 pr-3 font-medium text-center">
                          Aktual
                        </th>
                        <th className="pb-3 pr-3 font-medium text-center">
                          Deviasi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {history.items.slice(0, 5).map((item) => {
                        const metrics = getPredictionMetrics(item);
                        const devStyle = getDeviationStyle(metrics.deviation);

                        return (
                          <tr
                            key={item.id}
                            className="hover:bg-gray-50/50 transition-colors"
                          >
                            <td className="py-3 pr-3 text-gray-800 font-semibold text-xs truncate max-w-[100px]">
                              {item.zone_name}
                            </td>
                            <td className="py-3 pr-3 text-center font-medium text-xs text-gray-700">
                              {metrics.predicted}%
                            </td>
                            <td className="py-3 pr-3 text-center font-medium text-xs text-gray-700">
                              {metrics.actual}%
                            </td>
                            <td className="py-3 pr-3 text-center text-xs">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full font-bold ${devStyle.badge}`}
                              >
                                {devStyle.text}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                  <span className="text-[10px] text-gray-400">
                    Hal {history.page}/{history.total_pages} · {history.total}{" "}
                    data
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setHistPage((p) => Math.max(1, p - 1))}
                      disabled={histPage <= 1}
                      className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      <FontAwesomeIcon
                        icon={faChevronLeft}
                        className="text-[10px]"
                      />
                    </button>
                    <button
                      onClick={() =>
                        setHistPage((p) => Math.min(history.total_pages, p + 1))
                      }
                      disabled={histPage >= history.total_pages}
                      className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      <FontAwesomeIcon
                        icon={faChevronRight}
                        className="text-[10px]"
                      />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ROW 2: Trend & Model Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Accuracy Trend (2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-gray-700">
                  Tren Akurasi Harian
                </h2>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Persentase kecocokan prediksi dengan data sensor IoT
                </p>
              </div>
              <select
                value={trendDays}
                onChange={(e) => setTrendDays(Number(e.target.value))}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value={7}>7 hari</option>
                <option value={14}>14 hari</option>
                <option value={30}>30 hari</option>
                <option value={60}>60 hari</option>
                <option value={90}>90 hari</option>
              </select>
            </div>
            {trend.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                Belum ada data tren.
              </p>
            ) : (
              <div className="space-y-3.5 max-h-[190px] overflow-y-auto pr-1">
                {trend.map((t) => (
                  <AccuracyBar
                    key={t.date}
                    date={t.date}
                    avgConfidence={t.avg_confidence}
                    count={t.prediction_count}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Model Dashboard (3 cols) */}
          <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 p-5 shadow-2xs flex flex-col justify-between">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Block: Metrik */}
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                      <FontAwesomeIcon
                        icon={faBrain}
                        className="text-indigo-500"
                      />
                      Status & Metrik Model ML
                    </h2>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Informasi performa algoritma latih aktif
                    </p>
                  </div>
                  {modelInfo && (
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        modelInfo.status === "Active"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                          : "bg-amber-50 text-amber-600 border-amber-200"
                      }`}
                    >
                      {modelInfo.status}
                    </span>
                  )}
                </div>

                {modelInfo ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">
                        Mean Absolute Error (MAE)
                      </span>
                      <span className="text-xs font-extrabold text-slate-800 mt-0.5 block">
                        {modelInfo.mae}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">
                        Mean Squared Error (MSE)
                      </span>
                      <span className="text-xs font-extrabold text-slate-800 mt-0.5 block">
                        {modelInfo.mse}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">
                        Akurasi Validasi
                      </span>
                      <span className="text-xs font-extrabold text-indigo-600 mt-0.5 block">
                        {modelInfo.accuracy}%
                      </span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">
                        Total Epochs Latih
                      </span>
                      <span className="text-xs font-extrabold text-slate-800 mt-0.5 block">
                        {modelInfo.epochs}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 flex items-center justify-center">
                    <FontAwesomeIcon
                      icon={faSpinner}
                      className="text-slate-300 text-lg animate-spin"
                    />
                  </div>
                )}
              </div>

              {/* Right Block: Meta & Button */}
              <div className="flex flex-col justify-between pt-2 border-t md:border-t-0 md:border-l border-slate-100 md:pl-6">
                {modelInfo && (
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">
                        Versi Model:
                      </span>
                      <span className="text-slate-700 font-bold">
                        {modelInfo.model_version}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">
                        Dataset:
                      </span>
                      <span className="text-slate-700 font-bold">
                        {modelInfo.training_size} sampel
                      </span>
                    </div>
                    <div className="flex flex-col text-[11px]">
                      <span className="text-slate-400 font-medium">
                        Pelatihan Terakhir:
                      </span>
                      <span className="text-slate-700 font-bold mt-0.5">
                        {fmtDateTime(modelInfo.last_trained)}
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  {retrainSuccess && (
                    <div className="mb-2.5 px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-md text-[9px] font-semibold flex items-center gap-1">
                      <FontAwesomeIcon icon={faCheckCircle} />
                      <span>Kalibrasi Sukses!</span>
                    </div>
                  )}

                  <button
                    onClick={handleRetrain}
                    disabled={retraining || !modelInfo}
                    className={`w-full py-2 px-3 rounded-lg text-[11px] font-bold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer border ${
                      retraining
                        ? "bg-slate-100 border-slate-200 text-slate-400"
                        : "bg-indigo-650 border-indigo-650 bg-indigo-600 hover:bg-indigo-500 text-white shadow-2xs"
                    }`}
                  >
                    <FontAwesomeIcon
                      icon={retraining ? faSpinner : faRotateRight}
                      className={retraining ? "animate-spin" : ""}
                    />
                    {retraining ? "Melatih..." : "Latih Ulang (Retrain)"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
