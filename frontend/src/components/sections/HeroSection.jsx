import { Link } from 'react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center pt-20 pb-16 lg:pt-24 lg:pb-20 overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[800px] h-[800px] bg-primary-50 rounded-full blur-3xl opacity-60 z-0"></div>
      <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[600px] h-[600px] bg-primary-100 rounded-full blur-3xl opacity-40 z-0"></div>

      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-10">
          
          {/* Text Content */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-block px-4 py-1.5 rounded-full bg-primary-50 text-primary-600 font-bold text-sm mb-6 border border-primary-100">
              Menunju Jakarta yang lebih hijau dan berkelanjutan
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-heading">
              Transformasi Pengelolaan Sampah Kota yang <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-700">Responsif & Berbasis Data</span>
            </h1>
            
            <p className="text-lg md:text-xl text-body mb-10 max-w-2xl mx-auto lg:mx-0">
              SAMLING AI memprediksi lonjakan volume sampah dan mengoptimalkan rute armada dinas kebersihan untuk lingkungan Jakarta yang lebih hijau.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <a 
                href="https://wa.me/62859171657331" 
                target="_blank" 
                rel="noreferrer"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-green-500 text-white font-bold hover:bg-green-600 hover:shadow-hover transition-all flex items-center justify-center gap-2 transform hover:-translate-y-1"
              >
                <FontAwesomeIcon icon={faWhatsapp} className="text-xl" />
                Laporkan Sampah
              </a>
              <Link 
                to="/login"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white text-heading font-bold border border-gray-200 hover:border-primary-500 hover:text-primary-600 shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 transform hover:-translate-y-1"
              >
                Masuk Dashboard
                <FontAwesomeIcon icon={faArrowRight} />
              </Link>
            </div>
          </div>

          {/* 3D Illustration / Mockup Image */}
          <div className="flex-1 w-full max-w-lg lg:max-w-none relative animate-float">
            {/* Soft backdrop glow behind image */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary-200 to-primary-100 blur-2xl rounded-full opacity-50 transform scale-90"></div>
            
            {/* The generated image goes here. We'll use a placeholder div that mimics the generated image aspect for now, or point to an asset if one exists. */}
            <div className="relative rounded-[2rem] overflow-hidden shadow-soft bg-white border border-gray-100 aspect-square md:aspect-[4/3] flex items-center justify-center">
                <img 
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTEtShXJUyu1hpViUFMJ1EeFfWC4m4h-fQ_ScRrNrtENNKFyeA5uRAwH6Iq&s=10" 
                  alt="3D Smart City Illustration" 
                  className="object-cover w-full h-full opacity-90 mix-blend-multiply"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                
                {/* Floating Elements mimicking the 3D icons */}
                <div className="absolute top-10 right-10 bg-white p-3 rounded-2xl shadow-lg animate-pulse-soft">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-500 text-2xl">
                     <FontAwesomeIcon icon={faWhatsapp} />
                  </div>
                </div>

                <div className="absolute bottom-10 left-10 glassmorphism p-4 rounded-2xl shadow-lg border border-white/40 flex items-center gap-3 animate-float" style={{animationDelay: '1s'}}>
                  <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                  </div>
                  <div>
                     <p className="text-xs text-gray-600 font-bold">Efisiensi AI</p>
                     <p className="text-sm font-bold text-heading">+45%</p>
                  </div>
                </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
