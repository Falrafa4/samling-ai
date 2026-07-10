import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faMapMarkerAlt, faMicrochip, faFolderOpen } from '@fortawesome/free-solid-svg-icons';
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
  selectedCategoryFilter,
  onCategoryFilterChange,
}) {
  const zoneOptions = zones.map(z => ({ value: z.id, label: z.name }));

  const getPlaceholderText = () => {
    if (activeTab === 'driver') return 'Cari nama, username atau WhatsApp...';
    if (activeTab === 'fleet') return 'Cari nama armada atau jenis kendaraan...';
    return 'Cari jenis sensor atau nama TPS...';
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
      <div className={activeTab === 'sensor' ? "sm:col-span-6 relative" : "sm:col-span-8 relative"}>
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
          <FontAwesomeIcon icon={faSearch} className="text-xs" />
        </span>
        <input
          type="text"
          placeholder={getPlaceholderText()}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white rounded-lg text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
        />
      </div>

      {activeTab !== 'fleet' ? (
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
      ) : (
        <div className="sm:col-span-4 relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
            <FontAwesomeIcon icon={faFolderOpen} className="text-xs" />
          </span>
          <select
            value={selectedCategoryFilter}
            onChange={(e) => onCategoryFilterChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white focus:border-emerald-500 cursor-pointer min-h-8"
          >
            <option value="">Semua Kategori Armada</option>
            <option value="Hulu">Hulu (Kolektor Lingkungan)</option>
            <option value="Tengah">Tengah (Transportasi Makro)</option>
            <option value="Hilir">Hilir (Alat Berat TPST)</option>
          </select>
        </div>
      )}

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
