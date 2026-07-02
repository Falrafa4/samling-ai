import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faEyeSlash,
  faChevronLeft,
} from "@fortawesome/free-solid-svg-icons";

export default function AuthModal({ isOpen, onClose, onSuccess }) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setPassword("");
      setError(false);
      setShake(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === "admin") {
      onSuccess();
    } else {
      setError(true);
      setShake(true);
      setPassword("");
      inputRef.current?.focus();
      setTimeout(() => {
        setShake(false);
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
      <div
        className={`bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-sm m-4 transition-transform duration-300 ${
          shake ? "animate-bounce" : ""
        }`}
      >
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
          Akses Terbatas
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center">
          Halaman ini hanya untuk admin. Silakan masukkan password "admin".
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              ref={inputRef}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              className={`w-full bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white border-2 rounded-lg px-4 py-3 text-center text-lg tracking-widest focus:ring-2 focus:ring-green-500 outline-none transition-colors ${
                error
                  ? "border-red-500"
                  : "border-gray-200 dark:border-slate-600"
              }`}
              placeholder="******"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
            >
              <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
            </button>
          </div>

          {error && (
            <p className="text-xs text-red-500 text-center font-medium">
              Password salah. Coba lagi.
            </p>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-xl font-semibold text-white bg-green-600 hover:bg-green-700 shadow-sm shadow-green-600/30 transition-all duration-200 cursor-pointer"
          >
            Masuk
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={onClose}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex items-center gap-1.5 justify-center w-full focus:outline-none"
          >
            <FontAwesomeIcon icon={faChevronLeft} />
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
