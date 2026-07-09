import { useEffect } from 'react';
import { useLocation } from 'react-router';
import MainLayout from '../layouts/MainLayout';
import HeroSection from '../components/sections/HeroSection';
import FeaturesSection from '../components/sections/FeaturesSection';
import RealTimeDataSection from '../components/sections/RealTimeDataSection';
import ServicesSection from '../components/sections/ServicesSection';

export default function LandingPage() {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.substring(1));
      if (element) {
        // Jeda waktu sedikit (100ms) untuk memastikan elemen DOM siap
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [hash]);

  return (
    <MainLayout>
      <HeroSection />
      <FeaturesSection />
      <RealTimeDataSection />
      <ServicesSection />
    </MainLayout>
  );
}
