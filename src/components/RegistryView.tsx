import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  Calendar, 
  User, 
  IndianRupee, 
  HardDrive, 
  Plus, 
  Trash2, 
  Film, 
  Info, 
  Sparkles, 
  Check, 
  ArrowRight,
  Upload,
  Link2,
  FolderClosed,
  Clock,
  ArrowLeft,
  X,
  AlertCircle
} from 'lucide-react';
import { Project, Studio, Editor, ProjectStatus, ProjectPriority, UserRole } from '../types';

interface RegistryViewProps {
  studios: Studio[];
  editors: Editor[];
  projects: Project[];
  userRole: UserRole;
  currentStudioId?: string;
  onAddProject: (project: Omit<Project, 'createdAt' | 'updatedAt'>) => Promise<void>;
  onRedirectToProjects: () => void;
}

const WORKFLOW_STAGES: { id: ProjectStatus; label: string; color: string; bg: string }[] = [
  { id: 'data_received', label: 'In Progress • Received', color: 'text-gold-300', bg: 'bg-gold-500/5 border border-gold-500/10 font-medium' },
  { id: 'assigned', label: 'In Progress • Assigned', color: 'text-gold-300', bg: 'bg-gold-500/5 border border-gold-500/10 font-medium' },
  { id: 'editing', label: 'Editing • Active', color: 'text-gold-400', bg: 'bg-gold-500/15 border border-gold-400/25 font-bold animate-pulse-slow' },
  { id: 'review', label: 'In Progress • Review', color: 'text-gold-300', bg: 'bg-gold-500/5 border border-gold-500/10 font-medium' },
  { id: 'revision', label: 'In Progress • Revision', color: 'text-gold-300', bg: 'bg-gold-500/5 border border-gold-500/10 font-medium' },
  { id: 'rendering', label: 'In Progress • Rendering', color: 'text-gold-300', bg: 'bg-gold-500/5 border border-gold-500/10 font-medium' },
  { id: 'delivered', label: 'Finished • Delivered', color: 'text-luxury-green-500', bg: 'bg-luxury-green-500/10 border border-luxury-green-500/20 font-bold' },
  { id: 'closed', label: 'Finished • Closed', color: 'text-luxury-green-600', bg: 'bg-luxury-green-950 border border-luxury-green-900/10 font-medium' }
];

