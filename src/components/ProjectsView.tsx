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
  ChevronDown,
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
  CheckSquare,
  Zap,
  Play,
  Flame,
  Activity,
  GitCompare,
  ArrowLeftRight,
  ArrowUpDown,
  Calendar,
  FileText,
  Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SwipeableCard from './SwipeableCard';
import ParallaxCard from './ParallaxCard';
import ProjectWorksheetModal from './ProjectWorksheetModal';
import { Project, Studio, Editor, ProjectStatus, ProjectPriority, Revision, UserRole, CalendarEvent } from '../types';
import { useDebounce } from '../hooks/useDebounce';

interface ProjectsViewProps {
  projects: Project[];
  studios: Studio[];
  editors: Editor[];
  revisions: Revision[];
  calendarEvents?: CalendarEvent[];
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
  { id: 'data_received', label: 'In Progress • Received', color: 'text-sky-300', bg: 'bg-sky-500/20 border border-sky-400/30 font-semibold' },
  { id: 'assigned', label: 'In Progress • Assigned', color: 'text-indigo-300', bg: 'bg-indigo-500/20 border border-indigo-400/30 font-semibold' },
  { id: 'editing', label: 'Editing • Active', color: 'text-amber-300', bg: 'bg-amber-500/25 border border-amber-400/40 font-bold' },
  { id: 'review', label: 'In Progress • Review', color: 'text-purple-300', bg: 'bg-purple-500/20 border border-purple-400/30 font-semibold' },
  { id: 'revision', label: 'In Progress • Revision', color: 'text-rose-300', bg: 'bg-rose-500/20 border border-rose-400/40 font-bold' },
  { id: 'rendering', label: 'In Progress • Rendering', color: 'text-teal-300', bg: 'bg-teal-500/20 border border-teal-400/30 font-semibold' },
  { id: 'delivered', label: 'Finished • Delivered', color: 'text-emerald-300', bg: 'bg-emerald-500/25 border border-emerald-400/40 font-bold' },
  { id: 'closed', label: 'Finished • Closed', color: 'text-slate-300', bg: 'bg-slate-800/80 border border-slate-700 font-medium' }
];

