import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLeaf } from '@fortawesome/free-solid-svg-icons';

export default function Splash() {

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 flex flex-col justify-center items-center overflow-hidden transition-colors duration-200">
      <div className="text-center animate-fade-in">
        {/* Leaf Logo with popIn animation */}
        <div className="text-green-600 dark:text-emerald-500 text-[80px] mb-4 animate-bounce">
          <FontAwesomeIcon icon={faLeaf} />
        </div>
        
        {/* Title */}
        <h1 className="text-4xl font-extrabold text-green-600 dark:text-emerald-500 tracking-wider">
          Samling
        </h1>
        
        {/* Tagline */}
        <p className="text-md text-green-500 dark:text-emerald-400 mt-2 font-medium">
          Sampah Lingkungan
        </p>
      </div>
    </div>
  );
}
