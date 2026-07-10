import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrochip, faPlus, faUser, faTruck } from '@fortawesome/free-solid-svg-icons';

export default function MasterTabs({ activeTab, onTabChange, driverCount, fleetCount, sensorCount, onAdd }) {
  const getAddBtnText = () => {
    switch (activeTab) {
      case 'driver':
        return 'Registrasi Driver';
      case 'fleet':
        return 'Tambah Armada';
      default:
        return 'Pasang Sensor';
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="flex bg-slate-100 p-1 rounded-[0.6rem] w-fit">
        <button
          onClick={() => onTabChange('driver')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'driver'
              ? 'bg-white text-emerald-600 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FontAwesomeIcon icon={faUser} />
          <span>Driver ({driverCount})</span>
        </button>
        <button
          onClick={() => onTabChange('fleet')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'fleet'
              ? 'bg-white text-emerald-600 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FontAwesomeIcon icon={faTruck} />
          <span>Armada ({fleetCount})</span>
        </button>
        <button
          onClick={() => onTabChange('sensor')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'sensor'
              ? 'bg-white text-emerald-600 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FontAwesomeIcon icon={faMicrochip} />
          <span>Telemetri Sensor ({sensorCount})</span>
        </button>
      </div>

      <button
        onClick={onAdd}
        className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-950/15 transition-all flex items-center justify-center gap-2 cursor-pointer"
      >
        <FontAwesomeIcon icon={faPlus} />
        <span>{getAddBtnText()}</span>
      </button>
    </div>
  );
}
