import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faPhone, faEnvelope, faUsers, faUser, faChartLine } from '@fortawesome/free-solid-svg-icons';

export default function Footer() {
  return (
    <footer id="kontak" className="relative mt-24">
      {/* Save Our Earth Banner */}
      <div className="bg-[#E6F4EA] border-t border-b border-emerald-100 py-16 relative overflow-hidden">
        {/* Monas Silhouette Background Motif */}
        <svg className="absolute right-10 bottom-0 h-36 opacity-10 text-emerald-800 pointer-events-none hidden md:block" viewBox="0 0 120 180" fill="currentColor">
          <rect x="10" y="170" width="100" height="4" rx="2" />
          <path d="M30 170 L90 170 L80 145 L40 145 Z" />
          <rect x="48" y="145" width="24" height="6" />
          <rect x="53" y="60" width="14" height="85" />
          <path d="M48 60 L72 60 L68 53 L52 53 Z" />
          <path d="M54 53 C54 48 57 42 60 35 C63 42 66 48 66 53 Z" fill="#EAB308" />
        </svg>

        {/* Bundaran HI / Selamat Datang Silhouette Background Motif */}
        <svg className="absolute left-10 bottom-0 h-36 opacity-10 text-emerald-800 pointer-events-none hidden md:block" viewBox="0 0 120 180" fill="currentColor">
          <ellipse cx="60" cy="170" rx="35" ry="8" />
          <rect x="52" y="70" width="6" height="100" />
          <rect x="62" y="70" width="6" height="100" />
          <rect x="52" y="75" width="16" height="4" />
          <path d="M53 68 C53 64 55 60 55 60 L54 68 Z" />
          <path d="M67 68 C67 64 65 60 65 60 L66 68 Z" />
          <path d="M55 60 Q48 54 46 56" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M65 60 Q72 54 74 56" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>

        <div className="container mx-auto px-6 max-w-7xl text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 font-space tracking-wide text-[#064E3B]">SAVE OUR EARTH</h2>
          <p className="text-lg md:text-xl text-[#137333] max-w-2xl mx-auto font-bold">
            Bersama membangun Jakarta yang hijau dan berkelanjutan untuk generasi mendatang
          </p>
        </div>
      </div>

      <div className="bg-[#F8FAFC] text-slate-900 pt-16 pb-8 border-t border-slate-200/60">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-12">
            
            {/* Brand & Description */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md">
                  S
                </div>
                <span className="font-bold text-xl tracking-tight text-slate-900">
                  SAMLING <span className="text-primary-600">AI</span>
                </span>
              </div>
              <p className="text-slate-600 mb-6 leading-relaxed font-medium">
                Solusi pengelolaan sampah pintar berbasis AI untuk Dinas Lingkungan Hidup DKI Jakarta.
              </p>
            </div>

            {/* Stats */}
            <div>
              <h3 className="text-lg font-bold mb-6 text-slate-950 border-b border-slate-200 pb-2 inline-block">Statistik Pengunjung</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-slate-700">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100/50">
                    <FontAwesomeIcon icon={faUser} />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-lg">1</div>
                    <div className="text-sm text-slate-500 font-medium">Active User</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-slate-700">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100/50">
                    <FontAwesomeIcon icon={faUsers} />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-lg">54</div>
                    <div className="text-sm text-slate-500 font-medium">Daily Visitor</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-slate-700">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100/50">
                    <FontAwesomeIcon icon={faChartLine} />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-lg">1,108</div>
                    <div className="text-sm text-slate-500 font-medium">Monthly Visitor</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Box */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
              <h3 className="text-lg font-bold mb-6 text-slate-900">Kontak Kami</h3>
              <ul className="space-y-4 text-slate-700">
                <li className="flex items-start gap-3">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="mt-1 text-emerald-600 shrink-0" />
                  <span className="text-sm leading-relaxed text-slate-600 font-medium">Grha Intirub Business Park, Jl. Cililitan Besar No. 454 Jakarta Timur</span>
                </li>
                <li className="flex items-center gap-3">
                  <FontAwesomeIcon icon={faPhone} className="text-emerald-600 shrink-0" />
                  <span className="text-sm text-slate-600 font-medium">(021) 8092744</span>
                </li>
                <li className="flex items-center gap-3">
                  <FontAwesomeIcon icon={faEnvelope} className="text-emerald-600 shrink-0" />
                  <span className="text-sm text-slate-600 font-medium">dinaslh@jakarta.go.id</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row justify-center items-center gap-4">
            <p className="text-slate-500 text-sm font-medium">
              &copy; {new Date().getFullYear()} SAMLING AI - Sekawan Engineers.
            </p>
            
          </div>
        </div>
      </div>
    </footer>
  );
}
