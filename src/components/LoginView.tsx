import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  Eye, 
  EyeOff,
  CloudSun,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Logo from './Logo';
import LoginWeatherClockWidget from './LoginWeatherClockWidget';
import FullScreenSplashView from './FullScreenSplashView';

interface LoginViewProps {
  onLogin: (email: string, role: 'admin' | 'editor' | 'studio', id?: string) => Promise<void>;
}

export default function LoginView({ onLogin }: LoginViewProps) {
  const [showSplash, setShowSplash] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Load passwords from localStorage with fallback defaults
  const getPasswords = () => {
    try {
      const saved = localStorage.getItem('tfc_passwords');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      'satish@framecut.com': 'satish123',
      'sateeshtiwari3@gmail.com': 'satish123',
      'sateesh2000': 'Sateesh@504054',
      'vansh@framecut.com': 'vansh123',
      'vansh2000': '8889995988',
      'kk@weddingbykk.com': 'kk123'
    };
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const passwordsMap = getPasswords();
      const expectedPassword = passwordsMap[email as keyof typeof passwordsMap] || 'admin123';

      if (password !== expectedPassword) {
        throw new Error("Access Denied. Incorrect password. Please verify your security password and try again.");
      }

      // Find role based on credentials email
      if (email === 'satish@framecut.com' || email === 'sateesh2000' || email === 'sateeshtiwari3@gmail.com') {
        await onLogin(email, 'admin');
      } else if (email === 'vansh@framecut.com' || email === 'vansh2000') {
        await onLogin(email, 'editor', 'editor-vansh');
      } else if (email === 'kk@weddingbykk.com') {
        await onLogin(email, 'studio', 'studio-kk');
      } else {
        // Fallback admin or generic
        await onLogin(email, 'admin');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 overflow-x-hidden select-none bg-black">
      {/* Full Screen Logo Splash View overlay on app boot */}
      <AnimatePresence>
        {showSplash && (
          <FullScreenSplashView onSlideComplete={() => setShowSplash(false)} />
        )}
      </AnimatePresence>

      {/* Full-screen Misty Pine Forest Wallpaper matching user image */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat filter brightness-90 contrast-110 transform scale-105 transition-all duration-1000 pointer-events-none"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1920&q=80')`
        }}
      />
      {/* Dark Vignetting and Ambient Lighting Overlays */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/60 via-black/35 to-black/80 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-5xl relative z-10 space-y-6 my-auto">
        
        {/* Top Header Branding */}
        <div className="text-center space-y-2 relative">
          <button
            type="button"
            onClick={() => setShowSplash(true)}
            className="inline-block p-3.5 rounded-full bg-black/50 hover:bg-black/80 hover:scale-105 backdrop-blur-xl border border-white/15 hover:border-gold-500/50 shadow-2xl transition-all cursor-pointer group"
            title="Click to view full-screen logo splash"
          >
            <Logo size={60} variant="gold" />
          </button>
          <div>
            <div className="flex items-center justify-center space-x-2">
              <h1 className="text-2xl sm:text-3xl font-black font-display text-white tracking-[0.25em] drop-shadow-md">
                THE FRAME CUT
              </h1>
              <button
                type="button"
                onClick={() => setShowSplash(true)}
                className="px-2 py-0.5 rounded-full bg-gold-500/10 hover:bg-gold-500/20 text-gold-300 border border-gold-500/30 text-[9px] font-mono uppercase tracking-wider transition-all cursor-pointer hidden sm:inline-block"
              >
                Cover Screen
              </button>
            </div>
            <p className="text-[10px] text-gold-300 font-mono uppercase tracking-[0.3em] leading-none mt-1.5 font-medium drop-shadow">
              Studio OS ERP • Live Production Portal
            </p>
          </div>
        </div>

        {/* Grid Split Layout: Weather Clock Widget + Credentials Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
          
          {/* Left Panel: Shoot Weather & Live Clock Capsule Widget */}
          <div className="lg:col-span-5 order-2 lg:order-1 flex justify-center">
            <LoginWeatherClockWidget layout="vertical" />
          </div>

          {/* Right Panel: Account Authentication Stadium Glass Card */}
          <div className="lg:col-span-7 order-1 lg:order-2">
            <div className="p-6 sm:p-10 rounded-[40px] sm:rounded-[60px] bg-black/40 backdrop-blur-2xl border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.8)] relative overflow-hidden group hover:border-white/30 transition-all duration-500">
              
              {/* Top ambient highlight */}
              <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
              
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div>
                  <h2 className="text-sm font-semibold text-white font-display uppercase tracking-wider drop-shadow-sm">
                    Account Authentication
                  </h2>
                  <p className="text-[10px] text-white/70 font-mono mt-0.5">
                    Enter security credentials to access Studio OS
                  </p>
                </div>
                <div className="flex items-center space-x-1.5 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-500/30 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[9px] font-mono text-emerald-300 uppercase tracking-widest font-semibold">SECURE NODE</span>
                </div>
              </div>
              
              {error && (
                <div className="mb-5 p-3.5 rounded-2xl bg-red-500/20 backdrop-blur-md border border-red-500/40 text-xs text-red-200 leading-relaxed font-sans shadow-inner">
                  {error}
                </div>
              )}

              <form onSubmit={handleCredentialsSubmit} className="space-y-5 relative z-10">
                <div>
                  <label className="block text-[10px] font-mono text-white/70 uppercase tracking-wider mb-1.5 font-medium">
                    Username or Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 w-4 h-4 text-white/50" />
                    <input
                      type="text"
                      required
                      placeholder="sateesh2000 or name@framecut.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-black/35 backdrop-blur-md border border-white/20 rounded-full text-xs text-white placeholder-white/30 focus:outline-none focus:border-gold-400/80 focus:ring-2 focus:ring-gold-400/20 transition-all duration-300 shadow-inner"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[10px] font-mono text-white/70 uppercase tracking-wider font-medium">
                      Security password
                    </label>
                    {email && !password && (
                      <span className="text-[9px] font-mono text-gold-300 animate-pulse bg-gold-500/20 px-2 py-0.5 rounded-full border border-gold-500/30 uppercase">
                        Password required
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 w-4 h-4 text-white/50" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder={email ? "Password required" : "••••••••"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full pl-12 pr-12 py-3 bg-black/35 backdrop-blur-md border rounded-full text-xs text-white placeholder-white/30 focus:outline-none focus:border-gold-400/80 focus:ring-2 focus:ring-gold-400/20 transition-all duration-300 shadow-inner ${
                        email && !password ? 'border-gold-400/60 shadow-[0_0_15px_rgba(212,175,55,0.2)]' : 'border-white/20'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-3.5 text-white/50 hover:text-white transition-colors cursor-pointer"
                      title={showPassword ? "Hide Password" : "Show Password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-gold-500/80 via-amber-500/90 to-gold-600/80 hover:from-gold-400 hover:to-amber-500 border border-white/30 rounded-full text-black font-extrabold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-[0_10px_30px_rgba(212,175,55,0.3)] hover:shadow-[0_15px_40px_rgba(212,175,55,0.5)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-55"
                >
                  <span className="tracking-wider uppercase">{loading ? 'Authenticating...' : 'Sign In To OS'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Authorized Username Profiles */}
              <div className="mt-8 pt-5 border-t border-white/10 text-center relative z-10">
                <p className="text-[10px] font-mono text-white/60 uppercase tracking-widest mb-2.5 font-medium">
                  Authorized System Profiles
                </p>
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] bg-black/40 backdrop-blur-md p-3 rounded-full border border-white/10">
                  <span className="text-white/80 font-sans">
                    Admin: <strong className="text-gold-300 font-mono">sateesh2000</strong>
                  </span>
                  <span className="text-white/30 font-mono">•</span>
                  <span className="text-white/80 font-sans">
                    Editor: <strong className="text-gold-300 font-mono">vansh2000</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

