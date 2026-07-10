import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faTrash, faSpinner } from '@fortawesome/free-solid-svg-icons';

export default function FleetTable({ fleets, onEdit, onDelete, loading }) {
  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'Hulu':
        return 'bg-blue-50 text-blue-600';
      case 'Tengah':
        return 'bg-emerald-50 text-emerald-600';
      case 'Hilir':
        return 'bg-purple-50 text-purple-600';
      default:
        return 'bg-slate-100 text-slate-500';
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-2">
        <FontAwesomeIcon icon={faSpinner} className="text-3xl animate-spin text-emerald-500" />
        <p className="text-xs font-semibold">Mengambil data master...</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-100 no-scrollbar">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">
            <th className="px-6 py-3.5">Nama Tipe Armada</th>
            <th className="px-6 py-3.5">Kategori</th>
            <th className="px-6 py-3.5">Jenis Kendaraan</th>
            <th className="px-6 py-3.5">Kapasitas Muat</th>
            <th className="px-6 py-3.5">Banyak Unit</th>
            <th className="px-6 py-3.5 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
          {fleets.length > 0 ? (
            fleets.map((fleet) => (
              <tr key={fleet.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-800">{fleet.name}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getCategoryBadge(fleet.category)}`}>
                    {fleet.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-600">{fleet.type}</td>
                <td className="px-6 py-4 text-slate-700 font-bold">{fleet.capacity || '-'}</td>
                <td className="px-6 py-4 font-mono font-bold text-slate-600">{fleet.total_units} unit</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2.5">
                    <button
                      onClick={() => onEdit(fleet)}
                      className="w-7 h-7 bg-sky-50 text-sky-600 hover:bg-sky-100 hover:text-sky-700 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                      title="Edit Armada"
                    >
                      <FontAwesomeIcon icon={faPen} className="text-[10px]" />
                    </button>
                    <button
                      onClick={() => onDelete(fleet.id)}
                      className="w-7 h-7 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                      title="Hapus Tipe Armada"
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
                Tidak ada data tipe armada ditemukan.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
