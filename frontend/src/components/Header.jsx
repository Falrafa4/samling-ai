import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function Header({ title, subtitle, icon, iconColor = 'text-primary-600', rightContent }) {
  return (
    <header className="px-8 py-6 bg-white border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
          {icon && (
            <FontAwesomeIcon icon={icon} className={`${iconColor} text-xl`} />
          )}
          <span>{title}</span>
        </h2>
        {subtitle && (
          <p className="text-sm text-slate-500 mt-1">
            {subtitle}
          </p>
        )}
      </div>
      {rightContent && (
        <div className="flex items-center gap-2 shrink-0">{rightContent}</div>
      )}
    </header>
  );
}