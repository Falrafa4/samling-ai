import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faTrash, faSpinner } from '@fortawesome/free-solid-svg-icons';

export default function EventTable({ events, onEdit, onDelete, loading }) {
  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-2">
        <FontAwesomeIcon icon={faSpinner} className="text-3xl animate-spin text-emerald-500" />
        <p className="text-xs font-semibold">Mengambil data event...</p>
      </div>
    );
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getUrgencyBadge = (score) => {
    let colorClass = 'bg-emerald-50 text-emerald-600 border-emerald-100';
    let label = 'Low';
    if (score >= 0.85) {
      colorClass = 'bg-rose-50 text-rose-600 border-rose-100';
      label = 'Critical';
    } else if (score >= 0.6) {
      colorClass = 'bg-amber-50 text-amber-600 border-amber-100';
      label = 'Medium';
    }

    return (
      <div className="flex items-center gap-2">
        <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${colorClass}`}>
          {label}
        </span>
        <span className="font-mono text-slate-700 font-bold">{score.toFixed(2)}</span>
      </div>
    );
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-100 no-scrollbar">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">
            <th className="px-6 py-3.5">Nama Event</th>
            <th className="px-6 py-3.5">Tanggal Pelaksanaan</th>
            <th className="px-6 py-3.5">Lokasi</th>
            <th className="px-6 py-3.5">Wilayah / Kecamatan</th>
            <th className="px-6 py-3.5">Urgency Score</th>
            <th className="px-6 py-3.5 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
          {events.length > 0 ? (
            events.map((event) => (
              <tr key={event.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-800">{event.name}</span>
                    {event.description && (
                      <span className="text-[10px] text-slate-400 font-normal line-clamp-1 max-w-sm mt-0.5" title={event.description}>
                        {event.description}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                  {formatDate(event.start_date)} - {formatDate(event.end_date)}
                </td>
                <td className="px-6 py-4 text-slate-600">{event.location || '-'}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-slate-800">{event.wilayah}</span>
                    <span className="text-[10px] text-slate-400 font-normal mt-0.5">{event.kecamatan}</span>
                  </div>
                </td>
                <td className="px-6 py-4">{getUrgencyBadge(event.urgency_score)}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2.5">
                    <button
                      onClick={() => onEdit(event)}
                      className="w-7 h-7 bg-sky-50 text-sky-600 hover:bg-sky-100 hover:text-sky-700 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                      title="Edit Event"
                    >
                      <FontAwesomeIcon icon={faPen} className="text-[10px]" />
                    </button>
                    <button
                      onClick={() => onDelete(event.id)}
                      className="w-7 h-7 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                      title="Hapus Event"
                    >
                      <FontAwesomeIcon icon={faTrash} className="text-[10px]" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="text-center py-16 text-slate-400 font-semibold">
                Tidak ada data event ditemukan.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
