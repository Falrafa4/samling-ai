import { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartLine,
  faHashtag,
  faTriangleExclamation,
  faCalendarDays,
  faFilter,
  faChevronLeft,
  faChevronRight,
  faSpinner,
  faArrowsRotate,
} from '@fortawesome/free-solid-svg-icons';
import { api } from '../services/api';
import Header from '../components/Header';
import StatCard from '../components/fragments/StatCard';
import AccuracyBar from '../components/fragments/AccuracyBar';
import { fmtDate, fmtDateTime } from '../utils/helpers';
import SearchableSelect from '../components/fragments/SearchableSelect';

// Helper: confidence badge styling
function confidenceBadge(score) {
  if (score >= 0.8) return 'bg-emerald-100 text-emerald-700';
  if (score >= 0.5) return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
}

export default function AIPredictions() {
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [history, setHistory] = useState({ items: [], total: 0, page: 1, per_page: 15, total_pages: 1 });
  const [zones, setZones] = useState([]);
  const [selectedZoneFilter, setSelectedZoneFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [trendDays, setTrendDays] = useState(30);
  const [histPage, setHistPage] = useState(1);
  const zoneFilterOptions = [
    { value: '', label: 'Semua Zona' },
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
    } catch { /* silent */ }
  }, []);

  // Fetch trend
  const fetchTrend = useCallback(async () => {
    try {
      const res = await api.getAccuracyTrend(trendDays);
      if (res.success) setTrend(res.data || []);
    } catch { /* silent */ }
  }, [trendDays]);

  // Fetch history
  const fetchHistory = useCallback(async () => {
    try {
      const res = await api.getPredictionsHistory(histPage, 10, selectedZoneFilter || null);
      if (res.success) setHistory(res.data);
    } catch { /* silent */ }
  }, [histPage, selectedZoneFilter]);

  // Fetch zones for filter
  const fetchZones = useCallback(async () => {
    try {
      const res = await api.getZones();
      if (res.success) setZones(res.data || []);
    } catch { /* silent */ }
  }, []);

  // Initial load
  useEffect(() => {
    setLoading(true);
    Promise.all([fetchSummary(), fetchTrend(), fetchHistory(), fetchZones()])
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Refetch trend when trendDays changes
  useEffect(() => { fetchTrend(); }, [fetchTrend]);

  // Refetch history when page/filter changes
  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleRefresh = () => {
    setLoading(true);
    Promise.all([fetchSummary(), fetchTrend(), fetchHistory()])
      .finally(() => setLoading(false));
  };

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <FontAwesomeIcon icon={faSpinner} className="text-primary-500 text-2xl animate-spin" />
      </div>
    );
  }

  // Refresh button component for header
  const headerRightContent = (
    <button
      onClick={handleRefresh}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 bg-white dark:bg-slate-800 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors disabled:opacity-50 cursor-pointer"
    >
      <FontAwesomeIcon icon={faArrowsRotate} className={loading ? 'animate-spin' : ''} />
      Refresh
    </button>
  );

  return (
    <div className="flex-1 flex flex-col bg-slate-50 relative">
      {/* Header component using separation of concerns */}
      <Header
        title="Prediksi AI"
        subtitle="Monitoring hasil dan performa model prediksi volume sampah"
        rightContent={headerRightContent}
      />

      {/* Main Content Area with appropriate paddings and spacing (mobile & desktop friendly) */}
      <div className="p-4 md:p-8 space-y-6 pb-24 md:pb-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={faHashtag}
            label="Total Prediksi"
            value={summary?.total_predictions ?? 0}
            color="primary"
          />
          <StatCard
            icon={faChartLine}
            label="Rata-rata Confidence"
            value={summary ? `${Math.round(summary.avg_confidence_score * 100)}%` : '0%'}
            color="emerald"
          />
          <StatCard
            icon={faCalendarDays}
            label="Prediksi 7 Hari ke Depan"
            value={summary?.upcoming_predictions_7d ?? 0}
            color="amber"
          />
          <StatCard
            icon={faTriangleExclamation}
            label="Zona Akurasi Terendah"
            value={summary?.lowest_accuracy_zone?.zone_name ?? '-'}
            sub={summary?.lowest_accuracy_zone ? `Confidence: ${Math.round(summary.lowest_accuracy_zone.avg_confidence * 100)}%` : null}
            color="red"
          />
        </div>

        {/* Two column: Trend + History */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Accuracy Trend */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700">Tren Akurasi AI</h2>
              <select
                value={trendDays}
                onChange={(e) => setTrendDays(Number(e.target.value))}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none focus:ring-1 focus:ring-primary-400"
              >
                <option value={7}>7 hari</option>
                <option value={14}>14 hari</option>
                <option value={30}>30 hari</option>
                <option value={60}>60 hari</option>
                <option value={90}>90 hari</option>
              </select>
            </div>
            {trend.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Belum ada data tren.</p>
            ) : (
              <div className="space-y-2.5 max-h-100 overflow-y-auto pr-1">
                {trend.map((t) => (
                  <AccuracyBar key={t.date} date={t.date} avgConfidence={t.avg_confidence} count={t.prediction_count} />
                ))}
              </div>
            )}
          </div>

          {/* History Table */}
          <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="text-sm font-semibold text-gray-700">Riwayat Prediksi</h2>
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faFilter} className="text-gray-400 text-xs" />
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
              <p className="text-sm text-gray-400 text-center py-8">Belum ada riwayat prediksi.</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-left">
                        <th className="pb-2 pr-3 text-xs font-medium text-gray-500">Zona</th>
                        <th className="pb-2 pr-3 text-xs font-medium text-gray-500">Volume (m³)</th>
                        <th className="pb-2 pr-3 text-xs font-medium text-gray-500">Target</th>
                        <th className="pb-2 pr-3 text-xs font-medium text-gray-500">Confidence</th>
                        <th className="pb-2 text-xs font-medium text-gray-500">Dibuat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.items.map((item) => (
                        <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                          <td className="py-2.5 pr-3 text-gray-700 font-medium">{item.zone_name}</td>
                          <td className="py-2.5 pr-3 text-gray-600">{item.predicted_volume?.toFixed(1)}</td>
                          <td className="py-2.5 pr-3 text-gray-500 text-xs">{fmtDate(item.target_time)}</td>
                          <td className="py-2.5 pr-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${confidenceBadge(item.confidence_score)}`}>
                              {Math.round(item.confidence_score * 100)}%
                            </span>
                          </td>
                          <td className="py-2.5 text-gray-400 text-xs">{fmtDateTime(item.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400">
                    Hal {history.page} / {history.total_pages} · {history.total} data
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setHistPage((p) => Math.max(1, p - 1))}
                      disabled={histPage <= 1}
                      className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
                    </button>
                    <button
                      onClick={() => setHistPage((p) => Math.min(history.total_pages, p + 1))}
                      disabled={histPage >= history.total_pages}
                      className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}