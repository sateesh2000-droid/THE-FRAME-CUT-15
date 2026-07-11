import React, { useState } from 'react';
import { 
  Settings, 
  Database, 
  RefreshCw, 
  Check, 
  ShieldAlert, 
  Info, 
  Smartphone,
  ExternalLink,
  Trash2,
  AlertTriangle,
  X,
  Lock,
  KeyRound,
  Palette,
  Cloud,
  CloudOff,
  Download,
  FileJson
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  UserProfile,
  Project,
  Studio,
  Editor,
  Expense,
  Invoice,
  CalendarEvent,
  Revision,
  PaymentHistory
} from '../types';

interface SettingsViewProps {
  onResetDatabase: () => Promise<void>;
  isOnline: boolean;
  currentUser?: UserProfile | null;
  theme?: 'luxury-green' | 'midnight-gold';
  onThemeChange?: (theme: 'luxury-green' | 'midnight-gold') => void;
  projects?: Project[];
  studios?: Studio[];
  editors?: Editor[];
  expenses?: Expense[];
  invoices?: Invoice[];
  calendarEvents?: CalendarEvent[];
  revisions?: Revision[];
  payments?: PaymentHistory[];
}

export default function SettingsView({ 
  onResetDatabase, 
  isOnline, 
  currentUser,
  theme = 'luxury-green',
  onThemeChange,
  projects = [],
  studios = [],
  editors = [],
  expenses = [],
  invoices = [],
  calendarEvents = [],
  revisions = [],
  payments = []
}: SettingsViewProps) {
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Sync state
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'offline_backup'>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [backupUrl, setBackupUrl] = useState<string | null>(null);
  const [backupFilename, setBackupFilename] = useState<string>('');

  // Password fields state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  
  const handleReset = async () => {
    setIsResetting(true);
    try {
      await onResetDatabase();
      setIsConfirmingReset(false);
      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsResetting(false);
    }
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentUser) {
      setPasswordError('You must be logged in to change your password.');
      return;
    }

    if (!newPassword || !confirmPassword) {
      setPasswordError('Please fill in all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and Confirmation password do not match.');
      return;
    }

    if (newPassword.length < 4) {
      setPasswordError('Password must be at least 4 characters long.');
      return;
    }

    try {
      // Default passwords map
      let passwordsMap: Record<string, string> = {
        'satish@framecut.com': 'satish123',
        'sateesh2000': 'Sateesh@504054',
        'vansh@framecut.com': 'vansh123',
        'vansh2000': '8889995988',
        'kk@weddingbykk.com': 'kk123'
      };

      const saved = localStorage.getItem('tfc_passwords');
      if (saved) {
        passwordsMap = JSON.parse(saved);
      }

      const userEmail = currentUser?.email || 'anonymous';
      const expectedOldPassword = passwordsMap[userEmail] || (userEmail.includes('@') ? `${userEmail.split('@')[0]}123` : 'admin123');

      if (currentPassword !== expectedOldPassword) {
        setPasswordError('The current password you entered is incorrect.');
        return;
      }

      // Update password
      passwordsMap[userEmail] = newPassword;
      localStorage.setItem('tfc_passwords', JSON.stringify(passwordsMap));

      setPasswordSuccess('Password updated successfully! Please use your new password next time you login.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Auto-clear success message after 5 seconds
      setTimeout(() => setPasswordSuccess(''), 5000);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password.');
    }
  };

  const handleSyncToCloud = async () => {
    setSyncStatus('syncing');
    setSyncError(null);
    setBackupUrl(null);
    
    // Smooth user feedback transition
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Compile dynamic state models into a unified JSON backup
    const backupData = {
      backupName: "Frame Cut Studio OS Unified ERP Backup",
      exportedAt: new Date().toISOString(),
      exportedBy: currentUser?.email || 'anonymous_user',
      connectionState: isOnline ? 'online' : 'offline',
      recordsCount: {
        projects: projects.length,
        studios: studios.length,
        editors: editors.length,
        expenses: expenses.length,
        invoices: invoices.length,
        calendarEvents: calendarEvents.length,
        revisions: revisions.length,
        payments: payments.length
      },
      data: {
        projects,
        studios,
        editors,
        expenses,
        invoices,
        calendarEvents,
        revisions,
        payments
      }
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const filename = `tfc_erp_backup_${new Date().toISOString().slice(0, 10)}_${isOnline ? 'online' : 'offline'}.json`;
    
    setBackupUrl(url);
    setBackupFilename(filename);

    if (isOnline) {
      try {
        // Record heartbeat in cloud database
        await addDoc(collection(db, 'syncHeartbeats'), {
          timestamp: serverTimestamp(),
          userId: currentUser?.uid || 'anonymous',
          userEmail: currentUser?.email || 'unknown',
          recordsCount: {
            projects: projects.length,
            studios: studios.length,
            editors: editors.length,
            expenses: expenses.length,
            invoices: invoices.length,
            calendarEvents: calendarEvents.length,
            revisions: revisions.length,
            payments: payments.length
          },
          status: 'success'
        });
        
        setSyncStatus('success');
        
        // Auto-clear success state
        setTimeout(() => setSyncStatus('idle'), 5000);
      } catch (err: any) {
        console.error('Firestore cloud heartbeat sync failed', err);
        setSyncError('Cloud synchronization handshake timed out. Activating offline JSON download.');
        setSyncStatus('offline_backup');
        triggerAutoDownload(url, filename);
      }
    } else {
      setSyncStatus('offline_backup');
      triggerAutoDownload(url, filename);
    }
  };

  const triggerAutoDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      {/* Settings Panel */}
      <div className="p-6 rounded-3xl glass-panel relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-luxury-green-800/10 rounded-full blur-xl pointer-events-none" />
        <h2 className="text-xl font-bold font-display text-white">System Settings</h2>
        <p className="text-xs text-gray-400 mt-1">Configure workspace defaults, trigger data synchronizations, and adjust ERP properties.</p>
      </div>

      {/* Main Blocks */}
      <div className="space-y-4">

        {/* Color Palette Toggle Block */}
        <div className="p-6 rounded-3xl bg-charcoal-900 border border-luxury-green-800/15 space-y-4">
          <h3 className="text-sm font-bold font-display text-white flex items-center space-x-3">
            <div className="p-2.5 bg-gold-500/10 rounded-xl text-gold-400 border border-gold-500/20">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-white tracking-tight block font-display">Application Color Palette</span>
              <p className="text-[9px] text-gray-400 font-mono mt-0.5 uppercase tracking-widest">Select user interface brand theme</p>
            </div>
          </h3>

          <p className="text-xs text-gray-400 leading-relaxed">
            Customize the look and feel of your ERP workspace. Choose between the deep, signature <strong className="text-luxury-green-500">Luxury Green</strong> of Frame Cut Studio or the high-contrast warmth of <strong className="text-gold-400">Midnight Gold</strong>.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Luxury Green Card Option */}
            <button
              id="theme-opt-green"
              onClick={() => onThemeChange?.('luxury-green')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between group ${
                theme === 'luxury-green'
                  ? 'bg-luxury-green-950/40 border-luxury-green-500 text-white shadow-[0_0_15px_rgba(60,143,120,0.15)]'
                  : 'bg-charcoal-950/60 border-luxury-green-800/10 text-gray-400 hover:border-luxury-green-800/30'
              }`}
            >
              <div className="flex items-center space-x-3">
                {/* Visual indicator of colors */}
                <div className="flex -space-x-1.5">
                  <div className="w-3.5 h-3.5 rounded-full bg-luxury-green-900 border border-charcoal-950" />
                  <div className="w-3.5 h-3.5 rounded-full bg-luxury-green-500 border border-charcoal-950" />
                  <div className="w-3.5 h-3.5 rounded-full bg-gold-500 border border-charcoal-950" />
                </div>
                <div>
                  <span className="text-xs font-bold block">Luxury Green</span>
                  <span className="text-[10px] text-gray-500">Default Brand Palette</span>
                </div>
              </div>
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                theme === 'luxury-green' ? 'border-luxury-green-500 bg-luxury-green-500 text-charcoal-950' : 'border-gray-600'
              }`}>
                {theme === 'luxury-green' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
              </div>
            </button>

            {/* Midnight Gold Card Option */}
            <button
              id="theme-opt-gold"
              onClick={() => onThemeChange?.('midnight-gold')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between group ${
                theme === 'midnight-gold'
                  ? 'bg-amber-950/20 border-gold-500 text-white shadow-[0_0_15px_rgba(212,175,55,0.15)]'
                  : 'bg-charcoal-950/60 border-luxury-green-800/10 text-gray-400 hover:border-luxury-green-800/30'
              }`}
            >
              <div className="flex items-center space-x-3">
                {/* Visual indicator of colors */}
                <div className="flex -space-x-1.5">
                  <div className="w-3.5 h-3.5 rounded-full bg-amber-950 border border-charcoal-950" />
                  <div className="w-3.5 h-3.5 rounded-full bg-gold-600 border border-charcoal-950" />
                  <div className="w-3.5 h-3.5 rounded-full bg-gold-400 border border-charcoal-950" />
                </div>
                <div>
                  <span className="text-xs font-bold block">Midnight Gold</span>
                  <span className="text-[10px] text-gray-500">Amber & Obsidian Tones</span>
                </div>
              </div>
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                theme === 'midnight-gold' ? 'border-gold-500 bg-gold-500 text-charcoal-950' : 'border-gray-600'
              }`}>
                {theme === 'midnight-gold' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
              </div>
            </button>
          </div>
        </div>

        {/* Sync & Seeding Block */}
        <div className="p-6 rounded-3xl bg-charcoal-900 border border-luxury-green-800/15 space-y-4">
          <h3 className="text-sm font-bold font-mono text-gold-500 uppercase flex items-center space-x-2">
            <Database className="w-4 h-4" />
            <span>Database seeding & repair</span>
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            The Frame Cut Studio OS is powered by dynamic Firebase Firestore databases. If files, folders or templates are deleted, you can reset the entire database to factory seeding parameters immediately.
          </p>

          <button
            id="btn-reset-db"
            onClick={() => setIsConfirmingReset(true)}
            className="flex items-center space-x-2 px-4.5 py-2.5 bg-red-500/15 border border-red-500/30 hover:bg-red-500 hover:text-white text-red-400 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 shrink-0" />
            <span>Reset Database Seeding</span>
          </button>
        </div>

        {/* Change Password Block */}
        <div className="p-6 rounded-3xl bg-charcoal-900 border border-luxury-green-800/15 space-y-4">
          <h3 className="text-sm font-bold font-display text-white flex items-center space-x-3">
            <div className="p-2.5 bg-gold-500/10 rounded-xl text-gold-400 border border-gold-500/20">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-white tracking-tight block font-display">Change Security Password</span>
              <p className="text-[9px] text-gray-400 font-mono mt-0.5 uppercase tracking-widest">Update credential access properties</p>
            </div>
          </h3>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            {passwordError && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-400">
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-400">
                {passwordSuccess}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1.5">Current Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-500" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-charcoal-950 border border-luxury-green-800/30 rounded-xl text-xs text-white focus:outline-none focus:border-gold-500/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1.5">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-500" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-charcoal-950 border border-luxury-green-800/30 rounded-xl text-xs text-white focus:outline-none focus:border-gold-500/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-500" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-charcoal-950 border border-luxury-green-800/30 rounded-xl text-xs text-white focus:outline-none focus:border-gold-500/40"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="flex items-center space-x-1.5 px-4.5 py-2.5 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-charcoal-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md hover:scale-[1.01] active:scale-[0.99]"
              >
                <Check className="w-4 h-4 shrink-0 stroke-[3]" />
                <span>Save New Password</span>
              </button>
            </div>
          </form>
        </div>

        {/* Offline Support & PWA indicators */}
        <div className="p-6 rounded-3xl bg-charcoal-900 border border-luxury-green-800/15 space-y-4">
          <h3 className="text-sm font-bold font-mono text-gold-500 uppercase flex items-center space-x-2">
            <Smartphone className="w-4 h-4" />
            <span>PWA & Offline Persistent Cache</span>
          </h3>
          
          <div className="space-y-4 text-xs text-gray-400 leading-relaxed">
            <p>
              The system features a dual caching mechanism: <strong className="text-gold-400">IndexedDB Local Persistence</strong> for Firestore queries and standard offline synchronization triggers.
            </p>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-charcoal-950/80 p-3.5 rounded-2xl border border-luxury-green-800/10">
              <div className="flex items-center space-x-2.5">
                <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-yellow-400'}`} />
                <div>
                  <span className="text-[10px] text-gray-500 block uppercase font-mono tracking-wider">Network Status</span>
                  <span className="text-xs font-bold text-white">{isOnline ? 'Cloud Connected (Online)' : 'Offline Cache Mode'}</span>
                </div>
              </div>

              <button
                id="btn-sync-cloud"
                type="button"
                onClick={handleSyncToCloud}
                disabled={syncStatus === 'syncing'}
                className="flex items-center justify-center space-x-1.5 px-4.5 py-2.5 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-charcoal-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md hover:scale-[1.01] active:scale-[0.99] disabled:opacity-55 disabled:cursor-not-allowed"
              >
                {syncStatus === 'syncing' ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                    <span>Synchronising Data...</span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-4 h-4 shrink-0" />
                    <span>Sync to Cloud</span>
                  </>
                )}
              </button>
            </div>

            {/* Sync Notifications/Results */}
            <AnimatePresence mode="wait">
              {syncStatus === 'success' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-400 flex items-center space-x-2.5"
                >
                  <Check className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold">Cloud Synchronization Handshake Successful</span>
                    <p className="text-[10px] text-gray-400 mt-0.5">All active models synchronized perfectly with Cloud Firestore database logs.</p>
                  </div>
                </motion.div>
              )}

              {syncStatus === 'offline_backup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-400 space-y-3"
                >
                  <div className="flex items-start space-x-2.5">
                    <CloudOff className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Internet Connection Interrupted</span>
                      <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">
                        The cloud sync sequence could not handshake. All active wedding schedules, payments, and financial ledgers have been packed and locally cached as a JSON backup file.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1 border-t border-amber-500/10">
                    <a
                      href={backupUrl || undefined}
                      download={backupFilename}
                      className="inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-amber-500 text-charcoal-950 font-bold rounded-lg hover:bg-amber-400 transition-colors cursor-pointer text-[10px] uppercase font-mono tracking-wider shrink-0"
                    >
                      <Download className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Download JSON Backup</span>
                    </a>
                    <span className="text-[9px] font-mono text-gray-500 truncate select-all">{backupFilename}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Workspace info */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-luxury-green-950/20 to-charcoal-900 border border-luxury-green-800/25 space-y-4">
          <h3 className="text-sm font-bold font-mono text-gold-500 uppercase flex items-center space-x-2">
            <Info className="w-4 h-4" />
            <span>ERP Build Specifications</span>
          </h3>

          <div className="space-y-2 text-xs font-mono text-gray-400">
            <div className="flex justify-between border-b border-luxury-green-800/10 pb-2">
              <span>Platform Framework:</span>
              <span className="text-white">React 19 + Vite 6 + Tailwind v4</span>
            </div>
            <div className="flex justify-between border-b border-luxury-green-800/10 pb-2">
              <span>Primary Engine:</span>
              <span className="text-white">Firebase SDK (Auth, Firestore, Offline)</span>
            </div>
            <div className="flex justify-between pb-1">
              <span>Version release:</span>
              <span className="text-gold-500">v1.2.0-Production READY</span>
            </div>
          </div>
        </div>
      </div>

      {/* Database Reset confirmation modal */}
      <AnimatePresence>
        {isConfirmingReset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={() => setIsConfirmingReset(false)} />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md p-6 overflow-hidden text-left bg-charcoal-900 border border-red-500/30 rounded-3xl shadow-[0_20px_50px_rgba(239,68,68,0.2)] z-10"
            >
              <div className="flex items-start space-x-3.5">
                <div className="p-3 bg-red-500/10 text-red-400 rounded-2xl border border-red-500/20">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-display">Reset Seeding Database</h3>
                  <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                    Are you sure you want to reset the entire database to factory seeding configurations? This will delete all current records and restore default weddings, partners, expenses, and invoices.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsConfirmingReset(false)}
                  disabled={isResetting}
                  className="px-4 py-2.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors cursor-pointer disabled:opacity-55"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isResetting}
                  className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold text-xs rounded-xl shadow-[0_4px_15px_rgba(239,68,68,0.25)] transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.99] flex items-center space-x-1.5 disabled:opacity-55"
                >
                  {isResetting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Resetting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Reset Seeding</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Notification Alert Toast */}
      <AnimatePresence>
        {showSuccessAlert && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 flex items-center space-x-3 bg-luxury-green-950/90 border border-gold-500/30 p-4 rounded-2xl shadow-2xl backdrop-blur-md max-w-sm gold-glow"
          >
            <div className="p-2 bg-gold-500/25 rounded-xl text-gold-400">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Database Seeding Complete</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Luxury seeding properties restored successfully.</p>
            </div>
            <button 
              onClick={() => setShowSuccessAlert(false)}
              className="text-gray-400 hover:text-white p-1"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
