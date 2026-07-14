import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkedAlt, faChartLine, faRobot, faCheckCircle } from '@fortawesome/free-solid-svg-icons';

export default function FeaturesSection() {
  return (
    <section id="fitur" className="py-24 bg-white relative">
      <div className="container mx-auto px-6 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-heading">Fitur Utama SAMLING AI</h2>
          <p className="text-body text-lg">
            Kolaborasi teknologi AI dan partisipasi publik untuk menciptakan sistem manajemen kebersihan yang proaktif dan efisien.
          </p>
        </motion.div>

        <div className="space-y-20">

          {/* Feature 1: WhatsApp Chatbot */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex flex-col md:flex-row items-center gap-12 lg:gap-20"
          >
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex-1 order-2 md:order-1 relative"
            >
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
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex-1 order-1 md:order-2"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center text-2xl mb-6 shadow-sm"
              >
                <FontAwesomeIcon icon={faRobot} />
              </motion.div>
              <motion.h3
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.5 }}
                className="text-2xl md:text-3xl font-bold mb-4 text-heading"
              >
                WhatsApp Chatbot untuk Pelaporan Warga
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.6 }}
                className="text-body text-lg mb-6"
              >
                Laporkan penumpukan sampah liar dengan cepat tanpa perlu mengunduh aplikasi tambahan. AI kami akan memverifikasi dan memprioritaskan laporan secara otomatis.
              </motion.p>
              <motion.ul
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={{ visible: { transition: { staggerChildren: 0.15, delayChildren: 0.7 } } }}
                className="space-y-3"
              >
                <motion.li
                  variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}
                  className="flex items-center gap-3 text-gray-700"
                >
                  <FontAwesomeIcon icon={faCheckCircle} className="text-primary-500" /> Deteksi dini penumpukan sampah
                </motion.li>
                <motion.li
                  variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}
                  className="flex items-center gap-3 text-gray-700"
                >
                  <FontAwesomeIcon icon={faCheckCircle} className="text-primary-500" /> Verifikasi lokasi otomatis
                </motion.li>
              </motion.ul>
            </motion.div>
          </motion.div>

          {/* Feature 2: Predictive Dashboard */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex flex-col md:flex-row items-center gap-12 lg:gap-20"
          >
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex-1"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-2xl mb-6 shadow-sm"
              >
                <FontAwesomeIcon icon={faChartLine} />
              </motion.div>
              <motion.h3
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="text-2xl md:text-3xl font-bold mb-4 text-heading"
              >
                Predictive Admin Dashboard
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.5 }}
                className="text-body text-lg mb-6"
              >
                Analisis data cerdas yang memprediksi fluktuasi sampah. Mengantisipasi lonjakan akibat cuaca ekstrem atau acara publik sebelum terjadi krisis penumpukan.
              </motion.p>
              <motion.ul
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={{ visible: { transition: { staggerChildren: 0.15, delayChildren: 0.6 } } }}
                className="space-y-3"
              >
                <motion.li
                  variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}
                  className="flex items-center gap-3 text-gray-700"
                >
                  <FontAwesomeIcon icon={faCheckCircle} className="text-primary-500" /> Grafik tren fluktuasi realtime
                </motion.li>
                <motion.li
                  variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}
                  className="flex items-center gap-3 text-gray-700"
                >
                  <FontAwesomeIcon icon={faCheckCircle} className="text-primary-500" /> Peringatan status area (Normal, Warning, High Priority)
                </motion.li>
              </motion.ul>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="flex-1 relative"
            >
              <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="font-bold text-gray-800">Prediksi Sampah Kecamatan Gambir, Jakarta</h4>
                  <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold">Warning Alert</span>
                </div>
                <div className="h-48 flex items-end gap-2 border-b border-gray-200 pb-3">
                  <motion.div
                    initial={{ height: 0 }}
                    whileInView={{ height: "33.33%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
                    className="w-1/6 bg-green-200 hover:bg-green-300 rounded-t-md cursor-pointer"
                  />
                  <motion.div
                    initial={{ height: 0 }}
                    whileInView={{ height: "40%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
                    className="w-1/6 bg-green-200 hover:bg-green-300 rounded-t-md cursor-pointer"
                  />
                  <motion.div
                    initial={{ height: 0 }}
                    whileInView={{ height: "60%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
                    className="w-1/6 bg-yellow-300 hover:bg-yellow-400 rounded-t-md cursor-pointer relative group"
                  >
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity">7,200 Ton</div>
                  </motion.div>
                  <motion.div
                    initial={{ height: 0 }}
                    whileInView={{ height: "100%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.7, ease: "easeOut" }}
                    className="w-1/6 bg-red-400 hover:bg-red-500 rounded-t-md cursor-pointer shadow-[0_0_15px_rgba(248,113,113,0.5)]"
                  />
                  <motion.div
                    initial={{ height: 0 }}
                    whileInView={{ height: "80%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.8, ease: "easeOut" }}
                    className="w-1/6 bg-yellow-300 hover:bg-yellow-400 rounded-t-md cursor-pointer"
                  />
                  <motion.div
                    initial={{ height: 0 }}
                    whileInView={{ height: "50%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.9, ease: "easeOut" }}
                    className="w-1/6 bg-green-200 hover:bg-green-300 rounded-t-md cursor-pointer"
                  />
                </div>
                <div className="flex justify-between text-[10px] sm:text-xs text-gray-500 mt-3 font-medium">
                  <span>Senin</span>
                  <span>Selasa</span>
                  <span>Rabu</span>
                  <span className="text-red-500 font-bold">Kamis <span className="hidden sm:inline">(Event)</span></span>
                  <span>Jumat</span>
                  <span>Sabtu</span>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Feature 3: Dynamic Route */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex flex-col md:flex-row items-center gap-12 lg:gap-20"
          >
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex-1 order-2 md:order-1 relative"
            >
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
                    <motion.path
                      d="M 75 60 L 160 60 L 160 130 L 360 130"
                      fill="none" stroke="#10b981" strokeWidth="10"
                      strokeLinecap="round" strokeLinejoin="round"
                      initial={{ pathLength: 0, opacity: 0 }}
                      whileInView={{ pathLength: 1, opacity: 0.15 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut" }}
                    />
                    {/* Route path */}
                    <motion.path
                      d="M 75 60 L 160 60 L 160 130 L 360 130"
                      fill="none" stroke="#10b981" strokeWidth="4"
                      strokeLinecap="round" strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      whileInView={{ pathLength: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut" }}
                    />

                    {/* Truck animating along route */}
                    <motion.g
                      initial={{ x: 75, y: 60, rotate: 0, opacity: 0 }}
                      whileInView={{
                        x: [75, 160, 160, 360],
                        y: [60, 60, 130, 130],
                        rotate: [0, 0, 90, 0],
                        opacity: [0, 1, 1, 1],
                      }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 3,
                        times: [0, 0.25, 0.45, 1],
                        delay: 0.7,
                        ease: "linear",
                      }}
                    >
                      {/* Truck body */}
                      <rect x="-12" y="-8" width="14" height="10" rx="2" fill="#3b82f6" stroke="white" strokeWidth="1.5" />
                      {/* Cabin */}
                      <path d="M2-6 l7 0 l0 6 l-7 0 z" fill="#2563eb" stroke="white" strokeWidth="1.5" />
                      {/* Wheels */}
                      <circle cx="-7" cy="3" r="3" fill="#1f2937" stroke="white" strokeWidth="1" />
                      <circle cx="5" cy="3" r="3" fill="#1f2937" stroke="white" strokeWidth="1" />
                      {/* Cargo highlight */}
                      <rect x="-10" y="-6" width="10" height="6" rx="1" fill="rgba(255,255,255,0.2)" />
                    </motion.g>



                    {/* Mission completed check icon */}
                    <motion.g
                      transform="translate(360, 95)"
                      initial={{ scale: 0, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 3.7, type: "spring", stiffness: 200 }}
                    >
                      <circle cx="0" cy="0" r="12" fill="#10b981" stroke="white" strokeWidth="2.5" />
                      <path d="M-6 0 l4.5 4.5 l8-9.5" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </motion.g>
                  </svg>
                </div>

                {/* Route info card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 2.5 }}
                  className="absolute bottom-3 left-3 right-3"
                >
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
                </motion.div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex-1 order-1 md:order-2"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center text-2xl mb-6 shadow-sm"
              >
                <FontAwesomeIcon icon={faMapMarkedAlt} />
              </motion.div>
              <motion.h3
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.5 }}
                className="text-2xl md:text-3xl font-bold mb-4 text-heading"
              >
                Dynamic Route Recommendation
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.6 }}
                className="text-body text-lg mb-6"
              >
                Sistem navigasi pintar yang merekomendasikan rute penjemputan terbaik bagi armada kebersihan. Memprioritaskan area kritis untuk mencegah penumpukan berlebih.
              </motion.p>
              <motion.ul
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={{ visible: { transition: { staggerChildren: 0.15, delayChildren: 0.7 } } }}
                className="space-y-3"
              >
                <motion.li
                  variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}
                  className="flex items-center gap-3 text-gray-700"
                >
                  <FontAwesomeIcon icon={faCheckCircle} className="text-primary-500" /> Menghemat bahan bakar armada
                </motion.li>
                <motion.li
                  variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}
                  className="flex items-center gap-3 text-gray-700"
                >
                  <FontAwesomeIcon icon={faCheckCircle} className="text-primary-500" /> Penjemputan lebih cepat dan efisien
                </motion.li>
              </motion.ul>
            </motion.div>
          </motion.div>

        </div>
      </div>


    </section>
  );
}
