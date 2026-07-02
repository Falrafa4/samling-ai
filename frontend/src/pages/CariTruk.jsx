import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faTrashCan,
  faMapPin,
  faMapMarkedAlt,
  faTruckMoving,
  faClock,
  faRoute,
  faStar,
  faPaperPlane,
  faHandsHelping,
  faDumpster,
  faBuilding,
  faRecycle,
  faWeightHanging,
  faLocationDot,
  faCircleCheck,
  faArrowRight,
  faTrashAlt,
  faCheckCircle,
  faExclamationCircle,
} from "@fortawesome/free-solid-svg-icons";
import Chart from "chart.js/auto";

import Header from "../components/Header";
import LeafletMap from "../components/LeafletMap";
import CircularProgress from "../components/CircularProgress";
import AuthModal from "../components/fragments/AuthModal";
import {
  defaultTps,
  defaultTpa,
  defaultTrucks,
  defaultPartners,
} from "../utils/mockData";
import { getCapacityValue } from "../utils/helpers";

export default function CariTruk() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryTpsId = searchParams.get("tpsId");

  // General Wizard State
  const [currentStep, setCurrentStep] = useState(1); // 1, 2, 3 (TPA), 4 (Mitra), 5 (Armada)
  const [selectedTps, setSelectedTps] = useState(null);
  const [destinationType, setDestinationType] = useState(null); // 'tpa' or 'mitra'
  const [finalDestination, setFinalDestination] = useState(null); // TPA or Mitra Object
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Step 1: TPS State
  const [tpsSearch, setTpsSearch] = useState("");
  const [tpsCity, setTpsCity] = useState("all");
  const [tpsModalDetail, setTpsModalDetail] = useState(null);
  const tpsTrendChartRef = useRef(null);
  const tpsChartInstanceRef = useRef(null);

  // Step 3: TPA State
  const [tpaSearch, setTpaSearch] = useState("");
  const [tpaCity, setTpaCity] = useState("all");
  const [tpaModalDetail, setTpaModalDetail] = useState(null);
  const tpaCompChartRef = useRef(null);
  const tpaChartInstanceRef = useRef(null);

  // Step 4: Mitra State
  const [mitraCategory, setMitraCategory] = useState("organik");
  const [mitraSearch, setMitraSearch] = useState("");
  const [mitraSort, setMitraSort] = useState("newest");
  const [partnersList, setPartnersList] = useState([]);
  const [toast, setToast] = useState(null);
  const partnerChartRef = useRef(null);
  const partnerChartInstanceRef = useRef(null);

  // Step 5: Trucks State
  const [busyTruckIds, setBusyTruckIds] = useState([]);

  useEffect(() => {
    // Auth Check
    const username = localStorage.getItem("username");
    if (!username) {
      navigate("/login");
      return;
    }

    // Load partners list
    const stored = localStorage.getItem("samling_pro_sidoarjo_v1");
    if (stored) {
      setPartnersList(JSON.parse(stored));
    } else {
      setPartnersList(defaultPartners);
    }

    // Pre-select TPS if passed in URL query
    if (queryTpsId) {
      const found = defaultTps.find((t) => t.id === parseInt(queryTpsId));
      if (found) {
        setSelectedTps(found);
        setCurrentStep(2);
      }
    }
  }, [navigate, queryTpsId]);

  // Load busy trucks from localStorage ongoing activities
  useEffect(() => {
    if (currentStep === 5) {
      const activities =
        JSON.parse(localStorage.getItem("truckActivities")) || [];
      const busyIds = activities
        .filter((act) => act.status === "ongoing")
        .map((act) => act.truckId);
      setBusyTruckIds(busyIds);
    }
  }, [currentStep]);

  // Navigation globally back
  const handleGlobalBack = () => {
    if (currentStep === 5) {
      setCurrentStep(destinationType === "tpa" ? 3 : 4);
    } else if (currentStep === 3 || currentStep === 4) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(1);
    } else {
      navigate("/dashboard");
    }
  };

  // Step Indicators Class helpers
  const getIndicatorClass = (stepNum, activeRange) => {
    const isActive = activeRange.includes(currentStep);
    const isCompleted =
      currentStep > stepNum ||
      (stepNum === 2 && currentStep > 2) ||
      (stepNum === 3 && currentStep === 5);

    if (isActive) {
      return "px-3 py-1 rounded-full bg-green-600 text-white font-bold text-xs whitespace-nowrap transition-all duration-200";
    }
    if (isCompleted) {
      return "px-3 py-1 rounded-full bg-green-100 text-green-700 font-bold text-xs whitespace-nowrap cursor-pointer hover:bg-green-200 transition-all duration-200";
    }
    return "px-3 py-1 rounded-full bg-gray-100 text-gray-400 font-medium text-xs whitespace-nowrap transition-all duration-200";
  };

  const handleIndicatorClick = (stepNum) => {
    if (stepNum === 1 && currentStep > 1) {
      setCurrentStep(1);
    } else if (stepNum === 2 && currentStep > 2) {
      setCurrentStep(2);
    } else if (stepNum === 3 && currentStep === 5) {
      setCurrentStep(destinationType === "tpa" ? 3 : 4);
    }
  };

  const showNotification = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // --- STEP 1: TPS LIST ---
  const filteredTps = defaultTps.filter((t) => {
    const matchesCity = tpsCity === "all" || t.city === tpsCity;
    const matchesSearch = t.nama
      .toLowerCase()
      .includes(tpsSearch.toLowerCase());
    return matchesCity && matchesSearch;
  });

  const selectTPS = (tps) => {
    setSelectedTps(tps);
    setTpsModalDetail(null);
    setCurrentStep(2);
  };

  // Render TPS trend chart inside modal
  useEffect(() => {
    if (!tpsModalDetail || !tpsTrendChartRef.current) return;
    if (tpsChartInstanceRef.current) tpsChartInstanceRef.current.destroy();

    const ctx = tpsTrendChartRef.current.getContext("2d");
    tpsChartInstanceRef.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: [
          "6hr lalu",
          "5hr lalu",
          "4hr lalu",
          "3hr lalu",
          "2hr lalu",
          "1hr lalu",
          "Saat Ini",
        ],
        datasets: [
          {
            label: "Kapasitas (%)",
            backgroundColor: "rgba(34, 197, 94, 0.1)",
            borderColor: "rgba(34, 197, 94, 1)",
            borderWidth: 2,
            fill: true,
            data: tpsModalDetail.trend,
            tension: 0.4,
            pointBackgroundColor:
              tpsModalDetail.capacity > 90
                ? "#ef4444"
                : tpsModalDetail.capacity > 70
                  ? "#facc15"
                  : "#22c55e",
            pointRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, max: 100 } },
      },
    });

    return () => {
      if (tpsChartInstanceRef.current) {
        tpsChartInstanceRef.current.destroy();
        tpsChartInstanceRef.current = null;
      }
    };
  }, [tpsModalDetail]);

  // --- STEP 2: SELECT TYPE ---
  const handleDestinationTypeChoice = (type) => {
    setDestinationType(type);
    setShowAuthModal(true); // Ask for passcode "admin" before proceeding
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    if (destinationType === "tpa") {
      setCurrentStep(3);
    } else {
      setCurrentStep(4);
    }
  };

  // --- STEP 3: SELECT TPA ---
  const filteredTpa = defaultTpa.filter((t) => {
    const matchesCity = tpaCity === "all" || t.city === tpaCity;
    const matchesSearch = t.nama
      .toLowerCase()
      .includes(tpaSearch.toLowerCase());
    return matchesCity && matchesSearch;
  });

  const selectTPA = (tpa) => {
    setFinalDestination(tpa);
    setTpaModalDetail(null);
    setCurrentStep(5);
  };

  // Render TPA composition chart inside modal
  useEffect(() => {
    if (!tpaModalDetail || !tpaCompChartRef.current) return;
    if (tpaChartInstanceRef.current) tpaChartInstanceRef.current.destroy();

    const ctx = tpaCompChartRef.current.getContext("2d");
    const comp = tpaModalDetail.wasteComposition;

    tpaChartInstanceRef.current = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Organik", "Non-Organik", "B3"],
        datasets: [
          {
            data: [comp.organic, comp.nonOrganic, comp.b3],
            backgroundColor: ["#16a34a", "#0ea5e9", "#f97316"],
            borderColor: "#ffffff",
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "70%",
        plugins: { legend: { position: "bottom" } },
      },
    });

    return () => {
      if (tpaChartInstanceRef.current) {
        tpaChartInstanceRef.current.destroy();
        tpaChartInstanceRef.current = null;
      }
    };
  }, [tpaModalDetail]);

  // --- STEP 4: SELECT MITRA ---
  const getFilteredMitra = () => {
    let list = partnersList.filter(
      (p) =>
        p.category === mitraCategory &&
        p.name.toLowerCase().includes(mitraSearch.toLowerCase()),
    );

    if (mitraSort === "nearest") {
      list.sort((a, b) => a.distance - b.distance);
    } else if (mitraSort === "capacity") {
      list.sort((a, b) => getCapacityValue(b.req) - getCapacityValue(a.req));
    } else {
      list.sort((a, b) => b.id - a.id);
    }
    return list;
  };

  const filteredMitra = getFilteredMitra();

  const selectMitra = (mitra) => {
    setFinalDestination(mitra);
    setCurrentStep(5);
  };

  // Render Mitra capacity chart inside step 4
  useEffect(() => {
    if (currentStep !== 4 || !partnerChartRef.current) return;
    if (partnerChartInstanceRef.current)
      partnerChartInstanceRef.current.destroy();

    const labels = filteredMitra.map((m) => m.name.substring(0, 10) + "...");
    const values = filteredMitra.map((m) => getCapacityValue(m.req));
    const colors = filteredMitra.map((m, i) => {
      const h = m.category === "organik" ? 142 : 190;
      const l = 45 + ((i * 8) % 30);
      return `hsl(${h}, 70%, ${l}%)`;
    });

    const ctx = partnerChartRef.current.getContext("2d");
    partnerChartInstanceRef.current = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: colors,
            borderWidth: 1,
            borderColor: "#ffffff",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        cutout: "75%",
      },
    });

    return () => {
      if (partnerChartInstanceRef.current) {
        partnerChartInstanceRef.current.destroy();
        partnerChartInstanceRef.current = null;
      }
    };
  }, [filteredMitra, currentStep]);

  // --- STEP 5: SELECT FLEET ---
  const handleCallTruck = (truck) => {
    const isBusy = busyTruckIds.includes(truck.id);
    if (isBusy) {
      showNotification("Truk ini sedang bertugas dan tidak tersedia.", "error");
      return;
    }

    if (!selectedTps || !finalDestination) return;

    const newActivity = {
      id: Date.now(),
      status: "ongoing",
      truckId: truck.id,
      route: `${selectedTps.name || selectedTps.nama} -> ${finalDestination.name || finalDestination.nama}`,
      timestamp: new Date().toISOString(),
    };

    try {
      const activities =
        JSON.parse(localStorage.getItem("truckActivities")) || [];
      activities.unshift(newActivity);
      localStorage.setItem("truckActivities", JSON.stringify(activities));
      navigate("/aktivitas");
    } catch (e) {
      showNotification("Gagal memproses pengiriman truk", "error");
    }
  };

  // Header Title setup dynamically
  let headerTitle = "Pilih TPS";
  let headerSubtitle = "Pilih lokasi TPS penjemputan sampah";

  if (currentStep === 2) {
    headerTitle = "Pilih Tipe Tujuan";
    headerSubtitle = "Kirim sampah ke TPA atau Mitra Pengolah";
  } else if (currentStep === 3) {
    headerTitle = "Pilih TPA Tujuan";
    headerSubtitle = "Pilih dari daftar TPA yang tersedia";
  } else if (currentStep === 4) {
    headerTitle = "Pilih Mitra Pengolah";
    headerSubtitle = "Pilih dari daftar mitra terverifikasi";
  } else if (currentStep === 5) {
    headerTitle = "Minta Angkut";
    headerSubtitle = "Cari & panggil armada truk terdekat";
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col text-gray-900 dark:text-gray-100 pb-16 transition-colors duration-200">
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-slide-in">
          <div className="bg-white dark:bg-slate-800 border-l-4 border-red-500 shadow-2xl rounded-lg p-4 flex items-center gap-4 min-w-[280px]">
            <div className="p-2 rounded-full bg-red-100 text-red-500">
              <FontAwesomeIcon icon={faExclamationCircle} className="text-lg" />
            </div>
            <span className="text-sm font-semibold">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Auth Passcode Lock */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Dynamic Header */}
      <Header
        title={headerTitle}
        subtitle={headerSubtitle}
        showBack={true}
        onBack={handleGlobalBack}
        rightContent={
          /* Wizard steps indicator bar */
          <div className="flex items-center gap-1 text-[10px] md:text-xs">
            <span
              onClick={() => handleIndicatorClick(1)}
              className={getIndicatorClass(1, [1])}
            >
              1. Lokasi
            </span>
            <div className="w-3 h-px bg-gray-300"></div>
            <span
              onClick={() => handleIndicatorClick(2)}
              className={getIndicatorClass(2, [2])}
            >
              2. Tujuan
            </span>
            <div className="w-3 h-px bg-gray-300"></div>
            <span
              onClick={() => handleIndicatorClick(3)}
              className={getIndicatorClass(3, [3, 4])}
            >
              3. Rincian
            </span>
            <div className="w-3 h-px bg-gray-300"></div>
            <span className={getIndicatorClass(4, [5])}>4. Armada</span>
          </div>
        }
      />

      <main className="flex-1 w-[94%] mx-auto py-8">
        {/* ==================== STEP 1: CHOOSE TPS ==================== */}
        {currentStep === 1 && (
          <section className="animate-fade-in space-y-4 max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4 mb-2">
              <div className="relative grow">
                <FontAwesomeIcon
                  icon={faSearch}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={tpsSearch}
                  onChange={(e) => setTpsSearch(e.target.value)}
                  placeholder="Cari lokasi TPS..."
                  className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-green-500 shadow-xs text-gray-900 dark:text-white"
                />
              </div>
              <div className="md:w-1/4">
                <select
                  value={tpsCity}
                  onChange={(e) => setTpsCity(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-green-500 shadow-xs cursor-pointer text-gray-800 dark:text-white"
                >
                  <option value="all">Semua Wilayah</option>
                  <option value="Surabaya">Surabaya</option>
                  <option value="Malang">Malang</option>
                  <option value="Kediri">Kediri</option>
                  <option value="Blitar">Blitar</option>
                </select>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-150 dark:border-slate-750 overflow-hidden min-h-[400px]">
              {filteredTps.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    Data TPS tidak ditemukan.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-slate-750">
                  {filteredTps.map((t) => {
                    const isFull = t.status === "Penuh";
                    const statusColor = isFull
                      ? "text-red-500 bg-red-50 dark:bg-red-950/20"
                      : "text-green-500 bg-green-50 dark:bg-green-950/20";
                    const capacityBg = isFull ? "bg-red-500" : "bg-green-600";

                    return (
                      <div
                        key={t.id}
                        onClick={() => setTpsModalDetail(t)}
                        className="p-5 hover:bg-gray-50/50 dark:hover:bg-slate-750/30 transition-colors cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                      >
                        <div className="flex-1 w-full min-w-0">
                          <div className="flex items-center justify-between sm:justify-start gap-3 mb-2">
                            <h3 className="text-base font-bold text-gray-800 dark:text-white truncate">
                              {t.nama}
                            </h3>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${statusColor}`}
                            >
                              {t.status}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-x-4 text-xs font-semibold text-gray-400 dark:text-slate-500 mb-3">
                            <span>Jenis: {t.type || t.jenis}</span>
                            <span>Kota: {t.city}</span>
                            <span>Jarak: {t.distance} m</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="grow h-2 bg-gray-150 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${capacityBg}`}
                                style={{ width: `${t.capacity}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-extrabold text-gray-700 dark:text-white w-8 text-right">
                              {t.capacity}%
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            selectTPS(t);
                          }}
                          className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl transition shadow-sm hover:shadow-md cursor-pointer self-stretch sm:self-auto text-center"
                        >
                          Pilih
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ==================== STEP 2: CHOOSE DESTINATION TYPE ==================== */}
        {currentStep === 2 && selectedTps && (
          <section className="animate-fade-in max-w-xl mx-auto space-y-6">
            {/* Summary current TPS */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-xs border border-gray-150 dark:border-slate-750 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-emerald-400 rounded-full flex items-center justify-center text-lg">
                  <FontAwesomeIcon icon={faMapPin} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase font-bold tracking-wider">
                    Titik Jemput
                  </p>
                  <h2 className="text-md font-bold text-gray-850 dark:text-white">
                    {selectedTps.nama || selectedTps.name}
                  </h2>
                </div>
              </div>
            </div>

            {/* Destination choice list */}
            <div className="grid grid-cols-1 gap-4">
              {/* Option 1: TPA */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs flex flex-col gap-4 hover:border-green-500 hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-emerald-400 flex items-center justify-center text-2xl shrink-0">
                    <FontAwesomeIcon icon={faDumpster} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-lg text-gray-900 dark:text-white">
                      Kirim ke TPA
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Buang sampah langsung ke Tempat Pembuangan Akhir
                      (Landfill).
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDestinationTypeChoice("tpa")}
                  className="w-full py-3 rounded-xl font-bold bg-green-600 hover:bg-green-700 text-white shadow-md transition-all active:scale-[0.98] cursor-pointer"
                >
                  Lanjutkan Ke TPA
                </button>
              </div>

              {/* Option 2: MITRA */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs flex flex-col gap-4 hover:border-green-500 hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-2xl shrink-0">
                    <FontAwesomeIcon icon={faHandsHelping} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-lg text-gray-900 dark:text-white">
                      Kirim ke Mitra Pengolah
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Kirim sampah terpilah ke mitra daur ulang / industri.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDestinationTypeChoice("mitra")}
                  className="w-full py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all active:scale-[0.98] cursor-pointer"
                >
                  Lanjutkan Ke Mitra
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ==================== STEP 3: CHOOSE TPA ==================== */}
        {currentStep === 3 && (
          <section className="animate-fade-in space-y-4 max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4 mb-2">
              <div className="relative grow">
                <FontAwesomeIcon
                  icon={faSearch}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={tpaSearch}
                  onChange={(e) => setTpaSearch(e.target.value)}
                  placeholder="Cari nama TPA..."
                  className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-green-500 shadow-xs text-gray-900 dark:text-white"
                />
              </div>
              <div className="md:w-1/4">
                <select
                  value={tpaCity}
                  onChange={(e) => setTpaCity(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-green-500 shadow-xs cursor-pointer text-gray-800 dark:text-white"
                >
                  <option value="all">Semua Wilayah</option>
                  <option value="Surabaya">Surabaya</option>
                  <option value="Malang">Malang</option>
                  <option value="Sidoarjo">Sidoarjo</option>
                  <option value="Gresik">Gresik</option>
                </select>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-150 dark:border-slate-750 overflow-hidden min-h-[400px]">
              {filteredTpa.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    Data TPA tidak ditemukan.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-slate-750">
                  {filteredTpa.map((tpa) => {
                    const isFull = tpa.kapasitas >= 80;
                    const statusColor = isFull
                      ? "text-red-500 bg-red-50 dark:bg-red-950/20"
                      : "text-green-500 bg-green-50 dark:bg-green-950/20";
                    const capacityBg = isFull ? "bg-red-500" : "bg-green-600";

                    return (
                      <div
                        key={tpa.id}
                        onClick={() => setTpaModalDetail(tpa)}
                        className="p-5 hover:bg-gray-50/50 dark:hover:bg-slate-750/30 transition-colors cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                      >
                        <div className="flex-1 w-full min-w-0">
                          <div className="flex items-center justify-between sm:justify-start gap-3 mb-2">
                            <h3 className="text-base font-bold text-gray-800 dark:text-white truncate">
                              {tpa.nama}
                            </h3>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${statusColor}`}
                            >
                              {tpa.status}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-x-4 text-xs font-semibold text-gray-400 dark:text-slate-500 mb-3">
                            <span>Jenis: {tpa.jenis}</span>
                            <span>Kota: {tpa.city}</span>
                            <span>
                              Jarak: {(tpa.jarak / 1000).toFixed(1)} km
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="grow h-2 bg-gray-150 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${capacityBg}`}
                                style={{ width: `${tpa.kapasitas}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-extrabold text-gray-700 dark:text-white w-8 text-right">
                              {tpa.kapasitas}%
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            selectTPA(tpa);
                          }}
                          className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl transition shadow-sm hover:shadow-md cursor-pointer self-stretch sm:self-auto text-center"
                        >
                          Pilih
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ==================== STEP 4: CHOOSE MITRA ==================== */}
        {currentStep === 4 && (
          <section className="animate-fade-in max-w-5xl mx-auto space-y-6">
            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
              <nav className="bg-white dark:bg-slate-800 shadow-sm border border-gray-100 dark:border-slate-750 p-1 rounded-xl inline-flex self-start transition-colors">
                <button
                  onClick={() => setMitraCategory("organik")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                    mitraCategory === "organik"
                      ? "bg-green-600 text-white shadow-sm"
                      : "text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  Organik
                </button>
                <button
                  onClick={() => setMitraCategory("non-organik")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                    mitraCategory === "non-organik"
                      ? "bg-cyan-600 text-white shadow-sm"
                      : "text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  Non-Organik
                </button>
              </nav>

              <div className="flex flex-row gap-2 items-center w-full md:w-auto">
                <div className="search-container bg-white dark:bg-slate-800 border border-gray-155 dark:border-slate-700 flex items-center gap-2 px-3 py-2 rounded-xl flex-1 md:w-60 transition-colors">
                  <FontAwesomeIcon
                    icon={faSearch}
                    className="text-gray-450 text-sm"
                  />
                  <input
                    type="text"
                    value={mitraSearch}
                    onChange={(e) => setMitraSearch(e.target.value)}
                    placeholder="Cari nama mitra..."
                    className="bg-transparent border-none outline-none text-sm text-gray-900 dark:text-white w-full placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>
                <select
                  value={mitraSort}
                  onChange={(e) => setMitraSort(e.target.value)}
                  className="bg-white dark:bg-slate-800 shadow-sm text-gray-800 dark:text-white text-sm border border-gray-160 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none cursor-pointer w-full md:w-auto transition-colors"
                >
                  <option value="newest">Terbaru</option>
                  <option value="nearest">Jarak Terdekat</option>
                  <option value="capacity">Kebutuhan Tertinggi</option>
                </select>
              </div>
            </div>

            {/* Grid display */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Left Column: list */}
              <div className="lg:col-span-2 space-y-3">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-md font-bold text-gray-850 dark:text-white">
                    Pilih Mitra Tujuan
                  </h3>
                  <span
                    id="mitra-result-count"
                    className="text-xs font-semibold text-gray-400 bg-white dark:bg-slate-800 shadow-sm px-2 py-1 rounded-md"
                  >
                    {filteredMitra.length} Mitra
                  </span>
                </div>

                {filteredMitra.length === 0 ? (
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-10 text-center border border-dashed border-gray-200 dark:border-slate-700">
                    <p className="text-gray-500 dark:text-gray-400">
                      Tidak ada mitra ditemukan.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {filteredMitra.map((p) => {
                      const isOrg = p.category === "organik";
                      const themeColor = isOrg
                        ? "text-green-500 bg-green-500/10"
                        : "text-cyan-500 bg-cyan-500/10";
                      const borderColor = isOrg
                        ? "border-l-green-500"
                        : "border-l-cyan-500";

                      return (
                        <div
                          key={p.id}
                          onClick={() => selectMitra(p)}
                          className={`partner-card bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border-l-4 ${borderColor} border-t border-r border-b border-gray-100 dark:border-slate-750 cursor-pointer hover:shadow-lg transition transform hover:-translate-y-0.5 group flex justify-between items-center transition-colors duration-200`}
                        >
                          <div className="flex items-start gap-4">
                            <div
                              className={`w-12 h-12 rounded-xl ${themeColor} flex items-center justify-center text-xl shrink-0`}
                            >
                              <i
                                className={`fa-solid ${p.icon || "fa-building"}`}
                              ></i>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-gray-800 dark:text-white text-md truncate flex items-center gap-1.5">
                                {p.name}
                                {p.verified && (
                                  <FontAwesomeIcon
                                    icon={faCircleCheck}
                                    className="text-blue-500 text-sm"
                                  />
                                )}
                              </h4>
                              <p className="text-gray-500 dark:text-gray-400 text-xs line-clamp-1 mb-2">
                                {p.desc}
                              </p>
                              <div className="flex items-center gap-3 text-xs font-semibold text-gray-600 dark:text-gray-400">
                                <span className="bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded flex items-center gap-1.5">
                                  <FontAwesomeIcon
                                    icon={faWeightHanging}
                                    className="text-gray-400 dark:text-slate-500"
                                  />
                                  {p.req}
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <FontAwesomeIcon
                                    icon={faLocationDot}
                                    className="text-gray-400 dark:text-slate-500"
                                  />
                                  {p.distance} km
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-gray-300 dark:text-slate-650 group-hover:text-green-600 dark:group-hover:text-emerald-400 transition pr-1">
                            <FontAwesomeIcon
                              icon={faChevronRight}
                              className="text-md"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right column: stats */}
              <div className="flex flex-col gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-gray-150 dark:border-slate-750">
                  <h4 className="text-gray-900 dark:text-white font-bold mb-3">
                    Ringkasan Kategori
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-55 dark:bg-slate-750 p-3 rounded-lg text-center">
                      <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-slate-500">
                        Total Mitra
                      </p>
                      <p
                        className="text-xl font-bold text-gray-900 dark:text-white mt-1"
                        id="mitra-summary-count"
                      >
                        {filteredMitra.length}
                      </p>
                    </div>
                    <div className="bg-gray-55 dark:bg-slate-750 p-3 rounded-lg text-center flex flex-col justify-center">
                      <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-slate-500">
                        Kategori Aktif
                      </p>
                      <p
                        className={`text-xs font-black uppercase mt-1 ${mitraCategory === "organik" ? "text-green-500" : "text-cyan-500"}`}
                        id="mitra-summary-category"
                      >
                        {mitraCategory}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-gray-150 dark:border-slate-750">
                  <h4 className="text-gray-900 dark:text-white font-bold mb-1 text-md">
                    Analisis Kapasitas
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    Proporsi daya tampung per mitra
                  </p>
                  <div className="relative h-48 flex justify-center">
                    <canvas ref={partnerChartRef} id="mitraChart"></canvas>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ==================== STEP 5: SELECT FLEET / CALL TRUCK ==================== */}
        {currentStep === 5 && selectedTps && finalDestination && (
          <section className="animate-fade-in max-w-4xl mx-auto space-y-6">
            {/* Info summary header */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-xs border border-gray-150 dark:border-slate-750 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-emerald-400 rounded-full flex items-center justify-center">
                    <FontAwesomeIcon icon={faMapPin} />
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-400 dark:text-slate-500 uppercase font-bold tracking-wider">
                      Titik Jemput
                    </p>
                    <h2 className="text-md font-bold text-gray-800 dark:text-white leading-none">
                      {selectedTps.nama || selectedTps.name}
                    </h2>
                  </div>
                </div>
                <div className="hidden sm:block border-l border-gray-250 dark:border-slate-700 h-8"></div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center">
                    <FontAwesomeIcon icon={faMapMarkedAlt} />
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-400 dark:text-slate-500 uppercase font-bold tracking-wider">
                      Tujuan Akhir
                    </p>
                    <h2 className="text-md font-bold text-gray-855 dark:text-white leading-none">
                      {finalDestination.nama || finalDestination.name}
                    </h2>
                  </div>
                </div>
              </div>
              <div className="text-left sm:text-right shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto flex sm:block justify-between">
                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">
                  Kapasitas TPS
                </p>
                <p className="text-md font-extrabold text-brand dark:text-emerald-400 mt-1">
                  {selectedTps.kapasitas || selectedTps.capacity}%
                </p>
              </div>
            </div>

            {/* Fleet List Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {defaultTrucks.map((truck) => {
                const isBusy = busyTruckIds.includes(truck.id);
                const isAvailable = truck.status === "available" && !isBusy;

                return (
                  <div
                    key={truck.id}
                    className={`bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-150 dark:border-slate-750 shadow-xs flex flex-col gap-4 relative overflow-hidden transition-all ${
                      !isAvailable
                        ? "opacity-60"
                        : "hover:border-green-500 hover:shadow-md"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-14 h-14 rounded-full ${!isAvailable ? "bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500" : "bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-emerald-400"} flex items-center justify-center text-xl shrink-0`}
                        >
                          <FontAwesomeIcon icon={faTruckMoving} />
                        </div>
                        <div>
                          <h4 className="font-bold text-lg text-gray-900 dark:text-white">
                            {truck.driver}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                            {truck.plate}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-xs font-bold border px-3 py-1 rounded-full ${
                          !isAvailable
                            ? "text-yellow-600 bg-yellow-50 border-yellow-150 dark:bg-yellow-950/20 dark:border-yellow-900/30"
                            : "text-green-600 bg-green-50 border-green-150 dark:bg-green-950/20 dark:border-green-900/30"
                        }`}
                      >
                        {isAvailable ? "Tersedia" : "Sibuk"}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-gray-50 dark:border-slate-750">
                      <div className="text-center">
                        <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase font-bold">
                          Estimasi
                        </p>
                        <p className="font-bold text-gray-700 dark:text-slate-350 text-xs mt-1">
                          <FontAwesomeIcon
                            icon={faClock}
                            className="text-green-500 mr-1"
                          />
                          {truck.eta}
                        </p>
                      </div>
                      <div className="text-center border-l border-r border-gray-100 dark:border-slate-750">
                        <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase font-bold">
                          Jarak
                        </p>
                        <p className="font-bold text-gray-700 dark:text-slate-350 text-xs mt-1">
                          <FontAwesomeIcon
                            icon={faRoute}
                            className="text-blue-500 mr-1"
                          />
                          {truck.distance_from_tps} km
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase font-bold">
                          Rating
                        </p>
                        <p className="font-bold text-gray-700 dark:text-slate-350 text-xs mt-1">
                          <FontAwesomeIcon
                            icon={faStar}
                            className="text-yellow-400 mr-1"
                          />
                          {truck.rating}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCallTruck(truck)}
                      disabled={!isAvailable}
                      className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                        !isAvailable
                          ? "bg-gray-100 text-gray-400 dark:bg-slate-700 dark:text-slate-500 cursor-not-allowed"
                          : "bg-green-600 text-white hover:bg-green-700 shadow-md cursor-pointer active:scale-[0.98]"
                      }`}
                    >
                      <FontAwesomeIcon icon={faPaperPlane} />
                      {isAvailable ? "Panggil Truk" : "Sedang Bertugas"}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* ==================== MODALS IN CARI TRUK ==================== */}

      {/* TPS Modal Details (Step 1) */}
      {tpsModalDetail && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div
            className="absolute inset-0 bg-transparent"
            onClick={() => setTpsModalDetail(null)}
          />
          <div className="relative bg-white dark:bg-slate-800 w-full sm:max-w-4xl rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] z-10 transition-colors duration-200">
            <div className="px-6 py-5 border-b border-gray-150 dark:border-slate-750 flex items-center justify-between bg-gray-50 dark:bg-slate-850 shrink-0">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setTpsModalDetail(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <FontAwesomeIcon icon={faArrowLeft} className="text-lg" />
                </button>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                    {tpsModalDetail.nama}
                  </h3>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-450 mt-0.5">
                    {tpsModalDetail.lokasi}, {tpsModalDetail.city}
                  </p>
                </div>
              </div>
              <div className="w-10 h-10 bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-emerald-400 rounded-full flex items-center justify-center shrink-0">
                <i className="fa-solid fa-recycle text-xl"></i>
              </div>
            </div>

            <div className="px-6 py-6 bg-gray-50 dark:bg-slate-900 overflow-y-auto max-h-[calc(90vh-140px)] space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xs border border-gray-100 dark:border-slate-750 flex flex-col items-center justify-center col-span-1">
                  <h4 className="text-xs font-bold text-gray-450 dark:text-slate-500 uppercase tracking-wider mb-2 w-full text-left">
                    Status Saat Ini
                  </h4>
                  <CircularProgress
                    percent={tpsModalDetail.capacity}
                    size={140}
                  />
                </div>

                <div className="col-span-1 md:col-span-2 flex flex-col gap-4">
                  <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-xs border border-gray-100 dark:border-slate-750 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase">
                        Kesehatan Sensor
                      </p>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-emerald-400 mt-2">
                        <span className="w-2 h-2 bg-green-600 rounded-full mr-1.5"></span>{" "}
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

                  <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-xs border border-gray-100 dark:border-slate-750 flex-1 flex items-center gap-4">
                    <div className="p-3 bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-emerald-400 rounded-xl shrink-0">
                      <FontAwesomeIcon icon={faRecycle} className="text-xl" />
                    </div>
                    <div>
                      <h5 className="font-bold text-gray-800 dark:text-white text-md">
                        {tpsModalDetail.type || tpsModalDetail.jenis}
                      </h5>
                      <p className="text-xs text-gray-400 dark:text-gray-505 mt-0.5">
                        Kategori sampah utama penjemputan
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xs border border-gray-100 dark:border-slate-750">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xs font-bold text-gray-450 dark:text-slate-500 uppercase tracking-wider">
                    Tren Kapasitas (7 Hari Terakhir)
                  </h4>
                  <FontAwesomeIcon
                    icon={faChartLine}
                    className="text-gray-400"
                  />
                </div>
                <div className="h-60 w-full relative">
                  <canvas ref={tpsTrendChartRef} id="tpsTrendChart"></canvas>
                </div>
              </div>

              <button
                onClick={() => selectTPS(tpsModalDetail)}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 px-4 rounded-xl transition shadow-lg flex justify-center items-center gap-2 cursor-pointer"
              >
                Pilih TPS Ini & Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TPA Modal Details (Step 3) */}
      {tpaModalDetail && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div
            className="absolute inset-0 bg-transparent"
            onClick={() => setTpaModalDetail(null)}
          />
          <div className="relative bg-white dark:bg-slate-800 w-full sm:max-w-3xl rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] z-10 transition-colors duration-200">
            <div className="px-6 py-5 border-b border-gray-150 dark:border-slate-750 flex items-center justify-between bg-gray-50 dark:bg-slate-850 shrink-0">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setTpaModalDetail(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <FontAwesomeIcon icon={faArrowLeft} className="text-lg" />
                </button>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                    {tpaModalDetail.nama}
                  </h3>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-455 mt-0.5">
                    {tpaModalDetail.lokasi}, {tpaModalDetail.city}
                  </p>
                </div>
              </div>
              <div className="w-10 h-10 bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-emerald-400 rounded-full flex items-center justify-center shrink-0">
                <FontAwesomeIcon icon={faDumpster} className="text-lg" />
              </div>
            </div>

            <div className="px-6 py-6 bg-gray-50 dark:bg-slate-900 overflow-y-auto max-h-[calc(90vh-140px)] space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-xs border border-gray-100 dark:border-slate-750 text-center">
                  <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase">
                    Volume Harian
                  </p>
                  <p className="text-lg font-black text-gray-800 dark:text-white mt-1.5">
                    {tpaModalDetail.dailyVolume.toLocaleString("id-ID")}
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-slate-550">
                    ton/hari
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-xs border border-gray-100 dark:border-slate-750 text-center">
                  <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase">
                    Kapasitas
                  </p>
                  <p
                    className={`text-lg font-black mt-1.5 ${tpaModalDetail.kapasitas > 80 ? "text-red-500" : "text-green-500"}`}
                  >
                    {tpaModalDetail.kapasitas}%
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-slate-550">
                    {tpaModalDetail.status}
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-xs border border-gray-100 dark:border-slate-750 text-center">
                  <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase">
                    Sisa Umur
                  </p>
                  <p className="text-lg font-black text-gray-800 dark:text-white mt-1.5">
                    {tpaModalDetail.lifespan}
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-slate-550">
                    tahun
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xs border border-gray-100 dark:border-slate-750">
                <h4 className="text-xs font-bold text-gray-450 dark:text-slate-500 uppercase tracking-wider mb-4">
                  Komposisi Sampah Rata-rata
                </h4>
                <div className="h-48 w-full relative flex items-center justify-center">
                  <canvas ref={tpaCompChartRef} id="tpaCompChart"></canvas>
                </div>
              </div>

              <button
                onClick={() => selectTPA(tpaModalDetail)}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 px-4 rounded-xl transition shadow-lg flex justify-center items-center gap-2 cursor-pointer"
              >
                Pilih TPA Ini & Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
