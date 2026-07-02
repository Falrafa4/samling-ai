import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTruckFast,
  faClock,
  faCheckCircle,
  faEllipsisVertical,
  faCheck,
  faTrashCan,
  faHistory,
} from "@fortawesome/free-solid-svg-icons";
import BottomNav from "../components/BottomNav";
import Header from "../components/Header";
import { formatTime } from "../utils/helpers";
import { defaultTrucks, defaultPartners } from "../utils/mockData";

export default function Aktivitas() {
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState("truck"); // 'truck' or 'partner'
  const [truckActivities, setTruckActivities] = useState([]);
  const [partnerRequests, setPartnerRequests] = useState([]);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [activeRequestMenuId, setActiveRequestMenuId] = useState(null);

  const requestTimerRef = useRef(null);

  useEffect(() => {
    // Auth Check
    const username = localStorage.getItem("username");
    if (!username) {
      navigate("/login");
      return;
    }

    // Load truck activities
    loadTruckActivities();

    // Load or generate initial partner requests
    loadPartnerRequests();

    // Generate random request every 2 minutes
    requestTimerRef.current = setInterval(generateRandomRequest, 120000);

    return () => {
      if (requestTimerRef.current) clearInterval(requestTimerRef.current);
    };
  }, [navigate]);

  const loadTruckActivities = () => {
    const stored = JSON.parse(localStorage.getItem("truckActivities"));
    if (stored) {
      setTruckActivities(stored);
    } else {
      const initial = [
        {
          id: 1,
          status: "ongoing",
          truckId: "T-01",
          route: "Perumahan Griya Asri -> TPS Pusat",
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        },
        {
          id: 2,
          status: "ready",
          truckId: "T-03",
          route: "Kawasan Industri Candi -> TPS Barat",
          timestamp: new Date().toISOString(),
        },
        {
          id: 4,
          status: "completed",
          truckId: "T-01",
          route: "Area Perkantoran -> TPS Timur",
          timestamp: new Date(Date.now() - 2 * 3600 * 1050).toISOString(),
        },
        {
          id: 5,
          status: "completed",
          truckId: "T-04",
          route: "Cluster Melati -> TPS Utara",
          timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
        },
        {
          id: 6,
          status: "completed",
          truckId: "T-02",
          route: "Desa Suko -> TPS Barat",
          timestamp: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
        },
      ];
      localStorage.setItem("truckActivities", JSON.stringify(initial));
      setTruckActivities(initial);
    }
  };

  const loadPartnerRequests = () => {
    // Generate two initial mock requests
    const initialRequests = [
      {
        id: `req-1`,
        partnerName: "GreenCompost Sidoarjo",
        wasteType: "organik",
        amount: 320,
        deadline: new Date(Date.now() + 2 * 3600 * 1000).toLocaleTimeString(
          "id-ID",
          { hour: "2-digit", minute: "2-digit" },
        ),
      },
      {
        id: `req-2`,
        partnerName: "BioEnergy Candi",
        wasteType: "non-organik",
        amount: 850,
        deadline: new Date(Date.now() + 4 * 3600 * 1000).toLocaleTimeString(
          "id-ID",
          { hour: "2-digit", minute: "2-digit" },
        ),
      },
    ];
    setPartnerRequests(initialRequests);
  };

  const generateRandomRequest = () => {
    const partners =
      JSON.parse(localStorage.getItem("samling_pro_sidoarjo_v1")) ||
      defaultPartners;
    if (partners.length === 0) return;

    const randomPartner = partners[Math.floor(Math.random() * partners.length)];
    const wasteTypes = ["organik", "non-organik", "campuran"];
    const randomWasteType =
      wasteTypes[Math.floor(Math.random() * wasteTypes.length)];
    const randomKg = Math.floor(Math.random() * 800) + 100;

    const deadline = new Date();
    deadline.setHours(deadline.getHours() + Math.floor(Math.random() * 5) + 1);

    const newRequest = {
      id: `req-${Date.now()}`,
      partnerName: randomPartner.name,
      wasteType: randomWasteType,
      amount: randomKg,
      deadline: deadline.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setPartnerRequests((prev) => [newRequest, ...prev]);
  };

  // --- TRUCK METHODS ---
  const handleCompleteActivity = (id) => {
    const updated = truckActivities.map((act) => {
      if (act.id === id) {
        return {
          ...act,
          status: "completed",
          timestamp: new Date().toISOString(),
        };
      }
      return act;
    });
    localStorage.setItem("truckActivities", JSON.stringify(updated));
    setTruckActivities(updated);
    setActiveMenuId(null);
  };

  const handleCancelActivity = (id) => {
    const filtered = truckActivities.filter((act) => act.id !== id);
    localStorage.setItem("truckActivities", JSON.stringify(filtered));
    setTruckActivities(filtered);
    setActiveMenuId(null);
  };

  // --- PARTNER REQUEST METHODS ---
  const handleCompleteRequest = (req) => {
    // 1. Remove from requests
    setPartnerRequests((prev) => prev.filter((r) => r.id !== req.id));
    setActiveRequestMenuId(null);

    // 2. Add to riwayat-mitra history in localStorage
    const newTx = {
      id: Date.now(),
      nama: req.partnerName,
      tanggal: new Date().toISOString(),
      sampah: [
        {
          tipe:
            req.wasteType === "organik"
              ? "Limbah Sayuran & Makanan"
              : "Sampah Terpilah Industri",
          berat: req.amount,
          kategori: req.wasteType.includes("non") ? "non-organik" : "organik",
        },
      ],
    };

    try {
      const txHistory =
        JSON.parse(localStorage.getItem("samling_transactions")) || [];
      txHistory.unshift(newTx);
      localStorage.setItem("samling_transactions", JSON.stringify(txHistory));
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancelRequest = (id) => {
    setPartnerRequests((prev) => prev.filter((r) => r.id !== id));
    setActiveRequestMenuId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col text-gray-900 dark:text-gray-100 pb-24 transition-colors duration-200">
      {/* Header */}
      <Header
        title="Aktivitas"
        subtitle="Pantau armada truk & permintaan mitra"
      />

      {/* Tabs */}
      <div className="px-4 md:px-8 pt-6 flex justify-center">
        <nav className="bg-white dark:bg-slate-800 shadow-sm border border-gray-100 dark:border-slate-700/50 p-1.5 rounded-2xl flex max-w-sm w-full transition-colors duration-200">
          <button
            onClick={() => setCurrentTab("truck")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              currentTab === "truck"
                ? "bg-green-600 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Aktivitas Truk
          </button>
          <button
            onClick={() => setCurrentTab("partner")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              currentTab === "partner"
                ? "bg-green-600 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Permintaan Mitra
          </button>
        </nav>
      </div>

      {/* Main Content Area */}
      <main className="grow px-4 md:px-8 py-6">
        {/* VIEW 1: TRUCK ACTIVITIES */}
        {currentTab === "truck" && (
          <div className="space-y-4 max-w-xl mx-auto">
            {truckActivities.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-10">
                Tidak ada aktivitas armada.
              </p>
            ) : (
              <div className="flex flex-col gap-4 border-l-2 border-gray-200 dark:border-slate-700 pl-4 py-2 ml-4">
                {truckActivities.map((item) => {
                  const truck = defaultTrucks.find(
                    (t) => t.id === item.truckId,
                  );
                  if (!truck) return null;

                  const isOngoing = item.status === "ongoing";
                  const isReady = item.status === "ready";
                  const isCompleted = item.status === "completed";

                  // Style mappings
                  let statusClass =
                    "text-green-700 bg-green-50 border-green-200 dark:bg-green-950/20 dark:text-emerald-400 dark:border-green-900/30";
                  let statusText = "Selesai";
                  let icon = faCheckCircle;

                  if (isOngoing) {
                    statusClass =
                      "text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30";
                    statusText = "Dalam Perjalanan";
                    icon = faTruckFast;
                  } else if (isReady) {
                    statusClass =
                      "text-yellow-750 bg-yellow-50 border-yellow-250 dark:bg-yellow-950/20 dark:text-yellow-400 dark:border-yellow-900/30";
                    statusText = "Siap Berangkat";
                    icon = faClock;
                  }

                  return (
                    <div
                      key={item.id}
                      className="relative bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-gray-150 dark:border-slate-700 flex flex-col transition-colors duration-200"
                    >
                      {/* Timeline Dot Indicator */}
                      <span
                        className={`absolute -left-[25px] top-7 block h-4.5 w-4.5 rounded-full border-2 border-white dark:border-slate-900 ${
                          isOngoing
                            ? "bg-blue-500 animate-pulse"
                            : isReady
                              ? "bg-yellow-500"
                              : "bg-green-500"
                        }`}
                      ></span>

                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <FontAwesomeIcon
                            icon={icon}
                            className="text-gray-400 dark:text-slate-500 text-lg"
                          />
                          <h4 className="font-bold text-gray-850 dark:text-white">
                            {truck.name} -{" "}
                            <span className="font-mono text-sm">
                              {truck.plate}
                            </span>
                          </h4>
                        </div>

                        {/* Options menu for Ongoing items */}
                        {isOngoing && (
                          <div className="relative">
                            <button
                              onClick={() =>
                                setActiveMenuId(
                                  activeMenuId === item.id ? null : item.id,
                                )
                              }
                              className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 w-8 h-8 rounded-full hover:bg-gray-50 dark:hover:bg-slate-750 flex items-center justify-center cursor-pointer focus:outline-none"
                            >
                              <FontAwesomeIcon icon={faEllipsisVertical} />
                            </button>

                            {activeMenuId === item.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-30"
                                  onClick={() => setActiveMenuId(null)}
                                />
                                <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl overflow-hidden shadow-xl z-40 animate-slide-in">
                                  <button
                                    onClick={() =>
                                      handleCompleteActivity(item.id)
                                    }
                                    className="flex items-center gap-2 w-full px-4 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 text-left cursor-pointer"
                                  >
                                    <FontAwesomeIcon
                                      icon={faCheck}
                                      className="text-green-500"
                                    />
                                    Selesaikan
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleCancelActivity(item.id)
                                    }
                                    className="flex items-center gap-2 w-full px-4 py-2.5 text-xs font-bold text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 text-left cursor-pointer border-t border-gray-50 dark:border-slate-700"
                                  >
                                    <FontAwesomeIcon icon={faTrashCan} />
                                    Batalkan
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Route Path */}
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-2.5 pl-7">
                        {item.route}
                      </p>

                      {/* Driver details */}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 pl-7">
                        Sopir: {truck.driver}
                      </p>

                      <div className="flex items-center justify-between mt-4 pl-7">
                        <span className="text-[10px] text-gray-400 dark:text-slate-500">
                          {formatTime(item.timestamp)}
                        </span>
                        <span
                          className={`text-[11px] font-bold border px-2.5 py-1 rounded-full ${statusClass}`}
                        >
                          {statusText}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: PARTNER DEMANDS / REQUESTS */}
        {currentTab === "partner" && (
          <div className="space-y-4 max-w-xl mx-auto">
            {/* Riwayat Link */}
            <div className="flex justify-end mb-2">
              <button
                onClick={() => navigate("/riwayat-mitra")}
                className="flex items-center gap-1.5 text-xs font-bold text-green-600 dark:text-emerald-400 hover:underline cursor-pointer bg-white dark:bg-slate-800 px-3 py-2 rounded-xl shadow-xs border border-gray-100 dark:border-slate-700"
              >
                <FontAwesomeIcon icon={faHistory} />
                Riwayat Transaksi
              </button>
            </div>

            {partnerRequests.length === 0 ? (
              <div className="text-center bg-white dark:bg-slate-800 rounded-2xl p-10 border border-gray-150 dark:border-slate-700 flex flex-col justify-center items-center">
                <p className="text-gray-500 dark:text-gray-400">
                  Tidak ada permintaan aktif dari mitra.
                </p>
                <button
                  onClick={generateRandomRequest}
                  className="mt-4 px-4 py-2 bg-brand hover:bg-brand-strong text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Picu Permintaan Baru
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {partnerRequests.map((req) => {
                  const isOrg = req.wasteType === "organik";
                  const themeColor = isOrg
                    ? "text-green-650 bg-green-50/80 border-green-200 dark:bg-green-950/20 dark:text-emerald-400 dark:border-green-900/30"
                    : "text-cyan-650 bg-cyan-50/80 border-cyan-200 dark:bg-cyan-950/20 dark:text-cyan-400 dark:border-cyan-900/30";

                  return (
                    <div
                      key={req.id}
                      className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-gray-150 dark:border-slate-700 flex items-start gap-4 transition-colors duration-200"
                    >
                      <div className="grow min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-gray-850 dark:text-white truncate">
                            {req.partnerName}
                          </h4>

                          {/* Ellipsis Menu Actions */}
                          <div className="relative">
                            <button
                              onClick={() =>
                                setActiveRequestMenuId(
                                  activeRequestMenuId === req.id
                                    ? null
                                    : req.id,
                                )
                              }
                              className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 w-8 h-8 rounded-full hover:bg-gray-50 dark:hover:bg-slate-750 flex items-center justify-center cursor-pointer focus:outline-none"
                            >
                              <FontAwesomeIcon icon={faEllipsisVertical} />
                            </button>

                            {activeRequestMenuId === req.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-35"
                                  onClick={() => setActiveRequestMenuId(null)}
                                />
                                <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl overflow-hidden shadow-xl z-40 animate-slide-in">
                                  <button
                                    onClick={() => handleCompleteRequest(req)}
                                    className="flex items-center gap-2 w-full px-4 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 text-left cursor-pointer"
                                  >
                                    <FontAwesomeIcon
                                      icon={faCheck}
                                      className="text-green-500"
                                    />
                                    Selesaikan
                                  </button>
                                  <button
                                    onClick={() => handleCancelRequest(req.id)}
                                    className="flex items-center gap-2 w-full px-4 py-2.5 text-xs font-bold text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 text-left cursor-pointer border-t border-gray-50 dark:border-slate-700"
                                  >
                                    <FontAwesomeIcon icon={faTrashCan} />
                                    Batalkan
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Request content */}
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 font-medium">
                          Memerlukan pasokan sampah{" "}
                          <span className="font-bold">{req.wasteType}</span>{" "}
                          sebanyak{" "}
                          <span className="font-bold text-brand dark:text-emerald-400">
                            {req.amount} kg
                          </span>
                          .
                        </p>

                        <div className="flex items-center justify-between mt-4 pt-2 border-t border-gray-50 dark:border-slate-750">
                          <span className="text-xs text-gray-400 dark:text-slate-500">
                            Tenggat Hari Ini:{" "}
                            <span className="font-mono font-bold text-gray-700 dark:text-slate-300">
                              {req.deadline}
                            </span>
                          </span>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${themeColor}`}
                          >
                            {req.wasteType}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Shared Bottom Nav */}
      <BottomNav />
    </div>
  );
}
