import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt, faTruck, faWind, faCalendarAlt, faMapPin } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';

// Smooth counting up animation for numbers as they enter viewport
function CountUp({ target, duration = 1200, formatter = (v) => Math.floor(v).toLocaleString('id-ID') }) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let startTimestamp = null;
    let animationFrameId = null;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Easing function: easeOutQuad
      const easeProgress = progress * (2 - progress);
      
      setCount(easeProgress * target);

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      }
    };

    animationFrameId = window.requestAnimationFrame(step);

    return () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isVisible, target, duration]);

  return <span ref={elementRef}>{formatter(count)}</span>;
}

// Sub-component to animate digits as they change
function AnimatedDigit({ value, label }) {
  return (
    <div className="flex flex-col items-center bg-white/10 px-2 sm:px-4 py-2 sm:py-3 rounded-xl min-w-[55px] sm:min-w-[70px] backdrop-blur-sm border border-white/10 relative overflow-hidden group hover:bg-white/15 transition-colors">
      <div className="overflow-hidden h-6 sm:h-8 md:h-10 flex items-center justify-center">
        <span
          key={value}
          className="inline-block text-lg sm:text-2xl md:text-3xl font-extrabold text-white select-none animate-[slideDown_0.25s_cubic-bezier(0.16,1,0.3,1)_forwards]"
        >
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-[8px] sm:text-[10px] md:text-xs font-semibold text-white/80 mt-1 uppercase tracking-wider">{label}</span>
    </div>
  );
}

