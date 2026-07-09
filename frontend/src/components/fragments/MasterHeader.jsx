import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRefresh } from '@fortawesome/free-solid-svg-icons';

export default function MasterHeader({ onRefresh, loading }) {
  return (
    <header className="px-8 py-6 bg-white border-b border-slate-200 shrink-0 flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Manajemen Master Data</h2>
        <p className="text-sm text-slate-500">
          Kelola data operasional terpusat driver dan sensor perangkat IoT.
        </p>
      </div>
      <button
        onClick={onRefresh}
        className="w-9 h-9 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-500 rounded-lg flex items-center justify-center cursor-pointer transition-colors shadow-xs"
        title="Segarkan Data"
      >
        <FontAwesomeIcon icon={faRefresh} className={loading ? "animate-spin" : ""} />
      </button>
    </header>
  );
}
