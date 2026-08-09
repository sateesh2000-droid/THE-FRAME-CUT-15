import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Film, 
  Building2, 
  Users, 
  IndianRupee, 
  HardDrive, 
  BarChart3, 
  Calendar, 
  Bell, 
  Settings, 
  LogOut, 
  ChevronRight, 
  Menu,
  Shield,
  Laptop,
  Sparkles,
  Heart,
  MoreHorizontal,
  X,
  Plus,
  Receipt,
  TrendingUp,
  PieChart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../types';
import Logo from './Logo';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: UserProfile | null;
  onLogout: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, currentUser, onLogout }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const role = currentUser?.role || 'admin';

  // Define ALL possible navigation items
  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin'] },
    { id: 'financial_overview', label: 'Financial Overview', icon: TrendingUp, roles: ['admin', 'studio', 'editor'] },
    { id: 'projects', label: 'Projects', icon: Film, roles: ['admin', 'editor', 'studio'] },
    { id: 'registry', label: 'New Project', icon: Plus, roles: ['admin', 'editor', 'studio'] },
    { id: 'invoice', label: 'Invoice', icon: Receipt, roles: ['admin', 'studio'] },
    { id: 'studios', label: 'Studios', icon: Building2, roles: ['admin'] },
    { id: 'editors', label: 'Editors', icon: Laptop, roles: ['admin', 'editor'] },
    { id: 'datamanager', label: 'Data Manager', icon: HardDrive, roles: ['admin'] },
    { id: 'calendar', label: 'Calendar', icon: Calendar, roles: ['admin', 'editor'] },
    { id: 'gemini', label: 'Gemini AI', icon: Sparkles, roles: ['admin', 'editor', 'studio'] },
    { id: 'reports', label: 'Reports', icon: BarChart3, roles: ['admin'] },
    { id: 'notifications', label: 'Notifications', icon: Bell, roles: ['admin', 'editor', 'studio'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['admin'] },
  ];

  // Filter based on user permissions
  const navItems = allNavItems.filter(item => item.roles.includes(role));

  // Determine top 4 primary tabs for mobile bottom bar based on user role
  const getMobilePrimaryTabIds = () => {
    switch (role) {
      case 'editor':
        return ['projects', 'gemini', 'calendar', 'notifications'];
      case 'studio':
        return ['projects', 'gemini', 'notifications'];
      default: // admin
        return ['dashboard', 'projects', 'financial_overview', 'reports'];
    }
  };

  const primaryTabIds = getMobilePrimaryTabIds();
  const primaryMobileTabs = navItems.filter(item => primaryTabIds.includes(item.id));

  const sidebarVariants = {
    collapsed: { width: 84 },
    expanded: { width: 260 }
  };

  // Close drawer when tab changes on mobile
  const handleMobileTabClick = (tabId: string) => {
    setActiveTab(tabId);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Top Header (Sticky) */}
      <div className="md:hidden flex items-center justify-between px-5 py-3.5 bg-charcoal-900/95 backdrop-blur-md border-b border-luxury-green-800/20 sticky top-0 z-40">
        <div className="flex items-center space-x-2.5">
          <Logo size={28} />
          <div className="flex flex-col">
            <span className="text-gold-500 font-bold text-xs tracking-wider font-display leading-none">FRAME CUT</span>
            <span className="text-gray-400 text-[7px] font-mono tracking-widest mt-0.5">STUDIO OS</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Quick Info/Notifications shortcut if notifications available */}
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`p-1.5 rounded-xl transition-all relative ${
              activeTab === 'notifications' ? 'bg-gold-500/10 text-gold-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-gold-400 rounded-full animate-ping" />
          </button>

          {/* Minimal Avatar */}
          <div className="relative shrink-0 w-7 h-7 rounded-lg overflow-hidden border border-gold-500/20">
            <img
              src={currentUser?.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'}
              alt={currentUser?.name || 'User'}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Mobile Bottom Tab Bar Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-charcoal-950/90 backdrop-blur-lg border-t border-luxury-green-800/20 px-2 py-2 flex items-center justify-around safe-bottom">
        {primaryMobileTabs.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleMobileTabClick(item.id)}
              className="flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-xl transition-all relative group"
            >
              <div className={`p-1.5 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-gradient-to-b from-gold-500/15 to-luxury-green-950 text-gold-400 scale-105' 
                  : 'text-gray-400 group-hover:text-gray-200'
              }`}>
                <Icon className="w-5 h-5 shrink-0" />
              </div>
              <span className={`text-[9px] font-sans tracking-wide mt-1 font-medium transition-all ${
                isActive ? 'text-gold-400 font-semibold' : 'text-gray-500'
              }`}>
                {item.label.split(' ')[0]} {/* Grab first word for layout safety */}
              </span>
              
              {isActive && (
                <span className="absolute bottom-0 w-4 h-0.5 bg-gold-400 rounded-full shadow-[0_0_8px_rgba(212,175,55,0.8)]" />
              )}
            </button>
          );
        })}

        {/* 5th Tab: "More" Options Trigger */}
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-xl transition-all relative group"
        >
          <div className={`p-1.5 rounded-xl transition-all duration-200 ${
            isMobileOpen 
              ? 'bg-gold-500/15 text-gold-400 scale-105' 
              : 'text-gray-400 group-hover:text-gray-200'
          }`}>
            {isMobileOpen ? <X className="w-5 h-5" /> : <MoreHorizontal className="w-5 h-5" />}
          </div>
          <span className={`text-[9px] font-sans tracking-wide mt-1 font-medium ${
            isMobileOpen ? 'text-gold-400 font-semibold' : 'text-gray-500'
          }`}>
            More
          </span>
        </button>
      </div>

      {/* Mobile Slide-Up Drawer Menu */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/85 backdrop-blur-md z-40 md:hidden"
              onClick={() => setIsMobileOpen(false)}
            />

            {/* Bottom Sheet Drawer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-charcoal-900 border-t border-luxury-green-800/40 rounded-t-[2rem] shadow-2xl overflow-hidden md:hidden max-h-[85vh] flex flex-col"
            >
              {/* Drag Handle Accent */}
              <div className="w-12 h-1 bg-stone-700 rounded-full mx-auto my-3 shrink-0" />

              {/* Title Header */}
              <div className="px-6 pb-4 border-b border-luxury-green-800/15 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2">
                  <Logo size={24} />
                  <span className="text-xs font-bold font-mono tracking-wider text-gray-400 uppercase">Navigation Menu</span>
                </div>
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Grid List of ALL options for this role */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                <div>
                  <h4 className="text-[10px] font-bold tracking-widest text-gold-500/60 uppercase mb-3.5 font-sans">All Features</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleMobileTabClick(item.id)}
                          className={`flex flex-col items-center justify-center p-3.5 rounded-2xl transition-all border text-center ${
                            isActive
                              ? 'bg-gradient-to-b from-gold-500/10 to-luxury-green-950/40 border-gold-400/40 text-gold-300 shadow-md font-semibold'
                              : 'bg-charcoal-950/40 border-luxury-green-900/10 text-gray-400 hover:text-white'
                          }`}
                        >
                          <Icon className={`w-5 h-5 mb-2 ${isActive ? 'text-gold-400' : 'text-gray-400'}`} />
                          <span className="text-[10px] font-sans font-medium tracking-wide break-words leading-tight">
                            {item.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Profile Details & Logout inside Drawer */}
                <div className="pt-4 border-t border-luxury-green-800/15">
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-charcoal-950/50 border border-luxury-green-900/10">
                    <div className="flex items-center space-x-3.5 overflow-hidden">
                      <div className="relative shrink-0">
                        <img
                          src={currentUser?.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'}
                          alt={currentUser?.name || 'User'}
                          className="w-11 h-11 rounded-xl object-cover border border-gold-500/20"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-gold-500 text-charcoal-950 rounded-full p-0.5 border border-charcoal-950">
                          <Shield className="w-2.5 h-2.5" />
                        </div>
                      </div>
                      
                      <div className="flex flex-col whitespace-nowrap overflow-hidden text-left">
                        <span className="text-sm font-semibold text-gray-100 leading-tight">
                          {currentUser?.name || 'Guest User'}
                        </span>
                        <span className="text-[10px] font-mono text-gold-500 tracking-wider capitalize mt-0.5">
                          {role} ({currentUser?.email})
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setIsMobileOpen(false);
                        onLogout();
                      }}
                      className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-red-400 bg-red-500/10 hover:bg-red-500/20 text-xs font-semibold font-sans transition-all"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Safe spacer for home indicator on premium newer phones */}
              <div className="h-6 bg-charcoal-900 shrink-0" />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Desktop Sidebar (Hidden on Mobile) */}
      <motion.aside
        id="app-sidebar"
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        initial={false}
        className="fixed top-6 left-4 bottom-6 z-50 h-[calc(100vh-48px)] rounded-3xl glass-panel hidden md:flex flex-col justify-between py-6"
        variants={sidebarVariants}
        animate={isExpanded ? 'expanded' : 'collapsed'}
      >
        {/* Top Header Logo */}
        <div>
          <div className="px-5 mb-8 flex items-center justify-between">
            <div className="flex items-center space-x-3 overflow-hidden">
              <Logo size={40} className="shrink-0" />
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex flex-col whitespace-nowrap"
                  >
                    <span className="text-gold-500 font-bold tracking-wider text-sm font-display leading-none">FRAME CUT</span>
                    <span className="text-gray-400 text-[10px] font-mono tracking-widest mt-1">STUDIO OS</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Collapse indicator chevron (desktop only) */}
            <div className="hidden md:block">
              <ChevronRight className={`w-4 h-4 text-gold-500/40 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <motion.button
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  onClick={() => {
                    setActiveTab(item.id);
                  }}
                  whileTap={{ scale: 0.96 }}
                  className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-colors duration-200 group relative ${
                    isActive 
                      ? 'text-gold-300 font-semibold' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebarActivePill"
                      className="absolute inset-0 rounded-2xl bg-gradient-to-r from-gold-500/20 via-luxury-green-900/35 to-transparent border-l-4 border-gold-400 shadow-[0_0_20px_rgba(212,175,55,0.18)]"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}

                  <Icon className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110 z-10 ${isActive ? 'text-gold-400 filter drop-shadow-[0_0_5px_rgba(255,209,92,0.6)]' : 'text-gray-400'}`} />
                  
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        className="text-sm font-medium tracking-wide whitespace-nowrap overflow-hidden z-10"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Desktop tooltips when collapsed */}
                  {!isExpanded && (
                    <div className="absolute left-20 bg-charcoal-950 text-gold-400 text-xs px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 border border-luxury-green-800/30 pointer-events-none whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}
                </motion.button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile Details */}
        <div className="px-3 border-t border-luxury-green-800/20 pt-4 mt-auto">
          <div className="flex items-center justify-between p-2 rounded-2xl bg-charcoal-900/60 border border-luxury-green-800/10">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="relative shrink-0">
                <img
                  src={currentUser?.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'}
                  alt={currentUser?.name || 'User'}
                  className="w-10 h-10 rounded-xl object-cover border border-gold-500/20"
                />
                <div className="absolute -bottom-1 -right-1 bg-gold-500 text-charcoal-950 rounded-full p-0.5 border border-charcoal-950">
                  <Shield className="w-2.5 h-2.5" />
                </div>
              </div>
              
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="flex flex-col whitespace-nowrap overflow-hidden"
                  >
                    <span className="text-sm font-semibold text-gray-200 leading-tight">
                      {currentUser?.name || 'Guest User'}
                    </span>
                    <span className="text-[10px] font-mono text-gold-500 tracking-wider capitalize">
                      {role}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {isExpanded && (
              <button
                id="sidebar-logout-btn"
                onClick={onLogout}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </motion.aside>
    </>
  );
}
