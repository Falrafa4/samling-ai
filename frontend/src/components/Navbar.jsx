import { useState, useEffect } from 'react';
import { Link } from 'react-router';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'glassmorphism shadow-soft py-3' : 'bg-transparent py-5'
      }`}
    >
      <div className="container mx-auto px-6 max-w-7xl flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md group-hover:scale-105 transition-transform">
            S
          </div>
          <span className="font-bold text-xl tracking-tight text-heading">
            SAMLING <span className="text-primary-600">AI</span>
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8 font-medium text-body">
          <a href="#fitur" className="hover:text-primary-600 transition-colors">Fitur</a>
          <a href="#data" className="hover:text-primary-600 transition-colors">Data Realtime</a>
          <a href="#layanan" className="hover:text-primary-600 transition-colors">Layanan</a>
          <a href="#kontak" className="hover:text-primary-600 transition-colors">Kontak</a>
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            to="/login"
            className="px-6 py-2.5 rounded-full bg-primary-600 text-white font-medium hover:bg-primary-700 hover:shadow-hover transition-all transform hover:-translate-y-0.5"
          >
            Masuk Dashboard
          </Link>
        </div>

        {/* Mobile menu button (Simplified for now) */}
        <button className="md:hidden text-heading p-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>
      </div>
    </nav>
  );
}
