import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkedAlt, faChartLine, faRobot, faCheckCircle } from '@fortawesome/free-solid-svg-icons';

export default function FeaturesSection() {
  return (
    <section id="fitur" className="py-24 bg-white relative">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-heading">Fitur Utama SAMLING AI</h2>
          <p className="text-body text-lg">
            Kolaborasi teknologi AI dan partisipasi publik untuk menciptakan sistem manajemen kebersihan yang proaktif dan efisien.
          </p>
        </div>

        <div className="space-y-20">

          {/* Feature 1: WhatsApp Chatbot */}
          <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-20">
            <div className="flex-1 order-2 md:order-1 relative">
              <div className="bg-white rounded-2xl shadow-soft border border-gray-100 relative max-w-sm mx-auto overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-5 py-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-full flex items-center justify-center text-white">
                    <FontAwesomeIcon icon={faRobot} className="text-lg" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white">SAMLING Bot</div>
                    <div className="text-xs text-white/70 flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-300 inline-block animate-pulse"></span>
                      Online
                    </div>
                  </div>
                </div>

                {/* Chat messages */}
                <div className="px-5 py-5 space-y-4">
                  <div className="flex justify-end">
                    <div className="bg-primary-50/80 text-gray-800 p-3.5 rounded-2xl rounded-br-sm max-w-[80%] text-sm leading-relaxed shadow-xs border border-primary-100">
                      Hai Ling!
                    </div>
                  </div>

                  <div className="flex justify-start">
                    <div className="bg-white text-gray-800 p-3.5 rounded-2xl rounded-bl-sm max-w-[85%] text-sm leading-relaxed shadow-xs border border-gray-100">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        <span className="text-[11px] font-bold text-green-600 uppercase tracking-wide">AI Terverifikasi</span>
                      </div>
                      Halo! Aku bisa bantu kamu, silahkan pilih yaa:
                      <ul>
                        <li>﹒Lapor sampah</li>
                        <li>﹒Jemput sampah elektronik</li>
                        <li>﹒Jemput sampah besar</li>
                        <li>﹒Tanya sesuatu</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Input bar */}
                <div className="px-5 pb-5">
                  <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-200">
                    <input
                      type="text"
                      placeholder="Ketik pesan..."
                      className="flex-1 bg-transparent text-sm outline-none text-gray-600 placeholder-gray-400"
                      readOnly
                    />
                    <button className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white shrink-0 transition-all hover:shadow-md">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 order-1 md:order-2">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center text-2xl mb-6 shadow-sm">
                <FontAwesomeIcon icon={faRobot} />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-4 text-heading">WhatsApp Chatbot untuk Pelaporan Warga</h3>
              <p className="text-body text-lg mb-6">
                Laporkan penumpukan sampah liar dengan cepat tanpa perlu mengunduh aplikasi tambahan. AI kami akan memverifikasi dan memprioritaskan laporan secara otomatis.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-gray-700">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-primary-500" /> Deteksi dini penumpukan sampah
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-primary-500" /> Verifikasi lokasi otomatis
                </li>
              </ul>
            </div>
          </div>

          {/* Feature 2: Predictive Dashboard */}
          <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-20">
            <div className="flex-1">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-2xl mb-6 shadow-sm">
                <FontAwesomeIcon icon={faChartLine} />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-4 text-heading">Predictive Admin Dashboard</h3>
              <p className="text-body text-lg mb-6">
                Analisis data cerdas yang memprediksi fluktuasi sampah. Mengantisipasi lonjakan akibat cuaca ekstrem atau acara publik sebelum terjadi krisis penumpukan.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-gray-700">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-primary-500" /> Grafik tren fluktuasi realtime
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-primary-500" /> Peringatan status area (Normal, Warning, High Priority)
                </li>
              </ul>
            </div>
            <div className="flex-1 relative">
              <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="font-bold text-gray-800">Prediksi Sampah Gelora Bung Karno, Jakarta</h4>
                  <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold">Warning Alert</span>
                </div>
                <div className="h-48 flex items-end gap-2 border-b border-gray-200 pb-3">
                  <div className="w-1/6 bg-green-200 hover:bg-green-300 rounded-t-md h-1/3 transition-all cursor-pointer"></div>
                  <div className="w-1/6 bg-green-200 hover:bg-green-300 rounded-t-md h-2/5 transition-all cursor-pointer"></div>
                  <div className="w-1/6 bg-yellow-300 hover:bg-yellow-400 rounded-t-md h-3/5 transition-all cursor-pointer relative group">
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity">7,200 Ton</div>
                  </div>
                  <div className="w-1/6 bg-red-400 hover:bg-red-500 rounded-t-md h-full transition-all cursor-pointer shadow-[0_0_15px_rgba(248,113,113,0.5)]"></div>
                  <div className="w-1/6 bg-yellow-300 hover:bg-yellow-400 rounded-t-md h-4/5 transition-all cursor-pointer"></div>
                  <div className="w-1/6 bg-green-200 hover:bg-green-300 rounded-t-md h-1/2 transition-all cursor-pointer"></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-3 font-medium">
                  <span>Senin</span>
                  <span>Selasa</span>
                  <span>Rabu</span>
                  <span className="text-red-500 font-bold">Kamis (Event)</span>
                  <span>Jumat</span>
                  <span>Sabtu</span>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 3: Dynamic Route */}
          <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-20">
            <div className="flex-1 order-2 md:order-1 relative">
              <div className="bg-white rounded-2xl shadow-soft border border-gray-100 h-64 md:h-80 relative overflow-hidden">
                {/* Map background */}
                <div className="absolute inset-0 bg-[#f0f4f8]">
                  <svg className="w-full h-full" viewBox="0 0 400 320">
                    {/* Parks */}
                    <rect x="20" y="20" width="70" height="55" rx="4" fill="#d1fae5" />
                    <rect x="310" y="210" width="70" height="40" rx="4" fill="#d1fae5" />
                    <rect x="140" y="15" width="45" height="30" rx="4" fill="#d1fae5" />

                    {/* Buildings */}
                    <rect x="95" y="10" width="28" height="22" rx="2" fill="#e2e8f0" />
                    <rect x="95" y="38" width="28" height="22" rx="2" fill="#e2e8f0" />
                    <rect x="128" y="55" width="22" height="28" rx="2" fill="#e2e8f0" />
                    <rect x="25" y="115" width="35" height="28" rx="2" fill="#e2e8f0" />
                    <rect x="65" y="125" width="22" height="18" rx="2" fill="#e2e8f0" />
                    <rect x="260" y="10" width="35" height="28" rx="2" fill="#e2e8f0" />
                    <rect x="300" y="35" width="28" height="22" rx="2" fill="#e2e8f0" />
                    <rect x="330" y="100" width="40" height="32" rx="2" fill="#e2e8f0" />
                    <rect x="200" y="160" width="28" height="22" rx="2" fill="#e2e8f0" />
                    <rect x="235" y="170" width="22" height="18" rx="2" fill="#e2e8f0" />

                    {/* Main roads */}
                    <line x1="0" y1="130" x2="400" y2="130" stroke="white" strokeWidth="9" />
                    <line x1="0" y1="130" x2="400" y2="130" stroke="#f8fafc" strokeWidth="7" />
                    <line x1="160" y1="0" x2="160" y2="320" stroke="white" strokeWidth="9" />
                    <line x1="160" y1="0" x2="160" y2="320" stroke="#f8fafc" strokeWidth="7" />

                    {/* Secondary roads */}
                    <line x1="0" y1="230" x2="400" y2="230" stroke="white" strokeWidth="5" />
                    <line x1="0" y1="60" x2="280" y2="60" stroke="white" strokeWidth="4" />
                    <line x1="55" y1="0" x2="55" y2="130" stroke="white" strokeWidth="3" />
                    <line x1="360" y1="60" x2="360" y2="320" stroke="white" strokeWidth="4" />

                    {/* Route path glow */}
                    <path d="M 75 60 L 160 60 L 160 130 L 360 130"
                          fill="none" stroke="#10b981" strokeWidth="10"
                          strokeLinecap="round" strokeLinejoin="round" opacity="0.15" />
                    {/* Route path */}
                    <path d="M 75 60 L 160 60 L 160 130 L 360 130"
                          fill="none" stroke="#10b981" strokeWidth="4"
                          strokeLinecap="round" strokeLinejoin="round" />

                    {/* Start marker A */}
                    <g transform="translate(75, 60)">
                      <circle r="12" fill="#10b981" stroke="white" strokeWidth="3" />
                      <text y="4" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">A</text>
                    </g>

                    {/* End marker B */}
                    <g transform="translate(360, 130)">
                      <circle r="12" fill="#ef4444" stroke="white" strokeWidth="3" />
                      <text y="4" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">B</text>
                    </g>

                    {/* Waypoint stops */}
                    <g transform="translate(160, 60)">
                      <circle r="5" fill="#f59e0b" stroke="white" strokeWidth="2" />
                    </g>
                    <g transform="translate(160, 130)">
                      <circle r="5" fill="#f59e0b" stroke="white" strokeWidth="2" />
                    </g>
                  </svg>
                </div>

                {/* Route info card */}
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="bg-white/85 backdrop-blur-md rounded-xl shadow-md p-3 md:p-4 border border-white/60">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
                          <svg className="w-4 h-4 text-primary-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                          </svg>
                          <span className="truncate">Rute Optimal · Truk 04</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 truncate">6.2 km · 18 menit · 3 perhentian</div>
                      </div>
                      <div className="bg-primary-50 text-primary-600 text-xs font-bold px-3 py-1.5 rounded-lg shrink-0">
                        Navigasi
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 order-1 md:order-2">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center text-2xl mb-6 shadow-sm">
                <FontAwesomeIcon icon={faMapMarkedAlt} />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-4 text-heading">Dynamic Route Recommendation</h3>
              <p className="text-body text-lg mb-6">
                Sistem navigasi pintar yang merekomendasikan rute penjemputan terbaik bagi armada kebersihan. Memprioritaskan area kritis untuk mencegah penumpukan berlebih.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-gray-700">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-primary-500" /> Menghemat bahan bakar armada
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-primary-500" /> Penjemputan lebih cepat dan efisien
                </li>
              </ul>
            </div>
          </div>

        </div>
      </div>

      {/* Global style for map dash animation */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes dash {
          to {
            stroke-dashoffset: -20;
          }
        }
      `}} />
    </section>
  );
}
