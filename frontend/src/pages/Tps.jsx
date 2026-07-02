import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faSearch,
  faTrashCan,
  faRecycle,
  faArrowTrendUp,
  faScaleBalanced,
  faUsers,
  faTemperatureHalf,
  faWind,
  faChartLine,
  faXmark,
  faTruck,
  faLeaf,
} from "@fortawesome/free-solid-svg-icons";
import Chart from "chart.js/auto";

import BottomNav from "../components/BottomNav";
import Header from "../components/Header";
import CircularProgress from "../components/CircularProgress";
import { defaultTps } from "../utils/mockData";

export default function Tps() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get("q") || "";

  // Page States
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCity, setSelectedCity] = useState("all");
  const [tpsList, setTpsList] = useState([]);

  // Modal Detail States
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTps, setSelectedTps] = useState(null);

  const trendChartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    // Auth Check
    const username = localStorage.getItem("username");
    if (!username) {
      navigate("/login");
      return;
    }

    setTpsList(defaultTps);
  }, [navigate]);

  // Filter List
  const filteredTps = tpsList.filter((tps) => {
    const matchesCity = selectedCity === "all" || tps.city === selectedCity;
    const matchesSearch = tps.nama
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesCity && matchesSearch;
  });

  const handleOpenDetail = (tps) => {
    setSelectedTps(tps);
    setShowDetailModal(true);
  };

  const handlePilihTps = (id) => {
    navigate(`/cari-truk?tpsId=${id}`);
  };

  // Render Line Chart in Modal
  useEffect(() => {
    if (!showDetailModal || !selectedTps || !trendChartRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = trendChartRef.current.getContext("2d");
    chartInstanceRef.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"],
        datasets: [
          {
            label: "Kapasitas (%)",
            data: selectedTps.trend,
            borderColor: "#22c55e",
            backgroundColor: "rgba(34, 197, 94, 0.1)",
            borderWidth: 2.5,
            tension: 0.4,
            fill: true,
            pointBackgroundColor: "#ffffff",
            pointBorderColor: "#22c55e",
            pointRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            grid: {
              color: "rgba(0,0,0,0.05)",
              borderDash: [5, 5],
            },
          },
          x: {
            grid: { display: false },
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
  }, [showDetailModal, selectedTps]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col text-gray-900 dark:text-gray-100 pb-24 transition-colors duration-200">
      {/* Header */}
      <Header
        title="Pantau TPS"
        subtitle="Pantau daftar TPS yang tersedia"
        showBack={true}
        onBack={() => navigate("/dashboard")}
      />

      <main className="flex-1 px-4 md:px-8 py-6 max-w-5xl mx-auto w-full">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative grow">
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari lokasi TPS..."
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-green-500 shadow-xs transition text-gray-900 dark:text-white"
            />
          </div>
          <div className="md:w-1/4">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-green-500 shadow-xs appearance-none cursor-pointer text-gray-800 dark:text-white transition-colors"
            >
              <option value="all">Semua Wilayah</option>
              <option value="Surabaya">Surabaya</option>
              <option value="Malang">Malang</option>
              <option value="Kediri">Kediri</option>
              <option value="Blitar">Blitar</option>
            </select>
          </div>
        </div>

        {/* TPS List Area */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-150 dark:border-slate-750 overflow-hidden min-h-[450px] transition-colors">
          {filteredTps.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-80 text-center">
              <div className="w-16 h-16 bg-gray-50 dark:bg-slate-750 rounded-full flex items-center justify-center mb-3">
                <FontAwesomeIcon
                  icon={faSearch}
                  className="text-gray-300 dark:text-slate-600 text-xl"
                />
              </div>
              <p className="text-gray-500 dark:text-gray-400">
                Data TPS tidak ditemukan.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-slate-750">
              {filteredTps.map((tps) => {
                const isFull = tps.status === "Penuh";
                let statusColorClass, statusBgClass, capacityBarColor;

                if (tps.kapasitas >= 90) {
                  statusColorClass = "text-red-650 dark:text-red-400";
                  statusBgClass =
                    "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30";
                  capacityBarColor = "bg-gradient-to-r from-red-400 to-red-650";
                } else if (tps.kapasitas >= 70) {
                  statusColorClass = "text-yellow-750 dark:text-yellow-400";
                  statusBgClass =
                    "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-250 dark:border-yellow-900/30";
                  capacityBarColor =
                    "bg-gradient-to-r from-yellow-400 to-yellow-500";
                } else {
                  statusColorClass = "text-green-650 dark:text-emerald-400";
                  statusBgClass =
                    "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/30";
                  capacityBarColor =
                    "bg-gradient-to-r from-green-400 to-green-600";
                }

                return (
                  <div
                    key={tps.id}
                    className="p-6 hover:bg-green-50/20 dark:hover:bg-slate-700/20 transition-colors group"
                  >
                    <div className="flex flex-col md:flex-row gap-5">
                      {/* Icon */}
                      <div className="hidden md:block pt-1 shrink-0">
                        <div className="w-11 h-11 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500 group-hover:bg-green-50 dark:group-hover:bg-green-950/30 group-hover:text-green-600 dark:group-hover:text-emerald-400 flex items-center justify-center transition-all">
                          <FontAwesomeIcon
                            icon={faTrashCan}
                            className="text-lg"
                          />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="grow w-full">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-md font-bold text-gray-800 dark:text-white group-hover:text-green-700 dark:group-hover:text-emerald-400 leading-snug">
                            {tps.nama}
                          </h3>
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${statusBgClass} ${statusColorClass}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${capacityBarColor.split(" ")[1]}`}
                            ></span>
                            {tps.status}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-gray-500 dark:text-gray-400 mb-4">
                          <span>
                            <FontAwesomeIcon
                              icon={faRecycle}
                              className="mr-1.5 text-gray-450"
                            />
                            {tps.jenis}
                          </span>
                          <span>
                            <FontAwesomeIcon
                              icon={faArrowTrendUp}
                              className="mr-1.5 text-gray-450"
                            />
                            Jarak: {tps.jarak} m
                          </span>
                          <span>Wilayah: {tps.city}</span>
                        </div>

                        {/* Capacity Progress Bar */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className="grow h-2.5 bg-gray-150 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${capacityBarColor}`}
                              style={{ width: `${tps.kapasitas}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-extrabold text-gray-850 dark:text-white w-10 text-right">
                            {tps.kapasitas}%
                          </span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex justify-end gap-3 pt-2">
                          <button
                            onClick={() => handleOpenDetail(tps)}
                            className="px-5 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-650 rounded-xl transition cursor-pointer"
                          >
                            Lihat Rincian
                          </button>
                          <button
                            onClick={() => handlePilihTps(tps.id)}
                            className="px-6 py-2 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl transition shadow-sm hover:shadow-md cursor-pointer"
                          >
                            Pilih TPS
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* MODAL TPS DETAIL */}
      {showDetailModal && selectedTps && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div
            className="absolute inset-0 bg-transparent"
            onClick={() => setShowDetailModal(false)}
          />

          <div className="relative bg-white dark:bg-slate-800 w-full sm:max-w-4xl rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] z-10 transition-colors duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-150 dark:border-slate-750 flex items-center justify-between bg-gray-50 dark:bg-slate-850 shrink-0">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
                >
                  <FontAwesomeIcon icon={faArrowLeft} className="text-lg" />
                </button>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                    {selectedTps.nama}
                  </h3>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-450 mt-0.5">
                    {selectedTps.lokasi}, {selectedTps.city}
                  </p>
                </div>
              </div>
              <div className="w-10 h-10 bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-emerald-400 rounded-full flex items-center justify-center shrink-0">
                <FontAwesomeIcon icon={faLeaf} className="text-lg" />
              </div>
            </div>

            {/* Modal Content Scrollable */}
            <div className="px-6 py-6 bg-gray-50 dark:bg-slate-900 overflow-y-auto max-h-[calc(90vh-140px)] space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Gauge widget */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xs border border-gray-100 dark:border-slate-750 flex flex-col items-center justify-center col-span-1">
                  <h4 className="text-xs font-extrabold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2 w-full text-left">
                    Status Saat Ini
                  </h4>
                  <CircularProgress
                    percent={selectedTps.kapasitas}
                    size={150}
                  />
                </div>

                {/* Right stats widgets */}
                <div className="col-span-1 md:col-span-2 flex flex-col gap-4">
                  {/* Sensor Health & Last Updated */}
                  <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-xs border border-gray-100 dark:border-slate-750 flex justify-between items-center transition-colors">
                    <div>
                      <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase">
                        Kesehatan Sensor
                      </p>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-emerald-400 mt-2">
                        <span className="w-2 h-2 bg-green-600 rounded-full mr-1.5 animate-pulse"></span>{" "}
                        Bagus
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase">
                        Terakhir Diupdate
                      </p>
                      <p className="font-bold text-gray-900 dark:text-white mt-2 text-sm">
                        5 menit lalu
                      </p>
                    </div>
                  </div>

                  {/* Kategori Sampah details */}
                  <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-xs border border-gray-100 dark:border-slate-750 flex-1 flex items-center gap-4 transition-colors">
                    <div className="p-3.5 bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-emerald-400 rounded-xl shrink-0">
                      <FontAwesomeIcon icon={faRecycle} className="text-2xl" />
                    </div>
                    <div>
                      <h5 className="font-bold text-gray-800 dark:text-white text-md">
                        {selectedTps.jenis}
                      </h5>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        Terdeteksi otomatis oleh sensor AI Samling
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid 2: Current Capacity & Weight */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-800 flex flex-col gap-2 p-5 shadow-xs border border-gray-100 dark:border-slate-750 rounded-2xl transition-colors">
                  <div className="flex items-center gap-2 text-gray-400 dark:text-slate-500">
                    <FontAwesomeIcon icon={faArrowTrendUp} />
                    <h4 className="text-xs font-bold uppercase tracking-wider">
                      Persentase Volume
                    </h4>
                  </div>
                  <h1 className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                    {selectedTps.kapasitas}%
                  </h1>
                </div>

                <div className="bg-white dark:bg-slate-800 flex flex-col gap-2 p-5 shadow-xs border border-gray-100 dark:border-slate-750 rounded-2xl transition-colors">
                  <div className="flex items-center gap-2 text-gray-400 dark:text-slate-500">
                    <FontAwesomeIcon icon={faScaleBalanced} />
                    <h4 className="text-xs font-bold uppercase tracking-wider">
                      Berat Penampungan
                    </h4>
                  </div>
                  <h1 className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                    {Math.round(selectedTps.kapasitas * 45)} Kg
                  </h1>
                </div>
              </div>

              {/* Grid 3: Personnel, Weather, Gas details */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-800 p-4 shadow-xs border border-gray-100 dark:border-slate-750 rounded-2xl text-center transition-colors">
                  <div className="flex justify-center text-gray-400 dark:text-slate-550 mb-1">
                    <FontAwesomeIcon icon={faUsers} />
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase">
                    Petugas
                  </p>
                  <p className="text-lg font-black mt-0.5 text-gray-800 dark:text-white">
                    4 Org
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 shadow-xs border border-gray-100 dark:border-slate-750 rounded-2xl text-center transition-colors">
                  <div className="flex justify-center text-gray-400 dark:text-slate-550 mb-1">
                    <FontAwesomeIcon icon={faTemperatureHalf} />
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase">
                    Suhu
                  </p>
                  <p className="text-lg font-black mt-0.5 text-gray-800 dark:text-white">
                    32°C
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 shadow-xs border border-gray-100 dark:border-slate-750 rounded-2xl text-center transition-colors">
                  <div className="flex justify-center text-gray-400 dark:text-slate-550 mb-1">
                    <FontAwesomeIcon icon={faWind} />
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase">
                    Gas Metana
                  </p>
                  <p className="text-lg font-black mt-0.5 text-gray-800 dark:text-white">
                    45%
                  </p>
                </div>
              </div>

              {/* Rincian Pemilahan Progress gauges */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xs border border-gray-100 dark:border-slate-755 transition-colors">
                <h4 className="text-xs font-bold text-gray-450 dark:text-slate-500 uppercase tracking-wider mb-4">
                  Rincian Pemilahan Sampah
                </h4>
                <div className="flex flex-row justify-around items-center">
                  <div className="flex flex-col items-center">
                    <CircularProgress percent={58} size={110} label="Organik" />
                    <p className="text-xs font-bold text-gray-400 dark:text-slate-500 mt-2">
                      1200 kg
                    </p>
                  </div>
                  <div className="flex flex-col items-center">
                    <CircularProgress
                      percent={78}
                      size={110}
                      label="Non-Organik"
                    />
                    <p className="text-xs font-bold text-gray-400 dark:text-slate-500 mt-2">
                      1640 kg
                    </p>
                  </div>
                </div>
              </div>

              {/* Capacities trend line Chart */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xs border border-gray-100 dark:border-slate-750 transition-colors">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xs font-bold text-gray-450 dark:text-slate-500 uppercase tracking-wider">
                    Tren Kapasitas (7 Periode Terakhir)
                  </h4>
                  <FontAwesomeIcon
                    icon={faChartLine}
                    className="text-gray-400"
                  />
                </div>
                <div className="h-60 w-full relative">
                  <canvas ref={trendChartRef} id="trendChart"></canvas>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    handlePilihTps(selectedTps.id);
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl transition shadow-lg shadow-green-100 dark:shadow-none flex justify-center items-center gap-2 cursor-pointer"
                >
                  <FontAwesomeIcon icon={faTruck} />
                  Pilih & Request Pengangkutan TPS
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shared Navigation Bottom */}
      <BottomNav />
    </div>
  );
}
