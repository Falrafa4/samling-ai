import { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faXmark } from '@fortawesome/free-solid-svg-icons';

export default function SearchableSelect({
  options = [],
  value = '',
  onChange,
  placeholder = 'Pilih...',
  icon,
  emptyMessage = 'Tidak ada data',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const selected = options.find(o => String(o.value) === String(value));
  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const displayValue = isOpen && isTyping ? search : (selected?.label || '');

  return (
    <div className="relative" ref={containerRef}>
      {icon && (
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none z-10">
          <FontAwesomeIcon icon={icon} className="text-xs" />
        </span>
      )}

      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={displayValue}
        onChange={(e) => {
          setSearch(e.target.value);
          setIsTyping(true);
          if (!isOpen) setIsOpen(true);
        }}
        onFocus={() => {
          setIsOpen(true);
          setIsTyping(false);
          setSearch('');
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            listRef.current?.querySelector('button')?.focus();
          }
          if (e.key === 'Escape') {
            setIsOpen(false);
            inputRef.current?.blur();
          }
        }}
        className={`w-full ${icon ? 'pl-9' : 'pl-3'} pr-9 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 min-h-8 transition-all`}
        role="combobox"
        aria-expanded={isOpen}
      />

      {value !== '' && value !== undefined && value !== null ? (
        <button
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation();
            onChange('');
            setSearch('');
            inputRef.current?.focus();
          }}
          className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          <FontAwesomeIcon icon={faXmark} className="text-sm" />
        </button>
      ) : (
        <span className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 pointer-events-none">
          <FontAwesomeIcon icon={faChevronDown} className="text-[10px]" />
        </span>
      )}

      {isOpen && (
        <div
          ref={listRef}
          className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {filtered.length > 0 ? (
            filtered.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                  inputRef.current?.blur();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onChange(opt.value);
                    setIsOpen(false);
                  }
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    const next = e.target.nextElementSibling;
                    if (next) next.focus();
                  }
                  if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    const prev = e.target.previousElementSibling;
                    if (prev) prev.focus();
                    else inputRef.current?.focus();
                  }
                }}
                className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-emerald-50 hover:text-emerald-700 transition-colors cursor-pointer ${
                  String(opt.value) === String(value)
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'text-slate-700'
                }`}
              >
                {opt.label}
              </button>
            ))
          ) : (
            <div className="px-3 py-4 text-xs text-slate-400 text-center">
              {emptyMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
