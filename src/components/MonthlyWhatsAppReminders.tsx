import React, { useState, useMemo, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { 
  MessageSquare, 
  Calendar, 
  Send, 
  Copy, 
  Check, 
  AlertCircle, 
  Settings, 
  CheckCircle2, 
  DollarSign, 
  Sparkles, 
  Phone, 
  Users, 
  ExternalLink, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  Zap, 
  HelpCircle,
  Clock,
  CheckCheck,
  Building2,
  Film,
  FileText,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Project, Studio, Editor, PaymentHistory } from '../types';

interface MonthlyWhatsAppRemindersProps {
  projects: Project[];
  studios: Studio[];
  editors: Editor[];
  payments?: PaymentHistory[];
}

export default function MonthlyWhatsAppReminders({
  projects,
  studios,
  editors,
  payments = []
}: MonthlyWhatsAppRemindersProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sentIds, setSentIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'studios' | 'editors'>('studios');
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [autoSchedulerEnabled, setAutoSchedulerEnabled] = useState(true);

  // Template customizers stored in local state (with defaults)
  const [studioMsgTemplate, setStudioMsgTemplate] = useState<string>(
    () => localStorage.getItem('tfc_studio_wa_template') || 
    `*THE FRAME CUT STUDIO - OFFICIAL FINAL TAX INVOICE* 📄\n\nDear {STUDIO_NAME} Team,\n\nAttached is your official Final Tax Invoice for the 5th-Monthly Billing cycle ({MONTH}).\n\n📌 Invoice Ref: *OFFICIAL FINAL TAX INVOICE*\n📌 Net Total Payable: *₹{AMOUNT}*\n📌 Active Projects: {PROJECT_COUNT}\n\n*Project Breakdown:*\n{PROJECT_LIST}\n\n📎 *ATTACHED FILE:* Official Final Tax Invoice PDF Document\n\n*BANK DETAILS FOR PAYMENT:*\n• A/C Holder: The Frame Cut Studio\n• Bank: HDFC Bank | A/C: 501002345678 | IFSC: HDFC0001234\n• UPI ID: framecut@upi\n\nKindly review the attached Final Tax Invoice PDF and settle the pending dues.\nThank you for choosing The Frame Cut Studio!`
  );

  const [editorMsgTemplate, setEditorMsgTemplate] = useState<string>(
    () => localStorage.getItem('tfc_editor_wa_template') || 
    `*THE FRAME CUT STUDIO - EDITOR PAYOUT STATEMENT* 🎞️\n\nHi {EDITOR_NAME},\n\nThis is your monthly payout status update for the 5th of the month cycle.\n\n📌 Outstanding Wage Dues: *₹{AMOUNT}*\n📌 Assigned Projects: {PROJECT_COUNT}\n\nOur accounts team is processing pending clearances. Thank you for your hard work!`
  );

  // Save templates on change
  useEffect(() => {
    localStorage.setItem('tfc_studio_wa_template', studioMsgTemplate);
  }, [studioMsgTemplate]);

  useEffect(() => {
    localStorage.setItem('tfc_editor_wa_template', editorMsgTemplate);
  }, [editorMsgTemplate]);

  // Current Date logic & 5th of month calculation
  const today = new Date();
  const currentDay = today.getDate();
  const monthName = today.toLocaleString('default', { month: 'long' });
  const year = today.getFullYear();

  // Is today around the 5th? (e.g. 1st to 10th of month)
  const isFifthCycleActive = currentDay >= 1 && currentDay <= 10;

  // Next 5th date string
  const nextFifthDate = useMemo(() => {
    const target = new Date(today.getFullYear(), today.getMonth(), 5);
    if (today.getDate() > 5) {
      target.setMonth(target.getMonth() + 1);
    }
    return target.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }, [today]);

  // Consolidated Studio Balances (Studios with pending balances across projects)
  const studioBalances = useMemo(() => {
    return studios.map(studio => {
      const studioProjects = projects.filter(p => p.studioId === studio.id);
      const totalAmount = studioProjects.reduce((sum, p) => sum + (p.projectAmount || 0), 0);
      const paidAmount = studioProjects.reduce((sum, p) => sum + (p.advancePayment || 0), 0);
      const pendingAmount = studioProjects.reduce((sum, p) => sum + (p.remainingBalance || 0), 0);

      return {
        studio,
        projectCount: studioProjects.length,
        totalAmount,
        paidAmount,
        pendingAmount,
        phone: studio.phone || ''
      };
    }).filter(item => item.pendingAmount > 0)
      .sort((a, b) => b.pendingAmount - a.pendingAmount);
  }, [studios, projects]);

  // Consolidated Editor Wage Balances
  const editorBalances = useMemo(() => {
    return editors.map(editor => {
      const editorProjects = projects.filter(p => p.assignedEditorId === editor.id);
      const totalBudget = editorProjects.reduce((sum, p) => sum + (p.editorPayment || 0), 0);
      
      // Calculate paid from payments ledger
      const paidLedger = payments
        .filter(pay => pay.entityId === editor.id && pay.entityType === 'editor')
        .reduce((sum, pay) => sum + pay.amount, 0);

      const pendingAmount = Math.max(0, totalBudget - paidLedger);

      return {
        editor,
        projectCount: editorProjects.length,
        totalBudget,
        paidAmount: paidLedger,
        pendingAmount,
        phone: editor.phone || ''
      };
    }).filter(item => item.pendingAmount > 0)
      .sort((a, b) => b.pendingAmount - a.pendingAmount);
  }, [editors, projects, payments]);

  // Custom phone number overrides stored locally
  const [phoneOverrides, setPhoneOverrides] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem('tfc_wa_phone_overrides') || '{}');
    } catch {
      return {};
    }
  });

  const [editingPhoneId, setEditingPhoneId] = useState<string | null>(null);
  const [tempPhoneInput, setTempPhoneInput] = useState('');

  const handleSavePhone = (id: string) => {
    const updated = { ...phoneOverrides, [id]: tempPhoneInput };
    setPhoneOverrides(updated);
    localStorage.setItem('tfc_wa_phone_overrides', JSON.stringify(updated));
    setEditingPhoneId(null);
  };

  // Generate WhatsApp message for studio with itemized project breakdown
  const generateStudioMessage = (item: typeof studioBalances[0]) => {
    const studioProjects = projects.filter(p => p.studioId === item.studio.id && (p.remainingBalance || 0) > 0);
    const projectListText = studioProjects.map(p => `• ${p.coupleName} (${p.eventType || 'Wedding'}): ₹${(p.remainingBalance || 0).toLocaleString('en-IN')}`).join('\n');

    return studioMsgTemplate
      .replace(/{STUDIO_NAME}/g, item.studio.name)
      .replace(/{AMOUNT}/g, item.pendingAmount.toLocaleString('en-IN'))
      .replace(/{PROJECT_COUNT}/g, item.projectCount.toString())
      .replace(/{PROJECT_LIST}/g, projectListText || 'All projects')
      .replace(/{MONTH}/g, monthName);
  };

  // Generate WhatsApp message for editor with itemized project breakdown
  const generateEditorMessage = (item: typeof editorBalances[0]) => {
    const editorProjects = projects.filter(p => p.assignedEditorId === item.editor.id);
    const projectListText = editorProjects.map(p => `• ${p.coupleName} (${p.eventType || 'Wedding'}): ₹${(p.editorPayment || 0).toLocaleString('en-IN')}`).join('\n');

    return editorMsgTemplate
      .replace(/{EDITOR_NAME}/g, item.editor.name)
      .replace(/{AMOUNT}/g, item.pendingAmount.toLocaleString('en-IN'))
      .replace(/{PROJECT_COUNT}/g, item.projectCount.toString())
      .replace(/{PROJECT_LIST}/g, projectListText || 'Assigned deliverables')
      .replace(/{MONTH}/g, monthName);
  };

  // Dispatch WhatsApp link open
  const handleOpenWhatsApp = (phone: string, text: string, id: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const encoded = encodeURIComponent(text);
    const link = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://api.whatsapp.com/send?text=${encoded}`;
    
    window.open(link, '_blank');
    if (!sentIds.includes(id)) {
      setSentIds(prev => [...prev, id]);
    }
  };

  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);

  const generateStatementPDF = (
    clientName: string,
    phone: string,
    pendingAmount: number,
    projectItems: { coupleName: string; eventType: string; amount: number }[],
    type: 'studio' | 'editor'
  ) => {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const isStudio = type === 'studio';
    const cleanClientCode = clientName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4) || 'STUDIO';
    const invoiceNoStr = `INV-5TH-${new Date().getFullYear()}-${monthName.toUpperCase().slice(0, 3)}-${cleanClientCode}`;

    // Modern Dark Header Banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 42, 'F');
    
    // Brand Name & Subtitle
    doc.setTextColor(245, 158, 11); // Amber-500
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('THE FRAME CUT STUDIO', 14, 16);
    
    doc.setTextColor(226, 232, 240); // Slate-200
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text('CINEMATIC WEDDING SUITE & POST PRODUCTION MANAGEMENT', 14, 22);
    doc.text('Email: contact@theframecuts.com | Phone: +91 77729 99933', 14, 27);
    doc.text(`Monthly Billing Cycle: 5th ${monthName} Automated Settlement`, 14, 32);

    // Official Badge Pill Right
    doc.setFillColor(245, 158, 11); // Amber
    doc.roundedRect(125, 8, 72, 26, 3, 3, 'F');

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.text(isStudio ? 'OFFICIAL FINAL TAX INVOICE' : 'EDITOR PAYOUT STATEMENT', 161, 15, { align: 'center' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`Ref #: ${invoiceNoStr}`, 161, 21, { align: 'center' });
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, 161, 26, { align: 'center' });
    doc.text(`Cycle: 5th ${monthName} ${year}`, 161, 30, { align: 'center' });
    
    let y = 48;

    // Client/Billed To Box & Issuer Box
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, y, 88, 28, 2, 2, 'FD');
    doc.roundedRect(108, y, 88, 28, 2, 2, 'FD');

    // Left - Bill To
    doc.setTextColor(217, 119, 6);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(isStudio ? 'FINAL TAX INVOICE TO:' : 'PAYOUT RECIPIENT:', 18, y + 6);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(clientName, 18, y + 12);

    doc.setTextColor(71, 85, 105);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Contact Phone: ${phone || 'N/A'}`, 18, y + 18);
    doc.text(`Billing Status: 5th Monthly Cycle Clearance`, 18, y + 23);

    // Right - Issued By
    doc.setTextColor(4, 120, 87);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('ISSUED BY & ACCOUNTS:', 112, y + 6);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('The Frame Cut Studio', 112, y + 12);

    doc.setTextColor(71, 85, 105);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Accounts & Billing Department', 112, y + 18);
    doc.text('GST / Tax Compliant Studio Invoice', 112, y + 23);

    y += 34;
    
    // Table Header
    doc.setFillColor(15, 23, 42);
    doc.rect(14, y, 182, 8, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('#', 18, y + 5.5);
    doc.text('Project / Film Couple Name', 28, y + 5.5);
    doc.text('Event Type / Service', 115, y + 5.5);
    doc.text('Net Balance Due (Rs.)', 190, y + 5.5, { align: 'right' });
    
    y += 10;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    
    projectItems.forEach((item, idx) => {
      if (idx % 2 === 0) {
        doc.setFillColor(241, 245, 249);
        doc.rect(14, y - 4, 182, 8, 'F');
      }
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`${idx + 1}`, 18, y + 1);
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(item.coupleName.substring(0, 38), 28, y + 1);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(item.eventType.substring(0, 22), 115, y + 1);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(217, 119, 6);
      doc.text(`Rs. ${item.amount.toLocaleString('en-IN')}`, 190, y + 1, { align: 'right' });
      y += 8;
    });

    y += 4;

    // Financial Summary & Bank Details Section
    if (isStudio) {
      // Left Bank Details
      doc.setFillColor(254, 243, 199);
      doc.setDrawColor(252, 211, 77);
      doc.roundedRect(14, y, 92, 40, 2, 2, 'FD');

      doc.setTextColor(120, 53, 15);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('BANK & UPI SETTLEMENT DETAILS:', 18, y + 6);

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.text('Account Holder: The Frame Cut Studio', 18, y + 12);
      doc.text('Bank Name: HDFC Bank', 18, y + 17);
      doc.text('A/C Number: 501002345678', 18, y + 22);
      doc.text('IFSC Code: HDFC0001234', 18, y + 27);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(180, 83, 9);
      doc.text('UPI ID: framecut@upi', 18, y + 33);

      // Right Grand Total Pill
      doc.setFillColor(15, 23, 42);
      doc.roundedRect(110, y, 86, 40, 2, 2, 'F');

      doc.setTextColor(226, 232, 240);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Itemized Projects Count:', 116, y + 8);
      doc.text(`${projectItems.length} Project(s)`, 190, y + 8, { align: 'right' });

      doc.text('5th-Monthly Billing Cycle:', 116, y + 14);
      doc.text(`${monthName} ${year}`, 190, y + 14, { align: 'right' });

      // Highlighted Total Pill
      doc.setFillColor(245, 158, 11);
      doc.roundedRect(114, y + 20, 78, 14, 2, 2, 'F');

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('FINAL NET PAYABLE DUE:', 118, y + 26);
      doc.setFontSize(11);
      doc.text(`Rs. ${pendingAmount.toLocaleString('en-IN')}`, 188, y + 31, { align: 'right' });

      y += 48;
    } else {
      // Editor Payout Summary
      doc.setFillColor(15, 23, 42);
      doc.roundedRect(110, y, 86, 28, 2, 2, 'F');

      doc.setTextColor(226, 232, 240);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Total Editor Deliverables:', 116, y + 8);
      doc.text(`${projectItems.length} Project(s)`, 190, y + 8, { align: 'right' });

      doc.setFillColor(16, 185, 129);
      doc.roundedRect(114, y + 12, 78, 12, 2, 2, 'F');

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('NET EDITOR WAGE DUE:', 118, y + 20);
      doc.setFontSize(10.5);
      doc.text(`Rs. ${pendingAmount.toLocaleString('en-IN')}`, 188, y + 20, { align: 'right' });

      y += 36;
    }

    // Footer
    doc.setDrawColor(226, 232, 240);
    doc.line(14, y, 196, y);
    y += 6;

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Note: This document serves as the Official Final Tax Invoice for the 5th-monthly automated billing cycle.', 14, y);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Authorized Signatory — The Frame Cut Studio', 196, y, { align: 'right' });

    return doc;
  };

  const handleSendWhatsAppWithPDF = async (
    id: string,
    phone: string,
    text: string,
    clientName: string,
    pendingAmount: number,
    projectItems: { coupleName: string; eventType: string; amount: number }[],
    type: 'studio' | 'editor'
  ) => {
    setGeneratingPdfId(id);
    try {
      const cleanName = clientName.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = type === 'studio' 
        ? `Final_Tax_Invoice_${cleanName}_${monthName}.pdf`
        : `Final_Payout_Invoice_${cleanName}_${monthName}.pdf`;

      const doc = generateStatementPDF(clientName, phone, pendingAmount, projectItems, type);
      
      const pdfBlob = doc.output('blob');
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
      
      // Save/download PDF file automatically
      doc.save(fileName);

      const cleanPhone = phone.replace(/\D/g, '');

      // Try Native Web Share API (Mobile direct share with attachment)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: `Final Tax Invoice - ${clientName}`,
            text: text,
            files: [file]
          });
          if (!sentIds.includes(id)) setSentIds(prev => [...prev, id]);
          return;
        } catch (shareErr: any) {
          if (shareErr.name === 'AbortError') return;
          console.warn('Native share fallback to browser link:', shareErr);
        }
      }

      // Desktop WhatsApp link fallback with pre-filled message + downloaded PDF prompt
      const textWithNotice = text + `\n\n📎 *Official Final Tax Invoice PDF (${fileName}) saved in your downloads folder. Please attach it in this WhatsApp chat.*`;
      const encoded = encodeURIComponent(textWithNotice);
      const link = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://api.whatsapp.com/send?text=${encoded}`;
      
      window.open(link, '_blank');
      if (!sentIds.includes(id)) {
        setSentIds(prev => [...prev, id]);
      }
    } catch (err) {
      console.error('Error generating PDF reminder:', err);
      handleOpenWhatsApp(phone, text, id);
    } finally {
      setGeneratingPdfId(null);
    }
  };

  // Copy message to clipboard
  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Dispatch all pending WhatsApp messages sequentially
  const handleDispatchAll = () => {
    const targetList = activeTab === 'studios' ? studioBalances : editorBalances;
    targetList.forEach((item, idx) => {
      const id = activeTab === 'studios' ? (item as any).studio.id : (item as any).editor.id;
      const text = activeTab === 'studios' ? generateStudioMessage(item as any) : generateEditorMessage(item as any);
      
      // Stagger tab opening slightly to prevent pop-up blocker issues
      setTimeout(() => {
        handleOpenWhatsApp(item.phone, text, id);
      }, idx * 1200);
    });
  };

  const totalStudioPending = studioBalances.reduce((sum, item) => sum + item.pendingAmount, 0);
  const totalEditorPending = editorBalances.reduce((sum, item) => sum + item.pendingAmount, 0);

  return (
    <div id="whatsapp-reminders-section" className="glass-panel p-6 md:p-8 rounded-3xl border border-gold-500/20 space-y-6 shadow-2xl relative overflow-hidden my-8">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <MessageSquare className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold font-display text-white tracking-tight">
              Automated 5th-Monthly WhatsApp Billing & Reminders
            </h2>
          </div>
          <p className="text-xs text-gray-400 font-mono mt-1">
            Har mahine ki 5 tarikh ko automatic studio dues & editor payout reminders WhatsApp par bhejein.
          </p>
        </div>

        {/* 5th Cycle Status Badge */}
        <div className="flex flex-wrap items-center gap-3">
          <div className={`px-4 py-2 rounded-2xl border flex items-center gap-2 text-xs font-mono ${
            isFifthCycleActive 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}>
            <Calendar className="w-4 h-4 text-gold-400" />
            <div>
              <span className="font-bold block uppercase text-[10px] text-gray-400">Monthly Billing Cycle</span>
              <span className="font-bold">
                {isFifthCycleActive ? `5th ${monthName} Cycle Active` : `Next Cycle: ${nextFifthDate}`}
              </span>
            </div>
          </div>

          <button
            onClick={() => setAutoSchedulerEnabled(!autoSchedulerEnabled)}
            className={`px-3 py-2 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
              autoSchedulerEnabled 
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' 
                : 'bg-charcoal-800 border-white/10 text-gray-400'
            }`}
            title="Toggle automatic 5th of month notification alerts"
          >
            <Zap className={`w-3.5 h-3.5 ${autoSchedulerEnabled ? 'text-emerald-400 animate-pulse' : 'text-gray-500'}`} />
            <span>Auto 5th Alert: {autoSchedulerEnabled ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>



      {/* Final Tax Invoice Clarification Banner */}
      <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-xs font-mono text-emerald-300 shadow-md">
        <FileText className="w-5 h-5 text-emerald-400 shrink-0" />
        <div>
          <span className="font-bold text-amber-400 uppercase tracking-wide block text-[11px] mb-0.5">
            📄 Official Final Tax Invoice Document
          </span>
          <span>
            Automated 5th-Monthly WhatsApp me jo PDF attach / download hogi, wo studio billing ka <strong>OFFICIAL FINAL TAX INVOICE</strong> hi hoga (Complete itemized breakdown, invoice reference number & bank/UPI payment credentials ke saath).
          </span>
        </div>
      </div>

      {/* Tabs & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Entity Switcher */}
        <div className="flex items-center gap-2 p-1.5 bg-charcoal-950/80 rounded-2xl border border-white/10">
          <button
            onClick={() => setActiveTab('studios')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'studios'
                ? 'bg-gold-500/20 border border-gold-500/40 text-gold-300 shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Studio Unpaid Dues ({studioBalances.length})</span>
            {totalStudioPending > 0 && (
              <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">
                ₹{totalStudioPending.toLocaleString('en-IN')}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('editors')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'editors'
                ? 'bg-gold-500/20 border border-gold-500/40 text-gold-300 shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Editor Wage Balances ({editorBalances.length})</span>
            {totalEditorPending > 0 && (
              <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">
                ₹{totalEditorPending.toLocaleString('en-IN')}
              </span>
            )}
          </button>
        </div>

        {/* Dispatch Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTemplateEditor(!showTemplateEditor)}
            className="px-3.5 py-2 bg-charcoal-800 hover:bg-charcoal-700 border border-white/10 text-gray-300 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-gold-400" />
            <span>Customize Message</span>
          </button>

          {((activeTab === 'studios' && studioBalances.length > 0) || (activeTab === 'editors' && editorBalances.length > 0)) && (
            <button
              onClick={handleDispatchAll}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 font-bold rounded-xl text-xs font-mono flex items-center gap-2 shadow-lg hover:scale-105 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send All {activeTab === 'studios' ? 'Studio' : 'Editor'} Reminders</span>
            </button>
          )}
        </div>
      </div>

      {/* Template Customizer Drawer */}
      <AnimatePresence>
        {showTemplateEditor && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="p-5 bg-charcoal-950/90 rounded-2xl border border-gold-500/30 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h4 className="text-sm font-bold text-gold-400 font-display flex items-center gap-2">
                <Settings className="w-4 h-4" /> Edit WhatsApp Message Template
              </h4>
              <span className="text-[10px] text-gray-400 font-mono">
                Variables available: {'{STUDIO_NAME}'}, {'{EDITOR_NAME}'}, {'{AMOUNT}'}, {'{PROJECT_COUNT}'}, {'{MONTH}'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <label className="text-gray-300 block mb-1 font-bold">Studio Statement Template:</label>
                <textarea
                  rows={6}
                  value={studioMsgTemplate}
                  onChange={(e) => setStudioMsgTemplate(e.target.value)}
                  className="w-full bg-charcoal-900 border border-white/10 rounded-xl p-3 text-gray-200 focus:outline-none focus:border-gold-500"
                />
              </div>

              <div>
                <label className="text-gray-300 block mb-1 font-bold">Editor Payout Template:</label>
                <textarea
                  rows={6}
                  value={editorMsgTemplate}
                  onChange={(e) => setEditorMsgTemplate(e.target.value)}
                  className="w-full bg-charcoal-900 border border-white/10 rounded-xl p-3 text-gray-200 focus:outline-none focus:border-gold-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowTemplateEditor(false)}
                className="px-4 py-1.5 bg-gold-500 hover:bg-gold-400 text-charcoal-950 font-bold rounded-xl text-xs font-mono"
              >
                Save & Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main List */}
      <div className="space-y-3">
        {activeTab === 'studios' ? (
          studioBalances.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {studioBalances.map((item) => {
                const messageText = generateStudioMessage(item);
                const isSent = sentIds.includes(item.studio.id);
                const effectivePhone = phoneOverrides[item.studio.id] || item.phone;

                return (
                  <div 
                    key={item.studio.id}
                    className="p-4 bg-charcoal-950/70 rounded-2xl border border-white/10 flex flex-col justify-between space-y-3 hover:border-emerald-500/40 transition-all group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-sm font-bold text-white font-display">{item.studio.name}</h4>
                            {isSent && (
                              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-0.5 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                <CheckCheck className="w-3 h-3" /> Sent
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 font-mono mt-0.5 flex items-center gap-2 flex-wrap">
                            <span>Owner: {item.studio.ownerName || 'N/A'}</span>
                            {editingPhoneId === item.studio.id ? (
                              <div className="flex items-center gap-1 mt-1">
                                <input
                                  type="text"
                                  placeholder="WhatsApp Phone Number"
                                  value={tempPhoneInput}
                                  onChange={(e) => setTempPhoneInput(e.target.value)}
                                  className="px-2 py-0.5 text-xs bg-charcoal-900 border border-emerald-500/50 rounded text-white focus:outline-none"
                                />
                                <button
                                  onClick={() => handleSavePhone(item.studio.id)}
                                  className="px-2 py-0.5 bg-emerald-500 text-slate-950 font-bold rounded text-[10px]"
                                >
                                  Save
                                </button>
                              </div>
                            ) : (
                              <span 
                                onClick={() => { setEditingPhoneId(item.studio.id); setTempPhoneInput(effectivePhone); }}
                                className="text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                                title="Click to edit phone number for WhatsApp"
                              >
                                <Phone className="w-3 h-3" /> {effectivePhone || 'Add Phone +'}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-base font-extrabold font-mono text-amber-400">
                            ₹{item.pendingAmount.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] font-mono text-gray-400 block">
                            {item.projectCount} Pending Project(s)
                          </span>
                        </div>
                      </div>

                      {/* Message Preview */}
                      <div className="mt-3 p-2.5 bg-black/50 rounded-xl border border-white/5 text-[11px] font-mono text-gray-300 max-h-28 overflow-y-auto whitespace-pre-line">
                        {messageText}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-between border-t border-white/5 pt-3">
                      <span className="text-[10px] font-mono text-emerald-400/80 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-emerald-400" /> Semi-Automatic (1-Click)
                      </span>

                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        <button
                          onClick={() => handleCopyText(messageText, item.studio.id)}
                          className="px-2.5 py-1.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-gray-300 text-xs font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Copy text to clipboard"
                        >
                          {copiedId === item.studio.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedId === item.studio.id ? 'Copied' : 'Copy'}</span>
                        </button>

                        <button
                          onClick={() => handleOpenWhatsApp(effectivePhone, messageText, item.studio.id)}
                          className="px-3 py-1.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-emerald-400 font-bold text-xs font-mono flex items-center gap-1.5 border border-emerald-500/30 transition-all cursor-pointer"
                          title="Send pre-filled WhatsApp text"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>1-Click Text</span>
                        </button>

                        <button
                          disabled={generatingPdfId === item.studio.id}
                          onClick={() => {
                            const studioProjects = projects
                              .filter(p => p.studioId === item.studio.id && (p.remainingBalance || 0) > 0)
                              .map(p => ({ coupleName: p.coupleName, eventType: p.eventType || 'Wedding', amount: p.remainingBalance || 0 }));
                            handleSendWhatsAppWithPDF(
                              item.studio.id,
                              effectivePhone,
                              messageText,
                              item.studio.name,
                              item.pendingAmount,
                              studioProjects,
                              'studio'
                            );
                          }}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 shadow-md hover:scale-105 transition-all cursor-pointer disabled:opacity-50"
                          title="Generate Official Final Tax Invoice PDF & Share via WhatsApp"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>{generatingPdfId === item.studio.id ? 'Final PDF Readying...' : 'Send Final Invoice PDF'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 bg-charcoal-950/40 rounded-2xl border border-white/5 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h4 className="text-sm font-bold text-white">Sabhi Studios Ka Balance Clear Hai!</h4>
              <p className="text-xs text-gray-400 font-mono">5th of the month cycle - Koi unpaid studio dues pending nahi hain.</p>
            </div>
          )
        ) : (
          editorBalances.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {editorBalances.map((item) => {
                const messageText = generateEditorMessage(item);
                const isSent = sentIds.includes(item.editor.id);
                const effectivePhone = phoneOverrides[item.editor.id] || item.phone;

                return (
                  <div 
                    key={item.editor.id}
                    className="p-4 bg-charcoal-950/70 rounded-2xl border border-white/10 flex flex-col justify-between space-y-3 hover:border-emerald-500/40 transition-all group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-sm font-bold text-white font-display">{item.editor.name}</h4>
                            {isSent && (
                              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-0.5 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                <CheckCheck className="w-3 h-3" /> Sent
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 font-mono mt-0.5 flex items-center gap-2 flex-wrap">
                            {editingPhoneId === item.editor.id ? (
                              <div className="flex items-center gap-1 mt-1">
                                <input
                                  type="text"
                                  placeholder="WhatsApp Phone Number"
                                  value={tempPhoneInput}
                                  onChange={(e) => setTempPhoneInput(e.target.value)}
                                  className="px-2 py-0.5 text-xs bg-charcoal-900 border border-emerald-500/50 rounded text-white focus:outline-none"
                                />
                                <button
                                  onClick={() => handleSavePhone(item.editor.id)}
                                  className="px-2 py-0.5 bg-emerald-500 text-slate-950 font-bold rounded text-[10px]"
                                >
                                  Save
                                </button>
                              </div>
                            ) : (
                              <span 
                                onClick={() => { setEditingPhoneId(item.editor.id); setTempPhoneInput(effectivePhone); }}
                                className="text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                                title="Click to edit phone number for WhatsApp"
                              >
                                <Phone className="w-3 h-3" /> {effectivePhone || 'Add Phone +'}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-base font-extrabold font-mono text-emerald-400">
                            ₹{item.pendingAmount.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] font-mono text-gray-400 block">
                            {item.projectCount} Assigned Project(s)
                          </span>
                        </div>
                      </div>

                      {/* Message Preview */}
                      <div className="mt-3 p-2.5 bg-black/50 rounded-xl border border-white/5 text-[11px] font-mono text-gray-300 max-h-28 overflow-y-auto whitespace-pre-line">
                        {messageText}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-between border-t border-white/5 pt-3">
                      <span className="text-[10px] font-mono text-emerald-400/80 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-emerald-400" /> Semi-Automatic (1-Click)
                      </span>

                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        <button
                          onClick={() => handleCopyText(messageText, item.editor.id)}
                          className="px-2.5 py-1.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-gray-300 text-xs font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Copy text to clipboard"
                        >
                          {copiedId === item.editor.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedId === item.editor.id ? 'Copied' : 'Copy'}</span>
                        </button>

                        <button
                          onClick={() => handleOpenWhatsApp(effectivePhone, messageText, item.editor.id)}
                          className="px-3 py-1.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-emerald-400 font-bold text-xs font-mono flex items-center gap-1.5 border border-emerald-500/30 transition-all cursor-pointer"
                          title="Send pre-filled WhatsApp text"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>1-Click Text</span>
                        </button>

                        <button
                          disabled={generatingPdfId === item.editor.id}
                          onClick={() => {
                            const editorProjects = projects
                              .filter(p => p.assignedEditorId === item.editor.id)
                              .map(p => ({ coupleName: p.coupleName, eventType: p.eventType || 'Wedding', amount: p.editorPayment || 0 }));
                            handleSendWhatsAppWithPDF(
                              item.editor.id,
                              effectivePhone,
                              messageText,
                              item.editor.name,
                              item.pendingAmount,
                              editorProjects,
                              'editor'
                            );
                          }}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 shadow-md hover:scale-105 transition-all cursor-pointer disabled:opacity-50"
                          title="Generate PDF Statement & Share via WhatsApp"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>{generatingPdfId === item.editor.id ? 'PDF Readying...' : 'Remind + PDF'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 bg-charcoal-950/40 rounded-2xl border border-white/5 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h4 className="text-sm font-bold text-white">Sabhi Editors Ka Payment Completed Hai!</h4>
              <p className="text-xs text-gray-400 font-mono">5th of the month cycle - No outstanding editor wage balances found.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
