import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faTrash, faSpinner } from '@fortawesome/free-solid-svg-icons';

export default function DriverTable({ drivers, fleets = [], onEdit, onDelete, getZoneName, loading }) {
  const getFleetName = (id) => {
    if (!id) return <span className="text-slate-400 font-normal">Tanpa Kendaraan</span>;
    const found = fleets.find(f => f.id === id);
    return found ? (
      <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
        {found.name}
      </span>
    ) : `Armada #${id}`;
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
            <th className="px-6 py-3.5">Nama Lengkap</th>
            <th className="px-6 py-3.5">Username</th>
            <th className="px-6 py-3.5">No WhatsApp</th>
            <th className="px-6 py-3.5">TPS Wilayah Tugas</th>
            <th className="px-6 py-3.5">Armada Tugas</th>
            <th className="px-6 py-3.5">Status Kerja</th>
            <th className="px-6 py-3.5 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
          {drivers.length > 0 ? (
            drivers.map((driver) => (
              <tr key={driver.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-800">{driver.name}</td>
                <td className="px-6 py-4 font-mono text-slate-600">{driver.username}</td>
                <td className="px-6 py-4 text-slate-600">{driver.whatsapp_number}</td>
                <td className="px-6 py-4 text-slate-700">{getZoneName(driver.zone_id)}</td>
                <td className="px-6 py-4">{getFleetName(driver.fleet_id)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    driver.status === 'Available'
                      ? 'bg-emerald-50 text-emerald-600'
                      : driver.status === 'On Duty'
                      ? 'bg-blue-50 text-blue-600'
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {driver.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2.5">
                    <button
                      onClick={() => onEdit(driver)}
                      className="w-7 h-7 bg-sky-50 text-sky-600 hover:bg-sky-100 hover:text-sky-700 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                      title="Edit Driver"
                    >
                      <FontAwesomeIcon icon={faPen} className="text-[10px]" />
                    </button>
                    <button
                      onClick={() => onDelete(driver.id)}
                      className="w-7 h-7 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                      title="Hapus Driver"
                    >
                      <FontAwesomeIcon icon={faTrash} className="text-[10px]" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="text-center py-16 text-slate-400 font-semibold">
                Tidak ada data driver ditemukan.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
