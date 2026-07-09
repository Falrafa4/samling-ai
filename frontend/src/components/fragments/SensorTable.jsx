import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faTrash, faSpinner } from '@fortawesome/free-solid-svg-icons';

export default function SensorTable({ sensors, onEdit, onDelete, loading }) {
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
            <th className="px-6 py-3.5">Nama TPS</th>
            <th className="px-6 py-3.5">Kecamatan</th>
            <th className="px-6 py-3.5">Tipe Sensor</th>
            <th className="px-6 py-3.5">Nilai Sensor</th>
            <th className="px-6 py-3.5">Kapasitas (Fill %)</th>
            <th className="px-6 py-3.5">Waktu Terupdate</th>
            <th className="px-6 py-3.5 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
          {sensors.length > 0 ? (
            sensors.map((sensor) => {
              const isUltrasonic = sensor.sensor_type.startsWith('Ultrasonic');
              return (
                <tr key={sensor.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-800">{sensor.zone?.name || `Zone #${sensor.zone_id}`}</td>
                  <td className="px-6 py-4 text-slate-600">{sensor.zone?.kecamatan || '-'}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold">
                      {sensor.sensor_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-700 font-bold">
                    {sensor.value?.toFixed(2)}
                    <span className="text-[10px] text-slate-400 font-sans ml-1 font-semibold">
                      {sensor.sensor_type.includes('Temp') ? '°C' : sensor.sensor_type.includes('Humid') ? '%' : sensor.sensor_type.includes('Gas') ? 'ppm' : 'cm'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono">
                    {isUltrasonic ? (
                      <span className={`font-bold ${
                        sensor.fill_percentage > 80
                          ? 'text-red-600'
                          : sensor.fill_percentage >= 50
                          ? 'text-amber-500'
                          : 'text-emerald-600'
                      }`}>
                        {sensor.fill_percentage?.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-[10px]">
                    {sensor.updated_at ? new Date(sensor.updated_at).toLocaleString('id-ID') : '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2.5">
                      <button
                        onClick={() => onEdit(sensor)}
                        className="w-7 h-7 bg-sky-50 text-sky-600 hover:bg-sky-100 hover:text-sky-700 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                        title="Edit Sensor"
                      >
                        <FontAwesomeIcon icon={faPen} className="text-[10px]" />
                      </button>
                      <button
                        onClick={() => onDelete(sensor.id)}
                        className="w-7 h-7 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                        title="Copot Sensor"
                      >
                        <FontAwesomeIcon icon={faTrash} className="text-[10px]" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="7" className="text-center py-16 text-slate-400 font-semibold">
                Tidak ada data sensor ditemukan.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
