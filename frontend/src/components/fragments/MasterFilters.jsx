import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faMapMarkerAlt, faMicrochip } from '@fortawesome/free-solid-svg-icons';
import SearchableSelect from './SearchableSelect';

export default function MasterFilters({
  activeTab,
  searchQuery,
  onSearchChange,
  zones,
  selectedZoneFilter,
  onZoneFilterChange,
  selectedSensorTypeFilter,
  onSensorTypeFilterChange,
}) {
  const zoneOptions = zones.map(z => ({ value: z.id, label: z.name }));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
      <div className="sm:col-span-6 relative">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
          <FontAwesomeIcon icon={faSearch} className="text-xs" />
        </span>
        <input
          type="text"
          placeholder={activeTab === 'driver' ? 'Cari nama, username atau WhatsApp...' : 'Cari jenis sensor atau nama TPS...'}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white rounded-lg text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
        />
      </div>

      <div className="sm:col-span-3">
        <SearchableSelect
          options={zoneOptions}
          value={selectedZoneFilter}
          onChange={onZoneFilterChange}
          placeholder="Semua Wilayah TPS"
          icon={faMapMarkerAlt}
          emptyMessage="Tidak ada wilayah ditemukan"
        />
      </div>

      {activeTab === 'sensor' && (
        <div className="sm:col-span-3 relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
            <FontAwesomeIcon icon={faMicrochip} className="text-xs" />
          </span>
          <select
            value={selectedSensorTypeFilter}
            onChange={(e) => onSensorTypeFilterChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white focus:border-emerald-500 cursor-pointer min-h-8"
          >
            <option value="">Semua Tipe Perangkat</option>
            <option value="Ultrasonic-Organic">Ultrasonic - Organik</option>
            <option value="Ultrasonic-Anorganic">Ultrasonic - Anorganik</option>
            <option value="MQ-135">MQ-135 (Gas)</option>
            <option value="DHT-22-Temp">DHT-22 (Suhu)</option>
            <option value="DHT-22-Humid">DHT-22 (Kelembapan)</option>
          </select>
        </div>
      )}
    </div>
  );
}
