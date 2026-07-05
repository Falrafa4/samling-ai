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
    { id: 1, title: 'Informasi Publik', icon: faInfoCircle },
    { id: 2, title: 'Uji Lab', icon: faVial },
    { id: 3, title: 'Bus Toilet', icon: faBus },
    { id: 4, title: 'Perizinan Lingkungan', icon: faFileSignature },
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

        {/* Main Services (Highlight Cards) */}
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

        {/* Other Services (Minimalist Grid) */}
        <div className="border-t border-gray-100 pt-16">
          <h3 className="text-xl font-bold text-center mb-8 text-gray-500">LAYANAN LAINNYA</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {otherServices.map((service) => (
              <div key={service.id} className="bg-neutral-secondary-medium rounded-xl p-6 text-center hover:bg-primary-50 hover:text-primary-700 transition-colors cursor-pointer group">
                <div className="text-3xl text-gray-400 group-hover:text-primary-500 transition-colors mb-3">
                  <FontAwesomeIcon icon={service.icon} />
                </div>
                <h4 className="font-bold text-sm text-heading group-hover:text-primary-700">{service.title}</h4>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
