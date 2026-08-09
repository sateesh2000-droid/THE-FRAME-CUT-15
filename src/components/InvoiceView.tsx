import React, { useState, useEffect, useMemo, useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import Logo from './Logo';
import { 
  Building2, 
  Calendar, 
  Plus, 
  Eye, 
  FileText, 
  FileCheck,
  CheckCircle2,
  Send, 
  Mail, 
  Printer, 
  Save, 
  Check, 
  QrCode, 
  Trash2, 
  Sparkles,
  IndianRupee,
  Film,
  X,
  Share2,
  ExternalLink,
  Loader2,
  MessageSquare,
  Settings,
  RotateCcw,
  Sliders,
  Zap,
  Copy,
  CheckSquare,
  Tag,
  HelpCircle
} from 'lucide-react';
import { Studio, Project, PaymentHistory, UserProfile } from '../types';

export interface WhatsAppInvoiceTemplate {
  id: string;
  stageName: string;
  description: string;
  badge: string;
  color: string;
  templateText: string;
}

const DEFAULT_INVOICE_WA_TEMPLATES: Record<string, WhatsAppInvoiceTemplate> = {
  billing: {
    id: 'billing',
    stageName: 'Initial Tax Invoice & Billing',
    description: 'Standard format when generating a new tax invoice or project breakdown',
    badge: 'STAGE 1',
    color: 'emerald',
    templateText: `*TAX INVOICE: {INVOICE_NO}*
*Studio:* {STUDIO_NAME}
*Date:* {DATE}

*PROJECT BREAKDOWN:*
{PROJECT_LIST}

*Project Total:* ₹{PROJECT_TOTAL}
{PREVIOUS_BALANCE}{ADVANCE_ADJUST}{DISCOUNT}----------------------------
*TOTAL PAYABLE: ₹{TOTAL_PAYABLE}*

{PDF_ATTACHMENT}*BANK DETAILS FOR PAYMENT:*
A/C Holder: {ACCOUNT_HOLDER}
Bank: {BANK_NAME}
A/C No: {ACCOUNT_NUMBER}
IFSC: {IFSC_CODE}
UPI ID: {UPI_ID}

{DRIVE_LINK}{NOTES}Thank you for choosing The Frame Cut Studio!`
  },
  reminder: {
    id: 'reminder',
    stageName: 'Payment Reminder / Follow-up',
    description: 'Polite reminder notice for pending invoice balance',
    badge: 'STAGE 2',
    color: 'amber',
    templateText: `*PAYMENT REMINDER - INVOICE {INVOICE_NO}*

Dear {STUDIO_NAME},

This is a gentle reminder regarding the pending balance of *₹{TOTAL_PAYABLE}* for Invoice *{INVOICE_NO}* dated {DATE}.

*Payment Summary:*
• Invoice Total: ₹{PROJECT_TOTAL}
• Balance Payable: *₹{TOTAL_PAYABLE}*

{PDF_ATTACHMENT}*PAYMENT OPTIONS:*
• UPI ID: {UPI_ID}
• Bank: {BANK_NAME} | A/C: {ACCOUNT_NUMBER} | IFSC: {IFSC_CODE}
• Account Holder: {ACCOUNT_HOLDER}

Kindly acknowledge or clear the pending amount at your earliest convenience. Thank you!`
  },
  partial_advance: {
    id: 'partial_advance',
    stageName: 'Advance / Partial Payment Receipt',
    description: 'Acknowledgement sent when advance or partial payment is received',
    badge: 'STAGE 3',
    color: 'blue',
    templateText: `*PARTIAL PAYMENT RECEIPT - INVOICE {INVOICE_NO}*

Dear {STUDIO_NAME},

We have received partial payment/advance for Invoice *{INVOICE_NO}*.

*Updated Ledger Summary:*
• Project Total: ₹{PROJECT_TOTAL}
• Advance Received: -₹{ADVANCE_TOTAL}
• Discount: -₹{DISCOUNT}
• *REMAINING PAYABLE BALANCE: ₹{TOTAL_PAYABLE}*

{PDF_ATTACHMENT}*BANK / UPI DETAILS:*
UPI ID: {UPI_ID}
Bank: {BANK_NAME} ({ACCOUNT_NUMBER})

Thank you for your payment!`
  },
  paid_settled: {
    id: 'paid_settled',
    stageName: 'Full Settlement & File Delivery',
    description: 'Confirmation sent when full payment is received & files are delivered',
    badge: 'STAGE 4',
    color: 'purple',
    templateText: `*INVOICE SETTLED & PAID IN FULL - {INVOICE_NO}*

Dear {STUDIO_NAME},

Thank you! We have received full payment of *₹{TOTAL_PAYABLE}* for Invoice *{INVOICE_NO}*.

*Google Drive Delivery Link:*
{DRIVE_LINK}

{PDF_ATTACHMENT}It was an absolute pleasure working with you. Looking forward to our next project together!`
  }
};

const AVAILABLE_VARIABLE_TAGS = [
  { tag: '{INVOICE_NO}', label: 'Invoice No', example: 'AI-2026-0015' },
  { tag: '{STUDIO_NAME}', label: 'Studio Name', example: 'Wedding By KK' },
  { tag: '{DATE}', label: 'Date', example: '2026-08-06' },
  { tag: '{PROJECT_LIST}', label: 'Project List', example: '1. Rahul & Priya - ₹85,000' },
  { tag: '{PROJECT_TOTAL}', label: 'Project Total', example: '85,000' },
  { tag: '{PREVIOUS_BALANCE}', label: 'Previous Balance', example: 'Previous Balance: ₹10,000' },
  { tag: '{ADVANCE_ADJUST}', label: 'Advance Adjusted', example: 'Advance Adjusted: -₹15,000' },
  { tag: '{ADVANCE_TOTAL}', label: 'Advance Amount', example: '15,000' },
  { tag: '{DISCOUNT}', label: 'Discount', example: 'Discount: -₹2,000' },
  { tag: '{TOTAL_PAYABLE}', label: 'Total Payable', example: '68,000' },
  { tag: '{PDF_ATTACHMENT}', label: 'Attached PDF Path', example: '📎 ATTACHED INVOICE PDF DOCUMENT: ...' },
  { tag: '{ACCOUNT_HOLDER}', label: 'Account Holder', example: 'The Frame Cut Studio' },
  { tag: '{BANK_NAME}', label: 'Bank Name', example: 'HDFC Bank' },
  { tag: '{ACCOUNT_NUMBER}', label: 'Account Number', example: '501002345678' },
  { tag: '{IFSC_CODE}', label: 'IFSC Code', example: 'HDFC0001234' },
  { tag: '{UPI_ID}', label: 'UPI ID', example: 'framecut@hdfcbank' },
  { tag: '{DRIVE_LINK}', label: 'Drive Link', example: 'https://drive.google.com/...' },
  { tag: '{NOTES}', label: 'Notes', example: 'Notes: Delivery in 5 days' },
];

interface InvoiceViewProps {
  projects: Project[];
  studios: Studio[];
  payments: PaymentHistory[];
  invoices?: any[];
  currentUser: UserProfile | null;
  onLogPayment?: (payment: Omit<PaymentHistory, 'id' | 'createdAt'>) => Promise<void>;
  onSaveInvoiceDraft?: (invoiceData: any) => Promise<void>;
  onDeleteInvoiceDraft?: (id: string) => Promise<void>;
}

export default function InvoiceView({
  projects,
  studios,
  payments,
  invoices = [],
  currentUser,
  onLogPayment,
  onSaveInvoiceDraft,
  onDeleteInvoiceDraft
}: InvoiceViewProps) {
  // 1. Studio Selection
  const initialStudioId = useMemo(() => {
    if (currentUser?.role === 'studio' && currentUser.studioId) {
      return currentUser.studioId;
    }
    return studios[0]?.id || '';
  }, [currentUser, studios]);

  const [selectedStudioId, setSelectedStudioId] = useState<string>(initialStudioId);

  useEffect(() => {
    if (initialStudioId && !selectedStudioId) {
      setSelectedStudioId(initialStudioId);
    }
  }, [initialStudioId]);

  const currentStudio = useMemo(() => {
    return studios.find(s => s.id === selectedStudioId) || studios[0] || null;
  }, [studios, selectedStudioId]);

  // Invoice Meta
  const [invoiceNo, setInvoiceNo] = useState<string>('AI-2026-0015');
  const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Filter projects for selected studio
  const studioProjects = useMemo(() => {
    if (!selectedStudioId) return [];
    return projects.filter(p => p.studioId === selectedStudioId);
  }, [projects, selectedStudioId]);

  // Project Checkbox Selections state (projectId -> boolean)
  const [selectedProjectIds, setSelectedProjectIds] = useState<Record<string, boolean>>({});

  // Auto-select projects when studio changes
  useEffect(() => {
    const initialSelections: Record<string, boolean> = {};
    studioProjects.forEach(p => {
      initialSelections[p.id] = true;
    });
    setSelectedProjectIds(initialSelections);
  }, [selectedStudioId, studioProjects]);

  const allProjectsSelected = useMemo(() => {
    if (studioProjects.length === 0) return false;
    return studioProjects.every(p => selectedProjectIds[p.id]);
  }, [studioProjects, selectedProjectIds]);

  const handleToggleSelectAllProjects = () => {
    const targetState = !allProjectsSelected;
    const newSel: Record<string, boolean> = {};
    studioProjects.forEach(p => {
      newSel[p.id] = targetState;
    });
    setSelectedProjectIds(newSel);
  };

  const handleToggleProject = (id: string) => {
    setSelectedProjectIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Calculate Project Total from selected projects
  const selectedProjectsTotal = useMemo(() => {
    return studioProjects
      .filter(p => selectedProjectIds[p.id])
      .reduce((sum, p) => sum + (p.projectAmount || 0), 0);
  }, [studioProjects, selectedProjectIds]);

  // Filter Advance Payments for selected studio
  const studioPayments = useMemo(() => {
    if (!selectedStudioId) return [];
    return payments.filter(p => p.entityId === selectedStudioId && p.entityType === 'studio');
  }, [payments, selectedStudioId]);

  // Local state for advance payment items (combines existing payments + locally added)
  const [advanceList, setAdvanceList] = useState<Array<{
    id: string;
    date: string;
    paidBy: string;
    paymentMode: string;
    amount: number;
    adjusted: boolean;
  }>>([]);

  useEffect(() => {
    const mapped = studioPayments.map(p => ({
      id: p.id,
      date: p.date,
      paidBy: p.receivedFrom || 'Studio Client',
      paymentMode: p.paymentMethod || 'UPI',
      amount: p.amount || 0,
      adjusted: true
    }));

    // If no payments found for this studio, provide sample default entries matching wireframe demo
    if (mapped.length === 0) {
      setAdvanceList([
        { id: 'adv-1', date: '2026-07-13', paidBy: 'Krishna', paymentMode: 'Cash', amount: 10000, adjusted: true },
        { id: 'adv-2', date: '2026-07-17', paidBy: 'Rahul', paymentMode: 'Online (UPI)', amount: 5000, adjusted: true }
      ]);
    } else {
      setAdvanceList(mapped);
    }
  }, [studioPayments, selectedStudioId]);

  const handleToggleAdvanceAdjust = (id: string) => {
    setAdvanceList(prev => prev.map(item => item.id === id ? { ...item, adjusted: !item.adjusted } : item));
  };

  const handleUpdateAdvanceMode = (id: string, mode: string) => {
    setAdvanceList(prev => prev.map(item => item.id === id ? { ...item, paymentMode: mode } : item));
  };

  const handleDeleteAdvance = (id: string) => {
    setAdvanceList(prev => prev.filter(item => item.id !== id));
  };

  // Calculate Cash vs Online Advance Totals
  const cashAdvanceTotal = useMemo(() => {
    return advanceList
      .filter(a => a.adjusted && (a.paymentMode.toLowerCase().includes('cash')))
      .reduce((sum, a) => sum + a.amount, 0);
  }, [advanceList]);

  const onlineAdvanceTotal = useMemo(() => {
    return advanceList
      .filter(a => a.adjusted && (!a.paymentMode.toLowerCase().includes('cash')))
      .reduce((sum, a) => sum + a.amount, 0);
  }, [advanceList]);

  // Add Advance Modal
  const [showAddAdvanceModal, setShowAddAdvanceModal] = useState(false);
  const [newAdvPaidBy, setNewAdvPaidBy] = useState('');
  const [newAdvAmount, setNewAdvAmount] = useState<number | ''>('');
  const [newAdvMode, setNewAdvMode] = useState('UPI');
  const [newAdvDate, setNewAdvDate] = useState(new Date().toISOString().split('T')[0]);

  const handleCreateAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdvAmount || Number(newAdvAmount) <= 0) return;

    const amountNum = Number(newAdvAmount);
    const newEntry = {
      id: `adv-${Date.now()}`,
      date: newAdvDate,
      paidBy: newAdvPaidBy || 'Studio Client',
      paymentMode: newAdvMode,
      amount: amountNum,
      adjusted: true
    };

    setAdvanceList(prev => [...prev, newEntry]);

    if (onLogPayment && selectedStudioId) {
      try {
        await onLogPayment({
          entityId: selectedStudioId,
          entityType: 'studio',
          projectId: '',
          projectCoupleName: `${currentStudio?.name || 'Studio'} Advance`,
          amount: amountNum,
          date: newAdvDate,
          paymentMethod: newAdvMode,
          receivedFrom: newAdvPaidBy || 'Studio Client',
          notes: 'Recorded via Invoice View Advance Payment'
        });
      } catch (err) {
        console.error("Error logging payment:", err);
      }
    }

    setNewAdvPaidBy('');
    setNewAdvAmount('');
    setShowAddAdvanceModal(false);
  };

  const advanceTotal = useMemo(() => {
    return advanceList
      .filter(a => a.adjusted)
      .reduce((sum, a) => sum + a.amount, 0);
  }, [advanceList]);

  // Invoice Summary calculation inputs
  const [previousBalance, setPreviousBalance] = useState<number>(12000);
  const [discount, setDiscount] = useState<number>(0);

  // Total Payable = Project Total + Previous Balance - Advance Adjust - Discount
  const totalPayable = useMemo(() => {
    const val = selectedProjectsTotal + previousBalance - advanceTotal - discount;
    return val < 0 ? 0 : val;
  }, [selectedProjectsTotal, previousBalance, advanceTotal, discount]);

  // Payment Details (Pre-filled defaults matching user request)
  const [accountHolder, setAccountHolder] = useState('SATISH TIWARI');
  const [bankName, setBankName] = useState('ICICI BANK');
  const [accountNumber, setAccountNumber] = useState('390701503993');
  const [ifscCode, setIfscCode] = useState('ICIC0003907');
  const [upiId, setUpiId] = useState('7772999933@upi');

  // Delivery
  const [driveLink, setDriveLink] = useState('');
  const [notes, setNotes] = useState('');

  // Top Stats Calculations
  const totalProjectsCount = studioProjects.length;
  const totalBusiness = studioProjects.reduce((sum, p) => sum + (p.projectAmount || 0), 0);
  const totalReceived = advanceList.reduce((sum, a) => sum + a.amount, 0);
  const outstanding = totalBusiness - totalReceived > 0 ? totalBusiness - totalReceived : 0;
  const lastPayment = advanceList.length > 0 ? advanceList[advanceList.length - 1].amount : 0;

  // Modals, Toast, Tab Navigation & WhatsApp Templates state
  const [activeInvoiceTab, setActiveInvoiceTab] = useState<'builder' | 'templates' | 'history'>('builder');
  const [selectedStage, setSelectedStage] = useState<string>('billing');
  const [editingStage, setEditingStage] = useState<string>('billing');

  const [templates, setTemplates] = useState<Record<string, WhatsAppInvoiceTemplate>>(() => {
    try {
      const saved = localStorage.getItem('tfc_invoice_wa_templates');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_INVOICE_WA_TEMPLATES, ...parsed };
      }
    } catch (e) {
      console.warn('Error reading stored invoice WA templates:', e);
    }
    return DEFAULT_INVOICE_WA_TEMPLATES;
  });

  const [activeEditingText, setActiveEditingText] = useState<string>(() => {
    return templates['billing']?.templateText || DEFAULT_INVOICE_WA_TEMPLATES['billing'].templateText;
  });

  useEffect(() => {
    try {
      localStorage.setItem('tfc_invoice_wa_templates', JSON.stringify(templates));
    } catch (e) {
      console.warn('Error saving invoice WA templates to localStorage:', e);
    }
  }, [templates]);

  useEffect(() => {
    if (templates[editingStage]) {
      setActiveEditingText(templates[editingStage].templateText);
    }
  }, [editingStage, templates]);

  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [attachedPdfPath, setAttachedPdfPath] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const printInvoiceRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Lookup existing saved invoice in Firestore (if any)
  const currentSavedInvoice = useMemo(() => {
    return invoices.find(inv => inv.id === invoiceNo || inv.invoiceNo === invoiceNo);
  }, [invoices, invoiceNo]);

  const effectivePdfPath = attachedPdfPath || currentSavedInvoice?.pdfDocumentPath || '';

  // Dynamic QR Code URL for UPI
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(accountHolder)}&am=${totalPayable}`;

  // Format WhatsApp message text using template for stage
  const getFormattedMessageText = (stageKey: string, customTemplateText?: string) => {
    const tmplText = customTemplateText !== undefined 
      ? customTemplateText 
      : (templates[stageKey]?.templateText || DEFAULT_INVOICE_WA_TEMPLATES[stageKey]?.templateText || '');

    let projectListStr = '';
    const selectedProjs = studioProjects.filter(p => selectedProjectIds[p.id]);
    if (selectedProjs.length > 0) {
      selectedProjs.forEach((p, idx) => {
        projectListStr += `${idx + 1}. ${p.coupleName} (${p.eventType || 'Wedding'}) - ₹${p.projectAmount.toLocaleString('en-IN')}\n`;
      });
    } else {
      projectListStr = '1. General Photography Project - ₹0';
    }

    const pdfStr = effectivePdfPath ? `📎 *ATTACHED INVOICE PDF DOCUMENT:* ${effectivePdfPath}\n\n` : '';
    const prevBalStr = previousBalance > 0 ? `*Previous Balance:* ₹${previousBalance.toLocaleString('en-IN')}\n` : '';
    const advStr = advanceTotal > 0 ? `*Advance Adjusted:* -₹${advanceTotal.toLocaleString('en-IN')}\n` : '';
    const discStr = discount > 0 ? `*Discount:* -₹${discount.toLocaleString('en-IN')}\n` : '';
    const driveStr = driveLink ? `*GOOGLE DRIVE DELIVERY LINK:*\n${driveLink}\n\n` : '';
    const notesStr = notes ? `*Notes:* ${notes}\n\n` : '';

    return tmplText
      .replace(/\{INVOICE_NO\}/g, invoiceNo || 'AI-2026-0015')
      .replace(/\{STUDIO_NAME\}/g, currentStudio?.name || 'Wedding By KK')
      .replace(/\{DATE\}/g, invoiceDate || new Date().toISOString().split('T')[0])
      .replace(/\{PROJECT_LIST\}/g, projectListStr.trimEnd())
      .replace(/\{PROJECT_TOTAL\}/g, selectedProjectsTotal.toLocaleString('en-IN'))
      .replace(/\{PREVIOUS_BALANCE\}/g, prevBalStr)
      .replace(/\{ADVANCE_ADJUST\}/g, advStr)
      .replace(/\{ADVANCE_TOTAL\}/g, advanceTotal.toLocaleString('en-IN'))
      .replace(/\{DISCOUNT\}/g, discStr)
      .replace(/\{TOTAL_PAYABLE\}/g, totalPayable.toLocaleString('en-IN'))
      .replace(/\{PDF_ATTACHMENT\}/g, pdfStr)
      .replace(/\{ACCOUNT_HOLDER\}/g, accountHolder || 'The Frame Cut Studio')
      .replace(/\{BANK_NAME\}/g, bankName || 'HDFC Bank')
      .replace(/\{ACCOUNT_NUMBER\}/g, accountNumber || '501002345678')
      .replace(/\{IFSC_CODE\}/g, ifscCode || 'HDFC0001234')
      .replace(/\{UPI_ID\}/g, upiId || 'framecut@upi')
      .replace(/\{DRIVE_LINK\}/g, driveStr)
      .replace(/\{NOTES\}/g, notesStr);
  };

  // WhatsApp formatted string generator for active selected stage
  const getWhatsAppMessage = () => {
    const raw = getFormattedMessageText(selectedStage);
    return encodeURIComponent(raw);
  };

  const handleSaveStageTemplate = (stageKey: string) => {
    setTemplates(prev => ({
      ...prev,
      [stageKey]: {
        ...prev[stageKey],
        templateText: activeEditingText
      }
    }));
    showToast(`✅ Saved custom template for: ${templates[stageKey]?.stageName || stageKey}`);
  };

  const handleResetStageTemplate = (stageKey: string) => {
    const defaultObj = DEFAULT_INVOICE_WA_TEMPLATES[stageKey];
    if (defaultObj) {
      setActiveEditingText(defaultObj.templateText);
      setTemplates(prev => ({
        ...prev,
        [stageKey]: { ...defaultObj }
      }));
      showToast(`🔄 Reset template for stage: ${defaultObj.stageName}`);
    }
  };

  const handleInsertTagToEditor = (tag: string) => {
    setActiveEditingText(prev => prev + ' ' + tag);
    showToast(`Added tag ${tag} to template`);
  };

  // Fallback vector-based jsPDF builder (runs if html2canvas ever fails)
  const generateVectorPdfDirect = (): { pdf: jsPDF; fileName: string; file: File } => {
    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4'
    });

    const cleanStudioName = currentStudio?.name ? currentStudio.name.replace(/[^a-zA-Z0-9]/g, '_') : 'Studio';
    const fileName = `Invoice_${invoiceNo}_${cleanStudioName}.pdf`;

    // Modern Dark Header Banner
    pdf.setFillColor(15, 23, 42); // slate-900
    pdf.rect(0, 0, 210, 38, 'F');

    // Title & Studio Name
    pdf.setTextColor(245, 158, 11); // Amber-500
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('THE FRAME CUTS STUDIO', 14, 15);

    pdf.setTextColor(203, 213, 225); // Slate-300
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text('CINEMATIC WEDDING SUITE & POST PRODUCTION', 14, 21);
    pdf.text('Email: contact@theframecuts.com | Phone: +91 77729 99933', 14, 26);

    // Invoice Badge Right
    pdf.setFillColor(245, 158, 11);
    pdf.roundedRect(135, 7, 62, 24, 3, 3, 'F');

    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('TAX INVOICE', 166, 14, { align: 'center' });

    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Invoice #: ${invoiceNo}`, 166, 19, { align: 'center' });
    pdf.text(`Date: ${invoiceDate}`, 166, 24, { align: 'center' });

    let y = 44;

    // Bill To & Issued By Cards
    pdf.setDrawColor(226, 232, 240);
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(14, y, 88, 28, 2, 2, 'FD');
    pdf.roundedRect(108, y, 88, 28, 2, 2, 'FD');

    // Left Bill To
    pdf.setTextColor(217, 119, 6);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text('INVOICE TO:', 18, y + 6);

    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(11);
    pdf.text(currentStudio?.name || 'Wedding By KK', 18, y + 12);

    pdf.setTextColor(71, 85, 105);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Attn: ${currentStudio?.ownerName || 'Studio Director'}`, 18, y + 18);
    pdf.text(`Phone: ${currentStudio?.phone || '+91 98260 00000'}`, 18, y + 23);

    // Right Issued By
    pdf.setTextColor(4, 120, 87);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PAYMENT RECEIVER:', 112, y + 6);

    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(11);
    pdf.text('THE FRAME CUTS STUDIO', 112, y + 12);

    pdf.setTextColor(71, 85, 105);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Satish Tiwari — Founder & Lead Director', 112, y + 18);
    pdf.text('Raipur, Chhattisgarh, India', 112, y + 23);

    y += 34;

    // Section 1: Project Services Table
    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text('1. PROJECT SERVICES & DELIVERABLES', 14, y);
    y += 4;

    pdf.setFillColor(15, 23, 42);
    pdf.rect(14, y, 182, 7, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(8);
    pdf.text('Project / Event Description', 18, y + 5);
    pdf.text('Qty', 120, y + 5, { align: 'center' });
    pdf.text('Rate (Rs.)', 150, y + 5, { align: 'right' });
    pdf.text('Total (Rs.)', 190, y + 5, { align: 'right' });

    y += 7;

    const selectedProjs = studioProjects.filter(p => selectedProjectIds[p.id]);
    if (selectedProjs.length === 0) {
      pdf.setTextColor(148, 163, 184);
      pdf.setFontSize(8);
      pdf.text('No specific projects selected', 18, y + 5);
      y += 8;
    } else {
      selectedProjs.forEach((p) => {
        pdf.setDrawColor(241, 245, 249);
        pdf.line(14, y + 8, 196, y + 8);

        pdf.setTextColor(15, 23, 42);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text(p.coupleName || 'Wedding Project', 18, y + 5);

        pdf.setTextColor(100, 116, 139);
        pdf.setFontSize(7.5);
        pdf.setFont('helvetica', 'normal');
        pdf.text(p.eventType || 'Full Post-Production', 18, y + 8);

        pdf.setTextColor(15, 23, 42);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.text('1', 120, y + 6, { align: 'center' });
        pdf.text(`Rs. ${p.projectAmount.toLocaleString('en-IN')}`, 150, y + 6, { align: 'right' });
        pdf.text(`Rs. ${p.projectAmount.toLocaleString('en-IN')}`, 190, y + 6, { align: 'right' });

        y += 10;
      });
    }

    y += 4;

    // Section 2: Advances Table
    const adjustedAdvances = advanceList.filter(a => a.adjusted);
    if (adjustedAdvances.length > 0) {
      pdf.setTextColor(4, 120, 87);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('2. ADVANCE PAYMENTS RECEIVED & ADJUSTED', 14, y);
      y += 4;

      pdf.setFillColor(6, 78, 59);
      pdf.rect(14, y, 182, 6, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(7.5);
      pdf.text('Date', 18, y + 4.5);
      pdf.text('Received From', 55, y + 4.5);
      pdf.text('Payment Mode', 120, y + 4.5, { align: 'center' });
      pdf.text('Amount (Rs.)', 190, y + 4.5, { align: 'right' });

      y += 6;

      adjustedAdvances.forEach((adv) => {
        pdf.setDrawColor(236, 253, 245);
        pdf.line(14, y + 6, 196, y + 6);

        pdf.setTextColor(71, 85, 105);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text(new Date(adv.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), 18, y + 4.5);
        
        pdf.setTextColor(15, 23, 42);
        pdf.setFont('helvetica', 'bold');
        pdf.text(adv.paidBy || 'Studio Client', 55, y + 4.5);

        pdf.setTextColor(4, 120, 87);
        pdf.text(adv.paymentMode.toUpperCase(), 120, y + 4.5, { align: 'center' });

        pdf.text(`Rs. ${adv.amount.toLocaleString('en-IN')}`, 190, y + 4.5, { align: 'right' });

        y += 7;
      });

      y += 4;
    }

    // Ledger Summary Box Right
    pdf.setFillColor(15, 23, 42);
    pdf.roundedRect(108, y, 88, 38, 2, 2, 'F');

    pdf.setTextColor(226, 232, 240);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');

    pdf.text('Sub Total:', 114, y + 7);
    pdf.text(`Rs. ${selectedProjectsTotal.toLocaleString('en-IN')}`, 190, y + 7, { align: 'right' });

    if (previousBalance > 0) {
      pdf.text('Previous Pending Balance:', 114, y + 12);
      pdf.text(`+Rs. ${previousBalance.toLocaleString('en-IN')}`, 190, y + 12, { align: 'right' });
    }

    pdf.setTextColor(52, 211, 153);
    pdf.text('Total Advance Adjusted:', 114, y + 17);
    pdf.text(`-Rs. ${advanceTotal.toLocaleString('en-IN')}`, 190, y + 17, { align: 'right' });

    if (discount > 0) {
      pdf.setTextColor(248, 113, 113);
      pdf.text('Discount:', 114, y + 22);
      pdf.text(`-Rs. ${discount.toLocaleString('en-IN')}`, 190, y + 22, { align: 'right' });
    }

    // Grand Total Pill
    pdf.setFillColor(245, 158, 11);
    pdf.roundedRect(112, y + 26, 80, 9, 2, 2, 'F');

    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(8.5);
    pdf.setFont('helvetica', 'bold');
    pdf.text('REMAINING BALANCE DUE:', 116, y + 32);
    pdf.setFontSize(11);
    pdf.text(`Rs. ${totalPayable.toLocaleString('en-IN')}`, 188, y + 32, { align: 'right' });

    // Left Bank Details
    pdf.setFillColor(254, 243, 199);
    pdf.setDrawColor(252, 211, 77);
    pdf.roundedRect(14, y, 88, 38, 2, 2, 'FD');

    pdf.setTextColor(120, 53, 15);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text('BANK & UPI PAYMENT DETAILS:', 18, y + 6);

    pdf.setTextColor(30, 41, 59);
    pdf.setFontSize(7.5);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Account Holder: ${accountHolder}`, 18, y + 12);
    pdf.text(`Bank Name: ${bankName}`, 18, y + 17);
    pdf.text(`A/C Number: ${accountNumber}`, 18, y + 22);
    pdf.text(`IFSC Code: ${ifscCode}`, 18, y + 27);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(180, 83, 9);
    pdf.text(`UPI ID: ${upiId}`, 18, y + 32);

    y += 44;

    // Terms & Conditions Footer
    pdf.setDrawColor(226, 232, 240);
    pdf.line(14, y, 196, y);
    y += 6;

    pdf.setTextColor(100, 116, 139);
    pdf.setFontSize(7.5);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Terms: All files delivered via Google Drive upon settlement. Thank you for choosing The Frame Cuts Studio!', 14, y);

    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(15, 23, 42);
    pdf.text('Authorized Signatory — The Frame Cuts Studio', 196, y, { align: 'right' });

    const pdfBlob = pdf.output('blob');
    const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

    return { pdf, fileName, file };
  };

  const generatePdfFile = async (): Promise<{ pdf: jsPDF; fileName: string; file: File } | null> => {
    const element = printInvoiceRef.current;
    if (!element) return generateVectorPdfDirect();

    // Temporarily bring container on-screen so html2canvas computes accurate bounding rect & full render
    const parentContainer = element.parentElement;
    const origPosition = parentContainer ? parentContainer.style.position : '';
    const origLeft = parentContainer ? parentContainer.style.left : '';
    const origTop = parentContainer ? parentContainer.style.top : '';
    const origZIndex = parentContainer ? parentContainer.style.zIndex : '';
    const origOpacity = parentContainer ? parentContainer.style.opacity : '';
    const origVisibility = parentContainer ? parentContainer.style.visibility : '';

    if (parentContainer) {
      parentContainer.style.position = 'fixed';
      parentContainer.style.left = '0px';
      parentContainer.style.top = '0px';
      parentContainer.style.zIndex = '99999';
      parentContainer.style.opacity = '1';
      parentContainer.style.visibility = 'visible';
    }

    try {
      // Small pause to let DOM recalculate styles & layout
      await new Promise(resolve => setTimeout(resolve, 80));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 800,
        windowHeight: element.scrollHeight || 1120,
        onclone: (clonedDoc) => {
          const clonedTarget = clonedDoc.querySelector('#printable-invoice-container') as HTMLElement;
          if (clonedTarget) {
            clonedTarget.style.opacity = '1';
            clonedTarget.style.visibility = 'visible';
            clonedTarget.style.display = 'block';
            clonedTarget.style.position = 'relative';
            clonedTarget.style.top = '0';
            clonedTarget.style.left = '0';
            clonedTarget.style.margin = '0';
          }
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const cleanStudioName = currentStudio?.name ? currentStudio.name.replace(/[^a-zA-Z0-9]/g, '_') : 'Studio';
      const fileName = `Invoice_${invoiceNo}_${cleanStudioName}.pdf`;

      const pdfBlob = pdf.output('blob');
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

      return { pdf, fileName, file };
    } catch (err) {
      console.warn('html2canvas rendering warning, generating direct vector PDF fallback:', err);
      return generateVectorPdfDirect();
    } finally {
      // Restore off-screen placement
      if (parentContainer) {
        parentContainer.style.position = origPosition || 'fixed';
        parentContainer.style.left = origLeft || '-9999px';
        parentContainer.style.top = origTop || '0px';
        parentContainer.style.zIndex = origZIndex || '-9999';
        parentContainer.style.opacity = origOpacity || '1';
        parentContainer.style.visibility = origVisibility || 'visible';
      }
    }
  };

  const handleGeneratePDF = async () => {
    setIsGeneratingPdf(true);
    try {
      const res = await generatePdfFile();
      if (!res) {
        window.print();
        showToast('Print dialog opened!');
        return;
      }
      res.pdf.save(res.fileName);
      showToast('📄 PDF Invoice generated & downloaded successfully!');
    } catch (err) {
      console.error('PDF Generation Error, using fallback:', err);
      const fallback = generateVectorPdfDirect();
      fallback.pdf.save(fallback.fileName);
      showToast('📄 PDF Invoice generated successfully!');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleGenerateAndAttachPDF = async () => {
    setIsGeneratingPdf(true);
    try {
      let res = await generatePdfFile();
      if (!res) {
        res = generateVectorPdfDirect();
      }

      const cleanStudioName = currentStudio?.name ? currentStudio.name.replace(/[^a-zA-Z0-9]/g, '_') : 'Studio';
      const fileName = res.fileName || `Invoice_${invoiceNo}_${cleanStudioName}.pdf`;
      const pdfDataUrl = res.pdf.output('datauristring');
      const docPath = `firestore://studioInvoices/${invoiceNo}/${fileName}`;

      const payload = {
        id: invoiceNo,
        invoiceNo,
        studioId: selectedStudioId,
        studioName: currentStudio?.name || '',
        invoiceDate,
        projectTotal: selectedProjectsTotal,
        advanceTotal,
        previousBalance,
        discount,
        totalPayable,
        driveLink,
        notes,
        pdfDocumentPath: docPath,
        pdfFileName: fileName,
        pdfDataUrl: pdfDataUrl,
        selectedProjectsCount: studioProjects.filter(p => selectedProjectIds[p.id]).length,
        updatedAt: new Date().toISOString()
      };

      if (onSaveInvoiceDraft) {
        await onSaveInvoiceDraft(payload);
      } else {
        const docRef = doc(db, 'studioInvoices', invoiceNo);
        await setDoc(docRef, payload, { merge: true });
      }

      setAttachedPdfPath(docPath);
      res.pdf.save(fileName);
      showToast('📄 PDF generated & saved in Firestore! Download started.');
    } catch (err) {
      console.error('Error generating and attaching PDF:', err);
      showToast('⚠️ Error creating PDF attachment');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleWhatsAppSend = async () => {
    setIsGeneratingPdf(true);
    try {
      const res = await generatePdfFile();
      const rawMsg = decodeURIComponent(getWhatsAppMessage());

      // Auto-download PDF file to user's device so it is ready to attach
      if (res) {
        res.pdf.save(res.fileName);
      }

      let phone = currentStudio?.phone ? currentStudio.phone.replace(/\D/g, '') : '';
      if (phone.length === 10) {
        phone = '91' + phone;
      }

      // 1. Mobile Web Share API with File Attachment
      if (res && navigator.canShare && navigator.canShare({ files: [res.file] })) {
        try {
          await navigator.share({
            title: `Invoice ${invoiceNo}`,
            text: rawMsg,
            files: [res.file]
          });
          showToast('📲 Invoice PDF & details shared via WhatsApp!');
          setIsGeneratingPdf(false);
          return;
        } catch (shareErr: any) {
          if (shareErr.name === 'AbortError') {
            showToast('Share cancelled');
            setIsGeneratingPdf(false);
            return;
          }
          console.warn('Native Web Share failed, using direct WhatsApp link:', shareErr);
        }
      }

      // 2. Desktop / Standard WhatsApp Link Fallback
      try {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(rawMsg);
        }
      } catch (e) {
        console.warn('Clipboard write error', e);
      }

      const updatedMsg = rawMsg + `\n\n📎 *Invoice PDF file (${res?.fileName || 'Invoice.pdf'}) saved to your downloads.*`;
      const encoded = encodeURIComponent(updatedMsg);

      const link = phone ? `https://wa.me/${phone}?text=${encoded}` : `https://api.whatsapp.com/send?text=${encoded}`;
      
      const win = window.open(link, '_blank');
      if (!win) {
        window.location.href = link;
      }
      showToast('💬 PDF downloaded & opening WhatsApp! Simply attach the PDF in chat.');
    } catch (err) {
      console.error('WhatsApp PDF Error:', err);
      const encoded = getWhatsAppMessage();
      let phone = currentStudio?.phone ? currentStudio.phone.replace(/\D/g, '') : '';
      if (phone.length === 10) {
        phone = '91' + phone;
      }
      const link = phone ? `https://wa.me/${phone}?text=${encoded}` : `https://api.whatsapp.com/send?text=${encoded}`;
      window.open(link, '_blank');
      showToast('💬 Opening WhatsApp chat!');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleEmailSend = async () => {
    const subject = `Invoice ${invoiceNo} - ${currentStudio?.name || 'The Frame Cuts Studio'}`;
    const body = decodeURIComponent(getWhatsAppMessage());

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
      }
    } catch (e) {
      console.warn('Clipboard write error', e);
    }

    const mailtoUrl = `mailto:${currentStudio?.email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
    showToast('✉️ Email text copied & opening mail app!');
  };

  const handlePrint = () => {
    window.print();
    showToast('🖨️ Print dialog opened!');
  };

  const handleSaveDraft = async () => {
    if (onSaveInvoiceDraft) {
      await onSaveInvoiceDraft({
        invoiceNo,
        studioId: selectedStudioId,
        studioName: currentStudio?.name,
        date: invoiceDate,
        projectTotal: selectedProjectsTotal,
        advanceTotal,
        previousBalance,
        discount,
        totalPayable,
        driveLink,
        notes
      });
    }
    setSaveSuccess(true);
    showToast('💾 Draft Saved to Database!');
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-2 sm:px-4 print:p-0 print:m-0">
      
      {/* ================= INVOICE VIEW TOP NAVIGATION TABS ================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-2.5 rounded-2xl print:hidden shadow-xl">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveInvoiceTab('builder')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeInvoiceTab === 'builder'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Invoice Builder</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveInvoiceTab('templates')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeInvoiceTab === 'templates'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>WhatsApp Template Settings</span>
            <span className="text-[10px] font-extrabold bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40 ml-1">
              Custom
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveInvoiceTab('history')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeInvoiceTab === 'history'
                ? 'bg-blue-500 text-slate-950 shadow-md shadow-blue-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Saved Invoices ({invoices.length})</span>
          </button>
        </div>

        {activeInvoiceTab === 'builder' && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/90 border border-slate-700/80 rounded-xl">
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">Active WA Stage:</span>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="bg-slate-900 text-emerald-400 font-bold text-xs border border-emerald-500/30 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-500 outline-none cursor-pointer"
            >
              <option value="billing">📋 Stage 1: Tax Invoice & Billing</option>
              <option value="reminder">🔔 Stage 2: Payment Reminder</option>
              <option value="partial_advance">💳 Stage 3: Advance Receipt</option>
              <option value="paid_settled">✅ Stage 4: Paid Settlement</option>
            </select>
          </div>
        )}
      </div>

      {activeInvoiceTab === 'history' ? (
        /* ================= SAVED INVOICES HISTORY VIEW ================= */
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  Firestore Registry
                </span>
                <span className="text-xs text-slate-400 font-medium">• {invoices.length} Total Saved</span>
              </div>
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <FileCheck className="w-6 h-6 text-blue-400" />
                Saved Invoices & Generated PDFs
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                View all generated invoices stored in your studio database. Re-download PDF files or dispatch updates directly.
              </p>
            </div>

            <button
              onClick={() => setActiveInvoiceTab('builder')}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2 self-start md:self-auto"
            >
              <Plus className="w-4 h-4" />
              Create New Invoice
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
            {invoices.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm space-y-3">
                <FileText className="w-12 h-12 text-slate-600 mx-auto" />
                <p>No saved invoices found in database yet.</p>
                <button
                  onClick={() => setActiveInvoiceTab('builder')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold text-xs rounded-xl border border-slate-700"
                >
                  Generate Your First Invoice
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300 border-collapse">
                  <thead>
                    <tr className="bg-slate-800/80 border-b border-slate-700 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <th className="p-3">Invoice No</th>
                      <th className="p-3">Studio Name</th>
                      <th className="p-3">Date</th>
                      <th className="p-3 text-right">Project Total</th>
                      <th className="p-3 text-right">Advance</th>
                      <th className="p-3 text-right">Net Payable</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3 font-mono font-bold text-amber-400">{inv.invoiceNo || inv.id}</td>
                        <td className="p-3 font-semibold text-white">{inv.studioName || 'Studio'}</td>
                        <td className="p-3 text-slate-400 text-xs">{inv.invoiceDate || inv.date || 'Today'}</td>
                        <td className="p-3 text-right font-medium text-slate-200">₹{(inv.projectTotal || 0).toLocaleString('en-IN')}</td>
                        <td className="p-3 text-right font-medium text-emerald-400">-₹{(inv.advanceTotal || 0).toLocaleString('en-IN')}</td>
                        <td className="p-3 text-right font-black text-amber-400 text-base">₹{(inv.totalPayable || 0).toLocaleString('en-IN')}</td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setInvoiceNo(inv.invoiceNo || inv.id);
                                if (inv.studioId) setSelectedStudioId(inv.studioId);
                                setActiveInvoiceTab('builder');
                                handleGeneratePDF();
                              }}
                              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-blue-400 font-semibold text-xs rounded-lg border border-slate-700 flex items-center gap-1 cursor-pointer"
                              title="Download PDF"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              PDF
                            </button>

                            {onDeleteInvoiceDraft && (
                              <button
                                onClick={() => onDeleteInvoiceDraft(inv.id)}
                                className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 cursor-pointer transition-colors"
                                title="Delete invoice"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : activeInvoiceTab === 'templates' ? (
        /* ================= WHATSAPP TEMPLATE SETTINGS VIEW ================= */
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <MessageSquare className="w-48 h-48 text-emerald-400" />
            </div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    WhatsApp Automation
                  </span>
                  <span className="text-xs text-slate-400 font-medium">• Persistent Templates</span>
                </div>
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                  <Sliders className="w-6 h-6 text-emerald-400" />
                  Customizable WhatsApp Message Formats
                </h2>
                <p className="text-slate-400 text-sm mt-1 max-w-2xl">
                  Configure pre-formatted WhatsApp message layouts for each invoice stage. Select dynamic placeholders to automatically insert client & payment variables when dispatching messages.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveInvoiceTab('builder')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold rounded-xl border border-slate-700 transition-all cursor-pointer flex items-center gap-2"
                >
                  <FileText className="w-4 h-4 text-amber-400" />
                  Return to Invoice Builder
                </button>
              </div>
            </div>
          </div>

          {/* Stage Tab Selector Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.keys(DEFAULT_INVOICE_WA_TEMPLATES).map((stageKey) => {
              const tmpl = templates[stageKey] || DEFAULT_INVOICE_WA_TEMPLATES[stageKey];
              const isSelected = editingStage === stageKey;
              return (
                <button
                  key={stageKey}
                  type="button"
                  onClick={() => setEditingStage(stageKey)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'bg-slate-800/90 border-emerald-500 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/40'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                      tmpl.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' :
                      tmpl.color === 'amber' ? 'bg-amber-500/20 text-amber-400' :
                      tmpl.color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-purple-500/20 text-purple-400'
                    }`}>
                      {tmpl.badge}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>

                  <h3 className="font-bold text-white text-sm line-clamp-1 mb-1">
                    {tmpl.stageName}
                  </h3>
                  <p className="text-slate-400 text-xs line-clamp-2">
                    {tmpl.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Main Editor & Live Preview Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Template Editor Box */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Tag className="w-4 h-4 text-emerald-400" />
                    Editing Format: <span className="text-emerald-400">{templates[editingStage]?.stageName}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {templates[editingStage]?.description}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleResetStageTemplate(editingStage)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Reset this stage template to original default"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    Reset Stage
                  </button>
                </div>
              </div>

              {/* Dynamic Variable Chips */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2 flex items-center justify-between">
                  <span>Available Placeholders (Click to insert into template):</span>
                  <span className="text-[10px] text-slate-500">Auto-filled on share</span>
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  {AVAILABLE_VARIABLE_TAGS.map((item) => (
                    <button
                      key={item.tag}
                      type="button"
                      onClick={() => handleInsertTagToEditor(item.tag)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-emerald-600/30 hover:border-emerald-500/50 text-slate-200 border border-slate-700 rounded-lg text-xs font-mono transition-all flex items-center gap-1 cursor-pointer"
                      title={`Insert ${item.tag} (${item.example})`}
                    >
                      <Plus className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>{item.tag}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Editor Textarea */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  WhatsApp Raw Text Pattern:
                </label>
                <textarea
                  rows={14}
                  value={activeEditingText}
                  onChange={(e) => setActiveEditingText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3.5 text-xs sm:text-sm font-mono text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none leading-relaxed resize-y"
                  placeholder="Type WhatsApp formatted message..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <div className="text-xs text-slate-400">
                  <span className="text-emerald-400 font-bold">Tip:</span> Use <code className="text-amber-300">*bold*</code> and <code className="text-amber-300">• bullets</code> for WhatsApp formatting.
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveStageTemplate(editingStage)}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                  >
                    <Save className="w-4 h-4" />
                    Save Template
                  </button>
                </div>
              </div>
            </div>

            {/* Live Rendered WhatsApp Message Preview */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Eye className="w-4 h-4 text-emerald-400" />
                    Live WhatsApp Preview
                  </h3>
                  <span className="text-[11px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    {currentStudio?.name || 'Studio Data'}
                  </span>
                </div>

                {/* Simulated WhatsApp Chat Bubble */}
                <div className="bg-[#0b141a] rounded-2xl border border-emerald-900/40 p-4 shadow-2xl relative overflow-hidden">
                  <div className="flex items-center gap-2 pb-3 mb-3 border-b border-emerald-900/30 text-xs font-semibold text-emerald-400">
                    <MessageSquare className="w-4 h-4 fill-emerald-500 text-emerald-950" />
                    <span>WhatsApp Chat Simulation</span>
                    <span className="ml-auto text-[10px] text-slate-500">To: {currentStudio?.phone || 'Client'}</span>
                  </div>

                  <div className="bg-[#202c33] text-slate-100 p-3.5 rounded-xl rounded-tl-none font-sans text-xs sm:text-sm whitespace-pre-wrap leading-relaxed shadow-md border border-slate-700/50">
                    {getFormattedMessageText(editingStage, activeEditingText)}
                    
                    <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 mt-2">
                      <span>11:24 AM</span>
                      <span className="text-emerald-400 font-bold">✓✓</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Share & Quick Apply Actions */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStage(editingStage);
                    handleSaveStageTemplate(editingStage);
                    handleWhatsAppSend();
                  }}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  Test Send Stage Message via WhatsApp
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedStage(editingStage);
                    setActiveInvoiceTab('builder');
                    showToast(`Applied ${templates[editingStage]?.stageName} as active stage format!`);
                  }}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                  Set as Active Stage for Current Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ================= INVOICE BUILDER VIEW ================= */
        <>
          {/* ================= HEADER / TOP BAR ================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 print:border-none print:shadow-none print:bg-white print:text-black">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-500" />
            <span className="text-sm text-slate-400 font-medium">Studio:</span>
            {currentUser?.role === 'studio' ? (
              <span className="text-lg font-bold text-white bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                {currentStudio?.name || 'Wedding By KK'}
              </span>
            ) : (
              <select
                value={selectedStudioId}
                onChange={(e) => setSelectedStudioId(e.target.value)}
                className="bg-slate-800 text-amber-400 font-bold text-base sm:text-lg border border-slate-700 rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer"
              >
                {studios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm">
          <div className="bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700/60 flex items-center gap-2">
            <span className="text-slate-400">Invoice No :</span>
            <input
              type="text"
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
              className="bg-transparent font-bold text-amber-400 w-32 outline-none border-b border-transparent hover:border-slate-600 focus:border-amber-500 text-right"
            />
          </div>

          <div className="bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700/60 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span className="text-slate-400">Date :</span>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="bg-transparent font-bold text-slate-200 outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* ================= 5 STATS CARDS ================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-amber-500/30 transition-all">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Projects</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-white mt-2">{totalProjectsCount}</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-emerald-500/30 transition-all">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Business</span>
          <span className="text-xl sm:text-2xl font-extrabold text-emerald-400 mt-2">
            ₹{totalBusiness.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-blue-500/30 transition-all">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Received</span>
          <span className="text-xl sm:text-2xl font-extrabold text-blue-400 mt-2">
            ₹{totalReceived.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-amber-500/30 transition-all">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Outstanding</span>
          <span className="text-xl sm:text-2xl font-extrabold text-amber-400 mt-2">
            ₹{outstanding.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 col-span-2 sm:col-span-1 flex flex-col justify-between hover:border-purple-500/30 transition-all">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Last Payment</span>
          <span className="text-xl sm:text-2xl font-extrabold text-purple-400 mt-2">
            ₹{lastPayment.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* ================= PROJECTS (AUTO LOAD) ================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <Film className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white tracking-wide">PROJECTS (Auto Load)</h3>
          </div>

          <label className="flex items-center gap-2 text-sm text-amber-400 font-semibold cursor-pointer hover:text-amber-300">
            <input
              type="checkbox"
              checked={allProjectsSelected}
              onChange={handleToggleSelectAllProjects}
              className="w-4 h-4 rounded text-amber-500 bg-slate-800 border-slate-700 focus:ring-amber-500 focus:ring-offset-slate-900 cursor-pointer"
            />
            Select All
          </label>
        </div>

        {studioProjects.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            No projects found for {currentStudio?.name || 'this studio'}. You can add projects from the Registry tab.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300 border-collapse">
              <thead>
                <tr className="bg-slate-800/60 border-b border-slate-700 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={allProjectsSelected}
                      onChange={handleToggleSelectAllProjects}
                      className="w-4 h-4 rounded text-amber-500 bg-slate-800 border-slate-700 cursor-pointer"
                    />
                  </th>
                  <th className="p-3">Couple Name</th>
                  <th className="p-3">Project</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {studioProjects.map((p) => {
                  const isChecked = !!selectedProjectIds[p.id];
                  return (
                    <tr
                      key={p.id}
                      onClick={() => handleToggleProject(p.id)}
                      className={`hover:bg-slate-800/40 transition-colors cursor-pointer ${
                        isChecked ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleProject(p.id)}
                          className="w-4 h-4 rounded text-amber-500 bg-slate-800 border-slate-700 cursor-pointer"
                        />
                      </td>
                      <td className="p-3 font-semibold text-white">{p.coupleName}</td>
                      <td className="p-3 text-slate-300">{p.eventType || 'Full Wedding'}</td>
                      <td className="p-3 text-right font-bold text-amber-400">
                        ₹{(p.projectAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                            p.status === 'delivered' || p.status === 'closed'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}
                        >
                          {p.status === 'delivered' ? 'Completed' : p.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Pending
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end pt-3 border-t border-slate-800">
          <div className="text-right">
            <span className="text-slate-400 text-sm mr-3">Project Total :</span>
            <span className="text-xl sm:text-2xl font-black text-amber-400">
              ₹{selectedProjectsTotal.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* ================= ADVANCE PAYMENT HISTORY ================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <IndianRupee className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-white tracking-wide">ADVANCE PAYMENT HISTORY</h3>
          </div>

          <button
            onClick={() => setShowAddAdvanceModal(true)}
            className="flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-xl transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Advance Payment
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-800/60 border-b border-slate-700 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-3">Date</th>
                <th className="p-3">Paid By</th>
                <th className="p-3">Payment Mode</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3 text-center w-20">Adjust</th>
                <th className="p-3 text-center w-16">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {advanceList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-slate-500 text-sm">
                    No advance payments recorded yet. Click "+ Add Advance Payment" to log one.
                  </td>
                </tr>
              ) : (
                advanceList.map((adv) => {
                  const isCash = adv.paymentMode.toLowerCase().includes('cash');
                  return (
                    <tr key={adv.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-medium text-slate-200">
                        {new Date(adv.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="p-3 text-white font-semibold">{adv.paidBy}</td>
                      <td className="p-3">
                        <select
                          value={adv.paymentMode}
                          onChange={(e) => handleUpdateAdvanceMode(adv.id, e.target.value)}
                          className={`text-xs font-bold border rounded-lg px-2.5 py-1 outline-none transition-all cursor-pointer ${
                            isCash
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                              : 'bg-sky-950/80 text-sky-300 border-sky-700/60'
                          }`}
                        >
                          <option value="Cash">💵 Cash</option>
                          <option value="Online (UPI)">💳 Online (UPI / GPay / PhonePe)</option>
                          <option value="Bank Transfer">🏦 Bank Transfer</option>
                          <option value="Cheque">📝 Cheque</option>
                        </select>
                      </td>
                      <td className="p-3 text-right font-bold text-emerald-400">
                        ₹{adv.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={adv.adjusted}
                          onChange={() => handleToggleAdvanceAdjust(adv.id)}
                          className="w-4 h-4 rounded text-emerald-500 bg-slate-800 border-slate-700 cursor-pointer"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleDeleteAdvance(adv.id)}
                          title="Delete Entry"
                          className="text-slate-500 hover:text-red-400 transition-colors p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Cash vs Online Summary Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800 text-xs">
          <div className="bg-emerald-950/40 border border-emerald-800/40 p-2.5 rounded-xl flex items-center justify-between">
            <span className="text-emerald-300 font-medium flex items-center gap-1.5">
              💵 Cash Advance Total:
            </span>
            <span className="font-extrabold text-emerald-400 text-sm">
              ₹{cashAdvanceTotal.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="bg-sky-950/40 border border-sky-800/40 p-2.5 rounded-xl flex items-center justify-between">
            <span className="text-sky-300 font-medium flex items-center gap-1.5">
              💳 Online Advance Total:
            </span>
            <span className="font-extrabold text-sky-400 text-sm">
              ₹{onlineAdvanceTotal.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="bg-amber-950/40 border border-amber-800/40 p-2.5 rounded-xl flex items-center justify-between">
            <span className="text-amber-300 font-medium flex items-center gap-1.5">
              ✨ Total Advance Adjusted:
            </span>
            <span className="font-black text-amber-400 text-base">
              ₹{advanceTotal.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* ================= INVOICE SUMMARY ================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4 relative overflow-hidden">
        {/* Background Watermark Logo - positioned elegantly inside container without clipping */}
        <div className="absolute right-4 bottom-2 pointer-events-none opacity-20 select-none z-0">
          <Logo size={220} showText={true} variant="gold" />
        </div>

        <div className="relative z-10">
          <h3 className="text-lg font-bold text-white tracking-wide border-b border-slate-800 pb-3 mb-4">
            INVOICE SUMMARY
          </h3>

        <div className="max-w-xl ml-auto space-y-3">
          <div className="flex items-center justify-between text-slate-300 py-1">
            <span>Project Total</span>
            <span className="font-bold text-white text-base">₹{selectedProjectsTotal.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex items-center justify-between text-slate-300 py-1">
            <span>Previous Balance</span>
            <div className="flex items-center gap-1">
              <span className="text-slate-400 text-sm">₹</span>
              <input
                type="number"
                value={previousBalance === 0 ? '' : previousBalance}
                onChange={(e) => setPreviousBalance(Number(e.target.value) || 0)}
                placeholder="0"
                className="bg-slate-800 text-white font-semibold border border-slate-700 rounded-lg px-2.5 py-1 text-right w-32 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-slate-300 py-1">
            <span>Advance Adjust</span>
            <span className="font-bold text-emerald-400 text-base">-₹{advanceTotal.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex items-center justify-between text-slate-300 py-1">
            <span>Discount</span>
            <div className="flex items-center gap-1">
              <span className="text-slate-400 text-sm">₹</span>
              <input
                type="number"
                value={discount === 0 ? '' : discount}
                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                placeholder="0"
                className="bg-slate-800 text-white font-semibold border border-slate-700 rounded-lg px-2.5 py-1 text-right w-32 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          </div>

          <div className="border-t-2 border-slate-700 pt-3 mt-2 flex items-center justify-between">
            <span className="text-lg font-black text-white">TOTAL PAYABLE</span>
            <span className="text-2xl sm:text-3xl font-black text-amber-400">
              ₹{totalPayable.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-slate-400 font-medium">Payment Status :</span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              totalPayable === 0 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
            }`}>
              {totalPayable === 0 ? '🟢 Paid in Full' : '🔵 Tax Invoice'}
            </span>
          </div>
        </div>
        </div>
      </div>

      {/* ================= PAYMENT DETAILS ================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
        <h3 className="text-lg font-bold text-white tracking-wide border-b border-slate-800 pb-3">
          PAYMENT DETAILS
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-2 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Account Holder</label>
                <input
                  type="text"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Bank Name</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Account Number</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">IFSC Code</label>
                <input
                  type="text"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">UPI ID</label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-amber-400 font-bold focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          </div>

          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-800/60 rounded-2xl border border-slate-700/60 text-center space-y-2">
            <div className="bg-white p-2.5 rounded-xl shadow-md border border-slate-200">
              <img
                src={qrCodeUrl}
                alt="UPI Payment QR Code"
                className="w-32 h-32 object-contain"
              />
            </div>
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1 mt-1">
              <QrCode className="w-3.5 h-3.5 text-amber-400" />
              Scan & Pay via Any UPI App
            </span>
          </div>
        </div>
      </div>

      {/* ================= DELIVERY ================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
        <h3 className="text-lg font-bold text-white tracking-wide border-b border-slate-800 pb-3">
          DELIVERY
        </h3>

        <div className="space-y-4 text-sm">
          <div>
            <label className="text-xs text-slate-400 block mb-1 font-medium">Google Drive Link</label>
            <input
              type="text"
              value={driveLink}
              onChange={(e) => setDriveLink(e.target.value)}
              placeholder="https://drive.google.com/drive/folders/..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-blue-400 font-medium focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1 font-medium">Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter special instructions or payment terms..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-200 focus:ring-2 focus:ring-amber-500 outline-none resize-none"
            />
          </div>
        </div>
      </div>

      {/* ================= ACTION BUTTONS (BOTTOM BAR) ================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col items-center justify-between gap-3 sticky bottom-4 z-20 backdrop-blur-md bg-slate-900/90 print:hidden">
        {effectivePdfPath && (
          <div className="w-full flex items-center justify-between gap-2 px-3.5 py-2 bg-emerald-950/80 border border-emerald-500/30 rounded-xl text-xs font-mono text-emerald-300 shadow-inner">
            <div className="flex items-center gap-2 overflow-hidden">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">Attached in Firestore: <strong className="text-white">{effectivePdfPath}</strong></span>
            </div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-md shrink-0">
              Ready for WhatsApp
            </span>
          </div>
        )}

        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {toastMessage ? (
            <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-fadeIn">
              <Sparkles className="w-4 h-4 text-amber-400" /> {toastMessage}
            </span>
          ) : saveSuccess ? (
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 animate-fadeIn">
              <Check className="w-4 h-4" /> Draft Saved!
            </span>
          ) : (
            <span className="text-xs text-slate-500 hidden md:inline-block">
              All invoice actions ready & downloadable
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <button
            onClick={() => setShowPreviewModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs sm:text-sm font-semibold border border-slate-700 transition-all active:scale-95 cursor-pointer"
          >
            <Eye className="w-4 h-4 text-amber-400" />
            Preview
          </button>

          <button
            onClick={handleGenerateAndAttachPDF}
            disabled={isGeneratingPdf}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-lg shadow-teal-600/20"
            title="Generate PDF with jsPDF & store file URL in Firestore for WhatsApp link"
          >
            {isGeneratingPdf ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : (
              <FileCheck className="w-4 h-4 text-emerald-200" />
            )}
            {isGeneratingPdf ? 'Attaching...' : 'Generate & Attach PDF'}
          </button>

          <button
            onClick={handleGeneratePDF}
            disabled={isGeneratingPdf}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs sm:text-sm font-semibold border border-slate-700 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isGeneratingPdf ? (
              <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
            ) : (
              <FileText className="w-4 h-4 text-blue-400" />
            )}
            {isGeneratingPdf ? 'Generating PDF...' : 'Generate PDF'}
          </button>

          <button
            onClick={handleWhatsAppSend}
            disabled={isGeneratingPdf}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-lg shadow-emerald-600/20"
          >
            {isGeneratingPdf ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {isGeneratingPdf ? 'Preparing PDF...' : 'Send to WhatsApp'}
          </button>

          <button
            onClick={handleEmailSend}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs sm:text-sm font-semibold border border-slate-700 transition-all active:scale-95 cursor-pointer"
          >
            <Mail className="w-4 h-4 text-purple-400" />
            Email
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs sm:text-sm font-semibold border border-slate-700 transition-all active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-300" />
            Print
          </button>

          <button
            onClick={handleSaveDraft}
            className="flex items-center gap-1.5 px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Save Draft
          </button>
        </div>
      </div>
      </div>

      {/* ================= ADD ADVANCE PAYMENT MODAL ================= */}
      {showAddAdvanceModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Add Advance Payment</h3>
              <button
                onClick={() => setShowAddAdvanceModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdvance} className="space-y-4 text-sm">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Paid By (Payer Name)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Krishna"
                  value={newAdvPaidBy}
                  onChange={(e) => setNewAdvPaidBy(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Payment Mode</label>
                <select
                  value={newAdvMode}
                  onChange={(e) => setNewAdvMode(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 10000"
                  value={newAdvAmount}
                  onChange={(e) => setNewAdvAmount(Number(e.target.value) || '')}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-amber-400 font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={newAdvDate}
                  onChange={(e) => setNewAdvDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddAdvanceModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-lg"
                >
                  Add Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= PREVIEW INVOICE MODAL ================= */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-3xl w-full max-w-3xl p-6 sm:p-10 space-y-6 shadow-2xl my-auto relative print:p-0 overflow-hidden border border-slate-100 font-sans">
            
            {/* Background Watermark Logo */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-15 select-none z-0">
              <Logo size={360} showText={true} variant="gold" />
            </div>

            <div className="relative z-10 space-y-6">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="absolute -top-2 -right-2 p-2 text-slate-400 hover:text-slate-900 print:hidden z-20 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Top Header Banner */}
              <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 text-white rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-amber-500/30">
                <div className="flex items-center gap-3.5">
                  <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20 shrink-0">
                    <Logo size={48} variant="gold" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black tracking-widest text-amber-400 uppercase bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full inline-block mb-1">
                      CINEMATIC WEDDING SUITE & POST PRODUCTION
                    </span>
                    <h1 className="text-xl sm:text-2xl font-black tracking-wider text-white font-display">
                      THE FRAME CUTS STUDIO
                    </h1>
                    <p className="text-[11px] text-slate-300 font-medium">Email: contact@theframecuts.com | Phone: +91 77729 99933</p>
                  </div>
                </div>

                {/* Tax Invoice Pill Badge */}
                <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-slate-950 px-5 py-3.5 rounded-2xl shadow-md text-right min-w-[210px] font-bold">
                  <h2 className="text-lg font-black uppercase tracking-widest text-slate-950">TAX INVOICE</h2>
                  <div className="text-[11px] text-slate-900 space-y-0.5 mt-1 font-mono">
                    <p>Invoice #: <span className="font-extrabold text-slate-950">{invoiceNo}</span></p>
                    <p>Date: <span className="font-extrabold text-slate-950">{invoiceDate}</span></p>
                    <p>Status: <span className="font-black text-emerald-950 bg-emerald-400/80 px-2 py-0.5 rounded-full uppercase text-[9px]">{totalPayable === 0 ? 'PAID IN FULL' : 'PARTIAL / ADVANCE SETTLED'}</span></p>
                  </div>
                </div>
              </div>

              {/* Bill To & Issued By Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50/90 border border-slate-200 rounded-2xl p-4 shadow-xs space-y-1">
                  <span className="text-[10px] uppercase font-black tracking-wider text-orange-600 bg-orange-100/80 px-2.5 py-0.5 rounded-full inline-block mb-1">
                    Invoice To (Client Studio):
                  </span>
                  <p className="text-base font-black text-slate-900">{currentStudio?.name || 'Wedding By KK'}</p>
                  <p className="text-slate-600 font-medium">{currentStudio?.ownerName ? `Attn: ${currentStudio.ownerName}` : 'Attn: Studio Director'}</p>
                  <p className="text-slate-500">{currentStudio?.phone || '+91 98260 00000'}</p>
                  <p className="text-slate-500 text-[10px]">{currentStudio?.email || 'contact@studio.com'}</p>
                </div>

                <div className="bg-slate-50/90 border border-slate-200 rounded-2xl p-4 shadow-xs space-y-1 sm:text-right">
                  <span className="text-[10px] uppercase font-black tracking-wider text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full inline-block mb-1">
                    Payment Receiver (Studio Admin):
                  </span>
                  <p className="text-base font-black text-slate-900">THE FRAME CUTS STUDIO</p>
                  <p className="text-slate-600 font-medium">Satish Tiwari — Founder & Lead Director</p>
                  <p className="text-slate-500">Raipur, Chhattisgarh, India</p>
                  <p className="text-slate-500 text-[10px]">GST / Reg: 22AAAAA0000A1Z5</p>
                </div>
              </div>

              {/* Project Line Items Table */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 text-amber-600" />
                    1. Project Services & Deliverables
                  </h3>
                  <span className="text-[10px] font-mono text-slate-500 font-bold">
                    {studioProjects.filter(p => selectedProjectIds[p.id]).length} Items Selected
                  </span>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-4 py-2.5 flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                    <span className="w-1/2">Project / Event Name</span>
                    <div className="w-1/2 flex justify-between text-right pl-4">
                      <span className="w-12 text-center">Qty</span>
                      <span className="w-24 text-right">Unit Rate</span>
                      <span className="w-24 text-right">Total (₹)</span>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100 bg-white">
                    {studioProjects.filter(p => selectedProjectIds[p.id]).length === 0 ? (
                      <div className="p-4 text-center text-slate-400 text-xs italic">No projects selected for this invoice</div>
                    ) : (
                      studioProjects.filter(p => selectedProjectIds[p.id]).map((p) => (
                        <div key={p.id} className="p-3 flex items-center justify-between text-xs hover:bg-amber-50/30 transition-colors">
                          <div className="w-1/2 pr-4">
                            <p className="font-bold text-slate-900 text-sm">{p.coupleName}</p>
                            <p className="text-slate-500 text-[11px] font-medium">{p.eventType || 'Full Wedding Post-Production & Color Grading'}</p>
                          </div>
                          <div className="w-1/2 flex justify-between items-center text-right pl-4">
                            <span className="w-12 text-center text-slate-600 font-semibold">1</span>
                            <span className="w-24 text-right text-slate-700 font-semibold">₹{p.projectAmount.toLocaleString('en-IN')}</span>
                            <span className="w-24 text-right font-black text-slate-900 text-sm">₹{p.projectAmount.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* ADVANCE PAYMENTS RECEIVED BREAKDOWN SECTION (USER CORE REQUIREMENT) */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                    <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                    2. Advance Payments Received & Mode Breakdown
                  </h3>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Verified Receipts
                  </span>
                </div>

                <div className="border border-emerald-200/80 rounded-2xl overflow-hidden shadow-xs bg-emerald-50/20">
                  <div className="bg-emerald-950 text-white px-4 py-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
                    <span className="w-28">Date</span>
                    <span className="w-36">Received From</span>
                    <span className="w-36 text-center">Payment Mode</span>
                    <span className="w-28 text-right">Advance Amount</span>
                  </div>

                  <div className="divide-y divide-emerald-100 bg-white">
                    {advanceList.filter(a => a.adjusted).length === 0 ? (
                      <div className="p-3 text-center text-slate-400 text-xs italic">No advance payment entries adjusted for this invoice</div>
                    ) : (
                      advanceList.filter(a => a.adjusted).map((adv) => {
                        const isCash = adv.paymentMode.toLowerCase().includes('cash');
                        return (
                          <div key={adv.id} className="px-4 py-2.5 flex items-center justify-between text-xs hover:bg-emerald-50/30 transition-colors">
                            <span className="w-28 font-mono text-slate-700 font-medium">
                              {new Date(adv.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="w-36 font-bold text-slate-900 truncate pr-2">{adv.paidBy}</span>
                            <div className="w-36 text-center">
                              {isCash ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                                  💵 CASH
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-100 text-sky-800 border border-sky-300 inline-flex items-center gap-1">
                                  💳 ONLINE ({adv.paymentMode})
                                </span>
                              )}
                            </div>
                            <span className="w-28 text-right font-black text-emerald-700 text-sm">
                              ₹{adv.amount.toLocaleString('en-IN')}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Advance Payment Mode Summary Bar */}
                  <div className="bg-emerald-950 text-white px-4 py-2.5 flex flex-wrap items-center justify-between text-xs font-semibold gap-2 border-t border-emerald-800">
                    <div className="flex flex-wrap items-center gap-2.5 text-[11px]">
                      <span className="bg-emerald-900/90 px-2.5 py-1 rounded-lg text-emerald-200 border border-emerald-700 flex items-center gap-1">
                        💵 Cash Received: <strong className="text-white font-black">₹{cashAdvanceTotal.toLocaleString('en-IN')}</strong>
                      </span>
                      <span className="bg-sky-900/90 px-2.5 py-1 rounded-lg text-sky-200 border border-sky-700 flex items-center gap-1">
                        💳 Online Received: <strong className="text-white font-black">₹{onlineAdvanceTotal.toLocaleString('en-IN')}</strong>
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-emerald-300 text-[11px] mr-2 font-medium">Total Advance Adjusted:</span>
                      <span className="font-black text-amber-400 text-sm sm:text-base">-₹{advanceTotal.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Payment Info + Summary Ledger */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1 text-xs">
                {/* Left: Payment Info & UPI QR Code */}
                <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 space-y-2 shadow-xs">
                  <h4 className="font-black text-amber-950 uppercase tracking-wider text-xs flex items-center gap-1.5 border-b border-amber-200 pb-1.5">
                    <QrCode className="w-4 h-4 text-amber-700" />
                    Bank & UPI Payment Details
                  </h4>

                  <div className="flex items-start justify-between gap-3 pt-1">
                    <div className="space-y-1 text-slate-800 text-[11px]">
                      <p><span className="text-slate-500 font-medium">A/C Holder Name:</span> <strong className="text-slate-900 block font-bold">{accountHolder}</strong></p>
                      <p><span className="text-slate-500 font-medium">Bank Name:</span> <strong className="text-slate-900 block font-bold">{bankName}</strong></p>
                      <p><span className="text-slate-500 font-medium">Account Number:</span> <strong className="text-slate-900 block font-bold font-mono text-xs">{accountNumber}</strong></p>
                      <p><span className="text-slate-500 font-medium">IFSC Code:</span> <strong className="text-slate-900 block font-bold font-mono">{ifscCode}</strong></p>
                      <p><span className="text-slate-500 font-medium">UPI ID:</span> <strong className="text-amber-800 block font-bold font-mono text-xs">{upiId}</strong></p>
                    </div>

                    {/* QR Code Badge */}
                    <div className="bg-white p-2 rounded-xl border border-amber-300 shadow-sm shrink-0 text-center flex flex-col items-center">
                      <img src={qrCodeUrl} alt="UPI QR Code" className="w-20 h-20 object-contain mx-auto" />
                      <span className="text-[9px] font-bold text-amber-800 uppercase block mt-1 tracking-wider">Scan & Pay UPI</span>
                    </div>
                  </div>
                </div>

                {/* Right: Summary Ledger & Remaining Balance Banner */}
                <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-2 shadow-md flex flex-col justify-between border border-slate-800">
                  <div className="space-y-1.5 text-slate-300 text-xs">
                    <div className="flex justify-between py-0.5 border-b border-slate-800">
                      <span>Sub Total (Selected Projects):</span>
                      <span className="font-extrabold text-white">₹{selectedProjectsTotal.toLocaleString('en-IN')}</span>
                    </div>

                    {previousBalance > 0 && (
                      <div className="flex justify-between py-0.5 border-b border-slate-800">
                        <span>Previous Pending Balance:</span>
                        <span className="font-extrabold text-amber-400">+₹{previousBalance.toLocaleString('en-IN')}</span>
                      </div>
                    )}

                    <div className="flex justify-between py-0.5 border-b border-slate-800 text-emerald-400 font-semibold">
                      <span>Total Advance Adjusted:</span>
                      <span>-₹{advanceTotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 text-right -mt-1 font-mono">
                      (Cash: ₹{cashAdvanceTotal.toLocaleString('en-IN')} | Online: ₹{onlineAdvanceTotal.toLocaleString('en-IN')})
                    </div>

                    {discount > 0 && (
                      <div className="flex justify-between py-0.5 border-b border-slate-800 text-red-400 font-semibold">
                        <span>Special Discount:</span>
                        <span>-₹{discount.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                  </div>

                  {/* REMAINING PAYABLE BALANCE PILL BANNER */}
                  <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 rounded-xl p-3 font-black flex items-center justify-between shadow-lg mt-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-widest text-slate-900 font-extrabold">REMAINING BALANCE DUE</span>
                      <span className="text-xs text-slate-900 font-bold">Net Final Payable Amount</span>
                    </div>
                    <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-slate-950">
                      ₹{totalPayable.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Terms & Conditions + Signature */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-slate-200 text-xs items-end">
                <div>
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block mb-1">Terms & Conditions:</h4>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    {notes || 'Thank you for choosing The Frame Cuts Studio for your post-production & cinematic video editing services. Payment is requested as per agreed project deliverables. All files delivered via Google Drive.'}
                  </p>
                </div>

                <div className="text-right space-y-1 pt-4 sm:pt-0">
                  <div className="w-40 border-b border-slate-800 ml-auto mb-1"></div>
                  <p className="font-black text-slate-900 text-xs uppercase">{currentStudio?.ownerName || 'Satish Tiwari'}</p>
                  <p className="text-[10px] text-amber-800 font-bold uppercase tracking-wider">Authorized Signatory — The Frame Cut Studio</p>
                </div>
              </div>

              {/* Bottom Thanks Banner Badge */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-100">
                <div className="bg-gradient-to-r from-amber-100 to-amber-200 text-amber-950 border border-amber-300 rounded-full px-5 py-1.5 font-black italic text-xs shadow-xs">
                  ✨ Thanks For Your Business! — The Frame Cut Studio
                </div>

                {driveLink && (
                  <div className="text-right text-xs">
                    <span className="font-bold text-slate-700">Google Drive Delivery: </span>
                    <a href={driveLink} target="_blank" rel="noreferrer" className="text-blue-600 underline font-bold">
                      Click to Open Files
                    </a>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-200 print:hidden">
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={handleGenerateAndAttachPDF}
                  disabled={isGeneratingPdf}
                  className="px-5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
                  {isGeneratingPdf ? 'Attaching...' : 'Generate & Attach PDF'}
                </button>
                <button
                  onClick={handleWhatsAppSend}
                  disabled={isGeneratingPdf}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {isGeneratingPdf ? 'Preparing...' : 'Send to WhatsApp'}
                </button>
                <button
                  onClick={handleGeneratePDF}
                  disabled={isGeneratingPdf}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  {isGeneratingPdf ? 'Generating PDF...' : 'Download PDF'}
                </button>
                <button
                  onClick={handlePrint}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Print Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= OFF-SCREEN PRINTABLE INVOICE TEMPLATE (FOR PDF EXPORT) ================= */}
      <div className="fixed top-0 left-[-9999px] pointer-events-none z-[-9999] overflow-visible" aria-hidden="true">
        <div 
          id="printable-invoice-container" 
          ref={printInvoiceRef} 
          className="w-[800px] bg-white text-slate-900 p-8 space-y-6 relative overflow-visible font-sans border border-slate-200"
          style={{ opacity: 1, backgroundColor: '#ffffff', color: '#0f172a', overflow: 'visible' }}
        >
          {/* Background Watermark Logo */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 select-none z-0">
            <Logo size={360} showText={true} variant="gold" />
          </div>

          <div className="relative z-10 space-y-6">
            {/* Top Header Banner */}
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 text-white rounded-2xl p-5 shadow-lg flex justify-between items-center gap-4 border border-amber-500/30">
              <div className="flex items-center gap-3.5">
                <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20 shrink-0">
                  <Logo size={48} variant="gold" />
                </div>
                <div>
                  <span className="text-[9px] font-black tracking-widest text-amber-400 uppercase bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full inline-block mb-1">
                    CINEMATIC WEDDING SUITE & POST PRODUCTION
                  </span>
                  <h1 className="text-2xl font-black tracking-wider text-white font-display">
                    THE FRAME CUTS STUDIO
                  </h1>
                  <p className="text-[11px] text-slate-300 font-medium">Email: contact@theframecuts.com | Phone: +91 77729 99933</p>
                </div>
              </div>

              {/* Tax Invoice Pill Badge */}
              <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-slate-950 px-5 py-3 rounded-2xl shadow-md text-right min-w-[200px] font-bold">
                <h2 className="text-lg font-black uppercase tracking-widest text-slate-950">TAX INVOICE</h2>
                <div className="text-[11px] text-slate-900 space-y-0.5 mt-1 font-mono">
                  <p>Invoice #: <span className="font-extrabold text-slate-950">{invoiceNo}</span></p>
                  <p>Date: <span className="font-extrabold text-slate-950">{invoiceDate}</span></p>
                  <p>Status: <span className="font-black text-emerald-950 bg-emerald-400/80 px-2 py-0.5 rounded-full uppercase text-[9px]">{totalPayable === 0 ? 'PAID IN FULL' : 'PARTIAL / ADVANCE SETTLED'}</span></p>
                </div>
              </div>
            </div>

            {/* Bill To & Issued By Cards */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50/90 border border-slate-200 rounded-2xl p-4 shadow-xs space-y-1">
                <span className="text-[10px] uppercase font-black tracking-wider text-orange-600 bg-orange-100/80 px-2.5 py-0.5 rounded-full inline-block mb-1">
                  Invoice To (Client Studio):
                </span>
                <p className="text-base font-black text-slate-900">{currentStudio?.name || 'Wedding By KK'}</p>
                <p className="text-slate-600 font-medium">{currentStudio?.ownerName ? `Attn: ${currentStudio.ownerName}` : 'Attn: Studio Director'}</p>
                <p className="text-slate-500">{currentStudio?.phone || '+91 98260 00000'}</p>
              </div>

              <div className="bg-slate-50/90 border border-slate-200 rounded-2xl p-4 shadow-xs space-y-1 text-right">
                <span className="text-[10px] uppercase font-black tracking-wider text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full inline-block mb-1">
                  Payment Receiver (Studio Admin):
                </span>
                <p className="text-base font-black text-slate-900">THE FRAME CUTS STUDIO</p>
                <p className="text-slate-600 font-medium">Satish Tiwari — Founder & Lead Director</p>
                <p className="text-slate-500">Raipur, Chhattisgarh, India</p>
              </div>
            </div>

            {/* Project Line Items Table */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-amber-600" />
                  1. Project Services & Deliverables
                </h3>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-4 py-2.5 flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                  <span className="w-1/2">Project / Event Name</span>
                  <div className="w-1/2 flex justify-between text-right pl-4">
                    <span className="w-12 text-center">Qty</span>
                    <span className="w-24 text-right">Unit Rate</span>
                    <span className="w-24 text-right">Total (₹)</span>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 bg-white">
                  {studioProjects.filter(p => selectedProjectIds[p.id]).map((p) => (
                    <div key={p.id} className="p-3 flex items-center justify-between text-xs">
                      <div className="w-1/2 pr-4">
                        <p className="font-bold text-slate-900 text-sm">{p.coupleName}</p>
                        <p className="text-slate-500 text-[11px] font-medium">{p.eventType || 'Full Wedding Post-Production & Color Grading'}</p>
                      </div>
                      <div className="w-1/2 flex justify-between items-center text-right pl-4">
                        <span className="w-12 text-center text-slate-600 font-semibold">1</span>
                        <span className="w-24 text-right text-slate-700 font-semibold">₹{p.projectAmount.toLocaleString('en-IN')}</span>
                        <span className="w-24 text-right font-black text-slate-900 text-sm">₹{p.projectAmount.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ADVANCE PAYMENTS RECEIVED BREAKDOWN SECTION */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                  2. Advance Payments Received & Mode Breakdown
                </h3>
              </div>

              <div className="border border-emerald-200/80 rounded-2xl overflow-hidden shadow-xs bg-emerald-50/20">
                <div className="bg-emerald-950 text-white px-4 py-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
                  <span className="w-28">Date</span>
                  <span className="w-36">Received From</span>
                  <span className="w-36 text-center">Payment Mode</span>
                  <span className="w-28 text-right">Advance Amount</span>
                </div>

                <div className="divide-y divide-emerald-100 bg-white">
                  {advanceList.filter(a => a.adjusted).map((adv) => {
                    const isCash = adv.paymentMode.toLowerCase().includes('cash');
                    return (
                      <div key={adv.id} className="px-4 py-2.5 flex items-center justify-between text-xs">
                        <span className="w-28 font-mono text-slate-700 font-medium">
                          {new Date(adv.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="w-36 font-bold text-slate-900 truncate pr-2">{adv.paidBy}</span>
                        <div className="w-36 text-center">
                          {isCash ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                              💵 CASH
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-100 text-sky-800 border border-sky-300 inline-flex items-center gap-1">
                              💳 ONLINE ({adv.paymentMode})
                            </span>
                          )}
                        </div>
                        <span className="w-28 text-right font-black text-emerald-700 text-sm">
                          ₹{adv.amount.toLocaleString('en-IN')}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Advance Payment Mode Summary Bar */}
                <div className="bg-emerald-950 text-white px-4 py-2.5 flex items-center justify-between text-xs font-semibold gap-2 border-t border-emerald-800">
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="bg-emerald-900 px-2.5 py-1 rounded-lg text-emerald-200 border border-emerald-700">
                      💵 Cash Received: <strong className="text-white font-black">₹{cashAdvanceTotal.toLocaleString('en-IN')}</strong>
                    </span>
                    <span className="bg-sky-900 px-2.5 py-1 rounded-lg text-sky-200 border border-sky-700">
                      💳 Online Received: <strong className="text-white font-black">₹{onlineAdvanceTotal.toLocaleString('en-IN')}</strong>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-300 text-[11px] mr-2">Total Advance Adjusted:</span>
                    <span className="font-black text-amber-400 text-base">-₹{advanceTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Payment Info + Summary Ledger */}
            <div className="grid grid-cols-2 gap-5 pt-1 text-xs">
              {/* Left: Payment Info & UPI QR Code */}
              <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 space-y-2 shadow-xs">
                <h4 className="font-black text-amber-950 uppercase tracking-wider text-xs flex items-center gap-1.5 border-b border-amber-200 pb-1.5">
                  <QrCode className="w-4 h-4 text-amber-700" />
                  Bank & UPI Payment Details
                </h4>

                <div className="flex items-start justify-between gap-3 pt-1">
                  <div className="space-y-1 text-slate-800 text-[11px]">
                    <p><span className="text-slate-500 font-medium">A/C Holder Name:</span> <strong className="text-slate-900 block font-bold">{accountHolder}</strong></p>
                    <p><span className="text-slate-500 font-medium">Bank Name:</span> <strong className="text-slate-900 block font-bold">{bankName}</strong></p>
                    <p><span className="text-slate-500 font-medium">Account Number:</span> <strong className="text-slate-900 block font-bold font-mono text-xs">{accountNumber}</strong></p>
                    <p><span className="text-slate-500 font-medium">IFSC Code:</span> <strong className="text-slate-900 block font-bold font-mono">{ifscCode}</strong></p>
                    <p><span className="text-slate-500 font-medium">UPI ID:</span> <strong className="text-amber-800 block font-bold font-mono text-xs">{upiId}</strong></p>
                  </div>

                  {/* QR Code Badge */}
                  <div className="bg-white p-2 rounded-xl border border-amber-300 shadow-sm shrink-0 text-center flex flex-col items-center">
                    <img src={qrCodeUrl} alt="UPI QR Code" className="w-20 h-20 object-contain mx-auto" />
                    <span className="text-[9px] font-bold text-amber-800 uppercase block mt-1 tracking-wider">Scan & Pay UPI</span>
                  </div>
                </div>
              </div>

              {/* Right: Summary Ledger & Remaining Balance Banner */}
              <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-2 shadow-md flex flex-col justify-between border border-slate-800">
                <div className="space-y-1.5 text-slate-300 text-xs">
                  <div className="flex justify-between py-0.5 border-b border-slate-800">
                    <span>Sub Total (Selected Projects):</span>
                    <span className="font-extrabold text-white">₹{selectedProjectsTotal.toLocaleString('en-IN')}</span>
                  </div>

                  {previousBalance > 0 && (
                    <div className="flex justify-between py-0.5 border-b border-slate-800">
                      <span>Previous Pending Balance:</span>
                      <span className="font-extrabold text-amber-400">+₹{previousBalance.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  <div className="flex justify-between py-0.5 border-b border-slate-800 text-emerald-400 font-semibold">
                    <span>Total Advance Adjusted:</span>
                    <span>-₹{advanceTotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 text-right -mt-1 font-mono">
                    (Cash: ₹{cashAdvanceTotal.toLocaleString('en-IN')} | Online: ₹{onlineAdvanceTotal.toLocaleString('en-IN')})
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between py-0.5 border-b border-slate-800 text-red-400 font-semibold">
                      <span>Special Discount:</span>
                      <span>-₹{discount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>

                {/* REMAINING PAYABLE BALANCE PILL BANNER */}
                <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 rounded-xl p-3 font-black flex items-center justify-between shadow-lg mt-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-widest text-slate-900 font-extrabold">REMAINING BALANCE DUE</span>
                    <span className="text-xs text-slate-900 font-bold">Net Final Payable Amount</span>
                  </div>
                  <span className="text-2xl font-black font-mono tracking-tight text-slate-950">
                    ₹{totalPayable.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Terms & Conditions + Signature */}
            <div className="grid grid-cols-2 gap-6 pt-2 border-t border-slate-200 text-xs items-end">
              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block mb-1">Terms & Conditions:</h4>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  {notes || 'Thank you for choosing The Frame Cuts Studio for your post-production & cinematic video editing services. Payment is requested as per agreed project deliverables. All files delivered via Google Drive.'}
                </p>
              </div>

              <div className="text-right space-y-1">
                <div className="w-40 border-b border-slate-800 ml-auto mb-1"></div>
                <p className="font-black text-slate-900 text-xs uppercase">{currentStudio?.ownerName || 'Satish Tiwari'}</p>
                <p className="text-[10px] text-amber-800 font-bold uppercase tracking-wider">Authorized Signatory — The Frame Cut Studio</p>
              </div>
            </div>

            {/* Bottom Thanks Banner Badge */}
            <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
              <div className="bg-gradient-to-r from-amber-100 to-amber-200 text-amber-950 border border-amber-300 rounded-full px-5 py-1.5 font-black italic text-xs shadow-xs">
                ✨ Thanks For Your Business! — The Frame Cut Studio
              </div>

              {driveLink && (
                <div className="text-right text-xs">
                  <span className="font-bold text-slate-700">Google Drive Delivery: </span>
                  <a href={driveLink} target="_blank" rel="noreferrer" className="text-blue-600 underline font-bold">
                    {driveLink}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ================= SAVED INVOICE DRAFTS ================= */}
      {invoices.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 print:hidden">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-500" /> Saved Invoices & Drafts History
            </h3>
            <span className="text-xs font-mono font-bold bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full border border-amber-500/20">
              {invoices.length} Saved
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {invoices.map((inv) => (
              <div key={inv.id} className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3 hover:border-amber-500/30 transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-mono text-amber-400 font-bold">{inv.invoiceNo}</span>
                    <h4 className="text-sm font-bold text-white mt-0.5">{inv.studioName || 'Studio Invoice'}</h4>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{inv.date}</p>
                  </div>
                  <span className="text-sm font-extrabold text-emerald-400">
                    ₹{(inv.totalPayable || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-slate-800/80 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (inv.invoiceNo) setInvoiceNo(inv.invoiceNo);
                      if (inv.date) setInvoiceDate(inv.date);
                      if (inv.studioId) setSelectedStudioId(inv.studioId);
                      if (inv.notes) setNotes(inv.notes);
                      if (inv.driveLink) setDriveLink(inv.driveLink);
                      showToast(`Loaded invoice ${inv.invoiceNo}`);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-amber-500/20 text-amber-300 text-xs font-mono font-bold transition-colors cursor-pointer"
                  >
                    Load Invoice
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (onDeleteInvoiceDraft && inv.id) {
                        await onDeleteInvoiceDraft(inv.id);
                        showToast(`Deleted invoice draft ${inv.invoiceNo}`);
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-red-400 text-xs font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
        </>
      )}

    </div>
  );
}
