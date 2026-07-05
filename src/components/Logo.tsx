import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  variant?: 'gold' | 'emerald' | 'dark';
}

export default function Logo({ className = '', size = 100, showText = false, variant = 'gold' }: LogoProps) {
  // Select gradient based on variant
  const getGradientColors = () => {
    switch (variant) {
      case 'emerald':
        return (
          <>
            <stop offset="0%" stopColor="#A7F3D0" />
            <stop offset="30%" stopColor="#34D399" />
            <stop offset="50%" stopColor="#E6FDF4" />
            <stop offset="75%" stopColor="#059669" />
            <stop offset="100%" stopColor="#064E3B" />
          </>
        );
      case 'dark':
        return (
          <>
            <stop offset="0%" stopColor="#4B5563" />
            <stop offset="30%" stopColor="#1F2937" />
            <stop offset="50%" stopColor="#9CA3AF" />
            <stop offset="75%" stopColor="#111827" />
            <stop offset="100%" stopColor="#030712" />
          </>
        );
      case 'gold':
      default:
        return (
          <>
            <stop offset="0%" stopColor="#F3E7C4" />
            <stop offset="30%" stopColor="#DFBA73" />
            <stop offset="50%" stopColor="#FFF7E3" />
            <stop offset="75%" stopColor="#C5A059" />
            <stop offset="100%" stopColor="#9A7B3E" />
          </>
        );
    }
  };

  const shadowClass = variant === 'dark' 
    ? "drop-shadow-[0_2px_6px_rgba(0,0,0,0.15)]" 
    : variant === 'emerald'
    ? "drop-shadow-[0_2px_8px_rgba(52,211,153,0.2)]"
    : "drop-shadow-[0_2px_8px_rgba(212,175,55,0.25)]";

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={shadowClass}
      >
        <defs>
          <linearGradient id={`metallic-gradient-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
            {getGradientColors()}
          </linearGradient>
        </defs>

        {/* Outer floating arch */}
        <path
          d="M 47.5 24.5 A 17 17 0 0 1 61.5 41.5 L 61.5 68"
          stroke={`url(#metallic-gradient-${variant})`}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Inner arch */}
        <path
          d="M 32 28 A 21 21 0 0 1 53 49 L 53 68"
          stroke={`url(#metallic-gradient-${variant})`}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Left vertical stem of F */}
        <path
          d="M 32 28 L 32 49"
          stroke={`url(#metallic-gradient-${variant})`}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Middle crossbar of F */}
        <path
          d="M 32 38.5 L 43.5 38.5"
          stroke={`url(#metallic-gradient-${variant})`}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Horizontal base divider line */}
        <path
          d="M 23 50 L 77 50"
          stroke={`url(#metallic-gradient-${variant})`}
          strokeWidth="2.8"
          strokeLinecap="round"
        />

        {/* Small bottom-left dot */}
        <circle cx="32" cy="57" r="1.8" fill={`url(#metallic-gradient-${variant})`} />
      </svg>

      {showText && (
        <div className="text-center mt-3 select-none">
          <h2 className={`${variant === 'dark' ? 'text-charcoal-900' : 'text-gold-500'} font-bold tracking-[0.25em] text-sm font-display leading-none`}>
            THE FRAME CUT
          </h2>
          <div className="flex items-center justify-center space-x-2 mt-1.5 opacity-80">
            <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-gold-500/50" />
            <span className="text-gray-400 text-[8px] font-mono tracking-[0.3em] uppercase leading-none">
              STUDIO OS
            </span>
            <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-gold-500/50" />
          </div>
        </div>
      )}
    </div>
  );
}
