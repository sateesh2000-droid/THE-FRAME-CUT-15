import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  Eye, 
  EyeOff
} from 'lucide-react';
import { motion } from 'motion/react';
import Logo from './Logo';

interface LoginViewProps {
  onLogin: (email: string, role: 'admin' | 'editor' | 'studio', id?: string) => Promise<void>;
}

export default function LoginView({ onLogin }: LoginViewProps) {
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
      if (email === 'satish@framecut.com' || email === 'sateesh2000') {
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
    <div className="min-h-screen bg-charcoal-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Cinematic ambient luxury blur backgrounds */}
      <div className="absolute top-1/10 left-1/4 w-[500px] h-[500px] bg-luxury-green-900/10 rounded-full blur-[140px] animate-pulse-slow pointer-events-none" />
      <div className="absolute bottom-1/10 right-1/4 w-[450px] h-[450px] bg-gold-700/5 rounded-full blur-[120px] animate-pulse-slow pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold-900/5 rounded-full blur-[180px] pointer-events-none" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        
        {/* Logo and Titles with cinematic animation container */}
        <div className="text-center space-y-3">
          <div className="inline-block p-4 rounded-full bg-gradient-to-b from-charcoal-900 to-charcoal-950 border border-white/5 shadow-xl">
            <Logo size={76} variant="gold" />
          </div>
          <div>
            <h1 className="text-3xl font-black font-display text-white tracking-[0.25em] mt-2 bg-gradient-to-r from-white via-gold-100 to-gold-400 bg-clip-text text-transparent">
              THE FRAME CUT
            </h1>
            <p className="text-[10px] text-gold-400 font-mono uppercase tracking-[0.3em] leading-none mt-2 font-medium">
              Studio OS ERP
            </p>
          </div>
        </div>

        {/* Credentials Form Box with Premium Glassmorphism & Gold Border glow */}
        <div className="p-8 rounded-3xl bg-charcoal-900/60 backdrop-blur-xl border border-gold-500/20 shadow-2xl relative overflow-hidden ring-1 ring-gold-500/10 hover:border-gold-500/35 transition-all duration-500 hover:shadow-[0_0_50px_rgba(212,175,55,0.12)]">
          {/* Subtle gold top-gradient border */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold-500/40 to-transparent" />
          
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-semibold text-white font-display uppercase tracking-wider">
              Account Authentication
            </h2>
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest font-semibold">SECURE NODE</span>
            </div>
          </div>
          
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 leading-relaxed font-sans shadow-inner">
              {error}
            </div>
          )}

          <form onSubmit={handleCredentialsSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1.5">
                Username or Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500 transition-colors group-focus-within:text-gold-400" />
                <input
                  type="text"
                  required
                  placeholder="sateesh2000 or name@framecut.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-charcoal-950/60 border border-luxury-green-800/30 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/20 transition-all duration-300 focus:shadow-[0_0_15px_rgba(212,175,55,0.1)]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider">
                  Security password
                </label>
                {email && !password && (
                  <span className="text-[9px] font-mono text-gold-400 animate-pulse bg-gold-500/10 px-2 py-0.5 rounded border border-gold-500/20 uppercase">
                    Password required
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder={email ? "Password required" : "••••••••"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-11 pr-11 py-3 bg-charcoal-950/60 border rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/20 transition-all duration-300 focus:shadow-[0_0_15px_rgba(212,175,55,0.1)] ${
                    email && !password ? 'border-gold-500/40 shadow-[0_0_10px_rgba(212,175,55,0.05)]' : 'border-luxury-green-800/30'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-gray-500 hover:text-gold-400 transition-colors cursor-pointer"
                  title={showPassword ? "Hide Password" : "Show Password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-luxury-green-800 to-luxury-green-600 border border-gold-500/30 hover:border-gold-500/50 rounded-xl text-white text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer gold-glow hover:scale-[1.01] active:scale-[0.99] disabled:opacity-55"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In To OS'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Authorized Username Information */}
          <div className="mt-6 pt-5 border-t border-luxury-green-800/10 text-center">
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2.5 font-medium">
              Authorized System Profiles
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] bg-charcoal-950/40 p-2.5 rounded-xl border border-white/5">
              <span className="text-gray-400 font-sans">
                Admin: <strong className="text-gold-400 font-mono">sateesh2000</strong>
              </span>
              <span className="text-gray-600 font-mono">•</span>
              <span className="text-gray-400 font-sans">
                Editor: <strong className="text-gold-400 font-mono">vansh2000</strong>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
