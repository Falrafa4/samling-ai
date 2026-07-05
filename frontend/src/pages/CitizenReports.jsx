import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFilter,
  faLayerGroup,
  faCommentDots,
  faImage,
  faCheckCircle,
  faCircle,
  faPhone,
  faChevronRight,
  faPaperPlane,
  faSpinner,
  faCircleCheck,
  faXmark,
  faMagnifyingGlassPlus
} from '@fortawesome/free-solid-svg-icons';
import { api } from '../services/api';

export default function CitizenReports() {
  const [reports, setReports] = useState([]);
  const [zones, setZones] = useState([]);
  const [selectedZoneFilter, setSelectedZoneFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // UI Interactive States (Lightbox & Quick Reply)
  const [lightboxImage, setLightboxImage] = useState(null);
  const [replyReport, setReplyReport] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replySending, setReplySending] = useState(false);

  const columns = ['Baru', 'Sedang Ditangani', 'Selesai'];

  // Fetch reports & zones on mount
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

  // Handle Drag Start
  const handleDragStart = (e, reportId) => {
    e.dataTransfer.setData('text/plain', reportId.toString());
  };

  // Handle Drop onto a Column
  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    const reportId = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (!reportId) return;

    // Check if report status is already the target status
    const report = reports.find((r) => r.id === reportId);
    if (!report || report.status === targetStatus) return;

    try {
      setUpdatingId(reportId);
      setErrorMessage('');
      setSuccessMessage('');
      
      const res = await api.updateCitizenReportStatus(reportId, targetStatus);
      if (res.success) {
        setSuccessMessage(`Status aduan #${reportId} berhasil diubah menjadi '${targetStatus}'`);
        // Refresh local list
        setReports((prev) =>
          prev.map((r) => (r.id === reportId ? { ...r, status: targetStatus } : r))
        );
      }
    } catch (err) {
      setErrorMessage(err.message || 'Gagal memperbarui status aduan.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Trigger quick reply modal template insertion
  const insertTemplate = (template) => {
    setReplyText(template);
  };

  const handleSendReply = async () => {
    if (!replyReport || !replyText.trim()) return;
    try {
      setReplySending(true);
      // Simulasi API pengiriman balasan WhatsApp warga
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSuccessMessage(`Balasan WhatsApp berhasil dikirim ke nomor warga ${replyReport.whatsapp_number}`);
      setReplyReport(null);
      setReplyText('');
    } catch (err) {
      setErrorMessage('Gagal mengirim pesan balasan WhatsApp.');
    } finally {
      setReplySending(false);
    }
  };

  // Filter reports locally by selected zone
  const filteredReports = selectedZoneFilter
    ? reports.filter((r) => r.zone_id === parseInt(selectedZoneFilter, 10))
    : reports;

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 text-slate-500">
        <FontAwesomeIcon icon={faSpinner} className="text-3xl animate-spin text-emerald-500 mb-3" />
        <p className="text-sm font-semibold">Memuat papan aduan warga...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50">
      {/* Top Header / Kanban Actions */}
      <header className="px-8 py-6 bg-white border-b border-slate-200 flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Laporan Pengaduan Warga</h2>
          <p className="text-sm text-slate-500">
            Kelola pengaduan penumpukan sampah yang dikirim oleh masyarakat melalui WhatsApp Chatbot.
          </p>
        </div>
        
        {/* Zone Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <FontAwesomeIcon icon={faFilter} />
            <span>Filter Wilayah:</span>
          </span>
          <select
            value={selectedZoneFilter}
            onChange={(e) => setSelectedZoneFilter(e.target.value)}
            className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-2xs"
          >
            <option value="">Semua Wilayah</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Kanban Board Container */}
      <div className="flex-1 overflow-x-auto p-8 flex gap-6 items-start">
        {columns.map((column) => {
          const columnReports = filteredReports.filter((r) => r.status === column);

          return (
            <div
              key={column}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, column)}
              className="w-[360px] shrink-0 bg-slate-100/70 border border-slate-200 rounded-xl p-4 flex flex-col max-h-full transition-colors duration-200"
            >
              {/* Column Header */}
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200 shrink-0 select-none">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">{column}</h3>
                  <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                    {columnReports.length}
                  </span>
                </div>
              </div>

              {/* Column Cards (Scrollable List) */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[300px]">
                {columnReports.map((report) => (
                  <div
                    key={report.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, report.id)}
                    className={`p-4 bg-white border border-slate-200 rounded-lg shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 relative group flex flex-col justify-between cursor-grab active:cursor-grabbing ${
                      updatingId === report.id ? 'opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    {/* Header: Location & Duplicate Grouping Indicator */}
                    <div className="flex justify-between items-start gap-2 mb-2 select-none">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate">
                        {report.zone?.name || 'Wilayah Luar'}
                      </span>
                      {report.is_grouped && (
                        <span className="shrink-0 text-[8px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <FontAwesomeIcon icon={faLayerGroup} />
                          <span>AI Grouped</span>
                        </span>
                      )}
                    </div>

                    {/* Report Text Content */}
                    <p className="text-xs text-slate-700 font-medium leading-relaxed mb-3">
                      "{report.report_content}"
                    </p>

                    {/* Sample Unsplash Trash Photo (Lightbox Trigger) */}
                    <div className="relative h-24 rounded-lg overflow-hidden mb-4 bg-slate-100 group/img border border-slate-100">
                      <img
                        src="https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=350&q=80"
                        alt="Foto bukti sampah"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105"
                      />
                      <button
                        onClick={() => setLightboxImage('https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=1000&q=80')}
                        className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/img:opacity-100 transition-opacity duration-200 flex items-center justify-center text-white text-xs font-bold gap-1 cursor-pointer"
                      >
                        <FontAwesomeIcon icon={faMagnifyingGlassPlus} className="text-base" />
                        <span>Perbesar Bukti</span>
                      </button>
                    </div>

                    {/* Report Footer / Action Triggers */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px]">
                      <div className="overflow-hidden">
                        <span className="font-bold text-slate-600 block truncate">
                          Warga: {report.whatsapp_number}
                        </span>
                        <span className="text-slate-400 font-medium">
                          {new Date(report.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Quick Reply Trigger */}
                        <button
                          onClick={() => {
                            setReplyReport(report);
                            setReplyText(`Halo,\n\nPengaduan Anda tentang penumpukan sampah di ${report.zone?.name || 'wilayah Anda'} telah kami terima. Tim supir pengangkut sedang menjadwalkan armada.`);
                          }}
                          className="p-1.5 rounded bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Kirim Balasan Cepat"
                        >
                          <FontAwesomeIcon icon={faCommentDots} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {columnReports.length === 0 && (
                  <div className="py-12 bg-white/40 border border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400 text-xs">
                    Belum ada pengaduan
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* IMAGE LIGHTBOX MODAL OVERLAY */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[85vh] overflow-hidden rounded-xl border border-slate-800 shadow-2xl bg-slate-900 flex items-center justify-center">
            <img
              src={lightboxImage}
              alt="Bukti foto diperbesar"
              className="object-contain max-h-[80vh] w-auto max-w-full"
            />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-950/50 hover:bg-slate-950/80 border border-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <FontAwesomeIcon icon={faXmark} className="text-lg" />
            </button>
          </div>
        </div>
      )}

      {/* QUICK REPLY WHATSAPP MODAL OVERLAY */}
      {replyReport && (
        <div className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-slide-in">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Kirim Balasan WhatsApp Cepat</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Tujuan: {replyReport.whatsapp_number}</p>
              </div>
              <button
                onClick={() => setReplyReport(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Message Input */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Pesan Manifes Balasan
                </label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none font-sans"
                />
              </div>

              {/* Templates */}
              <div className="space-y-2">
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Template Balasan Cepat
                </span>
                <div className="space-y-1.5">
                  <button
                    onClick={() =>
                      insertTemplate(
                        `Halo,\n\nPengaduan Anda tentang penumpukan sampah di ${replyReport.zone?.name || 'wilayah Anda'} telah kami terima. Tim supir pengangkut sedang menjadwalkan armada.`
                      )
                    }
                    className="w-full text-left text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200/60 p-2.5 rounded-lg text-slate-600 font-medium transition-colors cursor-pointer"
                  >
                    📋 Draf: Jadwalkan Pengangkutan
                  </button>
                  <button
                    onClick={() =>
                      insertTemplate(
                        `Halo,\n\nTerima kasih atas laporannya. Wilayah ${replyReport.zone?.name || 'wilayah Anda'} saat ini dikonfirmasi sudah bersih oleh supir armada kami.`
                      )
                    }
                    className="w-full text-left text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200/60 p-2.5 rounded-lg text-slate-600 font-medium transition-colors cursor-pointer"
                  >
                    📋 Draf: Konfirmasi Bersih/Selesai
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setReplyReport(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSendReply}
                disabled={replySending || !replyText.trim()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
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
