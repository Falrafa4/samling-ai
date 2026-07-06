import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLaptop, faCouch, faBullhorn, faMapMarkerAlt, faInfoCircle, faVial, faBus, faFileSignature } from '@fortawesome/free-solid-svg-icons';

export default function ServicesSection() {
  const mainServices = [
    {
      id: 1,
      title: 'Penjemputan e-Waste',
      description: 'Layanan pengumpulan khusus sampah elektronik rumah tangga berbahaya.',
      icon: faLaptop,
      color: 'text-blue-600',
      bg: 'bg-blue-100'
    },
    {
      id: 2,
      title: 'Bulky Waste',
      description: 'Layanan pengangkutan sampah berukuran besar (kasur, lemari, dll).',
      icon: faCouch,
      color: 'text-orange-600',
      bg: 'bg-orange-100'
    },
    {
      id: 3,
      title: 'Whistleblowing System',
      description: 'Sarana aman bagi warga melaporkan pelanggaran pencemaran lingkungan.',
      icon: faBullhorn,
      color: 'text-red-600',
      bg: 'bg-red-100'
    },
    {
      id: 4,
      title: 'Cari Bank Sampah',
      description: 'Peta interaktif berbasis lokasi untuk menukar sampah menjadi nilai ekonomis.',
      icon: faMapMarkerAlt,
      color: 'text-primary-600',
      bg: 'bg-primary-100'
    }
  ];

  const otherServices = [
    {
      id: 1,
      title: 'Informasi Publik',
      description: 'Akses data dan informasi publik terkait kebersihan serta layanan DLH.',
      icon: faInfoCircle,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      borderHover: 'hover:border-blue-300',
      href: 'https://lingkunganhidup.jakarta.go.id/layanan/ppid'
    },
    {
      id: 2,
      title: 'Uji Lab',
      description: 'Layanan pengujian kualitas sampel air, tanah, dan udara.',
      icon: faVial,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
      borderHover: 'hover:border-purple-300',
      href: 'https://lingkunganhidup.jakarta.go.id/layanan/lab'
    },
    {
      id: 3,
      title: 'Bus Toilet',
      description: 'Toilet umum bergerak untuk area publik, acara, dan tanggap darurat.',
      icon: faBus,
      color: 'text-cyan-600',
      bg: 'bg-cyan-100',
      borderHover: 'hover:border-cyan-300',
      href: 'https://lingkunganhidup.jakarta.go.id/layanan/bus-toilet'
    },
    {
      id: 4,
      title: 'Perizinan Lingkungan',
      description: 'Pengajuan dan pemantauan izin lingkungan secara daring.',
      icon: faFileSignature,
      color: 'text-amber-600',
      bg: 'bg-amber-100',
      borderHover: 'hover:border-amber-300',
      href: 'https://lingkunganhidup.jakarta.go.id/layanan/perizinan-lingkungan'
    },
  ];

  return (
    <section id="layanan" className="py-24 bg-white">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-heading">Layanan Kebersihan SAMLING AI</h2>
          <p className="text-body text-lg">
            Akses mudah ke berbagai sub-layanan utama dan layanan pendukung dari Dinas Lingkungan Hidup DKI Jakarta.
          </p>
        </div>

        {/* Main Services */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {mainServices.map((service) => (
            <div key={service.id} className="group rounded-2xl border border-gray-200 p-8 hover:border-primary-500 hover:shadow-hover transition-all cursor-pointer bg-white">
              <div className="flex items-start gap-6">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0 transition-transform group-hover:scale-110 ${service.bg} ${service.color}`}>
                  <FontAwesomeIcon icon={service.icon} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-heading mb-2 group-hover:text-primary-600 transition-colors">{service.title}</h3>
                  <p className="text-body leading-relaxed">{service.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Other Services */}
        <div className="border-t border-gray-100 pt-16">
          <h3 className="text-xl font-bold text-center mb-10 text-gray-400 tracking-wider">LAYANAN LAINNYA</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {otherServices.map((service) => (
              <a
                key={service.id}
                href={service.href}
                className={`group block rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:shadow-lg ${service.borderHover}`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg mb-4 transition-transform group-hover:scale-110 ${service.bg} ${service.color}`}>
                  <FontAwesomeIcon icon={service.icon} />
                </div>
                <h4 className="font-bold text-heading mb-2 group-hover:text-primary-600 transition-colors">{service.title}</h4>
                <p className="text-sm text-body leading-relaxed mb-4">{service.description}</p>
                <span className={`inline-flex items-center gap-1.5 text-sm font-semibold transition-all ${service.color}`}>
                  Selengkapnya
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
