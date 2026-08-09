import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { ChevronUp, ArrowUp, Lock, Sparkles, MoveUp, Sliders } from 'lucide-react';
import Logo from './Logo';

interface FullScreenSplashViewProps {
  onSlideComplete: () => void;
}

export default function FullScreenSplashView({ onSlideComplete }: FullScreenSplashViewProps) {
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [dragY, setDragY] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle Touch Swipe Up / Down
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY === null) return;
    const currentY = e.touches[0].clientY;
    const diffY = touchStartY - currentY; // positive when dragging UP
    if (diffY > 0) {
      setDragY(diffY);
    }
  };

  const handleTouchEnd = () => {
    if (dragY > 80) {
      triggerSlide();
    } else {
      setDragY(0);
    }
    setTouchStartY(null);
  };

  // Handle Mouse Wheel Scroll Up
  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY > 30 || e.deltaY < -30) {
      triggerSlide();
    }
  };

  const triggerSlide = () => {
    if (isSliding) return;
    setIsSliding(true);
    setTimeout(() => {
      onSlideComplete();
    }, 450);
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, scale: 1 }}
      animate={{ opacity: 1, scale: 1, y: isSliding ? '-100%' : -dragY }}
      exit={{ opacity: 0, y: '-100%' }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 sm:p-12 overflow-hidden select-none bg-[#1d1612] cursor-pointer"
      style={{
        backgroundImage: `
          radial-gradient(circle at 50% 35%, rgba(212, 175, 55, 0.15) 0%, transparent 60%),
          radial-gradient(circle at 50% 100%, rgba(0, 0, 0, 0.8) 0%, transparent 70%),
          linear-gradient(135deg, #2a1f18 0%, #17110e 50%, #0d0907 100%)
        `
      }}
    >
      {/* Luxury Metallic Grain / Texture overlay */}
      <div 
        className="absolute inset-0 opacity-25 pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />

      {/* Top Header Tag */}
      <div className="w-full max-w-md flex items-center justify-between pt-4 relative z-10 text-gold-400/70 font-mono text-[10px] uppercase tracking-[0.3em]">
        <div className="flex items-center space-x-2 bg-black/40 px-3 py-1.5 rounded-full border border-gold-500/20 backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-ping" />
          <span>STUDIO OS ERP</span>
        </div>
        <div className="flex items-center space-x-1.5 text-gold-300/80">
          <Lock className="w-3 h-3" />
          <span>PORTAL LOCKED</span>
        </div>
      </div>

      {/* Center Hero Emblem & Branding */}
      <div className="flex flex-col items-center justify-center text-center my-auto relative z-10 space-y-6">
        
        {/* Glow halo behind logo */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-gold-500/20 blur-3xl scale-125 animate-pulse" />
          <div className="relative p-8 rounded-full bg-gradient-to-b from-[#3a2c22]/80 to-[#120d0a]/90 border border-gold-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.9)] backdrop-blur-xl group hover:border-gold-400/60 transition-all duration-500">
            <Logo size={120} variant="gold" />
          </div>
        </div>

        {/* Brand Titles matching luxury embossed image */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-5xl font-black font-display text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-gold-300 to-amber-500 tracking-[0.3em] uppercase drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
            THE FRAME CUT
          </h1>
          <div className="flex items-center justify-center space-x-3 text-gold-400/90">
            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-gold-500/60" />
            <p className="text-xs sm:text-sm font-mono tracking-[0.35em] uppercase font-semibold drop-shadow">
              LUXURY WEDDING FILM OS
            </p>
            <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-gold-500/60" />
          </div>
        </div>

      </div>

      {/* Bottom Interactive Slide Control */}
      <div className="w-full max-w-sm flex flex-col items-center pb-6 relative z-10 space-y-4">
        
        {/* Animated Chevron Cue */}
        <button
          type="button"
          onClick={triggerSlide}
          className="flex flex-col items-center space-y-1 text-gold-300 hover:text-gold-100 transition-all cursor-pointer group"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            className="p-3 rounded-full bg-black/50 border border-gold-500/30 group-hover:border-gold-400 group-hover:bg-gold-500/20 shadow-xl backdrop-blur-md"
          >
            <ChevronUp className="w-6 h-6 text-gold-400 group-hover:text-gold-200" />
          </motion.div>
          <span className="text-xs font-mono font-bold tracking-[0.25em] uppercase text-gold-300/90 group-hover:text-gold-100 drop-shadow mt-1">
            SLIDE UP TO LOGIN
          </span>
          <span className="text-[9px] font-mono text-gray-400 tracking-wider">
            Swipe up or click to access system
          </span>
        </button>

        {/* Drag handle pill */}
        <div 
          onClick={triggerSlide}
          className="w-full py-3.5 px-5 rounded-full bg-gradient-to-r from-gold-600/30 via-amber-500/40 to-gold-600/30 border border-gold-500/40 backdrop-blur-xl flex items-center justify-between text-gold-200 text-xs font-mono font-bold shadow-2xl hover:border-gold-400 transition-all cursor-pointer active:scale-95"
        >
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-gold-400 animate-spin" style={{ animationDuration: '4s' }} />
            <span className="tracking-widest uppercase">SWIPE TO ENTER</span>
          </div>
          <div className="p-1.5 rounded-full bg-gold-500 text-black shadow-md">
            <ArrowUp className="w-4 h-4" />
          </div>
        </div>

      </div>
    </motion.div>
  );
}
