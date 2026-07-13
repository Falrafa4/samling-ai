import { useState, useEffect } from "react";
import { Link } from "react-router";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "glassmorphism shadow-soft py-3" : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-6 max-w-7xl flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <img
            src="/img/samling-v1-transparent.webp"
            alt="Samling AI"
            className="h-8 w-auto"
          />
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8 font-medium text-body">
          <Link
            to="/#fitur"
            className="hover:text-primary-600 transition-colors"
          >
            Fitur
          </Link>
          <Link
            to="/#data"
            className="hover:text-primary-600 transition-colors"
          >
            Data Realtime
          </Link>
          <Link
            to="/#layanan"
            className="hover:text-primary-600 transition-colors"
          >
            Layanan
          </Link>
          <Link
            to="/#kontak"
            className="hover:text-primary-600 transition-colors"
          >
            Kontak
          </Link>
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
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-heading p-2 focus:outline-none"
          aria-label="Toggle menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {mobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16m-7 6h7"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-md border-b border-gray-200 py-4 px-6 flex flex-col gap-4 font-medium shadow-lg absolute top-full left-0 right-0 z-40">
          <Link
            to="/#fitur"
            onClick={() => setMobileMenuOpen(false)}
            className="hover:text-primary-600 transition-colors py-2 border-b border-gray-100"
          >
            Fitur
          </Link>
          <Link
            to="/#data"
            onClick={() => setMobileMenuOpen(false)}
            className="hover:text-primary-600 transition-colors py-2 border-b border-gray-100"
          >
            Data Realtime
          </Link>
          <Link
            to="/#layanan"
            onClick={() => setMobileMenuOpen(false)}
            className="hover:text-primary-600 transition-colors py-2 border-b border-gray-100"
          >
            Layanan
          </Link>
          <Link
            to="/#kontak"
            onClick={() => setMobileMenuOpen(false)}
            className="hover:text-primary-600 transition-colors py-2 border-b border-gray-100"
          >
            Kontak
          </Link>
          <Link
            to="/login"
            onClick={() => setMobileMenuOpen(false)}
            className="w-full text-center px-6 py-2.5 rounded-full bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors mt-2"
          >
            Masuk Dashboard
          </Link>
        </div>
      )}
    </nav>
  );
}
