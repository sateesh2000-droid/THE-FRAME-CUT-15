import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  Download, 
  FileText, 
  ChevronDown, 
  Filter, 
  DollarSign, 
  IndianRupee, 
  Wallet, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  ExternalLink,
  X,
  Building2,
  Users,
  PieChart as PieChartIcon,
  BarChart3,
  Edit,
  Trash2
} from 'lucide-react';
import { Project, Expense, Editor, Studio, PaymentHistory } from '../types';
import ProjectProfitMarginD3Chart from './ProjectProfitMarginD3Chart';

interface FinancialOverviewViewProps {
  projects?: Project[];
  expenses?: Expense[];
  editors?: Editor[];
  studios?: Studio[];
  payments?: PaymentHistory[];
  onAddExpense?: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateExpense?: (id: string, updates: Partial<Expense>) => Promise<void>;
  onDeleteExpense?: (id: string) => Promise<void>;
  onUpdatePayment?: (id: string, updates: Partial<PaymentHistory>) => Promise<void>;
  onDeletePayment?: (id: string) => Promise<void>;
  onNavigateTab?: (tab: string) => void;
}

export default function FinancialOverviewView({
  projects = [],
  expenses = [],
  editors = [],
  studios = [],
  payments = [],
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  onUpdatePayment,
  onDeletePayment,
  onNavigateTab
}: FinancialOverviewViewProps) {
  // 1. Date Range Filter State
  const [dateRange, setDateRange] = useState<string>('01 Aug - 04 Aug 2026');
  const [showDateDropdown, setShowDateDropdown] = useState(false);

  // Edit / Delete transaction state
  const [editingTx, setEditingTx] = useState<any | null>(null);
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);

  // Time Range Filter for Sub-panels (Cashflow, Expense, Studios, Editors, etc.)
  const [panelPeriod, setPanelPeriod] = useState<string>('This Month');

  // Transaction filter tab state ('All' | 'Receipts' | 'Payouts')
  const [txFilter, setTxFilter] = useState<'All' | 'Receipts' | 'Payouts'>('All');

  // Hovered node on Cashflow Chart
  const [activeTooltipIndex, setActiveTooltipIndex] = useState<number | null>(3); // Default index 3 (4 Aug 2026)

  // Modals state
  const [showLogExpenseModal, setShowLogExpenseModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState<{ type: string; title: string; data?: any } | null>(null);
  const [selectedTxReceipt, setSelectedTxReceipt] = useState<any | null>(null);

  // New Expense form state
  const [expTitle, setExpTitle] = useState('');
  const [expCategory, setExpCategory] = useState('Editor Payouts');
  const [expAmount, setExpAmount] = useState<number | ''>('');
  const [expPayee, setExpPayee] = useState('');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expMode, setExpMode] = useState('UPI');

  // Initial Transaction state (Empty by default, populated by real payments/expenses)
  const [localTxList, setLocalTxList] = useState<Array<{
    id: string;
    date: string;
    type: 'Receipt' | 'Payout';
    entityName: string;
    paymentMode: string;
    refId: string;
    amount: number;
    status?: string;
  }>>([]);

  // Dynamic 1: KPI Metrics calculated directly from real-time database props
  const metrics = useMemo(() => {
    const grossRevenue = projects.reduce((sum, p) => sum + (Number(p.projectAmount) || 0), 0);
    const advanceReceived = projects.reduce((sum, p) => sum + (Number(p.advancePayment) || 0), 0);
    const remainingReceivables = projects.reduce((sum, p) => sum + (Number(p.remainingBalance) || 0), 0);
    const pendingInvoicesCount = projects.filter(p => (Number(p.remainingBalance) || 0) > 0).length;

    // Expenses = manual expenses logged + editor payouts from payments/projects
    const totalManualExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const totalEditorPayoutsLogged = payments
      .filter(p => p.entityType === 'editor')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const totalEditorPaymentsFromProjects = projects.reduce((sum, p) => sum + (Number(p.editorPayment) || 0), 0);
    const totalProjectOtherExpenses = projects.reduce((sum, p) => sum + (Number(p.otherExpenses) || 0), 0);

    const totalExpenses = totalManualExpenses + Math.max(totalEditorPayoutsLogged, totalEditorPaymentsFromProjects) + totalProjectOtherExpenses;
    const netProfit = grossRevenue - totalExpenses;
    const profitMargin = grossRevenue > 0 ? Math.round((netProfit / grossRevenue) * 100) : 0;

    return {
      grossRevenue,
      advanceReceived,
      remainingReceivables,
      pendingInvoicesCount,
      totalExpenses,
      netProfit,
      profitMargin
    };
  }, [projects, expenses, payments]);

  // Dynamic 2: Top Studios by Revenue
  const topStudios = useMemo(() => {
    const studioMap: Record<string, { name: string; amount: number }> = {};
    projects.forEach(p => {
      const name = p.studioName || 'Direct Client';
      if (!studioMap[name]) studioMap[name] = { name, amount: 0 };
      studioMap[name].amount += Number(p.projectAmount) || 0;
    });

    const sorted = Object.values(studioMap).sort((a, b) => b.amount - a.amount);
    if (sorted.length === 0) {
      return [];
    }
    return sorted.slice(0, 4).map((item, idx) => ({
      rank: idx + 1,
      name: item.name,
      amount: item.amount
    }));
  }, [projects]);

  // Dynamic 3: Revenue By Project / Event Type
  const projectTypeRevenue = useMemo(() => {
    const typeMap: Record<string, number> = {};
    let totalRev = 0;
    projects.forEach(p => {
      const type = p.eventType || 'Full Wedding';
      typeMap[type] = (typeMap[type] || 0) + (Number(p.projectAmount) || 0);
      totalRev += (Number(p.projectAmount) || 0);
    });

    const colors = ['#10b981', '#ef4444', '#eab308', '#8b5cf6', '#ec4899', '#06b6d4'];
    const entries = Object.entries(typeMap).sort((a, b) => b[1] - a[1]);

    if (entries.length === 0 || totalRev === 0) {
      return [];
    }

    return entries.map(([type, amount], idx) => {
      const percentage = Math.round((amount / totalRev) * 100);
      return {
        type,
        percentage,
        amount,
        color: colors[idx % colors.length]
      };
    });
  }, [projects]);

  // Dynamic 4: Expense Breakdown Segments
  const expenseBreakdown = useMemo(() => {
    const categoryMap: Record<string, number> = {
      'Editor Payouts': 0,
      'Office & Rent': 0,
      'Travel & Conveyance': 0,
      'Software / Tools': 0,
      'Equipment / Hard Disk': 0,
      'Miscellaneous': 0
    };

    expenses.forEach(e => {
      const cat = (e.category || '').toLowerCase();
      if (cat.includes('rent') || cat === 'office_rent') categoryMap['Office & Rent'] += Number(e.amount) || 0;
      else if (cat.includes('travel') || cat === 'travel') categoryMap['Travel & Conveyance'] += Number(e.amount) || 0;
      else if (cat.includes('disk') || cat === 'hard_disk') categoryMap['Equipment / Hard Disk'] += Number(e.amount) || 0;
      else if (cat.includes('editor') || cat === 'freelance_editor') categoryMap['Editor Payouts'] += Number(e.amount) || 0;
      else if (cat.includes('software') || cat.includes('internet')) categoryMap['Software / Tools'] += Number(e.amount) || 0;
      else categoryMap['Miscellaneous'] += Number(e.amount) || 0;
    });

    const editorPayoutsSum = payments
      .filter(p => p.entityType === 'editor')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    categoryMap['Editor Payouts'] += editorPayoutsSum;

    const projectExpensesSum = projects.reduce((sum, p) => sum + (Number(p.otherExpenses) || 0), 0);
    if (projectExpensesSum > 0) {
      categoryMap['Equipment / Hard Disk'] += projectExpensesSum;
    }

    const totalExp = Object.values(categoryMap).reduce((a, b) => a + b, 0);
    const colors: Record<string, string> = {
      'Editor Payouts': '#10b981',
      'Office & Rent': '#ef4444',
      'Travel & Conveyance': '#eab308',
      'Software / Tools': '#8b5cf6',
      'Equipment / Hard Disk': '#06b6d4',
      'Miscellaneous': '#ec4899'
    };

    if (totalExp === 0) {
      return [];
    }

    return Object.entries(categoryMap)
      .filter(([_, amt]) => amt > 0)
      .map(([title, amount]) => ({
        title,
        amount,
        percentage: Math.round((amount / totalExp) * 100),
        color: colors[title] || '#a855f7'
      }));
  }, [expenses, payments, projects]);

  // Dynamic 5: Editor Payout Overview
  const editorPayouts = useMemo(() => {
    if (editors.length === 0) {
      return [];
    }

    const colorBgs = [
      'bg-amber-600/30 text-amber-300',
      'bg-emerald-600/30 text-emerald-300',
      'bg-blue-600/30 text-blue-300',
      'bg-purple-600/30 text-purple-300',
      'bg-rose-600/30 text-rose-300'
    ];

    return editors.slice(0, 5).map((ed, idx) => {
      const edProjects = projects.filter(p => p.assignedEditorId === ed.id || p.secondEditorId === ed.id);
      let budget = 0;
      edProjects.forEach(p => {
        if (p.isSplitProject) {
          if (p.assignedEditorId === ed.id) budget += (Number(p.firstEditorShare) || 0);
          if (p.secondEditorId === ed.id) budget += (Number(p.secondEditorShare) || 0);
        } else {
          budget += (Number(p.editorPayment) || 0);
        }
      });

      const paid = payments
        .filter(p => p.entityId === ed.id && p.entityType === 'editor')
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

      const pending = Math.max(0, budget - paid);
      const initials = ed.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

      return {
        name: ed.name,
        amount: paid > 0 ? paid : budget,
        status: pending === 0 && budget > 0 ? 'Paid' : 'Pending',
        initials,
        bg: colorBgs[idx % colorBgs.length]
      };
    });
  }, [editors, projects, payments]);

  // Dynamic 6: Real-time Combined Transactions List
  const combinedTransactions = useMemo(() => {
    const list: Array<{
      id: string;
      date: string;
      type: 'Receipt' | 'Payout';
      entityName: string;
      paymentMode: string;
      refId: string;
      amount: number;
      status?: string;
    }> = [];

    payments.forEach(p => {
      list.push({
        id: p.id,
        date: p.date ? new Date(p.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent',
        type: p.entityType === 'studio' ? 'Receipt' : 'Payout',
        entityName: p.projectCoupleName || (p.entityType === 'studio' ? 'Studio Payment' : 'Editor Payment'),
        paymentMode: p.paymentMethod || 'UPI',
        refId: p.notes || `REF-${p.id.slice(-6).toUpperCase()}`,
        amount: Number(p.amount) || 0
      });
    });

    expenses.forEach(e => {
      list.push({
        id: e.id,
        date: e.date ? new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent',
        type: 'Payout',
        entityName: e.description || e.category || 'Office Expense',
        paymentMode: e.paymentMethod || 'Bank Transfer',
        refId: `EXP-${e.id.slice(-6).toUpperCase()}`,
        amount: Number(e.amount) || 0
      });
    });

    projects.forEach(p => {
      if ((p.advancePayment || 0) > 0 && !payments.some(pay => pay.projectId === p.id && pay.entityType === 'studio')) {
        list.push({
          id: `proj-adv-${p.id}`,
          date: p.createdAt ? new Date(p.createdAt?.seconds ? p.createdAt.seconds * 1000 : p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '01 Aug 2026',
          type: 'Receipt',
          entityName: `${p.coupleName} (${p.studioName || 'Studio'})`,
          paymentMode: 'UPI',
          refId: `ADV-${p.id.slice(-6).toUpperCase()}`,
          amount: Number(p.advancePayment) || 0
        });
      }
    });

    if (list.length === 0) {
      return localTxList;
    }

    return list;
  }, [payments, expenses, projects, localTxList]);

  // Handle Log Expense submission
  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expAmount || Number(expAmount) <= 0) return;

    const amt = Number(expAmount);
    const newTx = {
      id: `tx-${Date.now()}`,
      date: new Date(expDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      type: 'Payout' as const,
      entityName: expPayee || expTitle || 'Expense Payout',
      paymentMode: expMode,
      refId: `EXP${Math.floor(100000 + Math.random() * 900000)}`,
      amount: amt
    };

    setLocalTxList(prev => [newTx, ...prev]);

    if (onAddExpense) {
      try {
        await onAddExpense({
          category: expCategory,
          amount: amt,
          date: expDate,
          description: `${expTitle || expCategory} - Paid to ${expPayee || 'Vendor'}`,
          paymentMethod: expMode
        });
      } catch (err) {
        console.error("Error logging expense:", err);
      }
    }

    setExpTitle('');
    setExpAmount('');
    setExpPayee('');
    setShowLogExpenseModal(false);
  };

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    if (txFilter === 'Receipts') return combinedTransactions.filter(t => t.type === 'Receipt');
    if (txFilter === 'Payouts') return combinedTransactions.filter(t => t.type === 'Payout');
    return combinedTransactions;
  }, [combinedTransactions, txFilter]);

  // Cashflow chart timeline points
  const cashflowData = useMemo(() => {
    const revQuarter = Math.round(metrics.grossRevenue / 4);
    const expQuarter = Math.round(metrics.totalExpenses / 4);
    const profQuarter = revQuarter - expQuarter;

    return [
      { date: '1 Aug', label: '1 Aug 2026', revenue: Math.round(revQuarter * 0.8), expenses: Math.round(expQuarter * 0.9), profit: Math.round(profQuarter * 0.7) },
      { date: '2 Aug', label: '2 Aug 2026', revenue: Math.round(revQuarter * 1.1), expenses: Math.round(expQuarter * 1.0), profit: Math.round(profQuarter * 1.2) },
      { date: '3 Aug', label: '3 Aug 2026', revenue: Math.round(revQuarter * 0.9), expenses: Math.round(expQuarter * 0.8), profit: Math.round(profQuarter * 1.0) },
      { date: '4 Aug', label: '4 Aug 2026', revenue: Math.round(revQuarter * 1.2), expenses: Math.round(expQuarter * 1.3), profit: Math.round(profQuarter * 1.1) }
    ];
  }, [metrics]);

  return (
    <div className="min-h-screen bg-[#070c09] text-slate-100 p-3 sm:p-6 space-y-6 font-sans antialiased">
      
      {/* ================= HEADER SECTION ================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#142218] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif tracking-tight text-white font-normal">
            Financial Overview
          </h1>
          <p className="text-sm text-slate-400 font-sans mt-1">
            Track revenue, expenses and profitability in real time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Range Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDateDropdown(!showDateDropdown)}
              className="flex items-center gap-2 bg-[#0d1611] hover:bg-[#121f18] text-slate-200 border border-[#1b2b20] rounded-xl px-4 py-2 text-xs sm:text-sm font-medium transition-all shadow-sm"
            >
              <Calendar className="w-4 h-4 text-amber-500" />
              <span>{dateRange}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
            </button>

            {showDateDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-[#0f1a14] border border-[#1f3427] rounded-xl shadow-2xl z-30 py-1 text-xs">
                {['01 Aug - 04 Aug 2026', 'This Month (Aug 2026)', 'Today (04 Aug)', 'Last 7 Days', 'Last 30 Days', 'Custom Range'].map((range) => (
                  <button
                    key={range}
                    onClick={() => {
                      setDateRange(range);
                      setShowDateDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 hover:bg-[#18291f] transition-colors ${
                      dateRange === range ? 'text-amber-400 font-bold bg-[#14231a]' : 'text-slate-300'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* + Log Expense Button */}
          <button
            onClick={() => setShowLogExpenseModal(true)}
            className="flex items-center gap-2 bg-[#eab308]/10 hover:bg-[#eab308]/20 text-[#eab308] border border-[#eab308]/30 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Log Expense</span>
          </button>
        </div>
      </div>

      {/* ================= TOP 4 KPI METRIC CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Gross Revenue */}
        <div className="bg-[#0b130e] border border-[#16251b] rounded-2xl p-5 space-y-3 relative overflow-hidden group hover:border-[#10b981]/40 transition-all shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">GROSS REVENUE</span>
            <div className="w-8 h-8 rounded-full bg-[#10b981]/10 flex items-center justify-center text-[#10b981]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">
              ₹{metrics.grossRevenue.toLocaleString('en-IN')}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#10b981] font-semibold">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Real-time from projects</span>
            </div>
          </div>
          {/* Glowing Green Sparkline SVG */}
          <div className="pt-2 h-10 w-full opacity-80 group-hover:opacity-100 transition-opacity">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 30" preserveAspectRatio="none">
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M 0 25 Q 25 10 50 18 T 100 5 L 100 30 L 0 30 Z" fill="url(#revGrad)" />
              <path d="M 0 25 Q 25 10 50 18 T 100 5" fill="none" stroke="#10b981" strokeWidth="2.5" />
            </svg>
          </div>
        </div>

        {/* Card 2: Total Expenses */}
        <div className="bg-[#0b130e] border border-[#16251b] rounded-2xl p-5 space-y-3 relative overflow-hidden group hover:border-[#ef4444]/40 transition-all shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">TOTAL EXPENSES</span>
            <div className="w-8 h-8 rounded-full bg-[#ef4444]/10 flex items-center justify-center text-[#ef4444]">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">
              ₹{metrics.totalExpenses.toLocaleString('en-IN')}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#ef4444] font-semibold">
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>Logged expenses & editor payouts</span>
            </div>
          </div>
          {/* Glowing Red Sparkline SVG */}
          <div className="pt-2 h-10 w-full opacity-80 group-hover:opacity-100 transition-opacity">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 30" preserveAspectRatio="none">
              <defs>
                <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M 0 15 Q 25 25 50 10 T 100 20 L 100 30 L 0 30 Z" fill="url(#expGrad)" />
              <path d="M 0 15 Q 25 25 50 10 T 100 20" fill="none" stroke="#ef4444" strokeWidth="2.5" />
            </svg>
          </div>
        </div>

        {/* Card 3: Net Profit */}
        <div className="bg-[#0b130e] border border-[#16251b] rounded-2xl p-5 space-y-3 relative overflow-hidden group hover:border-[#eab308]/40 transition-all shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">NET PROFIT</span>
            <div className="w-8 h-8 rounded-full bg-[#eab308]/10 flex items-center justify-center text-[#eab308]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">
              ₹{metrics.netProfit.toLocaleString('en-IN')}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#eab308] font-semibold">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{metrics.profitMargin}% margin</span>
            </div>
          </div>
          {/* Glowing Amber Sparkline SVG */}
          <div className="pt-2 h-10 w-full opacity-80 group-hover:opacity-100 transition-opacity">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 30" preserveAspectRatio="none">
              <defs>
                <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#eab308" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M 0 22 Q 30 15 60 20 T 100 8 L 100 30 L 0 30 Z" fill="url(#profGrad)" />
              <path d="M 0 22 Q 30 15 60 20 T 100 8" fill="none" stroke="#eab308" strokeWidth="2.5" />
            </svg>
          </div>
        </div>

        {/* Card 4: Receivables */}
        <div className="bg-[#0b130e] border border-[#16251b] rounded-2xl p-5 space-y-3 relative overflow-hidden group hover:border-[#8b5cf6]/40 transition-all shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">RECEIVABLES</span>
            <div className="w-8 h-8 rounded-full bg-[#8b5cf6]/10 flex items-center justify-center text-[#8b5cf6]">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">
              ₹{metrics.remainingReceivables.toLocaleString('en-IN')}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#a78bfa] font-semibold">
              <span>{metrics.pendingInvoicesCount} invoices pending</span>
            </div>
          </div>
          {/* Glowing Indigo Sparkline SVG */}
          <div className="pt-2 h-10 w-full opacity-80 group-hover:opacity-100 transition-opacity">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 30" preserveAspectRatio="none">
              <defs>
                <linearGradient id="recGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M 0 18 Q 25 8 50 22 T 100 12 L 100 30 L 0 30 Z" fill="url(#recGrad)" />
              <path d="M 0 18 Q 25 8 50 22 T 100 12" fill="none" stroke="#8b5cf6" strokeWidth="2.5" />
            </svg>
          </div>
        </div>

      </div>

      {/* ================= D3.JS PROJECT-WISE PROFIT MARGIN CHART ================= */}
      <ProjectProfitMarginD3Chart projects={projects} expenses={expenses} />

      {/* ================= MIDDLE ROW: CASHFLOW & EXPENSE BREAKDOWN ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: CASHFLOW OVERVIEW (8 Cols) */}
        <div className="lg:col-span-7 xl:col-span-8 bg-[#0b130e] border border-[#16251b] rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#142218] pb-4">
            <div>
              <h3 className="text-base font-bold text-white tracking-wide uppercase text-xs">CASHFLOW OVERVIEW</h3>
              <div className="flex items-center gap-4 mt-2 text-xs">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></span> Revenue
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></span> Expenses
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#eab308]"></span> Profit
                </span>
              </div>
            </div>

            <select
              value={panelPeriod}
              onChange={(e) => setPanelPeriod(e.target.value)}
              className="bg-[#0f1b14] text-slate-300 text-xs border border-[#1d3225] rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="This Month">This Month</option>
              <option value="Last Month">Last Month</option>
              <option value="This Quarter">This Quarter</option>
            </select>
          </div>

          {/* Interactive Bezier Chart Container */}
          <div className="relative h-64 sm:h-72 w-full pt-4">
            {/* Horizontal Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between text-[10px] text-slate-500 pointer-events-none pb-6">
              <div className="border-b border-[#132017] w-full flex justify-between"><span>₹60K</span></div>
              <div className="border-b border-[#132017] w-full flex justify-between"><span>₹40K</span></div>
              <div className="border-b border-[#132017] w-full flex justify-between"><span>₹20K</span></div>
              <div className="border-b border-[#132017] w-full flex justify-between"><span>₹0</span></div>
              <div className="border-b border-[#132017] w-full flex justify-between"><span>-₹20K</span></div>
            </div>

            {/* SVG Area & Lines */}
            <svg className="w-full h-full overflow-visible" viewBox="0 0 400 200" preserveAspectRatio="none">
              {/* Revenue Curve */}
              <path
                d="M 20 130 C 80 120 120 70 180 85 C 240 100 280 40 360 30"
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
              />
              {/* Expenses Curve */}
              <path
                d="M 20 160 C 80 155 120 145 180 150 C 240 155 280 130 360 120"
                fill="none"
                stroke="#ef4444"
                strokeWidth="3"
              />
              {/* Profit Curve */}
              <path
                d="M 20 145 C 80 135 120 110 180 118 C 240 125 280 85 360 65"
                fill="none"
                stroke="#eab308"
                strokeWidth="3"
              />

              {/* Data points markers */}
              {[
                { x: 20, rev: 130, exp: 160, prof: 145 },
                { x: 120, rev: 70, exp: 145, prof: 110 },
                { x: 220, rev: 92, exp: 152, prof: 122 },
                { x: 360, rev: 30, exp: 120, prof: 65 }
              ].map((pt, idx) => (
                <g key={idx} className="cursor-pointer" onClick={() => setActiveTooltipIndex(idx)}>
                  <circle cx={pt.x} cy={pt.rev} r={activeTooltipIndex === idx ? 6 : 4} fill="#10b981" stroke="#070c09" strokeWidth="2" />
                  <circle cx={pt.x} cy={pt.exp} r={activeTooltipIndex === idx ? 6 : 4} fill="#ef4444" stroke="#070c09" strokeWidth="2" />
                  <circle cx={pt.x} cy={pt.prof} r={activeTooltipIndex === idx ? 6 : 4} fill="#eab308" stroke="#070c09" strokeWidth="2" />
                </g>
              ))}
            </svg>

            {/* Interactive Tooltip matching image overlay at 4 Aug */}
            {activeTooltipIndex !== null && (
              <div
                className="absolute bg-[#0b1610]/95 border border-[#1e3426] rounded-xl p-3 shadow-2xl z-20 text-xs w-44 pointer-events-none transition-all duration-200"
                style={{
                  left: activeTooltipIndex === 3 ? '60%' : activeTooltipIndex === 0 ? '5%' : `${activeTooltipIndex * 25}%`,
                  top: '15%'
                }}
              >
                <div className="font-bold text-slate-200 border-b border-[#1b2c21] pb-1.5 mb-2">
                  {cashflowData[activeTooltipIndex].label}
                </div>
                <div className="space-y-1 font-mono">
                  <div className="flex items-center justify-between text-[#10b981]">
                    <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>Revenue</span>
                    <span className="font-bold">₹{cashflowData[activeTooltipIndex].revenue.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#ef4444]">
                    <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]"></span>Expenses</span>
                    <span className="font-bold">₹{cashflowData[activeTooltipIndex].expenses.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#eab308]">
                    <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#eab308]"></span>Profit</span>
                    <span className="font-bold">₹{cashflowData[activeTooltipIndex].profit.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            )}

            {/* X-Axis Labels */}
            <div className="flex justify-between text-xs text-slate-400 pt-3 px-2 font-medium">
              <span>1 Aug</span>
              <span>2 Aug</span>
              <span>3 Aug</span>
              <span>4 Aug</span>
            </div>
          </div>
        </div>

        {/* Right: EXPENSE BREAKDOWN (4 Cols) */}
        <div className="lg:col-span-5 xl:col-span-4 bg-[#0b130e] border border-[#16251b] rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-wide uppercase text-xs border-b border-[#142218] pb-4">
              EXPENSE BREAKDOWN
            </h3>

            {/* Donut Ring Chart with Center Text */}
            <div className="relative flex items-center justify-center my-6">
              <svg className="w-44 h-44 transform -rotate-90 overflow-visible" viewBox="0 0 100 100">
                {/* Donut Segments */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#10b981" strokeWidth="12" strokeDasharray="107 131" strokeDashoffset="0" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#ef4444" strokeWidth="12" strokeDasharray="47 191" strokeDashoffset="-107" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#eab308" strokeWidth="12" strokeDasharray="36 202" strokeDashoffset="-154" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#8b5cf6" strokeWidth="12" strokeDasharray="24 214" strokeDashoffset="-190" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#06b6d4" strokeWidth="12" strokeDasharray="24 214" strokeDashoffset="-214" />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">TOTAL</span>
                <span className="text-lg sm:text-xl font-extrabold text-white mt-0.5">₹{metrics.totalExpenses.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Breakdown List */}
            <div className="space-y-2.5 text-xs">
              {expenseBreakdown.map((item) => (
                <div key={item.title} className="flex items-center justify-between text-slate-300 hover:text-white transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                    <span>{item.title}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 font-medium">{item.percentage}%</span>
                    <span className="font-bold text-white w-16 text-right">₹{item.amount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setShowDetailModal({ type: 'expense_breakdown', title: 'Full Expense Breakdown', data: expenseBreakdown })}
            className="w-full mt-4 text-center text-xs font-bold text-amber-500 hover:text-amber-400 flex items-center justify-center gap-1 py-2 rounded-xl hover:bg-[#15241b] transition-all"
          >
            <span>View Full Breakdown</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* ================= BOTTOM GRID: 4 ANALYTICAL CARDS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: TOP STUDIOS */}
        <div className="bg-[#0b130e] border border-[#16251b] rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#142218] pb-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">TOP STUDIOS</h4>
              <span className="text-[10px] text-amber-500 bg-[#eab308]/10 px-2 py-0.5 rounded-md font-semibold">This Month</span>
            </div>

            <div className="space-y-3 mt-3">
              {topStudios.length > 0 ? (
                topStudios.map((st) => (
                  <div key={st.rank} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#eab308]/10 text-amber-400 font-bold flex items-center justify-center text-[11px]">
                        {st.rank}
                      </span>
                      <span className="font-medium text-slate-200">{st.name}</span>
                    </div>
                    <span className="font-bold text-white">₹{st.amount.toLocaleString('en-IN')}</span>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-500 font-mono">
                  No studio revenue logged yet
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigateTab ? onNavigateTab('studios') : setShowDetailModal({ type: 'studios', title: 'Top Studios Detail', data: topStudios })}
            className="text-xs font-bold text-amber-500 hover:text-amber-400 flex items-center justify-center gap-1 pt-3 border-t border-[#142218] hover:bg-[#142218]/50 py-1 rounded-lg transition-all"
          >
            <span>View All Studios</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 2: REVENUE BY PROJECT TYPE */}
        <div className="bg-[#0b130e] border border-[#16251b] rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#142218] pb-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">REVENUE BY PROJECT TYPE</h4>
              <span className="text-[10px] text-amber-500 bg-[#eab308]/10 px-2 py-0.5 rounded-md font-semibold">This Month</span>
            </div>

            {projectTypeRevenue.length > 0 ? (
              <div className="flex items-center gap-3 mt-3">
                {/* Ring chart preview */}
                <div className="relative w-16 h-16 shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10b981" strokeWidth="4" strokeDasharray="42, 100" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#ef4444" strokeWidth="4" strokeDasharray="20, 100" strokeDashoffset="-42" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#eab308" strokeWidth="4" strokeDasharray="15, 100" strokeDashoffset="-62" />
                  </svg>
                </div>

                <div className="space-y-1 w-full text-[11px]">
                  {projectTypeRevenue.slice(0, 3).map((item) => (
                    <div key={item.type} className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-300">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                        {item.type}
                      </span>
                      <span className="text-slate-400 font-mono">{item.percentage}%</span>
                      <span className="font-bold text-white">₹{item.amount.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-500 font-mono">
                No revenue by type recorded
              </div>
            )}
          </div>

          <button
            onClick={() => setShowDetailModal({ type: 'project_revenue', title: 'Revenue by Project Type', data: projectTypeRevenue })}
            className="text-xs font-bold text-amber-500 hover:text-amber-400 flex items-center justify-center gap-1 pt-3 border-t border-[#142218] hover:bg-[#142218]/50 py-1 rounded-lg transition-all"
          >
            <span>View Full Report</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 3: EDITOR PAYOUT OVERVIEW */}
        <div className="bg-[#0b130e] border border-[#16251b] rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#142218] pb-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">EDITOR PAYOUT OVERVIEW</h4>
              <span className="text-[10px] text-amber-500 bg-[#eab308]/10 px-2 py-0.5 rounded-md font-semibold">This Month</span>
            </div>

            <div className="space-y-2.5 mt-3">
              {editorPayouts.length > 0 ? (
                editorPayouts.map((ed) => (
                  <div key={ed.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full ${ed.bg} font-bold text-[10px] flex items-center justify-center`}>
                        {ed.initials}
                      </div>
                      <span className="font-medium text-slate-200">{ed.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">₹{ed.amount.toLocaleString('en-IN')}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ed.status === 'Paid' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {ed.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-500 font-mono">
                  No editor payouts logged yet
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigateTab ? onNavigateTab('editors') : setShowDetailModal({ type: 'editors', title: 'Editor Payouts Detail', data: editorPayouts })}
            className="text-xs font-bold text-amber-500 hover:text-amber-400 flex items-center justify-center gap-1 pt-3 border-t border-[#142218] hover:bg-[#142218]/50 py-1 rounded-lg transition-all"
          >
            <span>View All Editors</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 4: FINANCIAL SUMMARY */}
        <div className="bg-[#0b130e] border border-[#16251b] rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#142218] pb-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">FINANCIAL SUMMARY</h4>
              <span className="text-[10px] text-amber-500 bg-[#eab308]/10 px-2 py-0.5 rounded-md font-semibold">This Month</span>
            </div>

            <div className="grid grid-cols-3 gap-1 text-center my-3 border-b border-[#142218] pb-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">Income</span>
                <span className="font-extrabold text-[#10b981]">₹{metrics.grossRevenue.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Expenses</span>
                <span className="font-extrabold text-[#ef4444]">₹{metrics.totalExpenses.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Profit</span>
                <span className="font-extrabold text-[#eab308]">₹{metrics.netProfit.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Profit Margin Progress Bar */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between font-semibold">
                <span className="text-slate-300">Profit Margin</span>
                <span className="text-amber-400 font-bold">{metrics.profitMargin}%</span>
              </div>
              <div className="w-full h-2 bg-[#16251b] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, metrics.profitMargin))}%` }}
                ></div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowDetailModal({ type: 'fin_summary', title: 'Financial Summary Report', data: null })}
            className="text-xs font-bold text-amber-500 hover:text-amber-400 flex items-center justify-center gap-1 pt-3 border-t border-[#142218] hover:bg-[#142218]/50 py-1 rounded-lg transition-all"
          >
            <span>View Details</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* ================= RECENT TRANSACTIONS TABLE ================= */}
      <div className="bg-[#0b130e] border border-[#16251b] rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#142218] pb-4 gap-3">
          <h3 className="text-base font-bold text-white tracking-wide uppercase text-xs">
            RECENT TRANSACTIONS
          </h3>

          <div className="flex items-center gap-3">
            {/* Filter Pills */}
            <div className="flex items-center bg-[#0d1611] p-1 rounded-xl border border-[#1b2b20] text-xs font-semibold">
              {(['All', 'Receipts', 'Payouts'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setTxFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    txFilter === tab ? 'bg-[#182a1f] text-amber-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowDetailModal({ type: 'transactions', title: 'All Financial Transactions', data: combinedTransactions })}
              className="text-xs font-bold text-amber-500 hover:text-amber-400 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead>
              <tr className="border-b border-[#17261c] text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-[#0d1611]/60">
                <th className="p-3">DATE</th>
                <th className="p-3">TYPE</th>
                <th className="p-3">STUDIO / EDITOR</th>
                <th className="p-3">PAYMENT MODE</th>
                <th className="p-3">REFERENCE ID</th>
                <th className="p-3 text-right">AMOUNT</th>
                <th className="p-3 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#132017]">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#121f18]/60 transition-colors">
                    <td className="p-3 font-medium text-slate-300">{tx.date}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        tx.type === 'Receipt' ? 'bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30' : 'bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/30'
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-white">{tx.entityName}</td>
                    <td className="p-3 text-slate-300">{tx.paymentMode}</td>
                    <td className="p-3 font-mono text-slate-400 text-[11px]">{tx.refId}</td>
                    <td className={`p-3 text-right font-extrabold text-sm ${
                      tx.type === 'Receipt' ? 'text-[#10b981]' : 'text-[#ef4444]'
                    }`}>
                      {tx.type === 'Receipt' ? '+' : '-'} ₹{tx.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedTxReceipt(tx)}
                          title="View Receipt"
                          className="p-1.5 rounded-lg bg-[#14231a] hover:bg-[#1f3729] text-amber-400 transition-all cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingTx(tx)}
                          title="Edit Transaction"
                          className="p-1.5 rounded-lg bg-[#14231a] hover:bg-amber-500/20 text-amber-300 transition-all cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingTxId(tx.id)}
                          title="Delete Transaction"
                          className="p-1.5 rounded-lg bg-[#14231a] hover:bg-red-500/20 text-red-400 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 font-mono text-xs">
                    No financial transactions recorded yet. Log an expense or add projects to see transactions.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= LOG EXPENSE MODAL ================= */}
      {showLogExpenseModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b140f] border border-[#1d3326] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-scaleUp text-slate-100">
            <div className="flex items-center justify-between border-b border-[#182b20] pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-500" /> Log New Expense
              </h3>
              <button
                onClick={() => setShowLogExpenseModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="text-slate-400 block mb-1">Expense Title / Payee</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Editor Payout to Vansh / Office Rent"
                  value={expPayee}
                  onChange={(e) => setExpPayee(e.target.value)}
                  className="w-full bg-[#111f17] border border-[#1f3629] rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Category</label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value)}
                  className="w-full bg-[#111f17] border border-[#1f3629] rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer"
                >
                  <option value="Editor Payouts">Editor Payouts</option>
                  <option value="Office & Rent">Office & Rent</option>
                  <option value="Travel & Conveyance">Travel & Conveyance</option>
                  <option value="Software / Tools">Software / Tools</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 15000"
                  value={expAmount}
                  onChange={(e) => setExpAmount(Number(e.target.value) || '')}
                  className="w-full bg-[#111f17] border border-[#1f3629] rounded-xl px-3 py-2 text-amber-400 font-bold text-base focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Payment Mode</label>
                  <select
                    value={expMode}
                    onChange={(e) => setExpMode(e.target.value)}
                    className="w-full bg-[#111f17] border border-[#1f3629] rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Date</label>
                  <input
                    type="date"
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="w-full bg-[#111f17] border border-[#1f3629] rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#182b20]">
                <button
                  type="button"
                  onClick={() => setShowLogExpenseModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-lg"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= RECEIPT VIEW MODAL ================= */}
      {selectedTxReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1712] border border-[#203629] rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl text-slate-100 relative">
            <button
              onClick={() => setSelectedTxReceipt(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1 border-b border-[#182a1f] pb-4">
              <span className="text-[10px] font-bold text-amber-500 bg-[#eab308]/10 px-3 py-1 rounded-full uppercase tracking-wider">
                TRANSACTION RECEIPT
              </span>
              <h2 className="text-xl font-black text-white pt-2">{selectedTxReceipt.entityName}</h2>
              <p className="text-xs text-slate-400">Ref ID: {selectedTxReceipt.refId}</p>
            </div>

            <div className="space-y-3 text-xs bg-[#122019] p-4 rounded-xl border border-[#1d3428]">
              <div className="flex justify-between">
                <span className="text-slate-400">Date & Time:</span>
                <span className="font-semibold text-white">{selectedTxReceipt.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Transaction Type:</span>
                <span className={`font-bold ${selectedTxReceipt.type === 'Receipt' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {selectedTxReceipt.type}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Mode:</span>
                <span className="font-semibold text-slate-200">{selectedTxReceipt.paymentMode}</span>
              </div>
              <div className="border-t border-[#1d3428] pt-2 flex justify-between text-sm font-black">
                <span className="text-slate-300">Total Amount:</span>
                <span className={selectedTxReceipt.type === 'Receipt' ? 'text-emerald-400' : 'text-red-400'}>
                  ₹{selectedTxReceipt.amount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedTxReceipt(null)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:bg-[#15251c] text-xs font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl shadow-lg flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" /> Download Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= GENERIC DETAIL MODAL ================= */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1712] border border-[#203629] rounded-2xl w-full max-w-xl p-6 space-y-4 shadow-2xl text-slate-100 relative">
            <div className="flex items-center justify-between border-b border-[#182a1f] pb-3">
              <h3 className="text-lg font-bold text-white">{showDetailModal.title}</h3>
              <button
                onClick={() => setShowDetailModal(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs max-h-96 overflow-y-auto pr-1">
              {Array.isArray(showDetailModal.data) ? (
                showDetailModal.data.map((item: any, idx: number) => (
                  <div key={idx} className="bg-[#13211a] p-3 rounded-xl border border-[#1e3428] flex justify-between items-center">
                    <div>
                      <span className="font-bold text-white block">{item.name || item.title || item.type}</span>
                      {item.percentage && <span className="text-slate-400 text-[10px]">Percentage: {item.percentage}%</span>}
                      {item.status && <span className="text-amber-400 text-[10px] block">Status: {item.status}</span>}
                    </div>
                    <span className="text-sm font-extrabold text-amber-400">
                      ₹{(item.amount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))
              ) : (
                <div className="bg-[#13211a] p-4 rounded-xl border border-[#1e3428] space-y-2">
                  <div className="flex justify-between"><span>Total Revenue:</span><span className="font-bold text-emerald-400">₹{metrics.grossRevenue.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between"><span>Total Expenses:</span><span className="font-bold text-red-400">₹{metrics.totalExpenses.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between"><span>Net Profit:</span><span className="font-bold text-amber-400">₹{metrics.netProfit.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between"><span>Profit Margin:</span><span className="font-bold text-white">{metrics.profitMargin}%</span></div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowDetailModal(null)}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= EDIT TRANSACTION MODAL ================= */}
      {editingTx && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b140f] border border-[#1d3326] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-[#182b20] pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit className="w-5 h-5 text-amber-500" /> Edit Transaction
              </h3>
              <button
                onClick={() => setEditingTx(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const updatedList = localTxList.map(t => t.id === editingTx.id ? editingTx : t);
                setLocalTxList(updatedList);

                // Call Firestore update handlers if provided
                if (editingTx.type === 'Receipt' && onUpdatePayment) {
                  try { await onUpdatePayment(editingTx.id, { amount: editingTx.amount, paymentMethod: editingTx.paymentMode }); } catch (err) {}
                } else if (editingTx.type === 'Payout' && onUpdateExpense) {
                  try { await onUpdateExpense(editingTx.id, { amount: editingTx.amount, paymentMethod: editingTx.paymentMode }); } catch (err) {}
                }

                setEditingTx(null);
              }}
              className="space-y-4 text-xs sm:text-sm"
            >
              <div>
                <label className="text-slate-400 block mb-1">Entity / Payee Name</label>
                <input
                  type="text"
                  required
                  value={editingTx.entityName || ''}
                  onChange={(e) => setEditingTx({ ...editingTx, entityName: e.target.value })}
                  className="w-full bg-[#111f17] border border-[#1f3629] rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Type</label>
                  <select
                    value={editingTx.type}
                    onChange={(e) => setEditingTx({ ...editingTx, type: e.target.value })}
                    className="w-full bg-[#111f17] border border-[#1f3629] rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer"
                  >
                    <option value="Receipt">Receipt (+)</option>
                    <option value="Payout">Payout (-)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Payment Mode</label>
                  <select
                    value={editingTx.paymentMode}
                    onChange={(e) => setEditingTx({ ...editingTx, paymentMode: e.target.value })}
                    className="w-full bg-[#111f17] border border-[#1f3629] rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={editingTx.amount || ''}
                  onChange={(e) => setEditingTx({ ...editingTx, amount: Number(e.target.value) })}
                  className="w-full bg-[#111f17] border border-[#1f3629] rounded-xl px-3 py-2 text-amber-400 font-bold text-base focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Reference ID</label>
                  <input
                    type="text"
                    value={editingTx.refId || ''}
                    onChange={(e) => setEditingTx({ ...editingTx, refId: e.target.value })}
                    className="w-full bg-[#111f17] border border-[#1f3629] rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Date</label>
                  <input
                    type="text"
                    value={editingTx.date || ''}
                    onChange={(e) => setEditingTx({ ...editingTx, date: e.target.value })}
                    className="w-full bg-[#111f17] border border-[#1f3629] rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#182b20]">
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DELETE TRANSACTION CONFIRMATION MODAL ================= */}
      {deletingTxId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b140f] border border-red-500/30 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl text-slate-100 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Delete Transaction</h3>
              <p className="text-xs text-slate-400 mt-1">Are you sure you want to delete this financial transaction entry? This cannot be undone.</p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingTxId(null)}
                className="px-4 py-2 rounded-xl bg-[#14231a] text-slate-300 hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const targetTx = combinedTransactions.find(t => t.id === deletingTxId);
                  setLocalTxList(prev => prev.filter(t => t.id !== deletingTxId));

                  if (targetTx) {
                    if (targetTx.type === 'Payout' && onDeleteExpense) {
                      try { await onDeleteExpense(deletingTxId); } catch (err) {}
                    }
                    if (onDeletePayment) {
                      try { await onDeletePayment(deletingTxId); } catch (err) {}
                    }
                  }

                  setDeletingTxId(null);
                }}
                className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-xs shadow-lg"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
