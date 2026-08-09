import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  Calendar, 
  User, 
  IndianRupee, 
  HardDrive, 
  Plus, 
  Trash2, 
  Edit,
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
  AlertCircle,
  FileText,
  Workflow,
  Lock,
  Compass,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Bookmark,
  Layers,
  Save,
  Copy,
  FolderPlus,
  Sliders,
  Eye,
  CheckSquare,
  Square
} from 'lucide-react';
import { Project, Studio, Editor, ProjectStatus, ProjectPriority, UserRole, ProjectTemplate } from '../types';

interface RegistryViewProps {
  studios: Studio[];
  editors: Editor[];
  projects: Project[];
  userRole: UserRole;
  currentStudioId?: string;
  onAddProject: (project: Omit<Project, 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateProject?: (id: string, updates: Partial<Project>) => Promise<void>;
  onDeleteProject?: (id: string) => Promise<void>;
  onRedirectToProjects: () => void;
}

const WORKFLOW_STAGES: { id: ProjectStatus; label: string; color: string; bg: string }[] = [
  { id: 'data_received', label: 'In Progress • Received', color: 'text-gold-300', bg: 'bg-gold-500/10 border border-gold-500/20 font-medium' },
  { id: 'assigned', label: 'In Progress • Assigned', color: 'text-gold-300', bg: 'bg-gold-500/10 border border-gold-500/20 font-medium' },
  { id: 'editing', label: 'Editing • Active', color: 'text-gold-400', bg: 'bg-gold-500/20 border border-gold-400/30 font-bold animate-pulse-slow' },
  { id: 'review', label: 'In Progress • Review', color: 'text-gold-300', bg: 'bg-gold-500/10 border border-gold-500/20 font-medium' },
  { id: 'revision', label: 'In Progress • Revision', color: 'text-gold-300', bg: 'bg-gold-500/10 border border-gold-500/20 font-medium' },
  { id: 'rendering', label: 'In Progress • Rendering', color: 'text-gold-300', bg: 'bg-gold-500/10 border border-gold-500/20 font-medium' },
  { id: 'delivered', label: 'Finished • Delivered', color: 'text-luxury-green-400', bg: 'bg-luxury-green-500/10 border border-luxury-green-500/20 font-bold' },
  { id: 'closed', label: 'Finished • Closed', color: 'text-luxury-green-500', bg: 'bg-luxury-green-950 border border-luxury-green-900/20 font-medium' }
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

const DEFAULT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'tpl-royal-wedding',
    name: 'Grand Royal Wedding Suite',
    description: 'Comprehensive luxury wedding film blueprint including multi-cam sync, Sangeet cut, trailer & 4K master grade.',
    eventType: 'Wedding Film',
    deliverables: ['Full Wedding Film', 'Short Film', 'Highlight', 'Reels', 'Sangeet', 'Pre-Wedding'],
    milestones: [
      'Footage Sync & Multi-cam Setup',
      'Audio Cleaning & Speech Enhancement',
      'Pre-Wedding & Sangeet Assembly Cut',
      'Teaser & 60-Sec Highlight Trailer',
      'Rough Cut / First Assembly Review',
      'Main Feature Film Editing Pass',
      'Cinematic Color Grading & 4K Master Export',
      'Sound Design & Foley Balancing',
      'Final Quality Control & Cloud Link Delivery'
    ],
    priority: 'high',
    defaultProjectAmount: 150000,
    defaultEditorPayment: 35000,
    notes: 'Luxury 4K Master Delivery. Includes 3 Instagram Reels, original raw files hard disk backup, and Google Drive download link.',
    isDefault: true
  },
  {
    id: 'tpl-pre-wedding',
    name: 'Cinematic Pre-Wedding Story',
    description: 'Romantic stylized story edit with custom music sync, warm color palette, and vertical social cuts.',
    eventType: 'Pre-Wedding Film',
    deliverables: ['Pre-Wedding', 'Reels', 'Short Film'],
    milestones: [
      'Song Selection & Audio Licensing',
      'Storyline & Pace Assembly Cut',
      'Warm Cinematic Color Grading',
      'Animated Titles & Typography Pass',
      '4K Master Render & Vertical Reels Cut'
    ],
    priority: 'medium',
    defaultProjectAmount: 45000,
    defaultEditorPayment: 12000,
    notes: 'Stylized warm cinematic look. Focus on song beat transitions and emotional storyline.',
    isDefault: true
  },
  {
    id: 'tpl-express-reels',
    name: 'Teaser & Reels Express Cut',
    description: 'Ultra fast-turnaround social media teaser package (48h delivery) with 3 vertical Instagram reels.',
    eventType: 'Cinematic Highlight',
    deliverables: ['Highlight', 'Reels'],
    milestones: [
      'Golden Moment Selection & Audio Sync',
      '60-Second Teaser Trailer Edit',
      '3x Vertical Reels (Entry, Vows, Dance)',
      'Fast Color Grade & Punchy Audio Mix',
      'Express Delivery Upload'
    ],
    priority: 'urgent',
    defaultProjectAmount: 25000,
    defaultEditorPayment: 7000,
    notes: 'Express turnaround within 48 hours of ceremony completion for rapid social sharing.',
    isDefault: true
  },
  {
    id: 'tpl-traditional-wedding',
    name: 'Classic Traditional Ceremony',
    description: 'Full ritual coverage with multi-microphone audio mastering and traditional highlight.',
    eventType: 'Wedding Film',
    deliverables: ['Full Wedding Film', 'Highlight'],
    milestones: [
      'Ceremony Sequence Multi-cam Sync',
      'Mantra & Speech Audio Enhancement',
      'Full Rituals Sequence Assembly',
      'Highlight Montage Cut',
      'Standard Color Balance',
      'Final Master Export'
    ],
    priority: 'medium',
    defaultProjectAmount: 85000,
    defaultEditorPayment: 20000,
    notes: 'Ensure all traditional rituals and key family members are given prominent screen time.',
    isDefault: true
  }
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
  onUpdateProject,
  onDeleteProject,
  onRedirectToProjects
}: RegistryViewProps) {
  // Form States
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectToDeleteId, setProjectToDeleteId] = useState<string | null>(null);
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

  // Toggle for advanced fields
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

  // Project Blueprint Templates State
  const [templates, setTemplates] = useState<ProjectTemplate[]>(() => {
    try {
      const saved = localStorage.getItem('theframecuts_project_templates');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const customOnly = parsed.filter((t: ProjectTemplate) => !t.isDefault);
          return [...DEFAULT_TEMPLATES, ...customOnly];
        }
      }
    } catch (err) {
      console.error('Failed to load project templates:', err);
    }
    return DEFAULT_TEMPLATES;
  });

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [showTemplateModal, setShowTemplateModal] = useState<boolean>(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState<boolean>(false);
  const [saveTemplateName, setSaveTemplateName] = useState<string>('');
  const [saveTemplateDesc, setSaveTemplateDesc] = useState<string>('');

  // Interactive Template Preview Modal State
  const [previewTemplate, setPreviewTemplate] = useState<ProjectTemplate | null>(null);
  const [previewMilestonesState, setPreviewMilestonesState] = useState<{ id: string; label: string; completed: boolean }[]>([]);

  const handleOpenPreviewTemplate = (tpl: ProjectTemplate) => {
    setPreviewTemplate(tpl);
    if (tpl.milestones && tpl.milestones.length > 0) {
      setPreviewMilestonesState(
        tpl.milestones.map((m, idx) => ({
          id: `prev-m-${idx}-${Date.now()}`,
          label: m,
          completed: false
        }))
      );
    } else {
      setPreviewMilestonesState([]);
    }
  };

  const togglePreviewMilestone = (id: string) => {
    setPreviewMilestonesState(prev =>
      prev.map(m => m.id === id ? { ...m, completed: !m.completed } : m)
    );
  };

  const applyTemplate = (template: ProjectTemplate) => {
    setEventType(template.eventType);
    
    // Ensure all deliverables exist in availableFunctions
    if (template.deliverables && template.deliverables.length > 0) {
      const newAvail = [...availableFunctions];
      template.deliverables.forEach((d) => {
        if (!newAvail.includes(d)) {
          newAvail.push(d);
        }
      });
      setAvailableFunctions(newAvail);
      setSelectedFunctions(template.deliverables);
    }

    if (template.milestones && template.milestones.length > 0) {
      setCustomMilestones(
        template.milestones.map((m, idx) => ({
          id: `milestone-${idx}-${Date.now()}`,
          label: m,
          completed: false
        }))
      );
    }

    if (template.priority) {
      setPriority(template.priority);
    }

    if (template.defaultProjectAmount !== undefined && template.defaultProjectAmount > 0) {
      setProjectAmount(template.defaultProjectAmount);
    }

    if (template.defaultEditorPayment !== undefined && template.defaultEditorPayment > 0) {
      setEditorPayment(template.defaultEditorPayment);
    }

    if (template.notes) {
      setNotes(template.notes);
    }

    setSelectedTemplateId(template.id);
    setShowTemplateModal(false);
    setToast({
      message: `✨ Applied Project Blueprint: "${template.name}"`,
      type: 'success'
    });
  };

  const handleSaveCurrentAsTemplate = () => {
    if (!saveTemplateName.trim()) {
      setToast({ message: 'Template Blueprint name is required.', type: 'error' });
      return;
    }

    const newTpl: ProjectTemplate = {
      id: `tpl-custom-${Date.now()}`,
      name: saveTemplateName.trim(),
      description: saveTemplateDesc.trim() || 'Custom saved studio project blueprint.',
      eventType: eventType || 'Wedding Film',
      deliverables: selectedFunctions.length > 0 ? selectedFunctions : [eventType],
      milestones: customMilestones.map(m => m.label),
      priority,
      defaultProjectAmount: projectAmount > 0 ? projectAmount : undefined,
      defaultEditorPayment: editorPayment > 0 ? editorPayment : undefined,
      notes: notes.trim() || undefined,
      isDefault: false,
      createdAt: new Date().toISOString()
    };

    const updatedTemplates = [...templates, newTpl];
    setTemplates(updatedTemplates);

    try {
      localStorage.setItem('theframecuts_project_templates', JSON.stringify(updatedTemplates));
    } catch (err) {
      console.error('Failed to save template to localStorage:', err);
    }

    setShowSaveTemplateModal(false);
    setSaveTemplateName('');
    setSaveTemplateDesc('');
    setSelectedTemplateId(newTpl.id);
    setToast({ message: `💾 Saved new Blueprint Template: "${newTpl.name}"`, type: 'success' });
  };

  const handleDeleteTemplate = (id: string) => {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    try {
      localStorage.setItem('theframecuts_project_templates', JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to update templates in localStorage:', err);
    }
    if (selectedTemplateId === id) setSelectedTemplateId('');
    setToast({ message: 'Blueprint template removed.', type: 'success' });
  };

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
      <div className="max-w-2xl mx-auto py-16 px-6 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-gold-500/10 blur-[120px] pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel rounded-[32px] p-8 md:p-12 text-center space-y-8 border-gold-500/20 shadow-2xl relative overflow-hidden"
        >
          {/* Subtle floral/geometric background watermark */}
          <div className="absolute inset-0 opacity-[0.01] pointer-events-none select-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='50' cy='50' r='40' fill='none' stroke='gold' stroke-width='0.5'/%3E%3C/svg%3E")` }} />

          <div className="w-20 h-20 bg-gold-500/10 text-gold-400 border border-gold-500/30 rounded-full flex items-center justify-center mx-auto text-3xl shadow-lg shadow-gold-500/5 gold-glow animate-pulse">
            <Check className="w-10 h-10" />
          </div>

          <div className="space-y-4">
            <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-gold-400 bg-gold-500/10 px-4 py-1.5 rounded-full border border-gold-500/25 uppercase inline-block">
              Royal Wedding Cataloged
            </span>
            <h2 className="text-3xl font-bold text-white tracking-tight font-display">Wedding Registered Successfully!</h2>
            <div className="inline-flex items-center space-x-2 bg-charcoal-900/80 px-4 py-1.5 rounded-xl border border-white/5">
              <span className="text-gray-500 text-xs font-mono uppercase">Project ID:</span>
              <span className="text-gold-300 font-bold font-mono tracking-wider">{registrationSuccess}</span>
            </div>
            <p className="text-gray-300 text-sm max-w-md mx-auto mt-2 leading-relaxed">
              The cinematic film parameters for <strong className="text-gold-400 font-semibold">{groomName} & {brideName}</strong> have been successfully committed to our secure cloud repository.
            </p>
          </div>

          <div className="p-6 bg-charcoal-900/60 rounded-2xl border border-white/5 max-w-md mx-auto grid grid-cols-2 gap-y-4 gap-x-6 text-left text-xs font-mono">
            <div>
              <span className="text-gray-500 block text-[9px] uppercase tracking-wider font-bold">Partner Studio</span>
              <span className="text-gray-200 font-semibold truncate block mt-1">{studios.find(s => s.id === studioId)?.name || 'Direct Client'}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[9px] uppercase tracking-wider font-bold">Lead Editor</span>
              <span className="text-gold-300 font-semibold truncate block mt-1">👤 {editors.find(e => e.id === assignedEditorId)?.name || 'Unassigned'}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[9px] uppercase tracking-wider font-bold">Shoot Date</span>
              <span className="text-gray-200 font-semibold block mt-1">📅 {shootDate}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[9px] uppercase tracking-wider font-bold">Delivery Deadline</span>
              <span className="text-red-400 font-semibold block mt-1">⏳ {deliveryDate}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 relative z-10">
            <button
              type="button"
              onClick={onRedirectToProjects}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-gold-600 to-gold-500 text-charcoal-950 font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] gold-glow uppercase tracking-wider"
            >
              View in Project List
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="w-full sm:w-auto px-8 py-3.5 bg-charcoal-800/80 hover:bg-charcoal-700 border border-white/10 text-gray-200 hover:text-white font-bold text-xs rounded-xl cursor-pointer transition-all duration-200 uppercase tracking-wider"
            >
              Register Another Wedding
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[32px] p-6 md:p-10 bg-charcoal-950/80 border border-white/10 shadow-2xl space-y-10 min-h-screen text-gray-200">
      {/* Texture noise pattern overlay */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
      
      {/* Ambient soft cinematic glowing backdrops */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-gold-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-luxury-green-900/10 blur-[150px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-gold-500/5 blur-[120px] pointer-events-none" />

      {/* Elegant minimalist line watermark in gold */}
      <div className="absolute right-12 top-14 opacity-[0.03] pointer-events-none select-none hidden lg:block">
        <svg width="180" height="180" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gold-400">
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
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/10 pb-8">
        <div>
          <div className="flex items-center space-x-2 text-gold-400 font-mono text-xs uppercase tracking-[0.2em] font-bold mb-2">
            <Film className="w-4 h-4 text-gold-400" />
            <span>Project Intake & Onboarding</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight font-display">
            Register New Wedding Project
          </h1>
          <p className="text-sm md:text-base text-gray-400 mt-2 max-w-xl font-medium leading-relaxed">
            Record client specifications, assign video editors, set hard drive locations, custom deliverables, and project financials.
          </p>
        </div>

        <button
          type="button"
          onClick={onRedirectToProjects}
          className="flex items-center space-x-2 px-5 py-3 bg-charcoal-900/60 hover:bg-charcoal-800/80 border border-white/10 text-gray-300 hover:text-white rounded-xl text-sm transition-all cursor-pointer font-semibold shadow-md hover:shadow-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </button>
      </div>

      {/* PROJECT TEMPLATE BLUEPRINTS BAR */}
      <div className="relative z-10 glass-panel p-5 rounded-2xl border border-gold-500/20 bg-gradient-to-r from-charcoal-900/90 via-charcoal-900/60 to-charcoal-950/90 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400 font-bold gold-glow">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider">
                  Project Templates & Blueprints
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-gold-500/15 text-gold-300 border border-gold-500/25">
                  {templates.length} Ready
                </span>
              </div>
              <p className="text-xs text-gray-400 font-mono mt-0.5">
                Load predefined deliverables, milestone workflows & pricing structures in 1-click.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowTemplateModal(true)}
              className="px-4 py-2.5 bg-gold-500/15 hover:bg-gold-500/25 border border-gold-500/30 text-gold-300 hover:text-white rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center space-x-2 shadow-md gold-glow"
            >
              <Sparkles className="w-4 h-4 text-gold-400" />
              <span>Browse Blueprint Library ({templates.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setShowSaveTemplateModal(true)}
              className="px-4 py-2.5 bg-charcoal-800/80 hover:bg-charcoal-700 border border-white/10 text-gray-300 hover:text-white rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center space-x-2 shadow-md"
            >
              <Bookmark className="w-4 h-4 text-gray-400" />
              <span>Save Form as Template</span>
            </button>
          </div>
        </div>

        {/* Quick Pills Selector */}
        <div className="pt-2 border-t border-white/5 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider font-semibold mr-1">
            ⚡ Quick Load:
          </span>
          {templates.map((tpl) => {
            const isSelected = selectedTemplateId === tpl.id;
            return (
              <div key={tpl.id} className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => applyTemplate(tpl)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center space-x-1.5 border cursor-pointer ${
                    isSelected
                      ? 'bg-gold-500 text-charcoal-950 border-gold-400 shadow-md gold-glow'
                      : 'bg-charcoal-900/80 hover:bg-charcoal-800 text-gray-300 hover:text-white border-white/10'
                  }`}
                >
                  <span>{tpl.name}</span>
                  {tpl.isDefault && (
                    <span className="text-[9px] opacity-75 font-normal">(Preset)</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenPreviewTemplate(tpl)}
                  title={`Preview "${tpl.name}" breakdown & milestones`}
                  className="p-1.5 rounded-xl bg-charcoal-900/80 hover:bg-gold-500/20 text-gray-400 hover:text-gold-300 border border-white/10 transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Validation Banner */}
      {validationError && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm flex items-center space-x-3 shadow-md"
        >
          <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
          <span className="font-semibold">{validationError}</span>
        </motion.div>
      )}

      {/* Main Single Page Layout */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10 relative z-10">
        
        {/* LEFT COLUMN: THE REGISTRATION FORM (7 Cols) */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* SECTION 1: COUPLE & EVENT CEREMONY */}
          <div className="glass-panel p-6 md:p-8 rounded-3xl border border-gold-500/15 space-y-6 shadow-xl transition-all hover:border-gold-500/25">
            <div className="flex items-center space-x-3 pb-3 border-b border-white/5">
              <span className="w-7 h-7 rounded-full bg-gold-500/15 text-gold-300 flex items-center justify-center text-xs font-bold font-mono border border-gold-500/25">1</span>
              <h3 className="text-sm md:text-base font-bold text-white uppercase tracking-wider font-display">Couple & Event Ceremony</h3>
            </div>

            <div className="space-y-6">
              {/* Couple Names Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-400 mb-2 font-mono uppercase tracking-wider">
                    Groom Name <span className="text-gold-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                    <input 
                      type="text" 
                      placeholder="Groom's Full Name" 
                      value={groomName} 
                      onChange={(e) => { setGroomName(e.target.value); setValidationError(''); }} 
                      className="w-full bg-charcoal-900/60 border border-white/10 hover:border-gold-500/20 focus:border-gold-500/50 rounded-xl pl-11 pr-4 py-3 text-sm md:text-base text-white placeholder-gray-600 focus:bg-charcoal-900 focus:outline-none transition-all" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-400 mb-2 font-mono uppercase tracking-wider">
                    Bride Name <span className="text-gold-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                    <input 
                      type="text" 
                      placeholder="Bride's Full Name" 
                      value={brideName} 
                      onChange={(e) => { setBrideName(e.target.value); setValidationError(''); }} 
                      className="w-full bg-charcoal-900/60 border border-white/10 hover:border-gold-500/20 focus:border-gold-500/50 rounded-xl pl-11 pr-4 py-3 text-sm md:text-base text-white placeholder-gray-600 focus:bg-charcoal-900 focus:outline-none transition-all" 
                    />
                  </div>
                </div>
              </div>

              {/* Project Film Title */}
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-400 mb-2 font-mono uppercase tracking-wider">
                  Project Wedding Film Title <span className="text-gold-400">*</span>
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. Rohan & Riya Destination Wedding Film" 
                  value={projectName} 
                  onChange={(e) => { setProjectName(e.target.value); setValidationError(''); }} 
                  className="w-full bg-charcoal-900/60 border border-white/10 hover:border-gold-500/20 focus:border-gold-500/50 rounded-xl px-4 py-3.5 text-sm md:text-base text-white placeholder-gray-600 focus:bg-charcoal-900 focus:outline-none transition-all" 
                />
              </div>

              {/* Ceremony Type & Studio Partner */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-400 mb-2 font-mono uppercase tracking-wider">
                    Ceremony Type
                  </label>
                  <select 
                    value={eventType} 
                    onChange={(e) => setEventType(e.target.value)} 
                    className="w-full bg-charcoal-900/60 border border-white/10 hover:border-gold-500/20 focus:border-gold-500/50 rounded-xl px-4 py-3 text-sm md:text-base text-gray-200 focus:bg-charcoal-900 focus:outline-none cursor-pointer transition-all"
                  >
                    <option value="Wedding Film" className="bg-charcoal-950">Wedding Film</option>
                    <option value="Pre-Wedding Film" className="bg-charcoal-950">Pre-Wedding Film</option>
                    <option value="Engagement Teaser" className="bg-charcoal-950">Engagement Teaser</option>
                    <option value="Sangeet Cut" className="bg-charcoal-950">Sangeet Cut</option>
                    <option value="Cinematic Highlight" className="bg-charcoal-950">Cinematic Highlight</option>
                    <option value="Anniversary special" className="bg-charcoal-950">Anniversary Special</option>
                    <option value="Commercial Event" className="bg-charcoal-950">Commercial Event</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-400 mb-2 font-mono uppercase tracking-wider">
                    Studio Partner
                  </label>
                  {userRole === 'studio' ? (
                    <div className="w-full bg-charcoal-900/40 border border-white/5 rounded-xl px-4 py-3.5 text-sm text-gray-400 font-medium">
                      {studios.find(s => s.id === studioId)?.name || 'Direct Client'}
                    </div>
                  ) : (
                    <select 
                      value={studioId} 
                      onChange={(e) => setStudioId(e.target.value)} 
                      className="w-full bg-charcoal-900/60 border border-white/10 hover:border-gold-500/20 focus:border-gold-500/50 rounded-xl px-4 py-3 text-sm md:text-base text-gray-200 focus:bg-charcoal-900 focus:outline-none cursor-pointer transition-all"
                    >
                      <option value="" className="bg-charcoal-950">Direct Client (No Studio)</option>
                      {studios.map(s => <option key={s.id} value={s.id} className="bg-charcoal-950">{s.name}</option>)}
                    </select>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: CREW, SCHEDULE & PRIORITY */}
          <div className="glass-panel p-6 md:p-8 rounded-3xl border border-gold-500/15 space-y-6 shadow-xl transition-all hover:border-gold-500/25">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/5 gap-3">
              <div className="flex items-center space-x-3">
                <span className="w-7 h-7 rounded-full bg-gold-500/15 text-gold-300 flex items-center justify-center text-xs font-bold font-mono border border-gold-500/25">2</span>
                <h3 className="text-sm md:text-base font-bold text-white uppercase tracking-wider font-display">Crew, Schedule & Priority</h3>
              </div>
              
              {/* Timeline Badge */}
              {shootDate && deliveryDate && (
                <div className="flex items-center space-x-2 bg-gold-500/10 border border-gold-500/20 rounded-xl px-3.5 py-1.5 text-xs font-mono text-gold-300 gold-glow">
                  <Clock className="w-3.5 h-3.5 text-gold-400 shrink-0" />
                  <span>
                    Window: <strong className="font-bold text-white">{daysDifference} Days</strong>
                  </span>
                  <span className="text-gold-500/30">|</span>
                  <span className={daysToDeadline !== null && daysToDeadline < 0 ? "text-red-400 font-bold" : "text-emerald-400 font-bold"}>
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

            {/* Timelines and Staffing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Side: Schedule */}
              <div className="space-y-5">
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-400 mb-2 font-mono uppercase tracking-wider">
                    Shoot/Ceremony Date <span className="text-gold-400">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500 pointer-events-none" />
                    <input 
                      type="date" 
                      value={shootDate} 
                      onChange={(e) => { setShootDate(e.target.value); setValidationError(''); }} 
                      onClick={(e) => { try { e.currentTarget.showPicker(); } catch (err) {} }}
                      className="w-full bg-charcoal-900/60 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm md:text-base text-white focus:outline-none focus:border-gold-500/50 cursor-pointer transition-colors" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-400 mb-2 font-mono uppercase tracking-wider">
                    Delivery Deadline <span className="text-gold-400">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500 pointer-events-none" />
                    <input 
                      type="date" 
                      value={deliveryDate} 
                      onChange={(e) => { setDeliveryDate(e.target.value); setValidationError(''); }} 
                      onClick={(e) => { try { e.currentTarget.showPicker(); } catch (err) {} }}
                      className="w-full bg-charcoal-900/60 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm md:text-base text-white focus:outline-none focus:border-gold-500/50 cursor-pointer transition-colors" 
                    />
                  </div>

                  {shootDate && (
                    <div className="flex flex-wrap gap-1.5 mt-3 justify-start">
                      <span className="text-[11px] font-mono text-gray-500 self-center mr-1">Quick offset:</span>
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
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all border ${
                              isSelected
                                ? "bg-gold-500/20 text-gold-300 border-gold-500/40 shadow-inner"
                                : "bg-charcoal-900/40 text-gray-400 border-white/5 hover:border-white/10 hover:text-white"
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
                  <label className="block text-xs md:text-sm font-semibold text-gray-400 mb-2 font-mono uppercase tracking-wider">
                    Lead Cinematic Editor
                  </label>
                  {userRole === 'studio' ? (
                    <div className="w-full bg-charcoal-900/40 border border-white/5 rounded-xl px-4 py-3.5 text-sm text-gray-400 font-medium">
                      👤 {editors.find(ed => ed.id === assignedEditorId)?.name || 'Unassigned'}
                    </div>
                  ) : (
                    <select 
                      value={assignedEditorId} 
                      onChange={(e) => setAssignedEditorId(e.target.value)} 
                      className="w-full bg-charcoal-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm md:text-base text-gray-200 focus:outline-none focus:border-gold-500/50 cursor-pointer transition-colors"
                    >
                      <option value="" className="bg-charcoal-950">Unassigned (Queue Pool)</option>
                      {editors.map(ed => (
                        <option key={ed.id} value={ed.id} className="bg-charcoal-950">
                          👤 {ed.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-400 mb-2 font-mono uppercase tracking-wider">
                    Workflow Stage
                  </label>
                  {userRole === 'studio' ? (
                    <div className="flex items-center space-x-2 bg-charcoal-900/40 border border-white/5 rounded-xl px-4 py-3.5 text-sm text-gray-200 font-semibold capitalize">
                      <span className="w-2.5 h-2.5 rounded-full bg-gold-500" />
                      <span>{WORKFLOW_STAGES.find(s => s.id === status)?.label || 'Data Received'}</span>
                    </div>
                  ) : (
                    <select 
                      value={status} 
                      onChange={(e) => setStatus(e.target.value as ProjectStatus)} 
                      className="w-full bg-charcoal-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm md:text-base text-gray-200 focus:outline-none focus:border-gold-500/50 cursor-pointer transition-colors"
                    >
                      {WORKFLOW_STAGES.map(s => (
                        <option key={s.id} value={s.id} className="bg-charcoal-950">
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
                        className="w-4 h-4 rounded border-white/10 text-gold-500 bg-charcoal-900 focus:ring-0 cursor-pointer focus:border-gold-500"
                      />
                      <span className="text-xs md:text-sm text-gray-300 font-semibold group-hover:text-white transition-colors">
                        Assign 2 Editors (Split Project)?
                      </span>
                    </label>

                    {isSplitProject && (
                      <div className="mt-3 p-4 bg-charcoal-900/80 rounded-2xl border border-white/5 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] text-gray-400 font-mono font-bold uppercase mb-1">Secondary Editor</label>
                            <select 
                              value={secondEditorId} 
                              onChange={(e) => setSecondEditorId(e.target.value)} 
                              className="w-full bg-charcoal-950 border border-white/10 rounded-lg px-3 py-2 text-xs md:text-sm text-white focus:outline-none cursor-pointer"
                            >
                              <option value="" className="bg-charcoal-950">Select Second Editor...</option>
                              {editors.filter(ed => ed.id !== assignedEditorId).map(ed => (
                                <option key={ed.id} value={ed.id} className="bg-charcoal-950">{ed.name}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] text-gray-400 font-mono font-bold uppercase mb-1">Payment Ratio</label>
                            <select 
                              value={splitPreset} 
                              onChange={(e) => setSplitPreset(e.target.value)} 
                              className="w-full bg-charcoal-950 border border-white/10 rounded-lg px-3 py-2 text-xs md:text-sm text-white focus:outline-none cursor-pointer"
                            >
                              <option value="50-50" className="bg-charcoal-950">Equal Split (50% / 50%)</option>
                              <option value="60-40" className="bg-charcoal-950">Primary (60%) / Secondary (40%)</option>
                              <option value="70-30" className="bg-charcoal-950">Primary (70%) / Secondary (30%)</option>
                              <option value="80-20" className="bg-charcoal-950">Primary (80%) / Secondary (20%)</option>
                              <option value="custom" className="bg-charcoal-950">Custom Split (Manual)</option>
                            </select>
                          </div>
                        </div>

                        <div className="p-3.5 bg-charcoal-950 rounded-xl border border-white/5 space-y-2 text-xs font-mono">
                          <div className="flex justify-between text-gray-400 font-semibold">
                            <span>Total Editor Share:</span>
                            <span className="text-gold-400 font-bold">₹{editorPayment.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5 text-gray-300">
                            <div>
                              <span className="font-semibold block text-[10px] text-gray-500 uppercase">Lead Share:</span>
                              {splitPreset === 'custom' ? (
                                <input 
                                  type="number"
                                  value={firstEditorShare}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setFirstEditorShare(val);
                                    setSecondEditorShare(Math.max(0, editorPayment - val));
                                  }}
                                  className="w-full bg-charcoal-900 border border-white/10 rounded px-2 py-1 mt-1 text-xs font-bold text-white focus:outline-none focus:border-gold-500"
                                />
                              ) : (
                                <strong className="block text-white text-sm mt-0.5">₹{firstEditorShare.toLocaleString('en-IN')}</strong>
                              )}
                            </div>
                            <div>
                              <span className="font-semibold block text-[10px] text-gray-500 uppercase">Secondary Share:</span>
                              {splitPreset === 'custom' ? (
                                <input 
                                  type="number"
                                  value={secondEditorShare}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setSecondEditorShare(val);
                                    setFirstEditorShare(Math.max(0, editorPayment - val));
                                  }}
                                  className="w-full bg-charcoal-900 border border-white/10 rounded px-2 py-1 mt-1 text-xs font-bold text-white focus:outline-none focus:border-gold-500"
                                />
                              ) : (
                                <strong className="block text-white text-sm mt-0.5">₹{secondEditorShare.toLocaleString('en-IN')}</strong>
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
            <div className="space-y-3 pt-4 border-t border-white/5">
              <span className="block text-xs md:text-sm font-semibold text-gray-400 font-mono uppercase tracking-wider">
                Queue Priority Assignment
              </span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {PRIORITIES.map((p) => {
                  const isActive = priority === p.id;
                  
                  let priorityStyles = {
                    border: "border-white/5 hover:border-white/10",
                    activeBg: "bg-gray-500/10 text-white border-gray-500/50 shadow-inner shadow-gray-500/10",
                    indicator: "bg-gray-400"
                  };
                  if (p.id === 'medium') {
                    priorityStyles = {
                      border: "border-white/5 hover:border-white/10",
                      activeBg: "bg-sky-500/15 text-sky-200 border-sky-500/40 shadow-inner shadow-sky-500/10",
                      indicator: "bg-sky-400"
                    };
                  } else if (p.id === 'high') {
                    priorityStyles = {
                      border: "border-white/5 hover:border-gold-500/20",
                      activeBg: "bg-gold-500/15 text-gold-300 border-gold-500/40 shadow-inner shadow-gold-500/10",
                      indicator: "bg-gold-400"
                    };
                  } else if (p.id === 'urgent') {
                    priorityStyles = {
                      border: "border-white/5 hover:border-red-500/20",
                      activeBg: "bg-red-500/15 text-red-300 border-red-500/40 shadow-inner shadow-red-500/10",
                      indicator: "bg-red-400 animate-pulse"
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
                      className={`p-4 rounded-2xl text-left transition-all duration-200 border flex flex-col justify-between h-24 cursor-pointer ${
                        isActive 
                          ? priorityStyles.activeBg
                          : `bg-charcoal-900/30 text-gray-400 ${priorityStyles.border}`
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs md:text-sm font-bold uppercase tracking-wider font-display">{p.label}</span>
                        <span className={`w-2.5 h-2.5 rounded-full ${isActive ? priorityStyles.indicator : 'bg-charcoal-800'}`} />
                      </div>
                      <span className="text-[10px] md:text-xs font-mono text-gray-500 leading-snug">
                        {getPriorityLabel(p.id)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SECTION 3: FINANCIAL LEDGER SHEET */}
          <div className="glass-panel p-6 md:p-8 rounded-3xl border border-gold-500/15 space-y-6 shadow-xl transition-all hover:border-gold-500/25">
            <div className="flex items-center space-x-3 pb-3 border-b border-white/5">
              <span className="w-7 h-7 rounded-full bg-gold-500/15 text-gold-300 flex items-center justify-center text-xs font-bold font-mono border border-gold-500/25">3</span>
              <h3 className="text-sm md:text-base font-bold text-white uppercase tracking-wider font-display">Ledger Sheet (Finance)</h3>
            </div>

            {userRole !== 'studio' ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 mb-2 uppercase tracking-wider">Total Contract ₹</label>
                    <input 
                      type="number" 
                      value={projectAmount || ''} 
                      onChange={(e) => setProjectAmount(Number(e.target.value))} 
                      className="w-full bg-charcoal-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs md:text-sm text-white font-medium focus:outline-none focus:border-gold-500/50 focus:bg-charcoal-900" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 mb-2 uppercase tracking-wider">Editor Comp ₹</label>
                    <input 
                      type="number" 
                      value={editorPayment || ''} 
                      onChange={(e) => setEditorPayment(Number(e.target.value))} 
                      className="w-full bg-charcoal-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs md:text-sm text-white font-medium focus:outline-none focus:border-gold-500/50 focus:bg-charcoal-900" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 mb-2 uppercase tracking-wider">Other Costs ₹</label>
                    <input 
                      type="number" 
                      value={otherExpenses || ''} 
                      onChange={(e) => setOtherExpenses(Number(e.target.value))} 
                      className="w-full bg-charcoal-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs md:text-sm text-white font-medium focus:outline-none focus:border-gold-500/50 focus:bg-charcoal-900" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 mb-2 uppercase tracking-wider">Advance Paid ₹</label>
                    <input 
                      type="number" 
                      value={advancePayment || ''} 
                      onChange={(e) => setAdvancePayment(Number(e.target.value))} 
                      className="w-full bg-charcoal-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs md:text-sm text-white font-medium focus:outline-none focus:border-gold-500/50 focus:bg-charcoal-900" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 p-5 bg-charcoal-900/60 rounded-2xl border border-white/5 text-sm font-mono relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gold-500/5 rounded-bl-full pointer-events-none" />
                  <div className="flex flex-col">
                    <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Collection Due</span>
                    <strong className="text-lg md:text-xl font-bold mt-1.5 text-gold-400">
                      ₹{calculatedRemainingBalance.toLocaleString('en-IN')}
                    </strong>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Est. Net Margin</span>
                    <strong className={`text-lg md:text-xl font-bold mt-1.5 ${estimatedProfitMargin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      ₹{estimatedProfitMargin.toLocaleString('en-IN')}
                    </strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5 bg-charcoal-900/40 border border-white/5 rounded-2xl text-xs md:text-sm font-mono text-gray-500 flex items-center space-x-2">
                <Lock className="w-4 h-4 shrink-0 text-gold-500/50" />
                <span>Budget & Finance metrics are encrypted and locked for non-administrative studio accounts.</span>
              </div>
            )}
          </div>

          {/* TOGGLE FOR ADVANCED CONFIGURATION */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full py-4 bg-charcoal-900/60 hover:bg-gold-500/10 border border-gold-500/10 hover:border-gold-500/30 text-gold-400 hover:text-gold-300 rounded-xl text-xs md:text-sm font-mono font-bold transition-all flex items-center justify-center space-x-2.5 cursor-pointer shadow-md gold-glow"
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
                <div className="glass-panel p-6 md:p-8 rounded-3xl border border-gold-500/15 space-y-5 shadow-xl">
                  <div className="flex items-center space-x-3 pb-3 border-b border-white/5">
                    <span className="w-7 h-7 rounded-full bg-gold-500/15 text-gold-300 flex items-center justify-center text-xs font-bold font-mono border border-gold-500/25">4</span>
                    <h3 className="text-sm md:text-base font-bold text-white uppercase tracking-wider font-display">Cinematic Deliverables</h3>
                  </div>

                  <span className="text-xs md:text-sm font-semibold text-gray-400 font-mono block mb-1">Select deliverables to produce:</span>
                  
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
                              ? 'bg-gold-500/15 border-gold-500/30 text-gold-200 font-bold shadow-md shadow-gold-500/5' 
                              : 'bg-charcoal-900/30 border-white/5 text-gray-400 hover:border-white/10 hover:text-white'
                          }`}
                        >
                          <span className="text-xs md:text-sm truncate font-medium">{func}</span>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] shrink-0 ml-1.5 ${isSelected ? 'bg-gold-500 border-gold-500 text-charcoal-950 font-bold' : 'border-gray-500'}`}>
                            {isSelected ? "✓" : "+"}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center bg-charcoal-900/40 rounded-xl border border-white/10 p-1.5 pl-4 focus-within:border-gold-500/40 transition-colors">
                    <input 
                      type="text" 
                      placeholder="Add customized deliverable..." 
                      value={customFunctionInput} 
                      onChange={(e) => setCustomFunctionInput(e.target.value)} 
                      className="flex-1 bg-transparent border-0 outline-none text-xs md:text-sm text-white py-1.5 placeholder-gray-600" 
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
                      className="px-4 py-2 bg-charcoal-800 hover:bg-gold-500 hover:text-charcoal-950 border border-white/10 hover:border-gold-500 text-gray-200 text-xs md:text-sm font-bold rounded-lg cursor-pointer transition-all shrink-0"
                    >
                      Add
                    </button>
                  </div>

                  <div className="pt-2">
                    <label className="block text-xs md:text-sm font-semibold text-gray-400 mb-2 font-mono uppercase tracking-wider">Special Directions / Production Notes</label>
                    <textarea 
                      rows={4}
                      placeholder="Enter client specifications, reference songs, video references, editing guidelines..." 
                      value={notes} 
                      onChange={(e) => setNotes(e.target.value)} 
                      className="w-full bg-charcoal-900/60 border border-white/10 rounded-xl px-4 py-3 text-xs md:text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-gold-500/50 focus:bg-charcoal-900 transition-all" 
                    />
                  </div>
                </div>

                {/* SECTION 5: CUSTOM MILESTONE ROADMAP */}
                <div className="glass-panel p-6 md:p-8 rounded-3xl border border-gold-500/15 space-y-5 shadow-xl">
                  <div className="flex items-center space-x-3 pb-3 border-b border-white/5">
                    <span className="w-7 h-7 rounded-full bg-gold-500/15 text-gold-300 flex items-center justify-center text-xs font-bold font-mono border border-gold-500/25">5</span>
                    <h3 className="text-sm md:text-base font-bold text-white uppercase tracking-wider font-display">Custom Milestone Checklist</h3>
                  </div>

                  <p className="text-xs text-gray-400 leading-relaxed font-mono">
                    Initialize customized tracking milestones for this wedding film. You can toggle initial stages, append custom steps, or prune unnecessary steps.
                  </p>

                  <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                    {customMilestones.map((m) => (
                      <div 
                        key={m.id} 
                        className="flex items-center justify-between p-3.5 px-4 rounded-xl border border-white/5 bg-charcoal-900/40 hover:bg-charcoal-900/60 transition-all text-xs md:text-sm text-white"
                      >
                        <div className="flex items-center space-x-3">
                          <input 
                            type="checkbox" 
                            checked={m.completed} 
                            onChange={() => {
                              setCustomMilestones(customMilestones.map(item => item.id === m.id ? { ...item, completed: !item.completed } : item));
                            }}
                            className="w-4 h-4 rounded border-white/10 text-gold-500 bg-charcoal-950 focus:ring-0 cursor-pointer focus:border-gold-500"
                          />
                          <span className={`${m.completed ? 'line-through text-gray-500 font-normal' : 'font-semibold text-gray-200'}`}>
                            {m.label}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setCustomMilestones(customMilestones.filter(item => item.id !== m.id));
                          }}
                          className="text-[11px] text-red-400 hover:text-red-300 font-semibold font-mono hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center bg-charcoal-900/40 rounded-xl border border-white/10 p-1.5 pl-4 focus-within:border-gold-500/40 transition-colors">
                    <input 
                      type="text" 
                      placeholder="Add custom milestone step (e.g. Pre-Teaser Approved)..." 
                      value={newMilestoneInput} 
                      onChange={(e) => setNewMilestoneInput(e.target.value)} 
                      className="flex-1 bg-transparent border-0 outline-none text-xs md:text-sm text-white py-1.5 placeholder-gray-600" 
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
                      className="px-4 py-2 bg-charcoal-800 hover:bg-gold-500 hover:text-charcoal-950 border border-white/10 hover:border-gold-500 text-gray-200 text-xs md:text-sm font-bold rounded-lg cursor-pointer transition-all shrink-0"
                    >
                      Add Step
                    </button>
                  </div>
                </div>

                {/* SECTION 6: PHYSICAL STORAGE & ASSET PATHS */}
                <div className="glass-panel p-6 md:p-8 rounded-3xl border border-gold-500/15 space-y-5 shadow-xl">
                  <div className="flex items-center space-x-3 pb-3 border-b border-white/5">
                    <span className="w-7 h-7 rounded-full bg-gold-500/15 text-gold-300 flex items-center justify-center text-xs font-bold font-mono border border-gold-500/25">6</span>
                    <h3 className="text-sm md:text-base font-bold text-white uppercase tracking-wider font-display">Physical Storage & Backup Specs</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-xs md:text-sm font-semibold text-gray-400 mb-2 font-mono uppercase tracking-wider">HDD Reference Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. WD BLACK 4TB - #08" 
                        value={hardDiskName} 
                        onChange={(e) => setHardDiskName(e.target.value)} 
                        className="w-full bg-charcoal-900/60 border border-white/10 rounded-xl px-4 py-3 text-xs md:text-sm text-white focus:outline-none focus:border-gold-500/50 focus:bg-charcoal-900" 
                      />
                    </div>

                    <div>
                      <label className="block text-xs md:text-sm font-semibold text-gray-400 mb-2 font-mono uppercase tracking-wider">Raw Footage Size</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 1.8 TB" 
                        value={dataSize} 
                        onChange={(e) => setDataSize(e.target.value)} 
                        className="w-full bg-charcoal-900/60 border border-white/10 rounded-xl px-4 py-3 text-xs md:text-sm text-white focus:outline-none focus:border-gold-500/50 focus:bg-charcoal-900" 
                      />
                    </div>

                    <div>
                      <label className="block text-xs md:text-sm font-semibold text-gray-400 mb-2 font-mono uppercase tracking-wider">Backup Status</label>
                      <select 
                        value={backupStatus} 
                        onChange={(e) => setBackupStatus(e.target.value as 'pending' | 'backed_up')} 
                        className="w-full bg-charcoal-900/60 border border-white/10 rounded-xl px-4 py-3 text-xs md:text-sm text-white focus:outline-none focus:border-gold-500/50 cursor-pointer"
                      >
                        <option value="pending" className="bg-charcoal-950">⏳ Pending Backup</option>
                        <option value="backed_up" className="bg-charcoal-950">✅ Backed Up Safely</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="block text-xs md:text-sm font-semibold text-gray-400 mb-2 font-mono uppercase tracking-wider">Google Drive Cloud Link</label>
                      <div className="relative">
                        <Link2 className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                        <input 
                          type="url" 
                          placeholder="https://drive.google.com/drive/folders/..." 
                          value={googleDriveLink} 
                          onChange={(e) => setGoogleDriveLink(e.target.value)} 
                          className="w-full bg-charcoal-900/60 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-xs md:text-sm text-white focus:outline-none focus:border-gold-500/50 focus:bg-charcoal-900 placeholder-gray-600" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 font-semibold mb-1.5 font-mono uppercase tracking-wider">Raw Folder Name</label>
                        <input 
                          type="text" 
                          placeholder="Raw_Footage" 
                          value={rawDataFolder} 
                          onChange={(e) => setRawDataFolder(e.target.value)} 
                          className="w-full bg-charcoal-900/60 border border-white/10 rounded-xl px-3 py-2 text-xs md:text-sm text-white focus:outline-none focus:border-gold-500/50" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 font-semibold mb-1.5 font-mono uppercase tracking-wider">Deliveries Folder</label>
                        <input 
                          type="text" 
                          placeholder="Edited_Deliverables" 
                          value={deliveryFolder} 
                          onChange={(e) => setDeliveryFolder(e.target.value)} 
                          className="w-full bg-charcoal-900/60 border border-white/10 rounded-xl px-3 py-2 text-xs md:text-sm text-white focus:outline-none focus:border-gold-500/50" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 font-semibold mb-1.5 font-mono uppercase tracking-wider">Final Archive Folder</label>
                        <input 
                          type="text" 
                          placeholder="Final_Project_Archives" 
                          value={finalExportFolder} 
                          onChange={(e) => setFinalExportFolder(e.target.value)} 
                          className="w-full bg-charcoal-900/60 border border-white/10 rounded-xl px-3 py-2 text-xs md:text-sm text-white focus:outline-none focus:border-gold-500/50" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* REGISTER ACTION TRIGGERS */}
          <div className="flex items-center justify-end space-x-4 pt-8 border-t border-white/10">
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-3.5 bg-charcoal-900/60 hover:bg-charcoal-800 border border-white/10 text-gray-300 hover:text-white rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer"
            >
              Reset Form
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3.5 bg-gradient-to-r from-gold-600 via-gold-500 to-gold-600 hover:from-gold-500 hover:to-gold-400 text-charcoal-950 font-bold text-xs md:text-sm rounded-xl shadow-md gold-glow hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all cursor-pointer flex items-center space-x-2.5 uppercase tracking-wider"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-charcoal-950 border-t-transparent rounded-full animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <Heart className="w-4.5 h-4.5 text-charcoal-950" />
                  <span>Register Wedding Project</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: INTERACTIVE PREVIEW & ASSETS (5 Cols) */}
        <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-8">
          
          {/* INTERACTIVE CINE-CARD PREVIEW */}
          <div className="glass-panel p-6 md:p-8 rounded-3xl border border-gold-500/15 space-y-5 shadow-xl transition-all hover:border-gold-500/25">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <span className="text-[10px] font-mono text-gold-300 bg-gold-500/10 px-3 py-1 rounded-full uppercase border border-gold-500/25 font-bold tracking-wider gold-glow">
                Live Spec Card Preview
              </span>
              <span className="text-[10px] text-gray-500 font-mono font-bold tracking-widest">THE FRAME CUT</span>
            </div>

            {/* Simulated interactive project card */}
            <div className="p-2.5 bg-charcoal-950/80 rounded-[28px] border border-gold-500/20 shadow-lg max-w-sm mx-auto w-full group overflow-hidden transition-all hover:border-gold-500/40">
              <div className="h-48 rounded-[22px] overflow-hidden relative">
                <img 
                  src={couplePhoto || DEFAULT_COVERS[0].url} 
                  alt="Live Preview" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950 via-charcoal-950/30 to-transparent" />
                
                {/* ID Badge */}
                <div className="absolute top-4 left-4 flex space-x-1.5">
                  <span className="text-[10px] font-mono px-2.5 py-1 bg-charcoal-950/95 text-gold-300 rounded border border-gold-500/10">
                    PRJ-2026-AUTO
                  </span>
                  <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded uppercase font-bold flex items-center ${
                    priority === 'urgent' ? 'bg-red-500/90 text-white' :
                    priority === 'high' ? 'bg-amber-500 text-charcoal-950 font-bold' :
                    priority === 'medium' ? 'bg-sky-500/90 text-white' : 'bg-gray-600 text-white'
                  }`}>
                    {priority}
                  </span>
                </div>

                <div className="absolute bottom-4 left-4">
                  <span className="text-[10px] font-mono px-2.5 py-1 bg-charcoal-950/90 text-gold-200 rounded uppercase font-bold border border-gold-500/10">
                    {WORKFLOW_STAGES.find(s => s.id === status)?.label || 'Data Received'}
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <h4 className="text-base font-bold text-white truncate leading-tight font-display">
                    {projectName.trim() || 'Couple Film Project Name'}
                  </h4>
                  <p className="text-xs text-gold-400 font-mono font-bold tracking-wider uppercase mt-1">
                    {(groomName.trim() || brideName.trim()) ? `💍 ${groomName || 'Groom'} & ${brideName || 'Bride'}` : 'Groom & Bride Names'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs text-gray-400 font-mono">
                  <div className="p-2.5 bg-charcoal-900/60 rounded-xl border border-white/5">
                    <span className="text-gray-500 text-[9px] block uppercase font-bold">Partner Studio</span>
                    <span className="text-gray-200 font-bold truncate block mt-0.5">
                      {studios.find(s => s.id === studioId)?.name || 'Direct Client'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-charcoal-900/60 rounded-xl border border-white/5">
                    <span className="text-gray-500 text-[9px] block uppercase font-bold">Lead Editor</span>
                    <span className="text-gray-200 font-bold truncate block mt-0.5">
                      {editors.find(e => e.id === assignedEditorId)?.name || 'Unassigned'}
                    </span>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-4 flex justify-between text-xs text-gray-400 font-mono">
                  <span className="flex items-center space-x-1.5">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="font-semibold text-gray-300">{deliveryDate || 'YYYY-MM-DD'}</span>
                  </span>
                  <span className="font-bold text-gold-400">{selectedFunctions.length} Deliverables</span>
                </div>
              </div>
            </div>
          </div>

          {/* PHOTO MANAGER / PRESETS FOR COVER */}
          <div className="glass-panel p-6 md:p-8 rounded-3xl border border-gold-500/15 space-y-5 shadow-xl transition-all hover:border-gold-500/25">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display">Couple Cover Settings</h3>
              <span className="text-xs text-gray-500 font-mono">Presets & Upload</span>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-24 h-24 shrink-0 rounded-2xl bg-charcoal-900 border border-white/10 overflow-hidden relative group">
                {couplePhoto ? (
                  <>
                    <img src={couplePhoto} alt="Upload thumb" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <button
                      type="button"
                      onClick={() => setCouplePhoto('')}
                      className="absolute inset-0 bg-charcoal-950/90 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs text-red-400 font-bold font-mono cursor-pointer"
                    >
                      Delete
                    </button>
                  </>
                ) : (
                  <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-2 hover:bg-charcoal-800 transition-colors">
                    <Upload className="w-5 h-5 text-gray-500" />
                    <span className="text-[9px] text-gray-400 text-center font-mono mt-1.5 font-bold">CHOOSE</span>
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
                <p className="text-xs text-gray-400 leading-relaxed font-mono">
                  Choose from our premium royal layout presets or upload a custom JPEG cover photo:
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {DEFAULT_COVERS.map((preset) => (
                    <button 
                      key={preset.name} 
                      type="button" 
                      onClick={() => setCouplePhoto(preset.url)} 
                      className={`relative h-10 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-gold-500/20 transition-all ${couplePhoto === preset.url ? 'ring-2 ring-gold-500' : 'border border-white/10'}`}
                      title={preset.name}
                    >
                      <img src={preset.url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-400 font-mono uppercase tracking-wider">Couple Cover URL Link</label>
              <input 
                type="text" 
                placeholder="Or paste direct high-resolution web URL..." 
                value={couplePhoto} 
                onChange={(e) => setCouplePhoto(e.target.value)} 
                className="w-full bg-charcoal-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-gold-500/50 font-mono placeholder-gray-600" 
              />
            </div>
          </div>

          {/* DYNAMIC REGISTRY INFO */}
          <div className="p-6 bg-charcoal-900/60 rounded-3xl border border-white/5 text-xs md:text-sm text-gray-400 leading-relaxed space-y-3 font-mono shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gold-500/[0.02] rounded-bl-full pointer-events-none" />
            <div className="flex items-center space-x-2 text-gold-300 text-xs md:text-sm font-bold font-sans uppercase">
              <Info className="w-4 h-4 text-gold-400 shrink-0" />
              <span>Cine-Registration Standard</span>
            </div>
            <p>
              Once registered, the project is live on <strong className="text-white">Workflow Boards</strong>, <strong className="text-white">Spreadsheets</strong>, and <strong className="text-white">Calendars</strong>.
            </p>
            <p>
              Editors receive notifications immediately of their assigned sequences. Storage codes help track physical backups across backup locations instantly.
            </p>
          </div>
        </div>
      </form>

      {/* RECENTLY REGISTERED PROJECTS LIST WITH EDIT & DELETE */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl border border-gold-500/15 space-y-6 shadow-xl mt-8">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h3 className="text-lg font-bold font-display text-white">Registered Wedding Projects</h3>
            <p className="text-xs text-gray-400 font-mono mt-0.5">Quickly edit or delete active registered project entries.</p>
          </div>
          <span className="text-xs font-mono font-bold bg-gold-500/15 text-gold-400 px-3 py-1 rounded-full border border-gold-500/20">
            {projects.length} Total Registered
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.slice(0, 6).map((proj) => (
            <div key={proj.id} className="p-4 bg-charcoal-900/80 rounded-2xl border border-white/10 flex flex-col justify-between space-y-3 hover:border-gold-500/30 transition-all">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono text-gold-400 font-bold">{proj.id}</span>
                  <h4 className="text-sm font-bold text-white font-display truncate">{proj.coupleName}</h4>
                  <p className="text-[11px] text-gray-400 font-mono mt-0.5">{proj.eventType || 'Wedding Film'}</p>
                </div>
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase bg-gold-500/10 text-gold-300 border border-gold-500/20">
                  {proj.status}
                </span>
              </div>

              <div className="text-xs font-mono text-gray-400 space-y-1 border-t border-white/5 pt-2">
                <div className="flex justify-between">
                  <span>Studio:</span>
                  <span className="text-gray-200 font-semibold">{proj.studioName || 'Direct'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery:</span>
                  <span className="text-gray-200 font-semibold">{proj.deliveryDate}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-white/5 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingProject(proj);
                    setProjectName(proj.coupleName || '');
                    setBrideName(proj.brideName || '');
                    setGroomName(proj.groomName || '');
                    setEventType(proj.eventType || 'Wedding Film');
                    setStudioId(proj.studioId || '');
                    setShootDate(proj.shootDate || '');
                    setDeliveryDate(proj.deliveryDate || '');
                    setAssignedEditorId(proj.assignedEditorId || '');
                    setStatus(proj.status || 'data_received');
                    setPriority(proj.priority || 'medium');
                    setCouplePhoto(proj.couplePhoto || '');
                    setNotes(proj.notes || '');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-3 py-1.5 rounded-lg bg-charcoal-800 hover:bg-gold-500/20 text-gold-300 text-xs font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => setProjectToDeleteId(proj.id)}
                  className="px-3 py-1.5 rounded-lg bg-charcoal-800 hover:bg-red-500/20 text-red-400 text-xs font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DELETE PROJECT CONFIRMATION MODAL */}
      {projectToDeleteId && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-charcoal-900 border border-red-500/30 rounded-3xl w-full max-w-md p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-display">Delete Wedding Project</h3>
              <p className="text-xs text-gray-400 font-mono mt-1">Are you sure you want to delete this wedding project entry? All associated deliverables and timeline records will be unlinked.</p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setProjectToDeleteId(null)}
                className="px-4 py-2 rounded-xl bg-charcoal-800 text-gray-300 hover:text-white text-xs font-mono font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (onDeleteProject && projectToDeleteId) {
                    await onDeleteProject(projectToDeleteId);
                    setToast({ message: 'Project record deleted successfully.', type: 'success' });
                  }
                  setProjectToDeleteId(null);
                }}
                className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-xs font-mono shadow-lg cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BROWSE TEMPLATE BLUEPRINTS MODAL */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 md:p-6 overflow-y-auto">
          <div className="bg-charcoal-900 border border-gold-500/25 rounded-3xl w-full max-w-4xl p-6 md:p-8 space-y-6 shadow-2xl relative my-auto max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400 font-bold gold-glow">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white font-display">Project Blueprint Templates Library</h3>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">Select a blueprint to load milestones, deliverables, priority & financial presets instantly.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="p-2 rounded-xl bg-charcoal-800 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 pr-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((tpl) => {
                const isSelected = selectedTemplateId === tpl.id;
                return (
                  <div
                    key={tpl.id}
                    className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 transition-all ${
                      isSelected
                        ? 'bg-gold-500/[0.08] border-gold-500/50 shadow-lg gold-glow'
                        : 'bg-charcoal-800/60 border-white/10 hover:border-gold-500/30'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gold-400 block">
                            {tpl.eventType}
                          </span>
                          <h4 className="text-base font-bold text-white font-display mt-0.5">{tpl.name}</h4>
                        </div>
                        <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full uppercase border ${
                          tpl.isDefault
                            ? 'bg-gold-500/15 text-gold-300 border-gold-500/30'
                            : 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                        }`}>
                          {tpl.isDefault ? 'Preset Blueprint' : 'Custom Saved'}
                        </span>
                      </div>

                      {tpl.description && (
                        <p className="text-xs text-gray-300 font-mono leading-relaxed">
                          {tpl.description}
                        </p>
                      )}

                      {/* Deliverables tags */}
                      {tpl.deliverables && tpl.deliverables.length > 0 && (
                        <div className="space-y-1 pt-1">
                          <span className="text-[10px] font-mono uppercase text-gray-400 font-bold block">Deliverables Package:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {tpl.deliverables.map((del, dIdx) => (
                              <span key={dIdx} className="text-[10px] font-mono px-2 py-0.5 rounded bg-charcoal-900 border border-white/10 text-gray-200">
                                {del}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Milestones count */}
                      {tpl.milestones && tpl.milestones.length > 0 && (
                        <div className="space-y-1 pt-1">
                          <span className="text-[10px] font-mono uppercase text-gray-400 font-bold flex items-center justify-between">
                            <span>Workflow Milestones ({tpl.milestones.length}):</span>
                            <span className="text-gold-400 font-bold uppercase">{tpl.priority} Priority</span>
                          </span>
                          <div className="p-2.5 bg-charcoal-900/80 rounded-xl border border-white/5 text-[11px] font-mono text-gray-400 space-y-1 max-h-24 overflow-y-auto">
                            {tpl.milestones.map((m, mIdx) => (
                              <div key={mIdx} className="flex items-center space-x-1.5 truncate">
                                <span className="text-gold-400 font-bold">•</span>
                                <span className="truncate">{m}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Amounts if present */}
                      {(tpl.defaultProjectAmount || tpl.defaultEditorPayment) && (
                        <div className="flex items-center space-x-4 text-xs font-mono pt-1 text-gray-300">
                          {tpl.defaultProjectAmount && (
                            <div>
                              <span className="text-[9px] uppercase text-gray-400 font-bold block">Client Budget:</span>
                              <span className="text-gold-300 font-bold">₹{tpl.defaultProjectAmount.toLocaleString('en-IN')}</span>
                            </div>
                          )}
                          {tpl.defaultEditorPayment && (
                            <div>
                              <span className="text-[9px] uppercase text-gray-400 font-bold block">Editor Budget:</span>
                              <span className="text-emerald-400 font-bold">₹{tpl.defaultEditorPayment.toLocaleString('en-IN')}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-white/10 pt-3 gap-2 shrink-0">
                      {!tpl.isDefault && (
                        <button
                          type="button"
                          onClick={() => handleDeleteTemplate(tpl.id)}
                          className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-mono font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      )}
                      
                      <div className="flex items-center space-x-2 ml-auto">
                        <button
                          type="button"
                          onClick={() => handleOpenPreviewTemplate(tpl)}
                          className="px-3 py-2 rounded-xl bg-charcoal-900 hover:bg-charcoal-800 border border-white/10 text-gray-300 hover:text-white text-xs font-mono font-bold flex items-center space-x-1.5 cursor-pointer transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-gold-400" />
                          <span>Preview Breakdown</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => applyTemplate(tpl)}
                          className={`px-4 py-2 rounded-xl font-mono text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-md ${
                            isSelected
                              ? 'bg-gold-500 text-charcoal-950 hover:bg-gold-400 gold-glow'
                              : 'bg-gold-500/20 hover:bg-gold-500/30 text-gold-300 hover:text-white border border-gold-500/30'
                          }`}
                        >
                          <Check className="w-4 h-4" />
                          <span>{isSelected ? 'Applied' : 'Apply Blueprint'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-white/10 pt-4 flex justify-between items-center shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowTemplateModal(false);
                  setShowSaveTemplateModal(true);
                }}
                className="px-4 py-2 bg-charcoal-800 hover:bg-charcoal-700 text-gold-300 border border-gold-500/20 rounded-xl text-xs font-mono font-bold flex items-center space-x-2 cursor-pointer transition-colors"
              >
                <Bookmark className="w-4 h-4" />
                <span>Save Current Form Setup as Blueprint</span>
              </button>

              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="px-5 py-2 bg-charcoal-800 hover:bg-charcoal-700 text-white rounded-xl text-xs font-mono font-bold cursor-pointer"
              >
                Close Library
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SAVE CURRENT FORM AS TEMPLATE MODAL */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-charcoal-900 border border-gold-500/30 rounded-3xl w-full max-w-lg p-6 md:p-8 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400 font-bold gold-glow">
                  <Bookmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-display">Save Project Blueprint</h3>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">Save current form structure as a reusable studio template.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSaveTemplateModal(false)}
                className="p-2 rounded-xl bg-charcoal-800 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-gray-300 font-mono uppercase tracking-wider mb-2">
                  Blueprint Template Name <span className="text-gold-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Royal Destination Pre-Wedding Suite"
                  value={saveTemplateName}
                  onChange={(e) => setSaveTemplateName(e.target.value)}
                  className="w-full bg-charcoal-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gold-500/50 font-mono placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 font-mono uppercase tracking-wider mb-2">
                  Blueprint Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Short summary of deliverables, milestone stages or special specs..."
                  value={saveTemplateDesc}
                  onChange={(e) => setSaveTemplateDesc(e.target.value)}
                  className="w-full bg-charcoal-800 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-gold-500/50 font-mono placeholder-gray-500"
                />
              </div>

              <div className="p-4 bg-charcoal-800/80 rounded-2xl border border-white/5 space-y-2 text-xs font-mono text-gray-300">
                <span className="text-[10px] uppercase font-bold text-gold-400 tracking-wider block">
                  Captured Blueprint Parameters:
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-gray-500">Event Type:</span> <strong className="text-white">{eventType || 'Wedding Film'}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500">Priority:</span> <strong className="text-white uppercase">{priority}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500">Deliverables:</span> <strong className="text-gold-300">{selectedFunctions.length} Functions</strong>
                  </div>
                  <div>
                    <span className="text-gray-500">Milestones:</span> <strong className="text-gold-300">{customMilestones.length} Steps</strong>
                  </div>
                  {projectAmount > 0 && (
                    <div>
                      <span className="text-gray-500">Client Amt:</span> <strong className="text-emerald-400">₹{projectAmount.toLocaleString('en-IN')}</strong>
                    </div>
                  )}
                  {editorPayment > 0 && (
                    <div>
                      <span className="text-gray-500">Editor Pay:</span> <strong className="text-emerald-400">₹{editorPayment.toLocaleString('en-IN')}</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={() => setShowSaveTemplateModal(false)}
                className="px-4 py-2.5 bg-charcoal-800 text-gray-300 hover:text-white rounded-xl text-xs font-mono font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCurrentAsTemplate}
                className="px-5 py-2.5 bg-gold-500 hover:bg-gold-400 text-charcoal-950 font-bold rounded-xl text-xs font-mono shadow-lg gold-glow cursor-pointer flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Blueprint Template</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INTERACTIVE TEMPLATE PREVIEW MODAL */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 md:p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-charcoal-900 border border-gold-500/30 rounded-3xl w-full max-w-2xl p-6 md:p-8 space-y-6 shadow-2xl relative my-auto max-h-[90vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-4 shrink-0">
              <div className="flex items-center space-x-3.5">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-gold-500/20 to-amber-600/20 border border-gold-500/40 flex items-center justify-center text-gold-400 font-bold gold-glow">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gold-400">
                      {previewTemplate.eventType} Blueprint Preview
                    </span>
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase border ${
                      previewTemplate.isDefault
                        ? 'bg-gold-500/15 text-gold-300 border-gold-500/30'
                        : 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                    }`}>
                      {previewTemplate.isDefault ? 'Preset Blueprint' : 'Custom Blueprint'}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white font-display mt-0.5">
                    {previewTemplate.name}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPreviewTemplate(null)}
                className="p-2 rounded-xl bg-charcoal-800 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description if present */}
            {previewTemplate.description && (
              <p className="text-xs text-gray-300 font-mono leading-relaxed bg-charcoal-950/60 p-3.5 rounded-2xl border border-white/5">
                {previewTemplate.description}
              </p>
            )}

            {/* Scrollable Main Content */}
            <div className="overflow-y-auto flex-1 space-y-6 pr-1">
              
              {/* SECTION 1: MILESTONES & WORKFLOW STAGES BREAKDOWN */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono font-bold uppercase text-gold-400 tracking-wider flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-gold-400" />
                    <span>Workflow Milestones ({previewMilestonesState.length})</span>
                  </h4>
                  {previewMilestonesState.length > 0 && (
                    <span className="text-[11px] font-mono text-gray-400 font-bold">
                      {previewMilestonesState.filter(m => m.completed).length} / {previewMilestonesState.length} Completed
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                {previewMilestonesState.length > 0 && (
                  <div className="w-full h-1.5 bg-charcoal-950 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className="h-full bg-gradient-to-r from-gold-500 to-amber-400 transition-all duration-300"
                      style={{ 
                        width: `${Math.round((previewMilestonesState.filter(m => m.completed).length / previewMilestonesState.length) * 100)}%` 
                      }}
                    />
                  </div>
                )}

                <div className="space-y-2 p-3.5 bg-charcoal-950/80 rounded-2xl border border-white/10">
                  {previewMilestonesState.length === 0 ? (
                    <p className="text-xs text-gray-500 italic font-mono">No specific milestones defined in this template.</p>
                  ) : (
                    previewMilestonesState.map((m, idx) => (
                      <div
                        key={m.id}
                        onClick={() => togglePreviewMilestone(m.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between space-x-3 ${
                          m.completed 
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                            : 'bg-charcoal-900 hover:bg-charcoal-800 border-white/5 text-gray-200'
                        }`}
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <span className={`w-6 h-6 rounded-lg text-xs font-mono font-bold flex items-center justify-center shrink-0 ${
                            m.completed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-charcoal-800 text-gold-400 border border-gold-500/20'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className={`text-xs font-mono font-medium truncate ${m.completed ? 'line-through opacity-70' : ''}`}>
                            {m.label}
                          </span>
                        </div>

                        <div className="shrink-0 flex items-center text-xs font-mono font-bold">
                          {m.completed ? (
                            <span className="text-emerald-400 flex items-center space-x-1">
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="hidden sm:inline">Completed</span>
                            </span>
                          ) : (
                            <span className="text-gray-500 hover:text-gold-300 flex items-center space-x-1">
                              <Square className="w-4 h-4" />
                              <span className="hidden sm:inline">Pending</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* SECTION 2: DELIVERABLES PACKAGE */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-mono font-bold uppercase text-gold-400 tracking-wider flex items-center space-x-2">
                  <Film className="w-4 h-4 text-gold-400" />
                  <span>Deliverables Package ({previewTemplate.deliverables?.length || 0})</span>
                </h4>

                <div className="flex flex-wrap gap-2 p-3.5 bg-charcoal-950/80 rounded-2xl border border-white/10">
                  {(!previewTemplate.deliverables || previewTemplate.deliverables.length === 0) ? (
                    <span className="text-xs text-gray-500 italic font-mono">No specific deliverables list defined.</span>
                  ) : (
                    previewTemplate.deliverables.map((del, dIdx) => (
                      <span
                        key={dIdx}
                        className="text-xs font-mono px-3 py-1.5 rounded-xl bg-charcoal-900 border border-gold-500/20 text-gold-200 flex items-center space-x-1.5 shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5 text-gold-400" />
                        <span>{del}</span>
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* SECTION 3: FINANCIAL PRESETS & PRIORITY */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-3.5 bg-charcoal-950/80 rounded-2xl border border-white/10 space-y-1">
                  <span className="text-[10px] uppercase text-gray-400 font-bold block">Client Budget Preset</span>
                  <strong className="text-sm text-gold-300 font-bold block">
                    {previewTemplate.defaultProjectAmount ? `₹${previewTemplate.defaultProjectAmount.toLocaleString('en-IN')}` : 'Not Specified'}
                  </strong>
                </div>

                <div className="p-3.5 bg-charcoal-950/80 rounded-2xl border border-white/10 space-y-1">
                  <span className="text-[10px] uppercase text-gray-400 font-bold block">Editor Wage Preset</span>
                  <strong className="text-sm text-emerald-400 font-bold block">
                    {previewTemplate.defaultEditorPayment ? `₹${previewTemplate.defaultEditorPayment.toLocaleString('en-IN')}` : 'Not Specified'}
                  </strong>
                </div>

                <div className="p-3.5 bg-charcoal-950/80 rounded-2xl border border-white/10 space-y-1">
                  <span className="text-[10px] uppercase text-gray-400 font-bold block">Priority Rating</span>
                  <strong className="text-sm text-amber-400 font-bold uppercase block">
                    {previewTemplate.priority || 'Medium'}
                  </strong>
                </div>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="border-t border-white/10 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setPreviewTemplate(null)}
                className="w-full sm:w-auto px-5 py-2.5 bg-charcoal-800 hover:bg-charcoal-700 text-gray-300 hover:text-white rounded-xl text-xs font-mono font-bold cursor-pointer transition-colors"
              >
                Close Preview
              </button>

              <button
                type="button"
                onClick={() => applyTemplate(previewTemplate)}
                className="w-full sm:w-auto px-6 py-2.5 bg-gold-500 hover:bg-gold-400 text-charcoal-950 font-bold text-xs font-mono rounded-xl shadow-lg gold-glow cursor-pointer transition-all flex items-center justify-center space-x-2"
              >
                <Check className="w-4 h-4" />
                <span>Apply Blueprint to Registry Form</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-50 max-w-md p-4 rounded-2xl border shadow-2xl flex items-start space-x-3.5 backdrop-blur-md ${
              toast.type === 'error'
                ? 'bg-red-950/95 border-red-500/30 text-red-200'
                : 'bg-charcoal-900/95 border-emerald-500/30 text-emerald-200'
            }`}
          >
            <div className={`p-1.5 rounded-xl ${
              toast.type === 'error' ? 'bg-red-900/50 text-red-400' : 'bg-emerald-900/50 text-emerald-400 animate-pulse'
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
              className="p-1 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
