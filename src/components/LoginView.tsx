import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  Laptop, 
  Building2,
  Film
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
        throw new Error(`Incorrect password for ${email}. Default password is: ${email === 'sateesh2000' ? 'Sateesh@504054' : (email === 'vansh2000' ? '8889995988' : (email.includes('@') ? email.split('@')[0] + '123' : 'admin123'))} (or check Settings to change it)`);
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

  // Quick simulation options
  const simulationUsers = [
    { 
      name: 'Satish Tiwari', 
      email: 'sateesh2000', 
      role: 'admin' as const, 
      label: 'System Admin', 
      icon: ShieldCheck, 
      color: 'border-gold-500/30 hover:border-gold-500 text-gold-400 bg-gold-500/5' 
    },
    { 
      name: 'Vansh Tiwari', 
      email: 'vansh2000', 
      role: 'editor' as const, 
      id: 'editor-vansh',
      label: 'Video Editor', 
      icon: Laptop, 
      color: 'border-luxury-green-500/30 hover:border-luxury-green-500 text-luxury-green-400 bg-luxury-green-500/5' 
    },
    { 
      name: 'Wedding By KK', 
      email: 'kk@weddingbykk.com', 
      role: 'studio' as const, 
      id: 'studio-kk',
      label: 'Studio Client', 
      icon: Building2, 
      color: 'border-purple-500/30 hover:border-purple-500 text-purple-400 bg-purple-500/5' 
    }
  ];

  const handleSimulationClick = (userEmail: string) => {
    const passwordsMap = getPasswords();
    const userPass = passwordsMap[userEmail as keyof typeof passwordsMap] || '';
    setEmail(userEmail);
    setPassword(userPass);
    setError('');
  };

  return (
    <div className="min-h-screen bg-charcoal-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Cinematic ambient blur backgrounds */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-luxury-green-900/10 rounded-full blur-3xl animate-pulse-slow pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold-700/5 rounded-full blur-3xl animate-pulse-slow pointer-events-none" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        
        {/* Logo and Titles */}
        <div className="text-center space-y-2">
          <Logo size={72} />
          <h1 className="text-2xl font-black font-display text-white tracking-widest mt-4">THE FRAME CUT</h1>
          <p className="text-[10px] text-gold-400 font-mono uppercase tracking-widest leading-none mt-1">Studio OS ERP</p>
        </div>

        {/* Credentials Form Box */}
        <div className="p-8 rounded-3xl glass-panel relative overflow-hidden">
          <h2 className="text-base font-bold text-white font-display mb-4">Account Authentication</h2>
          
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1">Username or Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  required
                  placeholder="sateesh2000 or name@framecut.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-charcoal-900 border border-luxury-green-800/30 rounded-xl text-xs text-white focus:outline-none focus:border-gold-500/40"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1">Security password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-charcoal-900 border border-luxury-green-800/30 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-luxury-green-800 to-luxury-green-600 border border-gold-500/30 hover:border-gold-500/50 rounded-xl text-white text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer gold-glow"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In To OS'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Simulation Selector */}
          <div className="mt-6 border-t border-luxury-green-800/15 pt-5">
            <span className="block text-[9px] font-mono text-gray-500 uppercase tracking-wider text-center mb-3">
              - Quick Simulation Access profiles -
            </span>
            
            <div className="space-y-2">
              {simulationUsers.map((user) => {
                const Icon = user.icon;
                return (
                  <button
                    key={user.email}
                    onClick={() => handleSimulationClick(user.email)}
                    className={`w-full p-3 rounded-2xl border flex items-center justify-between text-left transition-all ${user.color} cursor-pointer hover:scale-[1.02] active:scale-[0.98]`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-charcoal-950/80 rounded-xl shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white leading-tight block">{user.name}</span>
                        <span className="text-[9px] text-gray-500 font-mono block mt-0.5">{user.email}</span>
                      </div>
                    </div>

                    <span className="text-[9px] font-mono uppercase tracking-wider font-semibold opacity-70">
                      {user.role}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