export default function RealTimeDataSection() {
  const [summary, setSummary] = useState({
    event_alert: {
      name: "Hari Raya Lebaran",
      increase: "+15%",
      target_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString()
    },
    volume_sampah: {
      value: 7421,
      trend: "+2.4%"
    },
    truk_beroperasi: {
      value: 695,
      trend: "-1.2%"
    },
    udara_terbaik: {
      value: 42.0,
      status: "Baik",
      location: "Jakarta Selatan (Jagakarsa)"
    },
    udara_terburuk: {
      value: 115.0,
      status: "Tidak Sehat",
      location: "Jakarta Timur (Cipayung)"
    }
  });

  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Ambil data ringkasan landing page dari API
  useEffect(() => {
    let isMounted = true;
    api.getLandingSummary()
      .then(res => {
        if (isMounted && res.success && res.data) {
          setSummary(res.data);
        }
      })
      .catch(err => {
        console.error("Gagal memuat ringkasan real-time:", err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const calculateTimeLeft = (targetDateStr) => {
    const difference = +new Date(targetDateStr) - +new Date();
    let timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      };
    }
    return timeLeft;
  };

  // Efek timer countdown yang akurat
  useEffect(() => {
    setCountdown(calculateTimeLeft(summary.event_alert.target_date));

    const timer = setInterval(() => {
      setCountdown(calculateTimeLeft(summary.event_alert.target_date));
    }, 1000);

    return () => clearInterval(timer);
  }, [summary.event_alert.target_date]);

  return (
    <section id="data" className="py-24 bg-neutral-secondary-medium">
      {/* Animation Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideDown {
          0% { transform: translateY(-50%); opacity: 0; filter: blur(2px); }
          100% { transform: translateY(0); opacity: 1; filter: blur(0); }
        }
      `}} />

      <div className="container mx-auto px-6 max-w-7xl">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-heading">Informasi Real-Time & Prediksi Berbasis AI</h2>
          <p className="text-body text-lg">
            Update kapasitas TPST Bantar Gebang, kualitas udara (ISPU), serta deteksi dini lonjakan event terdekat.
          </p>
        </div>

        {/* AI Predictive Event Card (The new recommendation from PRD) */}
        <div className="mb-12">
          <div className="bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-2xl p-8 md:p-10 shadow-lg text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-64 h-64 bg-white opacity-10 rounded-full blur-2xl"></div>
            
            <div className="relative z-10 flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <FontAwesomeIcon icon={faCalendarAlt} className="text-white" />
                </div>
                <span className="uppercase tracking-wider font-bold text-sm text-white/90">AI Predictive Alert</span>
              </div>
              <h3 className="text-2xl font-bold mb-2 text-white">Prediksi Lonjakan Sampah Event Terdekat: <br/><span className="text-amber-200 font-extrabold">{summary.event_alert.name}</span></h3>
              <p className="text-white/90">Estimasi kenaikan <span className="font-bold text-amber-200 bg-amber-400/15 border border-amber-400/20 px-2 py-0.5 rounded shadow-sm backdrop-blur-sm">{summary.event_alert.increase} Volume Sampah</span>. Armada tambahan disiagakan.</p>
            </div>
            
            <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 sm:p-6 text-center min-w-0 w-full sm:min-w-[320px] sm:w-auto">
              <div className="text-sm font-medium mb-3 text-white/95">Waktu menuju Event:</div>
              <div className="flex justify-center items-center gap-1 sm:gap-2 md:gap-3">
                <AnimatedDigit value={countdown.days} label="Hari" />
                <span className="text-xl md:text-2xl font-bold text-white/70 select-none">:</span>
                <AnimatedDigit value={countdown.hours} label="Jam" />
                <span className="text-xl md:text-2xl font-bold text-white/70 select-none">:</span>
                <AnimatedDigit value={countdown.minutes} label="Menit" />
                <span className="text-xl md:text-2xl font-bold text-white/70 select-none">:</span>
                <AnimatedDigit value={countdown.seconds} label="Detik" />
              </div>
            </div>
          </div>
        </div>

        {/* 4 Data Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1: Sampah Masuk */}
          <div className="bg-white rounded-2xl p-6 shadow-soft border border-orange-100 border-t-4 border-t-orange-500 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center text-xl">
                <FontAwesomeIcon icon={faTrashAlt} />
              </div>
              <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">Hari Ini</span>
            </div>
            <h4 className="text-gray-500 text-sm font-bold mb-1">Volume Sampah (TPST)</h4>
            <div className="text-3xl font-bold text-heading"><CountUp target={summary.volume_sampah.value} /> <span className="text-lg font-normal text-gray-500">Ton</span></div>
            <div className={`text-xs mt-2 font-medium flex items-center gap-1 ${summary.volume_sampah.trend.startsWith('-') ? 'text-green-500' : 'text-red-500'}`}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={summary.volume_sampah.trend.startsWith('-') ? "M19 14l-7 7m0 0l-7-7m7 7V3" : "M5 10l7-7m0 0l7 7m-7-7v18"}></path>
              </svg>
              {summary.volume_sampah.trend} dari kemarin
            </div>
          </div>

          {/* Card 2: Truk Masuk */}
          <div className="bg-white rounded-2xl p-6 shadow-soft border border-yellow-100 border-t-4 border-t-yellow-400 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-xl flex items-center justify-center text-xl">
                <FontAwesomeIcon icon={faTruck} />
              </div>
              <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">Hari Ini</span>
            </div>
            <h4 className="text-gray-500 text-sm font-bold mb-1">Total Truk Beroperasi</h4>
            <div className="text-3xl font-bold text-heading"><CountUp target={summary.truk_beroperasi.value} /> <span className="text-lg font-normal text-gray-500">Unit</span></div>
            <div className={`text-xs mt-2 font-medium flex items-center gap-1 ${summary.truk_beroperasi.trend.startsWith('-') ? 'text-red-500' : 'text-green-500'}`}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={summary.truk_beroperasi.trend.startsWith('-') ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"}></path>
              </svg>
              {summary.truk_beroperasi.trend} dari kemarin
            </div>
          </div>

          {/* Card 3: Kualitas Udara Terbaik */}
          <div className="bg-white rounded-2xl p-6 shadow-soft border border-green-100 border-t-4 border-t-green-500 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center text-xl">
                <FontAwesomeIcon icon={faWind} />
              </div>
              <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">Live ISPU</span>
            </div>
            <h4 className="text-gray-500 text-sm font-bold mb-1">Udara Terbaik (ISPU)</h4>
            <div className="text-3xl font-bold text-heading text-green-500"><CountUp target={summary.udara_terbaik.value} /> <span className="text-lg font-normal text-gray-500">/ {summary.udara_terbaik.status}</span></div>
            <div className="text-xs text-gray-600 mt-2 font-medium">
              <FontAwesomeIcon icon={faMapPin} className="text-gray-400 mr-1.5" /> {summary.udara_terbaik.location}
            </div>
          </div>

          {/* Card 4: Kualitas Udara Terburuk */}
          <div className="bg-white rounded-2xl p-6 shadow-soft border border-red-100 border-t-4 border-t-red-500 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center text-xl">
                <FontAwesomeIcon icon={faWind} />
              </div>
              <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">Live ISPU</span>
            </div>
            <h4 className="text-gray-500 text-sm font-bold mb-1">Udara Terburuk (ISPU)</h4>
            <div className="text-3xl font-bold text-heading text-red-500"><CountUp target={summary.udara_terburuk.value} /> <span className="text-lg font-normal text-gray-500">/ {summary.udara_terburuk.status}</span></div>
            <div className="text-xs text-gray-600 mt-2 font-medium">
              <FontAwesomeIcon icon={faMapPin} className="text-gray-400 mr-1.5" /> {summary.udara_terburuk.location}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
