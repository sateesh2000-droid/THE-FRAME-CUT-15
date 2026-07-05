import React, { useState, useMemo, useEffect } from 'react';
import { 
  Film, 
  Grid, 
  List, 
  Plus, 
  Search, 
  SlidersHorizontal, 
  Clock, 
  User, 
  Calendar as CalendarIcon, 
  IndianRupee, 
  HardDrive, 
  Trash2, 
  Edit, 
  CheckCircle2, 
  FileEdit,
  ExternalLink,
  ChevronRight,
  Info,
  Sparkles,
  AlertTriangle,
  FolderOpen,
  Eye,
  CheckCircle,
  PlusCircle,
  X,
  Music,
  Smartphone,
  Video,
  Clapperboard,
  Check,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Percent,
  Coins,
  TrendingUp,
  Sliders,
  CheckSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SwipeableCard from './SwipeableCard';
import { Project, Studio, Editor, ProjectStatus, ProjectPriority, Revision, UserRole } from '../types';
import { useDebounce } from '../hooks/useDebounce';

interface ProjectsViewProps {
  projects: Project[];
  studios: Studio[];
  editors: Editor[];
  revisions: Revision[];
  userRole: UserRole;
  currentStudioId?: string;
  onAddProject: (project: Omit<Project, 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
  onAddRevision: (revision: Omit<Revision, 'id' | 'createdAt'>) => Promise<void>;
  onResolveRevision: (revId: string) => Promise<void>;
  onDeleteRevision?: (revId: string) => Promise<void>;
  onRedirectToRegistry?: () => void;
  initialTriggerAction?: string;
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

const ProjectsView = React.memo(function ProjectsView({
  projects,
  studios,
  editors,
  revisions,
  userRole,
  currentStudioId,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  onAddRevision,
  onResolveRevision,
  onDeleteRevision,
  onRedirectToRegistry,
  initialTriggerAction
}: ProjectsViewProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'kanban'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [studioFilter, setStudioFilter] = useState<string>('all');
  
  // Selected project for details drawer
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [newDetailMilestone, setNewDetailMilestone] = useState('');
  
  // Create / Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(initialTriggerAction === 'add_project');
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  // Modal Navigation Tab
  const [modalActiveTab, setModalActiveTab] = useState<'specs' | 'deliverables' | 'finance'>('specs');
  const [modalValidationError, setModalValidationError] = useState<string>('');

  // Default Wedding Milestones list matching RegistryView
  const DEFAULT_MILESTONES = [
    'Footage Sync & Multi-cam Setup',
    'Song Selection & Audio Sync',
    'Rough Cut / First Cut montage',
    'Main Highlight Draft Completed',
    'Cinematic Color Grading Pass',
    'Sound Design & Foley Balance',
    'Final Quality Check & Cloud Upload'
  ];

  // Custom Milestones in Form Modal
  const [modalCustomMilestones, setModalCustomMilestones] = useState<{ id: string; label: string; completed: boolean; completedAt?: string }[]>([]);
  const [newModalMilestoneInput, setNewModalMilestoneInput] = useState('');
  
  // Form states
  const [projectName, setProjectName] = useState('');
  const [brideName, setBrideName] = useState('');
  const [groomName, setGroomName] = useState('');
  const [eventType, setEventType] = useState('Wedding Film');
  
  // Wedding Functions Multi-select Checklist States
  const DEFAULT_FUNCTIONS = ['Full Wedding Film', 'Short Film', 'Highlight', 'Reels', 'Sangeet', 'Pre-Wedding', 'Others'];
  const [availableFunctions, setAvailableFunctions] = useState<string[]>(DEFAULT_FUNCTIONS);
  const [selectedFunctions, setSelectedFunctions] = useState<string[]>([]);
  const [customFunctionInput, setCustomFunctionInput] = useState('');

  const [studioId, setStudioId] = useState('');
  const [shootDate, setShootDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [assignedEditorId, setAssignedEditorId] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('data_received');
  const [priority, setPriority] = useState<ProjectPriority>('medium');
  const [projectAmount, setProjectAmount] = useState(0);
  const [editorPayment, setEditorPayment] = useState(0);
  const [isSplitProject, setIsSplitProject] = useState(false);
  const [secondEditorId, setSecondEditorId] = useState('');
  const [firstEditorShare, setFirstEditorShare] = useState(0);
  const [secondEditorShare, setSecondEditorShare] = useState(0);
  const [splitPreset, setSplitPreset] = useState('50-50'); // '50-50', '60-40', '70-30', '80-20', 'custom'
  const [otherExpenses, setOtherExpenses] = useState(0);
  const [advancePayment, setAdvancePayment] = useState(0);
  const [couplePhoto, setCouplePhoto] = useState('');
  const [notes, setNotes] = useState('');

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
  
  // Data backup fields
  const [hardDiskName, setHardDiskName] = useState('');
  const [dataSize, setDataSize] = useState('');
  const [backupStatus, setBackupStatus] = useState<'pending' | 'backed_up'>('pending');
  const [googleDriveLink, setGoogleDriveLink] = useState('');
  const [rawDataFolder, setRawDataFolder] = useState('');
  const [deliveryFolder, setDeliveryFolder] = useState('');
  const [finalExportFolder, setFinalExportFolder] = useState('');

  // Add Revision helper form state
  const [isAddingRevision, setIsAddingRevision] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');

  // Hover zoom preview state
  const [hoveredPhoto, setHoveredPhoto] = useState<{ url: string; title: string; subtitle: string } | null>(null);

  // Custom confirmation modal states
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [confirmDeleteText, setConfirmDeleteText] = useState('');
  const [revisionToDeleteId, setRevisionToDeleteId] = useState<string | null>(null);

  // Compute stats for header summary
  const summaryStats = useMemo(() => {
    const active = projects.filter(p => p.status !== 'closed' && p.status !== 'delivered');
    const openRevisions = revisions.filter(r => r.status === 'pending').length;
    const urgent = projects.filter(p => p.priority === 'urgent' && p.status !== 'closed' && p.status !== 'delivered');
    const totalDue = projects
      .filter(p => p.status !== 'closed')
      .reduce((acc, p) => acc + (p.remainingBalance || 0), 0);

    return {
      activeCount: active.length,
      revisionCount: openRevisions,
      urgentCount: urgent.length,
      pendingCollection: totalDue
    };
  }, [projects, revisions]);

  // Setup / reset form fields
  const openCreateModal = () => {
    if (onRedirectToRegistry) {
      onRedirectToRegistry();
      return;
    }
    setEditingProject(null);
    setProjectName('');
    setBrideName('');
    setGroomName('');
    setEventType('Wedding Film');
    
    // reset wedding functions
    setAvailableFunctions(DEFAULT_FUNCTIONS);
    setSelectedFunctions(['Full Wedding Film']);
    setCustomFunctionInput('');

    setStudioId(userRole === 'studio' && currentStudioId ? currentStudioId : (studios[0]?.id || ''));
    setShootDate('');
    setDeliveryDate('');
    setAssignedEditorId(editors[0]?.id || '');
    setStatus('data_received');
    setPriority('medium');
    setProjectAmount(0);
    setEditorPayment(0);
    setIsSplitProject(false);
    setSecondEditorId('');
    setFirstEditorShare(0);
    setSecondEditorShare(0);
    setSplitPreset('50-50');
    setOtherExpenses(0);
    setAdvancePayment(0);
    setCouplePhoto(DEFAULT_COVERS[0].url);
    setNotes('');
    
    // reset backup
    setHardDiskName('');
    setDataSize('');
    setBackupStatus('pending');
    setGoogleDriveLink('');
    setRawDataFolder('');
    setDeliveryFolder('');
    setFinalExportFolder('');

    // reset milestones
    setModalCustomMilestones(
      DEFAULT_MILESTONES.map((m, idx) => ({
        id: `milestone-${idx}-${Date.now()}`,
        label: m,
        completed: false
      }))
    );
    setNewModalMilestoneInput('');
    
    setModalActiveTab('specs');
    setModalValidationError('');
    setIsModalOpen(true);
  };

  const openEditModal = (proj: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProject(proj);
    setProjectName(proj.projectName || '');
    setBrideName(proj.brideName);
    setGroomName(proj.groomName);
    setEventType(proj.eventType);
    
    // parse selected wedding functions
    const parsedFunctions = proj.eventType ? proj.eventType.split(', ').map(f => f.trim()).filter(Boolean) : [];
    setSelectedFunctions(parsedFunctions);
    
    const updatedAvailable = [...DEFAULT_FUNCTIONS];
    parsedFunctions.forEach(f => {
      if (!updatedAvailable.includes(f)) {
        updatedAvailable.push(f);
      }
    });
    setAvailableFunctions(updatedAvailable);
    setCustomFunctionInput('');

    setStudioId(proj.studioId);
    setShootDate(proj.shootDate);
    setDeliveryDate(proj.deliveryDate);
    setAssignedEditorId(proj.assignedEditorId || '');
    setStatus(proj.status);
    setPriority(proj.priority);
    setProjectAmount(proj.projectAmount);
    setEditorPayment(proj.editorPayment);
    setIsSplitProject(proj.isSplitProject || false);
    setSecondEditorId(proj.secondEditorId || '');
    setFirstEditorShare(proj.firstEditorShare || 0);
    setSecondEditorShare(proj.secondEditorShare || 0);
    if (proj.isSplitProject && proj.editorPayment > 0) {
      const p1 = Math.round((proj.firstEditorShare || 0) / proj.editorPayment * 100);
      const p2 = Math.round((proj.secondEditorShare || 0) / proj.editorPayment * 100);
      if (p1 === 50 && p2 === 50) setSplitPreset('50-50');
      else if (p1 === 60 && p2 === 40) setSplitPreset('60-40');
      else if (p1 === 70 && p2 === 30) setSplitPreset('70-30');
      else if (p1 === 80 && p2 === 20) setSplitPreset('80-20');
      else setSplitPreset('custom');
    } else {
      setSplitPreset('50-50');
    }
    setOtherExpenses(proj.otherExpenses);
    setAdvancePayment(proj.advancePayment);
    setCouplePhoto(proj.couplePhoto || DEFAULT_COVERS[0].url);
    setNotes(proj.notes || '');
    
    // Backup settings
    setHardDiskName(proj.hardDiskName || '');
    setDataSize(proj.dataSize || '');
    setBackupStatus(proj.backupStatus || 'pending');
    setGoogleDriveLink(proj.googleDriveLink || '');
    setRawDataFolder(proj.rawDataFolder || '');
    setDeliveryFolder(proj.deliveryFolder || '');
    setFinalExportFolder(proj.finalExportFolder || '');

    // Set custom milestones for editing, or seed with defaults if none exist
    const initialMilestones = proj.customMilestones && proj.customMilestones.length > 0
      ? proj.customMilestones
      : DEFAULT_MILESTONES.map((m, idx) => ({
          id: `milestone-${idx}-${Date.now()}`,
          label: m,
          completed: false
        }));
    setModalCustomMilestones(initialMilestones);
    setNewModalMilestoneInput('');

    setModalActiveTab('specs');
    setModalValidationError('');
    setIsModalOpen(true);
  };

  const handleAddCustomFunction = () => {
    const trimmed = customFunctionInput.trim();
    if (trimmed && !availableFunctions.includes(trimmed)) {
      setAvailableFunctions([...availableFunctions, trimmed]);
      setSelectedFunctions([...selectedFunctions, trimmed]);
      setCustomFunctionInput('');
    }
  };

  const handleSaveProject = async () => {
    if (!projectName.trim()) {
      setModalValidationError("Required: Please enter an elegant Project Name.");
      return;
    }
    if (!groomName.trim() || !brideName.trim()) {
      setModalValidationError("Required: Both Groom and Bride names are required.");
      return;
    }
    if (!shootDate) {
      setModalValidationError("Required: Please specify the Project Start Date.");
      return;
    }
    if (!deliveryDate) {
      setModalValidationError("Required: Please specify the Delivery Deadline.");
      return;
    }
    if (selectedFunctions.length === 0) {
      setModalValidationError("Required: Choose at least 1 cinematic deliverable function.");
      return;
    }
    
    setModalValidationError('');
    try {
      const selectedStudio = studios.find(s => s.id === studioId);
      const selectedEditor = editors.find(ed => ed.id === assignedEditorId);
      const secondEditor = editors.find(ed => ed.id === secondEditorId);
      
      const coupleName = `${groomName} & ${brideName}`;
      const calculatedRemainingBalance = projectAmount - advancePayment;
      const finalEventType = selectedFunctions.join(', ') || 'Wedding Film';

      // Compress photo before saving to keep document size under 1MB limit
      const compressedCouplePhoto = await compressImage(couplePhoto);
      const finalCouplePhoto = compressedCouplePhoto || DEFAULT_COVERS[0].url;

      if (editingProject) {
        // Update existing
        await onUpdateProject(editingProject.id, {
          projectName,
          brideName,
          groomName,
          coupleName,
          eventType: finalEventType,
          studioId,
          studioName: selectedStudio ? selectedStudio.name : 'Unknown Studio',
          shootDate,
          deliveryDate,
          assignedEditorId,
          assignedEditorName: selectedEditor ? selectedEditor.name : 'Unassigned',
          isSplitProject,
          secondEditorId: isSplitProject ? secondEditorId : '',
          secondEditorName: (isSplitProject && secondEditor) ? secondEditor.name : 'Unassigned',
          firstEditorShare: isSplitProject ? firstEditorShare : editorPayment,
          secondEditorShare: isSplitProject ? secondEditorShare : 0,
          status,
          priority,
          projectAmount,
          editorPayment,
          otherExpenses,
          advancePayment,
          remainingBalance: calculatedRemainingBalance,
          couplePhoto: finalCouplePhoto,
          notes,
          hardDiskName,
          dataSize,
          backupStatus,
          googleDriveLink,
          rawDataFolder,
          deliveryFolder,
          finalExportFolder,
          customMilestones: modalCustomMilestones
        });
        
        // update detail panel if open
        if (selectedProject?.id === editingProject.id) {
          setSelectedProject({
            ...selectedProject,
            projectName,
            brideName,
            groomName,
            coupleName,
            eventType: finalEventType,
            studioId,
            studioName: selectedStudio ? selectedStudio.name : 'Unknown Studio',
            shootDate,
            deliveryDate,
            assignedEditorId,
            assignedEditorName: selectedEditor ? selectedEditor.name : 'Unassigned',
            isSplitProject,
            secondEditorId: isSplitProject ? secondEditorId : '',
            secondEditorName: (isSplitProject && secondEditor) ? secondEditor.name : 'Unassigned',
            firstEditorShare: isSplitProject ? firstEditorShare : editorPayment,
            secondEditorShare: isSplitProject ? secondEditorShare : 0,
            status,
            priority,
            projectAmount,
            editorPayment,
            otherExpenses,
            advancePayment,
            remainingBalance: calculatedRemainingBalance,
            couplePhoto: finalCouplePhoto,
            notes,
            hardDiskName,
            dataSize,
            backupStatus,
            googleDriveLink,
            rawDataFolder,
            deliveryFolder,
            finalExportFolder,
            customMilestones: modalCustomMilestones
          });
        }
      } else {
        // Create new with auto project ID
        const autoId = `PRJ-2026-${String(projects.length + 1).padStart(3, '0')}`;
        
        await onAddProject({
          id: autoId,
          projectName,
          brideName,
          groomName,
          coupleName,
          eventType: finalEventType,
          studioId,
          studioName: selectedStudio ? selectedStudio.name : 'Unknown Studio',
          shootDate,
          deliveryDate,
          assignedEditorId,
          assignedEditorName: selectedEditor ? selectedEditor.name : 'Unassigned',
          isSplitProject,
          secondEditorId: isSplitProject ? secondEditorId : '',
          secondEditorName: (isSplitProject && secondEditor) ? secondEditor.name : 'Unassigned',
          firstEditorShare: isSplitProject ? firstEditorShare : editorPayment,
          secondEditorShare: isSplitProject ? secondEditorShare : 0,
          status,
          priority,
          projectAmount,
          editorPayment,
          otherExpenses,
          advancePayment,
          remainingBalance: calculatedRemainingBalance,
          couplePhoto: finalCouplePhoto,
          notes,
          hardDiskName,
          dataSize,
          backupStatus,
          googleDriveLink,
          rawDataFolder,
          deliveryFolder,
          finalExportFolder,
          customMilestones: modalCustomMilestones
        });
      }
      
      setIsModalOpen(false);
    } catch (error: any) {
      console.error("Error saving project:", error);
      alert("Failed to save Project: " + (error?.message || error || "Unknown error"));
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDeleteText('');
    setDeleteConfirmId(id);
  };

  const handleAddRevisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionNotes.trim() || !selectedProject) return;

    // find next revision count
    const projRevisions = revisions.filter(r => r.projectId === selectedProject.id);
    const nextRevNum = projRevisions.length + 1;

    await onAddRevision({
      projectId: selectedProject.id,
      revisionNumber: nextRevNum,
      notes: revisionNotes,
      date: new Date().toISOString().split('T')[0],
      status: 'pending'
    });

    setRevisionNotes('');
    setIsAddingRevision(false);
  };

  // Status updates in card/board
  const handleUpdateStatus = async (proj: Project, newStatus: ProjectStatus) => {
    await onUpdateProject(proj.id, { status: newStatus });
  };

  // Filter project lists
  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.coupleName.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) || 
                          p.studioName.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) || 
                          p.id.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || p.priority === priorityFilter;
    const matchesStudio = studioFilter === 'all' || p.studioId === studioFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesStudio;
  });

  return (
    <div className="space-y-6">
      
      {/* High-Contrast Luxury Hero Stats Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Productions */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-charcoal-900 to-charcoal-950 border border-luxury-green-800/20 shadow-md flex items-center justify-between relative overflow-hidden group hover:border-gold-500/20 transition-all duration-300">
          <div className="absolute top-0 right-0 w-16 h-16 bg-luxury-green-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="space-y-1 relative z-10">
            <span className="text-[10px] font-mono tracking-wider text-gray-500 uppercase">Active Editing</span>
            <div className="text-2xl font-extrabold text-white font-display flex items-baseline space-x-1">
              <span>{summaryStats.activeCount}</span>
              <span className="text-xs font-normal text-gold-400">films</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-luxury-green-500/10 text-gold-400 border border-luxury-green-800/10 shrink-0">
            <Film className="w-5 h-5" />
          </div>
        </div>

        {/* Revisions Pending */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-charcoal-900 to-charcoal-950 border border-luxury-green-800/20 shadow-md flex items-center justify-between relative overflow-hidden group hover:border-gold-500/20 transition-all duration-300">
          <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="space-y-1 relative z-10">
            <span className="text-[10px] font-mono tracking-wider text-gray-500 uppercase">Pending Revisions</span>
            <div className="text-2xl font-extrabold text-white font-display flex items-baseline space-x-1">
              <span>{summaryStats.revisionCount}</span>
              <span className="text-xs font-normal text-yellow-400">tasks</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-yellow-500/10 text-yellow-400 border border-yellow-500/10 shrink-0">
            <FileEdit className="w-5 h-5" />
          </div>
        </div>

        {/* Urgent Deliveries */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-charcoal-900 to-charcoal-950 border border-luxury-green-800/20 shadow-md flex items-center justify-between relative overflow-hidden group hover:border-gold-500/20 transition-all duration-300">
          <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="space-y-1 relative z-10">
            <span className="text-[10px] font-mono tracking-wider text-gray-500 uppercase">Urgent Queues</span>
            <div className="text-2xl font-extrabold text-red-400 font-display flex items-baseline space-x-1">
              <span>{summaryStats.urgentCount}</span>
              <span className="text-xs font-normal text-red-400/80">critical</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/10 shrink-0">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        {/* Revenue Ledger (Admin/Editor Visible) */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-charcoal-900 to-charcoal-950 border border-luxury-green-800/20 shadow-md flex items-center justify-between relative overflow-hidden group hover:border-gold-500/20 transition-all duration-300">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="space-y-1 relative z-10">
            <span className="text-[10px] font-mono tracking-wider text-gray-500 uppercase">
              {userRole === 'admin' ? 'Remaining Collections' : 'Est. Compensation'}
            </span>
            <div className="text-2xl font-extrabold text-emerald-400 font-display">
              ₹{summaryStats.pendingCollection.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 shrink-0">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>
      </div>
      
      {/* Search and Filters Hub */}
      <div className="p-5 rounded-3xl bg-charcoal-900/60 border border-luxury-green-800/10 relative overflow-hidden backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search wedding registries, studios, IDs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-10 py-3 bg-charcoal-950 border border-luxury-green-800/20 rounded-2xl text-xs focus:outline-none focus:border-gold-500/40 text-gray-200 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-3.5 text-gray-400 hover:text-white transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* View selectors */}
            <div className="flex bg-charcoal-950 border border-luxury-green-800/20 p-1 rounded-2xl">
              <button
                id="view-grid"
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-xl transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-luxury-green-800 text-gold-400 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                title="Grid Portfolio"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                id="view-list"
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-xl transition-all cursor-pointer ${viewMode === 'list' ? 'bg-luxury-green-800 text-gold-400 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                title="Spreadsheet List"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                id="view-kanban"
                onClick={() => setViewMode('kanban')}
                className={`p-2 rounded-xl transition-all cursor-pointer ${viewMode === 'kanban' ? 'bg-luxury-green-800 text-gold-400 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                title="Workflow Board"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </div>

            {/* Status Select */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-charcoal-950 border border-luxury-green-800/20 px-3.5 py-2.5 rounded-2xl text-xs text-gray-300 focus:outline-none focus:border-gold-500/40 cursor-pointer"
            >
              <option value="all">All Stages</option>
              {WORKFLOW_STAGES.map(stage => (
                <option key={stage.id} value={stage.id}>{stage.label}</option>
              ))}
            </select>

            {(userRole === 'admin' || userRole === 'editor' || userRole === 'studio') && (
              <button
                id="btn-add-project"
                onClick={openCreateModal}
                className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-luxury-green-800 to-luxury-green-600 border border-gold-500/20 rounded-2xl text-white font-semibold text-xs hover:scale-[1.02] active:scale-[0.98] transition-transform gold-glow cursor-pointer"
              >
                <Plus className="w-4 h-4 text-gold-300" />
                <span>Create Project</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Elegant Horizontal Studio Tab Strip */}
      {userRole !== 'studio' && (
        <div className="flex items-center space-x-2.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-charcoal-800 scrollbar-track-transparent">
          <button
            type="button"
            onClick={() => setStudioFilter('all')}
            className={`flex items-center space-x-2 px-5 py-3 rounded-2xl border text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              studioFilter === 'all'
                ? 'bg-gradient-to-r from-luxury-green-800 to-luxury-green-700 text-gold-400 border-gold-500/30 font-bold shadow-md shadow-charcoal-950/40 scale-[1.02]'
                : 'bg-charcoal-900 border border-luxury-green-800/10 text-gray-400 hover:text-gray-200 hover:bg-charcoal-800/60'
            }`}
          >
            <span>All Studios</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${studioFilter === 'all' ? 'bg-gold-500/25 text-gold-300 font-bold' : 'bg-charcoal-950 text-gray-500'}`}>
              {projects.length}
            </span>
          </button>
          {studios.map(s => {
            const studioProjectsCount = projects.filter(p => p.studioId === s.id).length;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setStudioFilter(s.id)}
                className={`flex items-center space-x-2 px-5 py-3 rounded-2xl border text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  studioFilter === s.id
                    ? 'bg-gradient-to-r from-luxury-green-800 to-luxury-green-700 text-gold-400 border-gold-500/30 font-bold shadow-md shadow-charcoal-950/40 scale-[1.02]'
                    : 'bg-charcoal-900 border border-luxury-green-800/10 text-gray-400 hover:text-gray-200 hover:bg-charcoal-800/60'
                }`}
              >
                <span>{s.name}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${studioFilter === s.id ? 'bg-gold-500/25 text-gold-300 font-bold' : 'bg-charcoal-950 text-gray-500'}`}>
                  {studioProjectsCount}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Grid View Content */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.map((proj) => {
            const currentStage = WORKFLOW_STAGES.find(s => s.id === proj.status);
            const currentPriority = PRIORITIES.find(p => p.id === proj.priority);
            const remainingDays = proj.deliveryDate ? Math.ceil((new Date(proj.deliveryDate).getTime() - Date.now()) / (1000 * 3600 * 24)) : null;

            // Calculations for visual progress ring
            const stageIndex = WORKFLOW_STAGES.findIndex(s => s.id === proj.status);
            const percentProgress = proj.customMilestones && proj.customMilestones.length > 0
              ? Math.round((proj.customMilestones.filter(m => m.completed).length / proj.customMilestones.length) * 100)
              : Math.round(((stageIndex + 1) / WORKFLOW_STAGES.length) * 100);

            return (
              <SwipeableCard
                key={proj.id}
                id={proj.id}
                onSwipeLeft={(userRole === 'admin' || userRole === 'editor') ? () => handleDelete(proj.id, { stopPropagation: () => {} } as any) : undefined}
                onSwipeRight={async () => {
                  await onUpdateProject(proj.id, { status: 'closed' });
                  alert(`Project ${proj.id} has been closed/archived successfully!`);
                }}
                onTap={() => {
                  setSelectedProject(proj);
                  setIsDetailOpen(true);
                }}
                className="rounded-3xl bg-gradient-to-b from-charcoal-900 to-charcoal-950 border border-luxury-green-800/10 relative overflow-hidden flex flex-col h-[410px] justify-between cursor-pointer group hover:border-gold-500/20 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {/* Photo Top Header */}
                <div className="h-44 relative overflow-hidden">
                  <img
                    src={proj.couplePhoto || DEFAULT_COVERS[0].url}
                    alt={proj.coupleName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-zoom-in"
                    onMouseEnter={() => setHoveredPhoto({
                      url: proj.couplePhoto || DEFAULT_COVERS[0].url,
                      title: proj.coupleName,
                      subtitle: `${proj.projectName || 'Wedding Film'} • ${proj.eventType}`
                    })}
                    onMouseLeave={() => setHoveredPhoto(null)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900 via-charcoal-900/40 to-transparent" />
                  
                  {/* Floating ID & Priority */}
                  <div className="absolute top-4 left-4 flex space-x-2">
                    <span className="text-[10px] font-mono px-2.5 py-1 bg-charcoal-950/80 border border-luxury-green-800/30 text-gold-400 rounded-md">
                      {proj.id}
                    </span>
                    {currentPriority && (
                      <span className={`text-[10px] font-mono px-2.5 py-1 bg-charcoal-950/80 rounded-md border border-luxury-green-800/20 ${currentPriority.color}`}>
                        {currentPriority.label}
                      </span>
                    )}
                  </div>

                  {/* Status Overlay */}
                  <div className="absolute bottom-4 left-4 flex items-center space-x-2">
                    <span className={`text-[10px] font-mono px-2.5 py-1 rounded-md ${currentStage?.bg} ${currentStage?.color}`}>
                      {currentStage?.label}
                    </span>
                  </div>

                  {/* Circle progress ring on top-right */}
                  <div className="absolute top-4 right-4 bg-charcoal-950/80 p-1.5 rounded-full backdrop-blur-sm border border-gold-500/15">
                    <svg className="w-10 h-10" viewBox="0 0 36 36">
                      <path
                        className="text-gray-800"
                        strokeWidth="3"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-gold-500 animate-dash"
                        strokeDasharray={`${percentProgress}, 100`}
                        strokeWidth="3"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <text x="18" y="21.5" className="text-white text-[9px] font-bold font-mono" textAnchor="middle" fill="#fff">
                        {percentProgress}%
                      </text>
                    </svg>
                  </div>
                </div>

                {/* Card Details Body */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <div className="truncate flex-1">
                        <h3 className="text-base font-bold text-white font-display leading-tight truncate group-hover:text-gold-400 transition-colors">
                          {proj.projectName || proj.coupleName}
                        </h3>
                        {proj.projectName && (
                          <p className="text-[10px] text-gold-400/80 font-mono tracking-wider uppercase mt-0.5">{proj.coupleName}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-1 shrink-0" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => openEditModal(proj, e)}
                          className="p-1.5 bg-charcoal-950 hover:bg-luxury-green-800/30 rounded-lg text-gray-400 hover:text-gold-500 border border-luxury-green-800/20 transition-colors cursor-pointer"
                          title="Edit Specifications"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {(userRole === 'admin' || userRole === 'editor') && (
                          <button
                            onClick={(e) => handleDelete(proj.id, e)}
                            className="p-1.5 bg-charcoal-950 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 border border-luxury-green-800/20 transition-colors cursor-pointer"
                            title="Delete Project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1 truncate">{proj.eventType}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <span className="text-[9px] text-gray-500 uppercase tracking-wider font-mono">Studio Partner</span>
                        <div className="text-xs text-gray-300 font-semibold truncate mt-0.5">{proj.studioName}</div>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-500 uppercase tracking-wider font-mono">
                          {proj.isSplitProject ? 'Editors (Split)' : 'Lead Editor'}
                        </span>
                        <div className="text-xs text-gray-300 font-semibold truncate mt-0.5 flex items-center space-x-1">
                          <User className="w-3 h-3 text-gold-500/50 shrink-0" />
                          <span className="truncate">
                            {proj.isSplitProject 
                              ? `${proj.assignedEditorName || 'Unassigned'} + ${proj.secondEditorName || 'Unassigned'}`
                              : (proj.assignedEditorName || 'Unassigned')
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom / Countdown */}
                  <div className="border-t border-luxury-green-800/10 pt-4 flex items-center justify-between text-[11px] text-gray-400 font-mono">
                    <div className="flex items-center space-x-1.5">
                      <CalendarIcon className="w-3.5 h-3.5 text-luxury-green-500" />
                      <span>{proj.deliveryDate}</span>
                    </div>

                    <div>
                      {remainingDays !== null ? (
                        remainingDays < 0 ? (
                          <span className="text-red-400 font-bold">Overdue</span>
                        ) : remainingDays === 0 ? (
                          <span className="text-yellow-500 font-bold">Due Today</span>
                        ) : (
                          <span>{remainingDays} days left</span>
                        )
                      ) : (
                        <span className="text-gray-500">No Due Date</span>
                      )}
                    </div>
                  </div>
                </div>
              </SwipeableCard>
            );
          })}
          
          {filteredProjects.length === 0 && (
            <div className="col-span-full py-16 text-center rounded-3xl bg-charcoal-900/20 border border-dashed border-luxury-green-800/15">
              <FolderOpen className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-xs text-gray-400 font-mono">No matching wedding records found in archive.</p>
            </div>
          )}
        </div>
      )}

      {/* List View Content */}
      {viewMode === 'list' && (
        <div className="rounded-3xl bg-charcoal-900 border border-luxury-green-800/10 overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-charcoal-950 border-b border-luxury-green-800/20 text-[10px] uppercase font-mono tracking-wider text-gray-400">
                  <th className="p-4 pl-6">ID</th>
                  <th className="p-4">Couple & Project</th>
                  <th className="p-4">Studio Partner</th>
                  <th className="p-4">Deadline</th>
                  <th className="p-4">Lead Editor</th>
                  <th className="p-4">Workflow Status</th>
                  <th className="p-4">{userRole === 'admin' ? 'Balance Due' : 'Your Fee'}</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-luxury-green-800/10">
                {filteredProjects.map((proj) => {
                  const currentStage = WORKFLOW_STAGES.find(s => s.id === proj.status);
                  
                  return (
                    <tr
                      key={proj.id}
                      id={`project-list-${proj.id}`}
                      onClick={() => { setSelectedProject(proj); setIsDetailOpen(true); }}
                      className="hover:bg-luxury-green-950/20 transition-colors cursor-pointer group"
                    >
                      <td className="p-4 pl-6 font-mono text-xs text-gold-500">{proj.id}</td>
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={proj.couplePhoto || DEFAULT_COVERS[0].url}
                            alt=""
                            className="w-8 h-8 rounded-lg object-cover cursor-zoom-in"
                            onMouseEnter={() => setHoveredPhoto({
                              url: proj.couplePhoto || DEFAULT_COVERS[0].url,
                              title: proj.coupleName,
                              subtitle: `${proj.projectName || 'Wedding Film'} • ${proj.eventType}`
                            })}
                            onMouseLeave={() => setHoveredPhoto(null)}
                          />
                          <div>
                            <span className="text-xs font-bold text-gray-200 group-hover:text-gold-400 transition-colors">{proj.projectName || proj.coupleName}</span>
                            {proj.projectName && <span className="block text-[9px] text-gold-400/80 font-mono">{proj.coupleName}</span>}
                            <span className="block text-[9px] text-gray-400">{proj.eventType}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-xs font-semibold text-gray-300">{proj.studioName}</td>
                      <td className="p-4 font-mono text-xs text-gray-400">{proj.deliveryDate}</td>
                      <td className="p-4 text-xs text-gray-300">
                        {proj.isSplitProject ? (
                          <div className="space-y-0.5">
                            <span className="block font-semibold">{proj.assignedEditorName}</span>
                            <span className="block text-[10px] text-gold-400 font-mono">Split: +{proj.secondEditorName}</span>
                          </div>
                        ) : (
                          proj.assignedEditorName || 'Unassigned'
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col space-y-1">
                          <span className={`inline-block text-[10px] font-mono px-2 py-0.5 rounded-md w-fit ${currentStage?.bg} ${currentStage?.color}`}>
                            {currentStage?.label}
                          </span>
                          {proj.customMilestones && proj.customMilestones.length > 0 && (
                            <span className="text-[9px] text-gray-500 font-mono">
                              🏁 {proj.customMilestones.filter(m => m.completed).length}/{proj.customMilestones.length} Milestones
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-mono text-xs font-bold text-gray-200">
                        ₹{userRole === 'admin' 
                          ? proj.remainingBalance.toLocaleString('en-IN') 
                          : (proj.editorPayment || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="p-4 pr-6 text-right" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={(e) => openEditModal(proj, e)}
                            className="p-1.5 hover:bg-luxury-green-800/30 rounded-lg text-gray-400 hover:text-gold-500 transition-colors cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {(userRole === 'admin' || userRole === 'editor') && (
                            <button
                              onClick={(e) => handleDelete(proj.id, e)}
                              className="p-1.5 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
                              title="Delete Project"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredProjects.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-xs text-gray-500 font-mono">No matching wedding records in database.</p>
            </div>
          )}
        </div>
      )}

      {/* Kanban Pipeline View */}
      {viewMode === 'kanban' && (
        <div className="flex space-x-4 overflow-x-auto pb-6 pt-2 select-none">
          {WORKFLOW_STAGES.map((stage) => {
            const stageProjects = filteredProjects.filter(p => p.status === stage.id);
            
            return (
              <div 
                key={stage.id} 
                className="w-80 shrink-0 bg-charcoal-900/40 p-4 rounded-3xl border border-luxury-green-800/10 flex flex-col h-[560px] justify-between"
              >
                <div>
                  <div className="flex justify-between items-center mb-4 px-1">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${stage.color.replace('text-', 'bg-')}`} />
                      <h4 className="text-xs font-bold text-gray-200 tracking-wide uppercase">{stage.label}</h4>
                    </div>
                    <span className="text-[10px] font-mono bg-luxury-green-950 px-2 py-0.5 rounded-full text-gold-400">
                      {stageProjects.length}
                    </span>
                  </div>

                  <div className="space-y-3 overflow-y-auto max-h-[460px] pr-1 custom-scrollbar">
                    {stageProjects.map((proj) => (
                      <SwipeableCard
                        key={proj.id}
                        id={proj.id}
                        onSwipeLeft={(userRole === 'admin' || userRole === 'editor') ? () => handleDelete(proj.id, { stopPropagation: () => {} } as any) : undefined}
                        onSwipeRight={async () => {
                          await onUpdateProject(proj.id, { status: 'closed' });
                          alert(`Project ${proj.id} has been closed/archived successfully!`);
                        }}
                        onTap={() => {
                          setSelectedProject(proj);
                          setIsDetailOpen(true);
                        }}
                        className="p-4 rounded-2xl bg-charcoal-800/80 border border-luxury-green-800/15 hover:border-gold-500/20 cursor-pointer transition-all duration-200 shadow-md group"
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-[9px] font-mono bg-charcoal-950 px-1.5 py-0.5 rounded text-gold-400">
                            {proj.id}
                          </span>
                          <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded uppercase ${
                            proj.priority === 'urgent' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-gray-900 text-gray-400'
                          }`}>
                            {proj.priority}
                          </span>
                        </div>

                        <div className="flex justify-between items-start gap-1 mt-2">
                          <div className="truncate flex-1">
                            <h5 className="text-xs font-semibold text-gray-200 group-hover:text-gold-400 transition-colors truncate">
                              {proj.projectName || proj.coupleName}
                            </h5>
                            {proj.projectName && (
                              <p className="text-[9px] text-gold-400/80 font-mono truncate mt-0.5">{proj.coupleName}</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => openEditModal(proj, e)}
                              className="p-1 hover:bg-luxury-green-800/30 rounded text-gray-400 hover:text-gold-500 transition-colors cursor-pointer"
                              title="Edit Specifications"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            {(userRole === 'admin' || userRole === 'editor') && (
                              <button
                                onClick={(e) => handleDelete(proj.id, e)}
                                className="p-1 hover:bg-red-500/10 rounded text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
                                title="Delete Project"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-[10px] text-gray-400 truncate mt-0.5">{proj.studioName}</p>

                        {proj.customMilestones && proj.customMilestones.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <div className="flex justify-between items-center text-[9px] font-mono text-gray-500">
                              <span>Milestones</span>
                              <span>
                                {proj.customMilestones.filter(m => m.completed).length}/{proj.customMilestones.length} Done
                              </span>
                            </div>
                            <div className="w-full bg-charcoal-950 h-1 rounded-full overflow-hidden border border-luxury-green-800/10">
                              <div 
                                className="bg-gold-500/80 h-full transition-all duration-300"
                                style={{ 
                                  width: `${(proj.customMilestones.filter(m => m.completed).length / proj.customMilestones.length) * 100}%` 
                                }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex justify-between items-center mt-4 pt-3 border-t border-luxury-green-800/5 text-[9px] text-gray-500 font-mono">
                          <span>Lead: {proj.assignedEditorName || 'Unassigned'}</span>
                          <span>{proj.deliveryDate}</span>
                        </div>
                      </SwipeableCard>
                    ))}

                    {stageProjects.length === 0 && (
                      <div className="text-center py-10 text-[10px] text-gray-600 font-mono border border-dashed border-luxury-green-800/10 rounded-2xl">
                        Lane is clear
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Project Detail Sliding Drawer */}
      <AnimatePresence>
        {isDetailOpen && selectedProject && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsDetailOpen(false)} />
            
            <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
              <motion.div
                id="project-drawer"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 180 }}
                className="w-screen max-w-2xl bg-charcoal-900 border-l border-luxury-green-800/30 shadow-2xl flex flex-col justify-between"
              >
                {/* Header Photo block */}
                <div className="h-56 relative shrink-0">
                  <img
                    src={selectedProject.couplePhoto || DEFAULT_COVERS[0].url}
                    alt=""
                    className="w-full h-full object-cover cursor-zoom-in"
                    onMouseEnter={() => setHoveredPhoto({
                      url: selectedProject.couplePhoto || DEFAULT_COVERS[0].url,
                      title: selectedProject.coupleName,
                      subtitle: `${selectedProject.projectName || 'Wedding Film'} • ${selectedProject.eventType}`
                    })}
                    onMouseLeave={() => setHoveredPhoto(null)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900 via-charcoal-900/20 to-transparent" />
                  
                  <button
                    onClick={() => setIsDetailOpen(false)}
                    className="absolute top-4 left-4 bg-charcoal-950/70 hover:bg-charcoal-950 p-2.5 rounded-xl text-gray-300 hover:text-white border border-gold-500/15 backdrop-blur-md cursor-pointer text-xs"
                  >
                    ✕ Close Panel
                  </button>

                  <div className="absolute bottom-4 left-6">
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-gold-500/20 text-gold-400 border border-gold-500/30 rounded-md font-bold uppercase">
                      {selectedProject.id}
                    </span>
                    <h2 className="text-2xl font-bold font-display text-white mt-1.5 leading-tight">{selectedProject.projectName || selectedProject.coupleName}</h2>
                    {selectedProject.projectName && (
                      <p className="text-sm text-gold-400 font-semibold font-mono mt-0.5">{selectedProject.coupleName}</p>
                    )}
                    <p className="text-xs text-gray-300 mt-0.5">{selectedProject.eventType} • Shot on {selectedProject.shootDate}</p>
                  </div>
                </div>

                {/* Content Area Scrolling */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                  
                  {/* Status update controller */}
                  <div className="p-4 rounded-2xl bg-charcoal-950 border border-luxury-green-800/25 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider font-mono block">Current Workflow Stage</span>
                      <div className="text-sm font-bold text-gold-400 capitalize mt-0.5">
                        {WORKFLOW_STAGES.find(s => s.id === selectedProject.status)?.label}
                      </div>
                    </div>
                    
                    <select
                      id="update-status-select"
                      value={selectedProject.status}
                      onChange={(e) => {
                        const newStat = e.target.value as ProjectStatus;
                        onUpdateProject(selectedProject.id, { status: newStat });
                        setSelectedProject({ ...selectedProject, status: newStat });
                      }}
                      className="bg-charcoal-900 border border-luxury-green-800/30 px-3.5 py-2 rounded-xl text-xs text-gold-400 focus:outline-none cursor-pointer font-bold"
                    >
                      {WORKFLOW_STAGES.map(stage => (
                        <option key={stage.id} value={stage.id}>{stage.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Core Details Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-charcoal-800/30 border border-luxury-green-800/10">
                      <span className="text-[10px] text-gray-500 uppercase font-mono">Studio Partner</span>
                      <p className="text-sm font-semibold text-gray-200 mt-0.5">{selectedProject.studioName}</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-charcoal-800/30 border border-luxury-green-800/10">
                      <span className="text-[10px] text-gray-500 uppercase font-mono">
                        {selectedProject.isSplitProject ? 'Lead Editor (Split)' : 'Lead Editor'}
                      </span>
                      <p className="text-sm font-semibold text-gray-200 mt-0.5">
                        {selectedProject.assignedEditorName || 'Unassigned'}
                        {selectedProject.isSplitProject && (
                          <span className="block text-xs text-gold-400 mt-1 font-mono">
                            Share: ₹{(selectedProject.firstEditorShare || 0).toLocaleString('en-IN')}
                          </span>
                        )}
                      </p>
                    </div>

                    {selectedProject.isSplitProject && (
                      <div className="p-4 rounded-2xl bg-charcoal-800/30 border border-gold-500/15 col-span-2">
                        <span className="text-[10px] text-gold-400 uppercase font-mono">Secondary Editor (Split)</span>
                        <p className="text-sm font-semibold text-gray-200 mt-0.5">
                          {selectedProject.secondEditorName || 'Unassigned'}
                          <span className="block text-xs text-gold-400 mt-1 font-mono font-semibold">
                            Share: ₹{(selectedProject.secondEditorShare || 0).toLocaleString('en-IN')}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Pricing Balance Ledger */}
                  {userRole === 'admin' ? (
                    <div className="p-5 rounded-3xl bg-gradient-to-br from-luxury-green-950/20 to-charcoal-950 border border-luxury-green-800/25 shadow-sm">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gold-500 mb-4 font-mono flex items-center space-x-1.5">
                        <Coins className="w-4 h-4 text-gold-400" />
                        <span>Project Financial Ledger</span>
                      </h3>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                        <div className="p-3 bg-charcoal-900/60 rounded-xl border border-white/5">
                          <span className="text-[8px] text-gray-500 font-mono block">CONTRACT</span>
                          <div className="text-xs font-bold text-white mt-1">₹{selectedProject.projectAmount.toLocaleString('en-IN')}</div>
                        </div>
                        <div className="p-3 bg-charcoal-900/60 rounded-xl border border-white/5">
                          <span className="text-[8px] text-gray-500 font-mono block">ADVANCE</span>
                          <div className="text-xs font-bold text-emerald-400 mt-1">₹{selectedProject.advancePayment.toLocaleString('en-IN')}</div>
                        </div>
                        <div className="p-3 bg-charcoal-900/60 rounded-xl border border-white/5">
                          <span className="text-[8px] text-gray-500 font-mono block">EDITOR</span>
                          <div className="text-xs font-bold text-yellow-500 mt-1">₹{selectedProject.editorPayment.toLocaleString('en-IN')}</div>
                        </div>
                        <div className="p-3 bg-charcoal-900/60 rounded-xl border border-white/5">
                          <span className="text-[8px] text-gray-500 font-mono block">REMAINING</span>
                          <div className="text-xs font-bold text-red-400 mt-1 font-mono">₹{selectedProject.remainingBalance.toLocaleString('en-IN')}</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 rounded-3xl bg-charcoal-950 border border-luxury-green-800/25">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gold-500 mb-4 font-mono">Project Compensation</h3>
                      <div className="p-4 bg-charcoal-900 rounded-xl border border-white/5 flex justify-between items-center max-w-sm">
                        <span className="text-xs text-gray-400 font-mono">Lead Editor Pay:</span>
                        <span className="text-lg font-bold text-yellow-500 font-mono">₹{selectedProject.editorPayment.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  )}

                  {/* Raw Data & Backups */}
                  <div className="p-5 rounded-3xl bg-charcoal-800/20 border border-luxury-green-800/15 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gold-500 font-mono flex items-center space-x-1.5">
                        <HardDrive className="w-3.5 h-3.5" />
                        <span>Data Management & Backups</span>
                      </h3>
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${
                        selectedProject.backupStatus === 'backed_up' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-400'
                      }`}>
                        {selectedProject.backupStatus === 'backed_up' ? 'Complete' : 'Pending'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-gray-500 font-mono">HDD Ref Code:</span>
                        <p className="text-gray-300 font-semibold mt-0.5">{selectedProject.hardDiskName || 'Unlogged'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 font-mono">Footage Size:</span>
                        <p className="text-gray-300 font-semibold mt-0.5">{selectedProject.dataSize || 'Unmeasured'}</p>
                      </div>
                    </div>

                    {selectedProject.googleDriveLink && (
                      <a
                        href={selectedProject.googleDriveLink}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-3 rounded-xl bg-charcoal-950 hover:bg-black text-xs text-gold-400 border border-luxury-green-800/20"
                      >
                        <span className="truncate mr-3">Google Drive Asset Link: {selectedProject.googleDriveLink}</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0 text-gold-500" />
                      </a>
                    )}
                  </div>

                  {/* Revision Manager */}
                  <div className="p-5 rounded-3xl bg-charcoal-800/20 border border-luxury-green-800/15 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gold-500 font-mono flex items-center space-x-1.5">
                        <FileEdit className="w-3.5 h-3.5" />
                        <span>Revision Timelines</span>
                      </h3>
                      <button
                        onClick={() => setIsAddingRevision(!isAddingRevision)}
                        className="text-[10px] font-mono text-gold-400 hover:underline flex items-center space-x-1 cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5 mr-1" />
                        <span>Add Request</span>
                      </button>
                    </div>

                    {/* New Revision Panel */}
                    {isAddingRevision && (
                      <form onSubmit={handleAddRevisionSubmit} className="space-y-3 p-3 bg-charcoal-950 rounded-xl border border-gold-500/20">
                        <textarea
                          placeholder="Type revision specs requested by client..."
                          value={revisionNotes}
                          onChange={(e) => setRevisionNotes(e.target.value)}
                          className="w-full bg-transparent border-0 text-xs focus:ring-0 text-gray-200 resize-none h-16 outline-none"
                          required
                        />
                        <div className="flex justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => setIsAddingRevision(false)}
                            className="px-2.5 py-1 text-[10px] text-gray-500 hover:text-gray-300"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-3.5 py-1 bg-gold-500 text-charcoal-950 font-bold text-[10px] rounded-lg cursor-pointer"
                          >
                            Log Request
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Revision list */}
                    <div className="space-y-2">
                      {revisions.filter(r => r.projectId === selectedProject.id).length > 0 ? (
                        revisions.filter(r => r.projectId === selectedProject.id).map((rev) => (
                          <div key={rev.id} className="p-3 bg-charcoal-950/50 rounded-xl border border-luxury-green-800/5 flex justify-between items-start">
                            <div className="pr-4">
                              <div className="flex items-center space-x-2">
                                <span className="text-[9px] font-mono text-gold-400 font-bold">REV-#{rev.revisionNumber}</span>
                                <span className="text-[8px] text-gray-500 font-mono">{rev.date}</span>
                              </div>
                              <p className="text-xs text-gray-300 mt-1 leading-relaxed">{rev.notes}</p>
                            </div>

                            <div className="flex items-center space-x-2 shrink-0 ml-2">
                              {rev.status === 'pending' ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onResolveRevision(rev.id);
                                  }}
                                  className="px-2 py-1 bg-yellow-500/10 hover:bg-yellow-500 text-yellow-500 hover:text-charcoal-950 font-bold text-[9px] rounded-md transition-colors cursor-pointer"
                                >
                                  Resolve
                                </button>
                              ) : (
                                <span className="text-[9px] font-mono text-emerald-400 flex items-center space-x-1 shrink-0">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span>Fixed</span>
                                </span>
                              )}
                              {onDeleteRevision && (userRole === 'admin' || userRole === 'editor') && (
                                <button
                                  type="button"
                                  onClick={() => setRevisionToDeleteId(rev.id)}
                                  className="p-1.5 bg-red-500/10 hover:bg-red-500/25 text-red-400 rounded-lg transition-colors cursor-pointer"
                                  title="Delete Revision"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-[10px] text-gray-500 font-mono">No revision history reported.</div>
                      )}
                    </div>
                  </div>

                  {/* Interactive Milestone Checklist */}
                  <div className="p-5 rounded-3xl bg-charcoal-800/20 border border-luxury-green-800/15 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gold-500 font-mono flex items-center space-x-1.5">
                        <CheckSquare className="w-3.5 h-3.5 text-gold-500" />
                        <span>Interactive Milestone Checklist</span>
                      </h3>
                      {selectedProject.customMilestones && selectedProject.customMilestones.length > 0 && (
                        <span className="text-[10px] font-mono text-gray-400">
                          {selectedProject.customMilestones.filter(m => m.completed).length}/{selectedProject.customMilestones.length} Done
                        </span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {selectedProject.customMilestones && selectedProject.customMilestones.length > 0 && (
                      <div className="w-full bg-charcoal-950 h-1.5 rounded-full overflow-hidden border border-luxury-green-800/10">
                        <div 
                          className="bg-gold-500 h-full transition-all duration-300"
                          style={{ 
                            width: `${(selectedProject.customMilestones.filter(m => m.completed).length / selectedProject.customMilestones.length) * 100}%` 
                          }}
                        />
                      </div>
                    )}

                    {/* Milestone List */}
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {selectedProject.customMilestones && selectedProject.customMilestones.length > 0 ? (
                        selectedProject.customMilestones.map((m) => (
                          <div 
                            key={m.id} 
                            className="p-3 bg-charcoal-950/40 hover:bg-charcoal-950/80 rounded-xl border border-luxury-green-800/5 flex justify-between items-center transition-all"
                          >
                            <label className="flex items-center space-x-2.5 flex-1 cursor-pointer select-none">
                              <input 
                                type="checkbox" 
                                checked={m.completed} 
                                onChange={() => {
                                  const updated = (selectedProject.customMilestones || []).map(item => 
                                    item.id === m.id ? { ...item, completed: !item.completed, completedAt: !item.completed ? new Date().toISOString() : undefined } : item
                                  );
                                  onUpdateProject(selectedProject.id, { customMilestones: updated });
                                  setSelectedProject({ ...selectedProject, customMilestones: updated });
                                }}
                                className="w-3.5 h-3.5 rounded border-luxury-green-800/30 text-gold-500 focus:ring-gold-500/50 bg-charcoal-900 cursor-pointer"
                              />
                              <div className="flex flex-col">
                                <span className={`text-xs ${m.completed ? 'line-through text-gray-500 font-normal' : 'text-gray-200 font-semibold'}`}>
                                  {m.label}
                                </span>
                                {m.completed && m.completedAt && (
                                  <span className="text-[8px] text-emerald-400/80 font-mono">
                                    Done: {new Date(m.completedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                )}
                              </div>
                            </label>
                            
                            <button
                              type="button"
                              onClick={() => {
                                const updated = (selectedProject.customMilestones || []).filter(item => item.id !== m.id);
                                onUpdateProject(selectedProject.id, { customMilestones: updated });
                                setSelectedProject({ ...selectedProject, customMilestones: updated });
                              }}
                              className="text-[10px] text-red-400 hover:text-red-300 font-semibold font-mono hover:underline ml-2"
                            >
                              Delete
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-[10px] text-gray-500 font-mono">
                          No custom milestones defined. Add one below to get started.
                        </div>
                      )}
                    </div>

                    {/* Add Milestone Form */}
                    <div className="flex items-center bg-charcoal-950 rounded-xl border border-luxury-green-800/20 p-1 pl-3.5">
                      <input 
                        type="text" 
                        placeholder="Add custom milestone step..." 
                        value={newDetailMilestone}
                        onChange={(e) => setNewDetailMilestone(e.target.value)}
                        className="flex-1 bg-transparent border-0 outline-none text-xs text-gray-200 py-1.5 focus:ring-0" 
                        onKeyDown={(e) => { 
                          if (e.key === 'Enter') { 
                            e.preventDefault(); 
                            e.stopPropagation();
                            if (newDetailMilestone.trim()) {
                              const newStep = {
                                id: `milestone-${Date.now()}`,
                                label: newDetailMilestone.trim(),
                                completed: false
                              };
                              const updated = [...(selectedProject.customMilestones || []), newStep];
                              onUpdateProject(selectedProject.id, { customMilestones: updated });
                              setSelectedProject({ ...selectedProject, customMilestones: updated });
                              setNewDetailMilestone('');
                            }
                          } 
                        }} 
                      />
                      <button 
                        type="button" 
                        onClick={() => {
                          if (newDetailMilestone.trim()) {
                            const newStep = {
                              id: `milestone-${Date.now()}`,
                              label: newDetailMilestone.trim(),
                              completed: false
                            };
                            const updated = [...(selectedProject.customMilestones || []), newStep];
                            onUpdateProject(selectedProject.id, { customMilestones: updated });
                            setSelectedProject({ ...selectedProject, customMilestones: updated });
                            setNewDetailMilestone('');
                          }
                        }}
                        className="px-3.5 py-1.5 bg-gold-500 hover:bg-gold-400 text-charcoal-950 text-xs font-bold rounded-lg cursor-pointer transition-colors shrink-0"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* General Project Notes */}
                  {selectedProject.notes && (
                    <div className="p-4 rounded-2xl bg-charcoal-950 border border-luxury-green-800/10">
                      <span className="text-[10px] text-gray-500 uppercase font-mono">Production Notes</span>
                      <p className="text-xs text-gray-300 mt-1 leading-relaxed">{selectedProject.notes}</p>
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="p-6 border-t border-luxury-green-800/20 bg-charcoal-950/50 flex justify-between shrink-0">
                  <button
                    onClick={(e) => openEditModal(selectedProject, e)}
                    className="flex items-center space-x-2 px-4.5 py-2.5 bg-luxury-green-800 hover:bg-luxury-green-700 text-gold-400 text-xs font-bold rounded-xl border border-gold-500/20 transition-all cursor-pointer"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit Specifications</span>
                  </button>

                  {(userRole === 'admin' || userRole === 'editor') && (
                    <button
                      onClick={(e) => handleDelete(selectedProject.id, e)}
                      className="flex items-center space-x-2 px-4 py-2.5 hover:bg-red-500/10 text-red-400 text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Registry</span>
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE & EDIT Specification Modal - REDESIGNED 2-PANE DESK */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 py-8">
              <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />

              <motion.div
                id="project-form-modal"
                initial={{ opacity: 0, scale: 0.96, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 15 }}
                className="inline-block w-full max-w-6xl overflow-hidden rounded-3xl bg-charcoal-950 border border-gold-500/20 shadow-2xl relative z-10 flex flex-col lg:flex-row h-auto max-h-[92vh]"
              >
                {/* LEFT COLUMN: LIVE CINE-CARD PREVIEW PORTFOLIO */}
                <div className="w-full lg:w-2/5 bg-gradient-to-b from-charcoal-900 to-charcoal-950 border-r border-luxury-green-800/20 p-6 flex flex-col justify-between select-none relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/5 rounded-full blur-3xl pointer-events-none" />
                  
                  <div>
                    <span className="text-[9px] font-mono tracking-widest text-gold-400 bg-gold-500/10 px-2.5 py-1 rounded-full uppercase border border-gold-500/20">
                      Live Spec Preview
                    </span>
                    <h3 className="text-xs text-gray-500 font-mono mt-3 uppercase tracking-wider">How it will look in grid:</h3>
                  </div>

                  {/* Interactive Live Card mockup */}
                  <div className="my-6 p-1 bg-charcoal-950 rounded-[28px] border border-gold-500/20 shadow-xl max-w-xs mx-auto w-full">
                    <div className="h-44 rounded-[24px] overflow-hidden relative">
                      <img 
                        src={couplePhoto || DEFAULT_COVERS[0].url} 
                        alt="Live Preview" 
                        className="w-full h-full object-cover" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950 via-charcoal-950/30 to-transparent" />
                      
                      {/* Floating Specs */}
                      <div className="absolute top-3 left-3 flex space-x-1">
                        <span className="text-[8px] font-mono px-2 py-0.5 bg-charcoal-950/80 border border-luxury-green-800/30 text-gold-400 rounded">
                          {editingProject ? editingProject.id : 'PRJ-AUTO'}
                        </span>
                        <span className="text-[8px] font-mono px-2 py-0.5 bg-charcoal-950/80 text-yellow-500 rounded uppercase">
                          {priority}
                        </span>
                      </div>

                      <div className="absolute bottom-3 left-3">
                        <span className="text-[8px] font-mono px-2 py-0.5 bg-luxury-green-950 text-gold-400 rounded uppercase font-bold">
                          {WORKFLOW_STAGES.find(s => s.id === status)?.label || 'Data Received'}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      <div>
                        <h4 className="text-sm font-bold text-white truncate font-display leading-tight">
                          {projectName.trim() || 'Couple Film Title'}
                        </h4>
                        <p className="text-[9px] text-gold-400/80 font-mono tracking-wider uppercase mt-0.5">
                          {(groomName.trim() || brideName.trim()) ? `${groomName || 'Groom'} & ${brideName || 'Bride'}` : 'Groom & Bride Name'}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[9px] text-gray-400">
                        <div>
                          <span className="text-gray-600 block">Studio Partner</span>
                          <span className="text-gray-300 font-semibold truncate block">
                            {studios.find(s => s.id === studioId)?.name || 'Direct Client'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 block">Lead Editor</span>
                          <span className="text-gray-300 font-semibold truncate block">
                            {editors.find(e => e.id === assignedEditorId)?.name || 'Unassigned'}
                          </span>
                        </div>
                      </div>

                      <div className="border-t border-luxury-green-800/10 pt-3 flex justify-between text-[9px] text-gray-500 font-mono">
                        <span className="flex items-center space-x-1">
                          <CalendarIcon className="w-3 h-3 text-luxury-green-500" />
                          <span>{deliveryDate || 'YYYY-MM-DD'}</span>
                        </span>
                        <span>{selectedFunctions.length} deliverables</span>
                      </div>
                    </div>
                  </div>

                  {/* Aesthetic quote / instructions info */}
                  <div className="p-4 rounded-2xl bg-charcoal-900/50 border border-luxury-green-800/10 text-[10px] text-gray-500 leading-relaxed font-mono">
                    <Info className="w-4 h-4 text-gold-500 inline mr-1 shrink-0 -mt-0.5" />
                    <span>Preset cover options are standard copyright-free photography. You can also paste any raw image URL or upload client photos directly.</span>
                  </div>
                </div>

                {/* RIGHT COLUMN: MAIN TABBED CONFIG FORM */}
                <div className="w-full lg:w-3/5 p-6 flex flex-col justify-between bg-charcoal-900">
                  <div>
                    {/* Header Controls */}
                    <div className="flex items-center justify-between pb-4 border-b border-luxury-green-800/10">
                      <div>
                        <h2 className="text-xl font-black text-white font-display">
                          {editingProject ? 'Studio Spec Update' : 'New Wedding Registry'}
                        </h2>
                        <p className="text-xs text-gray-400 mt-0.5">Configure cinematic specs, storage references, & financial sheets.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="w-8 h-8 rounded-full bg-charcoal-950 text-gray-400 hover:text-white border border-white/5 flex items-center justify-center cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Validation Warnings */}
                    {modalValidationError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 font-mono text-[11px] mt-4 animate-pulse">
                        ⚠️ {modalValidationError}
                      </div>
                    )}

                    {/* Unified 8-Section Scroll Area */}
                    <div className="mt-5 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
                      
                      {/* FORM INTERCEPTOR ON KEY DOWN FOR PREVENTING AUTO SUBMIT ON ENTER KEY */}
                      <div 
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const target = e.target as HTMLElement;
                            // Prevent default submit when enter is pressed inside regular inputs
                            if (target.tagName === 'INPUT') {
                              e.preventDefault();
                              e.stopPropagation();
                            }
                          }
                        }}
                        className="space-y-4"
                      >
                        {/* 1. PROJECT NAME */}
                        <div className="p-4 bg-charcoal-950/40 rounded-2xl border border-luxury-green-800/10 space-y-3">
                          <div className="flex items-center space-x-2">
                            <span className="w-5 h-5 rounded-full bg-gold-500/20 text-gold-400 border border-gold-500/30 flex items-center justify-center text-[10px] font-bold font-mono">1</span>
                            <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest">Project Name <span className="text-red-500">*</span></label>
                          </div>
                          <input 
                            type="text" 
                            placeholder="e.g. Rohan & Riya Destination Wedding Film" 
                            value={projectName} 
                            onChange={(e) => { setProjectName(e.target.value); setModalValidationError(''); }} 
                            className="w-full bg-charcoal-950 border border-luxury-green-800/30 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-gold-500/30" 
                          />
                        </div>

                        {/* 2. COUPLE NAME & PHOTO UPLOAD */}
                        <div className="p-4 bg-charcoal-950/40 rounded-2xl border border-luxury-green-800/10 space-y-4">
                          <div className="flex items-center space-x-2">
                            <span className="w-5 h-5 rounded-full bg-gold-500/20 text-gold-400 border border-gold-500/30 flex items-center justify-center text-[10px] font-bold font-mono">2</span>
                            <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest">Couple Name & Photo Upload <span className="text-red-500">*</span></label>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                              <div>
                                <label className="block text-[9px] font-mono text-gray-500 uppercase tracking-wider mb-1">Groom Name <span className="text-red-500">*</span></label>
                                <input 
                                  type="text" 
                                  placeholder="Groom Name" 
                                  value={groomName} 
                                  onChange={(e) => { setGroomName(e.target.value); setModalValidationError(''); }} 
                                  className="w-full bg-charcoal-950 border border-luxury-green-800/20 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-gold-500/30" 
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-mono text-gray-500 uppercase tracking-wider mb-1">Bride Name <span className="text-red-500">*</span></label>
                                <input 
                                  type="text" 
                                  placeholder="Bride Name" 
                                  value={brideName} 
                                  onChange={(e) => { setBrideName(e.target.value); setModalValidationError(''); }} 
                                  className="w-full bg-charcoal-950 border border-luxury-green-800/20 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-gold-500/30" 
                                />
                              </div>
                            </div>

                            <div className="flex flex-col justify-between">
                              <label className="block text-[9px] font-mono text-gray-500 uppercase tracking-wider mb-1">Couple Photo</label>
                              <div className="h-24">
                                {couplePhoto ? (
                                  <div className="relative w-full h-full rounded-xl overflow-hidden border border-gold-500/30 group">
                                    <img src={couplePhoto} alt="Couple Preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <button 
                                        type="button" 
                                        onClick={() => setCouplePhoto('')} 
                                        className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-[8px] uppercase font-mono cursor-pointer transition-colors"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <label className="w-full h-full rounded-xl border border-dashed border-luxury-green-700/40 hover:border-gold-500/30 bg-charcoal-950 flex flex-col items-center justify-center p-2 cursor-pointer transition-colors">
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
                                    <span className="text-[10px] text-gray-300 font-bold">Upload Couple Photo</span>
                                    <span className="text-[8px] text-gray-500 mt-1">PNG, JPG, JPEG</span>
                                  </label>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-luxury-green-800/5">
                            <span className="text-[8px] font-mono text-gold-400/80 block mb-1">Or Choose a Royal Preset Cover:</span>
                            <div className="grid grid-cols-4 gap-1">
                              {DEFAULT_COVERS.map((preset) => (
                                <button 
                                  key={preset.name} 
                                  type="button" 
                                  onClick={() => setCouplePhoto(preset.url)} 
                                  className={`relative h-8 rounded overflow-hidden cursor-pointer hover:ring-2 hover:ring-gold-500/30 transition-all ${couplePhoto === preset.url ? 'ring-2 ring-gold-500' : ''}`}
                                >
                                  <img src={preset.url} alt="" className="w-full h-full object-cover" />
                                  <span className="absolute inset-0 bg-black/40 flex items-center justify-center text-[6px] text-white font-bold">{preset.name}</span>
                                </button>
                              ))}
                            </div>
                            <input 
                              type="text" 
                              placeholder="Or paste direct web image URL..." 
                              value={couplePhoto} 
                              onChange={(e) => setCouplePhoto(e.target.value)} 
                              className="w-full bg-charcoal-950 border border-luxury-green-800/20 rounded-lg px-2.5 py-1.5 text-[9px] text-white focus:outline-none mt-2" 
                            />
                          </div>
                        </div>

                        {/* 3. STUDIO PARTNER */}
                        <div className="p-4 bg-charcoal-950/40 rounded-2xl border border-luxury-green-800/10 space-y-3">
                          <div className="flex items-center space-x-2">
                            <span className="w-5 h-5 rounded-full bg-gold-500/20 text-gold-400 border border-gold-500/30 flex items-center justify-center text-[10px] font-bold font-mono">3</span>
                            <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest">Studio Partner Account</label>
                          </div>
                          {userRole === 'studio' ? (
                            <div className="w-full bg-charcoal-950/50 border border-luxury-green-800/20 rounded-xl px-4 py-2.5 text-xs text-gray-400 select-none font-medium">
                              {studios.find(s => s.id === studioId)?.name || 'Your Studio Partner Account'}
                            </div>
                          ) : (
                            <select 
                              value={studioId} 
                              onChange={(e) => setStudioId(e.target.value)} 
                              className="w-full bg-charcoal-950 border border-luxury-green-800/30 rounded-xl px-4 py-2.5 text-xs text-gray-300 focus:outline-none focus:border-gold-500/30 cursor-pointer"
                            >
                              {studios.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                          )}
                        </div>

                        {/* 5. PROJECT START DATE */}
                        <div className="p-4 bg-charcoal-950/40 rounded-2xl border border-luxury-green-800/10 space-y-3">
                          <div className="flex items-center space-x-2">
                            <span className="w-5 h-5 rounded-full bg-gold-500/20 text-gold-400 border border-gold-500/30 flex items-center justify-center text-[10px] font-bold font-mono">5</span>
                            <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest">Project Start Date & Deadline <span className="text-red-500">*</span></label>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[9px] font-mono text-gray-500 uppercase mb-1">Start Date (Shoot Date) <span className="text-red-500">*</span></label>
                              <input 
                                type="date" 
                                value={shootDate} 
                                onChange={(e) => { setShootDate(e.target.value); setModalValidationError(''); }} 
                                onClick={(e) => { try { e.currentTarget.showPicker(); } catch (err) {} }}
                                className="w-full bg-charcoal-950 border border-luxury-green-800/30 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-gold-500/30 cursor-pointer" 
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-mono text-gray-500 uppercase mb-1">Delivery Deadline <span className="text-red-500">*</span></label>
                              <input 
                                type="date" 
                                value={deliveryDate} 
                                onChange={(e) => { setDeliveryDate(e.target.value); setModalValidationError(''); }} 
                                onClick={(e) => { try { e.currentTarget.showPicker(); } catch (err) {} }}
                                className="w-full bg-charcoal-950 border border-luxury-green-800/30 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-gold-500/30 cursor-pointer" 
                              />
                            </div>
                          </div>
                        </div>

                        {/* 6. ASSIGN LEAD EDITOR */}
                        <div className="p-4 bg-charcoal-950/40 rounded-2xl border border-luxury-green-800/10 space-y-3">
                          <div className="flex items-center space-x-2">
                            <span className="w-5 h-5 rounded-full bg-gold-500/20 text-gold-400 border border-gold-500/30 flex items-center justify-center text-[10px] font-bold font-mono">6</span>
                            <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest">Assign Lead Editor & Setup Status</label>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-[9px] font-mono text-gray-500 uppercase mb-1">Lead Editor</label>
                              {userRole === 'studio' ? (
                                <div className="w-full bg-charcoal-950/50 border border-luxury-green-800/20 rounded-xl px-3 py-2 text-xs text-gray-400 select-none font-medium">
                                  {editors.find(ed => ed.id === assignedEditorId)?.name || 'Unassigned'}
                                </div>
                              ) : (
                                <select 
                                  value={assignedEditorId} 
                                  onChange={(e) => setAssignedEditorId(e.target.value)} 
                                  className="w-full bg-charcoal-950 border border-luxury-green-800/30 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none cursor-pointer"
                                >
                                  <option value="">Unassigned</option>
                                  {editors.map(ed => <option key={ed.id} value={ed.id}>{ed.name}</option>)}
                                </select>
                              )}
                            </div>

                            <div>
                              <label className="block text-[9px] font-mono text-gray-500 uppercase mb-1">Workflow Stage</label>
                              {userRole === 'studio' ? (
                                <div className="w-full bg-charcoal-950/50 border border-luxury-green-800/20 rounded-xl px-3 py-2 text-xs text-gray-400 select-none font-medium capitalize">
                                  {WORKFLOW_STAGES.find(s => s.id === status)?.label || 'Data Received'}
                                </div>
                              ) : (
                                <select 
                                  value={status} 
                                  onChange={(e) => setStatus(e.target.value as ProjectStatus)} 
                                  className="w-full bg-charcoal-950 border border-luxury-green-800/30 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none cursor-pointer"
                                >
                                  {WORKFLOW_STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                                </select>
                              )}
                            </div>

                            <div>
                              <label className="block text-[9px] font-mono text-gray-500 uppercase mb-1">Priority</label>
                              <select 
                                value={priority} 
                                onChange={(e) => setPriority(e.target.value as ProjectPriority)} 
                                className="w-full bg-charcoal-950 border border-luxury-green-800/30 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none cursor-pointer"
                              >
                                {PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                              </select>
                            </div>
                          </div>

                          {/* Split Work & Payment option */}
                          {userRole !== 'studio' && (
                            <div className="pt-3 border-t border-luxury-green-800/10 space-y-3">
                              <label className="flex items-center space-x-2.5 cursor-pointer group">
                                <input 
                                  type="checkbox" 
                                  checked={isSplitProject}
                                  onChange={(e) => setIsSplitProject(e.target.checked)}
                                  className="w-4.5 h-4.5 rounded border-luxury-green-800/30 text-gold-500 bg-charcoal-950 focus:ring-0 cursor-pointer"
                                />
                                <span className="text-xs text-gray-300 font-semibold group-hover:text-gold-400 transition-colors">
                                  Split work and payment with a Secondary Editor?
                                </span>
                              </label>

                              {isSplitProject && (
                                <div className="p-3 bg-charcoal-950/60 rounded-xl border border-gold-500/10 space-y-3">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-[9px] font-mono text-gold-400 uppercase mb-1">Secondary Editor</label>
                                      <select 
                                        value={secondEditorId} 
                                        onChange={(e) => setSecondEditorId(e.target.value)} 
                                        className="w-full bg-charcoal-900 border border-gold-500/20 rounded-lg px-3 py-1.5 text-xs text-gray-300 focus:outline-none cursor-pointer"
                                      >
                                        <option value="">Select Second Editor...</option>
                                        {editors.filter(ed => ed.id !== assignedEditorId).map(ed => (
                                          <option key={ed.id} value={ed.id}>{ed.name}</option>
                                        ))}
                                      </select>
                                    </div>

                                    <div>
                                      <label className="block text-[9px] font-mono text-gold-400 uppercase mb-1">Payment Split Ratio</label>
                                      <select 
                                        value={splitPreset} 
                                        onChange={(e) => setSplitPreset(e.target.value)} 
                                        className="w-full bg-charcoal-900 border border-gold-500/20 rounded-lg px-3 py-1.5 text-xs text-gray-300 focus:outline-none cursor-pointer"
                                      >
                                        <option value="50-50">Equal Split (50% / 50%)</option>
                                        <option value="60-40">Primary (60%) / Secondary (40%)</option>
                                        <option value="70-30">Primary (70%) / Secondary (30%)</option>
                                        <option value="80-20">Primary (80%) / Secondary (20%)</option>
                                        <option value="custom">Custom Split (Enter manual amounts)</option>
                                      </select>
                                    </div>
                                  </div>

                                  <div className="p-3 bg-charcoal-950/90 rounded-xl border border-gold-500/5 space-y-2">
                                    <div className="flex justify-between items-center text-[10px] font-mono text-gray-400">
                                      <span>Total Editor Budget:</span>
                                      <span className="text-white font-bold font-mono">₹{editorPayment.toLocaleString('en-IN')}</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-luxury-green-800/10">
                                      <div>
                                        <label className="block text-[9px] text-gray-500 font-mono">Lead Editor Share</label>
                                        <div className="flex items-center space-x-1.5 mt-1">
                                          <span className="text-xs text-gray-500">₹</span>
                                          {splitPreset === 'custom' ? (
                                            <input 
                                              type="number"
                                              value={firstEditorShare}
                                              onChange={(e) => {
                                                const val = Number(e.target.value);
                                                setFirstEditorShare(val);
                                                setSecondEditorShare(Math.max(0, editorPayment - val));
                                              }}
                                              className="w-full bg-charcoal-900 border border-luxury-green-800/20 rounded px-2 py-0.5 text-xs text-white focus:outline-none"
                                            />
                                          ) : (
                                            <span className="text-xs font-mono font-bold text-white">{firstEditorShare.toLocaleString('en-IN')}</span>
                                          )}
                                        </div>
                                      </div>
                                      
                                      <div>
                                        <label className="block text-[9px] text-gray-500 font-mono font-semibold">Secondary Editor Share</label>
                                        <div className="flex items-center space-x-1.5 mt-1">
                                          <span className="text-xs text-gray-500">₹</span>
                                          {splitPreset === 'custom' ? (
                                            <input 
                                              type="number"
                                              value={secondEditorShare}
                                              onChange={(e) => {
                                                const val = Number(e.target.value);
                                                setSecondEditorShare(val);
                                                setFirstEditorShare(Math.max(0, editorPayment - val));
                                              }}
                                              className="w-full bg-charcoal-900 border border-luxury-green-800/20 rounded px-2 py-0.5 text-xs text-white focus:outline-none"
                                            />
                                          ) : (
                                            <span className="text-xs font-mono font-bold text-white">{secondEditorShare.toLocaleString('en-IN')}</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* 4. SELECT CINEMATIC DELIVERABLES */}
                        <div className="p-4 bg-charcoal-950/40 rounded-2xl border border-luxury-green-800/10 space-y-3">
                          <div className="flex items-center space-x-2">
                            <span className="w-5 h-5 rounded-full bg-gold-500/20 text-gold-400 border border-gold-500/30 flex items-center justify-center text-[10px] font-bold font-mono">4</span>
                            <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest">Select Cinematic Deliverables <span className="text-red-500">*</span></label>
                          </div>
                          
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {availableFunctions.map((func) => {
                              const isSelected = selectedFunctions.includes(func);
                              return (
                                <div
                                  key={func}
                                  onClick={() => {
                                    setSelectedFunctions(isSelected ? selectedFunctions.filter(f => f !== func) : [...selectedFunctions, func]);
                                    setModalValidationError('');
                                  }}
                                  className={`flex items-center justify-between p-2 px-3 rounded-xl border cursor-pointer select-none transition-all ${
                                    isSelected ? 'bg-gold-500/10 border-gold-400 text-white' : 'bg-charcoal-950 border-luxury-green-800/15 text-gray-400 hover:border-gold-500/20'
                                  }`}
                                >
                                  <span className="text-[11px] font-semibold truncate">{func}</span>
                                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[9px] shrink-0 ml-1.5 ${isSelected ? 'bg-gold-400 border-gold-400 text-charcoal-950 font-bold' : 'border-gray-600'}`}>
                                    {isSelected ? "✓" : "+"}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="flex items-center bg-charcoal-950 rounded-xl border border-luxury-green-800/20 p-1 pl-3 mt-2">
                            <input 
                              type="text" 
                              placeholder="Add custom deliverable..." 
                              value={customFunctionInput} 
                              onChange={(e) => setCustomFunctionInput(e.target.value)} 
                              className="flex-1 bg-transparent border-0 outline-none text-xs text-white py-1" 
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
                              className="px-3 py-1 bg-gold-500 hover:bg-gold-400 text-charcoal-950 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                            >
                              Add
                            </button>
                          </div>
                        </div>

                        {/* 7. LEDGER SHEET */}
                        <div className="p-4 bg-charcoal-950/40 rounded-2xl border border-luxury-green-800/10 space-y-3">
                          <div className="flex items-center space-x-2">
                            <span className="w-5 h-5 rounded-full bg-gold-500/20 text-gold-400 border border-gold-500/30 flex items-center justify-center text-[10px] font-bold font-mono">7</span>
                            <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest">💵 Ledger Sheet (Finance)</label>
                          </div>
                          
                          {userRole !== 'studio' ? (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div>
                                  <label className="block text-[9px] text-gray-500 mb-1 uppercase font-mono">Total Contract ₹</label>
                                  <input 
                                    type="number" 
                                    value={projectAmount} 
                                    onChange={(e) => setProjectAmount(Number(e.target.value))} 
                                    className="w-full bg-charcoal-900 border border-luxury-green-800/20 rounded-lg px-3 py-2 text-xs text-white focus:outline-none" 
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] text-gray-500 mb-1 uppercase font-mono">Editor Payment ₹</label>
                                  <input 
                                    type="number" 
                                    value={editorPayment} 
                                    onChange={(e) => setEditorPayment(Number(e.target.value))} 
                                    className="w-full bg-charcoal-900 border border-luxury-green-800/20 rounded-lg px-3 py-2 text-xs text-white focus:outline-none" 
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] text-gray-500 mb-1 uppercase font-mono">Other Costs ₹</label>
                                  <input 
                                    type="number" 
                                    value={otherExpenses} 
                                    onChange={(e) => setOtherExpenses(Number(e.target.value))} 
                                    className="w-full bg-charcoal-900 border border-luxury-green-800/20 rounded-lg px-3 py-2 text-xs text-white focus:outline-none" 
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] text-gray-500 mb-1 uppercase font-mono">Advance Paid ₹</label>
                                  <input 
                                    type="number" 
                                    value={advancePayment} 
                                    onChange={(e) => setAdvancePayment(Number(e.target.value))} 
                                    className="w-full bg-charcoal-900 border border-luxury-green-800/20 rounded-lg px-3 py-2 text-xs text-white focus:outline-none" 
                                  />
                                </div>
                              </div>
                              
                              <div className="p-3 bg-charcoal-950 rounded-xl border border-luxury-green-800/10 flex justify-between text-[11px] font-mono text-gray-300">
                                <span>Collection Due: <strong className="text-red-400 font-bold">₹{(projectAmount - advancePayment).toLocaleString('en-IN')}</strong></span>
                                <span>Est. Profit Margin: <strong className="text-emerald-400 font-bold">₹{(projectAmount - editorPayment - otherExpenses).toLocaleString('en-IN')}</strong></span>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="bg-charcoal-900/50 p-3 rounded-xl border border-luxury-green-800/5 text-xs text-gray-400 font-mono">
                                Budget records are private and managed securely by administrators.
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 8. INSTRUCTIONS */}
                        <div className="p-4 bg-charcoal-950/40 rounded-2xl border border-luxury-green-800/10 space-y-3">
                          <div className="flex items-center space-x-2">
                            <span className="w-5 h-5 rounded-full bg-gold-500/20 text-gold-400 border border-gold-500/30 flex items-center justify-center text-[10px] font-bold font-mono">8</span>
                            <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest">📝 Special Instructions</label>
                          </div>
                          <textarea
                            rows={3}
                            placeholder="Enter wedding sequence details, editing rules, song preferences, or deliverables guidance..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full bg-charcoal-950 border border-luxury-green-800/30 rounded-xl px-4 py-2.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gold-500/30"
                          />
                        </div>

                        {/* 9. CUSTOM MILESTONES ROADMAP */}
                        <div className="p-4 bg-charcoal-950/40 rounded-2xl border border-luxury-green-800/10 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="w-5 h-5 rounded-full bg-gold-500/20 text-gold-400 border border-gold-500/30 flex items-center justify-center text-[10px] font-bold font-mono">9</span>
                              <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest">🏆 Custom Milestone Roadmap</label>
                            </div>
                            {modalCustomMilestones.length > 0 && (
                              <span className="text-[10px] font-mono text-gray-500">
                                {modalCustomMilestones.filter(m => m.completed).length}/{modalCustomMilestones.length} Completed
                              </span>
                            )}
                          </div>

                          {/* Progress Bar */}
                          {modalCustomMilestones.length > 0 && (
                            <div className="w-full bg-charcoal-950 h-1.5 rounded-full overflow-hidden border border-luxury-green-800/10">
                              <div 
                                className="bg-gold-500 h-full transition-all duration-300"
                                style={{ 
                                  width: `${(modalCustomMilestones.filter(m => m.completed).length / modalCustomMilestones.length) * 100}%` 
                                }}
                              />
                            </div>
                          )}

                          {/* Add Custom Milestone Form */}
                          <div className="flex space-x-2">
                            <input
                              type="text"
                              placeholder="Add custom milestone (e.g., Drone footage color master)..."
                              value={newModalMilestoneInput}
                              onChange={(e) => setNewModalMilestoneInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const trimmed = newModalMilestoneInput.trim();
                                  if (trimmed) {
                                    setModalCustomMilestones([
                                      ...modalCustomMilestones,
                                      { id: `milestone-${Date.now()}`, label: trimmed, completed: false }
                                    ]);
                                    setNewModalMilestoneInput('');
                                  }
                                }
                              }}
                              className="flex-1 bg-charcoal-950 border border-luxury-green-800/30 rounded-xl px-3.5 py-2 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gold-500/30"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const trimmed = newModalMilestoneInput.trim();
                                if (trimmed) {
                                  setModalCustomMilestones([
                                    ...modalCustomMilestones,
                                    { id: `milestone-${Date.now()}`, label: trimmed, completed: false }
                                  ]);
                                  setNewModalMilestoneInput('');
                                }
                              }}
                              className="px-3 bg-charcoal-950 hover:bg-luxury-green-800/30 border border-luxury-green-800/30 text-gold-400 rounded-xl flex items-center justify-center cursor-pointer transition-all"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Milestones list scroll container */}
                          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                            {modalCustomMilestones.length > 0 ? (
                              modalCustomMilestones.map((m, idx) => (
                                <div 
                                  key={m.id} 
                                  className="p-2.5 bg-charcoal-950/60 hover:bg-charcoal-950 rounded-xl border border-luxury-green-800/5 flex justify-between items-center transition-all group/item"
                                >
                                  <label className="flex items-center space-x-2 flex-1 cursor-pointer select-none">
                                    <input 
                                      type="checkbox" 
                                      checked={m.completed} 
                                      onChange={() => {
                                        setModalCustomMilestones(
                                          modalCustomMilestones.map(item => 
                                            item.id === m.id 
                                              ? { ...item, completed: !item.completed, completedAt: !item.completed ? new Date().toISOString() : undefined } 
                                              : item
                                          )
                                        );
                                      }}
                                      className="w-3.5 h-3.5 rounded border-luxury-green-800/30 text-gold-500 focus:ring-gold-500/50 bg-charcoal-900 cursor-pointer"
                                    />
                                    <div className="flex flex-col">
                                      <span className={`text-xs ${m.completed ? 'line-through text-gray-500 font-normal' : 'text-gray-200 font-medium'}`}>
                                        {m.label}
                                      </span>
                                      {m.completed && m.completedAt && (
                                        <span className="text-[8px] text-emerald-400 font-mono">
                                          Completed: {new Date(m.completedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                        </span>
                                      )}
                                    </div>
                                  </label>
                                  
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setModalCustomMilestones(modalCustomMilestones.filter(item => item.id !== m.id));
                                    }}
                                    className="p-1 text-gray-600 hover:text-red-400 rounded hover:bg-red-500/10 cursor-pointer transition-colors"
                                    title="Remove Milestone"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-6 text-gray-600 text-xs font-mono">
                                No milestones added. Enter a title above to define custom project stages.
                              </div>
                            )}
                          </div>
                        </div>

                        {/* PRESERVATION SECTION: OPTIONAL PHYSICAL STORAGE & BACKUP DATA */}
                        <details className="group border border-luxury-green-800/15 bg-charcoal-950/20 rounded-2xl overflow-hidden mt-4">
                          <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-charcoal-950/40 select-none">
                            <div className="flex items-center space-x-2">
                              <span className="text-gold-400 text-xs">📦</span>
                              <span className="text-xs font-semibold text-gray-400 group-open:text-white transition-colors">Physical Storage & Backup References (Optional)</span>
                            </div>
                            <span className="text-xs text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                          </summary>
                          <div className="p-4 pt-0 space-y-4 border-t border-luxury-green-800/5 mt-2">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[9px] font-mono text-gray-500 uppercase mb-1">Hard Disk Reference Name</label>
                                <input 
                                  type="text" 
                                  placeholder="e.g. WD BLACK 4TB - #04" 
                                  value={hardDiskName} 
                                  onChange={(e) => setHardDiskName(e.target.value)} 
                                  className="w-full bg-charcoal-950 border border-luxury-green-800/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none" 
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-mono text-gray-500 uppercase mb-1">Raw Footage Size</label>
                                <input 
                                  type="text" 
                                  placeholder="e.g. 1.8 TB" 
                                  value={dataSize} 
                                  onChange={(e) => setDataSize(e.target.value)} 
                                  className="w-full bg-charcoal-950 border border-luxury-green-800/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none" 
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[9px] font-mono text-gray-500 uppercase mb-1">Google Drive Link</label>
                                <input 
                                  type="url" 
                                  placeholder="https://drive.google.com/..." 
                                  value={googleDriveLink} 
                                  onChange={(e) => setGoogleDriveLink(e.target.value)} 
                                  className="w-full bg-charcoal-950 border border-luxury-green-800/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none" 
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-mono text-gray-500 uppercase mb-1">Physical Backup Status</label>
                                <select 
                                  value={backupStatus} 
                                  onChange={(e) => setBackupStatus(e.target.value as 'pending' | 'backed_up')} 
                                  className="w-full bg-charcoal-950 border border-luxury-green-800/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
                                >
                                  <option value="pending">⏳ Pending Backup</option>
                                  <option value="backed_up">✅ Backed Up Safely</option>
                                </select>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="block text-[9px] font-mono text-gray-500 uppercase mb-1">Raw folder</label>
                                <input 
                                  type="text" 
                                  placeholder="Folder name" 
                                  value={rawDataFolder} 
                                  onChange={(e) => setRawDataFolder(e.target.value)} 
                                  className="w-full bg-charcoal-950 border border-luxury-green-800/20 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none" 
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-mono text-gray-500 uppercase mb-1">Delivery folder</label>
                                <input 
                                  type="text" 
                                  placeholder="Folder name" 
                                  value={deliveryFolder} 
                                  onChange={(e) => setDeliveryFolder(e.target.value)} 
                                  className="w-full bg-charcoal-950 border border-luxury-green-800/20 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none" 
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-mono text-gray-500 uppercase mb-1">Final Export folder</label>
                                <input 
                                  type="text" 
                                  placeholder="Folder name" 
                                  value={finalExportFolder} 
                                  onChange={(e) => setFinalExportFolder(e.target.value)} 
                                  className="w-full bg-charcoal-950 border border-luxury-green-800/20 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none" 
                                />
                              </div>
                            </div>
                          </div>
                        </details>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="flex justify-between items-center pt-5 border-t border-luxury-green-800/10 mt-6 select-none">
                    <button 
                      type="button" 
                      onClick={() => setIsModalOpen(false)} 
                      className="px-4 py-2 text-xs text-gray-500 hover:text-white cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                    
                    <button 
                      type="button" 
                      onClick={handleSaveProject} 
                      className="px-6 py-2.5 bg-gradient-to-r from-gold-500 to-gold-400 text-charcoal-950 font-bold text-xs rounded-xl shadow-[0_4px_12px_rgba(212,175,55,0.2)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer transition-all"
                    >
                      {editingProject ? 'Apply Specifications' : 'Confirm & Create'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (() => {
          const projectToDelete = projects.find(p => p.id === deleteConfirmId);
          if (!projectToDelete) return null;
          
          const isConfirmed = confirmDeleteText.trim().toUpperCase() === 'DELETE';

          return (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
                <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={() => setDeleteConfirmId(null)} />

                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform rounded-3xl bg-charcoal-900 border border-red-500/20 shadow-[0_25px_60px_rgba(239,68,68,0.12)] relative z-10 font-sans"
                >
                  {/* Top Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-red-500/10">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20">
                        <Trash2 className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[9px] font-mono font-bold tracking-widest text-red-400 uppercase bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/10">
                          Critical Action
                        </span>
                        <h3 className="text-base font-bold text-white font-display mt-1">De-Authorize Wedding Record</h3>
                      </div>
                    </div>
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="p-1.5 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Project Info Block */}
                  <div className="mt-5 p-4 rounded-2xl bg-charcoal-950/80 border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-xl pointer-events-none" />
                    
                    <span className="text-[9px] font-mono uppercase tracking-wider text-gold-500/60 block">Target Registry</span>
                    <h4 className="text-sm font-bold text-white mt-1 font-display">
                      {projectToDelete.projectName || `${projectToDelete.brideName} & ${projectToDelete.groomName}`}
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-white/5">
                      <div>
                        <span className="text-[9px] text-gray-500 uppercase tracking-wider font-mono block">Studio Partner</span>
                        <span className="text-[11px] text-gray-300 font-medium truncate block">{projectToDelete.studioName || 'Direct'}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-500 uppercase tracking-wider font-mono block">Editor Assigned</span>
                        <span className="text-[11px] text-gray-300 font-medium truncate block">{projectToDelete.assignedEditorName || 'Unassigned'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Warning list */}
                  <div className="mt-5 space-y-2.5">
                    <h5 className="text-[10px] uppercase font-mono tracking-wider text-red-400/80 font-bold">Associated Data Deletion:</h5>
                    <ul className="text-xs text-gray-400 space-y-2 pl-1">
                      <li className="flex items-start space-x-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                        <span>All video specifications, drive links, and backup statuses are scrubbed.</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                        <span>Revision logs & history notes will be lost permanently.</span>
                      </li>
                    </ul>
                  </div>

                  {/* Typing confirmation input */}
                  <div className="mt-6 pt-5 border-t border-white/5">
                    <label className="block text-[11px] font-medium text-gray-300 mb-2 font-mono">
                      To confirm deletion, please type <span className="text-red-400 font-bold font-sans">DELETE</span> below:
                    </label>
                    <input
                      type="text"
                      value={confirmDeleteText}
                      onChange={(e) => setConfirmDeleteText(e.target.value)}
                      placeholder="Type DELETE to authorize"
                      className="w-full px-4 py-3 rounded-xl bg-charcoal-950 border border-white/10 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-red-500/40 focus:ring-1 focus:ring-red-500/30 transition-all font-mono"
                    />
                  </div>

                  {/* Footer Actions */}
                  <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(null)}
                      className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!isConfirmed}
                      onClick={async () => {
                        if (deleteConfirmId && isConfirmed) {
                          try {
                            await onDeleteProject(deleteConfirmId);
                            setDeleteConfirmId(null);
                            setSelectedProject(null);
                            setIsDetailOpen(false);
                          } catch (error) {
                            console.error("Delete failed:", error);
                          }
                        }
                      }}
                      className={`px-5 py-2.5 font-bold text-xs rounded-xl transition-all flex items-center space-x-2 cursor-pointer ${
                        isConfirmed 
                        ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-[0_4px_15px_rgba(239,68,68,0.25)] hover:scale-[1.02] active:scale-[0.99]' 
                        : 'bg-white/5 border border-white/5 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Permanently Delete</span>
                    </button>
                  </div>
                </motion.div>
              </div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Custom Revision Delete Confirmation Modal */}
      <AnimatePresence>
        {revisionToDeleteId && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
              <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={() => setRevisionToDeleteId(null)} />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform rounded-2xl bg-charcoal-900 border border-red-500/30 shadow-[0_20px_50px_rgba(239,68,68,0.15)] relative z-10"
              >
                <div className="flex items-start space-x-3">
                  <div className="p-3 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white font-display">Delete Revision Request</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Are you sure you want to permanently delete this revision request? This action cannot be undone.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setRevisionToDeleteId(null)}
                    className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (revisionToDeleteId && onDeleteRevision) {
                        try {
                          await onDeleteRevision(revisionToDeleteId);
                          setRevisionToDeleteId(null);
                        } catch (error) {
                          console.error("Revision delete failed:", error);
                        }
                      }
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold text-xs rounded-xl transition-all shadow-[0_4px_15px_rgba(239,68,68,0.25)] cursor-pointer hover:scale-[1.02] active:scale-[0.99]"
                  >
                    Confirm Delete
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Cinematic Hover Fullscreen Lightbox Scanner */}
      <AnimatePresence>
        {hoveredPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-charcoal-950/95 backdrop-blur-xl p-6 pointer-events-none select-none"
          >
            {/* Visual Header indicator */}
            <div className="absolute top-6 left-6 flex items-center space-x-2.5 bg-black/50 border border-white/5 px-4 py-2 rounded-2xl backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-gold-500"></span>
              </span>
              <span className="text-[10px] font-mono text-gray-300 tracking-widest uppercase">
                Hover Scanner Mode • Move Mouse Away to Close
              </span>
            </div>

            {/* Hovered Photo Wrapper */}
            <motion.div
              initial={{ scale: 0.94, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative max-w-5xl max-h-[80vh] w-full flex items-center justify-center rounded-[32px] overflow-hidden border border-gold-500/20 shadow-[0_25px_60px_-15px_rgba(197,160,89,0.15)] bg-charcoal-900"
            >
              <img
                src={hoveredPhoto.url}
                alt={hoveredPhoto.title}
                className="max-w-full max-h-[80vh] object-contain rounded-[32px] w-auto h-auto shadow-2xl"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-charcoal-950 via-charcoal-950/40 to-transparent p-8 pt-20 flex flex-col items-center text-center">
                <span className="text-[9px] font-mono tracking-widest text-gold-400 uppercase bg-gold-500/10 px-3 py-1 rounded-full border border-gold-500/20 mb-2">
                  The Frame Cut Studio Cinematic Preview
                </span>
                <h3 className="text-xl md:text-3xl font-bold text-white font-display tracking-wide drop-shadow-sm">
                  {hoveredPhoto.title}
                </h3>
                <p className="text-[10px] md:text-xs text-gray-400 font-mono mt-1.5 tracking-wider uppercase">
                  {hoveredPhoto.subtitle}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default ProjectsView;
