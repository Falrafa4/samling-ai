import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';

export default function AlertMessage({ type = 'success', message }) {
  if (!message) return null;

  const isError = type === 'error';

  return (
    <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-3 animate-fade-in shadow-xs ${
      isError
        ? 'bg-red-50 border border-red-200 text-red-700'
        : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
    }`}>
      <FontAwesomeIcon
        icon={isError ? faTriangleExclamation : faCircleCheck}
        className="text-sm shrink-0"
      />
      <span>{message}</span>
    </div>
  );
}
