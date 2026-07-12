import { fmtDate } from '../../utils/helpers';

export default function AccuracyBar({ date, avgConfidence, count }) {
  const pct = Math.round(avgConfidence * 100);
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-gray-500 w-24 shrink-0 text-xs">{fmtDate(date)}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-gray-700 font-semibold w-12 text-right text-xs">{pct}%</span>
      <span className="text-gray-400 text-[11px] w-8 text-right">{count}x</span>
    </div>
  );
}