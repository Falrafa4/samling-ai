import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFilter,
  faLayerGroup,
  faCommentDots,
  faCheckCircle,
  faCircleCheck,
  faSpinner,
  faXmark,
  faMagnifyingGlassPlus,
  faClock,
  faExclamationTriangle,
  faInbox,
  faArrowRight,
  faCheckDouble,
  faHourglassHalf,
  faClipboardList,
  faPaperPlane
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { api } from '../services/api';

const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const baseUrl = import.meta.env.VITE_BASE_API_URL;
  return `${baseUrl}/${path.replace(/^\/+/, '')}`;
};

const COLUMNS = [
  {
    key: 'Baru',
    icon: faHourglassHalf,
    headerBorderClass: 'border-amber-200',
    headerIconClass: 'text-amber-500',
    dotClass: 'bg-amber-400',
    badgeClass: 'bg-amber-50 text-amber-700',
    dragOverClass: 'bg-amber-50/80 border-2 border-amber-400 border-dashed shadow-md',
    tabActiveBorder: 'border-amber-500',
    tabActiveText: 'text-amber-600',
    tabActiveBg: 'bg-amber-50',
  },
  {
    key: 'Sedang Ditangani',
    icon: faArrowRight,
    headerBorderClass: 'border-blue-200',
    headerIconClass: 'text-blue-500',
    dotClass: 'bg-blue-400',
    badgeClass: 'bg-blue-50 text-blue-700',
    dragOverClass: 'bg-blue-50/80 border-2 border-blue-400 border-dashed shadow-md',
    tabActiveBorder: 'border-blue-500',
    tabActiveText: 'text-blue-600',
    tabActiveBg: 'bg-blue-50',
  },
  {
    key: 'Selesai',
    icon: faCheckDouble,
    headerBorderClass: 'border-emerald-200',
    headerIconClass: 'text-emerald-500',
    dotClass: 'bg-emerald-400',
    badgeClass: 'bg-emerald-50 text-emerald-700',
    dragOverClass: 'bg-emerald-50/80 border-2 border-emerald-400 border-dashed shadow-md',
    tabActiveBorder: 'border-emerald-500',
    tabActiveText: 'text-emerald-600',
    tabActiveBg: 'bg-emerald-50',
  },
];

const ZONE_COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];

