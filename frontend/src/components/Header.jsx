import { useNavigate } from 'react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

export default function Header({ title, subtitle, showBack = false, onBack, rightContent }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 py-4 px-4 md:px-8 shadow-sm flex items-center justify-between transition-colors duration-200">
      <div className="flex items-center gap-3">
        {showBack && (
          <button 
            onClick={handleBack} 
            className="w-10 h-10 rounded-full bg-gray-50 hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 flex items-center justify-center transition-all duration-200 focus:outline-none"
            aria-label="Kembali"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-lg" />
          </button>
        )}
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {rightContent && (
        <div className="flex items-center gap-2">
          {rightContent}
        </div>
      )}
    </header>
  );
}
