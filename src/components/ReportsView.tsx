import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Sparkles, 
  Briefcase, 
  Building2, 
  UserCheck, 
  Percent,
  TrendingDown,
  Info,
  FileDown
} from 'lucide-react';
import { motion } from 'motion/react';
import { jsPDF } from 'jspdf';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line
} from 'recharts';
import { Project, Studio, Editor, Expense } from '../types';

interface ReportsViewProps {
  projects: Project[];
  studios: Studio[];
  editors: Editor[];
  expenses: Expense[];
}

export default function ReportsView({ projects, studios, editors, expenses }: ReportsViewProps) {
  
  // 1. Calculations - Top Studio
  const studioSalesMap: { [key: string]: { name: string; sales: number } } = {};
  projects.forEach(p => {
    if (!studioSalesMap[p.studioId]) {
      studioSalesMap[p.studioId] = { name: p.studioName, sales: 0 };
    }
    studioSalesMap[p.studioId].sales += p.projectAmount || 0;
  });
  const topStudioEntry = Object.values(studioSalesMap).sort((a, b) => b.sales - a.sales)[0] || { name: 'None', sales: 0 };

  // 2. Calculations - Top Editor
  const editorCompletionMap: { [key: string]: { name: string; count: number } } = {};
  projects.forEach(p => {
    if (p.assignedEditorId && (p.status === 'delivered' || p.status === 'closed')) {
      if (!editorCompletionMap[p.assignedEditorId]) {
        editorCompletionMap[p.assignedEditorId] = { name: p.assignedEditorName || 'Unknown', count: 0 };
      }
      editorCompletionMap[p.assignedEditorId].count += 1;
    }
  });
  const topEditorEntry = Object.values(editorCompletionMap).sort((a, b) => b.count - a.count)[0] || { name: 'None', count: 0 };

  // 3. Calculations - Most Profitable Project
  const projectsWithProfit = projects.map(p => {
    const expensesSum = (p.editorPayment || 0) + (p.otherExpenses || 0);
    const profit = (p.projectAmount || 0) - expensesSum;
    const margin = p.projectAmount > 0 ? (profit / p.projectAmount) * 100 : 0;
    return { ...p, profit, margin };
  }).sort((a, b) => b.profit - a.profit);
  const mostProfitableProj = projectsWithProfit[0];

  // 4. Expense allocation data
  const expenseCategoriesMap: { [key: string]: number } = {};
  expenses.forEach(e => {
    expenseCategoriesMap[e.category] = (expenseCategoriesMap[e.category] || 0) + (e.amount || 0);
  });
  // Also include project-level editor payments & other expenses
  projects.forEach(p => {
    expenseCategoriesMap['freelance_editor'] = (expenseCategoriesMap['freelance_editor'] || 0) + (p.editorPayment || 0);
    expenseCategoriesMap['other'] = (expenseCategoriesMap['other'] || 0) + (p.otherExpenses || 0);
  });

  const expenseAllocationData = Object.entries(expenseCategoriesMap).map(([key, val]) => {
    const formattedLabel = key.replace('_', ' ').toUpperCase();
    return { name: formattedLabel, value: val };
  });

  const PIE_COLORS = ['#1e5546', '#d4af37', '#EF4444', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280'];

  // 5. Margin distribution analysis data
  const profitMarginTrend = projectsWithProfit.slice(0, 5).map(p => ({
    name: p.coupleName.substring(0, 10),
    Profit: p.profit,
    Amount: p.projectAmount
  }));

  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Total financial calculations
      const totalRevenue = projects.reduce((sum, p) => sum + (p.projectAmount || 0), 0);
      const totalEditorExpenses = projects.reduce((sum, p) => sum + (p.editorPayment || 0), 0);
      const totalOtherExpenses = projects.reduce((sum, p) => sum + (p.otherExpenses || 0), 0);
      const totalLedgerExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      const totalExpenses = totalEditorExpenses + totalOtherExpenses + totalLedgerExpenses;
      const totalProfit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

      let currentY = 20;

      // Header Brand
      doc.setFillColor(26, 58, 42); // deep forest green
      doc.rect(0, 0, 210, 38, 'F');

      doc.setTextColor(212, 175, 55); // gold
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('THE FRAME CUT STUDIO', 15, 16);

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('STUDIO OPERATING SYSTEM • EXECUTIVE AUDIT REPORT', 15, 22);

      // Date & Metadata right-aligned
      const reportDate = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
      doc.setFontSize(8);
      doc.setTextColor(200, 200, 200);
      doc.text(`Generated: ${reportDate}`, 195, 16, { align: 'right' });
      doc.text('Auditor Access: Administrator', 195, 22, { align: 'right' });
      doc.text('Database Connection: Firestore Realtime', 195, 28, { align: 'right' });

      currentY = 48;

      // SECTION 1: EXECUTIVE FINANCIAL SUMMARY
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(26, 58, 42);
      doc.text('I. EXECUTIVE FINANCIAL SUMMARY', 15, currentY);
      
      // Draw a line under heading
      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(0.5);
      doc.line(15, currentY + 2, 195, currentY + 2);
      currentY += 8;

      // Draw 4 bento-style cards for financial metrics
      // Box 1: Gross Bookings
      doc.setFillColor(245, 247, 245);
      doc.rect(15, currentY, 85, 22, 'F');
      doc.setDrawColor(230, 235, 230);
      doc.rect(15, currentY, 85, 22, 'S');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 110, 100);
      doc.text('GROSS BOOKINGS (REVENUE)', 19, currentY + 6);
      doc.setFontSize(14);
      doc.setTextColor(26, 58, 42);
      doc.text(`INR ${totalRevenue.toLocaleString('en-IN')}`, 19, currentY + 15);

      // Box 2: Yield Net Profit
      doc.setFillColor(245, 247, 245);
      doc.rect(110, currentY, 85, 22, 'F');
      doc.rect(110, currentY, 85, 22, 'S');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 110, 100);
      doc.text('YIELD NET PROFIT', 114, currentY + 6);
      doc.setFontSize(14);
      doc.setTextColor(184, 149, 48); // gold
      doc.text(`INR ${totalProfit.toLocaleString('en-IN')}`, 114, currentY + 15);

      currentY += 26;

      // Box 3: Total Expenses
      doc.setFillColor(245, 247, 245);
      doc.rect(15, currentY, 85, 22, 'F');
      doc.rect(15, currentY, 85, 22, 'S');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 110, 100);
      doc.text('TOTAL AUDITED EXPENSES', 19, currentY + 6);
      doc.setFontSize(14);
      doc.setTextColor(180, 50, 50); // Red-ish
      doc.text(`INR ${totalExpenses.toLocaleString('en-IN')}`, 19, currentY + 15);

      // Box 4: Margin %
      doc.setFillColor(245, 247, 245);
      doc.rect(110, currentY, 85, 22, 'F');
      doc.rect(110, currentY, 85, 22, 'S');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 110, 100);
      doc.text('NET OPERATING MARGIN', 114, currentY + 6);
      doc.setFontSize(14);
      doc.setTextColor(26, 58, 42);
      doc.text(`${profitMargin.toFixed(1)}%`, 114, currentY + 15);

      currentY += 34;

      // SECTION 2: ALLIANCE PERFORMANCE & OUTCOMES
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(26, 58, 42);
      doc.text('II. ALLIANCE PERFORMANCE & OUTCOMES', 15, currentY);
      
      doc.setDrawColor(212, 175, 55);
      doc.line(15, currentY + 2, 195, currentY + 2);
      currentY += 8;

      // Top Allied Studio details
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(34, 34, 34);
      doc.text('TOP ALLIED STUDIO PARTNER:', 15, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(`${topStudioEntry.name} (INR ${topStudioEntry.sales.toLocaleString('en-IN')} cumulative contract value)`, 75, currentY);
      currentY += 6;

      // Top Editor
      doc.setFont('helvetica', 'bold');
      doc.text('TOP PRODUCTIVE TEAM EDITOR:', 15, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(`${topEditorEntry.name} (${topEditorEntry.count} completed wedding films delivered)`, 75, currentY);
      currentY += 6;

      // Lucrative Campaign
      doc.setFont('helvetica', 'bold');
      doc.text('MOST LUCRATIVE WEDDING:', 15, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(mostProfitableProj ? `${mostProfitableProj.coupleName} (Net Profit: INR ${mostProfitableProj.profit.toLocaleString('en-IN')}, Margin: ${mostProfitableProj.margin.toFixed(0)}%)` : 'None', 75, currentY);
      
      currentY += 14;

      // SECTION 3: OPERATING EXPENSE BREAKDOWN
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(26, 58, 42);
      doc.text('III. OPERATING EXPENSE ALLOCATION BREAKDOWN', 15, currentY);
      doc.setDrawColor(212, 175, 55);
      doc.line(15, currentY + 2, 195, currentY + 2);
      currentY += 8;

      // Table Header for Expenses
      doc.setFillColor(240, 243, 240);
      doc.rect(15, currentY, 180, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(26, 58, 42);
      doc.text('EXPENSE CATEGORY (DESCRIPTION)', 20, currentY + 4.5);
      doc.text('CUMULATIVE CHARGED AMOUNT (INR)', 190, currentY + 4.5, { align: 'right' });
      currentY += 7;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(8.5);

      expenseAllocationData.forEach((item, index) => {
        // Draw alternate rows
        if (index % 2 === 1) {
          doc.setFillColor(250, 251, 250);
          doc.rect(15, currentY, 180, 6, 'F');
        }
        doc.text(item.name, 20, currentY + 4.2);
        doc.text(`INR ${item.value.toLocaleString('en-IN')}`, 190, currentY + 4.2, { align: 'right' });
        currentY += 6;
      });

      currentY += 10;

      // SECTION 4: DETAILED CAMPAIGN AUDITS (TABLE)
      if (currentY > 180) {
        doc.addPage();
        currentY = 20;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text('THE FRAME CUT STUDIO — SYSTEM REPORT (CONTINUED)', 15, 12);
        doc.setDrawColor(220, 220, 220);
        doc.line(15, 14, 195, 14);
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(26, 58, 42);
      doc.text('IV. INDIVIDUAL CONTRACT MARGIN AUDIT SHEET', 15, currentY);
      doc.setDrawColor(212, 175, 55);
      doc.line(15, currentY + 2, 195, currentY + 2);
      currentY += 8;

      // Table Header for Projects Audit
      doc.setFillColor(26, 58, 42);
      doc.rect(15, currentY, 180, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text('PROJECT ID', 18, currentY + 5.5);
      doc.text('WEDDING CAMPAIGN (STUDIO)', 42, currentY + 5.5);
      doc.text('CONTRACT', 105, currentY + 5.5, { align: 'right' });
      doc.text('PAYOUTS', 135, currentY + 5.5, { align: 'right' });
      doc.text('NET PROFIT', 165, currentY + 5.5, { align: 'right' });
      doc.text('MARGIN %', 190, currentY + 5.5, { align: 'right' });
      currentY += 8;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(34, 34, 34);

      projectsWithProfit.forEach((proj, idx) => {
        // Page break logic for each row
        if (currentY > 275) {
          doc.addPage();
          currentY = 20;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(120, 120, 120);
          doc.text('THE FRAME CUT STUDIO — MARGIN AUDIT SHEET (CONTINUED)', 15, 12);
          doc.setDrawColor(220, 220, 220);
          doc.line(15, 14, 195, 14);
          currentY = 25;

          // Re-draw table header on new page
          doc.setFillColor(26, 58, 42);
          doc.rect(15, currentY, 180, 8, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(255, 255, 255);
          doc.text('PROJECT ID', 18, currentY + 5.5);
          doc.text('WEDDING CAMPAIGN (STUDIO)', 42, currentY + 5.5);
          doc.text('CONTRACT', 105, currentY + 5.5, { align: 'right' });
          doc.text('PAYOUTS', 135, currentY + 5.5, { align: 'right' });
          doc.text('NET PROFIT', 165, currentY + 5.5, { align: 'right' });
          doc.text('MARGIN %', 190, currentY + 5.5, { align: 'right' });
          currentY += 8;
        }

        // Row background
        if (idx % 2 === 1) {
          doc.setFillColor(248, 250, 248);
          doc.rect(15, currentY, 180, 7.5, 'F');
        } else {
          doc.setFillColor(255, 255, 255);
          doc.rect(15, currentY, 180, 7.5, 'F');
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(184, 149, 48); // Gold for ID
        doc.text(proj.id, 18, currentY + 5);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(34, 34, 34);
        doc.text(proj.coupleName, 42, currentY + 3.8);
        doc.setFontSize(6.5);
        doc.setTextColor(120, 120, 120);
        doc.text(proj.studioName, 42, currentY + 6.5);

        doc.setFontSize(7.5);
        doc.setTextColor(34, 34, 34);
        doc.text(`INR ${proj.projectAmount.toLocaleString('en-IN')}`, 105, currentY + 5, { align: 'right' });
        const expensesSum = proj.editorPayment + proj.otherExpenses;
        doc.text(`INR ${expensesSum.toLocaleString('en-IN')}`, 135, currentY + 5, { align: 'right' });
        
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(26, 58, 42); // deep green
        doc.text(`INR ${proj.profit.toLocaleString('en-IN')}`, 165, currentY + 5, { align: 'right' });
        
        doc.setTextColor(184, 149, 48); // Gold margin
        doc.text(`${proj.margin.toFixed(1)}%`, 190, currentY + 5, { align: 'right' });

        currentY += 7.5;
      });

      // Footer
      if (currentY > 270) {
        doc.addPage();
        currentY = 20;
      }
      currentY += 10;
      doc.setDrawColor(220, 220, 220);
      doc.line(15, currentY, 195, currentY);
      currentY += 6;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text('This is a computer-generated luxury management accounting audit sheet. Confirmed via Studio OS Secure Database.', 15, currentY);
      doc.text('THE FRAME CUT STUDIO © 2026. ALL RIGHTS RESERVED.', 195, currentY, { align: 'right' });

      // Save PDF
      doc.save(`The_Frame_Cut_Studio_Operating_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-white">System Reports & Margin Audits</h2>
          <p className="text-xs text-gray-400 mt-1">Durable financial ledgers, studio conversions, and editor volumes</p>
        </div>
        <button
          onClick={handleDownloadPDF}
          disabled={isGenerating}
          className="px-4 py-2.5 bg-gradient-to-r from-luxury-green-800 to-luxury-green-900 hover:from-luxury-green-700 hover:to-luxury-green-800 border border-gold-500/30 text-gold-400 hover:text-gold-300 font-mono text-xs font-semibold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-black/20"
        >
          <FileDown className="w-4 h-4" />
          {isGenerating ? 'GENERATING PDF...' : 'DOWNLOAD PDF REPORT'}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Top Studio card */}
        <div className="p-6 rounded-3xl glass-panel relative overflow-hidden flex flex-col justify-between h-40">
          <div className="absolute top-0 right-0 w-24 h-24 bg-luxury-green-800/10 rounded-full blur-xl" />
          <div className="flex justify-between items-start">
            <span className="text-gray-400 text-xs font-mono uppercase">Top Allied Studio</span>
            <div className="p-2 bg-luxury-green-950 rounded-xl">
              <Building2 className="w-4 h-4 text-gold-400" />
            </div>
          </div>
          <div>
            <h4 className="text-lg font-bold text-white font-display leading-tight">{topStudioEntry.name}</h4>
            <p className="text-[10px] text-gold-400 font-mono mt-1">₹{topStudioEntry.sales.toLocaleString('en-IN')} Cumulative volume</p>
          </div>
        </div>

        {/* Top Editor card */}
        <div className="p-6 rounded-3xl glass-panel relative overflow-hidden flex flex-col justify-between h-40">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gold-500/5 rounded-full blur-xl" />
          <div className="flex justify-between items-start">
            <span className="text-gray-400 text-xs font-mono uppercase">Top Productive Editor</span>
            <div className="p-2 bg-charcoal-900 rounded-xl">
              <UserCheck className="w-4 h-4 text-gold-400" />
            </div>
          </div>
          <div>
            <h4 className="text-lg font-bold text-white font-display leading-tight">{topEditorEntry.name}</h4>
            <p className="text-[10px] text-gray-400 font-mono mt-1">{topEditorEntry.count} wedding films delivered</p>
          </div>
        </div>

        {/* Most Profitable wedding card */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-luxury-green-950/40 to-charcoal-900 border border-gold-500/30 relative overflow-hidden flex flex-col justify-between h-40 gold-glow">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gold-500/10 rounded-full blur-xl" />
          <div className="flex justify-between items-start">
            <span className="text-gold-300 text-xs font-mono uppercase">Most Lucrative Engagement</span>
            <div className="p-2 bg-gold-500/10 rounded-xl">
              <Sparkles className="w-4 h-4 text-gold-400" />
            </div>
          </div>
          <div>
            <h4 className="text-lg font-bold text-white font-display leading-tight truncate">
              {mostProfitableProj ? mostProfitableProj.coupleName : 'None'}
            </h4>
            <p className="text-[10px] text-gold-400 font-mono mt-1">
              ₹{mostProfitableProj ? mostProfitableProj.profit.toLocaleString('en-IN') : 0} Margin ({mostProfitableProj ? mostProfitableProj.margin.toFixed(0) : 0}%)
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Charts block */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Margin Distribution chart */}
        <div className="p-6 rounded-3xl glass-panel relative">
          <div>
            <h3 className="text-lg font-bold font-display text-white">Profit margins per campaign</h3>
            <p className="text-xs text-gray-400 mb-6">Contract gross values versus company profit cuts</p>
          </div>

          <div className="h-72">
            {profitMarginTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={profitMarginTrend}>
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
                  <Line type="monotone" dataKey="Amount" stroke="#1e5546" strokeWidth={3} activeDot={{ r: 8 }} name="Contract value" />
                  <Line type="monotone" dataKey="Profit" stroke="#d4af37" strokeWidth={3} name="Operating Profit" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 font-mono text-xs">No project margin history log.</div>
            )}
          </div>
        </div>

        {/* Expense categories allocation pie chart */}
        <div className="p-6 rounded-3xl glass-panel relative">
          <div>
            <h3 className="text-lg font-bold font-display text-white">Operating expense allocations</h3>
            <p className="text-xs text-gray-400 mb-6">Category shares including freelance payouts & offices</p>
          </div>

          <div className="h-72 flex flex-col md:flex-row items-center justify-between">
            <div className="w-full md:w-1/2 h-full">
              {expenseAllocationData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseAllocationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {expenseAllocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#11141a', 
                        border: '1px solid rgba(212, 175, 55, 0.3)',
                        borderRadius: '12px'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 font-mono text-xs">No recorded expense ledger.</div>
              )}
            </div>

            <div className="w-full md:w-1/2 space-y-2 mt-4 md:mt-0 font-mono text-[11px] text-gray-400 max-h-[220px] overflow-y-auto">
              {expenseAllocationData.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center pr-4">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                    <span className="truncate max-w-[120px]">{item.name}</span>
                  </div>
                  <span className="text-gray-200 font-bold">₹{item.value.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed campaign audits list */}
      <div className="p-6 rounded-3xl glass-panel">
        <div>
          <h3 className="text-lg font-bold font-display text-white">Engagement Margin Audit Sheet</h3>
          <p className="text-xs text-gray-400 mb-6">Individual contract accounting audits for tax seasons</p>
        </div>

        <div className="rounded-2xl border border-luxury-green-800/10 overflow-hidden bg-charcoal-950/20 text-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-charcoal-900 text-gray-400 font-mono text-[10px] uppercase border-b border-luxury-green-800/20">
                  <th className="p-4">Project ID</th>
                  <th className="p-4">Wedding Campaign</th>
                  <th className="p-4">Contract Price</th>
                  <th className="p-4">Assigned Payouts</th>
                  <th className="p-4">Net Season Profits</th>
                  <th className="p-4 pr-6 text-right">Net Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-luxury-green-800/10 font-sans text-gray-300">
                {projectsWithProfit.map((proj) => {
                  const expensesSum = proj.editorPayment + proj.otherExpenses;
                  return (
                    <tr key={proj.id} className="hover:bg-luxury-green-950/10">
                      <td className="p-4 font-mono text-gold-500 text-xs">{proj.id}</td>
                      <td className="p-4">
                        <span className="font-bold text-gray-200 block">{proj.coupleName}</span>
                        <span className="text-[10px] text-gray-400 font-mono">{proj.studioName}</span>
                      </td>
                      <td className="p-4 font-mono">₹{proj.projectAmount.toLocaleString('en-IN')}</td>
                      <td className="p-4 font-mono text-red-400">₹{expensesSum.toLocaleString('en-IN')}</td>
                      <td className="p-4 font-mono text-emerald-400 font-bold">₹{proj.profit.toLocaleString('en-IN')}</td>
                      <td className="p-4 pr-6 text-right font-mono font-bold text-gold-400">{proj.margin.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
