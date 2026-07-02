import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLeaf,
  faXmark,
  faStar,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";

export default function AboutModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="absolute inset-0 bg-transparent" onClick={onClose} />
      <div className="bg-white dark:bg-slate-800 w-full sm:max-w-lg p-6 rounded-t-3xl sm:rounded-3xl shadow-2xl relative z-10 animate-modalFade flex flex-col max-h-[85vh] transition-colors duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-slate-700 pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-xl">
              <FontAwesomeIcon
                icon={faLeaf}
                className="text-emerald-600 dark:text-emerald-400"
              />
            </div>
            <h3 className="text-xl font-bold dark:text-white">
              Tentang Samling
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-slate-600 transition"
          >
            <FontAwesomeIcon
              icon={faXmark}
              className="text-gray-500 dark:text-gray-400"
            />
          </button>
        </div>

        {/* Content Scrollable */}
        <div className="overflow-y-auto no-scrollbar space-y-6 text-sm text-gray-600 dark:text-gray-300 leading-relaxed pb-2">
          <section>
            <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-base">
              Deskripsi Proyek
            </h4>
            <p className="text-justify">
              Samling adalah sebuah sistem terintegrasi berbasis teknologi IoT
              dan web yang dirancang untuk mengatasi permasalahan sampah di
              lingkungan rumah tangga, baik di kawasan pedesaan maupun perumahan
              modern. Proyek ini berfokus pada digitalisasi proses pengelolaan
              sampah, mulai dari pemantauan tingkat kepenuhan tempat sampah,
              pengangkutan oleh petugas, pemilahan di TPS, hingga distribusi ke
              mitra pengelola limbah.
            </p>
          </section>

          <section>
            <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-base">
              Latar Belakang
            </h4>
            <p className="text-justify mb-3">
              Permasalahan sampah di Indonesia masih menjadi isu lingkungan yang
              mendesak. Data menunjukkan bahwa sebagian besar sampah nasional
              belum terkelola dengan baik, berpotensi mencemari lingkungan.
              Banyak TPS masih bersifat konvensional tanpa sistem pemantauan
              kapasitas, menyebabkan overload dan manajemen yang reaktif.
            </p>
            <p className="text-justify">
              Samling hadir untuk menjawab kebutuhan akan solusi pengelolaan
              sampah yang modern, terintegrasi, dan berbasis data real-time
              untuk menghubungkan warga, petugas, dan pengelola dalam satu
              ekosistem yang efisien.
            </p>
          </section>

          <section className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-xl border border-gray-100 dark:border-slate-700">
            <h4 className="font-bold text-gray-900 dark:text-white mb-3 text-base flex items-center gap-2">
              <FontAwesomeIcon icon={faStar} className="text-yellow-400" />{" "}
              Manfaat Utama
            </h4>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <FontAwesomeIcon
                  icon={faCheck}
                  className="text-emerald-500 mt-1"
                />
                <div>
                  <strong className="block text-gray-800 dark:text-gray-200">
                    Manajemen Proaktif
                  </strong>
                  <span className="text-xs opacity-80">
                    Petugas tahu persis kapan dan di mana sampah perlu diangkut,
                    menghemat waktu dan bahan bakar.
                  </span>
                </div>
              </li>
              <li className="flex gap-3">
                <FontAwesomeIcon
                  icon={faCheck}
                  className="text-emerald-500 mt-1"
                />
                <div>
                  <strong className="block text-gray-800 dark:text-gray-200">
                    Mencegah Overload
                  </strong>
                  <span className="text-xs opacity-80">
                    Visibilitas penuh atas kapasitas TPS untuk perencanaan
                    pengosongan yang lebih baik.
                  </span>
                </div>
              </li>
              <li className="flex gap-3">
                <FontAwesomeIcon
                  icon={faCheck}
                  className="text-emerald-500 mt-1"
                />
                <div>
                  <strong className="block text-gray-800 dark:text-gray-200">
                    Ekonomi Sirkular
                  </strong>
                  <span className="text-xs opacity-80">
                    Menghubungkan rantai pasok daur ulang dengan data
                    ketersediaan sampah terpilah yang akurat.
                  </span>
                </div>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