const PRIORITIES: { id: ProjectPriority; label: string; color: string; bg: string }[] = [
  { id: 'low', label: 'Low', color: 'text-gray-400', bg: 'bg-gray-500/10' },
  { id: 'medium', label: 'Medium', color: 'text-sky-400', bg: 'bg-sky-500/10' },
  { id: 'high', label: 'High', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  { id: 'urgent', label: 'Urgent', color: 'text-red-400', bg: 'bg-red-500/10' }
];

const DEFAULT_COVERS = [
  { name: 'Sunset Romance', url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=600' },
  { name: 'Golden Hour', url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=600' },
  { name: 'Palace Celebration', url: 'https://images.unsplash.com/photo-1519225495810-7512c696505a?auto=format&fit=crop&q=80&w=600' },
  { name: 'Classic Portrait', url: 'https://images.unsplash.com/photo-1507504038482-7621c330dfcf?auto=format&fit=crop&q=80&w=600' }
];

const compressImage = (base64Str: string, maxWidth = 800, maxHeight = 800, quality = 0.6): Promise<string> => {
  return new Promise((resolve) => {
    if (!base64Str || !base64Str.startsWith('data:image/')) {
      resolve(base64Str);
      return;
    }
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
};

export default function RegistryView({
  studios,
  editors,
  projects,
  userRole,
  currentStudioId,
  onAddProject,
  onRedirectToProjects
}: RegistryViewProps) {
// Form States
  const [projectName, setProjectName] = useState('');
  const [brideName, setBrideName] = useState('');
  const [groomName, setGroomName] = useState('');
  const [eventType, setEventType] = useState('Wedding Film');
  const [studioId, setStudioId] = useState('');
  const [shootDate, setShootDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [assignedEditorId, setAssignedEditorId] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('data_received');
  const [priority, setPriority] = useState<ProjectPriority>('medium');
  const [couplePhoto, setCouplePhoto] = useState('');
  const [notes, setNotes] = useState('');

  // Split project states
  const [isSplitProject, setIsSplitProject] = useState(false);
  const [secondEditorId, setSecondEditorId] = useState('');
  const [splitPreset, setSplitPreset] = useState('50-50');
  const [firstEditorShare, setFirstEditorShare] = useState<number>(0);
  const [secondEditorShare, setSecondEditorShare] = useState<number>(0);

  // Toggle for advanced fields to keep the view "EK DUM SIMPLE"
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Financial specs
  const [projectAmount, setProjectAmount] = useState<number>(0);
  const [editorPayment, setEditorPayment] = useState<number>(0);
  const [otherExpenses, setOtherExpenses] = useState<number>(0);
  const [advancePayment, setAdvancePayment] = useState<number>(0);

  // Sync split payments when editorPayment or presets change
  useEffect(() => {
    if (!isSplitProject) {
      setFirstEditorShare(editorPayment);
      setSecondEditorShare(0);
      return;
    }

    if (splitPreset === '50-50') {
      const p1 = Math.round(editorPayment * 0.5);
      setFirstEditorShare(p1);
      setSecondEditorShare(editorPayment - p1);
    } else if (splitPreset === '60-40') {
      const p1 = Math.round(editorPayment * 0.6);
      setFirstEditorShare(p1);
      setSecondEditorShare(editorPayment - p1);
    } else if (splitPreset === '70-30') {
      const p1 = Math.round(editorPayment * 0.7);
      setFirstEditorShare(p1);
      setSecondEditorShare(editorPayment - p1);
    } else if (splitPreset === '80-20') {
      const p1 = Math.round(editorPayment * 0.8);
      setFirstEditorShare(p1);
      setSecondEditorShare(editorPayment - p1);
    }
  }, [editorPayment, isSplitProject, splitPreset]);

  // Storage specs
  const [hardDiskName, setHardDiskName] = useState('');
  const [dataSize, setDataSize] = useState('');
  const [backupStatus, setBackupStatus] = useState<'pending' | 'backed_up'>('pending');
  const [googleDriveLink, setGoogleDriveLink] = useState('');
  const [rawDataFolder, setRawDataFolder] = useState('');
  const [deliveryFolder, setDeliveryFolder] = useState('');
  const [finalExportFolder, setFinalExportFolder] = useState('');

  // Deliverables Multi-select
  const DEFAULT_FUNCTIONS = ['Full Wedding Film', 'Short Film', 'Highlight', 'Reels', 'Sangeet', 'Pre-Wedding', 'Others'];
  const [availableFunctions, setAvailableFunctions] = useState<string[]>(DEFAULT_FUNCTIONS);
  const [selectedFunctions, setSelectedFunctions] = useState<string[]>([]);
  const [customFunctionInput, setCustomFunctionInput] = useState('');

  // Custom Milestones State
  const DEFAULT_MILESTONES = [
    'Footage Sync & Multi-cam Setup',
    'Song Selection & Audio Sync',
    'Rough Cut / First Cut montage',
    'Main Highlight Draft Completed',
    'Cinematic Color Grading Pass',
    'Sound Design & Foley Balance',
    'Final Quality Check & Cloud Upload'
  ];
  const [customMilestones, setCustomMilestones] = useState<{ id: string; label: string; completed: boolean }[]>(() =>
    DEFAULT_MILESTONES.map((m, idx) => ({
      id: `milestone-${idx}-${Date.now()}`,
      label: m,
      completed: false
    }))
  );
  const [newMilestoneInput, setNewMilestoneInput] = useState('');

  // UI state
  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Auto-hide toast after 6 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Dynamic schedule indicators & Quick offset helpers
  const getDaysDifference = (startStr: string, endStr: string) => {
    if (!startStr || !endStr) return null;
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDaysToDeadline = (deadlineStr: string) => {
    if (!deadlineStr) return null;
    const deadline = new Date(deadlineStr);
    if (isNaN(deadline.getTime())) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const setDeliveryOffset = (days: number) => {
    if (shootDate) {
      const sDate = new Date(shootDate);
      if (!isNaN(sDate.getTime())) {
        sDate.setDate(sDate.getDate() + days);
        const formatted = sDate.toISOString().split('T')[0];
        setDeliveryDate(formatted);
        setValidationError('');
      }
    }
  };

  const daysDifference = getDaysDifference(shootDate, deliveryDate);
  const daysToDeadline = getDaysToDeadline(deliveryDate);

  // Set studio role restriction if applicable
  useEffect(() => {
    if (userRole === 'studio' && currentStudioId) {
      setStudioId(currentStudioId);
    } else if (studios.length > 0 && !studioId) {
      setStudioId(studios[0].id);
    }
  }, [userRole, currentStudioId, studios, studioId]);

  // Handle adding custom cinematic deliverables
  const handleAddCustomFunction = () => {
    if (customFunctionInput.trim()) {
      const formatted = customFunctionInput.trim();
      if (!availableFunctions.includes(formatted)) {
        setAvailableFunctions([...availableFunctions, formatted]);
      }
      if (!selectedFunctions.includes(formatted)) {
        setSelectedFunctions([...selectedFunctions, formatted]);
      }
      setCustomFunctionInput('');
    }
  };

  // Finance calculations
  const calculatedRemainingBalance = Math.max(0, projectAmount - advancePayment);
  const estimatedProfitMargin = projectAmount - editorPayment - otherExpenses;

  // Save implementation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!projectName.trim()) {
      const msg = 'Wedding Project Name is required.';
      console.warn(`⚠️ RegistryView validation error: ${msg}`);
      setValidationError(msg);
      setToast({ message: msg, type: 'error' });
      return;
    }
    if (!groomName.trim() || !brideName.trim()) {
      const msg = 'Both Groom & Bride names are required.';
      console.warn(`⚠️ RegistryView validation error: ${msg}`);
      setValidationError(msg);
      setToast({ message: msg, type: 'error' });
      return;
    }
    if (!shootDate || !deliveryDate) {
      const msg = 'Both Shoot Date and Delivery Deadline are required.';
      console.warn(`⚠️ RegistryView validation error: ${msg}`);
      setValidationError(msg);
      setToast({ message: msg, type: 'error' });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const selectedStudio = studios.find(s => s.id === studioId);
      const selectedEditor = editors.find(ed => ed.id === assignedEditorId);
      const selectedSecondEditor = isSplitProject ? editors.find(ed => ed.id === secondEditorId) : null;
      
      // Auto-generate project ID
      const autoId = `PRJ-2026-${String(projects.length + 1).padStart(3, '0')}`;
      const finalCouplePhoto = couplePhoto || DEFAULT_COVERS[0].url;
      const coupleName = `${groomName.trim()} & ${brideName.trim()}`;

      const finalEventType = selectedFunctions.length > 0 ? selectedFunctions.join(', ') : eventType;

      await onAddProject({
        id: autoId,
        projectName: projectName.trim(),
        brideName: brideName.trim(),
        groomName: groomName.trim(),
        coupleName,
        eventType: finalEventType,
        studioId,
        studioName: selectedStudio ? selectedStudio.name : 'Direct Client',
        shootDate,
        deliveryDate,
        assignedEditorId: assignedEditorId || undefined,
        assignedEditorName: selectedEditor ? selectedEditor.name : 'Unassigned',
        isSplitProject,
        secondEditorId: isSplitProject ? (secondEditorId || undefined) : undefined,
        secondEditorName: isSplitProject ? (selectedSecondEditor ? selectedSecondEditor.name : 'Unassigned') : undefined,
        firstEditorShare: isSplitProject ? firstEditorShare : undefined,
        secondEditorShare: isSplitProject ? secondEditorShare : undefined,
        status,
        priority,
        projectAmount,
        editorPayment,
        otherExpenses,
        advancePayment,
        remainingBalance: calculatedRemainingBalance,
        couplePhoto: finalCouplePhoto,
        notes: notes.trim(),
        hardDiskName: hardDiskName.trim(),
        dataSize: dataSize.trim(),
        backupStatus,
        googleDriveLink: googleDriveLink.trim(),
        rawDataFolder: rawDataFolder.trim(),
        deliveryFolder: deliveryFolder.trim(),
        finalExportFolder: finalExportFolder.trim(),
        customMilestones: customMilestones
      });

      setRegistrationSuccess(autoId);
      setToast({ message: `Successfully registered project: ${coupleName}`, type: 'success' });
      
      // Auto scroll to top to see success
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error("❌ RegistryView: Failed to save wedding project:", err);
      const errorMsg = `Failed to save wedding project: ${err.message || err}`;
      setValidationError(errorMsg);
      setToast({
        message: errorMsg,
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setProjectName('');
    setBrideName('');
    setGroomName('');
    setEventType('Wedding Film');
    setShootDate('');
    setDeliveryDate('');
    setAssignedEditorId('');
    setStatus('data_received');
    setPriority('medium');
    setCouplePhoto('');
    setNotes('');
    setProjectAmount(0);
    setEditorPayment(0);
    setOtherExpenses(0);
    setAdvancePayment(0);
    setHardDiskName('');
    setDataSize('');
    setBackupStatus('pending');
    setGoogleDriveLink('');
    setRawDataFolder('');
    setDeliveryFolder('');
    setFinalExportFolder('');
    setSelectedFunctions([]);
    setRegistrationSuccess(null);
    setValidationError('');
    setIsSplitProject(false);
    setSecondEditorId('');
    setSplitPreset('50-50');
    setFirstEditorShare(0);
    setSecondEditorShare(0);
    setCustomMilestones(
      DEFAULT_MILESTONES.map((m, idx) => ({
        id: `milestone-${idx}-${Date.now()}`,
        label: m,
        completed: false
      }))
    );
    setNewMilestoneInput('');
  };

  if (registrationSuccess) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border border-stone-200 rounded-[32px] p-8 md:p-12 text-center space-y-8 shadow-xl"
        >
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full flex items-center justify-center mx-auto text-2xl shadow-sm">
            ✓
          </div>
          <div className="space-y-3">
            <span className="text-[10px] font-mono font-bold tracking-widest text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200/50 uppercase">
              Registration Complete
            </span>
            <h2 className="text-3xl font-bold text-stone-900 tracking-tight">Wedding Registered Successfully!</h2>
            <p className="text-stone-400 text-xs font-mono">Project ID: <span className="text-stone-800 font-semibold">{registrationSuccess}</span></p>
            <p className="text-stone-600 text-sm max-w-md mx-auto mt-2 leading-relaxed">
              The wedding film project of <strong className="text-stone-900 font-semibold">{groomName} & {brideName}</strong> has been successfully logged.
            </p>
          </div>

          <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 max-w-md mx-auto grid grid-cols-2 gap-y-4 gap-x-6 text-left text-xs font-mono text-stone-600">
            <div>
              <span className="text-stone-400 block text-[9px] uppercase tracking-wider font-bold">Partner Studio</span>
              <span className="text-stone-800 font-semibold truncate block mt-0.5">{studios.find(s => s.id === studioId)?.name || 'Direct Client'}</span>
            </div>
            <div>
              <span className="text-stone-400 block text-[9px] uppercase tracking-wider font-bold">Lead Editor</span>
              <span className="text-stone-800 font-semibold truncate block mt-0.5">{editors.find(e => e.id === assignedEditorId)?.name || 'Unassigned'}</span>
            </div>
            <div>
              <span className="text-stone-400 block text-[9px] uppercase tracking-wider font-bold">Shoot Date</span>
              <span className="text-stone-800 font-semibold block mt-0.5">{shootDate}</span>
            </div>
            <div>
              <span className="text-stone-400 block text-[9px] uppercase tracking-wider font-bold">Delivery Deadline</span>
              <span className="text-stone-800 font-semibold block mt-0.5">{deliveryDate}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              type="button"
              onClick={onRedirectToProjects}
              className="w-full sm:w-auto px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all duration-200"
            >
              View in Project List
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="w-full sm:w-auto px-6 py-3 bg-white border border-stone-200 text-stone-700 hover:text-stone-900 hover:bg-stone-50 font-bold text-xs rounded-xl cursor-pointer transition-all duration-200"
            >
              Register Another Wedding
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[32px] p-6 md:p-10 bg-[#FAF9F6] border border-stone-200 shadow-lg space-y-10 min-h-screen text-stone-800">
      {/* Texture noise pattern overlay */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
      
      {/* Ambient soft cream/gold highlights */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-amber-100/40 blur-[100px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-stone-100/50 blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-amber-100/20 blur-[120px] pointer-events-none" />

      {/* Elegant minimalist line watermark */}
      <div className="absolute right-12 top-14 opacity-[0.05] pointer-events-none select-none hidden lg:block">
        <svg width="180" height="180" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-stone-800">
          <path d="M120,40 A65,65 0 0,1 185,105" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M70,105 A65,65 0 0,1 135,40" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="78" y1="105" x2="185" y2="105" stroke="currentColor" strokeWidth="1.2" />
          <line x1="105" y1="55" x2="105" y2="105" stroke="currentColor" strokeWidth="1.2" />
          <line x1="105" y1="80" x2="135" y2="80" stroke="currentColor" strokeWidth="1.2" />
          <line x1="154" y1="105" x2="154" y2="160" stroke="currentColor" strokeWidth="1.2" />
          <line x1="135" y1="105" x2="135" y2="160" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="85" cy="125" r="4" fill="currentColor" />
          <text x="130" y="190" fill="currentColor" fontSize="10" fontFamily="sans-serif" letterSpacing="5" textAnchor="middle" fontWeight="bold">THE FRAME CUT</text>
        </svg>
      </div>

      {/* Page Header */}
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-stone-200/80 pb-8">
        <div>
          <div className="flex items-center space-x-2 text-amber-800 font-mono text-xs uppercase tracking-widest font-bold mb-2">
            <Heart className="w-4 h-4 text-amber-600 animate-pulse" />
            <span>Wedding Registration Suite</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-stone-900 tracking-tight">
            New Wedding Registry
          </h1>
          <p className="text-sm md:text-base text-stone-500 mt-2 max-w-xl font-medium leading-relaxed">
            Record cinematic specifications, physical backups, custom deliverables, and a project ledger in an elegant, minimal planner.
          </p>
        </div>

        <button
          type="button"
          onClick={onRedirectToProjects}
          className="flex items-center space-x-2 px-5 py-3 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 hover:text-stone-900 rounded-xl text-sm transition-all cursor-pointer font-semibold shadow-sm hover:shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </button>
      </div>

      {/* Validation Banner */}
      {validationError && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm flex items-center space-x-3 shadow-sm"
        >
          <span className="text-lg">⚠️</span>
          <span className="font-semibold">{validationError}</span>
        </motion.div>
      )}

      {/* Main Single Page Layout */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10">
        
        {/* LEFT COLUMN: THE REGISTRATION FORM (7 Cols) */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* SECTION 1: COUPLE & EVENT CEREMONY (Rearranged to highlight Couple Names first) */}
          <div className="p-8 bg-white rounded-3xl border border-stone-200 space-y-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3 pb-3 border-b border-stone-100">
              <span className="w-6 h-6 rounded-full bg-stone-100 text-stone-800 flex items-center justify-center text-xs font-bold font-mono">1</span>
              <h3 className="text-sm md:text-base font-bold text-stone-900 uppercase tracking-wider">Couple & Event Ceremony</h3>
            </div>

            <div className="space-y-6">
              {/* Couple Names Row (Groom & Bride - Placed at the top of Section 1 for better logical order) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-stone-700 mb-2">
                    Groom Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-400" />
                    <input 
                      type="text" 
                      placeholder="Enter Groom's Full Name" 
                      value={groomName} 
                      onChange={(e) => { setGroomName(e.target.value); setValidationError(''); }} 
                      className="w-full bg-stone-50/40 border border-stone-200 hover:border-stone-300 focus:border-amber-500/50 rounded-xl pl-11 pr-4 py-3 text-sm md:text-base text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none transition-all" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-stone-700 mb-2">
                    Bride Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-400" />
                    <input 
                      type="text" 
                      placeholder="Enter Bride's Full Name" 
                      value={brideName} 
                      onChange={(e) => { setBrideName(e.target.value); setValidationError(''); }} 
                      className="w-full bg-stone-50/40 border border-stone-200 hover:border-stone-300 focus:border-amber-500/50 rounded-xl pl-11 pr-4 py-3 text-sm md:text-base text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none transition-all" 
                    />
                  </div>
                </div>
              </div>

              {/* Project Film Title */}
              <div>
                <label className="block text-xs md:text-sm font-semibold text-stone-700 mb-2">
                  Project Wedding Film Title <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. Rohan & Riya Destination Wedding Film" 
                  value={projectName} 
                  onChange={(e) => { setProjectName(e.target.value); setValidationError(''); }} 
                  className="w-full bg-stone-50/40 border border-stone-200 hover:border-stone-300 focus:border-amber-500/50 rounded-xl px-4 py-3.5 text-sm md:text-base text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none transition-all" 
                />
              </div>

              {/* Ceremony Type & Studio Partner */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-stone-700 mb-2">
                    Ceremony Type
                  </label>
                  <select 
                    value={eventType} 
                    onChange={(e) => setEventType(e.target.value)} 
                    className="w-full bg-stone-50/40 border border-stone-200 hover:border-stone-300 focus:border-amber-500/50 rounded-xl px-4 py-3 text-sm md:text-base text-stone-800 focus:bg-white focus:outline-none cursor-pointer transition-all"
                  >
                    <option value="Wedding Film">Wedding Film</option>
                    <option value="Pre-Wedding Film">Pre-Wedding Film</option>
                    <option value="Engagement Teaser">Engagement Teaser</option>
                    <option value="Sangeet Cut">Sangeet Cut</option>
                    <option value="Cinematic Highlight">Cinematic Highlight</option>
                    <option value="Anniversary special">Anniversary Special</option>
                    <option value="Commercial Event">Commercial Event</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-semibold text-stone-700 mb-2">
                    Studio Partner
                  </label>
                  {userRole === 'studio' ? (
                    <div className="w-full bg-stone-100 border border-stone-200 rounded-xl px-4 py-3.5 text-sm md:text-base text-stone-600 select-none font-medium">
                      {studios.find(s => s.id === studioId)?.name || 'Direct Client'}
                    </div>
                  ) : (
                    <select 
                      value={studioId} 
                      onChange={(e) => setStudioId(e.target.value)} 
                      className="w-full bg-stone-50/40 border border-stone-200 hover:border-stone-300 focus:border-amber-500/50 rounded-xl px-4 py-3 text-sm md:text-base text-stone-800 focus:bg-white focus:outline-none cursor-pointer transition-all"
                    >
                      <option value="">Direct Client (No Studio)</option>
                      {studios.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: CREW, SCHEDULE & PRIORITY (Rearranged & unboxed for simple minimal feel) */}
          <div className="p-8 bg-white rounded-3xl border border-stone-200 space-y-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-100 gap-3">
              <div className="flex items-center space-x-3">
                <span className="w-6 h-6 rounded-full bg-stone-100 text-stone-800 flex items-center justify-center text-xs font-bold font-mono">2</span>
                <h3 className="text-sm md:text-base font-bold text-stone-900 uppercase tracking-wider">Crew, Schedule & Priority</h3>
              </div>
              
              {/* Timeline Badge */}
              {shootDate && deliveryDate && (
                <div className="flex items-center space-x-2 bg-amber-50 border border-amber-200/60 rounded-xl px-3.5 py-1.5 text-xs font-mono text-amber-900">
                  <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>
                    Window: <strong className="font-bold">{daysDifference} Days</strong>
                  </span>
                  <span className="text-amber-200">|</span>
                  <span className={daysToDeadline !== null && daysToDeadline < 0 ? "text-red-600 font-bold" : "text-emerald-700 font-bold"}>
                    {daysToDeadline !== null ? (
                      daysToDeadline < 0 
                        ? `Lapsed ${Math.abs(daysToDeadline)}d` 
                        : daysToDeadline === 0 
                          ? 'Due Today!' 
                          : `${daysToDeadline}d Left`
                    ) : ''}
                  </span>
                </div>
              )}
            </div>

            {/* Timelines and Staffing - Arranged in a clean grid without nested grey borders */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Side: Schedule */}
              <div className="space-y-5">
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-stone-700 mb-2">
                    Shoot/Ceremony Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-400 pointer-events-none" />
                    <input 
                      type="date" 
                      value={shootDate} 
                      onChange={(e) => { setShootDate(e.target.value); setValidationError(''); }} 
                      onClick={(e) => { try { e.currentTarget.showPicker(); } catch (err) {} }}
                      className="w-full bg-stone-50/40 border border-stone-200 rounded-xl pl-11 pr-4 py-3 text-sm md:text-base text-stone-900 focus:outline-none focus:border-amber-500/50 cursor-pointer transition-colors" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-semibold text-stone-700 mb-2">
                    Delivery Deadline <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-400 pointer-events-none" />
                    <input 
                      type="date" 
                      value={deliveryDate} 
                      onChange={(e) => { setDeliveryDate(e.target.value); setValidationError(''); }} 
                      onClick={(e) => { try { e.currentTarget.showPicker(); } catch (err) {} }}
                      className="w-full bg-stone-50/40 border border-stone-200 rounded-xl pl-11 pr-4 py-3 text-sm md:text-base text-stone-900 focus:outline-none focus:border-amber-500/50 cursor-pointer transition-colors" 
                    />
                  </div>

                  {shootDate && (
                    <div className="flex flex-wrap gap-1.5 mt-3 justify-start">
                      <span className="text-[11px] font-mono text-stone-400 self-center mr-1">Quick offset:</span>
                      {[7, 14, 30, 60, 90].map((days) => {
                        const calculatedDate = new Date(shootDate);
                        calculatedDate.setDate(calculatedDate.getDate() + days);
                        if (isNaN(calculatedDate.getTime())) return null;
                        const isSelected = deliveryDate === calculatedDate.toISOString().split('T')[0];
                        return (
                          <button
                            key={days}
                            type="button"
                            onClick={() => setDeliveryOffset(days)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all border ${
                              isSelected
                                ? "bg-amber-100 text-amber-900 border-amber-300"
                                : "bg-white text-stone-500 border-stone-200 hover:border-stone-300 hover:text-stone-700"
                            }`}
                          >
                            +{days}d
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side: Crew Sync */}
              <div className="space-y-5">
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-stone-700 mb-2">
                    Lead Cinematic Editor
                  </label>
                  {userRole === 'studio' ? (
                    <div className="w-full bg-stone-100 border border-stone-200 rounded-xl px-4 py-3.5 text-sm text-stone-600 font-medium">
                      👤 {editors.find(ed => ed.id === assignedEditorId)?.name || 'Unassigned'}
                    </div>
                  ) : (
                    <select 
                      value={assignedEditorId} 
                      onChange={(e) => setAssignedEditorId(e.target.value)} 
                      className="w-full bg-stone-50/40 border border-stone-200 rounded-xl px-4 py-3 text-sm md:text-base text-stone-800 focus:outline-none focus:border-amber-500/50 cursor-pointer transition-colors"
                    >
                      <option value="">Unassigned (Queue Pool)</option>
                      {editors.map(ed => (
                        <option key={ed.id} value={ed.id}>
                          👤 {ed.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-semibold text-stone-700 mb-2">
                    Workflow Stage
                  </label>
                  {userRole === 'studio' ? (
                    <div className="flex items-center space-x-2 bg-stone-100 border border-stone-200 rounded-xl px-4 py-3.5 text-sm text-stone-700 font-semibold capitalize">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                      <span>{WORKFLOW_STAGES.find(s => s.id === status)?.label || 'Data Received'}</span>
                    </div>
                  ) : (
                    <select 
                      value={status} 
                      onChange={(e) => setStatus(e.target.value as ProjectStatus)} 
                      className="w-full bg-stone-50/40 border border-stone-200 rounded-xl px-4 py-3 text-sm md:text-base text-stone-800 focus:outline-none focus:border-amber-500/50 cursor-pointer transition-colors"
                    >
                      {WORKFLOW_STAGES.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {userRole !== 'studio' && (
                  <div className="pt-2">
                    <label className="flex items-center space-x-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={isSplitProject}
                        onChange={(e) => setIsSplitProject(e.target.checked)}
                        className="w-4 h-4 rounded border-stone-300 text-amber-600 bg-white focus:ring-0 cursor-pointer"
                      />
                      <span className="text-xs md:text-sm text-stone-700 font-semibold group-hover:text-stone-900 transition-colors">
                        Assign 2 Editors (Split Project)?
                      </span>
                    </label>

                    {isSplitProject && (
                      <div className="mt-3 p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-stone-500 font-semibold mb-1.5">Secondary Editor</label>
                            <select 
                              value={secondEditorId} 
                              onChange={(e) => setSecondEditorId(e.target.value)} 
                              className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs md:text-sm text-stone-800 focus:outline-none cursor-pointer"
                            >
                              <option value="">Select Second Editor...</option>
                              {editors.filter(ed => ed.id !== assignedEditorId).map(ed => (
                                <option key={ed.id} value={ed.id}>{ed.name}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs text-stone-500 font-semibold mb-1.5">Payment Ratio</label>
                            <select 
                              value={splitPreset} 
                              onChange={(e) => setSplitPreset(e.target.value)} 
                              className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs md:text-sm text-stone-800 focus:outline-none cursor-pointer"
                            >
                              <option value="50-50">Equal Split (50% / 50%)</option>
                              <option value="60-40">Primary (60%) / Secondary (40%)</option>
                              <option value="70-30">Primary (70%) / Secondary (30%)</option>
                              <option value="80-20">Primary (80%) / Secondary (20%)</option>
                              <option value="custom">Custom Split (Manual)</option>
                            </select>
                          </div>
                        </div>

                        <div className="p-3.5 bg-white rounded-xl border border-stone-150 space-y-2 text-xs font-mono">
                          <div className="flex justify-between text-stone-500 font-semibold">
                            <span>Total Editor Share:</span>
                            <span className="text-stone-900 font-bold">₹{editorPayment.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-stone-100 text-stone-600">
                            <div>
                              <span className="font-semibold block text-[10px] text-stone-400 uppercase">Lead Share:</span>
                              {splitPreset === 'custom' ? (
                                <input 
                                  type="number"
                                  value={firstEditorShare}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setFirstEditorShare(val);
                                    setSecondEditorShare(Math.max(0, editorPayment - val));
                                  }}
                                  className="w-full bg-stone-50 border border-stone-200 rounded px-2 py-1 mt-1 text-xs font-bold"
                                />
                              ) : (
                                <strong className="block text-stone-800 text-sm mt-0.5">₹{firstEditorShare.toLocaleString('en-IN')}</strong>
                              )}
                            </div>
                            <div>
                              <span className="font-semibold block text-[10px] text-stone-400 uppercase">Secondary Share:</span>
                              {splitPreset === 'custom' ? (
                                <input 
                                  type="number"
                                  value={secondEditorShare}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setSecondEditorShare(val);
                                    setFirstEditorShare(Math.max(0, editorPayment - val));
                                  }}
                                  className="w-full bg-stone-50 border border-stone-200 rounded px-2 py-1 mt-1 text-xs font-bold"
                                />
                              ) : (
                                <strong className="block text-stone-800 text-sm mt-0.5">₹{secondEditorShare.toLocaleString('en-IN')}</strong>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Interactive Priorities */}
            <div className="space-y-3 pt-4 border-t border-stone-100">
              <span className="block text-xs md:text-sm font-semibold text-stone-700">
                Queue Priority Assignment
              </span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {PRIORITIES.map((p) => {
                  const isActive = priority === p.id;
                  
                  let priorityStyles = {
                    border: "border-stone-200",
                    activeBg: "bg-stone-100 text-stone-900 border-stone-400 shadow-sm",
                    indicator: "bg-stone-500"
                  };
                  if (p.id === 'medium') {
                    priorityStyles = {
                      border: "border-stone-200",
                      activeBg: "bg-sky-50 text-sky-900 border-sky-300 shadow-sm",
                      indicator: "bg-sky-500"
                    };
                  } else if (p.id === 'high') {
                    priorityStyles = {
                      border: "border-stone-200",
                      activeBg: "bg-amber-50 text-amber-900 border-amber-300 shadow-sm",
                      indicator: "bg-amber-500"
                    };
                  } else if (p.id === 'urgent') {
                    priorityStyles = {
                      border: "border-stone-200",
                      activeBg: "bg-red-50 text-red-900 border-red-300 shadow-sm",
                      indicator: "bg-red-500"
                    };
                  }

                  const getPriorityLabel = (id: string) => {
                    if (id === 'low') return 'Standard Queue';
                    if (id === 'medium') return 'Regular edit';
                    if (id === 'high') return 'Express priority';
                    return 'Top priority';
                  };

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPriority(p.id)}
                      className={`p-4 rounded-2xl text-left transition-all duration-200 border flex flex-col justify-between h-24 ${
                        isActive 
                          ? priorityStyles.activeBg
                          : `bg-stone-50/50 hover:bg-stone-50 text-stone-600 ${priorityStyles.border}`
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs md:text-sm font-bold uppercase tracking-wider">{p.label}</span>
                        <span className={`w-2 h-2 rounded-full ${isActive ? priorityStyles.indicator : 'bg-stone-200'}`} />
                      </div>
                      <span className="text-[10px] md:text-xs font-mono text-stone-400 leading-snug">
                        {getPriorityLabel(p.id)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SECTION 3: FINANCIAL LEDGER SHEET */}
          <div className="p-8 bg-white rounded-3xl border border-stone-200 space-y-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3 pb-3 border-b border-stone-100">
              <span className="w-6 h-6 rounded-full bg-stone-100 text-stone-800 flex items-center justify-center text-xs font-bold font-mono">3</span>
              <h3 className="text-sm md:text-base font-bold text-stone-900 uppercase tracking-wider">Ledger Sheet (Finance)</h3>
            </div>

            {userRole !== 'studio' ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[11px] font-mono font-bold text-stone-500 mb-2 uppercase">Total Contract ₹</label>
                    <input 
                      type="number" 
                      value={projectAmount || ''} 
                      onChange={(e) => setProjectAmount(Number(e.target.value))} 
                      className="w-full bg-stone-50/50 border border-stone-200 rounded-xl px-4 py-2.5 text-xs md:text-sm text-stone-900 font-medium focus:outline-none focus:border-amber-500/50 focus:bg-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono font-bold text-stone-500 mb-2 uppercase">Editor Comp ₹</label>
                    <input 
                      type="number" 
                      value={editorPayment || ''} 
                      onChange={(e) => setEditorPayment(Number(e.target.value))} 
                      className="w-full bg-stone-50/50 border border-stone-200 rounded-xl px-4 py-2.5 text-xs md:text-sm text-stone-900 font-medium focus:outline-none focus:border-amber-500/50 focus:bg-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono font-bold text-stone-500 mb-2 uppercase">Other Costs ₹</label>
                    <input 
                      type="number" 
                      value={otherExpenses || ''} 
                      onChange={(e) => setOtherExpenses(Number(e.target.value))} 
                      className="w-full bg-stone-50/50 border border-stone-200 rounded-xl px-4 py-2.5 text-xs md:text-sm text-stone-900 font-medium focus:outline-none focus:border-amber-500/50 focus:bg-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono font-bold text-stone-500 mb-2 uppercase">Advance Paid ₹</label>
                    <input 
                      type="number" 
                      value={advancePayment || ''} 
                      onChange={(e) => setAdvancePayment(Number(e.target.value))} 
                      className="w-full bg-stone-50/50 border border-stone-200 rounded-xl px-4 py-2.5 text-xs md:text-sm text-stone-900 font-medium focus:outline-none focus:border-amber-500/50 focus:bg-white" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 p-5 bg-stone-50 rounded-2xl border border-stone-200 text-sm font-mono">
                  <div className="flex flex-col">
                    <span className="text-stone-500 text-xs font-bold uppercase tracking-wider">Collection Due</span>
                    <strong className="text-lg md:text-xl font-bold mt-1 text-stone-900">
                      ₹{calculatedRemainingBalance.toLocaleString('en-IN')}
                    </strong>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-stone-500 text-xs font-bold uppercase tracking-wider">Est. Net Margin</span>
                    <strong className={`text-lg md:text-xl font-bold mt-1 ${estimatedProfitMargin >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                      ₹{estimatedProfitMargin.toLocaleString('en-IN')}
                    </strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5 bg-stone-50 border border-stone-200 rounded-2xl text-xs md:text-sm font-mono text-stone-500">
                🔒 Budget & Finance metrics are encrypted and locked for non-administrative studio accounts.
              </div>
            )}
          </div>

          {/* TOGGLE FOR ADVANCED CONFIGURATION */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full py-4 bg-stone-100 hover:bg-stone-200/80 border border-stone-200 text-stone-700 hover:text-stone-950 rounded-xl text-sm font-mono font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-sm"
            >
              <span>{showAdvanced ? "Hide Advanced Settings (Deliverables, Milestones & Backups) ▴" : "Show Advanced Settings (Deliverables, Milestones, Storage & Backups) ▾"}</span>
            </button>
          </div>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-8 overflow-hidden"
              >
                {/* SECTION 4: DELIVERABLES SELECTION */}
                <div className="p-8 bg-white rounded-3xl border border-stone-200 space-y-5 shadow-sm">
                  <div className="flex items-center space-x-3 pb-3 border-b border-stone-100">
                    <span className="w-6 h-6 rounded-full bg-stone-100 text-stone-800 flex items-center justify-center text-xs font-bold font-mono">4</span>
                    <h3 className="text-sm md:text-base font-bold text-stone-900 uppercase tracking-wider">Cinematic Deliverables</h3>
                  </div>

                  <span className="text-xs md:text-sm font-semibold text-stone-600 block mb-1">Select deliverables to produce:</span>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {availableFunctions.map((func) => {
                      const isSelected = selectedFunctions.includes(func);
                      return (
                        <div
                          key={func}
                          onClick={() => {
                            setSelectedFunctions(isSelected ? selectedFunctions.filter(f => f !== func) : [...selectedFunctions, func]);
                            setValidationError('');
                          }}
                          className={`flex items-center justify-between p-3.5 px-4 rounded-xl border cursor-pointer select-none transition-all duration-150 ${
                            isSelected 
                              ? 'bg-amber-50 border-amber-300 text-amber-950 font-bold shadow-sm' 
                              : 'bg-stone-50 border-stone-200 text-stone-600 hover:border-stone-300 hover:text-stone-800'
                          }`}
                        >
                          <span className="text-xs md:text-sm truncate">{func}</span>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] shrink-0 ml-1.5 ${isSelected ? 'bg-amber-600 border-amber-600 text-white font-bold' : 'border-stone-400'}`}>
                            {isSelected ? "✓" : "+"}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center bg-stone-50 rounded-xl border border-stone-200 p-1.5 pl-4">
                    <input 
                      type="text" 
                      placeholder="Add customized deliverable..." 
                      value={customFunctionInput} 
                      onChange={(e) => setCustomFunctionInput(e.target.value)} 
                      className="flex-1 bg-transparent border-0 outline-none text-xs md:text-sm text-stone-800 py-1.5" 
                      onKeyDown={(e) => { 
                        if (e.key === 'Enter') { 
                          e.preventDefault(); 
                          e.stopPropagation();
                          handleAddCustomFunction(); 
                        } 
                      }} 
                    />
                    <button 
                      type="button" 
                      onClick={handleAddCustomFunction} 
                      className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs md:text-sm font-bold rounded-lg cursor-pointer transition-colors shrink-0"
                    >
                      Add
                    </button>
                  </div>

                  <div className="pt-2">
                    <label className="block text-xs md:text-sm font-semibold text-stone-700 mb-2">Special Directions / Production Notes</label>
                    <textarea 
                      rows={4}
                      placeholder="Enter client specifications, reference songs, video references, editing guidelines..." 
                      value={notes} 
                      onChange={(e) => setNotes(e.target.value)} 
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-xs md:text-sm text-stone-800 resize-none focus:outline-none focus:border-amber-500/50 focus:bg-white transition-all" 
                    />
                  </div>
                </div>

                {/* SECTION 5: CUSTOM MILESTONE ROADMAP */}
                <div className="p-8 bg-white rounded-3xl border border-stone-200 space-y-5 shadow-sm">
                  <div className="flex items-center space-x-3 pb-3 border-b border-stone-100">
                    <span className="w-6 h-6 rounded-full bg-stone-100 text-stone-800 flex items-center justify-center text-xs font-bold font-mono">5</span>
                    <h3 className="text-sm md:text-base font-bold text-stone-900 uppercase tracking-wider">Custom Milestone Checklist</h3>
                  </div>

                  <p className="text-xs text-stone-500 leading-relaxed">
                    Initialize customized tracking milestones for this wedding film. You can toggle initial stages, append custom steps, or prune unnecessary steps.
                  </p>

                  <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                    {customMilestones.map((m) => (
                      <div 
                        key={m.id} 
                        className="flex items-center justify-between p-3.5 px-4 rounded-xl border border-stone-150 bg-stone-50/50 hover:bg-stone-50 transition-all text-xs md:text-sm text-stone-800"
                      >
                        <div className="flex items-center space-x-3">
                          <input 
                            type="checkbox" 
                            checked={m.completed} 
                            onChange={() => {
                              setCustomMilestones(customMilestones.map(item => item.id === m.id ? { ...item, completed: !item.completed } : item));
                            }}
                            className="w-4 h-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                          />
                          <span className={`${m.completed ? 'line-through text-stone-400 font-normal' : 'font-semibold text-stone-800'}`}>
                            {m.label}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setCustomMilestones(customMilestones.filter(item => item.id !== m.id));
                          }}
                          className="text-[11px] text-red-500 hover:text-red-700 font-semibold font-mono"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center bg-stone-50 rounded-xl border border-stone-200 p-1.5 pl-4">
                    <input 
                      type="text" 
                      placeholder="Add custom milestone step (e.g. Pre-Teaser Approved)..." 
                      value={newMilestoneInput} 
                      onChange={(e) => setNewMilestoneInput(e.target.value)} 
                      className="flex-1 bg-transparent border-0 outline-none text-xs md:text-sm text-stone-800 py-1.5" 
                      onKeyDown={(e) => { 
                        if (e.key === 'Enter') { 
                          e.preventDefault(); 
                          e.stopPropagation();
                          if (newMilestoneInput.trim()) {
                            setCustomMilestones([
                              ...customMilestones,
                              {
                                id: `milestone-${Date.now()}`,
                                label: newMilestoneInput.trim(),
                                completed: false
                              }
                            ]);
                            setNewMilestoneInput('');
                          }
                        } 
                      }} 
                    />
                    <button 
                      type="button" 
                      onClick={() => {
                        if (newMilestoneInput.trim()) {
                          setCustomMilestones([
                            ...customMilestones,
                            {
                              id: `milestone-${Date.now()}`,
                              label: newMilestoneInput.trim(),
                              completed: false
                            }
                          ]);
                          setNewMilestoneInput('');
                        }
                      }} 
                      className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs md:text-sm font-bold rounded-lg cursor-pointer transition-colors shrink-0"
                    >
                      Add Step
                    </button>
                  </div>
                </div>

                {/* SECTION 6: PHYSICAL STORAGE & ASSET PATHS */}
                <div className="p-8 bg-white rounded-3xl border border-stone-200 space-y-5 shadow-sm">
                  <div className="flex items-center space-x-3 pb-3 border-b border-stone-100">
                    <span className="w-6 h-6 rounded-full bg-stone-100 text-stone-800 flex items-center justify-center text-xs font-bold font-mono">6</span>
                    <h3 className="text-sm md:text-base font-bold text-stone-900 uppercase tracking-wider">Physical Storage & Backup Specs</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-xs md:text-sm font-semibold text-stone-700 mb-2">HDD Reference Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. WD BLACK 4TB - #08" 
                        value={hardDiskName} 
                        onChange={(e) => setHardDiskName(e.target.value)} 
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-xs md:text-sm text-stone-900 focus:outline-none focus:border-amber-500/50 focus:bg-white" 
                      />
                    </div>

                    <div>
                      <label className="block text-xs md:text-sm font-semibold text-stone-700 mb-2">Raw Footage Size</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 1.8 TB" 
                        value={dataSize} 
                        onChange={(e) => setDataSize(e.target.value)} 
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-xs md:text-sm text-stone-900 focus:outline-none focus:border-amber-500/50 focus:bg-white" 
                      />
                    </div>

                    <div>
                      <label className="block text-xs md:text-sm font-semibold text-stone-700 mb-2">Backup Status</label>
                      <select 
                        value={backupStatus} 
                        onChange={(e) => setBackupStatus(e.target.value as 'pending' | 'backed_up')} 
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-xs md:text-sm text-stone-800 focus:outline-none focus:border-amber-500/50 cursor-pointer"
                      >
                        <option value="pending">⏳ Pending Backup</option>
                        <option value="backed_up">✅ Backed Up Safely</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="block text-xs md:text-sm font-semibold text-stone-700 mb-2">Google Drive Cloud Link</label>
                      <div className="relative">
                        <Link2 className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-400" />
                        <input 
                          type="url" 
                          placeholder="https://drive.google.com/drive/folders/..." 
                          value={googleDriveLink} 
                          onChange={(e) => setGoogleDriveLink(e.target.value)} 
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-11 pr-4 py-3 text-xs md:text-sm text-stone-900 focus:outline-none focus:border-amber-500/50 focus:bg-white" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-stone-500 font-semibold mb-1.5">Raw Folder Name</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Raw_Footage" 
                          value={rawDataFolder} 
                          onChange={(e) => setRawDataFolder(e.target.value)} 
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs md:text-sm text-stone-900 focus:outline-none focus:border-amber-500/50" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-stone-500 font-semibold mb-1.5">Deliveries Folder</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Edited_Deliverables" 
                          value={deliveryFolder} 
                          onChange={(e) => setDeliveryFolder(e.target.value)} 
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs md:text-sm text-stone-900 focus:outline-none focus:border-amber-500/50" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-stone-500 font-semibold mb-1.5">Final Archive Folder</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Final_Project_Archives" 
                          value={finalExportFolder} 
                          onChange={(e) => setFinalExportFolder(e.target.value)} 
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs md:text-sm text-stone-900 focus:outline-none focus:border-amber-500/50" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* REGISTER ACTION TRIGGERS */}
          <div className="flex items-center justify-end space-x-4 pt-8 border-t border-stone-200">
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-3.5 bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-700 hover:text-stone-950 rounded-xl text-sm font-bold transition-all cursor-pointer"
            >
              Reset Form
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm rounded-xl shadow-md hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all cursor-pointer flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <Heart className="w-4 h-4" />
                  <span>Register Wedding Project</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: INTERACTIVE PREVIEW & ASSETS (5 Cols) */}
        <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-8">
          
          {/* INTERACTIVE CINE-CARD PREVIEW */}
          <div className="p-8 bg-white rounded-3xl border border-stone-200 space-y-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <span className="text-xs font-mono text-amber-900 bg-amber-50 px-3 py-1 rounded-full uppercase border border-amber-200/50 font-bold tracking-wider">
                Live Spec Card Preview
              </span>
              <span className="text-xs text-stone-400 font-mono font-bold tracking-widest">THE FRAME CUT</span>
            </div>

            {/* Simulated interactive project card */}
            <div className="p-2 bg-[#FAF9F6] rounded-[28px] border border-stone-200 shadow-sm max-w-sm mx-auto w-full group overflow-hidden transition-all">
              <div className="h-48 rounded-[22px] overflow-hidden relative">
                <img 
                  src={couplePhoto || DEFAULT_COVERS[0].url} 
                  alt="Live Preview" 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 via-stone-950/10 to-transparent" />
                
                {/* ID Badge */}
                <div className="absolute top-4 left-4 flex space-x-1.5">
                  <span className="text-[10px] font-mono px-2.5 py-1 bg-stone-900/90 text-amber-100 rounded">
                    PRJ-2026-AUTO
                  </span>
                  <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded uppercase font-bold ${
                    priority === 'urgent' ? 'bg-red-500 text-white' :
                    priority === 'high' ? 'bg-amber-500 text-stone-950' :
                    priority === 'medium' ? 'bg-sky-500 text-white' : 'bg-stone-500 text-white'
                  }`}>
                    {priority}
                  </span>
                </div>

                <div className="absolute bottom-4 left-4">
                  <span className="text-[10px] font-mono px-2.5 py-1 bg-stone-900/80 text-white rounded uppercase font-bold">
                    {WORKFLOW_STAGES.find(s => s.id === status)?.label || 'Data Received'}
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <h4 className="text-base font-bold text-stone-900 truncate leading-tight">
                    {projectName.trim() || 'Couple Film Project Name'}
                  </h4>
                  <p className="text-xs text-amber-800 font-mono font-bold tracking-wider uppercase mt-1">
                    {(groomName.trim() || brideName.trim()) ? `💍 ${groomName || 'Groom'} & ${brideName || 'Bride'}` : 'Groom & Bride Names'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs text-stone-500 font-mono">
                  <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200/40">
                    <span className="text-stone-400 text-[9px] block uppercase font-bold">Partner Studio</span>
                    <span className="text-stone-800 font-bold truncate block mt-0.5">
                      {studios.find(s => s.id === studioId)?.name || 'Direct Client'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200/40">
                    <span className="text-stone-400 text-[9px] block uppercase font-bold">Lead Editor</span>
                    <span className="text-stone-800 font-bold truncate block mt-0.5">
                      {editors.find(e => e.id === assignedEditorId)?.name || 'Unassigned'}
                    </span>
                  </div>
                </div>

                <div className="border-t border-stone-200/60 pt-4 flex justify-between text-xs text-stone-500 font-mono">
                  <span className="flex items-center space-x-1.5">
                    <Calendar className="w-4 h-4 text-stone-400" />
                    <span className="font-semibold">{deliveryDate || 'YYYY-MM-DD'}</span>
                  </span>
                  <span className="font-bold text-stone-700">{selectedFunctions.length} Deliverables</span>
                </div>
              </div>
            </div>
          </div>

          {/* PHOTO MANAGER / PRESETS FOR COVER */}
          <div className="p-8 bg-white rounded-3xl border border-stone-200 space-y-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">Couple Cover Settings</h3>
              <span className="text-xs text-stone-400 font-mono">Presets & Upload</span>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-24 h-24 shrink-0 rounded-2xl bg-stone-50 border border-stone-200 overflow-hidden relative group">
                {couplePhoto ? (
                  <>
                    <img src={couplePhoto} alt="Upload thumb" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setCouplePhoto('')}
                      className="absolute inset-0 bg-stone-900/85 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs text-red-400 font-bold font-mono"
                    >
                      Delete
                    </button>
                  </>
                ) : (
                  <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-2 hover:bg-stone-100 transition-colors">
                    <Upload className="w-5 h-5 text-stone-400" />
                    <span className="text-[9px] text-stone-500 text-center font-mono mt-1.5 font-bold">CHOOSE</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = async () => {
                            const originalBase64 = reader.result as string;
                            const compressed = await compressImage(originalBase64);
                            setCouplePhoto(compressed);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                )}
              </div>

              <div className="flex-1 space-y-3">
                <p className="text-xs text-stone-500 leading-relaxed">
                  Choose from our premium royal layout presets or upload a custom JPEG cover photo:
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {DEFAULT_COVERS.map((preset) => (
                    <button 
                      key={preset.name} 
                      type="button" 
                      onClick={() => setCouplePhoto(preset.url)} 
                      className={`relative h-10 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-amber-500/20 transition-all ${couplePhoto === preset.url ? 'ring-2 ring-amber-500' : 'border border-stone-200'}`}
                      title={preset.name}
                    >
                      <img src={preset.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-stone-600">Couple Cover URL Link</label>
              <input 
                type="text" 
                placeholder="Or paste direct high-resolution web URL..." 
                value={couplePhoto} 
                onChange={(e) => setCouplePhoto(e.target.value)} 
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 focus:outline-none focus:border-amber-500/50 font-mono" 
              />
            </div>
          </div>

          {/* DYNAMIC REGISTRY INFO */}
          <div className="p-6 bg-stone-50 rounded-3xl border border-stone-200 text-xs md:text-sm text-stone-500 leading-relaxed space-y-3 font-mono shadow-sm">
            <div className="flex items-center space-x-2 text-stone-700 text-xs md:text-sm font-bold font-sans uppercase">
              <Info className="w-4 h-4 text-stone-500 shrink-0" />
              <span>Cine-Registration Standard</span>
            </div>
            <p>
              Once registered, the project is live on <strong className="text-stone-800">Workflow Boards</strong>, <strong className="text-stone-800">Spreadsheets</strong>, and <strong className="text-stone-800">Calendars</strong>.
            </p>
            <p>
              Editors receive notifications immediately of their assigned sequences. Storage codes help track physical backups across backup locations instantly.
            </p>
          </div>
        </div>
      </form>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-50 max-w-md p-4 rounded-2xl border shadow-xl flex items-start space-x-3.5 backdrop-blur-md ${
              toast.type === 'error'
                ? 'bg-red-50/95 border-red-200 text-red-900'
                : 'bg-emerald-50/95 border-emerald-200 text-emerald-900'
            }`}
          >
            <div className={`p-1.5 rounded-xl ${
              toast.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
            }`}>
              {toast.type === 'error' ? (
                <AlertCircle className="w-5 h-5 shrink-0" />
              ) : (
                <Check className="w-5 h-5 shrink-0" />
              )}
            </div>
            
            <div className="flex-1 space-y-1">
              <h4 className="text-xs font-bold font-sans uppercase tracking-wider">
                {toast.type === 'error' ? 'Operation Error' : 'Success'}
              </h4>
              <p className="text-xs font-medium leading-relaxed font-mono opacity-90 break-words max-h-32 overflow-y-auto">
                {toast.message}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setToast(null)}
              className="p-1 rounded-lg hover:bg-black/5 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
