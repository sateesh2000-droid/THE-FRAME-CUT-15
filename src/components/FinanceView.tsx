import React, { useState } from 'react';
import { 
  IndianRupee, 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  Plus, 
  Trash2, 
  Calendar, 
  Tag, 
  Info, 
  FileSpreadsheet, 
  Activity,
  ArrowUpRight,
  TrendingUpIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Project, Expense, Editor, Studio, PaymentHistory } from '../types';

interface FinanceViewProps {
  projects: Project[];
  expenses: Expense[];
  editors: Editor[];
  studios: Studio[];
  payments: PaymentHistory[];
  onAddExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<void>;
  onDeleteExpense: (id: string) => Promise<void>;
  initialTriggerAction?: string;
}

const EXPENSE_CATEGORIES = [
  { id: 'hard_disk', label: 'Hard Disk Drive', color: 'bg-blue-500/10 text-blue-400' },
  { id: 'internet', label: 'Internet / Fiber', color: 'bg-purple-500/10 text-purple-400' },
  { id: 'office_rent', label: 'Office Rent / Suite', color: 'bg-amber-500/10 text-amber-400' },
  { id: 'electricity', label: 'Electricity Bills', color: 'bg-yellow-500/10 text-yellow-400' },
  { id: 'travel', label: 'Shoot Travel', color: 'bg-pink-500/10 text-pink-400' },
  { id: 'freelance_editor', label: 'Freelance Editors', color: 'bg-teal-500/10 text-teal-400' },
  { id: 'other', label: 'Other Sundry Costs', color: 'bg-gray-500/10 text-gray-400' }
];

