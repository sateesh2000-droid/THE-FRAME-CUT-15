import React, { useId } from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  variant?: 'gold' | 'emerald' | 'dark';
}

export default function Logo({ className = '', size = 100, showText = false, variant = 'gold' }: LogoProps) {
  const uniqueId = useId().replace(/:/g, '');
  const gradientId = `metallic-gradient-${variant}-${uniqueId}`;

  // Select gradient based on variant - using rich visible colors for both light and dark backgrounds
  const getGradientColors = () => {
    switch (variant) {
      case 'emerald':
        return (
          <>
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="50%" stopColor="#059669" />
            <stop offset="100%" stopColor="#064E3B" />
          </>
        );
      case 'dark':
        return (
          <>
            <stop offset="0%" stopColor="#475569" />
            <stop offset="50%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#0F172A" />
          </>
        );
      case 'gold':
      default:
        return (
          <>
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="40%" stopColor="#D97706" />
            <stop offset="70%" stopColor="#B45309" />
            <stop offset="100%" stopColor="#78350F" />
          </>
        );
    }
  };

  const strokeColor = variant === 'dark' ? '#1E293B' : variant === 'emerald' ? '#059669' : '#D97706';

  const shadowClass = variant === 'dark' 
    ? "drop-shadow-[0_2px_6px_rgba(0,0,0,0.15)]" 
    : variant === 'emerald'
    ? "drop-shadow-[0_2px_8px_rgba(52,211,153,0.2)]"
    : "drop-shadow-[0_2px_8px_rgba(217,119,6,0.25)]";

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
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            {getGradientColors()}
          </linearGradient>
        </defs>

        {/* Outer floating arch */}
        <path
          d="M 47.5 24.5 A 17 17 0 0 1 61.5 41.5 L 61.5 68"
          stroke={`url(#${gradientId})`}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ stroke: `url(#${gradientId}) ${strokeColor}` }}
        />

        {/* Inner arch */}
        <path
          d="M 32 28 A 21 21 0 0 1 53 49 L 53 68"
          stroke={`url(#${gradientId})`}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ stroke: `url(#${gradientId}) ${strokeColor}` }}
        />

        {/* Left vertical stem of F */}
        <path
          d="M 32 28 L 32 49"
          stroke={`url(#${gradientId})`}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ stroke: `url(#${gradientId}) ${strokeColor}` }}
        />

        {/* Middle crossbar of F */}
        <path
          d="M 32 38.5 L 43.5 38.5"
          stroke={`url(#${gradientId})`}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ stroke: `url(#${gradientId}) ${strokeColor}` }}
        />

        {/* Horizontal base divider line */}
        <path
          d="M 23 50 L 77 50"
          stroke={`url(#${gradientId})`}
          strokeWidth="2.8"
          strokeLinecap="round"
          style={{ stroke: `url(#${gradientId}) ${strokeColor}` }}
        />

        {/* Small bottom-left dot */}
        <circle cx="32" cy="57" r="1.8" fill={`url(#${gradientId})`} style={{ fill: strokeColor }} />
      </svg>

      {showText && (
        <div className="text-center mt-3 select-none">
          <h2 className={`${variant === 'dark' ? 'text-slate-900' : 'text-amber-600'} font-bold tracking-[0.25em] text-sm font-display leading-none`}>
            THE FRAME CUTS
          </h2>
          <div className="flex items-center justify-center space-x-2 mt-1.5 opacity-80">
            <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-amber-500/50" />
            <span className="text-slate-500 text-[8px] font-mono tracking-[0.3em] uppercase leading-none">
              STUDIO OS
            </span>
            <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-amber-500/50" />
          </div>
        </div>
      )}
    </div>
  );
}
