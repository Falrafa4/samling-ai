import { useEffect, useState } from 'react';

export default function CircularProgress({ percent = 0, size = 160, label = "Kapasitas" }) {
  const [animatedPercent, setAnimatedPercent] = useState(0);
  const radius = 15.9155; // This keeps the circumference exactly 100 (2 * pi * r = 100)
  const circumference = 2 * Math.PI * radius; // ~100

  useEffect(() => {
    // Set timeout to animate the progress ring
    const timer = setTimeout(() => {
      setAnimatedPercent(percent);
    }, 100);
    return () => clearTimeout(timer);
  }, [percent]);

  // Determine progress color
  let strokeColor = '#22c55e'; // Green
  if (percent >= 90) {
    strokeColor = '#ef4444'; // Red
  } else if (percent >= 70) {
    strokeColor = '#eab308'; // Yellow
  }

  // Calculate stroke dasharray (progress, empty)
  const strokeDasharray = `${animatedPercent}, 100`;

  return (
    <div className="flex flex-col items-center justify-center">
      <svg 
        viewBox="0 0 36 36" 
        style={{ width: `${size}px`, height: `${size}px` }} 
        className="circular-chart text-green-500 max-w-full max-h-[250px]"
      >
        {/* Background circle */}
        <path 
          className="circle-bg" 
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="2.8"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
        />
        {/* Foreground (progress) circle */}
        <path 
          className="circle" 
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          style={{ transition: 'stroke-dasharray 1s ease-out, stroke 0.3s ease' }}
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
        />
        {/* Percentage Text */}
        <text 
          x="18" 
          y="19" 
          textAnchor="middle" 
          className="font-sans font-bold text-[7px]"
          fill={strokeColor}
          style={{ transition: 'fill 0.3s ease' }}
        >
          {animatedPercent}%
        </text>
        {/* Label Text */}
        <text 
          x="18" 
          y="25" 
          textAnchor="middle" 
          className="font-sans text-[3px] font-semibold"
          fill="#64748b"
        >
          {label}
        </text>
      </svg>
    </div>
  );
}