const PRIORITIES: { id: ProjectPriority; label: string; color: string; bg: string; glowBorder: string; icon: string }[] = [
  { id: 'low', label: 'Low', color: 'text-emerald-300', bg: 'bg-emerald-500/15 border-emerald-500/30', glowBorder: 'border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.15)]', icon: '🌱' },
  { id: 'medium', label: 'Medium', color: 'text-sky-300', bg: 'bg-sky-500/20 border-sky-400/40', glowBorder: 'border-sky-400/80 shadow-[0_0_15px_rgba(56,189,248,0.25)] ring-1 ring-sky-400/30', icon: '⚡' },
  { id: 'high', label: 'High', color: 'text-amber-300', bg: 'bg-amber-500/20 border-amber-400/50', glowBorder: 'border-amber-400/90 shadow-[0_0_18px_rgba(251,191,36,0.35)] ring-1 ring-amber-400/40', icon: '🔥' },
  { id: 'urgent', label: 'Urgent', color: 'text-rose-300', bg: 'bg-rose-500/20 border-rose-500/50', glowBorder: 'border-rose-500/90 shadow-[0_0_22px_rgba(244,63,94,0.45)] ring-1 ring-rose-500/50 animate-pulse-slow', icon: '🚨' }
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

interface ProjectTimelineProps {
  project: Project;
  calendarEvents?: CalendarEvent[];
  revisions: Revision[];
  onUpdateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  setSelectedProject: React.Dispatch<React.SetStateAction<Project | null>>;
}

const ProjectTimeline: React.FC<ProjectTimelineProps> = ({
  project,
  calendarEvents = [],
  revisions = [],
  onUpdateProject,
  setSelectedProject,
}) => {
  const [viewMode, setViewMode] = useState<'roadmap' | 'stream'>('roadmap');
  const [filterType, setFilterType] = useState<'all' | 'shoot_deadline' | 'calendar' | 'milestones' | 'revisions'>('all');
  const [newMilestoneInput, setNewMilestoneInput] = useState('');
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const allNodes = useMemo(() => {
    const list: {
      id: string;
      title: string;
      date: string;
      formattedDate: string;
      type: 'shoot' | 'deadline' | 'calendar' | 'milestone' | 'revision';
      status: 'completed' | 'in_progress' | 'pending' | 'overdue';
      description?: string;
      color: string;
      milestoneId?: string;
      isCustomMilestone?: boolean;
      revisionStatus?: 'pending' | 'resolved';
    }[] = [];

    const formatDate = (dStr: string) => {
      if (!dStr) return 'TBD';
      try {
        const d = new Date(dStr);
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      } catch {
        return dStr;
      }
    };

    // 1. Shoot Date
    if (project.shootDate) {
      const isPast = project.shootDate <= todayStr;
      list.push({
        id: `node-shoot-${project.id}`,
        title: `${project.eventType || 'Production'} Shoot`,
        date: project.shootDate,
        formattedDate: formatDate(project.shootDate),
        type: 'shoot',
        status: isPast ? 'completed' : 'in_progress',
        description: `Shoot Location: ${project.location || 'Logged in ERP'}`,
        color: '#10b981'
      });
    }

    // 2. Calendar Events linked to project
    const projCalendarEvents = (calendarEvents || []).filter(e => {
      if (e.projectId && e.projectId === project.id) return true;
      if (e.coupleName && project.coupleName && e.coupleName.toLowerCase().trim() === project.coupleName.toLowerCase().trim()) return true;
      if (e.title && project.coupleName && e.title.toLowerCase().includes(project.coupleName.toLowerCase())) return true;
      return false;
    });

    projCalendarEvents.forEach(evt => {
      list.push({
        id: `node-cal-${evt.id}`,
        title: evt.title,
        date: evt.start,
        formattedDate: formatDate(evt.start),
        type: 'calendar',
        status: evt.start <= todayStr ? 'completed' : 'pending',
        description: `Calendar Schedule (${evt.type.toUpperCase()})`,
        color: evt.color || '#3b82f6'
      });
    });

    // 3. Custom Milestones
    if (project.customMilestones && project.customMilestones.length > 0) {
      project.customMilestones.forEach(m => {
        const milestoneDate = m.completedAt ? m.completedAt.split('T')[0] : (project.deliveryDate || project.shootDate || todayStr);
        list.push({
          id: `node-ms-${m.id}`,
          title: m.label,
          date: milestoneDate,
          formattedDate: formatDate(milestoneDate),
          type: 'milestone',
          status: m.completed ? 'completed' : 'pending',
          description: m.completed 
            ? `Done on ${new Date(m.completedAt!).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}` 
            : 'Custom Milestone Target',
          color: m.completed ? '#10b981' : '#f59e0b',
          milestoneId: m.id,
          isCustomMilestone: true
        });
      });
    }

    // 4. Revisions
    const projectRevisions = (revisions || []).filter(r => r.projectId === project.id);
    projectRevisions.forEach(rev => {
      list.push({
        id: `node-rev-${rev.id}`,
        title: `Revision #${rev.revisionNumber}`,
        date: rev.date,
        formattedDate: formatDate(rev.date),
        type: 'revision',
        status: rev.status === 'resolved' ? 'completed' : 'pending',
        description: rev.notes,
        color: rev.status === 'resolved' ? '#10b981' : '#f43f5e',
        revisionStatus: rev.status
      });
    });

    // 5. Final Delivery Deadline
    if (project.deliveryDate) {
      const isDelivered = ['delivered', 'closed'].includes(project.status);
      const isOverdue = !isDelivered && project.deliveryDate < todayStr;
      list.push({
        id: `node-dl-${project.id}`,
        title: 'Final Delivery Deadline',
        date: project.deliveryDate,
        formattedDate: formatDate(project.deliveryDate),
        type: 'deadline',
        status: isDelivered ? 'completed' : (isOverdue ? 'overdue' : 'pending'),
        description: isDelivered ? 'Project Successfully Handed Over' : (isOverdue ? 'Deadline Exceeded' : 'Target Handover Date'),
        color: isDelivered ? '#10b981' : (isOverdue ? '#ef4444' : '#eab308')
      });
    }

    // Sort chronologically
    return list.sort((a, b) => {
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      const typeRank = { shoot: 1, calendar: 2, milestone: 3, revision: 4, deadline: 5 };
      return (typeRank[a.type] || 3) - (typeRank[b.type] || 3);
    });
  }, [project, calendarEvents, revisions, todayStr]);

  const filteredNodes = useMemo(() => {
    if (filterType === 'shoot_deadline') return allNodes.filter(n => n.type === 'shoot' || n.type === 'deadline');
    if (filterType === 'calendar') return allNodes.filter(n => n.type === 'calendar');
    if (filterType === 'milestones') return allNodes.filter(n => n.type === 'milestone');
    if (filterType === 'revisions') return allNodes.filter(n => n.type === 'revision');
    return allNodes;
  }, [allNodes, filterType]);

  const completedCount = useMemo(() => allNodes.filter(n => n.status === 'completed').length, [allNodes]);
  const progressPercent = useMemo(() => {
    if (allNodes.length === 0) return 0;
    return Math.round((completedCount / allNodes.length) * 100);
  }, [completedCount, allNodes.length]);

  const handleToggleMilestone = async (milestoneId: string) => {
    const updated = (project.customMilestones || []).map(item =>
      item.id === milestoneId ? { ...item, completed: !item.completed, completedAt: !item.completed ? new Date().toISOString() : undefined } : item
    );
    await onUpdateProject(project.id, { customMilestones: updated });
    setSelectedProject({ ...project, customMilestones: updated });
  };

  const handleAddMilestone = async () => {
    if (!newMilestoneInput.trim()) return;
    const newStep = {
      id: `milestone-${Date.now()}`,
      label: newMilestoneInput.trim(),
      completed: false
    };
    const updated = [...(project.customMilestones || []), newStep];
    await onUpdateProject(project.id, { customMilestones: updated });
    setSelectedProject({ ...project, customMilestones: updated });
    setNewMilestoneInput('');
  };

  return (
    <div className="p-5 rounded-3xl bg-gradient-to-br from-charcoal-950 via-charcoal-900 to-charcoal-950 border border-luxury-green-800/25 space-y-4 shadow-xl relative overflow-hidden">
      {/* Decorative ambient background blur */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-gold-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div>
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-gold-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-gold-500 font-mono">
              Project Milestones & Calendar Timeline
            </h3>
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5">
            Synchronized roadmap tracking calendar schedules, milestones & deadlines
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-charcoal-950 p-1 rounded-xl border border-luxury-green-800/20 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('roadmap')}
            className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg transition-all cursor-pointer ${
              viewMode === 'roadmap'
                ? 'bg-gold-500 text-charcoal-950 shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Roadmap Track
          </button>
          <button
            type="button"
            onClick={() => setViewMode('stream')}
            className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg transition-all cursor-pointer ${
              viewMode === 'stream'
                ? 'bg-gold-500 text-charcoal-950 shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Chronological Stream
          </button>
        </div>
      </div>

      {/* Progress Metric Bar */}
      <div className="bg-charcoal-950/80 p-3 rounded-2xl border border-luxury-green-800/15 space-y-2 relative z-10">
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="text-gray-400 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-gold-400 inline-block animate-pulse" />
            <span>Overall Roadmap Completion</span>
          </span>
          <span className="text-gold-400 font-bold">
            {completedCount} / {allNodes.length} Nodes ({progressPercent}%)
          </span>
        </div>
        <div className="w-full bg-charcoal-900 h-2 rounded-full overflow-hidden border border-white/5">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-gold-400 to-amber-500 transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Filter Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar relative z-10 text-[10px] font-mono">
        {[
          { id: 'all', label: `All (${allNodes.length})` },
          { id: 'shoot_deadline', label: 'Shoot & Deadline' },
          { id: 'calendar', label: `Calendar (${allNodes.filter(n => n.type === 'calendar').length})` },
          { id: 'milestones', label: `Milestones (${allNodes.filter(n => n.type === 'milestone').length})` },
          { id: 'revisions', label: `Revisions (${allNodes.filter(n => n.type === 'revision').length})` },
        ].map(flt => (
          <button
            key={flt.id}
            type="button"
            onClick={() => setFilterType(flt.id as any)}
            className={`px-2.5 py-1 rounded-lg border whitespace-nowrap transition-all cursor-pointer ${
              filterType === flt.id
                ? 'bg-luxury-green-800/80 text-gold-400 border-gold-500/40 font-bold'
                : 'bg-charcoal-950/50 text-gray-400 border-luxury-green-800/10 hover:border-luxury-green-800/30 hover:text-gray-200'
            }`}
          >
            {flt.label}
          </button>
        ))}
      </div>

      {/* Timeline Content */}
      {filteredNodes.length > 0 ? (
        viewMode === 'roadmap' ? (
          /* Horizontal Visual Roadmap Track */
          <div className="relative z-10 bg-charcoal-950/60 p-4 rounded-2xl border border-luxury-green-800/15">
            <div className="overflow-x-auto custom-scrollbar pb-3 pt-2">
              <div className="min-w-[620px] flex items-center justify-between relative px-6 py-6">
                {/* Horizontal Connecting Line */}
                <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-1 bg-charcoal-800 border-t border-b border-luxury-green-800/20 z-0" />

                {filteredNodes.map((node) => {
                  const isCompleted = node.status === 'completed';
                  const isOverdue = node.status === 'overdue';
                  const isActive = activeNodeId === node.id;

                  return (
                    <div
                      key={node.id}
                      className="relative z-10 flex flex-col items-center group cursor-pointer"
                      onClick={() => setActiveNodeId(isActive ? null : node.id)}
                    >
                      {/* Top Date Badge */}
                      <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-charcoal-900 border border-luxury-green-800/20 text-gray-300 mb-3 shadow-md">
                        {node.formattedDate}
                      </span>

                      {/* Node Icon Circle */}
                      <motion.div
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.95 }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all shadow-lg ${
                          isCompleted
                            ? 'bg-emerald-950 border-emerald-500 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                            : isOverdue
                            ? 'bg-rose-950 border-rose-500 text-rose-400 shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                            : 'bg-charcoal-900 border-gold-500/50 text-gold-400 hover:border-gold-400'
                        }`}
                        style={{ backgroundColor: isActive ? `${node.color}22` : undefined }}
                      >
                        {node.type === 'shoot' && <Clapperboard className="w-4 h-4" />}
                        {node.type === 'calendar' && <CalendarIcon className="w-4 h-4" />}
                        {node.type === 'milestone' && (isCompleted ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <CheckSquare className="w-4 h-4" />)}
                        {node.type === 'revision' && <FileEdit className="w-4 h-4" />}
                        {node.type === 'deadline' && (isCompleted ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Clock className="w-4 h-4" />)}
                      </motion.div>

                      {/* Node Title & Type Pill */}
                      <div className="mt-3 text-center max-w-[110px]">
                        <span className="text-[10px] font-bold text-white block truncate leading-tight">
                          {node.title}
                        </span>
                        <span className={`inline-block text-[8px] font-mono px-1.5 py-0.2 mt-1 rounded uppercase tracking-wider ${
                          node.type === 'shoot' ? 'bg-emerald-500/15 text-emerald-400' :
                          node.type === 'calendar' ? 'bg-blue-500/15 text-blue-400' :
                          node.type === 'milestone' ? 'bg-amber-500/15 text-amber-400' :
                          node.type === 'revision' ? 'bg-rose-500/15 text-rose-400' :
                          'bg-purple-500/15 text-purple-400'
                        }`}>
                          {node.type}
                        </span>
                      </div>

                      {/* Quick Interactive Check Box for Custom Milestones */}
                      {node.isCustomMilestone && node.milestoneId && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleMilestone(node.milestoneId!);
                          }}
                          className={`mt-1.5 px-2 py-0.5 rounded-md text-[8px] font-mono font-bold border transition-colors cursor-pointer ${
                            isCompleted
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                              : 'bg-gold-500/10 text-gold-400 border-gold-500/30 hover:bg-gold-500/20'
                          }`}
                        >
                          {isCompleted ? '✓ Done' : 'Mark Done'}
                        </button>
                      )}

                      {/* Expanded Active Node Popover Card */}
                      {isActive && (
                        <div className="absolute bottom-full mb-3 w-48 p-3 rounded-xl bg-charcoal-900 border border-gold-500/30 shadow-2xl z-30 text-left">
                          <div className="flex justify-between items-start">
                            <span className="text-[9px] font-mono font-bold text-gold-400 uppercase">{node.type}</span>
                            <span className="text-[8px] font-mono text-gray-400">{node.date}</span>
                          </div>
                          <p className="text-xs font-bold text-white mt-1">{node.title}</p>
                          {node.description && (
                            <p className="text-[10px] text-gray-300 mt-1 leading-normal">{node.description}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Vertical Chronological Stream View */
          <div className="relative z-10 space-y-3 pl-2">
            {/* Vertical Connecting Line */}
            <div className="absolute left-5 top-3 bottom-3 w-0.5 bg-luxury-green-800/30" />

            {filteredNodes.map((node) => {
              const isCompleted = node.status === 'completed';
              const isOverdue = node.status === 'overdue';

              return (
                <div key={node.id} className="relative flex items-start space-x-3 group">
                  {/* Left Node Dot */}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border shrink-0 z-10 mt-1 shadow-md ${
                    isCompleted
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-400'
                      : isOverdue
                      ? 'bg-rose-950 border-rose-500 text-rose-400'
                      : 'bg-charcoal-900 border-gold-500/50 text-gold-400'
                  }`}>
                    {node.type === 'shoot' && <Clapperboard className="w-3 h-3" />}
                    {node.type === 'calendar' && <CalendarIcon className="w-3 h-3" />}
                    {node.type === 'milestone' && (isCompleted ? <Check className="w-3 h-3 text-emerald-400" /> : <CheckSquare className="w-3 h-3" />)}
                    {node.type === 'revision' && <FileEdit className="w-3 h-3" />}
                    {node.type === 'deadline' && <Clock className="w-3 h-3" />}
                  </div>

                  {/* Node Content Box */}
                  <div className="flex-1 p-3 bg-charcoal-950/70 hover:bg-charcoal-950 rounded-xl border border-luxury-green-800/15 flex items-center justify-between transition-all">
                    <div className="pr-2">
                      <div className="flex items-center space-x-2">
                        <span className={`text-[8px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                          node.type === 'shoot' ? 'bg-emerald-500/15 text-emerald-400' :
                          node.type === 'calendar' ? 'bg-blue-500/15 text-blue-400' :
                          node.type === 'milestone' ? 'bg-amber-500/15 text-amber-400' :
                          node.type === 'revision' ? 'bg-rose-500/15 text-rose-400' :
                          'bg-purple-500/15 text-purple-400'
                        }`}>
                          {node.type}
                        </span>
                        <span className="text-[9px] font-mono text-gray-400">{node.formattedDate}</span>
                      </div>
                      <h4 className={`text-xs font-semibold mt-1 ${isCompleted ? 'text-gray-300' : 'text-white'}`}>
                        {node.title}
                      </h4>
                      {node.description && (
                        <p className="text-[10px] text-gray-400 mt-0.5 leading-snug">{node.description}</p>
                      )}
                    </div>

                    {/* Interactive Action or Status */}
                    <div className="shrink-0 flex items-center space-x-2">
                      {node.isCustomMilestone && node.milestoneId ? (
                        <button
                          type="button"
                          onClick={() => handleToggleMilestone(node.milestoneId!)}
                          className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold border transition-colors cursor-pointer ${
                            isCompleted
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                              : 'bg-gold-500/10 text-gold-400 border-gold-500/30 hover:bg-gold-500/20'
                          }`}
                        >
                          {isCompleted ? '✓ Completed' : 'Pending'}
                        </button>
                      ) : (
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold ${
                          isCompleted ? 'text-emerald-400 bg-emerald-500/10' :
                          isOverdue ? 'text-rose-400 bg-rose-500/10' : 'text-gold-400 bg-gold-500/10'
                        }`}>
                          {isCompleted ? 'Done' : (isOverdue ? 'Overdue' : 'Scheduled')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="py-6 text-center text-xs text-gray-500 font-mono relative z-10">
          No timeline nodes match the selected filter.
        </div>
      )}

      {/* Quick Add Timeline Milestone Input */}
      <div className="pt-2 border-t border-luxury-green-800/15 relative z-10">
        <div className="flex items-center bg-charcoal-950 rounded-xl border border-luxury-green-800/20 p-1 pl-3">
          <input
            type="text"
            placeholder="Add new milestone to timeline..."
            value={newMilestoneInput}
            onChange={(e) => setNewMilestoneInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddMilestone();
              }
            }}
            className="flex-1 bg-transparent border-0 outline-none text-xs text-gray-200 py-1 focus:ring-0"
          />
          <button
            type="button"
            onClick={handleAddMilestone}
            className="px-3 py-1 bg-gold-500 hover:bg-gold-400 text-charcoal-950 text-xs font-bold rounded-lg cursor-pointer transition-colors shrink-0"
          >
            + Add Step
          </button>
        </div>
      </div>
    </div>
  );
};

const ProjectsView = React.memo(function ProjectsView({
  projects,
  studios,
  editors,
  revisions,
  calendarEvents = [],
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
  const [deadlineFilter, setDeadlineFilter] = useState<'all' | 'due_7_days'>('all');
  const [sortBy, setSortBy] = useState<'active_first' | 'priority' | 'deadline' | 'name' | 'updated'>('active_first');
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);

  // Quick Deadline Edit Modal State
  const [editingDeadlineProjectId, setEditingDeadlineProjectId] = useState<string | null>(null);
  const [quickDeadlineDate, setQuickDeadlineDate] = useState<string>('');
  
  // Selected project for details drawer
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [newDetailMilestone, setNewDetailMilestone] = useState('');

  // Printable PDF Worksheet State
  const [isWorksheetModalOpen, setIsWorksheetModalOpen] = useState(false);
  const [worksheetProject, setWorksheetProject] = useState<Project | null>(null);

  // Helper function to render a countdown badge for projects due within 7 days
  const renderDeadlineCountdownBadge = (deliveryDateStr: string | undefined, projStatus: string) => {
    if (!deliveryDateStr || ['delivered', 'closed'].includes(projStatus)) return null;

    const daysLeft = Math.ceil((new Date(deliveryDateStr).getTime() - Date.now()) / (1000 * 3600 * 24));

    if (daysLeft < 0) {
      return (
        <span className="inline-flex items-center gap-1 font-mono text-[10px] font-black bg-gradient-to-r from-red-600 to-rose-700 text-white px-2.5 py-0.5 rounded-full border border-red-400/50 shadow-md animate-pulse">
          <Flame className="w-3 h-3 text-yellow-300 fill-yellow-300 shrink-0" />
          <span>OVERDUE BY {Math.abs(daysLeft)}D</span>
        </span>
      );
    }

    if (daysLeft === 0) {
      return (
        <span className="inline-flex items-center gap-1 font-mono text-[10px] font-black bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white px-2.5 py-0.5 rounded-full border border-gold-400/60 shadow-lg animate-bounce">
          <Flame className="w-3 h-3 text-yellow-200 fill-yellow-200 shrink-0" />
          <span>DUE TODAY!</span>
        </span>
      );
    }

    if (daysLeft <= 3) {
      return (
        <span className="inline-flex items-center gap-1 font-mono text-[10px] font-black bg-gradient-to-r from-gold-500 via-amber-500 to-orange-500 text-charcoal-950 px-2.5 py-0.5 rounded-full border border-gold-300 shadow-md animate-pulse">
          <Zap className="w-3 h-3 text-charcoal-950 fill-charcoal-950 shrink-0" />
          <span>{daysLeft} DAYS LEFT</span>
        </span>
      );
    }

    if (daysLeft <= 7) {
      return (
        <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold bg-charcoal-950 text-gold-400 border border-gold-500/50 px-2.5 py-0.5 rounded-full shadow-sm">
          <Clock className="w-3 h-3 text-gold-400 shrink-0" />
          <span>{daysLeft} DAYS LEFT</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-gray-400">
        <Clock className="w-3 h-3 text-gray-500 shrink-0" />
        <span>{daysLeft}d left</span>
      </span>
    );
  };

  // Helper function to render a distinct, color-coded status pill for a project
  const renderStatusPill = (status: ProjectStatus, size: 'sm' | 'md' = 'md') => {
    const stage = WORKFLOW_STAGES.find(s => s.id === status);
    
    // Distinct visual configurations for each workflow status
    const statusConfig: Record<ProjectStatus, { bg: string; text: string; border: string; dot: string; label: string }> = {
      data_received: {
        bg: 'bg-sky-500/20 backdrop-blur-md shadow-sky-500/10',
        text: 'text-sky-300 font-bold',
        border: 'border-sky-400/40',
        dot: 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]',
        label: 'Data Received'
      },
      assigned: {
        bg: 'bg-indigo-500/20 backdrop-blur-md shadow-indigo-500/10',
        text: 'text-indigo-300 font-bold',
        border: 'border-indigo-400/40',
        dot: 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]',
        label: 'Assigned'
      },
      editing: {
        bg: 'bg-gradient-to-r from-amber-500/25 via-orange-500/20 to-amber-500/25 backdrop-blur-md shadow-amber-500/15',
        text: 'text-amber-300 font-extrabold',
        border: 'border-amber-400/50',
        dot: 'bg-amber-400 animate-pulse shadow-[0_0_10px_rgba(251,191,36,0.9)]',
        label: 'Editing Active'
      },
      review: {
        bg: 'bg-purple-500/20 backdrop-blur-md shadow-purple-500/10',
        text: 'text-purple-300 font-bold',
        border: 'border-purple-400/40',
        dot: 'bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]',
        label: 'In Review'
      },
      revision: {
        bg: 'bg-gradient-to-r from-rose-500/25 to-pink-500/20 backdrop-blur-md shadow-rose-500/15',
        text: 'text-rose-300 font-extrabold',
        border: 'border-rose-400/50',
        dot: 'bg-rose-400 animate-bounce shadow-[0_0_10px_rgba(251,113,133,0.9)]',
        label: 'Revisions'
      },
      rendering: {
        bg: 'bg-teal-500/20 backdrop-blur-md shadow-teal-500/10',
        text: 'text-teal-300 font-bold',
        border: 'border-teal-400/40',
        dot: 'bg-teal-400 animate-pulse shadow-[0_0_8px_rgba(45,212,191,0.8)]',
        label: 'Rendering'
      },
      delivered: {
        bg: 'bg-gradient-to-r from-emerald-500/25 to-teal-500/20 backdrop-blur-md shadow-emerald-500/15',
        text: 'text-emerald-300 font-extrabold',
        border: 'border-emerald-400/50',
        dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]',
        label: 'Delivered'
      },
      closed: {
        bg: 'bg-slate-800/90 backdrop-blur-md',
        text: 'text-slate-300 font-medium',
        border: 'border-slate-700',
        dot: 'bg-slate-400',
        label: 'Closed'
      }
    };

    const cfg = statusConfig[status] || {
      bg: 'bg-gray-800/80',
      text: 'text-gray-300 font-semibold',
      border: 'border-gray-700',
      dot: 'bg-gray-400',
      label: stage?.label || status
    };

    const isSmall = size === 'sm';

    return (
      <span className={`inline-flex items-center gap-1.5 font-mono ${isSmall ? 'text-[9px] px-2 py-0.5' : 'text-[10px] px-2.5 py-1'} rounded-full border shadow-sm ${cfg.bg} ${cfg.text} ${cfg.border}`}>
        <span className={`rounded-full shrink-0 ${isSmall ? 'w-1.5 h-1.5' : 'w-2 h-2'} ${cfg.dot}`} />
        <span className="whitespace-nowrap uppercase tracking-wider">{cfg.label}</span>
      </span>
    );
  };
  
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

  // Side-by-side Revision Comparison Modal state
  const [comparingProject, setComparingProject] = useState<Project | null>(null);
  const [compareRevAId, setCompareRevAId] = useState<string>('original');
  const [compareRevBId, setCompareRevBId] = useState<string>('latest');
  const [isAddingRevInModal, setIsAddingRevInModal] = useState<boolean>(false);
  const [modalNewRevNotes, setModalNewRevNotes] = useState<string>('');
  const [copiedComparison, setCopiedComparison] = useState<boolean>(false);

  const openRevisionComparison = (proj: Project, defaultRevId?: string) => {
    setComparingProject(proj);
    const projRevs = (revisions || []).filter(r => r.projectId === proj.id);
    if (projRevs.length === 0) {
      setCompareRevAId('original');
      setCompareRevBId('original');
    } else if (projRevs.length === 1) {
      setCompareRevAId('original');
      setCompareRevBId(defaultRevId || projRevs[0].id);
    } else {
      setCompareRevAId('original');
      setCompareRevBId(defaultRevId || projRevs[projRevs.length - 1].id);
    }
  };

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

  // Status category counts
  const statusCategoryCounts = useMemo(() => {
    const scope = projects.filter(p => studioFilter === 'all' || p.studioId === studioFilter);
    return {
      all: scope.length,
      in_progress: scope.filter(p => !['delivered', 'closed'].includes(p.status)).length,
      editing: scope.filter(p => p.status === 'editing').length,
      finalized: scope.filter(p => ['review', 'revision', 'rendering'].includes(p.status)).length,
      delivery: scope.filter(p => p.status === 'delivered').length,
      completed: scope.filter(p => ['delivered', 'closed'].includes(p.status)).length,
    };
  }, [projects, studioFilter]);

  // Projects due within 7 days (or overdue)
  const projectsDueWithin7Days = useMemo(() => {
    return projects.filter(p => {
      if (!p.deliveryDate || ['delivered', 'closed'].includes(p.status)) return false;
      const days = Math.ceil((new Date(p.deliveryDate).getTime() - Date.now()) / (1000 * 3600 * 24));
      return days <= 7;
    });
  }, [projects]);

  // Currently active/running projects (not delivered or closed)
  const activeRunningProjects = useMemo(() => {
    return projects.filter(p => !['delivered', 'closed'].includes(p.status) && (studioFilter === 'all' || p.studioId === studioFilter));
  }, [projects, studioFilter]);

  // Filter and Sort project lists
  const filteredProjects = useMemo(() => {
    const filtered = projects.filter(p => {
      const matchesSearch = (p.coupleName || '').toLowerCase().includes(debouncedSearchQuery.toLowerCase()) || 
                            (p.studioName || '').toLowerCase().includes(debouncedSearchQuery.toLowerCase()) || 
                            (p.id || '').toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      
      const matchesStatus = (() => {
        if (statusFilter === 'all') return true;
        if (statusFilter === 'in_progress') {
          return !['delivered', 'closed'].includes(p.status);
        }
        if (statusFilter === 'editing') {
          return p.status === 'editing';
        }
        if (statusFilter === 'finalized') {
          return ['review', 'revision', 'rendering'].includes(p.status);
        }
        if (statusFilter === 'delivery' || statusFilter === 'delivered') {
          return p.status === 'delivered';
        }
        if (statusFilter === 'completed') {
          return ['delivered', 'closed'].includes(p.status);
        }
        return p.status === statusFilter;
      })();

      const matchesPriority = priorityFilter === 'all' || p.priority === priorityFilter;
      const matchesStudio = studioFilter === 'all' || p.studioId === studioFilter;

      const matchesDeadlineFilter = (() => {
        if (deadlineFilter === 'all') return true;
        if (!p.deliveryDate || ['delivered', 'closed'].includes(p.status)) return false;
        const days = Math.ceil((new Date(p.deliveryDate).getTime() - Date.now()) / (1000 * 3600 * 24));
        return days <= 7;
      })();
      
      return matchesSearch && matchesStatus && matchesPriority && matchesStudio && matchesDeadlineFilter;
    });

    return [...filtered].sort((a, b) => {
      // Helper function: check if project is currently active/running (not closed or delivered)
      const isRunningA = !['delivered', 'closed'].includes(a.status);
      const isRunningB = !['delivered', 'closed'].includes(b.status);

      if (sortBy === 'priority') {
        // Active running projects float to top
        if (isRunningA !== isRunningB) {
          return isRunningB ? 1 : -1;
        }
        const prioWeight: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
        const pA = prioWeight[a.priority || 'medium'] || 2;
        const pB = prioWeight[b.priority || 'medium'] || 2;
        if (pA !== pB) return pB - pA; // Urgent -> High -> Medium -> Low
        const dateA = a.deliveryDate ? new Date(a.deliveryDate).getTime() : Infinity;
        const dateB = b.deliveryDate ? new Date(b.deliveryDate).getTime() : Infinity;
        return dateA - dateB;
      } else if (sortBy === 'name') {
        if (isRunningA !== isRunningB) {
          return isRunningB ? 1 : -1;
        }
        const nameA = (a.projectName || a.coupleName || '').toLowerCase();
        const nameB = (b.projectName || b.coupleName || '').toLowerCase();
        return nameA.localeCompare(nameB);
      } else if (sortBy === 'active_first') {
        // Primary priority: Active running projects float to the top
        if (isRunningA !== isRunningB) {
          return isRunningB ? 1 : -1;
        }
        // Tie-breaker: Nearest delivery deadline first
        const dateA = a.deliveryDate ? new Date(a.deliveryDate).getTime() : Infinity;
        const dateB = b.deliveryDate ? new Date(b.deliveryDate).getTime() : Infinity;
        return dateA - dateB;
      } else if (sortBy === 'deadline') {
        // Primary priority: Active running projects float to the top first
        if (isRunningA !== isRunningB) {
          return isRunningB ? 1 : -1;
        }
        const dateA = a.deliveryDate ? new Date(a.deliveryDate).getTime() : Infinity;
        const dateB = b.deliveryDate ? new Date(b.deliveryDate).getTime() : Infinity;
        return dateA - dateB;
      } else {
        // "Last Updated" - Primary priority: Active running projects float to top
        if (isRunningA !== isRunningB) {
          return isRunningB ? 1 : -1;
        }
        const getTimestamp = (val: any): number => {
          if (!val) return 0;
          if (typeof val.seconds === 'number') return val.seconds * 1000;
          if (typeof val.toDate === 'function') return val.toDate().getTime();
          if (val instanceof Date) return val.getTime();
          const parsed = Date.parse(val);
          return isNaN(parsed) ? 0 : parsed;
        };
        return getTimestamp(b.updatedAt) - getTimestamp(a.updatedAt);
      }
    });
  }, [projects, debouncedSearchQuery, statusFilter, priorityFilter, studioFilter, sortBy]);

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
      
      {/* Persistent Search and Filters Hub */}
      <div className="sticky top-2 z-30 p-5 rounded-3xl bg-charcoal-900/95 border border-luxury-green-800/30 relative overflow-hidden backdrop-blur-md shadow-2xl space-y-4 transition-all">
        {/* Status Category Persistent Quick Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3.5">
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-[10px] uppercase font-mono tracking-wider text-gold-400 font-bold hidden md:inline mr-1">Status:</span>
            {[
              { id: 'all', label: 'All', count: statusCategoryCounts.all },
              { id: 'in_progress', label: 'In Progress', count: statusCategoryCounts.in_progress },
              { id: 'editing', label: 'Editing', count: statusCategoryCounts.editing },
              { id: 'finalized', label: 'Finalized', count: statusCategoryCounts.finalized },
              { id: 'delivery', label: 'Delivery', count: statusCategoryCounts.delivery },
              { id: 'completed', label: 'Completed', count: statusCategoryCounts.completed },
            ].map((tab) => {
              const isActive = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  id={`filter-status-${tab.id}`}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer relative ${
                    isActive
                      ? 'bg-gradient-to-r from-luxury-green-800 to-luxury-green-700 text-gold-300 border border-gold-400/50 font-bold shadow-md shadow-gold-500/10 scale-[1.02]'
                      : 'bg-charcoal-950/80 border border-luxury-green-800/20 text-gray-400 hover:text-white hover:bg-charcoal-900'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      isActive
                        ? 'bg-gold-500/25 text-gold-300'
                        : 'bg-charcoal-900 text-gray-500'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Detailed Workflow Stage Select */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-charcoal-950 border border-luxury-green-800/20 px-3 py-1.5 rounded-2xl text-xs text-gray-300 focus:outline-none focus:border-gold-500/40 cursor-pointer shrink-0"
          >
            <option value="all">All Stages</option>
            <option value="in_progress">All In Progress</option>
            <option value="editing">Editing Only</option>
            <option value="finalized">Finalized / Revisions</option>
            <option value="delivery">Delivery Stage</option>
            <option value="completed">All Completed</option>
            <optgroup label="Specific Workflow Stage">
              {WORKFLOW_STAGES.map(stage => (
                <option key={stage.id} value={stage.id}>{stage.label}</option>
              ))}
            </optgroup>
          </select>
        </div>

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
            {/* Due within 7 days filter toggle pill */}
            <button
              type="button"
              id="filter-deadline-7days"
              onClick={() => setDeadlineFilter(deadlineFilter === 'due_7_days' ? 'all' : 'due_7_days')}
              className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-1.5 border shadow-sm ${
                deadlineFilter === 'due_7_days'
                  ? 'bg-gradient-to-r from-amber-500 via-gold-500 to-amber-600 text-charcoal-950 border-gold-300 font-extrabold shadow-amber-500/20 scale-[1.02]'
                  : 'bg-charcoal-950 border-gold-500/30 text-gold-400 hover:border-gold-400 hover:bg-charcoal-900'
              }`}
              title="Filter projects that have deadlines within 7 days or are overdue"
            >
              <Clock className={`w-3.5 h-3.5 ${deadlineFilter === 'due_7_days' ? 'text-charcoal-950 fill-charcoal-950' : 'text-gold-400'}`} />
              <span>Due within 7 Days</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
                deadlineFilter === 'due_7_days'
                  ? 'bg-charcoal-950/30 text-charcoal-950'
                  : 'bg-gold-500/20 text-gold-300 border border-gold-500/30'
              }`}>
                {projectsDueWithin7Days.length}
              </span>
            </button>

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

            {/* Sort Toggle (Priority / Due Date / Name / Running First / Last Updated) */}
            <div className="flex bg-charcoal-950 border border-luxury-green-800/20 p-1 rounded-2xl items-center flex-wrap gap-0.5">
              <span className="text-[10px] uppercase font-mono text-gray-500 px-2 select-none hidden sm:inline">Sort:</span>
              
              <button
                type="button"
                id="sort-priority"
                onClick={() => setSortBy('priority')}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${sortBy === 'priority' ? 'bg-luxury-green-800 text-gold-400 font-bold shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                title="Sort by Priority (Urgent → High → Medium → Low)"
              >
                <Flame className="w-3 h-3 text-amber-400" />
                <span>Priority</span>
              </button>

              <button
                type="button"
                id="sort-deadline"
                onClick={() => setSortBy('deadline')}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${sortBy === 'deadline' ? 'bg-luxury-green-800 text-gold-400 font-bold shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                title="Sort by Nearest Due Date"
              >
                <Calendar className="w-3 h-3 text-sky-400" />
                <span>Due Date</span>
              </button>

              <button
                type="button"
                id="sort-name"
                onClick={() => setSortBy('name')}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${sortBy === 'name' ? 'bg-luxury-green-800 text-gold-400 font-bold shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                title="Sort Alphabetically by Project or Couple Name"
              >
                <ArrowUpDown className="w-3 h-3 text-emerald-400" />
                <span>Name</span>
              </button>

              <button
                type="button"
                id="sort-active-first"
                onClick={() => setSortBy('active_first')}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${sortBy === 'active_first' ? 'bg-luxury-green-800 text-gold-400 font-bold shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                title="Put Running / Active Working Projects First"
              >
                <Zap className="w-3 h-3 text-gold-400" />
                <span className="hidden md:inline">Running First</span>
              </button>

              <button
                type="button"
                id="sort-updated"
                onClick={() => setSortBy('updated')}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${sortBy === 'updated' ? 'bg-luxury-green-800 text-gold-400 font-bold shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                title="Sort by Last Updated Timestamp"
              >
                <Clock className="w-3 h-3 text-purple-400" />
                <span className="hidden sm:inline">Updated</span>
              </button>
            </div>

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

      {/* Active Running Projects Highlight Section */}
      {activeRunningProjects.length > 0 && statusFilter === 'all' && (
        <div className="bg-gradient-to-br from-charcoal-900 via-charcoal-900 to-luxury-green-950/60 border border-gold-500/30 rounded-3xl p-4 sm:p-5 shadow-2xl relative overflow-hidden space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2 tracking-wide font-display">
                <Zap className="w-4 h-4 text-gold-400 fill-gold-400" />
                <span>CHALU / WORKING PROJECTS ({activeRunningProjects.length})</span>
              </h3>
              <span className="text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold">
                Currently Running
              </span>
            </div>

            <div className="text-xs text-gray-400 flex items-center gap-2">
              <span className="hidden md:inline text-gold-300/80 font-medium">⚡ Active projects are listed first at the top</span>
              <button
                type="button"
                onClick={() => setStatusFilter('in_progress')}
                className="text-gold-400 hover:text-gold-300 font-bold text-xs underline cursor-pointer"
              >
                View All In-Progress ({activeRunningProjects.length}) →
              </button>
            </div>
          </div>

          {/* Quick Cards Grid for Running Projects */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {activeRunningProjects.slice(0, 8).map((proj) => {
              const stage = WORKFLOW_STAGES.find(s => s.id === proj.status);
              const editor = editors.find(e => e.id === proj.assignedEditorId);
              const remainingDays = proj.deliveryDate ? Math.ceil((new Date(proj.deliveryDate).getTime() - Date.now()) / (1000 * 3600 * 24)) : null;

              return (
                <div
                  key={proj.id}
                  onClick={() => { setSelectedProject(proj); setIsDetailOpen(true); }}
                  className="p-3 bg-charcoal-950/90 border border-gold-500/20 hover:border-gold-400/60 rounded-2xl transition-all cursor-pointer group hover:bg-charcoal-900 relative overflow-hidden shadow-md flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="min-w-0 flex-1">
                        <span className="text-[9px] font-mono font-bold text-gold-400/90 block truncate">{proj.id} • {proj.studioName || 'Studio'}</span>
                        <h4 className="text-xs font-black text-white group-hover:text-gold-300 transition-colors truncate">
                          {proj.projectName || proj.coupleName}
                        </h4>
                      </div>
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase shrink-0 ${stage?.bg || 'bg-blue-500/20'} ${stage?.color || 'text-blue-400'}`}>
                        {stage?.label || proj.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-gray-400 pt-2 border-t border-white/10 mt-1">
                    <span className="truncate flex items-center gap-1 font-medium text-gray-300">
                      <User className="w-3 h-3 text-gold-400 shrink-0" />
                      {editor ? editor.name : (proj.assignedEditorName || 'Unassigned')}
                    </span>
                    {remainingDays !== null && (
                      <span className={`font-mono font-extrabold ${remainingDays < 0 ? 'text-red-400' : remainingDays <= 3 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {remainingDays < 0 ? `${Math.abs(remainingDays)}d overdue` : `${remainingDays}d left`}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
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
                  setExpandedProjectId(expandedProjectId === proj.id ? null : proj.id);
                }}
                className={`rounded-3xl bg-gradient-to-b from-charcoal-900 to-charcoal-950 border relative overflow-hidden flex flex-col ${expandedProjectId === proj.id ? 'min-h-[460px] h-auto pb-4' : 'min-h-[440px] h-auto'} justify-between cursor-pointer group shadow-lg hover:shadow-2xl transition-all duration-300 ${currentPriority?.glowBorder || 'border-luxury-green-800/20'}`}
              >
                {/* Photo Top Header */}
                <div className="h-44 relative overflow-hidden shrink-0">
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
                  
                  {/* Floating ID & Priority Label with Admin Selector */}
                  <div className="absolute top-4 left-4 flex items-center space-x-2 z-10" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[10px] font-mono px-2.5 py-1 bg-charcoal-950/90 border border-luxury-green-800/40 text-gold-400 rounded-lg shadow">
                      {proj.id}
                    </span>

                    {/* Interactive Priority Selector Badge */}
                    <div className="relative group/priority">
                      <select
                        value={proj.priority || 'medium'}
                        onChange={async (e) => {
                          e.stopPropagation();
                          const newPriority = e.target.value as ProjectPriority;
                          await onUpdateProject(proj.id, { priority: newPriority });
                        }}
                        disabled={userRole !== 'admin'}
                        className={`text-[10px] font-mono px-2.5 py-1 rounded-lg border appearance-none pr-5 cursor-pointer backdrop-blur-md shadow-md font-bold transition-all ${currentPriority?.bg || 'bg-sky-500/20 border-sky-400/40'} ${currentPriority?.color || 'text-sky-300'} focus:outline-none focus:ring-1 focus:ring-gold-400`}
                        title={userRole === 'admin' ? "Admin: Click to set Priority & update Card Glow" : "Project Priority Level"}
                      >
                        {PRIORITIES.map(p => (
                          <option key={p.id} value={p.id} className="bg-charcoal-950 text-white font-mono">
                            {p.icon} {p.label} Priority
                          </option>
                        ))}
                      </select>
                      {userRole === 'admin' && (
                        <ChevronDown className="w-2.5 h-2.5 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-current opacity-80" />
                      )}
                    </div>
                  </div>

                  {/* Status Overlay & Deadline Countdown Badge */}
                  <div className="absolute bottom-4 left-4 flex items-center gap-2 flex-wrap max-w-[80%]">
                    {renderStatusPill(proj.status, 'md')}
                    {renderDeadlineCountdownBadge(proj.deliveryDate, proj.status)}
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
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-base font-bold text-white font-display leading-tight truncate group-hover:text-gold-400 transition-colors">
                            {proj.projectName || proj.coupleName}
                          </h3>
                          {renderStatusPill(proj.status, 'sm')}
                        </div>
                        {proj.projectName && (
                          <p className="text-[10px] text-gold-400/80 font-mono tracking-wider uppercase">{proj.coupleName}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-1 shrink-0" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setWorksheetProject(proj);
                            setIsWorksheetModalOpen(true);
                          }}
                          className="p-1.5 bg-charcoal-950 hover:bg-gold-500/20 rounded-lg text-gold-400 hover:text-gold-300 border border-gold-500/20 transition-colors cursor-pointer"
                          title="Print to PDF / Branded Worksheet"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProject(proj);
                            setIsDetailOpen(true);
                          }}
                          className="p-1.5 bg-charcoal-950 hover:bg-luxury-green-800/30 rounded-lg text-gray-400 hover:text-gold-500 border border-luxury-green-800/20 transition-colors cursor-pointer"
                          title="View Full Specifications Drawer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
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

                    {/* Visual Revision Completion Progress Bar */}
                    {(() => {
                      const projRevisions = (revisions || []).filter(r => r.projectId === proj.id);
                      const totalRev = projRevisions.length;
                      const resolvedRev = projRevisions.filter(r => r.status === 'resolved').length;
                      const revPercent = totalRev > 0 ? Math.round((resolvedRev / totalRev) * 100) : 100;

                      return (
                        <div className="mt-3.5 pt-3 border-t border-luxury-green-800/15">
                          <div className="flex items-center justify-between text-[10px] font-mono mb-1.5">
                            <span className="text-gray-400 font-medium flex items-center space-x-1">
                              <FileEdit className="w-3 h-3 text-gold-400" />
                              <span>Revision Progress</span>
                            </span>
                            <span className={`font-bold ${
                              totalRev === 0 
                                ? 'text-gray-400' 
                                : revPercent === 100 
                                ? 'text-emerald-400' 
                                : 'text-amber-400'
                            }`}>
                              {totalRev > 0 
                                ? `${resolvedRev}/${totalRev} Resolved (${revPercent}%)` 
                                : '0 Revisions (100% Clear)'}
                            </span>
                          </div>
                          <div className="w-full bg-charcoal-950 h-1.5 rounded-full overflow-hidden border border-white/5">
                            <div
                              className={`h-full transition-all duration-500 rounded-full ${
                                totalRev === 0
                                  ? 'bg-emerald-500/30'
                                  : revPercent === 100
                                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                                  : 'bg-gradient-to-r from-amber-500 via-gold-400 to-emerald-400'
                              }`}
                              style={{ width: `${revPercent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })()}

                    {/* Collapsible details container */}
                    <AnimatePresence>
                      {expandedProjectId === proj.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: 'easeInOut' }}
                          className="mt-4 pt-4 border-t border-luxury-green-800/15 space-y-4 overflow-hidden"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Detailed Team Assignments */}
                          <div>
                            <span className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider font-mono block">Detailed Team Assignment</span>
                            <div className="space-y-1.5 mt-1.5">
                              <div className="p-2 bg-charcoal-950/60 rounded-xl border border-white/5 flex items-center justify-between text-xs text-gray-300">
                                <span className="flex items-center space-x-1.5">
                                  <User className="w-3.5 h-3.5 text-gold-400" />
                                  <span className="font-semibold text-white truncate max-w-[140px]">
                                    Lead: {proj.assignedEditorName || 'Unassigned'}
                                  </span>
                                </span>
                                {proj.isSplitProject ? (
                                  <span className="text-[10px] font-mono text-gold-400 bg-gold-400/10 px-1.5 py-0.5 rounded">
                                    ₹{(proj.firstEditorShare || 0).toLocaleString('en-IN')}
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-mono text-gold-400 bg-gold-400/10 px-1.5 py-0.5 rounded">
                                    ₹{(proj.editorPayment || 0).toLocaleString('en-IN')}
                                  </span>
                                )}
                              </div>
                              
                              {proj.isSplitProject && (
                                <div className="p-2 bg-charcoal-950/60 rounded-xl border border-white/5 flex items-center justify-between text-xs text-gray-300">
                                  <span className="flex items-center space-x-1.5">
                                    <User className="w-3.5 h-3.5 text-gold-400/70" />
                                    <span className="font-semibold text-white truncate max-w-[140px]">
                                      Split: {proj.secondEditorName || 'Unassigned'}
                                    </span>
                                  </span>
                                  <span className="text-[10px] font-mono text-gold-400 bg-gold-400/10 px-1.5 py-0.5 rounded">
                                    ₹{(proj.secondEditorShare || 0).toLocaleString('en-IN')}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Detailed Revision Notes */}
                          <div>
                            <span className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider font-mono block">Revision History ({revisions.filter(r => r.projectId === proj.id).length})</span>
                            <div className="space-y-1.5 mt-1.5 max-h-36 overflow-y-auto custom-scrollbar">
                              {revisions.filter(r => r.projectId === proj.id).length > 0 ? (
                                revisions.filter(r => r.projectId === proj.id).map((rev) => (
                                  <div key={rev.id} className="p-2 bg-charcoal-950/40 rounded-xl border border-luxury-green-800/10 text-[11px]">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="font-mono text-gold-400 font-bold text-[9px]">REV-#{rev.revisionNumber}</span>
                                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold ${
                                        rev.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-emerald-500/10 text-emerald-400'
                                      }`}>
                                        {rev.status === 'pending' ? 'Pending' : 'Resolved'}
                                      </span>
                                    </div>
                                    <p className="text-gray-300 leading-normal">{rev.notes}</p>
                                  </div>
                                ))
                              ) : (
                                <p className="text-[10px] font-mono text-gray-500 italic text-center py-2 bg-charcoal-950/20 rounded-xl">
                                  No revisions logged yet
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Inline Controls */}
                          <div className="flex gap-2 pt-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProject(proj);
                                setIsDetailOpen(true);
                              }}
                              className="flex-1 flex items-center justify-center space-x-1.5 py-2 bg-luxury-green-800/40 hover:bg-luxury-green-800/70 border border-gold-500/10 hover:border-gold-500/30 text-gold-400 hover:text-white rounded-xl text-[10px] font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Full Specs Drawer</span>
                            </button>
                            
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedProjectId(null);
                              }}
                              className="flex items-center justify-center px-3 py-2 bg-charcoal-950 hover:bg-charcoal-900 border border-white/5 hover:border-white/10 text-gray-400 hover:text-white rounded-xl text-[10px] font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer"
                            >
                              ✕ Close
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Card Bottom / Countdown & Quick Edit */}
                  <div className="border-t border-luxury-green-800/10 pt-3 mt-4 flex items-center justify-between text-[11px] font-mono shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingDeadlineProjectId(proj.id);
                        setQuickDeadlineDate(proj.deliveryDate || '');
                      }}
                      className="flex items-center space-x-1.5 text-gray-300 hover:text-gold-400 transition-colors bg-charcoal-950/80 px-2.5 py-1 rounded-xl border border-white/5 hover:border-gold-500/30 cursor-pointer group/btn"
                      title="Click to assign or change project deadline"
                    >
                      <CalendarIcon className="w-3.5 h-3.5 text-gold-400" />
                      <span>{proj.deliveryDate || 'Assign Deadline'}</span>
                      <Edit className="w-3 h-3 text-gray-500 group-hover/btn:text-gold-400" />
                    </button>

                    <div>
                      {renderDeadlineCountdownBadge(proj.deliveryDate, proj.status)}
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
                      <td className="p-4 font-mono text-xs text-gray-300">
                        <div className="flex items-center gap-2">
                          <span>{proj.deliveryDate || 'N/A'}</span>
                          {renderDeadlineCountdownBadge(proj.deliveryDate, proj.status)}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingDeadlineProjectId(proj.id);
                              setQuickDeadlineDate(proj.deliveryDate || '');
                            }}
                            className="p-1 hover:bg-gold-500/10 rounded text-gray-500 hover:text-gold-400 transition-colors cursor-pointer"
                            title="Edit Deadline"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
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
                        <div className="flex flex-col space-y-1.5 items-start">
                          {renderStatusPill(proj.status, 'sm')}
                          {(() => {
                            const projRevisions = (revisions || []).filter(r => r.projectId === proj.id);
                            const totalRev = projRevisions.length;
                            const resolvedRev = projRevisions.filter(r => r.status === 'resolved').length;
                            const revPct = totalRev > 0 ? Math.round((resolvedRev / totalRev) * 100) : 100;

                            return (
                              <div className="w-28 mt-0.5">
                                <div className="flex items-center justify-between text-[8px] font-mono text-gray-400 mb-0.5">
                                  <span className="flex items-center space-x-0.5">
                                    <FileEdit className="w-2.5 h-2.5 text-gold-400" />
                                    <span>Revisions</span>
                                  </span>
                                  <span className={totalRev === 0 ? 'text-gray-400' : revPct === 100 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                                    {totalRev > 0 ? `${resolvedRev}/${totalRev}` : '0 Logged'}
                                  </span>
                                </div>
                                <div className="w-full bg-charcoal-900 h-1 rounded-full overflow-hidden border border-white/5">
                                  <div
                                    className={`h-full transition-all duration-300 rounded-full ${
                                      totalRev === 0 
                                        ? 'bg-emerald-500/30' 
                                        : revPct === 100 
                                        ? 'bg-emerald-400' 
                                        : 'bg-amber-400'
                                    }`}
                                    style={{ width: `${revPct}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })()}
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
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setWorksheetProject(proj);
                              setIsWorksheetModalOpen(true);
                            }}
                            className="p-1.5 hover:bg-gold-500/20 rounded-lg text-gold-400 hover:text-gold-300 border border-gold-500/20 transition-colors cursor-pointer"
                            title="Print to PDF / Branded Worksheet"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
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
                    {stageProjects.map((proj) => {
                      const pObj = PRIORITIES.find(p => p.id === proj.priority) || PRIORITIES[1];
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
                            setExpandedProjectId(expandedProjectId === proj.id ? null : proj.id);
                          }}
                          className={`p-4 rounded-2xl bg-charcoal-800/80 border cursor-pointer transition-all duration-200 shadow-md group ${pObj.glowBorder}`}
                        >
                          <div className="flex justify-between items-center gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[9px] font-mono bg-charcoal-950 px-1.5 py-0.5 rounded text-gold-400">
                                {proj.id}
                              </span>
                              {renderStatusPill(proj.status, 'sm')}
                            </div>
                            <span className={`text-[8px] font-mono px-2 py-0.5 rounded-md uppercase font-bold shrink-0 border ${pObj.bg} ${pObj.color}`}>
                              {pObj.icon} {pObj.label}
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
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProject(proj);
                                setIsDetailOpen(true);
                              }}
                              className="p-1 hover:bg-luxury-green-800/30 rounded text-gray-400 hover:text-gold-500 transition-colors cursor-pointer"
                              title="View Specifications Drawer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
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

                        {/* Collapsible expanded section in Kanban */}
                        <AnimatePresence>
                          {expandedProjectId === proj.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25, ease: 'easeInOut' }}
                              className="mt-3 pt-3 border-t border-luxury-green-800/10 space-y-3 overflow-hidden text-left"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div>
                                <span className="text-[8px] text-gray-500 font-semibold uppercase tracking-wider font-mono block">Assignments</span>
                                <div className="space-y-1 mt-1 text-[11px] text-gray-300">
                                  <div className="flex justify-between items-center bg-charcoal-950/40 p-1.5 rounded border border-white/5">
                                    <span className="truncate">Lead: {proj.assignedEditorName || 'Unassigned'}</span>
                                    <span className="text-gold-400 font-mono text-[9px]">
                                      ₹{(proj.isSplitProject ? (proj.firstEditorShare || 0) : (proj.editorPayment || 0)).toLocaleString('en-IN')}
                                    </span>
                                  </div>
                                  {proj.isSplitProject && (
                                    <div className="flex justify-between items-center bg-charcoal-950/40 p-1.5 rounded border border-white/5">
                                      <span className="truncate">Split: {proj.secondEditorName || 'Unassigned'}</span>
                                      <span className="text-gold-400 font-mono text-[9px]">
                                        ₹{(proj.secondEditorShare || 0).toLocaleString('en-IN')}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div>
                                <span className="text-[8px] text-gray-500 font-semibold uppercase tracking-wider font-mono block">Latest Revisions ({revisions.filter(r => r.projectId === proj.id).length})</span>
                                <div className="space-y-1 mt-1 max-h-24 overflow-y-auto custom-scrollbar">
                                  {revisions.filter(r => r.projectId === proj.id).length > 0 ? (
                                    revisions.filter(r => r.projectId === proj.id).slice(0, 2).map((rev) => (
                                      <div key={rev.id} className="p-1.5 bg-charcoal-950/30 rounded border border-luxury-green-800/5 text-[10px]">
                                        <div className="flex justify-between items-center text-[8px] mb-0.5">
                                          <span className="font-mono text-gold-400 font-bold">REV-#{rev.revisionNumber}</span>
                                          <span className={rev.status === 'pending' ? 'text-yellow-500' : 'text-emerald-400'}>
                                            {rev.status === 'pending' ? 'Pending' : 'Done'}
                                          </span>
                                        </div>
                                        <p className="text-gray-400 line-clamp-2 leading-tight">{rev.notes}</p>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-[9px] font-mono text-gray-600 italic text-center py-1.5">No revisions logged</p>
                                  )}
                                </div>
                              </div>

                              <div className="flex gap-1.5 pt-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedProject(proj);
                                    setIsDetailOpen(true);
                                  }}
                                  className="flex-1 py-1.5 bg-luxury-green-800/40 hover:bg-luxury-green-800/70 border border-gold-500/10 text-gold-400 hover:text-white rounded-lg text-[9px] font-bold tracking-wider uppercase transition-all cursor-pointer text-center"
                                >
                                  Specs Panel
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedProjectId(null);
                                  }}
                                  className="px-2 py-1.5 bg-charcoal-950 hover:bg-charcoal-900 border border-white/5 text-gray-400 hover:text-white rounded-lg text-[9px] font-bold tracking-wider uppercase transition-all cursor-pointer"
                                >
                                  ✕ Close
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="flex justify-between items-center mt-4 pt-3 border-t border-luxury-green-800/10 text-[9px] text-gray-400 font-mono">
                          <span className="truncate max-w-[100px]">Lead: {proj.assignedEditorName || 'Unassigned'}</span>
                          <div className="flex items-center gap-1.5">
                            {renderDeadlineCountdownBadge(proj.deliveryDate, proj.status)}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingDeadlineProjectId(proj.id);
                                setQuickDeadlineDate(proj.deliveryDate || '');
                              }}
                              className="p-1 hover:bg-gold-500/10 rounded text-gray-400 hover:text-gold-400 transition-colors cursor-pointer"
                              title="Edit Deadline"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </SwipeableCard>
                    );
                  })}

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
                  
                  <div className="absolute top-4 left-4 flex items-center space-x-2 z-10">
                    <button
                      onClick={() => setIsDetailOpen(false)}
                      className="bg-charcoal-950/80 hover:bg-charcoal-950 px-3 py-2 rounded-xl text-gray-300 hover:text-white border border-gold-500/20 backdrop-blur-md cursor-pointer text-xs"
                    >
                      ✕ Close Panel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setWorksheetProject(selectedProject);
                        setIsWorksheetModalOpen(true);
                      }}
                      className="bg-gold-500 hover:bg-gold-400 text-charcoal-950 px-3.5 py-2 rounded-xl backdrop-blur-md cursor-pointer text-xs font-bold font-mono flex items-center space-x-1.5 transition-all shadow-md"
                      title="Print formatted, branded PDF worksheet"
                    >
                      <Printer className="w-3.5 h-3.5 text-charcoal-950" />
                      <span>Print to PDF</span>
                    </button>
                  </div>

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
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider font-mono block mb-1">Current Workflow Stage</span>
                      <div className="flex items-center gap-2">
                        {renderStatusPill(selectedProject.status, 'md')}
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

                  {/* Delivery Deadline & Countdown Interactive Section */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-charcoal-950 to-charcoal-900 border border-gold-500/30 space-y-3 shadow-lg">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gold-400" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider font-display">Delivery Deadline & Countdown</span>
                      </div>
                      {renderDeadlineCountdownBadge(selectedProject.deliveryDate, selectedProject.status)}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/10">
                      <div>
                        <label className="block text-[9px] font-mono text-gray-400 uppercase mb-1">Assigned Deadline Date</label>
                        <input
                          type="date"
                          value={selectedProject.deliveryDate || ''}
                          onChange={async (e) => {
                            const newDate = e.target.value;
                            await onUpdateProject(selectedProject.id, { deliveryDate: newDate });
                            setSelectedProject({ ...selectedProject, deliveryDate: newDate });
                          }}
                          onClick={(e) => { try { e.currentTarget.showPicker(); } catch (err) {} }}
                          className="w-full bg-charcoal-900 border border-gold-500/30 rounded-xl px-3 py-1.5 text-xs text-gold-300 font-mono focus:outline-none focus:border-gold-400 cursor-pointer"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-mono text-gray-400 uppercase mb-1">Quick Presets (from Shoot Date)</label>
                        <div className="flex gap-1.5 flex-wrap">
                          {[
                            { label: '+7d', days: 7 },
                            { label: '+15d', days: 15 },
                            { label: '+30d', days: 30 },
                            { label: '+45d', days: 45 },
                          ].map(preset => (
                            <button
                              key={preset.days}
                              type="button"
                              onClick={async () => {
                                const baseDate = selectedProject.shootDate || new Date().toISOString().split('T')[0];
                                const target = new Date(new Date(baseDate).getTime() + preset.days * 24 * 3600 * 1000);
                                const newDate = target.toISOString().split('T')[0];
                                await onUpdateProject(selectedProject.id, { deliveryDate: newDate });
                                setSelectedProject({ ...selectedProject, deliveryDate: newDate });
                              }}
                              className="px-2 py-1 bg-charcoal-900 hover:bg-gold-500/20 border border-gold-500/30 text-gold-400 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer"
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Project Milestone & Calendar Event Timeline */}
                  <ProjectTimeline
                    project={selectedProject}
                    calendarEvents={calendarEvents}
                    revisions={revisions}
                    onUpdateProject={onUpdateProject}
                    setSelectedProject={setSelectedProject}
                  />

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
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => openRevisionComparison(selectedProject)}
                          className="px-2.5 py-1 rounded-lg bg-gold-500/15 hover:bg-gold-500/25 border border-gold-500/30 text-[10px] font-mono text-gold-300 hover:text-gold-200 flex items-center space-x-1 transition-all cursor-pointer shadow-sm"
                          title="Open Side-by-Side Visual Diff Comparison Modal"
                        >
                          <GitCompare className="w-3.5 h-3.5 text-gold-400" />
                          <span>Compare Diff</span>
                        </button>
                        <button
                          onClick={() => setIsAddingRevision(!isAddingRevision)}
                          className="text-[10px] font-mono text-gold-400 hover:underline flex items-center space-x-1 cursor-pointer"
                        >
                          <PlusCircle className="w-3.5 h-3.5 mr-1" />
                          <span>Add Request</span>
                        </button>
                      </div>
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
                              <button
                                type="button"
                                onClick={() => openRevisionComparison(selectedProject, rev.id)}
                                className="p-1.5 bg-gold-500/10 hover:bg-gold-500/25 text-gold-400 rounded-lg transition-colors cursor-pointer"
                                title="Compare this revision side-by-side"
                              >
                                <GitCompare className="w-3.5 h-3.5" />
                              </button>
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
                <div className="p-6 border-t border-luxury-green-800/20 bg-charcoal-950/50 flex flex-wrap justify-between items-center gap-3 shrink-0">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => openEditModal(selectedProject, e)}
                      className="flex items-center space-x-2 px-4 py-2.5 bg-luxury-green-800 hover:bg-luxury-green-700 text-gold-400 text-xs font-bold rounded-xl border border-gold-500/20 transition-all cursor-pointer"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit Specifications</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setWorksheetProject(selectedProject);
                        setIsWorksheetModalOpen(true);
                      }}
                      className="flex items-center space-x-2 px-4 py-2.5 bg-gold-500 hover:bg-gold-400 text-charcoal-950 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md"
                    >
                      <Printer className="w-4 h-4 text-charcoal-950" />
                      <span>Print to PDF Worksheet</span>
                    </button>
                  </div>

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
                              <div className="flex items-center justify-between mb-1">
                                <label className="block text-[9px] font-mono text-gray-500 uppercase">Delivery Deadline <span className="text-red-500">*</span></label>
                                <span className="text-[9px] font-mono text-gold-400 font-bold">Presets:</span>
                              </div>
                              <input 
                                type="date" 
                                value={deliveryDate} 
                                onChange={(e) => { setDeliveryDate(e.target.value); setModalValidationError(''); }} 
                                onClick={(e) => { try { e.currentTarget.showPicker(); } catch (err) {} }}
                                className="w-full bg-charcoal-950 border border-luxury-green-800/30 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-gold-500/30 cursor-pointer" 
                              />
                              <div className="flex gap-1.5 mt-2 flex-wrap">
                                {[
                                  { label: '+7d', days: 7 },
                                  { label: '+15d', days: 15 },
                                  { label: '+30d', days: 30 },
                                  { label: '+45d', days: 45 },
                                ].map(preset => (
                                  <button
                                    key={preset.days}
                                    type="button"
                                    onClick={() => {
                                      const baseDate = shootDate || new Date().toISOString().split('T')[0];
                                      const target = new Date(new Date(baseDate).getTime() + preset.days * 24 * 3600 * 1000);
                                      setDeliveryDate(target.toISOString().split('T')[0]);
                                      setModalValidationError('');
                                    }}
                                    className="px-2 py-1 bg-charcoal-950 hover:bg-gold-500/20 border border-luxury-green-800/30 hover:border-gold-500/40 text-gold-400 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer"
                                  >
                                    {preset.label}
                                  </button>
                                ))}
                              </div>
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

      {/* Quick Deadline Assign/Edit Modal */}
      <AnimatePresence>
        {editingDeadlineProjectId && (() => {
          const targetProject = projects.find(p => p.id === editingDeadlineProjectId);
          if (!targetProject) return null;

          return (
            <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setEditingDeadlineProjectId(null)} />
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative bg-charcoal-900 border border-gold-500/30 rounded-3xl p-6 max-w-md w-full shadow-2xl z-10 text-left font-sans"
              >
                <div className="flex justify-between items-center pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gold-400" />
                    <h3 className="text-base font-bold text-white font-display">Assign / Change Deadline</h3>
                  </div>
                  <button onClick={() => setEditingDeadlineProjectId(null)} className="p-1 text-gray-400 hover:text-white cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="my-4 space-y-4">
                  <div className="bg-charcoal-950 p-3 rounded-2xl border border-white/5 space-y-1">
                    <span className="text-[10px] font-mono text-gray-500 uppercase block">Selected Project</span>
                    <p className="text-sm font-bold text-white font-display">
                      {targetProject.projectName || targetProject.coupleName}
                    </p>
                    <p className="text-[10px] text-gold-400 font-mono">
                      ID: {targetProject.id} • Studio: {targetProject.studioName}
                    </p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1.5">Delivery Deadline Date</label>
                    <input
                      type="date"
                      value={quickDeadlineDate}
                      onChange={(e) => setQuickDeadlineDate(e.target.value)}
                      onClick={(e) => { try { e.currentTarget.showPicker(); } catch (err) {} }}
                      className="w-full bg-charcoal-950 border border-gold-500/30 rounded-xl px-4 py-2.5 text-xs text-gold-300 font-mono focus:outline-none focus:border-gold-400 cursor-pointer"
                    />
                  </div>

                  <div>
                    <span className="block text-[10px] font-mono text-gray-400 uppercase mb-2">Quick Deadline Presets (from Shoot Date)</span>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: '+7 Days', days: 7 },
                        { label: '+15 Days', days: 15 },
                        { label: '+30 Days', days: 30 },
                        { label: '+45 Days', days: 45 },
                      ].map(preset => (
                        <button
                          key={preset.days}
                          type="button"
                          onClick={() => {
                            const baseDate = targetProject.shootDate || new Date().toISOString().split('T')[0];
                            const target = new Date(new Date(baseDate).getTime() + preset.days * 24 * 3600 * 1000);
                            setQuickDeadlineDate(target.toISOString().split('T')[0]);
                          }}
                          className="px-2 py-2 bg-charcoal-950 hover:bg-gold-500/20 border border-gold-500/20 text-gold-300 rounded-xl text-[10px] font-bold font-mono transition-all cursor-pointer text-center"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setEditingDeadlineProjectId(null)}
                    className="px-4 py-2 text-xs text-gray-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!quickDeadlineDate) {
                        alert('Please select a valid deadline date.');
                        return;
                      }
                      await onUpdateProject(targetProject.id, { deliveryDate: quickDeadlineDate });
                      setEditingDeadlineProjectId(null);
                    }}
                    className="px-5 py-2 bg-gradient-to-r from-gold-500 to-gold-400 text-charcoal-950 font-bold text-xs rounded-xl shadow-md hover:scale-105 transition-all cursor-pointer"
                  >
                    Save Deadline
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* VISUAL SIDE-BY-SIDE REVISION COMPARISON & DIFF MODAL */}
      <AnimatePresence>
        {comparingProject && (() => {
          const projRevs = (revisions || [])
            .filter(r => r.projectId === comparingProject.id)
            .sort((a, b) => a.revisionNumber - b.revisionNumber);

          const totalCount = projRevs.length;
          const resolvedCount = projRevs.filter(r => r.status === 'resolved').length;
          const pendingCount = projRevs.filter(r => r.status === 'pending').length;

          // Helper to get version detail
          const getVerData = (verId: string) => {
            if (verId === 'original') {
              return {
                id: 'original',
                label: 'Baseline Scope (Original Specs)',
                badge: 'ORIGINAL BRIEF',
                date: comparingProject.shootDate ? `Shot: ${comparingProject.shootDate}` : 'Initial Setup',
                notes: comparingProject.notes || 'No initial custom notes set during project creation.',
                status: 'Original Specification',
                statusType: 'baseline',
                revNum: 0,
                isOriginal: true
              };
            }
            if (verId === 'latest') {
              if (projRevs.length > 0) {
                const latest = projRevs[projRevs.length - 1];
                return {
                  id: latest.id,
                  label: `REV-#${latest.revisionNumber} (Latest)`,
                  badge: `REV-#${latest.revisionNumber}`,
                  date: latest.date,
                  notes: latest.notes,
                  status: latest.status === 'resolved' ? 'Fixed / Resolved' : 'Pending Request',
                  statusType: latest.status,
                  revNum: latest.revisionNumber,
                  isOriginal: false
                };
              }
              return {
                id: 'original',
                label: 'Baseline Scope',
                badge: 'ORIGINAL BRIEF',
                date: 'Initial Setup',
                notes: comparingProject.notes || 'No initial notes.',
                status: 'Original Specification',
                statusType: 'baseline',
                revNum: 0,
                isOriginal: true
              };
            }
            const found = projRevs.find(r => r.id === verId);
            if (found) {
              return {
                id: found.id,
                label: `REV-#${found.revisionNumber}`,
                badge: `REV-#${found.revisionNumber}`,
                date: found.date,
                notes: found.notes,
                status: found.status === 'resolved' ? 'Fixed / Resolved' : 'Pending Request',
                statusType: found.status,
                revNum: found.revisionNumber,
                isOriginal: false
              };
            }
            return {
              id: 'unknown',
              label: 'Unknown Version',
              badge: 'N/A',
              date: '-',
              notes: 'No specs found.',
              status: 'Unknown',
              statusType: 'unknown',
              revNum: 0,
              isOriginal: false
            };
          };

          const verA = getVerData(compareRevAId);
          const verB = getVerData(compareRevBId);

          const handleSwap = () => {
            const temp = compareRevAId;
            setCompareRevAId(compareRevBId);
            setCompareRevBId(temp);
          };

          // Handle adding a revision directly inside the comparison modal
          const handleAddRevInModalSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            if (!modalNewRevNotes.trim()) return;
            const nextRevNum = projRevs.length + 1;
            await onAddRevision({
              projectId: comparingProject.id,
              revisionNumber: nextRevNum,
              notes: modalNewRevNotes,
              date: new Date().toISOString().split('T')[0],
              status: 'pending'
            });
            setModalNewRevNotes('');
            setIsAddingRevInModal(false);
            setCompareRevBId('latest');
          };

          // Copy summary report to clipboard
          const handleCopySummary = () => {
            const summaryText = `[REVISION COMPARISON REPORT]
Project: ${comparingProject.projectName || comparingProject.coupleName} (ID: ${comparingProject.id})
Total Revisions: ${totalCount} (${resolvedCount} Resolved, ${pendingCount} Pending)

--- VERSION A (${verA.label}) ---
Date: ${verA.date}
Status: ${verA.status}
Notes:
${verA.notes}

--- VERSION B (${verB.label}) ---
Date: ${verB.date}
Status: ${verB.status}
Notes:
${verB.notes}
            `;
            navigator.clipboard.writeText(summaryText);
            setCopiedComparison(true);
            setTimeout(() => setCopiedComparison(false), 2000);
          };

          return (
            <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-6">
              <div 
                className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
                onClick={() => setComparingProject(null)} 
              />

              <motion.div
                initial={{ scale: 0.92, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.92, opacity: 0, y: 15 }}
                className="relative bg-charcoal-900 border border-gold-500/40 rounded-[32px] p-5 sm:p-7 max-w-5xl w-full shadow-[0_25px_70px_rgba(0,0,0,0.9)] z-10 text-left font-sans my-auto max-h-[90vh] flex flex-col"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 shrink-0 gap-3">
                  <div className="flex items-start space-x-3">
                    <div className="p-2.5 rounded-2xl bg-gold-500/20 text-gold-400 border border-gold-500/30 shrink-0">
                      <GitCompare className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-mono tracking-widest text-gold-400 uppercase font-bold bg-gold-500/10 px-2 py-0.5 rounded-md border border-gold-500/20">
                          Side-by-Side Visual Diff
                        </span>
                        <span className="text-[10px] font-mono text-gray-400">
                          ID: {comparingProject.id}
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold text-white font-display mt-0.5">
                        {comparingProject.projectName || comparingProject.coupleName}
                      </h2>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">
                        {comparingProject.eventType} • Studio: {comparingProject.studioName}
                      </p>
                    </div>
                  </div>

                  {/* Summary Stats & Close Button */}
                  <div className="flex items-center space-x-3 shrink-0 self-end sm:self-center">
                    <div className="flex items-center space-x-2 px-3 py-1.5 rounded-2xl bg-black/50 border border-white/10 text-xs font-mono">
                      <div className="flex flex-col text-right">
                        <span className="text-[9px] text-gray-400 uppercase">Total Logged</span>
                        <span className="font-bold text-gold-300">{totalCount} Revisions</span>
                      </div>
                      <div className="h-6 w-px bg-white/10 mx-1" />
                      <div className="flex items-center space-x-1.5">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                          {resolvedCount} Fixed
                        </span>
                        {pendingCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold text-[10px] animate-pulse">
                            {pendingCount} Pending
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setComparingProject(null)}
                      className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Main Scrollable Content */}
                <div className="overflow-y-auto pr-1 my-4 space-y-5 flex-1 custom-scrollbar">
                  {/* Selector Bar & Swap Control */}
                  <div className="bg-black/60 p-3.5 rounded-2xl border border-gold-500/20 flex flex-col md:flex-row items-center justify-between gap-3">
                    {/* Left Selector (Version A) */}
                    <div className="w-full md:w-5/12 space-y-1">
                      <label className="text-[10px] font-mono text-gold-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Side A (Baseline / Prior)</span>
                        <span className="text-gray-500">[{verA.badge}]</span>
                      </label>
                      <select
                        value={compareRevAId}
                        onChange={(e) => setCompareRevAId(e.target.value)}
                        className="w-full bg-charcoal-950 border border-white/20 focus:border-gold-500 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none cursor-pointer"
                      >
                        <option value="original">Original Project Scope / Initial Brief</option>
                        {projRevs.map((r) => (
                          <option key={r.id} value={r.id}>
                            REV-#{r.revisionNumber} ({r.date}) — {r.status.toUpperCase()}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Center Swap Button */}
                    <button
                      type="button"
                      onClick={handleSwap}
                      className="p-2.5 rounded-xl bg-gold-500/10 hover:bg-gold-500/30 border border-gold-500/30 text-gold-400 hover:text-gold-200 transition-all cursor-pointer shrink-0"
                      title="Swap Left and Right Panels"
                    >
                      <ArrowLeftRight className="w-4 h-4" />
                    </button>

                    {/* Right Selector (Version B) */}
                    <div className="w-full md:w-5/12 space-y-1">
                      <label className="text-[10px] font-mono text-gold-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Side B (Target / Revision)</span>
                        <span className="text-gray-500">[{verB.badge}]</span>
                      </label>
                      <select
                        value={compareRevBId}
                        onChange={(e) => setCompareRevBId(e.target.value)}
                        className="w-full bg-charcoal-950 border border-white/20 focus:border-gold-500 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none cursor-pointer"
                      >
                        <option value="latest">Latest Active Revision ({projRevs.length > 0 ? `REV-#${projRevs[projRevs.length-1].revisionNumber}` : 'None'})</option>
                        <option value="original">Original Project Scope / Initial Brief</option>
                        {projRevs.map((r) => (
                          <option key={r.id} value={r.id}>
                            REV-#{r.revisionNumber} ({r.date}) — {r.status.toUpperCase()}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* SIDE-BY-SIDE PANELS GRID */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* PANEL A */}
                    <div className="bg-charcoal-950/80 rounded-2xl border border-white/10 p-4 flex flex-col justify-between space-y-3 relative overflow-hidden group">
                      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
                      
                      <div>
                        {/* Panel Header */}
                        <div className="flex justify-between items-start pb-3 border-b border-white/10">
                          <div>
                            <span className="text-[9px] font-mono text-blue-400 uppercase tracking-widest font-bold block">
                              Version A Specs
                            </span>
                            <h3 className="text-sm font-bold text-white font-display mt-0.5">
                              {verA.label}
                            </h3>
                            <span className="text-[10px] text-gray-400 font-mono">
                              Date: {verA.date}
                            </span>
                          </div>

                          <div className="shrink-0 text-right">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border block ${
                              verA.statusType === 'baseline'
                                ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                : verA.statusType === 'resolved'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            }`}>
                              {verA.status}
                            </span>
                          </div>
                        </div>

                        {/* Panel Content Specs Box */}
                        <div className="mt-3 p-3.5 bg-black/50 rounded-xl border border-white/5 space-y-2 min-h-[140px]">
                          <span className="text-[10px] font-mono text-gray-500 uppercase block border-b border-white/5 pb-1">
                            Specs & Requirements Log
                          </span>
                          <p className="text-xs text-gray-300 font-sans leading-relaxed whitespace-pre-wrap">
                            {verA.notes}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-white/5 text-[10px] font-mono text-gray-500 flex justify-between">
                        <span>Type: {verA.isOriginal ? 'Baseline Specification' : 'Client Revision Spec'}</span>
                        <span>Rev #{verA.revNum}</span>
                      </div>
                    </div>

                    {/* PANEL B */}
                    <div className="bg-charcoal-950/80 rounded-2xl border border-gold-500/30 p-4 flex flex-col justify-between space-y-3 relative overflow-hidden group shadow-lg">
                      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-gold-500 to-amber-500" />
                      
                      <div>
                        {/* Panel Header */}
                        <div className="flex justify-between items-start pb-3 border-b border-white/10">
                          <div>
                            <span className="text-[9px] font-mono text-gold-400 uppercase tracking-widest font-bold block">
                              Version B Specs
                            </span>
                            <h3 className="text-sm font-bold text-white font-display mt-0.5">
                              {verB.label}
                            </h3>
                            <span className="text-[10px] text-gray-400 font-mono">
                              Date: {verB.date}
                            </span>
                          </div>

                          <div className="shrink-0 text-right flex flex-col items-end space-y-1">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border block ${
                              verB.statusType === 'baseline'
                                ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                : verB.statusType === 'resolved'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            }`}>
                              {verB.status}
                            </span>

                            {/* Quick Action in Panel B if pending */}
                            {verB.statusType === 'pending' && (
                              <button
                                type="button"
                                onClick={async () => {
                                  await onResolveRevision(verB.id);
                                }}
                                className="px-2 py-0.5 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-charcoal-950 border border-emerald-500/40 rounded-md font-bold text-[9px] transition-all cursor-pointer flex items-center space-x-1"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Mark Resolved</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Panel Content Specs Box with Diff Highlight */}
                        <div className="mt-3 p-3.5 bg-black/50 rounded-xl border border-gold-500/20 space-y-2 min-h-[140px] relative">
                          <div className="flex justify-between items-center border-b border-white/5 pb-1">
                            <span className="text-[10px] font-mono text-gold-400 uppercase block font-semibold">
                              Specs & Requirements Log
                            </span>
                            {verA.notes !== verB.notes && (
                              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                ✦ Spec Differences Detected
                              </span>
                            )}
                          </div>
                          
                          <p className={`text-xs font-sans leading-relaxed whitespace-pre-wrap ${
                            verA.notes !== verB.notes
                              ? 'text-gold-200 bg-gold-500/10 p-2 rounded-lg border-l-2 border-gold-400'
                              : 'text-gray-300'
                          }`}>
                            {verB.notes}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-white/5 text-[10px] font-mono text-gray-500 flex justify-between">
                        <span>Type: {verB.isOriginal ? 'Baseline Specification' : 'Client Revision Spec'}</span>
                        <span>Rev #{verB.revNum}</span>
                      </div>
                    </div>
                  </div>

                  {/* VISUAL DIFF & CHANGE ANALYSIS CARD */}
                  <div className="bg-charcoal-950/90 rounded-2xl border border-gold-500/20 p-4 space-y-3">
                    <div className="flex items-center space-x-2 border-b border-white/10 pb-2">
                      <Sparkles className="w-4 h-4 text-gold-400" />
                      <h4 className="text-xs font-bold font-mono text-gold-300 uppercase tracking-wider">
                        Revision Delta Analysis
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
                      <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                        <span className="text-[9px] text-gray-400 uppercase block">Status Delta</span>
                        <div className="mt-1 flex items-center space-x-1.5 text-white font-bold">
                          <span>{verA.status}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-gold-400" />
                          <span className="text-gold-300">{verB.status}</span>
                        </div>
                      </div>

                      <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                        <span className="text-[9px] text-gray-400 uppercase block">Spec Length Comparison</span>
                        <p className="mt-1 text-white font-bold">
                          {verA.notes.length} chars → {verB.notes.length} chars ({verB.notes.length - verA.notes.length > 0 ? `+${verB.notes.length - verA.notes.length}` : verB.notes.length - verA.notes.length})
                        </p>
                      </div>

                      <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                        <span className="text-[9px] text-gray-400 uppercase block">Overall Progress</span>
                        <p className="mt-1 text-emerald-400 font-bold">
                          {resolvedCount} of {totalCount} Revisions Resolved ({totalCount > 0 ? Math.round((resolvedCount/totalCount)*100) : 100}%)
                        </p>
                      </div>
                    </div>

                    {/* Timeline Sequence Chips */}
                    <div className="pt-2 border-t border-white/5">
                      <span className="text-[10px] font-mono text-gray-400 uppercase block mb-2">
                        Complete Revision History Sequence
                      </span>
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        <button
                          type="button"
                          onClick={() => {
                            setCompareRevAId('original');
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-mono border transition-all cursor-pointer shrink-0 ${
                            compareRevAId === 'original' || compareRevBId === 'original'
                              ? 'bg-blue-500/20 border-blue-500/60 text-blue-300 font-bold'
                              : 'bg-black/50 border-white/10 text-gray-400 hover:border-gold-500/30'
                          }`}
                        >
                          Original Brief
                        </button>

                        {projRevs.map((rev) => {
                          const isSelectedA = compareRevAId === rev.id;
                          const isSelectedB = compareRevBId === rev.id;
                          return (
                            <button
                              key={rev.id}
                              type="button"
                              onClick={() => {
                                if (compareRevAId === rev.id) return;
                                setCompareRevBId(rev.id);
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-mono border transition-all cursor-pointer shrink-0 flex items-center space-x-1.5 ${
                                isSelectedB
                                  ? 'bg-gold-500/20 border-gold-500/60 text-gold-300 font-bold'
                                  : isSelectedA
                                  ? 'bg-blue-500/20 border-blue-500/60 text-blue-300 font-bold'
                                  : 'bg-black/50 border-white/10 text-gray-400 hover:border-gold-500/30'
                              }`}
                            >
                              <span>REV-#{rev.revisionNumber}</span>
                              <span className={`w-1.5 h-1.5 rounded-full ${rev.status === 'resolved' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Inline New Revision Form within Modal */}
                  {isAddingRevInModal && (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      onSubmit={handleAddRevInModalSubmit}
                      className="p-4 bg-black/80 rounded-2xl border border-gold-500/40 space-y-3"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold font-mono text-gold-400 uppercase">
                          Log New Revision Request (REV-#{projRevs.length + 1})
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsAddingRevInModal(false)}
                          className="text-gray-400 hover:text-white text-xs"
                        >
                          Cancel
                        </button>
                      </div>

                      <textarea
                        placeholder="Type client revision specs..."
                        value={modalNewRevNotes}
                        onChange={(e) => setModalNewRevNotes(e.target.value)}
                        className="w-full bg-charcoal-950 border border-white/20 focus:border-gold-500 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none resize-none h-20"
                        required
                      />

                      <div className="flex justify-end space-x-2">
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-gradient-to-r from-gold-500 to-gold-400 text-charcoal-950 font-bold text-xs rounded-xl shadow cursor-pointer"
                        >
                          Add & Compare
                        </button>
                      </div>
                    </motion.form>
                  )}
                </div>

                {/* Modal Footer Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-white/10 shrink-0 gap-3">
                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setIsAddingRevInModal(!isAddingRevInModal)}
                      className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-gold-500/20 hover:bg-gold-500/30 border border-gold-500/40 text-gold-300 text-xs font-bold font-mono flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4 text-gold-400" />
                      <span>Add New Revision</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopySummary}
                      className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-mono flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                    >
                      {copiedComparison ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span>Copy Report</span>
                        </>
                      )}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setComparingProject(null)}
                    className="w-full sm:w-auto px-6 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Close Comparison
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
      {/* Branded Wedding Worksheet Modal */}
      <ProjectWorksheetModal
        project={worksheetProject}
        revisions={revisions}
        studios={studios}
        editors={editors}
        isOpen={isWorksheetModalOpen}
        onClose={() => setIsWorksheetModalOpen(false)}
      />
    </div>
  );
});

export default ProjectsView;
