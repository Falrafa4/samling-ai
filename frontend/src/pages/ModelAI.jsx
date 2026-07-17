import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBrain,
  faSpinner,
  faCheckCircle,
  faDatabase,
  faMicrochip,
  faChartBar,
  faClock,
  faGear,
  faRocket,
  faCubes,
  faArrowRight,
  faCalendarDays,
  faStopwatch,
  faBolt,
  faLayerGroup,
  faTriangleExclamation,
  faCircleInfo,
} from "@fortawesome/free-solid-svg-icons";
import { api } from "../services/api";
import Header from "../components/Header";
import { fmtDateTime } from "../utils/helpers";

const KEY_HYPERPARAMS = [
  { key: "objective", label: "Objective", format: (v) => v?.replace("reg:", "") || "-" },
  { key: "learning_rate", label: "Learning Rate", format: (v) => v ?? "-" },
  { key: "max_depth", label: "Max Depth", format: (v) => v ?? "-" },
  { key: "n_estimators", label: "n Estimators", format: (v) => v ?? "-" },
  { key: "subsample", label: "Subsample", format: (v) => v ?? "-" },
  { key: "colsample_bytree", label: "Col Sample By Tree", format: (v) => v ?? "-" },
  { key: "min_child_weight", label: "Min Child Weight", format: (v) => v ?? "-" },
  { key: "early_stopping_rounds", label: "Early Stopping Rounds", format: (v) => v ?? "-" },
  { key: "random_state", label: "Random State", format: (v) => v ?? "-" },
  { key: "tree_method", label: "Tree Method", format: (v) => v ?? "-" },
  { key: "enable_categorical", label: "Enable Categorical", format: (v) => (v ? "Ya" : "Tidak") },
  { key: "n_jobs", label: "Parallel Jobs", format: (v) => (v === -1 ? "Semua Core" : v ?? "-") },
];

