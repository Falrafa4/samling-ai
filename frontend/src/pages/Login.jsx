import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useLocalStorage } from "react-use";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLeaf,
  faUser,
  faLock,
  faEye,
  faEyeSlash,
  faTruckLoading,
  faCheck,
  faTimes,
  faTriangleExclamation
} from "@fortawesome/free-solid-svg-icons";
import LeafletMap from "../components/LeafletMap";
import { api } from "../services/api";
import ConfirmModal from "../components/fragments/ConfirmModal";
import MainLayout from "../layouts/MainLayout";

export default function Login() {
  const navigate = useNavigate();
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shake, setShake] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  // Cooldown & Toast State for Lapor Angkut
  const [cooldownTime, setCooldownTime] = useState(0); // in seconds
  const [showToast, setShowToast] = useState(false);
  const intervalRef = useRef(null);

  const COOLDOWN_MINUTES = 2;
  const COOLDOWN_MS = COOLDOWN_MINUTES * 60 * 1000;
  const LAST_REPORT_KEY = "lastReportTimestamp";
  const NOTIFICATIONS_KEY = "samling_notifications";

  const [adminToken, setAdminToken] = useLocalStorage("admin_token", null);
  const [, setAdminUser] = useLocalStorage("admin_user", null);

  useEffect(() => {
    // If already logged in, redirect to admin dashboard
    if (adminToken) {
      navigate("/admin/overview");
    }

    // Check cooldown state on mount
    const lastReportTime = parseInt(
      localStorage.getItem(LAST_REPORT_KEY) || "0",
    );
    const timeSinceLastReport = Date.now() - lastReportTime;
    if (timeSinceLastReport < COOLDOWN_MS) {
      const remainingTime = Math.ceil(
        (COOLDOWN_MS - timeSinceLastReport) / 1000,
      );
      setCooldownTime(remainingTime);
      startTimer(remainingTime);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [adminToken, navigate]);

  const startTimer = (seconds) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    let remaining = seconds;
    intervalRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(intervalRef.current);
        setCooldownTime(0);
      } else {
        setCooldownTime(remaining);
      }
    }, 1000);
  };

  const handleLapor = () => {
    if (cooldownTime > 0) return;

    const now = Date.now();
    localStorage.setItem(LAST_REPORT_KEY, now.toString());
    setCooldownTime(COOLDOWN_MINUTES * 60);
    startTimer(COOLDOWN_MINUTES * 60);

    // Create a new notification
    const reportTime = new Date();
    const newNotification = {
      id: now,
      icon: "fa-solid fa-truck-fast",
      iconColor: "text-blue-500",
      title: "Laporan Sampah Diterima",
      message: "Permintaan pengangkutan sampah dari warga telah diterima.",
      time: reportTime.toISOString(),
      read: false,
    };

    try {
      const existing =
        JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY)) || [];
      existing.unshift(newNotification);
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(existing));
    } catch (e) {
      console.error("Gagal menyimpan notifikasi:", e);
    }

    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 5000);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setShake(false);
    setIsSubmitting(true);

    const trimmedUser = usernameInput.trim();
    const trimmedPass = passwordInput.trim();

    if (!trimmedUser || !trimmedPass) {
      setErrorMessage("Harap masukkan username dan password.");
      setShake(true);
      setIsSubmitting(false);
      return;
    }

    try {
      // Memanggil API loginAdmin riil dari services/api
      const response = await api.loginAdmin(trimmedUser, trimmedPass);

      if (response.success && response.data) {
        setErrorMessage("Login berhasil! Mengalihkan...");
        
        // Simpan token JWT dan informasi user admin ke localStorage secara reaktif (JSON encoded)
        setAdminToken(response.data.access_token);
        setAdminUser(response.data.user);

        setTimeout(() => {
          navigate("/admin/overview");
        }, 800);
      } else {
        setErrorMessage(response.message || "Gagal melakukan autentikasi.");
        setShake(true);
        setIsSubmitting(false);
      }
    } catch (error) {
      setErrorMessage(error.message || "Username atau Password admin salah.");
      setShake(true);
      setIsSubmitting(false);
    }
  };

  const formatCooldown = () => {
    const minutes = Math.floor(cooldownTime / 60);
    const seconds = cooldownTime % 60;
    return `Tunggu ${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors duration-200">
        {/* Toast Notification */}
        {showToast && (
          <div className="fixed top-5 right-5 z-50 animate-slide-in">
            <div className="bg-white dark:bg-slate-800 border-l-4 border-green-500 shadow-2xl rounded-lg p-4 flex items-center gap-4 min-w-75">
              <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full text-green-600 dark:text-green-400">
                <FontAwesomeIcon icon={faCheck} className="text-lg" />
              </div>
              <div>
                <h4 className="font-bold text-gray-800 dark:text-white">
                  Berhasil Melapor!
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Petugas sedang menuju lokasi Anda.
                </p>
              </div>
              <button
                onClick={() => setShowToast(false)}
                className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          </div>
        )}

        {/* Main Container */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden w-full max-w-xl flex flex-col-reverse md:flex-row min-h-150 transition-colors duration-200 mt-10">
          {/* Right Section: Login Form */}
          <div className="w-full bg-white dark:bg-slate-800 p-8 md:p-12 flex flex-col justify-center">
            <div className="w-full max-w-md mx-auto">
              {/* Header */}
              <div className="mb-8">
                <h2 className="text-3xl text-primary dark:text-emerald-400 font-bold mb-2 flex items-center gap-2">
                  <FontAwesomeIcon icon={faLeaf} />
                  Samling
                </h2>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                  Login Petugas/Admin Pusat
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Masuk untuk mengelola laporan dan armada.
                </p>
              </div>

              {/* Form */}
              <form
                onSubmit={handleLoginSubmit}
                className={shake ? "animate-shake" : ""}
              >
                {/* Username Input */}
                <div className="mb-5">
                  <label className="block text-gray-750 dark:text-gray-300 text-sm font-medium mb-2 ml-1">
                    Username
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-gray-400">
                      <FontAwesomeIcon icon={faUser} />
                    </span>
                    <input
                      type="text"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      placeholder="Masukkan username"
                      className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 px-4 py-3 pl-11 rounded-xl focus:border-brand dark:focus:border-emerald-400 focus:ring-1 focus:ring-brand dark:focus:ring-emerald-400 outline-none text-gray-900 dark:text-white transition-colors"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="mb-2">
                  <label className="block text-gray-755 dark:text-gray-300 text-sm font-medium mb-2 ml-1">
                    Password
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-gray-400">
                      <FontAwesomeIcon icon={faLock} />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 px-4 py-3 pl-11 rounded-xl focus:border-brand dark:focus:border-emerald-400 focus:ring-1 focus:ring-brand dark:focus:ring-emerald-400 outline-none text-gray-900 dark:text-white transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
                    >
                      <FontAwesomeIcon
                        icon={showPassword ? faEyeSlash : faEye}
                      />
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                <p
                  className={`text-sm mb-4 h-5 mt-1 font-medium ${errorMessage.includes("berhasil") ? "text-green-500" : "text-red-500"}`}
                >
                  {errorMessage}
                </p>

                {/* Remember + Forgot */}
                <div className="flex justify-between items-center text-sm mb-6">
                  <label className="flex items-center gap-2 text-gray-600 dark:text-gray-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-brand focus:ring-brand rounded border-gray-300 dark:border-slate-600 dark:bg-slate-700"
                    />
                    Ingat Saya
                  </label>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setForgotPasswordOpen(true);
                    }}
                    className="text-brand dark:text-emerald-400 hover:underline font-medium"
                  >
                    Lupa Password?
                  </a>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gray-900 dark:bg-slate-100 dark:text-gray-900 text-white py-3.5 rounded-xl font-bold hover:bg-black dark:hover:bg-white transition-all shadow-md hover:shadow-lg transform active:scale-95 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Memproses..." : "Masuk Dashboard"}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Lupa Password Info Modal */}
        <ConfirmModal
          isOpen={forgotPasswordOpen}
          onClose={() => setForgotPasswordOpen(false)}
          onConfirm={() => setForgotPasswordOpen(false)}
          title="Lupa Password Admin?"
          message="Akun ini terdaftar sebagai Administrator Utama. Guna keamanan sistem, pemulihan password secara otomatis dinonaktifkan. Silakan hubungi pengembang utama (Developer Utama) Samling AI melalui IT Support Pusat untuk melakukan reset password."
          confirmText="Saya Mengerti"
          confirmBgColorClass="bg-emerald-600 hover:bg-emerald-500 focus:ring-emerald-500"
          icon={faTriangleExclamation}
          showCancel={false}
        />
      </div>
    </MainLayout>
  );
}
