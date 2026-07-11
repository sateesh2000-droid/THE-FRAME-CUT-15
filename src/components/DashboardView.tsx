import React, { useState, useEffect, useMemo } from 'react';
import { 
  Film, 
  TrendingUp, 
  IndianRupee, 
  Users, 
  Calendar as CalendarIcon,
  Bell,
  ArrowUpRight,
  TrendingDown,
  Sparkles,
  Layers,
  CheckCircle,
  Clock,
  Plus,
  Sprout,
  Flower,
  Flower2,
  Heart,
  Palette,
  Compass,
  Layout,
  Menu,
  ChevronRight,
  Sparkle,
  Eye,
  Settings,
  Copy,
  MessageSquare,
  AlertTriangle,
  AlertCircle,
  Volume2,
  EyeOff,
  BellRing,
  Activity,
  Search,
  Building2,
  X,
  MapPin,
  ExternalLink,
  Edit,
  Trash2,
  Pin,
  FileText,
  User,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  LineChart,
  Line
} from 'recharts';
import { Project, Studio, Editor, Expense, AppNotification, CalendarEvent, Invoice, PaymentHistory } from '../types';
import Logo from './Logo';

interface DashboardViewProps {
  projects: Project[];
  studios: Studio[];
  editors: Editor[];
  expenses: Expense[];
  notifications: AppNotification[];
  calendarEvents: CalendarEvent[];
  onQuickAction: (tab: string, subAction?: string) => void;
  isOnline: boolean;
  invoices?: Invoice[];
  payments: PaymentHistory[];
  onLogPayment: (pay: Omit<PaymentHistory, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateProject: (id: string, updates: Partial<Project>) => Promise<void>;
}

const DashboardView = React.memo(function DashboardView({
  projects,
  studios,
  editors,
  expenses,
  notifications,
  calendarEvents,
  onQuickAction,
  isOnline,
  invoices = [],
  payments = [],
  onLogPayment,
  onUpdateProject
}: DashboardViewProps) {
  const [activeTheme, setActiveTheme] = useState<'classic' | 'organic'>('organic');
  const [reminderTab, setReminderTab] = useState<'payment' | 'project'>('payment');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [snoozedIds, setSnoozedIds] = useState<string[]>([]);
  const [alarmActive, setAlarmActive] = useState<boolean>(false);
  const [severityFilter, setSeverityFilter] = useState<'all' | 'urgent'>('all');

  // Global Search states
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedInspectItem, setSelectedInspectItem] = useState<{
    type: 'project' | 'studio' | 'editor';
    data: any;
  } | null>(null);

  // Quick edit states for project in the inspector
  const [inspectStatus, setInspectStatus] = useState<string>('');
  const [inspectPriority, setInspectPriority] = useState<string>('');
  const [inspectHddName, setInspectHddName] = useState('');
  const [inspectDataSize, setInspectDataSize] = useState('');
  const [inspectLocation, setInspectLocation] = useState('');
  const [inspectRawFolder, setInspectRawFolder] = useState('');
  const [inspectDriveLink, setInspectDriveLink] = useState('');
  const [isUpdatingInspectProject, setIsUpdatingInspectProject] = useState(false);

  useEffect(() => {
    if (selectedInspectItem && selectedInspectItem.type === 'project') {
      const proj = selectedInspectItem.data;
      setInspectStatus(proj.status || 'data_received');
      setInspectPriority(proj.priority || 'medium');
      setInspectHddName(proj.hardDiskName || '');
      setInspectDataSize(proj.dataSize || '');
      setInspectLocation(proj.location || '');
      setInspectRawFolder(proj.rawDataFolder || '');
      setInspectDriveLink(proj.googleDriveLink || '');
    }
  }, [selectedInspectItem]);

  const handleSaveInspectProject = async () => {
    if (!selectedInspectItem || selectedInspectItem.type !== 'project') return;
    setIsUpdatingInspectProject(true);
    try {
      const projId = selectedInspectItem.data.id;
      const updates = {
        status: inspectStatus as any,
        priority: inspectPriority as any,
        hardDiskName: inspectHddName,
        dataSize: inspectDataSize,
        location: inspectLocation,
        rawDataFolder: inspectRawFolder,
        googleDriveLink: inspectDriveLink,
      };
      await onUpdateProject(projId, updates);
      
      // Update the selected inspect item's data locally so the inspector updates immediately!
      setSelectedInspectItem({
        type: 'project',
        data: {
          ...selectedInspectItem.data,
          ...updates,
        }
      });
    } catch (err) {
      console.error('Error saving inspect project quick-edits:', err);
    } finally {
      setIsUpdatingInspectProject(false);
    }
  };

  // Payment Ledger Modal States
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<'studio' | 'editor'>('studio');
  const [selectedStudioId, setSelectedStudioId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedEditorIdToPay, setSelectedEditorIdToPay] = useState('');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('GPay');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Reset selected studio and project when modal opens
  useEffect(() => {
    if (isPaymentModalOpen) {
      setSelectedEditorIdToPay('');
      setSelectedProjectId('');
      setPaymentAmount(0);
      setPaymentNotes('');
      setPaymentError('');
      setPaymentSuccess('');
    }
  }, [isPaymentModalOpen]);

  // Calculate general studio financial states
  const studioFinancialSummary = useMemo(() => {
    if (!selectedStudioId) return null;
    const studioProjects = projects.filter(p => p.studioId === selectedStudioId);
    const totalContract = studioProjects.reduce((sum, p) => sum + (p.projectAmount || 0), 0);
    const totalReceived = studioProjects.reduce((sum, p) => sum + (p.advancePayment || 0), 0);
    const totalOutstanding = studioProjects.reduce((sum, p) => sum + (p.remainingBalance || 0), 0);
    return {
      totalContract,
      totalReceived,
      totalOutstanding,
      projectCount: studioProjects.length
    };
  }, [projects, selectedStudioId]);

  // Calculate general editor financial states
  const editorFinancialSummary = useMemo(() => {
    if (!selectedEditorIdToPay) return null;
    const editorProjects = projects.filter(p => p.assignedEditorId === selectedEditorIdToPay || p.secondEditorId === selectedEditorIdToPay);
    
    let totalBudget = 0;
    editorProjects.forEach(p => {
      if (p.isSplitProject) {
        if (p.assignedEditorId === selectedEditorIdToPay) totalBudget += (p.firstEditorShare || 0);
        else if (p.secondEditorId === selectedEditorIdToPay) totalBudget += (p.secondEditorShare || 0);
      } else {
        totalBudget += (p.editorPayment || 0);
      }
    });

    const totalPaid = payments
      .filter(pay => pay.entityId === selectedEditorIdToPay && pay.entityType === 'editor')
      .reduce((sum, pay) => sum + (pay.amount || 0), 0);

    const totalPending = Math.max(0, totalBudget - totalPaid);

    return {
      totalBudget,
      totalPaid,
      totalPending,
      projectCount: editorProjects.length
    };
  }, [projects, payments, selectedEditorIdToPay]);

  // Premium synthesizer to play a cinematic modern chime natively (via Web Audio API)
  const playCinematicChime = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const now = ctx.currentTime;
      
      // We synthesize a beautiful premium cinematic chord: G4, C5, E5, G5 (warm metallic bell with soft decay)
      const freqs = [392.00, 523.25, 659.25, 783.99];
      
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        // Use a triangle wave for softer organic woody/bell timbre, mixed with a sine wave
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        
        // Add subtle vibrato
        osc.frequency.linearRampToValueAtTime(freq + (idx === 1 ? 1.5 : -1), now + 1.8);
        
        gainNode.gain.setValueAtTime(0, now);
        // Fade in quickly to avoid clicks
        gainNode.gain.linearRampToValueAtTime(0.12 / freqs.length, now + 0.04);
        // Smooth analog logarithmic exponential decay
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + 2.2);
      });
      
      // Temporarily flash the visual alarm active ring for aesthetic high feedback
      setAlarmActive(true);
      const timer = setTimeout(() => setAlarmActive(false), 2200);
      return () => clearTimeout(timer);
    } catch (error) {
      console.warn('Web Audio playback failed:', error);
    }
  };

  // Auto-clear copied state feedback
  useEffect(() => {
    if (copiedId) {
      const timer = setTimeout(() => setCopiedId(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedId]);

  // Handle Payment Log Submission
  const handleLogPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError('');
    setPaymentSuccess('');

    if (paymentType === 'studio' && !selectedStudioId) {
      setPaymentError('Please select a Studio Partner first.');
      return;
    }
    if (paymentType === 'editor' && !selectedEditorIdToPay) {
      setPaymentError('Please select a Video Editor first.');
      return;
    }
    if (paymentAmount <= 0) {
      setPaymentError('Please enter a valid amount greater than ₹0.');
      return;
    }

    setIsSubmittingPayment(true);
    try {
      if (paymentType === 'studio') {
        const studio = studios.find(s => s.id === selectedStudioId);
        if (!studio) {
          setPaymentError('Selected studio could not be found.');
          setIsSubmittingPayment(false);
          return;
        }

        const studioProjects = projects.filter(p => p.studioId === selectedStudioId);

        if (studioProjects.length === 0) {
          // If no projects, log a general ledger entry
          const paymentData = {
            entityId: selectedStudioId,
            entityType: 'studio' as const,
            projectId: 'general_ledger',
            projectCoupleName: 'General Studio Payment',
            amount: paymentAmount,
            date: paymentDate,
            paymentMethod,
            notes: paymentNotes || `Received payment from ${studio.name} for general ledger balance.`
          };
          await onLogPayment(paymentData);
          setPaymentSuccess(`Successfully recorded payment of ₹${paymentAmount.toLocaleString('en-IN')} from ${studio.name} to general ledger!`);
        } else {
          // Reconcile across outstanding projects first
          let remainingPayAmount = paymentAmount;
          const outstandingProjects = studioProjects.filter(p => (p.remainingBalance || 0) > 0);

          // If there are outstanding projects, pay them off in sequence
          if (outstandingProjects.length > 0) {
            for (const proj of outstandingProjects) {
              if (remainingPayAmount <= 0) break;
              const amountToApply = Math.min(proj.remainingBalance || 0, remainingPayAmount);
              if (amountToApply > 0) {
                const paymentData = {
                  entityId: selectedStudioId,
                  entityType: 'studio' as const,
                  projectId: proj.id,
                  projectCoupleName: proj.coupleName,
                  amount: amountToApply,
                  date: paymentDate,
                  paymentMethod,
                  notes: paymentNotes || `Received payment for ${proj.coupleName} Wedding film.`
                };
                await onLogPayment(paymentData);

                // Update project balances
                const newAdvance = (proj.advancePayment || 0) + amountToApply;
                const newRemaining = Math.max(0, (proj.projectAmount || 0) - newAdvance);
                await onUpdateProject(proj.id, {
                  advancePayment: newAdvance,
                  remainingBalance: newRemaining
                });

                remainingPayAmount -= amountToApply;
              }
            }
          }

          // If there's still a remaining amount, or if there were no outstanding projects at all,
          // apply the leftover / payment to the first project
          if (remainingPayAmount > 0) {
            const targetProj = outstandingProjects[0] || studioProjects[0];
            const paymentData = {
              entityId: selectedStudioId,
              entityType: 'studio' as const,
              projectId: targetProj.id,
              projectCoupleName: targetProj.coupleName,
              amount: remainingPayAmount,
              date: paymentDate,
              paymentMethod,
              notes: paymentNotes || `Received payment for ${targetProj.coupleName} Wedding film.`
            };
            await onLogPayment(paymentData);

            // Update project balances
            const newAdvance = (targetProj.advancePayment || 0) + remainingPayAmount;
            const newRemaining = Math.max(0, (targetProj.projectAmount || 0) - newAdvance);
            await onUpdateProject(targetProj.id, {
              advancePayment: newAdvance,
              remainingBalance: newRemaining
            });
          }

          playCinematicChime();
          setPaymentSuccess(`Successfully recorded payment of ₹${paymentAmount.toLocaleString('en-IN')} from ${studio.name}! Reconciled across projects.`);
        }
      } else {
        // editor payout
        const editor = editors.find(e => e.id === selectedEditorIdToPay);
        if (!editor) {
          setPaymentError('Selected editor could not be found.');
          setIsSubmittingPayment(false);
          return;
        }

        const editorProjects = projects.filter(p => p.assignedEditorId === selectedEditorIdToPay || p.secondEditorId === selectedEditorIdToPay);

        if (editorProjects.length === 0) {
          // Log a general ledger entry for editor
          const paymentData = {
            entityId: selectedEditorIdToPay,
            entityType: 'editor' as const,
            projectId: 'general_ledger',
            projectCoupleName: 'General Editor Payout',
            amount: paymentAmount,
            date: paymentDate,
            paymentMethod,
            notes: paymentNotes || `Paid to editor ${editor.name} for general services.`
          };
          await onLogPayment(paymentData);
          setPaymentSuccess(`Successfully recorded payout of ₹${paymentAmount.toLocaleString('en-IN')} to editor ${editor.name}!`);
        } else {
          // Calculate pending balance for this editor on each project, and reconcile
          let remainingPayAmount = paymentAmount;
          
          const projectsWithPending = editorProjects.map(p => {
            let budget = 0;
            if (p.isSplitProject) {
              if (p.assignedEditorId === selectedEditorIdToPay) budget = p.firstEditorShare || 0;
              else if (p.secondEditorId === selectedEditorIdToPay) budget = p.secondEditorShare || 0;
            } else {
              budget = p.editorPayment || 0;
            }

            const alreadyPaid = payments
              .filter(pay => pay.projectId === p.id && pay.entityId === selectedEditorIdToPay && pay.entityType === 'editor')
              .reduce((sum, pay) => sum + (pay.amount || 0), 0);

            const pending = Math.max(0, budget - alreadyPaid);
            return { p, pending };
          }).filter(item => item.pending > 0);

          if (projectsWithPending.length > 0) {
            for (const item of projectsWithPending) {
              if (remainingPayAmount <= 0) break;
              const amountToApply = Math.min(item.pending, remainingPayAmount);
              if (amountToApply > 0) {
                const paymentData = {
                  entityId: selectedEditorIdToPay,
                  entityType: 'editor' as const,
                  projectId: item.p.id,
                  projectCoupleName: item.p.coupleName,
                  amount: amountToApply,
                  date: paymentDate,
                  paymentMethod,
                  notes: paymentNotes || `Paid to editor ${editor.name} for ${item.p.coupleName} Wedding film.`
                };
                await onLogPayment(paymentData);
                remainingPayAmount -= amountToApply;
              }
            }
          }

          if (remainingPayAmount > 0) {
            const targetProj = projectsWithPending[0]?.p || editorProjects[0];
            const paymentData = {
              entityId: selectedEditorIdToPay,
              entityType: 'editor' as const,
              projectId: targetProj.id,
              projectCoupleName: targetProj.coupleName,
              amount: remainingPayAmount,
              date: paymentDate,
              paymentMethod,
              notes: paymentNotes || `Paid to editor ${editor.name} for ${targetProj.coupleName} Wedding film.`
            };
            await onLogPayment(paymentData);
          }

          playCinematicChime();
          setPaymentSuccess(`Successfully recorded payout of ₹${paymentAmount.toLocaleString('en-IN')} to editor ${editor.name}! Reconciled across projects.`);
        }
      }

      // Reset form states
      setPaymentAmount(0);
      setPaymentNotes('');
      setTimeout(() => {
        setIsPaymentModalOpen(false);
        setPaymentSuccess('');
      }, 1800);

    } catch (err: any) {
      console.error('Error logging payment:', err);
      setPaymentError(err.message || 'An error occurred while saving the transaction.');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Dynamic Metrics Calculations
  const totalProjectsCount = projects.length;
  
  const activeProjects = projects.filter(p => p.status !== 'closed' && p.status !== 'delivered');
  const activeProjectsCount = activeProjects.length;
  
  const pendingProjectsCount = projects.filter(p => p.status === 'data_received' || p.status === 'assigned' || p.status === 'editing').length;
  const completedProjectsCount = projects.filter(p => p.status === 'delivered' || p.status === 'closed').length;

  // Finance calculations
  const totalRevenue = projects.reduce((sum, p) => sum + (p.projectAmount || 0), 0);
  const editorPaymentsTotal = projects.reduce((sum, p) => sum + (p.editorPayment || 0), 0);
  const projectExpensesTotal = projects.reduce((sum, p) => sum + (p.otherExpenses || 0), 0);
  const manualExpensesTotal = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  
  const totalExpenses = editorPaymentsTotal + projectExpensesTotal + manualExpensesTotal;
  const totalProfit = totalRevenue - totalExpenses;

  // Overdue Invoices
  const overdueInvoicesList = useMemo(() => {
    return (invoices || []).filter(inv => {
      const isOverdueStatus = inv.status === 'overdue';
      const isOverdueDate = new Date(inv.dueDate).getTime() < Date.now() && inv.balanceDue > 0 && inv.status !== 'paid';
      return isOverdueStatus || isOverdueDate;
    });
  }, [invoices]);

  // Unpaid Editor Ledger Entries
  const unpaidEditorsList = useMemo(() => {
    const list: {
      editorId: string;
      editorName: string;
      projectId: string;
      coupleName: string;
      shootDate: string;
      deliveryDate: string;
      budget: number;
      paid: number;
      pending: number;
      roleType: string;
    }[] = [];

    projects.forEach(p => {
      // Lead Editor
      if (p.assignedEditorId) {
        const budget = p.isSplitProject ? (p.firstEditorShare || 0) : (p.editorPayment || 0);
        const paid = payments
          .filter(pay => pay.projectId === p.id && pay.entityId === p.assignedEditorId && pay.entityType === 'editor')
          .reduce((sum, pay) => sum + (pay.amount || 0), 0);
        const pending = budget - paid;
        if (pending > 0) {
          list.push({
            editorId: p.assignedEditorId,
            editorName: p.assignedEditorName || 'Unassigned',
            projectId: p.id,
            coupleName: p.coupleName || 'Wedding Film',
            shootDate: p.shootDate,
            deliveryDate: p.deliveryDate,
            budget,
            paid,
            pending,
            roleType: p.isSplitProject ? 'Lead Share' : 'Lead Editor'
          });
        }
      }

      // Split/Second Editor
      if (p.isSplitProject && p.secondEditorId) {
        const budget = p.secondEditorShare || 0;
        const paid = payments
          .filter(pay => pay.projectId === p.id && pay.entityId === p.secondEditorId && pay.entityType === 'editor')
          .reduce((sum, pay) => sum + (pay.amount || 0), 0);
        const pending = budget - paid;
        if (pending > 0) {
          list.push({
            editorId: p.secondEditorId,
            editorName: p.secondEditorName || 'Unassigned',
            projectId: p.id,
            coupleName: p.coupleName || 'Wedding Film',
            shootDate: p.shootDate,
            deliveryDate: p.deliveryDate,
            budget,
            paid,
            pending,
            roleType: 'Second Editor Share'
          });
        }
      }
    });
    return list;
  }, [projects, payments]);

  const totalNeedsAttentionCount = overdueInvoicesList.length + unpaidEditorsList.length;

  const activeStudiosCount = studios.length;
  const activeEditorsCount = editors.length;

  // Quick Stats config
  const statCards = [
    { 
      id: 'total-projects', 
      title: 'Total Projects', 
      value: totalProjectsCount, 
      sub: `${completedProjectsCount} Completed`, 
      icon: Film, 
      color: 'from-emerald-950/40 to-charcoal-900', 
      border: 'border-emerald-500/20' 
    },
    { 
      id: 'active-projects', 
      title: 'Active Projects', 
      value: activeProjectsCount, 
      sub: `${pendingProjectsCount} Pending Cuts`, 
      icon: Clock, 
      color: 'from-yellow-950/40 to-charcoal-900', 
      border: 'border-yellow-500/20' 
    },
    { 
      id: 'revenue', 
      title: 'Total Revenue', 
      value: `₹${totalRevenue.toLocaleString('en-IN')}`, 
      sub: `₹${(totalRevenue - projects.reduce((sum, p) => sum + (p.advancePayment || 0), 0)).toLocaleString('en-IN')} Balance`, 
      icon: TrendingUp, 
      color: 'from-luxury-green-950/60 to-charcoal-900', 
      border: 'border-gold-500/30' 
    },
    { 
      id: 'expenses', 
      title: 'Expenses', 
      value: `₹${totalExpenses.toLocaleString('en-IN')}`, 
      sub: `₹${manualExpensesTotal.toLocaleString('en-IN')} Office / Disks`, 
      icon: TrendingDown, 
      color: 'from-red-950/30 to-charcoal-900', 
      border: 'border-red-500/20' 
    },
    { 
      id: 'profit', 
      title: 'Net Profit', 
      value: `₹${totalProfit.toLocaleString('en-IN')}`, 
      sub: `${totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}% Profit Margin`, 
      icon: Sparkles, 
      color: 'from-gold-950/30 to-charcoal-900', 
      border: 'border-gold-500/40' 
    },
    { 
      id: 'studios', 
      title: 'Active Studios', 
      value: activeStudiosCount, 
      sub: 'Affiliated Agencies', 
      icon: Layers, 
      color: 'from-purple-950/20 to-charcoal-900', 
      border: 'border-purple-500/20' 
    }
  ];

  // Mock data for charts generated based on loaded project data
  const chartData = [
    { name: 'Jan', Revenue: totalRevenue * 0.12, Profit: totalProfit * 0.11 },
    { name: 'Feb', Revenue: totalRevenue * 0.15, Profit: totalProfit * 0.14 },
    { name: 'Mar', Revenue: totalRevenue * 0.18, Profit: totalProfit * 0.16 },
    { name: 'Apr', Revenue: totalRevenue * 0.14, Profit: totalProfit * 0.13 },
    { name: 'May', Revenue: totalRevenue * 0.22, Profit: totalProfit * 0.23 },
    { name: 'Jun', Revenue: totalRevenue * 0.19, Profit: totalProfit * 0.23 },
  ];

  // Dynamic monthly project completion & inflow trends for Sparkline charts
  const sparklineData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const list = [];
    
    // Last 6 calendar months in chronological order
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mIdx = targetDate.getMonth();
      const yr = targetDate.getFullYear();
      const monthLabel = months[mIdx];
      const prefix = `${yr}-${String(mIdx + 1).padStart(2, '0')}`;
      
      // Projects completed (delivered/closed) in this month
      const completedCount = projects.filter(p => {
        const isCompleted = p.status === 'delivered' || p.status === 'closed';
        if (!isCompleted) return false;
        const dateStr = p.deliveryDate || p.shootDate;
        return dateStr && dateStr.startsWith(prefix);
      }).length;

      // Total projects received / registered in this month
      const totalCount = projects.filter(p => {
        const dateStr = p.shootDate || p.deliveryDate;
        return dateStr && dateStr.startsWith(prefix);
      }).length;

      list.push({
        month: monthLabel,
        completed: completedCount,
        total: totalCount,
      });
    }

    // Fallback if there are absolutely no projects registered to maintain elegant UI presentation
    const hasData = projects.length > 0;
    if (!hasData) {
      return [
        { month: 'Feb', completed: 2, total: 3 },
        { month: 'Mar', completed: 4, total: 5 },
        { month: 'Apr', completed: 3, total: 6 },
        { month: 'May', completed: 6, total: 8 },
        { month: 'Jun', completed: 5, total: 7 },
        { month: 'Jul', completed: 8, total: 10 }
      ];
    }
    return list;
  }, [projects]);

  // Studio Performance Data
  const studioPerformanceData = studios.map(studio => {
    const studioProjs = projects.filter(p => p.studioId === studio.id);
    const amount = studioProjs.reduce((sum, p) => sum + (p.projectAmount || 0), 0);
    return {
      name: studio.name.length > 12 ? `${studio.name.substring(0, 12)}...` : studio.name,
      Revenue: amount,
      Projects: studioProjs.length
    };
  }).sort((a, b) => b.Revenue - a.Revenue).slice(0, 5);

  // Editor performance data
  const editorPerformanceData = editors.map(editor => {
    const editorProjs = projects.filter(p => p.assignedEditorId === editor.id);
    const completed = editorProjs.filter(p => p.status === 'delivered' || p.status === 'closed').length;
    return {
      name: editor.name,
      Assigned: editorProjs.length,
      Completed: completed
    };
  });

  // Payment Reminders Calculations (from Invoices and outstanding Project balances)
  const paymentRemindersList = [
    ...invoices
      .filter(inv => inv.status !== 'paid' && inv.balanceDue > 0)
      .map(inv => ({
        id: inv.id,
        type: 'invoice',
        coupleName: inv.coupleName,
        studioName: inv.studioName,
        amount: inv.balanceDue,
        dueDate: inv.dueDate,
        status: inv.status,
        label: `Invoice Unpaid: ${inv.id}`
      })),
    ...projects
      .filter(p => p.remainingBalance > 0 && p.status !== 'closed' && p.status !== 'delivered' && !invoices.some(inv => inv.projectId === p.id))
      .map(p => ({
        id: p.id,
        type: 'project',
        coupleName: p.coupleName,
        studioName: p.studioName,
        amount: p.remainingBalance,
        dueDate: p.deliveryDate,
        status: 'pending',
        label: `Outstanding Contract Balance`
      }))
  ].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  // Project Reminders Calculations (approaching or past-due delivery dates)
  const projectRemindersList = projects
    .filter(p => p.status !== 'closed' && p.status !== 'delivered')
    .map(p => {
      const daysLeft = Math.ceil((new Date(p.deliveryDate).getTime() - Date.now()) / (1000 * 3600 * 24));
      return {
        id: p.id,
        coupleName: p.coupleName,
        studioName: p.studioName,
        dueDate: p.deliveryDate,
        daysLeft,
        status: p.status,
        priority: p.priority,
        editorName: p.assignedEditorName || 'Unassigned'
      };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft);

  // Active session filtering & snooze support
  const filteredPaymentReminders = paymentRemindersList.filter(reminder => {
    if (snoozedIds.includes(reminder.id)) return false;
    if (severityFilter === 'urgent') {
      const isOverdue = reminder.status === 'overdue' || new Date(reminder.dueDate).getTime() < Date.now();
      return isOverdue || reminder.amount > 50000;
    }
    return true;
  });

  const filteredProjectReminders = projectRemindersList.filter(reminder => {
    if (snoozedIds.includes(reminder.id)) return false;
    if (severityFilter === 'urgent') {
      return reminder.daysLeft <= 3 || reminder.priority === 'urgent' || reminder.priority === 'high';
    }
    return true;
  });

  // Calculate critical urgency metrics
  const criticalPaymentsCount = paymentRemindersList.filter(r => {
    const isOverdue = r.status === 'overdue' || new Date(r.dueDate).getTime() < Date.now();
    return isOverdue || r.amount > 50000;
  }).length;

  const criticalProjectsCount = projectRemindersList.filter(r => {
    return r.daysLeft <= 2 || r.priority === 'urgent' || r.priority === 'high';
  }).length;

  const totalCriticalAlerts = criticalPaymentsCount + criticalProjectsCount;

  const handleSnoozeAlert = (id: string) => {
    setSnoozedIds(prev => [...prev, id]);
  };

  const handleCopyPaymentReminder = (reminder: any) => {
    const text = `Hi ${reminder.studioName} Team, friendly reminder from The Frame Cut Studio regarding the outstanding balance of ₹${reminder.amount.toLocaleString('en-IN')}. Kindly clear these dues. Thank you!`;
    navigator.clipboard.writeText(text);
    setCopiedId(reminder.id);
  };

  const handleCopyProjectReminder = (reminder: any) => {
    const text = `Hi ${reminder.editorName || 'Team'}, warm check-in from The Frame Cut Studio on the editing/cut status of ${reminder.coupleName}'s project (Studio: ${reminder.studioName}). Current status: ${reminder.status.toUpperCase().replace('_', ' ')}. Kindly update on progress. Thanks!`;
    navigator.clipboard.writeText(text);
    setCopiedId(reminder.id);
  };

  // Upcoming Deliveries list
  const upcomingDeliveries = projects
    .filter(p => p.status !== 'closed' && p.status !== 'delivered' && p.deliveryDate)
    .sort((a, b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime())
    .slice(0, 4);

  // Container motion presets
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
  };

  const renderRemindersHub = (isOrganic: boolean) => {
    const activeList = reminderTab === 'payment' ? filteredPaymentReminders : filteredProjectReminders;
    const rawListCount = reminderTab === 'payment' ? paymentRemindersList.length : projectRemindersList.length;
    const filteredCount = activeList.length;

    return (
      <div className={`p-6 rounded-3xl ${isOrganic ? 'organic-green-leaf-gradient border border-luxury-green-600/20' : 'glass-panel border border-luxury-green-800/10'} shadow-xl relative overflow-hidden mb-8 transition-all duration-500 ${alarmActive ? 'ring-2 ring-red-500/50 shadow-[0_0_40px_rgba(239,68,68,0.25)]' : ''}`}>
        {/* Background glow on alarm */}
        <div className={`absolute inset-0 bg-red-500/5 transition-opacity duration-300 pointer-events-none -z-10 ${alarmActive ? 'opacity-100' : 'opacity-0'}`} />
        <div className="absolute top-0 right-0 w-80 h-40 bg-gradient-to-br from-[#ffe699]/10 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
        
        {/* Urgent Alarm Flash Bar */}
        {totalCriticalAlerts > 0 && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="mb-4 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-red-950/75 via-amber-950/70 to-red-950/75 border border-red-500/30 rounded-2xl p-3 flex flex-col sm:flex-row justify-between items-center gap-3 shadow-inner">
              <div className="flex items-center space-x-2.5">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <span className="text-xs font-mono font-bold text-red-300 tracking-wider uppercase flex items-center space-x-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 animate-bounce" />
                  <span>CRITICAL PRODUCTION ALERTS: {totalCriticalAlerts} IMMEDIATE ACTIONS REQUIRED</span>
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setSeverityFilter('urgent');
                    playCinematicChime();
                  }}
                  className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white font-mono font-bold text-[9px] rounded-lg transition-all cursor-pointer"
                >
                  ISOLATE URGENT
                </button>
                {severityFilter === 'urgent' && (
                  <button
                    onClick={() => setSeverityFilter('all')}
                    className="px-3 py-1 bg-white/10 hover:bg-white/20 text-gray-300 font-mono text-[9px] rounded-lg transition-all cursor-pointer"
                  >
                    SHOW ALL
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 pb-4 border-b border-white/5">
          <div className="flex items-center space-x-4">
            <div className={`p-3 bg-black/40 rounded-2xl border transition-all duration-300 ${alarmActive ? 'border-red-500/40 text-red-400 bg-red-500/10' : 'border-gold-500/20 text-gold-400'}`}>
              {alarmActive ? (
                <BellRing className="w-6 h-6 animate-pulse" />
              ) : (
                <Bell className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2 relative">
                <span className={`flex h-2.5 w-2.5 rounded-full absolute ${totalCriticalAlerts > 0 ? 'bg-red-400 animate-ping' : 'bg-gold-400 animate-ping'}`} />
                <span className={`flex h-2.5 w-2.5 rounded-full ${totalCriticalAlerts > 0 ? 'bg-red-500' : 'bg-gold-400'}`} />
                <h2 className="text-xl font-serif italic text-white font-display ml-2">Reminders & Alerts Hub</h2>
              </div>
              <p className="text-xs text-gray-300 mt-1">Real-time action lists, outstanding payments, and upcoming film delivery schedules.</p>
            </div>
          </div>
          
          {/* Audio Chime and Reset Controls */}
          <div className="flex items-center space-x-2.5 shrink-0 self-stretch sm:self-auto justify-between">
            {snoozedIds.length > 0 && (
              <button
                onClick={() => setSnoozedIds([])}
                className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white rounded-xl text-[10px] font-mono transition-all"
                title="Restore all hidden/snoozed alerts"
              >
                Reset Snoozed ({snoozedIds.length})
              </button>
            )}
            
            <button
              onClick={playCinematicChime}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-semibold transition-all flex items-center space-x-2 cursor-pointer border ${
                alarmActive 
                  ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse' 
                  : 'bg-gold-500/10 text-gold-400 border-gold-500/20 hover:bg-gold-500/20'
              }`}
            >
              <Volume2 className={`w-3.5 h-3.5 ${alarmActive ? 'animate-bounce' : ''}`} />
              <span>{alarmActive ? 'Siren Active!' : 'Test Studio Siren'}</span>
              
              {alarmActive && (
                <span className="flex items-center space-x-0.5 ml-1">
                  <span className="h-2 w-0.5 bg-red-400 animate-pulse inline-block" />
                  <span className="h-3 w-0.5 bg-red-400 animate-pulse delay-75 inline-block" />
                  <span className="h-1.5 w-0.5 bg-red-400 animate-pulse delay-150 inline-block" />
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filter Navigation Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5 p-2 bg-black/30 rounded-2xl border border-white/5">
          {/* Main Tabs (Left) */}
          <div className="flex space-x-1.5 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setReminderTab('payment')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
                reminderTab === 'payment'
                  ? 'bg-gold-500 text-emerald-950 shadow-md font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <IndianRupee className="w-3.5 h-3.5" />
              <span>Payments ({filteredPaymentReminders.length})</span>
            </button>
            <button
              onClick={() => setReminderTab('project')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
                reminderTab === 'project'
                  ? 'bg-gold-500 text-emerald-950 shadow-md font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Project Schedules ({filteredProjectReminders.length})</span>
            </button>
          </div>

          {/* Severity Filters (Right) */}
          <div className="flex items-center space-x-1.5 self-end sm:self-auto">
            <button
              onClick={() => setSeverityFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold transition-all border ${
                severityFilter === 'all'
                  ? 'bg-white/10 text-white border-white/20 font-bold'
                  : 'text-gray-400 hover:text-gray-200 border-transparent'
              }`}
            >
              Show All
            </button>
            <button
              onClick={() => setSeverityFilter('urgent')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold transition-all border flex items-center space-x-1 ${
                severityFilter === 'urgent'
                  ? 'bg-red-500/20 text-red-300 border-red-500/40 font-bold'
                  : 'text-gray-400 hover:text-red-300 border-transparent'
              }`}
            >
              <AlertCircle className="w-3 h-3 text-red-400" />
              <span>Urgent Only</span>
            </button>
          </div>
        </div>

        {/* Content list */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${reminderTab}-${severityFilter}-${snoozedIds.length}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[340px] overflow-y-auto pr-1 scrollbar-thin"
          >
            {reminderTab === 'payment' ? (
              filteredPaymentReminders.length > 0 ? (
                filteredPaymentReminders.map((reminder) => {
                  const isCriticalPayment = reminder.status === 'overdue' || new Date(reminder.dueDate).getTime() < Date.now() || reminder.amount > 50000;
                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, x: -50 }}
                      key={reminder.id}
                      className={`p-4 rounded-2xl bg-black/50 border transition-all flex justify-between items-center group relative overflow-hidden ${
                        isCriticalPayment 
                          ? 'border-red-500/20 shadow-[inset_0_0_15px_rgba(239,68,68,0.03)] hover:border-red-500/40' 
                          : 'border-white/10 hover:border-[#ffe699]/30'
                      }`}
                    >
                      {/* Background glow on group hover */}
                      <div className={`absolute inset-0 bg-gradient-to-r transition-opacity pointer-events-none ${
                        isCriticalPayment ? 'from-red-500/5 to-transparent' : 'from-gold-500/5 to-transparent'
                      } opacity-0 group-hover:opacity-100`} />
                      
                      {/* Left border highlight on urgent */}
                      {isCriticalPayment && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 shadow-[0_0_10px_#ef4444]" />
                      )}

                      <div className="relative z-10 min-w-0 pr-2 pl-1.5">
                        <div className="flex items-center space-x-2">
                          <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
                            isCriticalPayment 
                              ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                              : reminder.type === 'invoice' 
                                ? 'bg-amber-500/20 text-amber-300' 
                                : 'bg-rose-500/20 text-rose-300'
                          }`}>
                            {isCriticalPayment ? '⚠️ CRITICAL ' : ''}{reminder.type}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono truncate">{reminder.label}</span>
                        </div>
                        <h4 className="text-sm font-semibold text-white mt-1.5 truncate">{reminder.studioName}</h4>
                        <p className="text-xs text-gray-400 mt-0.5">Remaining Balance</p>
                        
                        <div className="flex items-center space-x-3 mt-2 text-[10px] font-mono text-gray-400">
                          <span className={isCriticalPayment ? 'text-red-300 font-semibold' : ''}>
                            Due Date: {reminder.dueDate}
                          </span>
                        </div>
                      </div>

                      <div className="relative z-10 text-right shrink-0 flex flex-col items-end">
                        <span className="text-[9px] font-mono text-gray-400 uppercase tracking-wider block mb-0.5">Outstanding</span>
                        <div className={`text-base font-extrabold font-mono ${isCriticalPayment ? 'text-red-400' : 'text-gold-400'}`}>
                          ₹{reminder.amount.toLocaleString('en-IN')}
                        </div>
                        
                        <div className="flex items-center space-x-1.5 mt-2.5">
                          {/* Snooze action */}
                          <button
                            onClick={() => {
                              handleSnoozeAlert(reminder.id);
                              playCinematicChime();
                            }}
                            className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-colors border border-white/5 cursor-pointer animate-none"
                            title="Snooze / Silence for this session"
                          >
                            <EyeOff className="w-3 h-3" />
                          </button>

                          <button
                            onClick={() => handleCopyPaymentReminder(reminder)}
                            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-medium transition-all cursor-pointer ${
                              copiedId === reminder.id
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-white/5 text-gold-300 border border-white/10 hover:bg-white/10'
                            }`}
                          >
                            <Copy className="w-3 h-3" />
                            <span>{copiedId === reminder.id ? 'Copied!' : 'Remind'}</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="md:col-span-2 text-center py-12 bg-black/20 rounded-2xl border border-white/5">
                  <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto opacity-40 mb-2" />
                  <p className="text-sm text-gray-400 font-medium">All clear! No pending payments match the current filters.</p>
                </div>
              )
            ) : (
              filteredProjectReminders.length > 0 ? (
                filteredProjectReminders.map((reminder) => {
                  const isOverdue = reminder.daysLeft < 0;
                  const isCriticalProject = isOverdue || reminder.daysLeft <= 2 || reminder.priority === 'urgent' || reminder.priority === 'high';
                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, x: -50 }}
                      key={reminder.id}
                      className={`p-4 rounded-2xl bg-black/50 border transition-all flex justify-between items-center group relative overflow-hidden ${
                        isCriticalProject 
                          ? 'border-red-500/20 shadow-[inset_0_0_15px_rgba(239,68,68,0.03)] hover:border-red-500/40' 
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-r transition-opacity pointer-events-none ${
                        isCriticalProject ? 'from-red-500/5 to-transparent' : 'from-white/5 to-transparent'
                      } opacity-0 group-hover:opacity-100`} />
                      
                      {/* Left border highlight on urgent */}
                      {isCriticalProject && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 shadow-[0_0_10px_#ef4444]" />
                      )}

                      <div className="relative z-10 min-w-0 pr-2 pl-1.5">
                        <div className="flex items-center space-x-2">
                          <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                            reminder.priority === 'urgent' || reminder.priority === 'high' 
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                              : 'bg-gray-700/40 text-gray-300'
                          }`}>
                            {reminder.priority} Priority
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono truncate">Cut: {reminder.status.toUpperCase().replace('_', ' ')}</span>
                        </div>
                        <h4 className="text-sm font-semibold text-white mt-1.5 truncate">{reminder.coupleName}</h4>
                        <p className="text-xs text-gray-300 truncate">{reminder.studioName}</p>
                        
                        <div className="flex items-center space-x-3 mt-2 text-[10px] font-mono text-gray-400">
                          <span className="text-[#ffe699]">Editor: {reminder.editorName}</span>
                        </div>
                      </div>

                      <div className="relative z-10 text-right shrink-0 flex flex-col items-end">
                        <span className={`text-[10px] font-mono px-2.5 py-1 rounded-lg inline-block ${
                          isOverdue 
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30 font-bold' 
                            : reminder.daysLeft <= 3 
                              ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' 
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {isOverdue 
                            ? `${Math.abs(reminder.daysLeft)}d OVERDUE` 
                            : reminder.daysLeft === 0 
                              ? 'DUE TODAY' 
                              : `${reminder.daysLeft} days left`
                          }
                        </span>
                        
                        <div className="flex items-center space-x-1.5 mt-2.5">
                          {/* Snooze action */}
                          <button
                            onClick={() => {
                              handleSnoozeAlert(reminder.id);
                              playCinematicChime();
                            }}
                            className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-colors border border-white/5 cursor-pointer"
                            title="Snooze / Silence for this session"
                          >
                            <EyeOff className="w-3 h-3" />
                          </button>

                          <button
                            onClick={() => handleCopyProjectReminder(reminder)}
                            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-medium transition-all cursor-pointer ${
                              copiedId === reminder.id
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-white/5 text-gold-300 border border-white/10 hover:bg-white/10'
                            }`}
                          >
                            <Copy className="w-3 h-3" />
                            <span>{copiedId === reminder.id ? 'Copied!' : 'Remind'}</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="md:col-span-2 text-center py-12 bg-black/20 rounded-2xl border border-white/5">
                  <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto opacity-40 mb-2" />
                  <p className="text-sm text-gray-400 font-medium">Excellent! No film deliveries match the current filters.</p>
                </div>
              )
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  };

  const renderRecentPaymentsLedger = () => {
    // Show last 5 payments
    const recentPayments = payments.slice(0, 5);

    return (
      <div className="p-6 rounded-3xl glass-panel border border-luxury-green-800/10 shadow-xl mt-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center space-x-2">
              <span className="flex h-2 w-2 rounded-full bg-gold-400 animate-pulse" />
              <h2 className="text-lg font-bold text-white font-display">Recent Payments Ledger Log</h2>
            </div>
            <p className="text-xs text-gray-400 mt-1">Live tracking of payments received from studios and paid out to editors.</p>
          </div>
          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-charcoal-950 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center space-x-2 shadow-lg hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          {recentPayments.length > 0 ? (
            <table className="w-full text-left text-xs text-gray-300">
              <thead>
                <tr className="border-b border-white/5 text-[10px] font-mono uppercase text-gray-400 tracking-wider">
                  <th className="pb-3 pl-2">Type</th>
                  <th className="pb-3">Project</th>
                  <th className="pb-3">Entity (Studio/Editor)</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Method</th>
                  <th className="pb-3">Notes</th>
                  <th className="pb-3 text-right pr-2">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentPayments.map((pay) => {
                  const isIncoming = pay.entityType === 'studio';
                  // Resolve Studio or Editor name
                  const entityName = isIncoming
                    ? (studios.find(s => s.id === pay.entityId)?.name || 'Studio Partner')
                    : (editors.find(e => e.id === pay.entityId)?.name || 'Video Editor');

                  return (
                    <tr key={pay.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 pl-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-mono text-[9px] uppercase tracking-wider font-semibold ${
                          isIncoming 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {isIncoming ? '← Received' : '→ Paid Out'}
                        </span>
                      </td>
                      <td className="py-3.5 font-semibold text-white">
                        {pay.projectCoupleName || 'Wedding Film'}
                      </td>
                      <td className="py-3.5 text-gray-200">
                        {entityName}
                      </td>
                      <td className="py-3.5 text-gray-400 font-mono">
                        {pay.date}
                      </td>
                      <td className="py-3.5 text-gray-400 font-mono">
                        {pay.paymentMethod}
                      </td>
                      <td className="py-3.5 text-gray-400 italic max-w-xs truncate" title={pay.notes}>
                        {pay.notes || '-'}
                      </td>
                      <td className={`py-3.5 text-right pr-2 font-bold font-sans text-sm ${isIncoming ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {isIncoming ? '+' : '-'} ₹{pay.amount?.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-10 bg-charcoal-900/40 rounded-2xl border border-white/5 flex flex-col items-center justify-center p-6">
              <IndianRupee className="w-10 h-10 text-gray-600 mb-3" />
              <p className="text-gray-400 font-medium">No payments logged yet</p>
              <p className="text-[10px] text-gray-500 mt-1 max-w-sm">Use the "Record Payment" button to log your first studio collection or editor payout transaction.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderNeedsAttention = () => {
    return (
      <div className="p-6 rounded-3xl bg-charcoal-900/60 border border-luxury-green-800/15 backdrop-blur-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-2xl ${totalNeedsAttentionCount > 0 ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'}`}>
              {totalNeedsAttentionCount > 0 ? <AlertTriangle className="w-5 h-5 animate-pulse" /> : <CheckCircle className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white tracking-tight font-display">Attention Overview Hub</h2>
                {totalNeedsAttentionCount > 0 ? (
                  <span className="text-[9px] font-mono tracking-widest px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/25 rounded-full uppercase font-bold">
                    Needs Attention
                  </span>
                ) : (
                  <span className="text-[9px] font-mono tracking-widest px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded-full uppercase font-bold">
                    All Clear
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-400 font-mono mt-0.5 uppercase">Identifies overdue partner invoices & unpaid editor ledger balances</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-2xl font-sans font-extrabold text-white">{totalNeedsAttentionCount}</span>
            <span className="text-xs text-gray-400 block font-mono">Dues Requiring Action</span>
          </div>
        </div>

        {totalNeedsAttentionCount > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Column 1: Overdue Invoices */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-[10px] font-mono font-bold uppercase text-gray-400 tracking-wider flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5 text-red-400" />
                  <span>Overdue Studio Invoices ({overdueInvoicesList.length})</span>
                </span>
                <span className="text-[10px] font-mono text-red-400 font-semibold">
                  ₹{overdueInvoicesList.reduce((sum, inv) => sum + (inv.balanceDue || 0), 0).toLocaleString('en-IN')} pending
                </span>
              </div>

              {overdueInvoicesList.length > 0 ? (
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 scrollbar-thin">
                  {overdueInvoicesList.map((inv) => {
                    const studio = studios.find(s => s.id === inv.studioId);
                    return (
                      <div key={inv.id} className="p-3 rounded-xl bg-black/40 border border-red-500/10 hover:border-red-500/20 transition-colors flex justify-between items-center text-xs">
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-gray-200 truncate">{studio?.name || 'Studio Partner'}</span>
                            <span className="text-[9px] font-mono bg-red-500/10 text-red-400 border border-red-500/20 px-1 rounded">Overdue</span>
                          </div>
                          <p className="text-[10px] text-gray-400 truncate mt-0.5">Couple: {inv.coupleName || 'Wedding Film'}</p>
                          <div className="flex items-center space-x-2 mt-1 text-[9px] text-gray-500 font-mono">
                            <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> Due: {inv.dueDate}</span>
                            <span>•</span>
                            <span>Inv: {inv.id}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-sans font-bold text-red-400">₹{inv.balanceDue?.toLocaleString('en-IN')}</p>
                          <p className="text-[9px] text-gray-500 mt-0.5 font-mono">Total: ₹{inv.totalAmount?.toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-xs italic font-mono py-4 text-center">No overdue invoices found. Excellent!</p>
              )}
            </div>

            {/* Column 2: Unpaid Editor Balances */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-[10px] font-mono font-bold uppercase text-gray-400 tracking-wider flex items-center space-x-1.5">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span>Unpaid Editor Wages ({unpaidEditorsList.length})</span>
                </span>
                <span className="text-[10px] font-mono text-amber-400 font-semibold">
                  ₹{unpaidEditorsList.reduce((sum, item) => sum + item.pending, 0).toLocaleString('en-IN')} outstanding
                </span>
              </div>

              {unpaidEditorsList.length > 0 ? (
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 scrollbar-thin">
                  {unpaidEditorsList.map((item, idx) => {
                    return (
                      <div key={`${item.projectId}-${item.editorId}-${idx}`} className="p-3 rounded-xl bg-black/40 border border-amber-500/10 hover:border-amber-500/20 transition-colors flex justify-between items-center text-xs">
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-gray-200 truncate">{item.editorName}</span>
                            <span className="text-[9px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1 rounded">{item.roleType}</span>
                          </div>
                          <p className="text-[10px] text-gray-400 truncate mt-0.5">Project: {item.coupleName}</p>
                          <div className="flex items-center space-x-2 mt-1 text-[9px] text-gray-500 font-mono">
                            <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> Est. Delivery: {item.deliveryDate || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-sans font-bold text-amber-400">₹{item.pending.toLocaleString('en-IN')}</p>
                          <p className="text-[9px] text-gray-500 mt-0.5 font-mono">Paid: ₹{item.paid.toLocaleString('en-IN')} of ₹{item.budget.toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-xs italic font-mono py-4 text-center">No outstanding editor balances found.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="p-5 rounded-2xl bg-[#1e5546]/10 border border-luxury-green-500/20 flex flex-col items-center justify-center text-center py-8">
            <CheckCircle className="w-10 h-10 text-emerald-400 mb-2.5" />
            <h4 className="text-xs font-bold text-emerald-300 font-mono uppercase tracking-wide">All Balances Settled Perfectly</h4>
            <p className="text-[10px] text-emerald-400/70 mt-1 max-w-md">Every client invoice has been paid on-time and all editor wages are settled. Operational cashflow is perfectly balanced.</p>
          </div>
        )}
      </div>
    );
  };

  const renderProjectCompletionSparklines = (isOrganic = false) => {
    const maxCompleted = Math.max(...sparklineData.map(d => d.completed), 1);
    const maxTotal = Math.max(...sparklineData.map(d => d.total), 1);
    const totalCompletionsLast6M = sparklineData.reduce((sum, d) => sum + d.completed, 0);
    const totalIntakeLast6M = sparklineData.reduce((sum, d) => sum + d.total, 0);
    
    const overallDeliveryRate = totalIntakeLast6M > 0 
      ? Math.round((totalCompletionsLast6M / totalIntakeLast6M) * 100) 
      : 100;

    const panelBg = isOrganic 
      ? "bg-charcoal-900/60 border-luxury-green-800/15" 
      : "glass-panel border-luxury-green-800/10";

    return (
      <div className={`p-6 rounded-3xl ${panelBg} border shadow-md space-y-6`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Activity className="w-4 h-4 text-emerald-400" />
              </span>
              <h2 className="text-base font-bold text-white tracking-tight font-display">Workflow & Delivery Sparklines</h2>
            </div>
            <p className="text-[10px] text-gray-400 font-mono mt-1 uppercase">Monthly high-density project analytics (Last 6 Months)</p>
          </div>
          <div className="flex items-center gap-4 bg-black/30 px-4 py-2 rounded-2xl border border-white/5 shrink-0">
            <div className="text-center">
              <span className="text-[9px] text-gray-400 block font-mono">DELIVERY RATE</span>
              <span className="text-base font-bold text-emerald-400 font-sans">{overallDeliveryRate}%</span>
            </div>
            <div className="w-[1px] h-8 bg-white/10" />
            <div className="text-center">
              <span className="text-[9px] text-gray-400 block font-mono">6M CLOSED</span>
              <span className="text-base font-bold text-white font-sans">{totalCompletionsLast6M}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Completed Sparkline */}
          <div className="p-4 rounded-2xl bg-black/30 border border-white/5 flex flex-col justify-between h-36">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">Project Deliveries</span>
                <span className="text-2xl font-bold text-white tracking-tight mt-0.5 block">{totalCompletionsLast6M} Films</span>
              </div>
              <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase font-semibold">
                Completed
              </span>
            </div>

            {/* Sparkline chart container */}
            <div className="h-12 w-full mt-3">
              <ResponsiveContainer width="100%" height={48} minWidth={100}>
                <LineChart data={sparklineData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-[#11141a] border border-emerald-500/30 px-2 py-1 rounded-lg text-[9px] font-mono text-gray-200">
                            <p>{payload[0].payload.month}: <span className="text-emerald-400 font-bold">{payload[0].value} completed</span></p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="completed" 
                    stroke="#10b981" 
                    strokeWidth={2.5} 
                    dot={{ r: 2, fill: '#10b981', strokeWidth: 0 }}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="flex justify-between items-center text-[9px] text-gray-500 font-mono mt-1 border-t border-white/5 pt-1.5">
              <span>{sparklineData[0]?.month}</span>
              <span>Peak: {maxCompleted} / mo</span>
              <span>{sparklineData[sparklineData.length - 1]?.month}</span>
            </div>
          </div>

          {/* Card 2: Received Sparkline */}
          <div className="p-4 rounded-2xl bg-black/30 border border-white/5 flex flex-col justify-between h-36">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">Wedding Intake</span>
                <span className="text-2xl font-bold text-white tracking-tight mt-0.5 block">{totalIntakeLast6M} Received</span>
              </div>
              <span className="text-[9px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full uppercase font-semibold">
                Inflow
              </span>
            </div>

            {/* Sparkline chart container */}
            <div className="h-12 w-full mt-3">
              <ResponsiveContainer width="100%" height={48} minWidth={100}>
                <LineChart data={sparklineData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-[#11141a] border border-blue-500/30 px-2 py-1 rounded-lg text-[9px] font-mono text-gray-200">
                            <p>{payload[0].payload.month}: <span className="text-blue-400 font-bold">{payload[0].value} received</span></p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#3b82f6" 
                    strokeWidth={2.5} 
                    dot={{ r: 2, fill: '#3b82f6', strokeWidth: 0 }}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="flex justify-between items-center text-[9px] text-gray-500 font-mono mt-1 border-t border-white/5 pt-1.5">
              <span>{sparklineData[0]?.month}</span>
              <span>Peak: {maxTotal} / mo</span>
              <span>{sparklineData[sparklineData.length - 1]?.month}</span>
            </div>
          </div>

          {/* Card 3: Dual Sparkline Trend Overlay */}
          <div className="p-4 rounded-2xl bg-black/30 border border-white/5 flex flex-col justify-between h-36">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">Overlay Analytics</span>
                <span className="text-xs text-gray-300 mt-1 block">Inflow vs. Completion</span>
              </div>
              <div className="flex gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5" />
                <span className="text-[8px] text-gray-400 font-mono mr-1.5">Delivered</span>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5" />
                <span className="text-[8px] text-gray-400 font-mono font-sans">Inflow</span>
              </div>
            </div>

            {/* Area Sparkline overlay container */}
            <div className="h-12 w-full mt-3">
              <ResponsiveContainer width="100%" height={48} minWidth={100}>
                <LineChart data={sparklineData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-[#11141a] border border-white/10 p-2 rounded-lg text-[9px] font-mono text-gray-200 space-y-0.5">
                            <p className="font-bold border-b border-white/5 pb-0.5">{payload[0].payload.month}</p>
                            <p className="text-emerald-400">Completed: {payload[0].payload.completed}</p>
                            <p className="text-blue-400">Received: {payload[0].payload.total}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="completed" 
                    stroke="#10b981" 
                    strokeWidth={2} 
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#3b82f6" 
                    strokeWidth={2} 
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="flex justify-between items-center text-[9px] text-gray-500 font-mono mt-1 border-t border-white/5 pt-1.5">
              <span>{sparklineData[0]?.month}</span>
              <span>Efficiency Index</span>
              <span>{sparklineData[sparklineData.length - 1]?.month}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Computed Search Results across Projects, Studios, and Editors
  const searchResultsProjects = globalSearchQuery.trim() === '' ? [] : projects.filter(p => 
    p.coupleName?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
    p.id?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
    p.eventType?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
    p.studioName?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
    p.assignedEditorName?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
    p.status?.toLowerCase().includes(globalSearchQuery.toLowerCase())
  );

  const searchResultsStudios = globalSearchQuery.trim() === '' ? [] : studios.filter(s => 
    s.name?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
    s.ownerName?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
    s.email?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
    s.phone?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
    s.address?.toLowerCase().includes(globalSearchQuery.toLowerCase())
  );

  const searchResultsEditors = globalSearchQuery.trim() === '' ? [] : editors.filter(e => 
    e.name?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
    e.email?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
    e.phone?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
    e.notes?.toLowerCase().includes(globalSearchQuery.toLowerCase())
  );

  const hasSearchResults = searchResultsProjects.length > 0 || searchResultsStudios.length > 0 || searchResultsEditors.length > 0;

  return (
    <div className="space-y-6">
      {/* ========================================================
          MOBILE ONLY DASHBOARD (Clutter-Free, Spacious & Premium)
          ======================================================== */}
      <div className="block md:hidden space-y-6 px-1">
        {/* Compact & Clean Mobile Header */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-[#0c2a1d] to-[#12161a] border border-luxury-green-800/20 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gold-400/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-gold-600 to-gold-400 p-[1.5px] shadow-md shrink-0 flex items-center justify-center">
              <div className="w-full h-full bg-charcoal-950 rounded-full flex items-center justify-center">
                <Logo size={28} variant="gold" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-[9px] font-mono tracking-widest text-[#a3b18a] uppercase font-bold">The Frame Cut Studio</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <h1 className="text-base font-serif italic text-white font-semibold mt-0.5 truncate leading-tight">Hello, Satish Tiwari</h1>
              <p className="text-xs text-gray-400 mt-0.5 truncate">
                Admin • <strong className="text-gold-400 font-semibold">{activeProjectsCount} active cuts</strong> running
              </p>
            </div>
          </div>

          {/* Compact Mobile Search inside the header */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Quick search wedding film, studio, status..."
              value={globalSearchQuery}
              onChange={(e) => {
                setGlobalSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              className="w-full pl-9 pr-8 py-2 bg-black/45 border border-luxury-green-800/25 rounded-xl text-xs focus:outline-none focus:border-gold-500/40 text-gray-200 placeholder-gray-500 font-medium"
            />
            {globalSearchQuery && (
              <button
                onClick={() => {
                  setGlobalSearchQuery('');
                  setShowSearchResults(false);
                }}
                className="absolute right-2.5 top-2.5 p-0.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Spacious, Finger-Friendly Quick Actions (Mobile Quick Panel) */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              setPaymentType('studio');
              setIsPaymentModalOpen(true);
            }}
            className="p-4 rounded-2xl bg-gradient-to-r from-[#2a6f5e] to-[#1d4e42] border border-gold-500/20 text-gold-300 font-display font-bold text-[11px] tracking-wider uppercase shadow-md flex flex-col items-center justify-center text-center gap-2 active:scale-[0.97] transition-all cursor-pointer h-24 animate-none"
          >
            <IndianRupee className="w-5 h-5 text-gold-300" />
            <span>Record Payment</span>
          </button>

          <button
            onClick={() => onQuickAction('projects', 'add_project')}
            className="p-4 rounded-2xl organic-sand-gold-gradient text-emerald-950 font-display font-bold text-[11px] tracking-wider uppercase shadow-md flex flex-col items-center justify-center text-center gap-2 active:scale-[0.97] transition-all cursor-pointer h-24"
          >
            <Plus className="w-5 h-5 text-emerald-950 stroke-[3]" />
            <span>New Film Cut</span>
          </button>

          <button
            onClick={() => onQuickAction('calendar')}
            className="p-4 rounded-2xl bg-charcoal-900 border border-luxury-green-800/20 text-gold-400 font-display font-semibold text-[11px] tracking-wider uppercase shadow-sm flex flex-col items-center justify-center text-center gap-2 active:scale-[0.97] transition-all cursor-pointer h-24"
          >
            <CalendarIcon className="w-5 h-5 text-gold-400" />
            <span>Calendar</span>
          </button>

          <button
            onClick={() => onQuickAction('finance', 'add_expense')}
            className="p-4 rounded-2xl bg-charcoal-900 border border-luxury-green-800/20 text-gray-300 font-display font-semibold text-[11px] tracking-wider uppercase shadow-sm flex flex-col items-center justify-center text-center gap-2 active:scale-[0.97] transition-all cursor-pointer h-24"
          >
            <Activity className="w-5 h-5 text-amber-500" />
            <span>Log Expense</span>
          </button>
        </div>

        {/* Minimal Swipeable Metrics (Swipe deck) */}
        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#a3b18a] font-bold">Work & Cashflow Stats</span>
            <span className="text-[9px] text-gray-500 font-mono">Swipe →</span>
          </div>
          
          <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-none snap-x snap-mandatory">
            {/* Card 1: Gross Bookings */}
            <div className="snap-center shrink-0 w-[260px] p-4 rounded-2xl bg-gradient-to-br from-[#122e23] to-[#111417] border border-luxury-green-800/30 shadow-md flex flex-col justify-between h-32">
              <div className="flex justify-between items-start">
                <span className="text-gray-300 text-xs font-semibold">Gross Bookings</span>
                <div className="p-1.5 rounded-lg bg-black/40 border border-gold-500/10">
                  <IndianRupee className="w-3.5 h-3.5 text-gold-400" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-sans font-extrabold text-white">₹{totalRevenue.toLocaleString('en-IN')}</div>
                <div className="text-[9px] text-gray-400 mt-1 font-mono uppercase">Total revenues contracted</div>
              </div>
            </div>

            {/* Card 2: Net Profit Margin */}
            <div className="snap-center shrink-0 w-[260px] p-4 rounded-2xl bg-gradient-to-br from-gold-950/20 to-[#111417] border border-gold-500/30 shadow-md flex flex-col justify-between h-32">
              <div className="flex justify-between items-start">
                <span className="text-gray-300 text-xs font-semibold">Net Yield</span>
                <div className="p-1.5 rounded-lg bg-black/40 border border-gold-500/10">
                  <Sparkles className="w-3.5 h-3.5 text-[#e9c46a]" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-sans font-extrabold text-[#e9c46a]">₹{totalProfit.toLocaleString('en-IN')}</div>
                <div className="text-[9px] text-gray-400 mt-1 font-mono uppercase">
                  {totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}% margin yield
                </div>
              </div>
            </div>

            {/* Card 3: Active Pipeline */}
            <div className="snap-center shrink-0 w-[260px] p-4 rounded-2xl bg-gradient-to-br from-[#141d24] to-[#111417] border border-[#2563eb]/20 shadow-md flex flex-col justify-between h-32">
              <div className="flex justify-between items-start">
                <span className="text-gray-300 text-xs font-semibold">Cuts Pipeline</span>
                <div className="p-1.5 rounded-lg bg-black/40 border border-white/5">
                  <Film className="w-3.5 h-3.5 text-blue-400" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-sans font-extrabold text-white">{activeProjectsCount}</div>
                <div className="text-[9px] text-gray-400 mt-1 font-mono uppercase">
                  {pendingProjectsCount} Editing • {completedProjectsCount} Delivered
                </div>
              </div>
            </div>

            {/* Card 4: Alliance Network */}
            <div className="snap-center shrink-0 w-[260px] p-4 rounded-2xl bg-gradient-to-br from-[#24142d] to-[#111417] border border-purple-500/20 shadow-md flex flex-col justify-between h-32">
              <div className="flex justify-between items-start">
                <span className="text-gray-300 text-xs font-semibold">Active Partners</span>
                <div className="p-1.5 rounded-lg bg-black/40 border border-white/5">
                  <Users className="w-3.5 h-3.5 text-purple-400" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-sans font-extrabold text-white">{activeStudiosCount + activeEditorsCount}</div>
                <div className="text-[9px] text-gray-400 mt-1 font-mono uppercase">
                  {activeStudiosCount} Studios • {activeEditorsCount} Editors
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* NEEDS ATTENTION FOR MOBILE DASHBOARD */}
        {renderNeedsAttention()}

        {/* WORKFLOW SPARKLINES FOR MOBILE DASHBOARD */}
        {renderProjectCompletionSparklines(true)}

        {/* Compact Tabbed Reminders Hub */}
        <div className="p-4 rounded-3xl bg-charcoal-900/90 border border-luxury-green-800/10 shadow-lg space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-1.5">
              <Bell className="w-4 h-4 text-gold-400" />
              <h2 className="text-sm font-serif italic text-white font-semibold">Production & Payment Alerts</h2>
            </div>
            <span className="text-[8px] font-mono px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full font-bold uppercase">
              {totalCriticalAlerts} Urgent
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setReminderTab('payment')}
              className={`py-1.5 rounded-lg text-[10px] font-mono font-bold tracking-wide transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                reminderTab === 'payment'
                  ? 'bg-gold-500 text-emerald-950 font-extrabold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <IndianRupee className="w-3 h-3" />
              <span>Dues ({filteredPaymentReminders.length})</span>
            </button>
            <button
              onClick={() => setReminderTab('project')}
              className={`py-1.5 rounded-lg text-[10px] font-mono font-bold tracking-wide transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                reminderTab === 'project'
                  ? 'bg-gold-500 text-emerald-950 font-extrabold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Deadlines ({filteredProjectReminders.length})</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {reminderTab === 'payment' ? (
              filteredPaymentReminders.slice(0, 3).length > 0 ? (
                filteredPaymentReminders.slice(0, 3).map((reminder) => {
                  const isCriticalPayment = reminder.status === 'overdue' || new Date(reminder.dueDate).getTime() < Date.now() || reminder.amount > 50000;
                  return (
                    <div key={reminder.id} className={`p-3 rounded-xl bg-black/40 border flex justify-between items-center ${isCriticalPayment ? 'border-red-500/20' : 'border-white/5'}`}>
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center space-x-1.5">
                          {isCriticalPayment && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                          <h4 className="text-xs font-bold text-gray-200 truncate">{reminder.studioName}</h4>
                        </div>
                        <p className="text-[9px] text-gray-500 font-mono mt-0.5">Limit Date: {reminder.dueDate}</p>
                      </div>
                      <div className="text-right shrink-0 flex flex-col items-end">
                        <span className={`text-xs font-bold font-mono ${isCriticalPayment ? 'text-red-400' : 'text-gold-400'}`}>₹{reminder.amount.toLocaleString('en-IN')}</span>
                        <button
                          onClick={() => handleCopyPaymentReminder(reminder)}
                          className="text-[9px] text-emerald-400 hover:underline mt-1 font-mono font-medium"
                        >
                          Send Reminder
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6">
                  <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto opacity-40 mb-1.5" />
                  <p className="text-xs text-gray-400 font-mono">All dues collected perfectly! 🎉</p>
                </div>
              )
            ) : (
              filteredProjectReminders.slice(0, 3).length > 0 ? (
                filteredProjectReminders.slice(0, 3).map((reminder) => {
                  const isOverdue = reminder.daysLeft < 0;
                  return (
                    <div key={reminder.id} className={`p-3 rounded-xl bg-black/40 border flex justify-between items-center ${isOverdue ? 'border-red-500/20' : 'border-white/5'}`}>
                      <div className="min-w-0 pr-2">
                        <h4 className="text-xs font-bold text-gray-200 truncate">{reminder.coupleName}</h4>
                        <p className="text-[9px] text-gray-500 font-mono mt-0.5">Editor: {reminder.editorName}</p>
                      </div>
                      <div className="text-right shrink-0 flex flex-col items-end">
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          isOverdue ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          {isOverdue ? 'Overdue' : `${reminder.daysLeft}d left`}
                        </span>
                        <button
                          onClick={() => handleCopyProjectReminder(reminder)}
                          className="text-[9px] text-emerald-400 hover:underline mt-1 font-mono font-medium"
                        >
                          Ping Status
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6">
                  <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto opacity-40 mb-1.5" />
                  <p className="text-xs text-gray-400 font-mono">No approaching cut deadlines! 🎬</p>
                </div>
              )
            )}
          </div>
        </div>

        {/* Minimal Mobile Transaction Stream */}
        <div className="p-4 rounded-3xl bg-charcoal-900/90 border border-luxury-green-800/10 shadow-lg space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-1.5">
              <Activity className="w-4 h-4 text-gold-400" />
              <h2 className="text-sm font-serif italic text-white font-semibold">Latest Transactions</h2>
            </div>
            <button
              onClick={() => {
                setPaymentType('studio');
                setIsPaymentModalOpen(true);
              }}
              className="text-[10px] text-gold-400 font-mono hover:underline"
            >
              + Record
            </button>
          </div>

          <div className="space-y-2.5">
            {payments.slice(0, 3).length > 0 ? (
              payments.slice(0, 3).map((pay) => {
                const isIncoming = pay.entityType === 'studio';
                const name = isIncoming
                  ? (studios.find(s => s.id === pay.entityId)?.name || 'Studio Partner')
                  : (editors.find(e => e.id === pay.entityId)?.name || 'Editor');
                return (
                  <div key={pay.id} className="p-3 rounded-xl bg-black/35 border border-white/5 flex justify-between items-center">
                    <div className="min-w-0 pr-2">
                      <h4 className="text-xs font-bold text-gray-200 truncate">{name}</h4>
                      <div className="flex items-center space-x-1.5 mt-0.5 text-[9px] text-gray-500 font-mono">
                        <span>{pay.date}</span>
                        <span>•</span>
                        <span>{pay.paymentMethod}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-xs font-bold font-mono ${isIncoming ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {isIncoming ? '+' : '-'} ₹{pay.amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center py-4 text-xs text-gray-500 font-mono">No ledger transactions recorded yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================
          DESKTOP & TABLET ONLY DASHBOARD (PC and Tab-Optimized)
          ======================================================== */}
      <div className="hidden md:block space-y-6">
        {/* Theme / Mode Toggle Bar */}
        <div className="flex justify-between items-center bg-charcoal-900/60 p-3 rounded-3xl border border-luxury-green-800/15 backdrop-blur-md">
        <div className="flex items-center space-x-2">
          <span className="flex h-2 w-2 rounded-full bg-gold-400 animate-pulse" />
          <span className="text-xs text-gray-300 font-mono">Theme Mode:</span>
          <span className="text-xs font-semibold text-gold-400 font-display">
            {activeTheme === 'organic' ? '🌿 Luxury Organic (Emerald & Soil)' : '📊 Classic ERP (Analytics & Charts)'}
          </span>
        </div>
        
        <div className="flex items-center space-x-1 bg-charcoal-950 p-1 rounded-2xl border border-luxury-green-800/20">
          <button
            onClick={() => setActiveTheme('organic')}
            className={`flex items-center space-x-1 px-3.5 py-1.5 rounded-xl text-[11px] font-semibold tracking-wide transition-all ${
              activeTheme === 'organic' 
                ? 'bg-gradient-to-r from-luxury-green-800 to-luxury-green-600 text-gold-300 border border-gold-500/40 gold-glow' 
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Sprout className="w-3 h-3" />
            <span>Organic Theme</span>
          </button>
          <button
            onClick={() => setActiveTheme('classic')}
            className={`flex items-center space-x-1 px-3.5 py-1.5 rounded-xl text-[11px] font-semibold tracking-wide transition-all ${
              activeTheme === 'classic' 
                ? 'bg-gradient-to-r from-gold-500/20 to-charcoal-800 text-gold-300 border border-gold-400/40 gold-glow' 
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Layout className="w-3 h-3" />
            <span>Classic Theme</span>
          </button>
        </div>
      </div>

      {/* Global Directory Search Header */}
      <div className="p-6 rounded-3xl bg-charcoal-900/80 border border-luxury-green-800/20 backdrop-blur-md relative z-30">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-5">
          
          {/* Brand/Indicator section */}
          <div className="flex items-center space-x-3.5 w-full lg:w-auto">
            <div className="p-3 bg-gradient-to-br from-gold-600 to-gold-400 rounded-2xl text-charcoal-950 shadow-lg shadow-gold-500/10">
              <Search className="w-5 h-5 font-bold" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white tracking-tight font-display">TFC Directory Index</h2>
                <span className="text-[9px] font-mono tracking-widest px-1.5 py-0.5 bg-gold-500/10 text-gold-400 border border-gold-500/20 rounded uppercase">Live</span>
              </div>
              <p className="text-[10px] text-gray-400 font-mono mt-0.5">FILTER ACROSS CINEMATIC WORKS, STUDIOS & EDITORS</p>
            </div>
          </div>

          {/* Search Bar Input */}
          <div className="relative w-full lg:max-w-xl">
            <div className="relative">
              <Search className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by Couple Name, ID, Studio, Editor, Event Type, status, etc..."
                value={globalSearchQuery}
                onChange={(e) => {
                  setGlobalSearchQuery(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
                className="w-full pl-11 pr-10 py-3 bg-charcoal-950/80 border border-luxury-green-800/30 rounded-2xl text-xs focus:outline-none focus:border-gold-500/40 text-gray-200 transition-all placeholder-gray-500 font-medium"
              />
              {globalSearchQuery && (
                <button
                  onClick={() => {
                    setGlobalSearchQuery('');
                    setShowSearchResults(false);
                  }}
                  className="absolute right-3.5 top-3.5 p-0.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Click-outside backdrop */}
            {showSearchResults && globalSearchQuery.trim() !== '' && (
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowSearchResults(false)} 
              />
            )}

            {/* Dropdown Results list */}
            {showSearchResults && globalSearchQuery.trim() !== '' && (
              <div className="absolute left-0 right-0 mt-2 bg-charcoal-900/95 border border-luxury-green-800/40 rounded-2xl shadow-2xl overflow-hidden z-50 backdrop-blur-lg">
                <div className="max-h-96 overflow-y-auto divide-y divide-white/5">
                  
                  {/* 1. Projects Section */}
                  {searchResultsProjects.length > 0 && (
                    <div className="p-3">
                      <span className="text-[9px] font-mono text-gold-400 font-bold uppercase tracking-wider px-2 block mb-2">
                        WEDDING FILM PROJECTS ({searchResultsProjects.length})
                      </span>
                      <div className="space-y-1">
                        {searchResultsProjects.map(p => (
                          <div
                            key={p.id}
                            onClick={() => {
                              setSelectedInspectItem({ type: 'project', data: p });
                              setShowSearchResults(false);
                            }}
                            className="p-2.5 rounded-xl hover:bg-charcoal-950/70 border border-transparent hover:border-gold-500/10 flex items-center justify-between cursor-pointer transition-all"
                          >
                            <div className="flex items-center space-x-3 truncate">
                              <div className="p-1.5 bg-luxury-green-950 text-gold-400 rounded-lg shrink-0">
                                <Film className="w-4 h-4" />
                              </div>
                              <div className="truncate">
                                <div className="text-xs font-bold text-white truncate">{p.coupleName}</div>
                                <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                                  {p.eventType} • {p.studioName}
                                </div>
                              </div>
                            </div>
                            <div className="text-right shrink-0 ml-4">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono border ${
                                p.status === 'delivered' 
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                  : p.status === 'editing'
                                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                    : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                              }`}>
                                {p.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 2. Studios Section */}
                  {searchResultsStudios.length > 0 && (
                    <div className="p-3">
                      <span className="text-[9px] font-mono text-gold-400 font-bold uppercase tracking-wider px-2 block mb-2">
                        PARTNER STUDIOS ({searchResultsStudios.length})
                      </span>
                      <div className="space-y-1">
                        {searchResultsStudios.map(s => (
                          <div
                            key={s.id}
                            onClick={() => {
                              setSelectedInspectItem({ type: 'studio', data: s });
                              setShowSearchResults(false);
                            }}
                            className="p-2.5 rounded-xl hover:bg-charcoal-950/70 border border-transparent hover:border-gold-500/10 flex items-center justify-between cursor-pointer transition-all"
                          >
                            <div className="flex items-center space-x-3 truncate">
                              <div className="p-1.5 bg-luxury-green-950 text-emerald-400 rounded-lg shrink-0">
                                <Building2 className="w-4 h-4" />
                              </div>
                              <div className="truncate">
                                <div className="text-xs font-bold text-white truncate">{s.name}</div>
                                <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                                  Owner: {s.ownerName} • {s.phone}
                                </div>
                              </div>
                            </div>
                            <div className="text-right shrink-0 ml-4 font-mono text-[9px] text-gray-400">
                              {s.id}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. Editors Section */}
                  {searchResultsEditors.length > 0 && (
                    <div className="p-3">
                      <span className="text-[9px] font-mono text-gold-400 font-bold uppercase tracking-wider px-2 block mb-2">
                        CREATIVE EDITORS ({searchResultsEditors.length})
                      </span>
                      <div className="space-y-1">
                        {searchResultsEditors.map(e => (
                          <div
                            key={e.id}
                            onClick={() => {
                              setSelectedInspectItem({ type: 'editor', data: e });
                              setShowSearchResults(false);
                            }}
                            className="p-2.5 rounded-xl hover:bg-charcoal-950/70 border border-transparent hover:border-gold-500/10 flex items-center justify-between cursor-pointer transition-all"
                          >
                            <div className="flex items-center space-x-3 truncate">
                              <div className="p-1.5 bg-luxury-green-950 text-blue-400 rounded-lg shrink-0">
                                <Users className="w-4 h-4" />
                              </div>
                              <div className="truncate">
                                <div className="text-xs font-bold text-white truncate">{e.name}</div>
                                <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                                  {e.email} • {e.phone}
                                </div>
                              </div>
                            </div>
                            <div className="text-right shrink-0 ml-4 text-[10px] text-gold-400 font-bold">
                              ★ {e.rating || 'N/A'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Results Fallback */}
                  {!hasSearchResults && (
                    <div className="p-6 text-center text-gray-500 text-xs font-mono">
                      No matches found across active directory.
                    </div>
                  )}

                </div>
              </div>
            )}

          </div>

        </div>
      </div>



      <AnimatePresence mode="wait">
        {activeTheme === 'organic' ? (
          <motion.div
            key="organic-dashboard"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="space-y-8"
          >
            {/* TOP HERO SECTION: RENNALE RENUELLY INSPIRED */}
            <div className="organic-bg-green organic-leaf-round-lg relative p-8 md:p-12 overflow-hidden shadow-2xl flex flex-col justify-between min-h-[380px] border border-luxury-green-700/30">
              
              {/* Overlapping Leaf Graphics mimicking paper-cut leaf art in the reference photo */}
              <div className="absolute top-0 right-0 w-80 h-80 pointer-events-none -z-0 opacity-80">
                {/* Emerald Leaf SVG */}
                <svg viewBox="0 0 100 100" className="absolute top-[-20px] right-[-20px] w-64 h-64 text-[#1a4332] filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.6)]">
                  <path fill="currentColor" d="M10,90 C40,90 80,70 90,10 C90,10 70,50 10,90 Z" />
                </svg>
                {/* Gold Dried Leaf SVG */}
                <svg viewBox="0 0 100 100" className="absolute top-[40px] right-[60px] w-48 h-48 text-[#ddaf31]/30 rotate-[35deg] filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
                  <path fill="currentColor" d="M10,90 C40,90 80,70 90,10 C90,10 70,50 10,90 Z" />
                </svg>
                {/* Small Brown Leaf SVG */}
                <svg viewBox="0 0 100 100" className="absolute top-[140px] right-[20px] w-36 h-36 text-[#5c3d2e]/40 rotate-[-15deg] filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.4)]">
                  <path fill="currentColor" d="M10,90 C40,90 80,70 90,10 C90,10 70,50 10,90 Z" />
                </svg>
              </div>

              {/* Decorative background sun rays */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

              {/* Top Row: Info */}
              <div className="relative z-10">
                <span className="font-mono text-xs text-gold-400 tracking-[0.25em] uppercase bg-black/30 backdrop-blur-sm px-4 py-1.5 rounded-full border border-gold-500/10">
                  Cinematic Wedding Suite
                </span>
              </div>

              {/* Middle Row: Luxury Brand Titles */}
              <div className="relative z-10 my-6 flex flex-col md:flex-row md:items-center justify-between gap-8 w-full">
                <div className="max-w-2xl">
                  <h1 className="text-4xl md:text-6xl font-serif italic text-white tracking-tight leading-tight">
                    The Frame Cut Studio
                  </h1>
                  <p className="text-gray-300 font-sans text-sm md:text-base font-light mt-4 leading-relaxed max-w-lg">
                    Where elegant wedding cinematic masterpieces meet structured, organic workflow management. Synced in cloud-realtime.
                  </p>
                </div>
                <div className="hidden md:flex flex-col items-center justify-center p-6 rounded-3xl bg-black/20 border border-white/5 backdrop-blur-sm shadow-xl shrink-0">
                  <Logo size={110} variant="gold" showText={true} />
                </div>
              </div>

              {/* Bottom Row: Premium Sand Capsule Button & Stats */}
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4 border-t border-luxury-green-700/30 pt-6">
                <div>
                  <p className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">Lead Director Profile</p>
                  <p className="text-xs text-gold-300 mt-1">Satish Tiwari — Administrator</p>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      setPaymentType('studio');
                      setIsPaymentModalOpen(true);
                    }}
                    className="bg-gradient-to-r from-[#2a6f5e] to-[#1d4e42] border border-gold-500/20 text-gold-300 font-display font-medium text-xs tracking-wider uppercase px-6 py-3.5 rounded-full shadow-lg hover:scale-[1.04] transition-all cursor-pointer inline-flex items-center space-x-2 justify-center gold-glow"
                  >
                    <IndianRupee className="w-4 h-4 text-gold-300" />
                    <span>Record Payment</span>
                  </button>

                  <button
                    onClick={() => onQuickAction('projects', 'add_project')}
                    className="organic-sand-gold-gradient text-emerald-950 font-display font-medium text-xs tracking-wider uppercase px-6 py-3.5 rounded-full shadow-lg hover:scale-[1.04] hover:shadow-gold-500/10 transition-all cursor-pointer inline-flex items-center space-x-2 justify-center"
                  >
                    <Plus className="w-4 h-4 text-emerald-950 stroke-[3]" />
                    <span>New Wedding Film</span>
                  </button>
                </div>
              </div>
            </div>

            {/* MIDDLE SECTION: EMERALD HORIZON RIBBON */}
            <div className="organic-green-leaf-gradient organic-leaf-round-md p-6 md:p-8 shadow-xl border border-luxury-green-600/20 text-emerald-50">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 divide-y sm:divide-y-0 sm:divide-x divide-luxury-green-600/30">
                
                {/* Col 1 */}
                <div className="flex flex-col items-center sm:items-start text-center sm:text-left px-4">
                  <div className="w-12 h-12 rounded-full border border-gold-400/30 flex items-center justify-center bg-black/20 mb-3 text-gold-400">
                    <Film className="w-5 h-5" />
                  </div>
                  <h4 className="text-[11px] uppercase tracking-widest text-[#a3b18a] font-mono">Active Cuts</h4>
                  <p className="text-3xl font-sans font-extrabold text-white mt-1 tracking-tight">{activeProjectsCount}</p>
                  <span className="text-[10px] text-emerald-200/60 mt-1">Under development</span>
                </div>

                {/* Col 2 */}
                <div className="flex flex-col items-center sm:items-start text-center sm:text-left px-4 pt-4 sm:pt-0">
                  <div className="w-12 h-12 rounded-full border border-gold-400/30 flex items-center justify-center bg-black/20 mb-3 text-gold-400">
                    <IndianRupee className="w-5 h-5" />
                  </div>
                  <h4 className="text-[11px] uppercase tracking-widest text-[#a3b18a] font-mono">Gross Bookings</h4>
                  <p className="text-2xl font-sans font-extrabold text-white mt-1 tracking-tight">₹{totalRevenue.toLocaleString('en-IN')}</p>
                  <span className="text-[10px] text-emerald-200/60 mt-1">Total revenue contract</span>
                </div>

                {/* Col 3 */}
                <div className="flex flex-col items-center sm:items-start text-center sm:text-left px-4 pt-4 sm:pt-0">
                  <div className="w-12 h-12 rounded-full border border-gold-400/30 flex items-center justify-center bg-black/20 mb-3 text-gold-400">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <h4 className="text-[11px] uppercase tracking-widest text-[#a3b18a] font-mono">Yield Profit</h4>
                  <p className="text-2xl font-sans font-extrabold text-[#e9c46a] mt-1 tracking-tight">₹{totalProfit.toLocaleString('en-IN')}</p>
                  <span className="text-[10px] text-emerald-200/60 mt-1">After editor wages</span>
                </div>

                {/* Col 4 */}
                <div className="flex flex-col items-center sm:items-start text-center sm:text-left px-4 pt-4 sm:pt-0">
                  <div className="w-12 h-12 rounded-full border border-gold-400/30 flex items-center justify-center bg-black/20 mb-3 text-gold-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <h4 className="text-[11px] uppercase tracking-widest text-[#a3b18a] font-mono">Alliances</h4>
                  <p className="text-3xl font-sans font-extrabold text-white mt-1 tracking-tight">{activeStudiosCount + activeEditorsCount}</p>
                  <span className="text-[10px] text-emerald-200/60 mt-1">Studios & Editors</span>
                </div>

              </div>
            </div>

            {/* BOTTOM SECTION: THE NATURE BENTO GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* CARD 1: EARTH SOIL BROWN CARD (Active Pipeline) */}
              <div className="organic-soil-brown-gradient organic-leaf-round-md p-6 flex flex-col justify-between h-[320px] shadow-lg relative overflow-hidden leaf-border-glow">
                <div className="absolute top-3 right-3 opacity-15">
                  <Flower className="w-24 h-24 text-white animate-spin-slow" />
                </div>
                
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-amber-200 tracking-wider">Active Pipeline</span>
                    <h3 className="text-lg font-serif italic text-white mt-0.5">Stare Seador Overview</h3>
                  </div>
                  <div className="p-2 rounded-full bg-white/10">
                    <Flower className="w-4 h-4 text-gold-400" />
                  </div>
                </div>

                <div className="my-4 relative z-10">
                  <div className="flex items-baseline space-x-2">
                    <span className="text-4xl font-sans font-extrabold text-white tracking-tight">{pendingProjectsCount}</span>
                    <span className="text-xs text-amber-200">Film Cuts Running</span>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-[11px] text-amber-200">
                      <span>Editing Completed</span>
                      <span>{((completedProjectsCount / (totalProjectsCount || 1)) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-black/30 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-gold-400 h-full rounded-full" 
                        style={{ width: `${(completedProjectsCount / (totalProjectsCount || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-3 relative z-10 flex justify-between items-center text-[10px] text-amber-200 font-mono">
                  <span>Completed: {completedProjectsCount} Cuts</span>
                  <span>Total: {totalProjectsCount} films</span>
                </div>
              </div>

              {/* CARD 2: EARTH SOIL BROWN CARD */}
              <div className="organic-soil-brown-gradient organic-leaf-round-md p-6 flex flex-col justify-between h-[320px] shadow-lg relative overflow-hidden leaf-border-glow">
                <div className="absolute top-3 right-3 opacity-10">
                  <Sprout className="w-24 h-24 text-white" />
                </div>

                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-amber-200 tracking-wider">Alliance Network</span>
                    <h3 className="text-lg font-serif italic text-white mt-0.5">Teavnt Studio Partners</h3>
                  </div>
                  <div className="p-2 rounded-full bg-black/20">
                    <Sprout className="w-4 h-4 text-gold-400" />
                  </div>
                </div>

                <div className="my-3 space-y-2 relative z-10">
                  {studioPerformanceData.slice(0, 3).map((studio, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs bg-black/20 p-2 rounded-xl">
                      <span className="text-gray-200 truncate pr-2">{studio.name}</span>
                      <span className="text-gold-300 font-semibold font-mono text-[10px] shrink-0">₹{studio.Revenue.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                  {studioPerformanceData.length === 0 && (
                    <p className="text-center text-xs text-amber-200/50 py-4">No associated studios yet.</p>
                  )}
                </div>

                <div className="border-t border-white/5 pt-3 relative z-10 flex justify-between items-center text-[10px] text-amber-200 font-mono">
                  <span>Active Studios: {activeStudiosCount}</span>
                  <button 
                    onClick={() => onQuickAction('studios')} 
                    className="hover:underline flex items-center space-x-1 text-gold-400"
                  >
                    <span>Affiliates</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* CARD 3: EARTHY COPPER-BRONZE CARD */}
              <div className="organic-copper-gradient organic-leaf-round-md p-6 flex flex-col justify-between h-[320px] shadow-lg relative overflow-hidden leaf-border-glow">
                <div className="absolute top-3 right-3 opacity-10">
                  <Sparkle className="w-24 h-24 text-white animate-pulse" />
                </div>

                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-orange-200 tracking-wider">Deadlines & Deliveries</span>
                    <h3 className="text-lg font-serif italic text-white mt-0.5">Vouseihuiercs Tracker</h3>
                  </div>
                  <div className="p-2 rounded-full bg-black/20">
                    <Sparkle className="w-4 h-4 text-gold-400" />
                  </div>
                </div>

                <div className="my-3 space-y-2.5 relative z-10">
                  {upcomingDeliveries.slice(0, 2).map((proj) => {
                    const daysLeft = Math.ceil((new Date(proj.deliveryDate).getTime() - Date.now()) / (1000 * 3600 * 24));
                    return (
                      <div key={proj.id} className="p-2 rounded-xl bg-black/20 border border-white/5 flex items-center justify-between text-xs">
                        <div className="overflow-hidden pr-2">
                          <p className="font-semibold text-gray-100 truncate">{proj.coupleName}</p>
                          <p className="text-[10px] text-orange-200 truncate">{proj.studioName}</p>
                        </div>
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded ${
                          daysLeft <= 3 ? 'bg-red-500/20 text-red-300' : 'bg-orange-500/20 text-orange-300'
                        }`}>
                          {daysLeft < 0 ? 'Overdue' : daysLeft === 0 ? 'Due Today' : `${daysLeft}d left`}
                        </span>
                      </div>
                    );
                  })}
                  {upcomingDeliveries.length === 0 && (
                    <p className="text-center text-xs text-orange-200/50 py-4">No upcoming deadlines.</p>
                  )}
                </div>

                <div className="border-t border-white/5 pt-3 relative z-10 flex justify-between items-center text-[10px] text-orange-200 font-mono">
                  <span>Awaiting delivery: {activeProjectsCount}</span>
                  <button 
                    onClick={() => onQuickAction('calendar')} 
                    className="hover:underline flex items-center space-x-1 text-gold-400"
                  >
                    <span>View Calendar</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* CARD 4: SUNLIT FOREST LANDSCAPE CARD */}
              <div className="organic-leaf-round-md h-[320px] shadow-lg relative overflow-hidden group border border-luxury-green-800/10">
                <div 
                  className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-700"
                  style={{ 
                    backgroundImage: `url('https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&q=80&w=600')`,
                  }} 
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-emerald-950/50 to-transparent mix-blend-multiply" />
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#ffe699]/10 to-transparent mix-blend-screen pointer-events-none" />

                <div className="absolute inset-0 p-6 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2 relative">
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping absolute" />
                        <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
                        <span className="text-[10px] uppercase font-mono text-[#ffe699] tracking-wider font-semibold pl-1">Live Broadcast</span>
                      </div>
                      <h3 className="text-xl font-serif italic text-white mt-1">Realtime Operations Feed</h3>
                    </div>
                    <div className="p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
                      <Eye className="w-4 h-4 text-gold-400 animate-pulse" />
                    </div>
                  </div>

                  <div className="bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-xs text-gray-200 leading-relaxed font-sans max-h-[160px] overflow-y-auto flex-1 my-3 scrollbar-thin">
                    <div className="flex items-center justify-between mb-2 pb-1 border-b border-white/5">
                      <p className="font-mono text-[9px] text-[#ffd15c] tracking-wider uppercase">Active Studio Actions</p>
                      <span className="text-[8px] font-mono text-[#ffe699] px-1.5 py-0.5 rounded bg-emerald-950/40 border border-gold-500/20">
                        {notifications.length} Alerts
                      </span>
                    </div>
                    {notifications.length > 0 ? (
                      <div className="space-y-2">
                        {notifications.slice(0, 3).map((notif, idx) => {
                          // Determine icon and color based on notification type
                          let IconComponent = Sparkle;
                          let iconColor = "text-gold-400";
                          let bgClass = "bg-gold-500/10";
                          
                          if (notif.type === 'project_completed') {
                            IconComponent = CheckCircle;
                            iconColor = "text-emerald-400";
                            bgClass = "bg-emerald-500/10";
                          } else if (notif.type === 'delivery_tomorrow') {
                            IconComponent = Clock;
                            iconColor = "text-amber-400";
                            bgClass = "bg-amber-500/10";
                          } else if (notif.type === 'payment_pending' || notif.type === 'invoice_pending') {
                            IconComponent = IndianRupee;
                            iconColor = "text-rose-400";
                            bgClass = "bg-rose-500/10";
                          } else if (notif.type === 'revision_request') {
                            IconComponent = ArrowUpRight;
                            iconColor = "text-blue-400";
                            bgClass = "bg-blue-500/10";
                          } else if (notif.type === 'new_assignment') {
                            IconComponent = Sparkles;
                            iconColor = "text-indigo-400";
                            bgClass = "bg-indigo-500/10";
                          }

                          return (
                            <motion.div 
                              initial={{ opacity: 0, x: -5 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              key={notif.id || idx} 
                              className="flex items-center space-x-2.5 p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                            >
                              <div className={`p-1.5 rounded-lg ${bgClass} ${iconColor} shrink-0`}>
                                <IconComponent className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-[10px] text-white truncate leading-tight">{notif.title}</p>
                                <p className="text-[9px] text-gray-300 truncate mt-0.5">{notif.message}</p>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="h-24 flex flex-col items-center justify-center text-center">
                        <Sparkle className="w-5 h-5 text-gold-400/30 animate-spin mb-1.5" />
                        <p className="text-[10px] text-gray-400 font-mono">All systems operational.</p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-[#ffe699] font-mono bg-black/30 px-3 py-1.5 rounded-xl border border-white/5">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      System Status: Optimal
                    </span>
                    <span>SECURE LIVE SYNC</span>
                  </div>
                </div>
              </div>

              {/* CARD 5: RICH COCOA CHOCOLATE CARD */}
              <div className="organic-cocoa-gradient organic-leaf-round-md p-6 flex flex-col justify-between h-[320px] shadow-lg relative overflow-hidden leaf-border-glow">
                <div className="absolute top-3 right-3 opacity-10">
                  <Flower2 className="w-24 h-24 text-white" />
                </div>

                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-stone-300 tracking-wider">Outgoings & Expenses</span>
                    <h3 className="text-lg font-serif italic text-white mt-0.5">6soct Fias Ledger</h3>
                  </div>
                  <div className="p-2 rounded-full bg-black/20">
                    <Flower2 className="w-4 h-4 text-gold-400" />
                  </div>
                </div>

                <div className="my-3 space-y-3 relative z-10">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-stone-300">Editor Payouts</span>
                    <span className="font-mono font-medium text-white">₹{editorPaymentsTotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-stone-300">Office & Hard Disks</span>
                    <span className="font-mono font-medium text-white">₹{manualExpensesTotal.toLocaleString('en-IN')}</span>
                  </div>
                  
                  <div className="mt-2 bg-gradient-to-r from-[#ffe699]/15 to-transparent p-2 rounded-lg border border-[#ffe699]/10 text-center">
                    <span className="text-[10px] text-[#ffe699] font-mono uppercase tracking-wider block">Profit Yield</span>
                    <span className="text-lg font-sans font-extrabold text-white mt-0.5 block tracking-tight">
                      {totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(0) : 0}% Margin
                    </span>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-3 relative z-10 flex justify-between items-center text-[10px] text-stone-300 font-mono">
                  <span>Wages logged: {editorPaymentsTotal > 0 ? 'Verified' : 'No payouts'}</span>
                  <button 
                    onClick={() => onQuickAction('finance')} 
                    className="hover:underline flex items-center space-x-1 text-gold-400"
                  >
                    <span>Ledger</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* CARD 6: BEIGE SANDSTONE CONTROL CARD */}
              <div className="bg-[#e9c46a] text-emerald-950 organic-leaf-round-md p-6 flex flex-col justify-between h-[320px] shadow-xl relative overflow-hidden hover:bg-[#ebd082] transition-colors">
                
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-emerald-900 tracking-wider font-semibold">Active Panel</span>
                    <h3 className="text-lg font-serif italic text-emerald-950 mt-0.5">Blisstdare Hub</h3>
                  </div>
                  <div className="p-2.5 rounded-full bg-emerald-950 text-gold-400 shadow-md">
                    <Menu className="w-4 h-4" />
                  </div>
                </div>

                <div className="my-3 grid grid-cols-2 gap-2 relative z-10">
                  <button 
                    onClick={() => onQuickAction('projects', 'add_project')}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-950 text-white hover:scale-[1.03] transition-transform text-center"
                  >
                    <Plus className="w-4 h-4 text-gold-400 mb-1" />
                    <span className="text-[10px] font-mono tracking-tight font-medium">Add Film</span>
                  </button>
                  <button 
                    onClick={() => onQuickAction('invoice', 'add_invoice')}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-950 text-white hover:scale-[1.03] transition-transform text-center"
                  >
                    <IndianRupee className="w-4 h-4 text-gold-400 mb-1" />
                    <span className="text-[10px] font-mono tracking-tight font-medium">Invoice</span>
                  </button>
                  <button 
                    onClick={() => onQuickAction('calendar')}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-950 text-white hover:scale-[1.03] transition-transform text-center"
                  >
                    <CalendarIcon className="w-4 h-4 text-gold-400 mb-1" />
                    <span className="text-[10px] font-mono tracking-tight font-medium">Schedule</span>
                  </button>
                  <button 
                    onClick={() => onQuickAction('settings')}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-950 text-white hover:scale-[1.03] transition-transform text-center"
                  >
                    <Settings className="w-4 h-4 text-gold-400 mb-1" />
                    <span className="text-[10px] font-mono tracking-tight font-medium">Config</span>
                  </button>
                </div>

                <div className="border-t border-emerald-900/10 pt-3 relative z-10 flex justify-between items-center text-[10px] text-emerald-900 font-mono">
                  <span>Interactive actions ready</span>
                  <span className="text-[9px] uppercase font-bold tracking-widest bg-emerald-950 text-white px-2 py-0.5 rounded font-display">TFC OS</span>
                </div>
              </div>

            </div>

            {/* NEEDS ATTENTION FOR ORGANIC THEME */}
            {renderNeedsAttention()}

            {/* WORKFLOW SPARKLINES FOR ORGANIC THEME */}
            {renderProjectCompletionSparklines(true)}

            {/* REMINDERS HUB FOR ORGANIC THEME */}
            {renderRemindersHub(true)}

            {renderRecentPaymentsLedger()}
          </motion.div>
        ) : (
          <motion.div
            key="classic-dashboard"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
      {/* Top Welcome Panel with Ambient Glow */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-8 rounded-3xl glass-panel relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-40 bg-gradient-to-br from-luxury-green-700/10 to-gold-500/10 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse-slow" />
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <Logo size={64} variant="gold" className="shrink-0" />
          <div>
            <div className="flex items-center space-x-3">
              <span className="text-xs font-mono px-3 py-1 bg-gold-500/10 border border-gold-500/30 text-gold-400 rounded-full uppercase tracking-wider">
                Wedding ERP Suite
              </span>
              <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full flex items-center space-x-1 ${
                isOnline ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse ${isOnline ? 'bg-emerald-400' : 'bg-yellow-500'}`} />
                {isOnline ? 'Cloud Synced' : 'Offline Mode'}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white font-display mt-2">
              The Frame Cut Studio OS
            </h1>
            <p className="text-gray-400 text-sm mt-1 max-w-xl">
              Welcome, <strong className="text-gold-400">Satish Tiwari</strong>. Manage cinematic workflows, studio ledgers, revisions, and invoices from one unified hub.
            </p>
          </div>
        </div>

        {/* Quick action grid */}
        <div className="mt-6 md:mt-0 flex flex-wrap gap-3 shrink-0">
          <button
            id="quick-add-project"
            onClick={() => onQuickAction('projects', 'add_project')}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-luxury-green-800 to-luxury-green-600 border border-gold-500/30 text-white font-medium text-xs hover:scale-[1.03] active:scale-[0.98] transition-transform cursor-pointer gold-glow shadow-md"
          >
            <Plus className="w-4 h-4 text-gold-300" />
            <span>Add Wedding Project</span>
          </button>
          
          <button
            id="quick-log-payment"
            onClick={() => {
              setPaymentType('studio');
              setIsPaymentModalOpen(true);
            }}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-gold-600 to-gold-500 border border-gold-400/30 text-charcoal-950 font-bold text-xs hover:scale-[1.03] active:scale-[0.98] transition-transform cursor-pointer shadow-md gold-glow"
          >
            <IndianRupee className="w-3.5 h-3.5 text-charcoal-950" />
            <span>Record Payment Ledger</span>
          </button>

          <button
            id="quick-add-expense"
            onClick={() => onQuickAction('finance', 'add_expense')}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-charcoal-800 border border-luxury-green-800 text-gray-200 font-medium text-xs hover:scale-[1.03] active:scale-[0.98] transition-transform cursor-pointer shadow-sm"
          >
            <IndianRupee className="w-3.5 h-3.5 text-gray-400" />
            <span>Log Expense</span>
          </button>
        </div>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.id}
              id={`stat-card-${stat.id}`}
              variants={itemVariants}
              className={`p-5 rounded-2xl bg-gradient-to-br ${stat.color} border ${stat.border} flex flex-col justify-between h-40 glass-panel-hover`}
            >
              <div className="flex justify-between items-start">
                <span className="text-gray-400 text-xs font-medium tracking-wide">{stat.title}</span>
                <div className="p-2 rounded-xl bg-charcoal-900/80 border border-luxury-green-800/20">
                  <Icon className="w-4 h-4 text-gold-400" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-extrabold text-white font-sans tracking-tight">{stat.value}</h3>
                <p className="text-[10px] text-gray-400 mt-1 font-mono">{stat.sub}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* WORKFLOW SPARKLINES FOR CLASSIC THEME */}
      <motion.div id="workflow-sparklines" variants={itemVariants}>
        {renderProjectCompletionSparklines(false)}
      </motion.div>

      {/* Main Charts & Sidebars */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Dynamic Area Chart for Financial Outlook */}
        <motion.div variants={itemVariants} className="xl:col-span-2 p-6 rounded-3xl glass-panel relative">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-bold text-white font-display">Revenue & Profit Outlook</h2>
              <p className="text-xs text-gray-400">Monthly aggregate projections for the wedding season</p>
            </div>
            <div className="flex space-x-2 bg-charcoal-900 p-1.5 rounded-xl border border-luxury-green-800/20 text-xs">
              <span className="px-3 py-1 bg-luxury-green-800/40 text-gold-400 font-mono rounded-lg">6 Months</span>
            </div>
          </div>
          
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height={320} minWidth={100}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1e5546" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#1e5546" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d4af37" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#d4af37" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30, 85, 70, 0.1)" />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#11141a', 
                    border: '1px solid rgba(212, 175, 55, 0.3)',
                    borderRadius: '16px',
                    color: '#f3f4f6'
                  }} 
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Area type="monotone" dataKey="Revenue" stroke="#1e5546" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                <Area type="monotone" dataKey="Profit" stroke="#d4af37" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Deliveries and Timeline */}
        <motion.div variants={itemVariants} className="p-6 rounded-3xl glass-panel flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white font-display">Upcoming Deliveries</h2>
              <button 
                id="view-calendar-btn"
                onClick={() => onQuickAction('calendar')}
                className="text-[11px] font-mono text-gold-400 hover:underline flex items-center space-x-1"
              >
                <span>View Schedule</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3.5">
              {upcomingDeliveries.length > 0 ? (
                upcomingDeliveries.map((proj) => {
                  const daysLeft = Math.ceil((new Date(proj.deliveryDate).getTime() - Date.now()) / (1000 * 3600 * 24));
                  const isOverdue = daysLeft < 0;
                  
                  return (
                    <div 
                      key={proj.id} 
                      className="p-3.5 rounded-2xl bg-charcoal-900/60 border border-luxury-green-800/10 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-luxury-green-800/20">
                          {proj.couplePhoto ? (
                            <img src={proj.couplePhoto} alt={proj.coupleName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-luxury-green-900 flex items-center justify-center font-bold text-gold-400 text-xs">
                              {proj.brideName[0] || 'W'}
                            </div>
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="text-xs font-semibold text-gray-200 truncate">{proj.coupleName}</h4>
                          <p className="text-[10px] text-gray-400 font-mono mt-0.5">{proj.studioName}</p>
                        </div>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                          isOverdue 
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                            : daysLeft <= 3 
                              ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' 
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {isOverdue 
                            ? 'Overdue' 
                            : daysLeft === 0 
                              ? 'Due Today' 
                              : daysLeft === 1 
                                ? 'Tomorrow' 
                                : `${daysLeft} Days`
                          }
                        </span>
                        <p className="text-[9px] text-gray-500 mt-1 font-mono">{proj.deliveryDate}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500 text-xs">No upcoming deliveries scheduled.</div>
              )}
            </div>
          </div>

          <div className="border-t border-luxury-green-800/10 pt-4 mt-4">
            <h4 className="text-[11px] font-mono uppercase tracking-wider text-gold-500 mb-2.5">Dynamic Performance</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-charcoal-900/40 border border-luxury-green-800/10">
                <div className="text-gray-400 text-[10px]">Active Editors</div>
                <div className="font-bold text-white mt-1 text-base">{activeEditorsCount}</div>
              </div>
              <div className="p-3 rounded-xl bg-charcoal-900/40 border border-luxury-green-800/10">
                <div className="text-gray-400 text-[10px]">Studio Accounts</div>
                <div className="font-bold text-white mt-1 text-base">{activeStudiosCount}</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Studio Revenue and Editor Load */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Studio Leaderboard */}
        <motion.div variants={itemVariants} className="p-6 rounded-3xl glass-panel">
          <div>
            <h2 className="text-lg font-bold text-white font-display">Studio Work Volume</h2>
            <p className="text-xs text-gray-400 mb-6">Top studio alliances based on aggregated order size</p>
          </div>
          
          <div className="h-64">
            {studioPerformanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={256} minWidth={100}>
                <BarChart data={studioPerformanceData} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(30, 85, 70, 0.05)" horizontal={false} />
                  <XAxis type="number" stroke="#6b7280" fontSize={10} tickLine={false} />
                  <YAxis type="category" dataKey="name" stroke="#6b7280" fontSize={10} tickLine={false} width={100} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(30, 85, 70, 0.1)' }}
                    contentStyle={{ 
                      backgroundColor: '#11141a', 
                      border: '1px solid rgba(212, 175, 55, 0.3)',
                      borderRadius: '12px'
                    }}
                  />
                  <Bar dataKey="Revenue" fill="#1e5546" radius={[0, 8, 8, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 text-xs">No studio statistics available yet.</div>
            )}
          </div>
        </motion.div>

        {/* Editor Load Distributions */}
        <motion.div variants={itemVariants} className="p-6 rounded-3xl glass-panel">
          <div>
            <h2 className="text-lg font-bold text-white font-display">Editor Productivity Distribution</h2>
            <p className="text-xs text-gray-400 mb-6">Active project assignments vs. fully delivered cuts</p>
          </div>

          <div className="h-64">
            {editorPerformanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={256} minWidth={100}>
                <BarChart data={editorPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(30, 85, 70, 0.05)" />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} />
                  <YAxis stroke="#6b7280" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#11141a', 
                      border: '1px solid rgba(212, 175, 55, 0.3)',
                      borderRadius: '12px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="Assigned" fill="#d4af37" radius={[6, 6, 0, 0]} maxBarSize={20} name="Assigned Tasks" />
                  <Bar dataKey="Completed" fill="#296d5a" radius={[6, 6, 0, 0]} maxBarSize={20} name="Completed Cuts" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 text-xs">No editor data logged.</div>
            )}
          </div>
        </motion.div>
      </div>

      {/* NEEDS ATTENTION FOR CLASSIC THEME */}
      {renderNeedsAttention()}

      {/* REMINDERS HUB FOR CLASSIC THEME */}
      {renderRemindersHub(false)}

      {renderRecentPaymentsLedger()}
    </motion.div>
        )}
      </AnimatePresence>
      </div>

      {/* Dynamic Payment Ledger Recorder Modal */}
      <AnimatePresence>
        {isPaymentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Modal Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPaymentModalOpen(false)}
              className="absolute inset-0 bg-charcoal-950/80 backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="relative w-full max-w-2xl bg-gradient-to-b from-charcoal-900 to-charcoal-950 border border-gold-500/20 rounded-3xl shadow-2xl overflow-hidden z-10"
            >
              {/* Premium Glow Accents */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-gold-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-luxury-green-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

              {/* Modal Header */}
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/10">
                <div>
                  <div className="flex items-center space-x-2">
                    <IndianRupee className="w-5 h-5 text-gold-400" />
                    <h3 className="text-lg font-serif italic text-white">Record Transaction Ledger</h3>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Settle partner balances or pay editor cuts securely.</p>
                </div>
                <button
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Modal Content / Form */}
              <form onSubmit={handleLogPaymentSubmit} className="p-6 space-y-5">
                
                {/* 1. Toggle Transaction Type */}
                <div>
                  <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-2">Transaction Direction</label>
                  <div className="grid grid-cols-2 gap-3 bg-charcoal-950/80 p-1.5 rounded-2xl border border-white/5">
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentType('studio');
                        setSelectedStudioId('');
                        setSelectedProjectId('');
                        setPaymentAmount(0);
                        setPaymentError('');
                        setPaymentSuccess('');
                      }}
                      className={`py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                        paymentType === 'studio'
                          ? 'bg-gradient-to-r from-luxury-green-900 to-luxury-green-800 text-gold-400 border border-gold-500/20 gold-glow'
                          : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      ← Received From Studio
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentType('editor');
                        setSelectedStudioId('');
                        setSelectedProjectId('');
                        setPaymentAmount(0);
                        setPaymentError('');
                        setPaymentSuccess('');
                      }}
                      className={`py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                        paymentType === 'editor'
                          ? 'bg-gradient-to-r from-amber-950 to-amber-900 text-gold-400 border border-gold-500/20 gold-glow'
                          : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      → Pay To Video Editor
                    </button>
                  </div>
                </div>

                {/* 2. Select Studio or Editor Partner */}
                <div>
                  <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-2">
                    {paymentType === 'studio' ? 'Select Studio Partner' : 'Select Video Editor'}
                  </label>
                  {paymentType === 'studio' ? (
                    <select
                      value={selectedStudioId}
                      onChange={(e) => {
                        setSelectedStudioId(e.target.value);
                        setPaymentError('');
                        setPaymentSuccess('');
                      }}
                      required
                      className="w-full bg-charcoal-950/80 border border-white/10 rounded-2xl p-3 text-sm text-white focus:outline-none focus:border-gold-500/40 font-medium"
                    >
                      <option value="" disabled>
                        -- Choose Studio Partner --
                      </option>
                      {studios.map((s) => (
                        <option key={s.id} value={s.id} className="bg-charcoal-950 text-white">
                          {s.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select
                      value={selectedEditorIdToPay}
                      onChange={(e) => {
                        setSelectedEditorIdToPay(e.target.value);
                        setPaymentError('');
                        setPaymentSuccess('');
                      }}
                      required
                      className="w-full bg-charcoal-950/80 border border-white/10 rounded-2xl p-3 text-sm text-white focus:outline-none focus:border-gold-500/40 font-medium"
                    >
                      <option value="" disabled>
                        -- Choose Video Editor --
                      </option>
                      {editors.map((e) => (
                        <option key={e.id} value={e.id} className="bg-charcoal-950 text-white">
                          {e.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* 3. Real-time Consolidated Financial Summary Display */}
                {paymentType === 'studio' && studioFinancialSummary && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-charcoal-950/60 rounded-2xl border border-white/5 space-y-2.5 text-xs text-gray-300"
                  >
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="font-semibold text-white">Studio Consolidated Balance Ledger:</span>
                      <span className="text-[10px] text-gold-400 font-mono uppercase">{studioFinancialSummary.projectCount} Projects</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-2 bg-black/20 rounded-xl">
                        <div className="text-[9px] text-gray-400 uppercase font-mono">Total Contracts</div>
                        <div className="font-bold text-white mt-0.5">₹{studioFinancialSummary.totalContract.toLocaleString('en-IN')}</div>
                      </div>
                      <div className="p-2 bg-black/20 rounded-xl">
                        <div className="text-[9px] text-gray-400 uppercase font-mono">Advance Received</div>
                        <div className="font-bold text-emerald-400 mt-0.5">₹{studioFinancialSummary.totalReceived.toLocaleString('en-IN')}</div>
                      </div>
                      <div className="p-2 bg-black/20 rounded-xl">
                        <div className="text-[9px] text-gray-400 uppercase font-mono">Net Outstanding</div>
                        <div className="font-bold text-amber-500 mt-0.5">₹{studioFinancialSummary.totalOutstanding.toLocaleString('en-IN')}</div>
                      </div>
                    </div>

                    {/* Calculated Outcome */}
                    {paymentAmount > 0 && (
                      <div className="mt-2 pt-2 border-t border-dashed border-white/10 flex justify-between items-center text-[11px] font-mono">
                        <span className="text-gray-400">Projected Outstanding after this payment:</span>
                        <span className="font-bold text-emerald-400">
                          ₹{Math.max(0, studioFinancialSummary.totalOutstanding - paymentAmount).toLocaleString('en-IN')} Outstanding
                        </span>
                      </div>
                    )}
                  </motion.div>
                )}

                {paymentType === 'editor' && editorFinancialSummary && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-charcoal-950/60 rounded-2xl border border-white/5 space-y-2.5 text-xs text-gray-300"
                  >
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="font-semibold text-white">Editor Consolidated Payout Ledger:</span>
                      <span className="text-[10px] text-gold-400 font-mono uppercase">{editorFinancialSummary.projectCount} Projects Assigned</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-2 bg-black/20 rounded-xl">
                        <div className="text-[9px] text-gray-400 uppercase font-mono">Total Editor Budget</div>
                        <div className="font-bold text-white mt-0.5">₹{editorFinancialSummary.totalBudget.toLocaleString('en-IN')}</div>
                      </div>
                      <div className="p-2 bg-black/20 rounded-xl">
                        <div className="text-[9px] text-gray-400 uppercase font-mono">Paid To Date</div>
                        <div className="font-bold text-emerald-400 mt-0.5">₹{editorFinancialSummary.totalPaid.toLocaleString('en-IN')}</div>
                      </div>
                      <div className="p-2 bg-black/20 rounded-xl">
                        <div className="text-[9px] text-gray-400 uppercase font-mono">Net Pending Balance</div>
                        <div className="font-bold text-amber-500 mt-0.5">₹{editorFinancialSummary.totalPending.toLocaleString('en-IN')}</div>
                      </div>
                    </div>

                    {/* Calculated Outcome */}
                    {paymentAmount > 0 && (
                      <div className="mt-2 pt-2 border-t border-dashed border-white/10 flex justify-between items-center text-[11px] font-mono">
                        <span className="text-gray-400">Projected Pending after this payout:</span>
                        <span className="font-bold text-amber-400">
                          ₹{Math.max(0, editorFinancialSummary.totalPending - paymentAmount).toLocaleString('en-IN')} Pending
                        </span>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* 4. Payment Fields Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1.5">Amount (₹)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        ₹
                      </div>
                      <input
                        type="number"
                        value={paymentAmount || ''}
                        onChange={(e) => setPaymentAmount(Number(e.target.value))}
                        required
                        min="1"
                        placeholder="0"
                        className="w-full bg-charcoal-950/80 border border-white/10 rounded-2xl pl-8 pr-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-gold-500/40"
                      />
                    </div>
                    {/* Amount Preset Buttons */}
                    {((paymentType === 'studio' && studioFinancialSummary) || (paymentType === 'editor' && editorFinancialSummary)) && (
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {(() => {
                          const maxRemaining = paymentType === 'studio'
                            ? (studioFinancialSummary?.totalOutstanding || 0)
                            : (editorFinancialSummary?.totalPending || 0);
                          
                          const presets = [5000, 10000, 25000, 50000].filter(p => p <= maxRemaining || maxRemaining === 0);
                          if (maxRemaining > 0 && !presets.includes(maxRemaining)) presets.push(maxRemaining);

                          return presets.map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setPaymentAmount(preset)}
                              className="px-2 py-0.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded text-[10px] text-gray-400 hover:text-white font-mono cursor-pointer transition-colors"
                            >
                              ₹{preset.toLocaleString('en-IN')}
                            </button>
                          ));
                        })()}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1.5">Date</label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      onClick={(e) => { try { e.currentTarget.showPicker(); } catch (err) {} }}
                      required
                      className="w-full bg-charcoal-950/80 border border-white/10 rounded-2xl px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-gold-500/40 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1.5">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      required
                      className="w-full bg-charcoal-950/80 border border-white/10 rounded-2xl p-2.5 text-sm text-white focus:outline-none focus:border-gold-500/40"
                    >
                      <option value="GPay">GPay (Google Pay)</option>
                      <option value="PhonePe">PhonePe</option>
                      <option value="Paytm">Paytm</option>
                      <option value="Bank Transfer">Bank Transfer (IMPS/NEFT)</option>
                      <option value="Cash">Cash Handover</option>
                      <option value="Other">Other Method</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1.5">Transaction Notes</label>
                    <input
                      type="text"
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      placeholder="e.g. Second milestone payment, advance, etc."
                      className="w-full bg-charcoal-950/80 border border-white/10 rounded-2xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-gold-500/40"
                    />
                  </div>
                </div>

                {/* Error and Success Alert Messages */}
                {paymentError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{paymentError}</span>
                  </div>
                )}
                {paymentSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>{paymentSuccess}</span>
                  </div>
                )}

                {/* Submit Action Buttons */}
                <div className="flex justify-end space-x-3 pt-3 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setIsPaymentModalOpen(false)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingPayment}
                    className="px-6 py-2 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-charcoal-950 font-bold text-xs rounded-xl shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 cursor-pointer flex items-center space-x-2"
                  >
                    {isSubmittingPayment ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-charcoal-950 border-t-transparent rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Settle Ledger Entry</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Directory Search - Quick Inspector Modal */}
      <AnimatePresence>
        {selectedInspectItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Modal Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedInspectItem(null)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="relative w-full max-w-2xl bg-gradient-to-b from-charcoal-900 to-charcoal-950 border border-luxury-green-800/40 rounded-3xl shadow-2xl overflow-hidden z-10 p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto"
            >
              {/* Decorative Glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-gold-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

              {/* Header */}
              <div className="flex justify-between items-start border-b border-white/5 pb-4">
                <div>
                  <span className="text-[10px] font-mono tracking-widest text-gold-400 font-bold uppercase">
                    DIRECTORY INSPECTOR • {selectedInspectItem.type}
                  </span>
                  <h3 className="text-xl font-bold font-display text-white mt-1">
                    {selectedInspectItem.type === 'project' && selectedInspectItem.data.coupleName}
                    {selectedInspectItem.type === 'studio' && selectedInspectItem.data.name}
                    {selectedInspectItem.type === 'editor' && selectedInspectItem.data.name}
                  </h3>
                  <p className="text-[11px] text-gray-400 font-mono mt-0.5">ID: {selectedInspectItem.data.id}</p>
                </div>
                <button
                  onClick={() => setSelectedInspectItem(null)}
                  className="p-1.5 rounded-xl bg-charcoal-800/85 border border-white/5 hover:border-white/10 hover:bg-charcoal-700 text-gray-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 1. PROJECT INSPECTOR */}
              {selectedInspectItem.type === 'project' && (
                <div className="space-y-6">
                  {/* Basic Metadata Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div className="p-3 bg-charcoal-950/60 rounded-xl border border-white/5">
                      <span className="text-gray-500 block font-mono">EVENT TYPE</span>
                      <span className="text-white font-bold mt-1 block">{selectedInspectItem.data.eventType}</span>
                    </div>
                    <div className="p-3 bg-charcoal-950/60 rounded-xl border border-white/5">
                      <span className="text-gray-500 block font-mono">SHOOT DATE</span>
                      <span className="text-white font-bold mt-1 block font-mono">{selectedInspectItem.data.shootDate || 'N/A'}</span>
                    </div>
                    <div className="p-3 bg-charcoal-950/60 rounded-xl border border-white/5">
                      <span className="text-gray-500 block font-mono">DELIVERY DATE</span>
                      <span className="text-white font-bold mt-1 block font-mono">{selectedInspectItem.data.deliveryDate || 'N/A'}</span>
                    </div>
                    <div className="p-3 bg-charcoal-950/60 rounded-xl border border-white/5">
                      <span className="text-gray-500 block font-mono">PARTNER STUDIO</span>
                      <span className="text-white font-bold mt-1 block truncate" title={selectedInspectItem.data.studioName}>
                        {selectedInspectItem.data.studioName}
                      </span>
                    </div>
                  </div>

                  {/* Financial Quick Overview */}
                  <div className="p-4 bg-charcoal-950/80 rounded-2xl border border-luxury-green-800/10 grid grid-cols-3 gap-4 text-xs font-mono">
                    <div>
                      <span className="text-gray-500 block">TOTAL VALUE</span>
                      <span className="text-white font-bold font-sans mt-1 block text-sm">
                        ₹{(selectedInspectItem.data.projectAmount || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">ADVANCE COLLECTED</span>
                      <span className="text-emerald-400 font-bold font-sans mt-1 block text-sm">
                        ₹{(selectedInspectItem.data.advancePayment || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">OUTSTANDING BALANCE</span>
                      <span className="text-rose-400 font-bold font-sans mt-1 block text-sm">
                        ₹{(selectedInspectItem.data.remainingBalance || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Quick Edit Settings Block */}
                  <div className="p-5 bg-charcoal-950/30 border border-white/5 rounded-2xl space-y-4">
                    <h4 className="text-xs font-mono font-bold text-gold-400 uppercase tracking-wider">Quick Edit Settings</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-1.5">Project Status</label>
                        <select
                          value={inspectStatus}
                          onChange={(e) => setInspectStatus(e.target.value)}
                          className="w-full bg-charcoal-950 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-gold-500/40 font-mono font-medium"
                        >
                          <option value="data_received">Data Received</option>
                          <option value="assigned">Assigned</option>
                          <option value="editing">Editing</option>
                          <option value="review">Review</option>
                          <option value="revision">Revision</option>
                          <option value="rendering">Rendering</option>
                          <option value="delivered">Delivered</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-1.5">Priority</label>
                        <select
                          value={inspectPriority}
                          onChange={(e) => setInspectPriority(e.target.value)}
                          className="w-full bg-charcoal-950 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-gold-500/40 font-mono font-medium"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-1.5">Hard Disk Name</label>
                        <input
                          type="text"
                          value={inspectHddName}
                          onChange={(e) => setInspectHddName(e.target.value)}
                          placeholder="e.g. HDD-02"
                          className="w-full bg-charcoal-950 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-gold-500/40 font-mono font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-1.5">Footage Size</label>
                        <input
                          type="text"
                          value={inspectDataSize}
                          onChange={(e) => setInspectDataSize(e.target.value)}
                          placeholder="e.g. 1.5 TB"
                          className="w-full bg-charcoal-950 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-gold-500/40 font-mono font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-1.5">Physical Location</label>
                        <input
                          type="text"
                          value={inspectLocation}
                          onChange={(e) => setInspectLocation(e.target.value)}
                          placeholder="Shelf A-3"
                          className="w-full bg-charcoal-950 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-gold-500/40 font-mono font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-1.5">Raw Footage Folder Path</label>
                        <input
                          type="text"
                          value={inspectRawFolder}
                          onChange={(e) => setInspectRawFolder(e.target.value)}
                          placeholder="D:/Raw/ProjectName"
                          className="w-full bg-charcoal-950 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-gold-500/40 font-mono font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-1.5">Google Drive Link</label>
                        <input
                          type="text"
                          value={inspectDriveLink}
                          onChange={(e) => setInspectDriveLink(e.target.value)}
                          placeholder="https://drive.google.com/..."
                          className="w-full bg-charcoal-950 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-gold-500/40 font-mono font-medium"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveInspectProject}
                      disabled={isUpdatingInspectProject}
                      className="w-full py-2 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-charcoal-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow flex items-center justify-center space-x-2"
                    >
                      {isUpdatingInspectProject ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-charcoal-950 border-t-transparent rounded-full animate-spin" />
                          <span>Saving Changes...</span>
                        </>
                      ) : (
                        <span>Save Quick Updates</span>
                      )}
                    </button>
                  </div>

                  {/* Redirection / Navigation Action */}
                  <div className="flex justify-between items-center bg-black/20 p-4 rounded-2xl border border-white/5">
                    <div className="text-xs">
                      <p className="text-white font-medium">Full Workflow & Invoice Panel</p>
                      <p className="text-gray-400 text-[11px] mt-0.5">Need to record revisions, assignments or raise custom GST invoices?</p>
                    </div>
                    <button
                      onClick={() => {
                        onQuickAction('projects');
                        setSelectedInspectItem(null);
                      }}
                      className="px-4 py-2.5 bg-charcoal-800 hover:bg-charcoal-750 border border-white/10 text-gold-400 hover:text-gold-300 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer shrink-0"
                    >
                      <span>Manage Tab</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* 2. STUDIO INSPECTOR */}
              {selectedInspectItem.type === 'studio' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 bg-charcoal-950/60 rounded-xl border border-white/5">
                      <span className="text-gray-500 block font-mono">OWNER NAME</span>
                      <span className="text-white font-bold mt-1 block">{selectedInspectItem.data.ownerName || 'N/A'}</span>
                    </div>
                    <div className="p-3.5 bg-charcoal-950/60 rounded-xl border border-white/5">
                      <span className="text-gray-500 block font-mono">PHONE NUMBER</span>
                      <span className="text-white font-bold mt-1 block font-mono">{selectedInspectItem.data.phone || 'N/A'}</span>
                    </div>
                    <div className="p-3.5 bg-charcoal-950/60 rounded-xl border border-white/5 col-span-2">
                      <span className="text-gray-500 block font-mono">EMAIL ADDRESS</span>
                      <span className="text-white font-bold mt-1 block font-mono">{selectedInspectItem.data.email || 'N/A'}</span>
                    </div>
                    <div className="p-3.5 bg-charcoal-950/60 rounded-xl border border-white/5 col-span-2">
                      <span className="text-gray-500 block font-mono">REGISTERED GST NUMBER</span>
                      <span className="text-gold-400 font-bold mt-1 block font-mono">{selectedInspectItem.data.gstNumber || 'No GST Registered'}</span>
                    </div>
                    <div className="p-3.5 bg-charcoal-950/60 rounded-xl border border-white/5 col-span-2">
                      <span className="text-gray-500 block font-mono">PHYSICAL ADDRESS</span>
                      <span className="text-white mt-1 block leading-relaxed">{selectedInspectItem.data.address || 'N/A'}</span>
                    </div>
                  </div>

                  {selectedInspectItem.data.notes && (
                    <div className="p-4 bg-charcoal-950/50 rounded-2xl border border-white/5">
                      <span className="text-gray-500 text-[10px] font-mono block">PARTNER STUDIO INTERNAL NOTES</span>
                      <p className="text-gray-300 text-xs mt-1.5 leading-relaxed italic">"{selectedInspectItem.data.notes}"</p>
                    </div>
                  )}

                  {/* Redirection Button */}
                  <div className="flex justify-between items-center bg-black/20 p-4 rounded-2xl border border-white/5">
                    <div className="text-xs">
                      <p className="text-white font-medium font-sans">Full Studio Directory Ledger</p>
                      <p className="text-gray-400 text-[11px] mt-0.5">Need to edit partner details, view past payment history or check invoices?</p>
                    </div>
                    <button
                      onClick={() => {
                        onQuickAction('studios');
                        setSelectedInspectItem(null);
                      }}
                      className="px-4 py-2.5 bg-charcoal-800 hover:bg-charcoal-750 border border-white/10 text-gold-400 hover:text-gold-300 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer shrink-0"
                    >
                      <span>Manage Tab</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* 3. EDITOR INSPECTOR */}
              {selectedInspectItem.type === 'editor' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 bg-charcoal-950/60 rounded-xl border border-white/5">
                      <span className="text-gray-500 block font-mono">CONTACT NUMBER</span>
                      <span className="text-white font-bold mt-1 block font-mono">{selectedInspectItem.data.phone || 'N/A'}</span>
                    </div>
                    <div className="p-3.5 bg-charcoal-950/60 rounded-xl border border-white/5">
                      <span className="text-gray-500 block font-mono">RATING INDEX</span>
                      <span className="text-gold-400 font-bold mt-1 block">★ {selectedInspectItem.data.rating || 'N/A'} / 5.0</span>
                    </div>
                    <div className="p-3.5 bg-charcoal-950/60 rounded-xl border border-white/5 col-span-2">
                      <span className="text-gray-500 block font-mono">EMAIL ADDRESS</span>
                      <span className="text-white font-bold mt-1 block font-mono">{selectedInspectItem.data.email || 'N/A'}</span>
                    </div>
                    <div className="p-3.5 bg-charcoal-950/60 rounded-xl border border-white/5 col-span-2">
                      <span className="text-gray-500 block font-mono">ONBOARDING DATE</span>
                      <span className="text-white font-bold mt-1 block font-mono">{selectedInspectItem.data.joinedDate || 'N/A'}</span>
                    </div>
                  </div>

                  {selectedInspectItem.data.notes && (
                    <div className="p-4 bg-charcoal-950/50 rounded-2xl border border-white/5">
                      <span className="text-gray-500 text-[10px] font-mono block">EDITOR PROFILE NOTES</span>
                      <p className="text-gray-300 text-xs mt-1.5 leading-relaxed italic">"{selectedInspectItem.data.notes}"</p>
                    </div>
                  )}

                  {/* Redirection Button */}
                  <div className="flex justify-between items-center bg-black/20 p-4 rounded-2xl border border-white/5">
                    <div className="text-xs">
                      <p className="text-white font-medium">Full Editor Panel & Salaries</p>
                      <p className="text-gray-400 text-[11px] mt-0.5">Need to assign weddings, track completed items or pay editor dues?</p>
                    </div>
                    <button
                      onClick={() => {
                        onQuickAction('editors');
                        setSelectedInspectItem(null);
                      }}
                      className="px-4 py-2.5 bg-charcoal-800 hover:bg-charcoal-750 border border-white/10 text-gold-400 hover:text-gold-300 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer shrink-0"
                    >
                      <span>Manage Tab</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Close Footer Action */}
              <div className="border-t border-white/5 pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedInspectItem(null)}
                  className="px-5 py-2.5 bg-charcoal-800 hover:bg-charcoal-750 text-gray-300 hover:text-white font-bold text-xs rounded-xl transition-all cursor-pointer border border-white/5"
                >
                  Close Inspector
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default DashboardView;
