import MainLayout from '../layouts/MainLayout';
import HeroSection from '../components/sections/HeroSection';
import FeaturesSection from '../components/sections/FeaturesSection';
import RealTimeDataSection from '../components/sections/RealTimeDataSection';
import ServicesSection from '../components/sections/ServicesSection';

export default function LandingPage() {
  return (
    <MainLayout>
      <HeroSection />
      <FeaturesSection />
      <RealTimeDataSection />
      <ServicesSection />
    </MainLayout>
  );
}
