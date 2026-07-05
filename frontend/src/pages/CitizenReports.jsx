import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faComment,
  faImage,
  faCheckCircle
} from '@fortawesome/free-regular-svg-icons';
import {
  faFilter,
  faLayerGroup,
  faCircle,
  faPhone,
  faChevronRight,
  faPaperPlane
} from '@fortawesome/free-solid-svg-icons';

export default function CitizenReports() {
  const [activeTab, setActiveTab] = useState('all');

  // Data Laporan Contoh (akan dihubungkan ke endpoint /citizen-reports pada Tahap 5)
  const [reports, setReports] = useState([
    {
      id: 1,
      name: 'Warga Sukodono',
      phone: '08123456789',
      location: 'TPS 01 - Kebon Jeruk',
      content: 'Tumpukan sampah plastik meluap keluar pagar sampai menghalangi jalan masuk gang.',
      time: '15 menit yang lalu',
      status: 'Baru',
      duplicates: 3, // AI Duplicate Grouping
      isUnread: true
    },
    {
      id: 2,
      name: 'Bpk. Ahmad S.',
      phone: '08567891234',
      location: 'TPS 02 - Bratang',
      content: 'Bau sampah sangat menyengat sejak kemarin pagi, mohon segera dijadwalkan pengangkutan.',
      time: '1 jam yang lalu',
      status: 'Sedang Ditangani',
      duplicates: 0,
      isUnread: false
    },
    {
      id: 3,
      name: 'Ibu Rahma',
      phone: '08987654321',
      location: 'TPS 03 - Keputih',
      content: 'Kondisi tumpukan sampah sudah bersih diangkut tadi siang. Terima kasih respon cepatnya!',
      time: '3 jam yang lalu',
      status: 'Selesai',
      duplicates: 1,
      isUnread: false
    }
  ]);

  const columns = ['Baru', 'Sedang Ditangani', 'Selesai'];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Baru':
        return 'text-red-500 bg-red-100 border-red-200';
      case 'Sedang Ditangani':
        return 'text-amber-500 bg-amber-100 border-amber-200';
      case 'Selesai':
        return 'text-emerald-500 bg-emerald-100 border-emerald-200';
      default:
        return 'text-slate-500 bg-slate-100 border-slate-200';
    }
  };

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
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 transition-colors">
            <FontAwesomeIcon icon={faFilter} />
            <span>Filter Wilayah</span>
          </button>
        </div>
      </header>

      {/* Kanban Board Container */}
      <div className="flex-1 overflow-x-auto p-8 flex gap-6 items-start">
        {columns.map((column) => {
          const columnReports = reports.filter((r) => r.status === column);

          return (
            <div
              key={column}
              className="w-[350px] shrink-0 bg-slate-100/70 border border-slate-200 rounded-xl p-4 flex flex-col max-h-full"
            >
              {/* Column Header */}
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200 shrink-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">{column}</h3>
                  <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                    {columnReports.length}
                  </span>
                </div>
              </div>

              {/* Column Cards (Scrollable List) */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {columnReports.map((report) => (
                  <div
                    key={report.id}
                    className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow transition-all duration-200 relative group flex flex-col justify-between"
                  >
                    {/* Badge & Unread Indicator */}
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        {report.location}
                      </span>
                      <div className="flex items-center gap-2">
                        {report.duplicates > 0 && (
                          <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <FontAwesomeIcon icon={faLayerGroup} />
                            <span>+{report.duplicates} Laporan Serupa</span>
                          </span>
                        )}
                        {report.isUnread && (
                          <FontAwesomeIcon icon={faCircle} className="text-[8px] text-red-500 animate-pulse" />
                        )}
                      </div>
                    </div>

                    {/* Report Text Content */}
                    <p className="text-xs text-slate-700 font-medium leading-relaxed mb-4">
                      "{report.content}"
                    </p>

                    {/* Report Footer / Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px]">
                      <div>
                        <span className="font-bold text-slate-600 block">{report.name}</span>
                        <span className="text-slate-400 font-medium">{report.time}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {/* Quick Reply Button */}
                        <button className="p-1.5 rounded bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors">
                          <FontAwesomeIcon icon={faComment} />
                        </button>
                        {/* Photo Viewer */}
                        <button className="p-1.5 rounded bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors">
                          <FontAwesomeIcon icon={faImage} />
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
    </div>
  );
}