const METRIC_COLORS = {
  MAE: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", value: "text-blue-800" },
  MAPE: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", value: "text-amber-800" },
  RMSE: { bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-700", value: "text-violet-800" },
  R2: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", value: "text-emerald-800" },
  "Best CV Score": { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", value: "text-rose-800" },
};

const METRIC_DESCRIPTIONS = {
  MAE: "Rata-rata selisih absolut antara prediksi dan aktual",
  MAPE: "Rata-rata persentase error relatif terhadap nilai aktual",
  RMSE: "Akar mean squared error, memberikan bobot lebih pada error besar",
  R2: "Koefisien determinasi, proporsi variansi yang dijelaskan model",
  "Best CV Score": "Skor terbaik dari cross-validation selama training",
};

export default function ModelAI() {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchDetails() {
      try {
        setLoading(true);
        const res = await api.getModelDetails();
        if (res.success) {
          setDetails(res.data);
        }
      } catch (err) {
        setError(err.message || "Gagal memuat detail model AI.");
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
        <Header
          title="Model AI Info"
          subtitle="Informasi lengkap seputar model machine learning Samling"
          icon={faBrain}
          iconColor="text-indigo-600"
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <FontAwesomeIcon icon={faSpinner} className="text-indigo-500 text-2xl animate-spin" />
            <span className="text-xs font-semibold text-slate-400">Memuat informasi model AI...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
        <Header
          title="Model AI Info"
          subtitle="Informasi lengkap seputar model machine learning Samling"
          icon={faBrain}
          iconColor="text-indigo-600"
        />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="bg-white border border-red-200 rounded-xl p-8 max-w-md text-center shadow-2xs">
            <FontAwesomeIcon icon={faTriangleExclamation} className="text-red-400 text-3xl mb-3" />
            <p className="text-sm font-semibold text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const info = details?.model_informations || {};
  const metrics = details?.performance_metrics || {};
  const hyperparams = details?.hyperparameters || {};
  const featureImportance = details?.feature_importance || [];
  const schedulerJobs = details?.scheduler_jobs || [];
  const coverage = details?.dataset_coverage || [];
  const features = details?.dataset_features || [];

  const maxImportance = Math.max(...featureImportance.map((f) => f.Importance), 0.001);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50 relative">
      <div className="flex-1 overflow-y-auto">
        <Header
          title="Model AI Info"
          subtitle="Informasi lengkap seputar arsitektur, performa, dan pipeline model machine learning Samling"
          icon={faBrain}
          iconColor="text-indigo-600"
        />

        <div className="px-4 sm:px-8 py-4 sm:py-6 space-y-6">

          {/* ── MODEL OVERVIEW CARDS ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                <FontAwesomeIcon icon={faBrain} className="text-indigo-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 font-medium">Nama Model</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5 truncate" title={info.model_name}>
                  {info.model_name || "-"}
                </p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                <FontAwesomeIcon icon={faCheckCircle} className="text-emerald-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 font-medium">Versi</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{info.model_version || "-"}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                <FontAwesomeIcon icon={faCalendarDays} className="text-amber-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 font-medium">Terakhir Dilatih</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{fmtDateTime(info.model_training_date)}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
                <FontAwesomeIcon icon={faCubes} className="text-rose-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 font-medium">Ukuran Model</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{info.model_size_mb ? `${info.model_size_mb} MB` : "-"}</p>
              </div>
            </div>
          </div>

          {/* ── DESCRIPTION ── */}
          {info.model_description && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
              <div className="flex items-center gap-2 mb-2">
                <FontAwesomeIcon icon={faCircleInfo} className="text-indigo-500 text-xs" />
                <h3 className="text-sm font-bold text-slate-700">Tentang Model</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{info.model_description}</p>
            </div>
          )}

          {/* ── ROW: PERFORMANCE METRICS + TRAINING INFO ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Performance Metrics (2 cols) */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
              <div className="flex items-center gap-2 mb-4">
                <FontAwesomeIcon icon={faChartBar} className="text-indigo-500 text-xs" />
                <h3 className="text-sm font-bold text-slate-700">Performance Metrics</h3>
              </div>
              {Object.keys(metrics).length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">Belum ada data metrik.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(metrics).map(([key, value]) => {
                    const style = METRIC_COLORS[key] || { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-600", value: "text-slate-800" };
                    const formattedVal = key === "MAPE" ? `${(value * 100).toFixed(2)}%` : typeof value === "number" ? value.toFixed(5) : value;
                    return (
                      <div key={key} className={`${style.bg} ${style.border} border rounded-lg p-3`}>
                        <span className={`text-[10px] ${style.text} font-bold uppercase block`}>{key}</span>
                        <span className={`text-lg font-extrabold ${style.value} mt-0.5 block`}>{formattedVal}</span>
                        <span className="text-[9px] text-slate-400 mt-0.5 block leading-tight">{METRIC_DESCRIPTIONS[key]}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Training & Inference Info (1 col) */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <FontAwesomeIcon icon={faStopwatch} className="text-indigo-500 text-xs" />
                <h3 className="text-sm font-bold text-slate-700">Waktu Eksekusi</h3>
              </div>
              <div className="space-y-3 flex-1">
                <div className="bg-slate-50 rounded-lg border border-slate-100 p-3">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Training Time</span>
                  <span className="text-sm font-extrabold text-slate-800 mt-0.5 block">{details.training_time || "-"}</span>
                </div>
                <div className="bg-slate-50 rounded-lg border border-slate-100 p-3">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Inference Time</span>
                  <span className="text-sm font-extrabold text-slate-800 mt-0.5 block">{details.inference_time || "-"}</span>
                </div>
                <div className="bg-slate-50 rounded-lg border border-slate-100 p-3">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Forecast Time (all TPS)</span>
                  <span className="text-sm font-extrabold text-slate-800 mt-0.5 block">{details.forecast_time || "-"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── ROW: FEATURE IMPORTANCE + HYPERPARAMETERS ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

            {/* Feature Importance (3 cols) */}
            <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
              <div className="flex items-center gap-2 mb-4">
                <FontAwesomeIcon icon={faLayerGroup} className="text-indigo-500 text-xs" />
                <h3 className="text-sm font-bold text-slate-700">Feature Importance</h3>
              </div>
              {featureImportance.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">Belum ada data feature importance.</p>
              ) : (
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {featureImportance.map((f, idx) => {
                    const pct = maxImportance > 0 ? (f.Importance / maxImportance) * 100 : 0;
                    const barColor = pct > 70 ? "bg-indigo-500" : pct > 30 ? "bg-indigo-400" : "bg-indigo-300";
                    return (
                      <div key={f.Feature} className="flex items-center gap-3">
                        <span className="text-[10px] text-slate-500 font-semibold w-[140px] shrink-0 truncate" title={f.Feature}>
                          {f.Feature}
                        </span>
                        <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 w-16 text-right shrink-0">
                          {(f.Importance * 100).toFixed(2)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Hyperparameters (2 cols) */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
              <div className="flex items-center gap-2 mb-4">
                <FontAwesomeIcon icon={faGear} className="text-indigo-500 text-xs" />
                <h3 className="text-sm font-bold text-slate-700">Hyperparameters</h3>
              </div>
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {KEY_HYPERPARAMS.map(({ key, label, format }) => {
                  const val = hyperparams[key];
                  if (val === undefined || val === null) return null;
                  return (
                    <div key={key} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                      <span className="text-[11px] text-slate-500 font-medium">{label}</span>
                      <span className="text-[11px] font-bold text-slate-800">{format(val)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── ROW: DATASET INFO + SCHEDULER JOBS ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

            {/* Dataset Information (3 cols) */}
            <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
              <div className="flex items-center gap-2 mb-4">
                <FontAwesomeIcon icon={faDatabase} className="text-indigo-500 text-xs" />
                <h3 className="text-sm font-bold text-slate-700">Dataset Information</h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                <div className="bg-slate-50 rounded-lg border border-slate-100 p-3">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Total Records</span>
                  <span className="text-sm font-extrabold text-slate-800 mt-0.5 block">
                    {details.dataset_records?.toLocaleString("id-ID") || "-"}
                  </span>
                </div>
                <div className="bg-slate-50 rounded-lg border border-slate-100 p-3">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Jumlah TPS</span>
                  <span className="text-sm font-extrabold text-slate-800 mt-0.5 block">
                    {details.dataset_TPS?.toLocaleString("id-ID") || "-"}
                  </span>
                </div>
                <div className="bg-slate-50 rounded-lg border border-slate-100 p-3">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Label / Target</span>
                  <span className="text-xs font-extrabold text-indigo-600 mt-0.5 block">{details.dataset_label || "-"}</span>
                </div>
                <div className="bg-slate-50 rounded-lg border border-slate-100 p-3 sm:col-span-2 lg:col-span-3">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Time Range</span>
                  <span className="text-xs font-bold text-slate-800 mt-0.5 block">{details.time_range || "-"}</span>
                </div>
              </div>

              {/* Features List */}
              {features.length > 0 && (
                <div className="mb-4">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-2">Fitur Input Model</span>
                  <div className="flex flex-wrap gap-1.5">
                    {features.map((f) => (
                      <span
                        key={f}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-600 border border-indigo-200"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Coverage */}
              {coverage.length > 0 && (
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-2">
                    Cakupan Kecamatan ({coverage.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pr-1">
                    {coverage.map((c) => (
                      <span
                        key={c}
                        className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-50 text-slate-600 border border-slate-200"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Scheduler Jobs (2 cols) */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
              <div className="flex items-center gap-2 mb-4">
                <FontAwesomeIcon icon={faClock} className="text-indigo-500 text-xs" />
                <h3 className="text-sm font-bold text-slate-700">Scheduler Pipeline Jobs</h3>
              </div>
              <p className="text-[11px] text-slate-400 mb-4">
                Semua job dijalankan otomatis oleh APScheduler menggunakan cron expression (Asia/Jakarta timezone).
              </p>
              {schedulerJobs.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">Belum ada data scheduler.</p>
              ) : (
                <div className="space-y-2.5">
                  {schedulerJobs.map((job) => (
                    <div
                      key={job.name}
                      className="flex items-center gap-3 bg-slate-50 rounded-lg border border-slate-100 p-3 hover:border-indigo-200 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                        <FontAwesomeIcon icon={faRocket} className="text-indigo-500 text-[11px]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-slate-700 truncate">{job.description}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{job.cron}</p>
                      </div>
                      <FontAwesomeIcon icon={faArrowRight} className="text-slate-300 text-[10px] shrink-0" />
                    </div>
                  ))}
                </div>
              )}

              {/* Pipeline Flow */}
              <div className="mt-5 pt-4 border-t border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-2">Alur Pipeline Harian</span>
                <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-semibold text-slate-600">
                  {[
                    { label: "Collect Data", icon: faDatabase },
                    { label: "Feature Eng.", icon: faGear },
                    { label: "Forecast", icon: faBolt },
                    { label: "Route Plan", icon: faArrowRight },
                  ].map((step, idx) => (
                    <span key={step.label} className="flex items-center gap-1">
                      <span className="px-2 py-1 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center gap-1">
                        <FontAwesomeIcon icon={step.icon} className="text-[8px]" />
                        {step.label}
                      </span>
                      {idx < 3 && <FontAwesomeIcon icon={faArrowRight} className="text-slate-300 text-[8px]" />}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