const FinanceView = React.memo(function FinanceView({
  projects,
  expenses,
  editors,
  studios,
  payments,
  onAddExpense,
  onDeleteExpense,
  initialTriggerAction
}: FinanceViewProps) {
  const [reportType, setReportType] = useState<'daily' | 'monthly' | 'yearly'>('monthly');
  const [isModalOpen, setIsModalOpen] = useState(initialTriggerAction === 'add_expense');
  
  // Expense Form state
  const [amount, setAmount] = useState<number>(0);
  const [category, setCategory] = useState<Expense['category']>('hard_disk');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>('');
  const [expenseProjectId, setExpenseProjectId] = useState<string>('');

  // Consolidated Math
  const totalRevenue = projects.reduce((sum, p) => sum + (p.projectAmount || 0), 0);
  const totalAdvanceReceived = projects.reduce((sum, p) => sum + (p.advancePayment || 0), 0);
  const totalOutstandingReceivable = totalRevenue - totalAdvanceReceived;

  // Total Editor Cost
  const totalEditorCost = projects.reduce((sum, p) => sum + (p.editorPayment || 0), 0);
  // Total Miscellaneous Project Expenses
  const totalProjectExpenses = projects.reduce((sum, p) => sum + (p.otherExpenses || 0), 0);
  // Total Manual Operating Expenses
  const totalOperatingExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const grandTotalExpenses = totalEditorCost + totalProjectExpenses + totalOperatingExpenses;
  const netProfitVal = totalRevenue - grandTotalExpenses;
  const netProfitMargin = totalRevenue > 0 ? (netProfitVal / totalRevenue) * 100 : 0;

  // Submit Expense
  const handleLogExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !description.trim()) return;

    await onAddExpense({
      amount,
      category,
      date,
      description,
      projectId: expenseProjectId || undefined
    });

    setAmount(0);
    setDescription('');
    setExpenseProjectId('');
    setIsModalOpen(false);
  };

  // Group items dynamically for Daily, Monthly, and Yearly breakdowns
  const getReportingData = () => {
    const data: { label: string; revenue: number; expenses: number; profit: number }[] = [];
    
    if (reportType === 'monthly') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      months.forEach((m, idx) => {
        // Filter projects in this month (using shootDate or createdAt)
        const monthProjects = projects.filter(p => {
          const dateObj = new Date(p.shootDate || p.createdAt?.seconds * 1000 || Date.now());
          return dateObj.getMonth() === idx;
        });
        
        const monthManualExpenses = expenses.filter(e => {
          const dateObj = new Date(e.date);
          return dateObj.getMonth() === idx;
        });

        const rev = monthProjects.reduce((sum, p) => sum + (p.projectAmount || 0), 0);
        const edPay = monthProjects.reduce((sum, p) => sum + (p.editorPayment || 0), 0);
        const pExp = monthProjects.reduce((sum, p) => sum + (p.otherExpenses || 0), 0);
        const opExp = monthManualExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        
        const expSum = edPay + pExp + opExp;
        const profit = rev - expSum;

        if (rev > 0 || expSum > 0) {
          data.push({ label: `${m} 2026`, revenue: rev, expenses: expSum, profit });
        }
      });
    } else if (reportType === 'daily') {
      // Group by distinct days for the last 7 logged days
      const days = Array.from(new Set([
        ...projects.map(p => p.shootDate),
        ...expenses.map(e => e.date)
      ])).filter(Boolean).sort().slice(-7);

      days.forEach(d => {
        const dayProjects = projects.filter(p => p.shootDate === d);
        const dayExpenses = expenses.filter(e => e.date === d);

        const rev = dayProjects.reduce((sum, p) => sum + (p.projectAmount || 0), 0);
        const edPay = dayProjects.reduce((sum, p) => sum + (p.editorPayment || 0), 0);
        const pExp = dayProjects.reduce((sum, p) => sum + (p.otherExpenses || 0), 0);
        const opExp = dayExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

        const expSum = edPay + pExp + opExp;
        const profit = rev - expSum;

        data.push({ label: d, revenue: rev, expenses: expSum, profit });
      });
    } else {
      // Yearly totals
      data.push({
        label: 'FY 2025-26',
        revenue: totalRevenue,
        expenses: grandTotalExpenses,
        profit: netProfitVal
      });
    }

    return data;
  };

  const reportEntries = getReportingData();

  return (
    <div className="space-y-8">
      
      {/* Top financial KPI metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Revenue Card */}
        <div className="p-6 rounded-3xl glass-panel relative overflow-hidden flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <span className="text-gray-400 text-xs font-mono uppercase tracking-wider">Gross Business Revenue</span>
            <div className="p-2 bg-emerald-500/10 rounded-xl">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-extrabold font-sans text-white tracking-tight">₹{totalRevenue.toLocaleString('en-IN')}</h3>
            <p className="text-[10px] text-gray-400 mt-1.5 font-mono">
              ₹{totalAdvanceReceived.toLocaleString('en-IN')} Received • ₹{totalOutstandingReceivable.toLocaleString('en-IN')} Receivable
            </p>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="p-6 rounded-3xl glass-panel relative overflow-hidden flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <span className="text-gray-400 text-xs font-mono uppercase tracking-wider">Aggregate Operating Costs</span>
            <div className="p-2 bg-red-500/10 rounded-xl">
              <TrendingDown className="w-4 h-4 text-red-400" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-extrabold font-sans text-white tracking-tight">₹{grandTotalExpenses.toLocaleString('en-IN')}</h3>
            <p className="text-[10px] text-gray-400 mt-1.5 font-mono">
              ₹{totalEditorCost.toLocaleString('en-IN')} Editor Pay • ₹{totalOperatingExpenses.toLocaleString('en-IN')} Office & Disks
            </p>
          </div>
        </div>

        {/* Profit Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-luxury-green-950/40 to-charcoal-900 border border-gold-500/30 relative overflow-hidden flex flex-col justify-between h-40 gold-glow">
          <div className="flex justify-between items-start">
            <span className="text-gold-300 text-xs font-mono uppercase tracking-wider">Net Operating Profits</span>
            <div className="p-2 bg-gold-500/10 rounded-xl border border-gold-500/20">
              <Sparkles className="w-4 h-4 text-gold-400" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-extrabold font-sans text-white tracking-tight">₹{netProfitVal.toLocaleString('en-IN')}</h3>
            <p className="text-[10px] text-gold-400 mt-1.5 font-mono">
              {netProfitMargin.toFixed(1)}% Company Profit Margin
            </p>
          </div>
        </div>

        {/* Outstanding settlements card */}
        <div className="p-6 rounded-3xl glass-panel relative overflow-hidden flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <span className="text-gray-400 text-xs font-mono uppercase tracking-wider">Cash Reserve Pipeline</span>
            <div className="p-2 bg-purple-500/10 rounded-xl">
              <Activity className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-extrabold font-sans text-white tracking-tight">
              ₹{totalAdvanceReceived.toLocaleString('en-IN')}
            </h3>
            <p className="text-[10px] text-gray-400 mt-1.5 font-mono">
              Liquid physical & bank advance holdings
            </p>
          </div>
        </div>
      </div>

      {/* Accounting Reports (Daily, Monthly, Yearly) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Reports Ledger sheet */}
        <div className="xl:col-span-2 p-6 rounded-3xl glass-panel">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
            <div>
              <h3 className="text-lg font-bold font-display text-white">Financial Statement ledger</h3>
              <p className="text-xs text-gray-400 mt-0.5">Automated accounting statements for audits</p>
            </div>

            <div className="flex space-x-1.5 bg-charcoal-900 border border-luxury-green-800/30 p-1 rounded-2xl shrink-0">
              <button
                onClick={() => setReportType('daily')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all ${reportType === 'daily' ? 'bg-luxury-green-800 text-gold-400 font-bold' : 'text-gray-400 hover:text-gray-200'}`}
              >
                Daily
              </button>
              <button
                onClick={() => setReportType('monthly')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all ${reportType === 'monthly' ? 'bg-luxury-green-800 text-gold-400 font-bold' : 'text-gray-400 hover:text-gray-200'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setReportType('yearly')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all ${reportType === 'yearly' ? 'bg-luxury-green-800 text-gold-400 font-bold' : 'text-gray-400 hover:text-gray-200'}`}
              >
                Yearly
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-luxury-green-800/10 overflow-hidden bg-charcoal-950/20">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-charcoal-900 text-[10px] uppercase font-mono tracking-wider text-gray-400 border-b border-luxury-green-800/20">
                    <th className="p-4">Billing Period</th>
                    <th className="p-4">Aggregate Revenue</th>
                    <th className="p-4">Consolidated Expenses</th>
                    <th className="p-4 text-right pr-6">Net Season Profits</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-luxury-green-800/10 font-mono text-gray-300">
                  {reportEntries.map((entry, idx) => (
                    <tr key={idx} className="hover:bg-luxury-green-950/10">
                      <td className="p-4 text-gray-200 font-bold font-sans">{entry.label}</td>
                      <td className="p-4 text-emerald-400">+ ₹{entry.revenue.toLocaleString('en-IN')}</td>
                      <td className="p-4 text-red-400">- ₹{entry.expenses.toLocaleString('en-IN')}</td>
                      <td className={`p-4 text-right pr-6 font-bold ${entry.profit >= 0 ? 'text-gold-400' : 'text-red-400'}`}>
                        ₹{entry.profit.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                  {reportEntries.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-gray-500 font-mono">No transactions logged in this billing framework.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Expenses List & dynamic logger */}
        <div className="p-6 rounded-3xl glass-panel flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold font-display text-white">Operating Expenses</h3>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center space-x-1 text-xs font-bold text-gold-400 hover:underline cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Log Expense</span>
              </button>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {expenses.length > 0 ? (
                expenses.map((exp) => {
                  const cat = EXPENSE_CATEGORIES.find(c => c.id === exp.category);
                  return (
                    <div 
                      key={exp.id} 
                      className="p-3 bg-charcoal-950/60 border border-luxury-green-800/10 rounded-xl flex items-center justify-between group"
                    >
                      <div className="pr-4 overflow-hidden">
                        <span className={`text-[8px] font-mono px-2 py-0.5 rounded uppercase ${cat?.color || 'bg-gray-800 text-gray-300'}`}>
                          {cat?.label || exp.category}
                        </span>
                        <h4 className="text-xs font-semibold text-gray-200 truncate mt-1">{exp.description}</h4>
                        <p className="text-[9px] text-gray-500 mt-0.5 font-mono">{exp.date}</p>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="text-xs font-mono font-bold text-red-400">
                          - ₹{exp.amount.toLocaleString('en-IN')}
                        </span>
                        <button
                          onClick={() => onDeleteExpense(exp.id)}
                          className="p-1 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 text-xs text-gray-500 font-mono">No operating expenses recorded. All profits clean.</div>
              )}
            </div>
          </div>

          <div className="border-t border-luxury-green-800/10 pt-4 mt-6 text-xs text-gray-400 font-mono flex items-center space-x-2">
            <Info className="w-4 h-4 text-gold-500 shrink-0" />
            <span>Formula: Net Profit = Contract Amount - Editor Pay - Operating Expenses</span>
          </div>
        </div>
      </div>

      {/* Expense Creator Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />

              <motion.div
                id="expense-form-modal"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="inline-block w-full max-w-sm p-6 my-8 overflow-hidden text-left align-middle transition-all transform rounded-3xl glass-panel relative z-10"
              >
                <h3 className="text-lg font-bold text-white font-display mb-4">Log Company Expense</h3>

                <form onSubmit={handleLogExpense} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Expense Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as Expense['category'])}
                      className="w-full bg-charcoal-900 border border-luxury-green-800/30 rounded-xl px-3 py-2 text-xs text-gray-300"
                    >
                      {EXPENSE_CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Date</label>
                      <input
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        onClick={(e) => { try { e.currentTarget.showPicker(); } catch (err) {} }}
                        className="w-full bg-charcoal-900 border border-luxury-green-800/30 rounded-xl px-3 py-2 text-xs text-white cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Amount (INR)</label>
                      <input
                        type="number"
                        required
                        placeholder="INR"
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        className="w-full bg-charcoal-900 border border-luxury-green-800/30 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Link to Wedding (Optional)</label>
                    <select
                      value={expenseProjectId}
                      onChange={(e) => setExpenseProjectId(e.target.value)}
                      className="w-full bg-charcoal-900 border border-luxury-green-800/30 rounded-xl px-3 py-2 text-xs text-gray-300"
                    >
                      <option value="">Keep Unlinked / General Cost</option>
                      {projects.map(proj => (
                        <option key={proj.id} value={proj.id}>{proj.coupleName} ({proj.id})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Bill Reference / Description</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Purchased 2TB SanDisk, Internet June"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-charcoal-900 border border-luxury-green-800/30 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t border-luxury-green-800/10">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 text-xs text-gray-400"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-gold-500 text-charcoal-950 font-bold text-xs rounded-xl"
                    >
                      Log Bill
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default FinanceView;