function timeAgo(dateStr) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Baru saja';
  if (mins < 60) return `${mins} menit lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} jam lalu`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} hari lalu`;
  return new Date(dateStr).toLocaleDateString('id-ID');
}

function getNextStatus(current) {
  if (current === 'Baru') return 'Sedang Ditangani';
  if (current === 'Sedang Ditangani') return 'Selesai';
  return null;
}

function getPrevStatus(current) {
  if (current === 'Sedang Ditangani') return 'Baru';
  if (current === 'Selesai') return 'Sedang Ditangani';
  return null;
}

export default function CitizenReports() {
  const [reports, setReports] = useState([]);
  const [zones, setZones] = useState([]);
  const [selectedZoneFilter, setSelectedZoneFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [draggingOverColumn, setDraggingOverColumn] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [lightboxImage, setLightboxImage] = useState(null);
  const [replyReport, setReplyReport] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replySending, setReplySending] = useState(false);
  const [activeTab, setActiveTab] = useState('Baru');

  async function fetchReportsAndZones() {
    try {
      setLoading(true);
      const [reportsRes, zonesRes] = await Promise.all([
        api.getCitizenReports(),
        api.getZones()
      ]);
      if (reportsRes.success) setReports(reportsRes.data || []);
      if (zonesRes.success) setZones(zonesRes.data || []);
    } catch (err) {
      setErrorMessage(err.message || 'Gagal mengambil data aduan warga.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReportsAndZones();
  }, []);

  useEffect(() => {
    if (!successMessage && !errorMessage) return;
    const timer = setTimeout(() => {
      setSuccessMessage('');
      setErrorMessage('');
    }, 5000);
    return () => clearTimeout(timer);
  }, [successMessage, errorMessage]);

  async function changeReportStatus(reportId, newStatus) {
    const report = reports.find((r) => r.id === reportId);
    if (!report || report.status === newStatus) return;
    try {
      setUpdatingId(reportId);
      setErrorMessage('');
      setSuccessMessage('');
      const res = await api.updateCitizenReportStatus(reportId, newStatus);
      if (res.success) {
        setSuccessMessage(
          `Status aduan #${reportId} berhasil diubah menjadi '${newStatus}'`
        );
        setReports((prev) =>
          prev.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r))
        );
      }
    } catch (err) {
      setErrorMessage(err.message || 'Gagal memperbarui status aduan.');
    } finally {
      setUpdatingId(null);
    }
  }

  function handleDragStart(e, reportId) {
    e.dataTransfer.setData('text/plain', reportId.toString());
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragEnd() {
    setDraggingOverColumn(null);
  }

  function handleDragOver(e, column) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDraggingOverColumn(column);
  }

  function handleDragLeave(e, column) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDraggingOverColumn((prev) => (prev === column ? null : prev));
    }
  }

  function handleDrop(e, targetStatus) {
    e.preventDefault();
    setDraggingOverColumn(null);
    const reportId = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (!reportId) return;
    changeReportStatus(reportId, targetStatus);
  }

  function insertTemplate(template) {
    setReplyText(template);
  }

  async function handleSendReply() {
    if (!replyReport || !replyText.trim()) return;
    try {
      setReplySending(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSuccessMessage(
        `Balasan WhatsApp berhasil dikirim ke nomor warga ${replyReport.whatsapp_number}`
      );
      setReplyReport(null);
      setReplyText('');
    } catch (err) {
      setErrorMessage('Gagal mengirim pesan balasan WhatsApp.');
    } finally {
      setReplySending(false);
    }
  }

  const filteredReports = selectedZoneFilter
    ? reports.filter((r) => r.zone_id === parseInt(selectedZoneFilter, 10))
    : reports;

  const activeColumnReports = filteredReports.filter((r) => r.status === activeTab);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col h-full bg-slate-50">
        <header className="px-4 sm:px-6 lg:px-8 py-4 lg:py-6 bg-white border-b border-slate-200 shrink-0">
          <div className="h-6 lg:h-7 w-48 lg:w-64 bg-slate-200 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-64 lg:w-96 bg-slate-100 rounded-lg animate-pulse" />
        </header>
        <div className="hidden md:flex flex-1 overflow-x-auto px-4 lg:px-8 py-4 lg:py-8 gap-4 lg:gap-6 items-start">
          {[1, 2, 3].map((col) => (
            <div key={col} className="w-[280px] lg:w-[340px] shrink-0 bg-slate-100/70 border border-slate-200 rounded-xl p-4 flex flex-col max-h-full">
              <div className="h-5 w-28 bg-slate-200 rounded animate-pulse mb-4" />
              {[1, 2].map((card) => (
                <div key={card} className="p-4 bg-white border border-slate-200 rounded-xl mb-3 space-y-3">
                  <div className="h-3 w-20 bg-slate-100 rounded animate-pulse" />
                  <div className="h-3 w-full bg-slate-100 rounded animate-pulse" />
                  <div className="h-3 w-3/4 bg-slate-100 rounded animate-pulse" />
                  <div className="h-24 bg-slate-100 rounded-lg animate-pulse" />
                  <div className="flex justify-between">
                    <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
                    <div className="h-6 w-6 bg-slate-100 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="flex md:hidden flex-1 flex-col p-4 space-y-3">
          {[1, 2, 3].map((card) => (
            <div key={card} className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2.5">
              <div className="h-2.5 w-20 bg-slate-100 rounded animate-pulse" />
              <div className="h-2.5 w-full bg-slate-100 rounded animate-pulse" />
              <div className="h-2.5 w-2/3 bg-slate-100 rounded animate-pulse" />
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-slate-100 rounded-lg animate-pulse" />
                <div className="h-2.5 w-24 bg-slate-100 rounded animate-pulse" />
              </div>
              <div className="flex justify-between">
                <div className="h-2.5 w-20 bg-slate-100 rounded animate-pulse" />
                <div className="h-6 w-16 bg-slate-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50">
      {/* Header */}
      <header className="px-4 sm:px-6 lg:px-8 py-4 lg:py-6 bg-white border-b border-slate-200 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg lg:text-2xl font-bold text-slate-800 tracking-tight">
              Laporan Pengaduan Warga
            </h2>
            <p className="text-xs lg:text-sm text-slate-500 mt-0.5 truncate">
              Kelola pengaduan penumpukan sampah yang dikirim oleh masyarakat.
            </p>
          </div>

          <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
            {successMessage && (
              <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-lg animate-fade-in shadow-xs">
                <FontAwesomeIcon icon={faCircleCheck} className="text-emerald-500 shrink-0" />
                <span className="truncate max-w-[240px]">{successMessage}</span>
              </div>
            )}
            {errorMessage && (
              <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-lg animate-shake shadow-xs">
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 shrink-0" />
                <span className="truncate max-w-[240px]">{errorMessage}</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 lg:gap-2">
              <span className="text-[10px] lg:text-xs font-semibold text-slate-400 flex items-center gap-1">
                <FontAwesomeIcon icon={faFilter} />
                <span className="hidden sm:inline">Filter:</span>
              </span>
              <select
                value={selectedZoneFilter}
                onChange={(e) => setSelectedZoneFilter(e.target.value)}
                className="bg-white border border-slate-200 px-2 lg:px-3 py-1.5 rounded-lg text-[10px] lg:text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-xs max-w-[140px] lg:max-w-none truncate"
              >
                <option value="">Semua Wilayah</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Mobile flash messages */}
        {(successMessage || errorMessage) && (
          <div className="mt-3 lg:hidden">
            {successMessage && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold rounded-lg animate-fade-in shadow-xs">
                <FontAwesomeIcon icon={faCircleCheck} className="text-emerald-500 shrink-0" />
                <span className="truncate">{successMessage}</span>
              </div>
            )}
            {errorMessage && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 text-red-700 text-[11px] font-semibold rounded-lg animate-shake shadow-xs">
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 shrink-0" />
                <span className="truncate">{errorMessage}</span>
              </div>
            )}
          </div>
        )}
      </header>

      {/* ─── DESKTOP / TABLET: KANBAN BOARD ─── */}
      <div className="hidden md:flex flex-1 overflow-x-auto px-4 lg:px-8 py-4 lg:py-8 gap-4 lg:gap-6 items-start">
        {COLUMNS.map((column) => {
          const columnReports = filteredReports.filter((r) => r.status === column.key);
          const isDragOver = draggingOverColumn === column.key;

          return (
            <div
              key={column.key}
              onDragOver={(e) => handleDragOver(e, column.key)}
              onDragLeave={(e) => handleDragLeave(e, column.key)}
              onDrop={(e) => handleDrop(e, column.key)}
              className={`w-[280px] lg:w-[340px] shrink-0 rounded-xl p-4 flex flex-col max-h-full transition-all duration-200 ${
                isDragOver
                  ? column.dragOverClass
                  : 'bg-slate-100/70 border border-slate-200'
              }`}
            >
              {/* Column Header */}
              <div className={`flex justify-between items-center mb-4 pb-2 border-b shrink-0 select-none ${
                isDragOver ? column.headerBorderClass : 'border-slate-200/60'
              }`}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${column.dotClass}`} />
                  <FontAwesomeIcon
                    icon={column.icon}
                    className={`${column.headerIconClass} text-xs shrink-0`}
                  />
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider truncate">
                    {column.key}
                  </h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    isDragOver ? column.badgeClass : 'bg-slate-200 text-slate-600'
                  }`}>
                    {columnReports.length}
                  </span>
                </div>
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[200px]">
                {columnReports.map((report) => (
                  <DesktopCard
                    key={report.id}
                    report={report}
                    updatingId={updatingId}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onReply={(r) => {
                      setReplyReport(r);
                      setReplyText(
                        `Halo,\n\nPengaduan Anda tentang penumpukan sampah di ${r.zone?.name || 'wilayah Anda'} telah kami terima. Tim supir pengangkut sedang menjadwalkan armada.`
                      );
                    }}
                    onLightbox={setLightboxImage}
                  />
                ))}

                {columnReports.length === 0 && (
                  <div className="py-14 bg-white/50 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 gap-2.5">
                    <FontAwesomeIcon icon={faInbox} className="text-2xl text-slate-300" />
                    <span className="text-xs font-medium">Belum ada pengaduan</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── MOBILE: TAB VIEW ─── */}
      <div className="flex md:hidden flex-1 flex-col overflow-hidden">
        {/* Tab Bar */}
        <div className="flex border-b border-slate-200 bg-white">
          {COLUMNS.map((column) => {
            const count = filteredReports.filter((r) => r.status === column.key).length;
            const isActive = activeTab === column.key;

            return (
              <button
                key={column.key}
                onClick={() => setActiveTab(column.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-3 text-[11px] font-bold whitespace-nowrap border-b-2 transition-all duration-150 ${
                  isActive
                    ? `${column.tabActiveBorder} ${column.tabActiveText} ${column.tabActiveBg}`
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <FontAwesomeIcon icon={column.icon} className="text-[10px]" />
                <span className="truncate hidden xs:inline">{column.key}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-white shadow-xs' : 'bg-slate-100 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Mobile Cards */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {activeColumnReports.map((report) => (
            <MobileCard
              key={report.id}
              report={report}
              updatingId={updatingId}
              onStatusChange={changeReportStatus}
              onReply={(r) => {
                setReplyReport(r);
                setReplyText(
                  `Halo,\n\nPengaduan Anda tentang penumpukan sampah di ${r.zone?.name || 'wilayah Anda'} telah kami terima. Tim supir pengangkut sedang menjadwalkan armada.`
                );
              }}
              onLightbox={setLightboxImage}
            />
          ))}

          {activeColumnReports.length === 0 && (
            <div className="py-16 bg-white/50 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 gap-2.5">
              <FontAwesomeIcon icon={faInbox} className="text-3xl text-slate-300" />
              <span className="text-xs font-medium">Belum ada pengaduan</span>
              <span className="text-[10px] text-slate-300">di kolom {activeTab.toLowerCase()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[85vh] overflow-hidden rounded-xl border border-slate-700 shadow-2xl bg-slate-900 flex items-center justify-center">
            <img
              src={lightboxImage}
              alt="Bukti foto diperbesar"
              className="object-contain max-h-[80vh] w-auto max-w-full"
            />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-950/50 hover:bg-slate-950/80 border border-white/20 text-white flex items-center justify-center transition-colors cursor-pointer backdrop-blur-sm"
            >
              <FontAwesomeIcon icon={faXmark} className="text-lg" />
            </button>
          </div>
        </div>
      )}

      {/* Quick Reply Modal */}
      {replyReport && (
        <div className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="bg-white border border-slate-200 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg shadow-2xl overflow-hidden animate-slide-in sm:animate-modalFade"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 sm:px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div className="min-w-0">
                <h3 className="font-bold text-slate-800 text-sm">Kirim Balasan WhatsApp</h3>
                <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1 truncate">
                  <FontAwesomeIcon icon={faWhatsapp} className="text-emerald-500 shrink-0" />
                  <span className="truncate">{replyReport.whatsapp_number}</span>
                </p>
              </div>
              <button
                onClick={() => {
                  setReplyReport(null);
                  setReplyText('');
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Pesan Balasan
                </label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none font-sans placeholder:text-slate-300"
                  placeholder="Ketik pesan balasan..."
                />
              </div>

              <div className="space-y-2">
                <span className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Template Balasan Cepat
                </span>
                <div className="space-y-1.5">
                  <button
                    onClick={() =>
                      insertTemplate(
                        `Halo,\n\nPengaduan Anda tentang penumpukan sampah di ${replyReport.zone?.name || 'wilayah Anda'} telah kami terima. Tim supir pengangkut sedang menjadwalkan armada.`
                      )
                    }
                    className="w-full text-left text-[11px] sm:text-xs bg-white hover:bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-slate-600 font-medium transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faClipboardList} className="text-slate-400 shrink-0" />
                    <span>Draf: Jadwalkan Pengangkutan</span>
                  </button>
                  <button
                    onClick={() =>
                      insertTemplate(
                        `Halo,\n\nTerima kasih atas laporannya. Wilayah ${replyReport.zone?.name || 'wilayah Anda'} saat ini dikonfirmasi sudah bersih oleh supir armada kami.`
                      )
                    }
                    className="w-full text-left text-[11px] sm:text-xs bg-white hover:bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-slate-600 font-medium transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faCheckCircle} className="text-slate-400 shrink-0" />
                    <span>Draf: Konfirmasi Bersih / Selesai</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="px-4 sm:px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => {
                  setReplyReport(null);
                  setReplyText('');
                }}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSendReply}
                disabled={replySending || !replyText.trim()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-300 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed shadow-xs"
              >
                {replySending ? (
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                ) : (
                  <FontAwesomeIcon icon={faPaperPlane} />
                )}
                <span>Kirim WA</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── DESKTOP CARD COMPONENT ─── */
function DesktopCard({ report, updatingId, onDragStart, onDragEnd, onReply, onLightbox }) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, report.id)}
      onDragEnd={onDragEnd}
      className={`p-4 bg-white border rounded-xl shadow-xs hover:shadow-md transition-all duration-200 relative group flex flex-col justify-between cursor-grab active:cursor-grabbing select-none ${
        updatingId === report.id
          ? 'opacity-50 pointer-events-none border-slate-200'
          : 'border-slate-200 hover:border-slate-300 hover:-translate-y-0.5'
      }`}
    >
      {/* Zone & AI Grouped Badges */}
      <div className="flex justify-between items-start gap-2 mb-2.5">
        <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider truncate max-w-[70%] bg-slate-100 px-2 py-1 rounded-full">
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{
              backgroundColor: ZONE_COLORS[(report.zone_id || 0) % ZONE_COLORS.length],
            }}
          />
          <span className="truncate">{report.zone?.name || 'Wilayah Luar'}</span>
        </span>
        {report.is_grouped && (
          <span className="shrink-0 text-[8px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full flex items-center gap-1">
            <FontAwesomeIcon icon={faLayerGroup} />
            <span>AI Grouped</span>
          </span>
        )}
      </div>

      {/* Report Content */}
      <p className="text-xs text-slate-700 font-medium leading-relaxed mb-3 line-clamp-3">
        &ldquo;{report.report_content}&rdquo;
      </p>

      {/* Image */}
      {report.image_path && (
        <div className="relative h-24 rounded-lg overflow-hidden mb-4 bg-slate-100 group/img border border-slate-100">
          <img
            src={getImageUrl(report.image_path)}
            alt="Foto bukti sampah"
            className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105"
            loading="lazy"
          />
          <button
            onClick={() => onLightbox(getImageUrl(report.image_path))}
            className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity duration-200 flex items-end justify-start p-2 text-white text-[10px] font-bold gap-1 cursor-pointer"
          >
            <FontAwesomeIcon icon={faMagnifyingGlassPlus} className="text-xs" />
            <span>Perbesar</span>
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px]">
        <div className="overflow-hidden min-w-0 space-y-0.5">
          <span className="font-bold text-slate-600 block truncate flex items-center gap-1">
            <FontAwesomeIcon
              icon={faWhatsapp}
              className="text-emerald-500 text-[9px] shrink-0"
            />
            <span className="truncate">{report.whatsapp_number}</span>
          </span>
          <span className="text-slate-400 font-medium flex items-center gap-1">
            <FontAwesomeIcon icon={faClock} className="text-[9px] shrink-0" />
            <span>{timeAgo(report.created_at)}</span>
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onReply(report)}
            className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-emerald-600 hover:border-emerald-200 transition-all cursor-pointer"
            title="Kirim Balasan Cepat"
          >
            <FontAwesomeIcon icon={faCommentDots} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── MOBILE CARD COMPONENT ─── */
function MobileCard({ report, updatingId, onStatusChange, onReply, onLightbox }) {
  const nextStatus = getNextStatus(report.status);
  const prevStatus = getPrevStatus(report.status);
  const isUpdating = updatingId === report.id;

  return (
    <div
      className={`p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs transition-all duration-200 ${
        isUpdating ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      {/* Header: Zone + AI Grouped */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-500 truncate max-w-[70%] bg-slate-100 px-2 py-0.5 rounded-full">
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{
              backgroundColor: ZONE_COLORS[(report.zone_id || 0) % ZONE_COLORS.length],
            }}
          />
          <span className="truncate">{report.zone?.name || 'Wilayah Luar'}</span>
        </span>
        {report.is_grouped && (
          <span className="shrink-0 text-[7px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 py-0.5 rounded-full flex items-center gap-0.5">
            <FontAwesomeIcon icon={faLayerGroup} className="text-[7px]" />
            <span>AI</span>
          </span>
        )}
      </div>

      {/* Content + Image Row */}
      <div className="flex gap-2.5 mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-slate-700 font-medium leading-relaxed line-clamp-2">
            &ldquo;{report.report_content}&rdquo;
          </p>
        </div>
        {report.image_path && (
          <button
            onClick={() => onLightbox(getImageUrl(report.image_path))}
            className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 border border-slate-100 shrink-0 group"
          >
            <img
              src={getImageUrl(report.image_path)}
              alt="Foto"
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
              loading="lazy"
            />
          </button>
        )}
      </div>

      {/* Footer: Info + Actions */}
      <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
        <div className="overflow-hidden min-w-0">
          <span className="text-[10px] font-bold text-slate-600 block truncate flex items-center gap-1">
            <FontAwesomeIcon icon={faWhatsapp} className="text-emerald-500 text-[8px] shrink-0" />
            <span className="truncate">{report.whatsapp_number}</span>
          </span>
          <span className="text-[9px] text-slate-400 flex items-center gap-1">
            <FontAwesomeIcon icon={faClock} className="text-[7px]" />
            {timeAgo(report.created_at)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Status Actions */}
          {prevStatus && (
            <button
              onClick={() => onStatusChange(report.id, prevStatus)}
              disabled={isUpdating}
              className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-50"
              title={`Kembalikan ke ${prevStatus}`}
            >
              &larr;
            </button>
          )}
          {nextStatus && (
            <button
              onClick={() => onStatusChange(report.id, nextStatus)}
              disabled={isUpdating}
              className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all disabled:opacity-50"
            >
              {nextStatus === 'Sedang Ditangani' ? 'Proses' : 'Selesai'} &rarr;
            </button>
          )}
          <button
            onClick={() => onReply(report)}
            className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-200 transition-all cursor-pointer"
            title="Balas WhatsApp"
          >
            <FontAwesomeIcon icon={faCommentDots} className="text-[10px]" />
          </button>
        </div>
      </div>
    </div>
  );
}
