import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  itemLabel = 'data',
  loading = false
}) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl px-5 py-3 flex flex-col gap-4 md:gap-0 md:flex-row md:items-center justify-between shadow-2xs select-none">
      <span className="text-[11px] text-slate-500 font-medium">
        Halaman {currentPage} dari {totalPages}
        <span className="text-slate-300 mx-1">|</span>
        {totalItems.toLocaleString('id-ID')} {itemLabel}
      </span>
      <div className="flex items-center gap-1">
        <button
          disabled={currentPage === 1 || loading}
          onClick={() => onPageChange(currentPage - 1)}
          className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all flex items-center justify-center cursor-pointer"
        >
          <FontAwesomeIcon icon={faChevronLeft} className="text-[10px]" />
        </button>
        {getPageNumbers().map(page => (
          <button
            key={page}
            disabled={loading}
            onClick={() => onPageChange(page)}
            className={`min-w-8 h-8 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center cursor-pointer ${
              page === currentPage
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            {page}
          </button>
        ))}
        <button
          disabled={currentPage === totalPages || loading}
          onClick={() => onPageChange(currentPage + 1)}
          className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all flex items-center justify-center cursor-pointer"
        >
          <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
        </button>
      </div>
    </div>
  );
}
