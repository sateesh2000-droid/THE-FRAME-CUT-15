import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  Printer, 
  Share2, 
  Send, 
  Check, 
  IndianRupee, 
  FileText, 
  ChevronRight, 
  Mail, 
  Phone,
  Settings,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SwipeableCard from './SwipeableCard';
import { Project, Studio, Invoice } from '../types';
import Logo from './Logo';
import { jsPDF } from 'jspdf';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';

interface InvoiceViewProps {
  projects: Project[];
  studios: Studio[];
  invoices: Invoice[];
  onAddInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt'>) => Promise<void>;
  onDeleteInvoice?: (id: string) => Promise<void>;
  onUpdateInvoice?: (id: string, updates: Partial<Invoice>) => Promise<void>;
}

export default function InvoiceView({
  projects,
  studios,
  invoices,
  onAddInvoice,
  onDeleteInvoice,
  onUpdateInvoice
}: InvoiceViewProps) {
  const [selectedStudioId, setSelectedStudioId] = useState<string>('');
  const [discount, setDiscount] = useState<number>(0);
  const [includeGst, setIncludeGst] = useState<boolean>(true);
  const [invoiceId, setInvoiceId] = useState<string>('');
  const [upiId, setUpiId] = useState<string>('');
  const [paymentLink, setPaymentLink] = useState<string>('');
  const [qrType, setQrType] = useState<'upi' | 'link'>('upi');
  
  // Custom Toast and confirmation state
  const [invoiceToDeleteId, setInvoiceToDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ title: string; desc: string; type: 'success' | 'info' } | null>(null);

  const triggerToast = (title: string, desc: string, type: 'success' | 'info' = 'success') => {
    setToast({ title, desc, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Simulated Email Notification state
  const [isSimulatingEmail, setIsSimulatingEmail] = useState(false);
  const [simulationStep, setSimulationStep] = useState<number>(0);
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);
  const [showSimulationModal, setShowSimulationModal] = useState<boolean>(false);
  
  // Loaded state based on selected studio
  const [currentStudio, setCurrentStudio] = useState<Studio | null>(null);

  useEffect(() => {
    if (studios.length > 0 && !selectedStudioId) {
      setSelectedStudioId(studios[0].id);
    }
  }, [studios, selectedStudioId]);

  // Derive projects dynamically on every render to ensure always up-to-date and avoid stale state
  const studioProjects = projects.filter(p => p.studioId === selectedStudioId);

  // Keep track of the studio ID that we last loaded credentials for to avoid over-writing user inputs
  const [lastLoadedStudioId, setLastLoadedStudioId] = useState<string>('');

  useEffect(() => {
    const studio = studios.find(s => s.id === selectedStudioId) || null;
    setCurrentStudio(studio);
    if (studio) {
      // Auto invoice ID with a clean, dynamic prefix from the studio's name
      const cleanPrefix = studio.name.trim().slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'ST');
      setInvoiceId(`INV-2026-${cleanPrefix}`);

      // Sync payment info from studio profile ONLY if selectedStudioId has changed
      if (selectedStudioId !== lastLoadedStudioId) {
        setUpiId(studio.upiId || '7772999933@icici');
        setPaymentLink(studio.paymentLink || '');
        setQrType(studio.upiId ? 'upi' : (studio.paymentLink ? 'link' : 'upi'));
        setLastLoadedStudioId(selectedStudioId);
      }
    } else {
      if (selectedStudioId !== lastLoadedStudioId) {
        setUpiId('7772999933@icici');
        setPaymentLink('');
        setLastLoadedStudioId(selectedStudioId);
      }
    }
  }, [selectedStudioId, studios, lastLoadedStudioId]);

  // Calculations across all studio projects
  const subtotal = studioProjects.reduce((sum, p) => sum + p.projectAmount, 0);
  const advance = studioProjects.reduce((sum, p) => sum + p.advancePayment, 0);
  const gstRate = 0.18; // 18% GST for services
  const gstAmount = includeGst ? Math.round((subtotal - discount) * gstRate) : 0;
  const totalAmount = subtotal - discount + gstAmount;
  // User requested to remove Advance Paid from Invoice, so displayed balance due is the total amount
  const balanceDue = totalAmount;

  const getQrCodeData = () => {
    if (qrType === 'upi' && upiId) {
      const payeeName = upiId.trim() === '7772999933@icici' ? 'SATISH TIWARI' : 'THE FRAME CUT';
      return `upi://pay?pa=${upiId.trim()}&pn=${encodeURIComponent(payeeName)}&am=${balanceDue}&cu=INR&tn=${encodeURIComponent('Invoice ' + invoiceId)}`;
    }
    if (qrType === 'link' && paymentLink) {
      return paymentLink.trim();
    }
    return '';
  };

  const qrData = getQrCodeData();

  // Invoice generator handlers
  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    if (!currentStudio) return '';

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Helper to draw the exact vector logo matching Logo.tsx
    const drawLogoInPDF = (pdfDoc: any, x: number, y: number, size: number, colorOverride?: string) => {
      const scale = size / 100;
      pdfDoc.saveGraphicsState();
      const drawColor = colorOverride || '#C5A059';
      pdfDoc.setDrawColor(drawColor);
      
      // Horizontal base line: from (23, 50) to (77, 50)
      const x1 = x + 23 * scale;
      const y1 = y + 50 * scale;
      const x2 = x + 77 * scale;
      const y2 = y + 50 * scale;
      pdfDoc.setLineWidth(2.8 * scale);
      pdfDoc.line(x1, y1, x2, y2);
      
      // Left vertical stem of F: from (32, 28) to (32, 49)
      pdfDoc.setLineWidth(3.2 * scale);
      pdfDoc.line(x + 32 * scale, y + 28 * scale, x + 32 * scale, y + 49 * scale);
      
      // Middle crossbar of F: from (32, 38.5) to (43.5, 38.5)
      pdfDoc.line(x + 32 * scale, y + 38.5 * scale, x + 43.5 * scale, y + 38.5 * scale);
      
      // Inner arch line segment: from (53, 49) to (53, 68)
      pdfDoc.line(x + 53 * scale, y + 49 * scale, x + 53 * scale, y + 68 * scale);
      
      // Outer arch line segment: from (61.5, 41.5) to (61.5, 68)
      pdfDoc.line(x + 61.5 * scale, y + 41.5 * scale, x + 61.5 * scale, y + 68 * scale);
      
      // Draw Inner Arch (smooth curve):
      const innerArchPts = [];
      for (let a = 270; a <= 360; a += 5) {
        const rad = (a * Math.PI) / 180;
        const px = 32 + 21 * Math.cos(rad);
        const py = 49 + 21 * Math.sin(rad);
        innerArchPts.push({ x: x + px * scale, y: y + py * scale });
      }
      for (let i = 0; i < innerArchPts.length - 1; i++) {
        pdfDoc.line(innerArchPts[i].x, innerArchPts[i].y, innerArchPts[i+1].x, innerArchPts[i+1].y);
      }
      
      // Draw Outer Arch (smooth curve):
      const outerArchPts = [];
      for (let a = 270; a <= 360; a += 5) {
        const rad = (a * Math.PI) / 180;
        const px = 47.5 + 14 * Math.cos(rad);
        const py = 41.5 + 17 * Math.sin(rad);
        outerArchPts.push({ x: x + px * scale, y: y + py * scale });
      }
      for (let i = 0; i < outerArchPts.length - 1; i++) {
        pdfDoc.line(outerArchPts[i].x, outerArchPts[i].y, outerArchPts[i+1].x, outerArchPts[i+1].y);
      }

      // Small bottom-left dot: circle cx="32", cy="57", r="1.8"
      pdfDoc.setFillColor(drawColor);
      pdfDoc.ellipse(x + 32 * scale, y + 57 * scale, 1.8 * scale, 1.8 * scale, 'F');
      
      pdfDoc.restoreGraphicsState();
    };

    // Helper to draw clean watermark on any PDF page
    const drawWatermarkOnPDFPage = (pdfDoc: any) => {
      drawLogoInPDF(pdfDoc, 55, 105, 100, '#FDFBFA');
      pdfDoc.setFont('Helvetica', 'bold');
      pdfDoc.setFontSize(11);
      pdfDoc.setTextColor('#EFE8D9');
      pdfDoc.text('THE FRAME CUT', 105, 185, { align: 'center' });
      
      pdfDoc.setFont('Helvetica', 'bold');
      pdfDoc.setFontSize(8);
      pdfDoc.setTextColor('#F5EDE0');
      pdfDoc.text('CONFIDENTIAL STATEMENT', 105, 191, { align: 'center' });
    };

    // Brand Colors
    const primaryColor = '#111827'; // Luxurious Dark Charcoal
    const accentColor = '#C5A059'; // Metallic Gold
    const textColor = '#374151'; // Charcoal Gray
    const fillBgColor = '#F6F3EB'; // Soft champagne cream

    // Set font size & styling and draw premium vector logo mark
    drawLogoInPDF(doc, 13, 14, 15);

    doc.setTextColor(primaryColor);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('THE FRAME CUT', 28, 24);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor('#C5A059'); // Gold accent
    doc.text('CINEMATIC VIDEO POST-PRODUCTION SUITES', 28, 28);

    // Header Right - INVOICE
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(primaryColor);
    doc.text('INVOICE', 195, 25, { align: 'right' });

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor('#C5A059');
    doc.text(invoiceId, 195, 30, { align: 'right' });

    // Date and terms
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor('#6B7280');
    doc.text(`Date: ${new Date().toISOString().split('T')[0]}`, 195, 35, { align: 'right' });
    doc.text('Due on Delivery', 195, 39, { align: 'right' });

    // Company info left
    doc.text('Satish Tiwari, Managing Admin', 15, 42);
    doc.text('Mumbai, Maharashtra, India', 15, 46);
    doc.text('satish@framecut.com | +91 98333 44455', 15, 50);

    // Divider line
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.line(15, 56, 195, 56);

    // Billed To & Assignment Summary
    // Left column: Billed To
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor('#9CA3AF');
    doc.text('BILLED TO PARTNER', 15, 65);

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor('#111827');
    doc.text(currentStudio.name, 15, 71);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor('#4B5563');
    doc.text(`Owner: ${currentStudio.ownerName || 'Billed Studio Partner'}`, 15, 76);
    doc.text(currentStudio.address || 'India', 15, 81);
    doc.text(currentStudio.phone || '', 15, 86);
    if (currentStudio.gstNumber) {
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor('#6B7280');
      doc.text(`GSTIN: ${currentStudio.gstNumber}`, 15, 92);
    }

    // Right column: Brand Logo
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor('#9CA3AF');
    doc.text('OFFICIAL BRAND IDENTITY', 115, 65);

    // Draw the beautiful vector logo matching the user's uploaded asset
    drawLogoInPDF(doc, 137, 66, 26);

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor('#111827');
    doc.text('THE FRAME CUT', 150, 91, { align: 'center' });

    // BACKGROUND WATERMARK WITH 25% TRANSPARENCY
    // Draw the beautiful vector logo watermark with confidential statement
    drawWatermarkOnPDFPage(doc);

    // Divider line
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.line(15, 98, 195, 98);

    // Table Header
    doc.setFillColor('#F3F4F6');
    doc.rect(15, 104, 180, 8, 'F');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor('#4B5563');
    doc.text('Wedding Project / Couple & Details', 18, 109.5);
    doc.text('Cinematic Deliverables', 85, 109.5);
    doc.text('Budget', 192, 109.5, { align: 'right' });

    // Helper to draw consistent footer with or without signature
    const drawFooterOnPage = (pdfDoc: any, pageNum: number, isLastPage: boolean) => {
      const sigY = 245;
      pdfDoc.setDrawColor(209, 213, 219);
      pdfDoc.setLineWidth(0.3);
      pdfDoc.line(15, sigY, 195, sigY);

      pdfDoc.setFont('Helvetica', 'normal');
      pdfDoc.setFontSize(8);
      pdfDoc.setTextColor('#9CA3AF');
      pdfDoc.text('System Generated Consolidated Invoicing Statement', 15, sigY + 8);
      pdfDoc.text(`The Frame Cut Studio OS © 2026 | Page ${pageNum}`, 15, sigY + 12);

      if (isLastPage) {
        // Signature right
        pdfDoc.setFont('Helvetica', 'italic');
        pdfDoc.setFontSize(11);
        pdfDoc.setTextColor('#4B5563');
        pdfDoc.text('Satish Tiwari', 165, sigY + 8, { align: 'center' });
        
        pdfDoc.setDrawColor(209, 213, 219);
        pdfDoc.setLineWidth(0.3);
        pdfDoc.line(145, sigY + 10, 185, sigY + 10);

        pdfDoc.setFont('Helvetica', 'bold');
        pdfDoc.setFontSize(7.5);
        pdfDoc.setTextColor('#9CA3AF');
        pdfDoc.text('AUTHORIZED MANAGER SIGNATURE', 165, sigY + 14, { align: 'center' });
      }
    };

    // Table Rows
    let currentPageNum = 1;
    let currentY = 118;

    studioProjects.forEach((p) => {
      const pageLimit = (currentPageNum === 1) ? 205 : 225;

      if (currentY > pageLimit) {
        // Draw non-last page footer
        drawFooterOnPage(doc, currentPageNum, false);
        
        // Add a new page
        doc.addPage();
        currentPageNum++;

        // Draw background watermark
        drawWatermarkOnPDFPage(doc);

        // Running Header
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(primaryColor);
        doc.text('THE FRAME CUT', 15, 18);

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor('#C5A059');
        doc.text(`CONSOLIDATED STATEMENT - ${invoiceId}`, 15, 22);

        // Date on right
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor('#6B7280');
        doc.text(`Date: ${new Date().toISOString().split('T')[0]}`, 195, 18, { align: 'right' });

        // Simplified Table Header
        doc.setFillColor('#F3F4F6');
        doc.rect(15, 27, 180, 8, 'F');

        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor('#4B5563');
        doc.text('Wedding Project / Couple & Details (Continued)', 18, 32);
        doc.text('Cinematic Deliverables', 85, 32);
        doc.text('Budget', 192, 32, { align: 'right' });

        currentY = 41;
      }

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor('#111827');
      doc.text(p.coupleName, 18, currentY);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor('#6B7280');
      doc.text(`Shoot: ${p.shootDate}`, 18, currentY + 4);

      // Draw Cinematic Deliverables at x = 85 with '+' formatting
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor('#4B5563');
      const deliverablesText = p.eventType ? p.eventType.replace(/, /g, ' + ') : 'Wedding Film';
      const lines = doc.splitTextToSize(deliverablesText, 95);
      doc.text(lines, 85, currentY);

      // Draw Budget at x = 192 (right-aligned)
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor('#111827');
      doc.text(`INR ${p.projectAmount.toLocaleString('en-IN')}`, 192, currentY, { align: 'right' });

      const rowHeight = Math.max(12, 6 + (lines.length * 3.5));
      // Row separator
      doc.setDrawColor(243, 244, 246);
      doc.setLineWidth(0.3);
      doc.line(15, currentY + rowHeight - 5, 195, currentY + rowHeight - 5);
      currentY += rowHeight;
    });

    if (studioProjects.length === 0) {
      doc.setFont('Helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor('#9CA3AF');
      doc.text('No active wedding projects found in company registry.', 105, 125, { align: 'center' });
      currentY = 135;
    }

    // Determine bottom sections start point dynamically
    let bottomY: number;
    if (currentPageNum === 1) {
      if (currentY > 190) {
        // Draw current page footer
        drawFooterOnPage(doc, currentPageNum, false);
        doc.addPage();
        currentPageNum++;

        // Draw background watermark
        drawWatermarkOnPDFPage(doc);

        // Running Header
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(primaryColor);
        doc.text('THE FRAME CUT', 15, 18);

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor('#C5A059');
        doc.text(`CONSOLIDATED STATEMENT - ${invoiceId}`, 15, 22);

        bottomY = 32;
      } else {
        bottomY = Math.max(currentY + 6, 150);
      }
    } else {
      if (currentY > 190) {
        drawFooterOnPage(doc, currentPageNum, false);
        doc.addPage();
        currentPageNum++;

        // Draw background watermark
        drawWatermarkOnPDFPage(doc);

        // Running Header
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(primaryColor);
        doc.text('THE FRAME CUT', 15, 18);

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor('#C5A059');
        doc.text(`CONSOLIDATED STATEMENT - ${invoiceId}`, 15, 22);

        bottomY = 32;
      } else {
        bottomY = currentY + 6;
      }
    }

    // Bottom Divider
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.line(15, bottomY, 195, bottomY);

    // Bottom Calculations & Terms
    // Left: Terms
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(accentColor); // Premium gold
    doc.text('TERMS & SETTLEMENTS', 15, bottomY + 10);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor('#6B7280');
    
    let termsText = 'Consolidated ledger statement of active post-production. Please clear remaining balance dues for final raw assets delivery.';
    
    termsText += '\n\nBANK TRANSFER DETAILS:';
    termsText += '\n- Bank Name: ICICI BANK';
    termsText += '\n- Account Holder: SATISH TIWARI';
    termsText += '\n- Account Number: 390701503993';
    termsText += '\n- IFSC Code: ICIC0003907';
    termsText += '\n- Account Type: Savings';
    termsText += `\n- VPA (UPI ID): ${upiId ? upiId.trim() : '7772999933@icici'}`;
    
    if (paymentLink) {
      termsText += `\n- Direct Gateway: ${paymentLink.trim()}`;
    }
    const splitTerms = doc.splitTextToSize(termsText, 80);
    doc.text(splitTerms, 15, bottomY + 15);

    // Right: Calculations
    let calcY = bottomY + 10;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor('#4B5563');
    doc.text('SUBTOTAL:', 125, calcY);
    doc.setFont('Helvetica', 'bold');
    doc.text(`INR ${subtotal.toLocaleString('en-IN')}`, 192, calcY, { align: 'right' });

    if (discount > 0) {
      calcY += 6;
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor('#EF4444');
      doc.text('DISCOUNT:', 125, calcY);
      doc.setFont('Helvetica', 'bold');
      doc.text(`- INR ${discount.toLocaleString('en-IN')}`, 192, calcY, { align: 'right' });
    }

    if (includeGst) {
      calcY += 6;
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor('#4B5563');
      doc.text('GST (18% Service):', 125, calcY);
      doc.setFont('Helvetica', 'bold');
      doc.text(`INR ${gstAmount.toLocaleString('en-IN')}`, 192, calcY, { align: 'right' });
    }

    // Total Due
    calcY += 8;
    doc.setFillColor(fillBgColor); // Soft champagne cream
    doc.rect(122, calcY - 5, 73, 8, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor('#111827');
    doc.text('TOTAL AMOUNT DUE:', 125, calcY);
    doc.setFont('Helvetica', 'extrabold');
    doc.text(`INR ${totalAmount.toLocaleString('en-IN')}`, 192, calcY, { align: 'right' });

    // Capture and embed payment QR Code inside the PDF
    const qrCanvas = document.getElementById('invoice-qr-canvas') as HTMLCanvasElement | null;
    const qrImage = qrCanvas ? qrCanvas.toDataURL('image/png') : null;

    if (qrImage) {
      const qrBoxY = calcY + 5;
      const qrBoxHeight = 35;
      
      // Ensure we don't overlap the page footer signature block
      if (qrBoxY + qrBoxHeight < 240) {
        // Draw background box for QR Code section in soft champagne/cream
        doc.setFillColor('#FAF7F0');
        doc.roundedRect(122, qrBoxY, 73, qrBoxHeight, 3, 3, 'F');
        
        // Draw gold border
        doc.setDrawColor(197, 160, 89);
        doc.setLineWidth(0.25);
        doc.roundedRect(122, qrBoxY, 73, qrBoxHeight, 3, 3, 'D');
        
        // Draw QR Image
        doc.addImage(qrImage, 'PNG', 124, qrBoxY + 3, 29, 29);
        
        // Draw Text next to QR Image inside the box
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor('#C5A059');
        const headerText = qrType === 'upi' ? 'UPI INSTANT SETTLEMENT' : 'DIRECT PAYMENT LINK';
        doc.text(headerText, 156, qrBoxY + 8);
        
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor('#111827');
        const actionText = qrType === 'upi' ? 'Scan to Pay Balance' : 'Scan to Open Link';
        doc.text(actionText, 156, qrBoxY + 13);
        
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor('#6B7280');
        const detailText = qrType === 'upi' ? `UPI: ${upiId}` : (paymentLink.length > 25 ? paymentLink.substring(0, 22) + '...' : paymentLink);
        doc.text(detailText, 156, qrBoxY + 18);
        
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor('#10B981');
        const balanceText = qrType === 'upi' ? `Pre-filled: INR ${balanceDue.toLocaleString('en-IN')}` : 'Online Cards Accepted';
        doc.text(balanceText, 156, qrBoxY + 24);
      }
    }

    // Draw final page footer with signature block
    drawFooterOnPage(doc, currentPageNum, true);

    // Save/Download the PDF
    const filename = `${invoiceId}-${currentStudio.name.replace(/\s+/g, '_')}.pdf`;
    doc.save(filename);
    return filename;
  };

  const handleShareWhatsApp = () => {
    if (!currentStudio) return;

    let pdfFilename = '';
    try {
      pdfFilename = handleExportPDF();
    } catch (err) {
      console.error('PDF generation failed:', err);
    }

    const msg = `*THE FRAME CUT STUDIO OS - CONSOLIDATED LEDGER*%0A%0AInvoice ID: *${invoiceId}*%0APartner Studio: *${currentStudio.name}*%0ATotal Projects: *${studioProjects.length}*%0A%0A*Billing Summary:*%0AContract Value: ₹${subtotal.toLocaleString('en-IN')}%0A*Total Amount Due: ₹${totalAmount.toLocaleString('en-IN')}*%0A%0A📥 _Consolidated invoice statement PDF (${pdfFilename || 'Studio_Statement.pdf'}) has been generated and saved._%0A%0APlease clear outstanding balance before final master transfers. Thank you!`;
    window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
    triggerToast("PDF Export & WhatsApp", "Consolidated invoice PDF downloaded and shared via WhatsApp!");
  };

  const handleShareEmail = () => {
    if (!currentStudio) return;
    const subject = `Consolidated Wedding Post-Production Statement: ${invoiceId} - ${currentStudio.name}`;
    const body = `Dear ${currentStudio.ownerName || 'Partner'},\n\nPlease find the outstanding consolidated invoice statement for your studio.\n\nTotal Projects: ${studioProjects.length}\nTotal Budget Value: INR ${subtotal.toLocaleString('en-IN')}\nTotal Amount Due: INR ${totalAmount.toLocaleString('en-IN')}\n\nPlease clear the balance due to proceed with master video downloads.\n\nBest regards,\nSatish Tiwari\nThe Frame Cut Studio OS`;
    window.open(`mailto:${currentStudio.email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const handleSimulateEmailNotification = () => {
    if (!currentStudio) return;
    
    setShowSimulationModal(true);
    setIsSimulatingEmail(true);
    setSimulationStep(1);
    setSimulationLogs(['[System] Initializing secure invoice dispatch module...']);

    // Step 1: Generate invoice link
    setTimeout(() => {
      const link = `https://theframecutstudio.web.app/public/invoice/${invoiceId}`;
      setSimulationStep(2);
      setSimulationLogs(prev => [
        ...prev,
        `[LinkGen] Generated secure client payment link: ${link}`,
        `[System] Composing automated notification dispatch for studio "${currentStudio.name}"...`
      ]);
    }, 1200);

    // Step 2: Establish connection
    setTimeout(() => {
      setSimulationStep(3);
      setSimulationLogs(prev => [
        ...prev,
        `[MailRelay] Connecting to SMTP mail dispatch relay...`,
        `[MailRelay] Secure handshake established with client email server: ${currentStudio.email || 'info@alliedstudio.com'}`
      ]);
    }, 2500);

    // Step 3: Send
    setTimeout(() => {
      setSimulationStep(4);
      setSimulationLogs(prev => [
        ...prev,
        `[SMTP] Sending message: "Wedding Post-Production Invoice: ${invoiceId} - ${currentStudio.name}"`,
        `[SMTP] Delivery status: DELIVERED (250 OK Response)`
      ]);
    }, 4000);

    // Step 4: Finish
    setTimeout(() => {
      setSimulationStep(5);
      setIsSimulatingEmail(false);
      setSimulationLogs(prev => [
        ...prev,
        `[System] Notification audit logged. Email dispatched successfully to ${currentStudio.email || 'info@alliedstudio.com'}!`
      ]);
    }, 5200);
  };

  const handleRegisterInvoice = async () => {
    if (!currentStudio) return;
    
    const dbBalanceDue = Math.max(0, totalAmount - advance);

    await onAddInvoice({
      projectId: 'CONSOLIDATED',
      coupleName: `Consolidated - ${studioProjects.length} Projects`,
      studioId: currentStudio.id,
      studioName: currentStudio.name,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: 'Upon Delivery',
      subtotal,
      gstAmount,
      discount,
      totalAmount,
      amountPaid: advance,
      balanceDue: dbBalanceDue,
      gstNumber: currentStudio.gstNumber || undefined,
      status: dbBalanceDue <= 0 ? 'paid' : 'sent'
    });

    triggerToast("Invoice Saved", "Consolidated studio invoice registered in company ledger!");
  };

  return (
    <div className="space-y-6">
      
      {/* Top selection bar */}
      <div className="p-6 rounded-3xl glass-panel relative print:hidden space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1.5">Select Studio Partner</label>
            <select
              id="invoice-studio-select"
              value={selectedStudioId}
              onChange={(e) => setSelectedStudioId(e.target.value)}
              className="w-full bg-charcoal-900 border border-luxury-green-800/30 rounded-2xl p-3 text-xs text-gray-300 focus:outline-none focus:border-gold-500/40"
            >
              {studios.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({projects.filter(p => p.studioId === s.id).length} Projects)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1.5">Discount Override (INR)</label>
            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
              className="w-full bg-charcoal-900 border border-luxury-green-800/30 rounded-2xl p-3 text-xs text-white focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-3 mt-4 md:mt-0">
            <input
              type="checkbox"
              id="gst-toggle"
              checked={includeGst}
              onChange={(e) => setIncludeGst(e.target.checked)}
              className="w-4.5 h-4.5 rounded text-gold-500 focus:ring-0 bg-charcoal-900 border-luxury-green-800"
            />
            <label htmlFor="gst-toggle" className="text-xs text-gray-300 font-medium cursor-pointer">
              Apply 18% GST (Service Tax)
            </label>
          </div>
        </div>

        {/* Dynamic Billing QR Configuration Row */}
        <div className="border-t border-white/5 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-3 text-left">
              <span className="text-[10px] font-mono text-gold-400 uppercase tracking-wider block font-bold">Dynamic Payment QR Code</span>
              <span className="text-[9px] text-gray-400 leading-normal block mt-1">Configure UPI/Payment link on-the-fly to embed in client invoice.</span>
            </div>

            <div className="md:col-span-3">
              <label className="block text-[9px] font-mono text-gray-400 uppercase mb-1">Active QR Mode</label>
              <div className="flex space-x-1.5 p-1 bg-black/40 rounded-xl border border-white/5">
                <button
                  type="button"
                  onClick={() => setQrType('upi')}
                  className={`flex-1 text-[9px] font-mono py-1 rounded-lg text-center font-bold transition-all cursor-pointer ${
                    qrType === 'upi' ? 'bg-[#d4af37]/15 text-gold-400 border border-gold-500/20' : 'text-gray-400 hover:text-white border border-transparent'
                  }`}
                >
                  UPI Pay
                </button>
                <button
                  type="button"
                  onClick={() => setQrType('link')}
                  className={`flex-1 text-[9px] font-mono py-1 rounded-lg text-center font-bold transition-all cursor-pointer ${
                    qrType === 'link' ? 'bg-[#d4af37]/15 text-gold-400 border border-gold-500/20' : 'text-gray-400 hover:text-white border border-transparent'
                  }`}
                >
                  Direct Link
                </button>
              </div>
            </div>

            <div className="md:col-span-3">
              <label className="block text-[9px] font-mono text-gray-400 uppercase mb-1">
                {qrType === 'upi' ? 'UPI ID (Amount Pre-filled)' : 'Web Gateway URL'}
              </label>
              <input
                type="text"
                value={qrType === 'upi' ? upiId : paymentLink}
                onChange={(e) => {
                  if (qrType === 'upi') {
                    setUpiId(e.target.value);
                  } else {
                    setPaymentLink(e.target.value);
                  }
                }}
                placeholder={qrType === 'upi' ? 'e.g. sateeshtiwari@okaxis' : 'e.g. https://razorpay.me/@studio'}
                className="w-full bg-charcoal-900 border border-luxury-green-800/20 rounded-xl px-3 py-1.5 text-[10px] text-white focus:outline-none placeholder-gray-600 font-mono"
              />
            </div>

            <div className="md:col-span-3 flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-[10px] text-gray-300 font-mono leading-relaxed">
                {qrData ? 'QR Embedded Successfully' : 'No Payment Configured'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Receipt Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Printable Invoice Page */}
        <div className="xl:col-span-2 p-10 rounded-[32px] bg-gradient-to-b from-[#FCFBF7] to-[#FAF6EE] text-charcoal-950 shadow-[0_24px_70px_-12px_rgba(197,160,89,0.12)] relative border border-gold-500/20 max-w-3xl mx-auto w-full min-h-[820px] flex flex-col justify-between overflow-hidden print:overflow-visible print:h-auto print:min-h-0 print:border-0 print:shadow-none print:p-0 printable-invoice-container">
          
          {/* Delicate Inset Gold Double Frame for Luxury Aesthetic */}
          <div className="absolute inset-4 rounded-[24px] border border-gold-500/10 pointer-events-none select-none z-0 print:hidden" />
          
          {/* Watermark Background Logo (6% Transparency) */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] pointer-events-none select-none z-0 print:hidden">
            <Logo size={360} variant="gold" className="transform -rotate-12 scale-110" />
          </div>

          {/* Repeating Watermark across printed pages (position: fixed is respected by browsers in print) */}
          <div className="hidden print:flex fixed inset-0 items-center justify-center pointer-events-none z-0 select-none overflow-hidden print-watermark-wrapper" style={{ position: 'fixed', zIndex: 0 }}>
            <div className="text-center transform -rotate-[35deg] scale-110 opacity-[0.04]">
              <Logo size={420} variant="gold" className="mx-auto mb-2" />
              <div className="font-display font-black tracking-[0.25em] text-gold-600 text-5xl leading-none">THE FRAME CUT</div>
              <div className="font-mono tracking-[0.4em] text-gold-500 text-xs mt-3 uppercase font-semibold">CONFIDENTIAL STATEMENT</div>
            </div>
          </div>

          <div className="relative z-10 flex flex-col justify-between h-full flex-1 px-4 py-2 print:block print:h-auto print:min-h-0">
            <div>
              {/* Invoice Top Brand Header */}
              <div className="flex justify-between items-start border-b border-gold-500/10 pb-6 invoice-header break-inside-avoid page-break-inside-avoid">
                <div>
                  <div className="flex items-center space-x-3">
                    <Logo size={36} variant="gold" className="shrink-0" />
                    <div>
                      <span className="text-2xl font-light font-display tracking-[0.2em] text-stone-900 uppercase block leading-none">THE FRAME CUT</span>
                      <p className="text-[7.5px] font-mono text-gold-600 tracking-[0.25em] mt-2 uppercase">Cinematic Video Post-Production Suites</p>
                    </div>
                  </div>
                  
                  <div className="text-[10px] text-stone-500 mt-6 font-mono leading-relaxed space-y-0.5">
                    <p className="font-bold text-stone-700">Satish Tiwari, Managing Admin</p>
                    <p>Mumbai, Maharashtra, India</p>
                    <p className="text-gold-700">satish@framecut.com | +91 98333 44455</p>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end">
                  <div className="bg-gold-500/10 text-gold-700 px-3 py-1 rounded-full text-[9px] font-mono tracking-widest uppercase mb-3">
                    OFFICIAL STATEMENT
                  </div>
                  <h1 className="text-3xl font-light tracking-[0.1em] text-stone-900 font-display uppercase">INVOICE</h1>
                  <p className="text-xs text-stone-600 font-mono mt-1 font-semibold tracking-wider">{invoiceId}</p>
                  
                  <div className="text-[10px] text-stone-500 mt-6 font-mono space-y-0.5">
                    <p><span className="text-stone-400">DATE:</span> {new Date().toISOString().split('T')[0]}</p>
                    <p><span className="text-stone-400">TERMS:</span> Due on Delivery</p>
                  </div>
                </div>
              </div>

              {/* Client and Partner specs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-b border-gold-500/10 text-xs invoice-client-info break-inside-avoid page-break-inside-avoid">
                <div className="space-y-2">
                  <h3 className="font-mono text-gold-600 uppercase tracking-[0.2em] text-[9px] font-semibold">BILLED TO PARTNER</h3>
                  <div className="space-y-1">
                    <h4 className="font-bold text-stone-900 text-sm tracking-wide">{currentStudio?.name}</h4>
                    <p className="text-stone-600 leading-relaxed">
                      Owner: {currentStudio?.ownerName || 'Billed Studio Partner'}<br />
                      {currentStudio?.address || 'India'}<br />
                      {currentStudio?.phone || ''}
                    </p>
                  </div>
                  {currentStudio?.gstNumber && (
                    <div className="inline-block bg-stone-100 text-stone-600 px-2 py-0.5 rounded font-mono text-[9px] mt-1">
                      GSTIN: {currentStudio.gstNumber}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-start md:items-end justify-center pr-2">
                  <h3 className="font-mono text-stone-400 uppercase tracking-wider text-[9px] mb-2 self-start md:self-end">SERVICE PROVIDER</h3>
                  <div className="bg-gradient-to-br from-stone-900 via-[#1C1917] to-stone-950 p-4 rounded-2xl border border-gold-500/20 flex items-center space-x-3.5 w-fit shadow-lg">
                    <Logo size={46} variant="gold" />
                    <div>
                      <h4 className="font-bold text-gold-400 text-xs tracking-[0.15em] uppercase">THE FRAME CUT</h4>
                      <p className="text-[8px] text-stone-400 font-mono tracking-widest uppercase mt-0.5">STUDIO MASTER</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="overflow-x-auto my-8 print:overflow-visible">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gold-500/15 text-[9px] font-mono text-stone-400 uppercase tracking-wider">
                      <th className="py-3 pl-2 font-semibold">Wedding Project / Details</th>
                      <th className="py-3 pl-4 font-semibold">Cinematic Deliverables</th>
                      <th className="py-3 text-right pr-4 font-semibold">Budget</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gold-500/5 font-sans text-stone-700">
                    {studioProjects.length > 0 ? (
                      studioProjects.map((p) => (
                        <tr key={p.id} className="hover:bg-gold-500/[0.01] transition-colors break-inside-avoid page-break-inside-avoid">
                          <td className="py-4 pl-2">
                            <span className="font-bold text-stone-900 text-sm block tracking-wide">{p.coupleName}</span>
                            <span className="block text-[10px] text-stone-400 mt-1 font-medium">Shoot: {p.shootDate}</span>
                          </td>
                          <td className="py-4 pl-4 text-stone-600 max-w-[280px] break-words">
                            <span className="text-[11px] leading-relaxed font-medium block">
                              {p.eventType ? p.eventType.replace(/, /g, ' + ') : 'Wedding Film'}
                            </span>
                          </td>
                          <td className="py-4 text-right font-mono font-bold text-stone-900 text-sm pr-4">₹{p.projectAmount.toLocaleString('en-IN')}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-stone-400 font-mono text-[10px]">
                          No active wedding projects found in company registry for this partner.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Subtotal summary calculations block */}
            <div className="border-t border-gold-500/10 pt-6 invoice-summary break-inside-avoid page-break-inside-avoid">
              <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                <div className="flex-1 space-y-4 w-full">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                    <div className="text-[10px] font-mono text-stone-400 leading-relaxed space-y-1">
                      <p className="font-bold text-stone-700 tracking-wider uppercase mb-1 flex items-center space-x-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-gold-500" />
                        <span>TERMS & SETTLEMENTS</span>
                      </p>
                      <p>Consolidated ledger statement of active post-production. Please clear remaining balance dues for final raw assets delivery.</p>
                    </div>

                    <div className="text-[9px] sm:text-[9.5px] font-mono text-stone-500 leading-relaxed space-y-0.5 bg-gold-500/[0.03] border border-gold-500/10 p-3 rounded-xl break-inside-avoid page-break-inside-avoid invoice-bank-details">
                      <p className="font-bold text-stone-700 tracking-wider uppercase mb-1 flex items-center space-x-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span>BANK TRANSFER DETAILS</span>
                      </p>
                      <p><span className="text-stone-400 font-medium">Bank Name:</span> <span className="font-bold text-stone-800">ICICI BANK</span></p>
                      <p><span className="text-stone-400 font-medium">Account Name:</span> <span className="font-bold text-stone-800">SATISH TIWARI</span></p>
                      <p><span className="text-stone-400 font-medium">Account Number:</span> <span className="font-bold text-stone-800">390701503993</span></p>
                      <p><span className="text-stone-400 font-medium">IFSC Code:</span> <span className="font-bold text-stone-800">ICIC0003907</span></p>
                      <p><span className="text-stone-400 font-medium">Account Type:</span> <span className="font-bold text-stone-800">Savings</span></p>
                      <p><span className="text-stone-400 font-medium">VPA (UPI ID):</span> <span className="font-bold text-[#C5A059]">{upiId || '7772999933@icici'}</span></p>
                    </div>
                  </div>

                  {/* Dynamic QR Code Section */}
                  {qrData ? (
                    <div className="flex items-center space-x-4 bg-[#FAF7F0] border border-gold-500/15 p-3.5 rounded-2xl max-w-sm break-inside-avoid page-break-inside-avoid invoice-qr-block">
                      <div className="p-1.5 bg-white border border-gold-500/20 rounded-xl shadow-inner shrink-0">
                        <QRCodeSVG 
                          value={qrData}
                          size={80}
                          bgColor="#FFFFFF"
                          fgColor="#1C1917"
                          level="M"
                          includeMargin={false}
                        />
                        {/* Hidden canvas for high-resolution PDF export */}
                        <div style={{ display: 'none' }}>
                          <QRCodeCanvas
                            id="invoice-qr-canvas"
                            value={qrData}
                            size={250}
                            bgColor="#FFFFFF"
                            fgColor="#1C1917"
                            level="M"
                            includeMargin={false}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="font-mono text-gold-600 font-bold uppercase tracking-wider text-[8px]">
                          {qrType === 'upi' ? 'UPI INSTANT SETTLEMENT' : 'DIRECT PAYMENT LINK'}
                        </p>
                        <p className="font-display font-black text-stone-900 text-xs tracking-tight">
                          {qrType === 'upi' ? 'Scan to Pay Balance' : 'Scan to Open Link'}
                        </p>
                        <p className="font-mono text-[8px] text-stone-500 break-all leading-normal max-w-[190px]">
                          {qrType === 'upi' ? `ID: ${upiId}` : paymentLink}
                        </p>
                        <p className="font-sans font-semibold text-[8px] text-emerald-600">
                          {qrType === 'upi' ? `Pre-filled: ₹${balanceDue.toLocaleString('en-IN')}` : 'Online Card/UPI Accepted'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-stone-100/60 border border-stone-200/50 rounded-2xl max-w-sm text-[9px] font-mono text-stone-400 leading-normal break-inside-avoid page-break-inside-avoid invoice-qr-block">
                      <span className="text-stone-500 font-bold uppercase block mb-1">PAYMENT RAIL PREVIEW</span>
                      No payment gateway or UPI configured. Set your UPI ID or Payment Link in the options bar above to render a live payment QR code instantly.
                    </div>
                  )}
                </div>

                <div className="w-full md:w-72 bg-[#F6F3EB]/60 border border-gold-500/15 p-5 rounded-2xl space-y-2.5 text-xs text-stone-600 font-mono shadow-sm">
                  <div className="flex justify-between">
                    <span className="text-stone-400">SUBTOTAL:</span>
                    <span className="text-stone-900 font-semibold">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-red-500">
                      <span className="font-medium">DISCOUNT:</span>
                      <span className="font-bold">- ₹{discount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {includeGst && (
                    <div className="flex justify-between">
                      <span className="text-stone-400">GST (18% Service):</span>
                      <span className="text-stone-900 font-semibold">₹{gstAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-stone-900 pt-1">
                    <span className="text-stone-900 tracking-wide">TOTAL AMOUNT DUE:</span>
                    <span className="text-gold-700 font-sans font-black text-base">₹{totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Signature Block */}
            <div className="flex justify-between items-end border-t border-gold-500/10 pt-8 mt-8 invoice-signature break-inside-avoid page-break-inside-avoid">
              <div className="text-[9px] font-mono text-stone-400 space-y-0.5">
                <p className="font-medium">System Generated Invoicing Statement</p>
                <p>© 2026 The Frame Cut Studio OS</p>
              </div>

              <div className="text-right">
                <div className="border-b border-gold-500/20 w-40 ml-auto h-10 flex items-end justify-center font-serif text-sm italic text-stone-700 pb-1 pr-2 tracking-wide select-none">
                  Satish Tiwari
                </div>
                <span className="text-[8px] font-mono text-gold-600 block mt-1.5 tracking-wider uppercase font-semibold">AUTHORIZED MANAGER SIGNATURE</span>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Quick billing action rail */}
        <div className="space-y-6 print:hidden">
          <div className="p-6 rounded-3xl glass-panel space-y-4">
            <h3 className="text-sm font-bold font-display text-white">Invoice Actions</h3>
            <p className="text-xs text-gray-400 leading-relaxed">Direct billing dispatch commands to clear outstanding wedding balance reserves.</p>

            <div className="space-y-2.5 pt-2">
              <button
                id="btn-print-invoice"
                onClick={handlePrint}
                className="w-full flex items-center justify-between p-3.5 bg-gradient-to-r from-luxury-green-800 to-luxury-green-600 hover:scale-[1.02] active:scale-[0.98] transition-transform text-white text-xs font-bold rounded-2xl cursor-pointer"
              >
                <span>Print / Save PDF File</span>
                <Printer className="w-4 h-4 text-gold-300" />
              </button>

              <button
                id="btn-download-pdf"
                onClick={() => {
                  try {
                    const filename = handleExportPDF();
                    triggerToast("PDF Downloaded", `Consolidated statement ${filename} has been saved.`);
                  } catch (err) {
                    console.error('PDF generation failed:', err);
                    triggerToast("PDF Error", "Failed to compile multi-page PDF document.");
                  }
                }}
                className="w-full flex items-center justify-between p-3.5 bg-charcoal-800 hover:bg-charcoal-700 text-gray-200 text-xs font-medium rounded-2xl cursor-pointer"
              >
                <span>Download Invoice PDF</span>
                <FileText className="w-4 h-4 text-amber-400" />
              </button>

              <button
                id="btn-share-whatsapp"
                onClick={handleShareWhatsApp}
                className="w-full flex items-center justify-between p-3.5 bg-charcoal-800 hover:bg-charcoal-700 text-gray-200 text-xs font-medium rounded-2xl cursor-pointer"
              >
                <span>Dispatch via WhatsApp Link</span>
                <Share2 className="w-4 h-4 text-emerald-400" />
              </button>

              <button
                id="btn-share-email"
                onClick={handleShareEmail}
                className="w-full flex items-center justify-between p-3.5 bg-charcoal-800 hover:bg-charcoal-700 text-gray-200 text-xs font-medium rounded-2xl cursor-pointer"
              >
                <span>Email Invoice PDF Copy</span>
                <Mail className="w-4 h-4 text-purple-400" />
              </button>

              <button
                id="btn-simulate-email"
                onClick={handleSimulateEmailNotification}
                className="w-full flex items-center justify-between p-3.5 bg-[#d4af37]/15 hover:bg-[#d4af37]/25 border border-gold-500/30 text-gold-200 text-xs font-bold rounded-2xl cursor-pointer transition-colors"
              >
                <span>Simulate Mail Link Delivery</span>
                <Send className="w-4 h-4 text-gold-400" />
              </button>

              <button
                id="btn-save-invoice"
                onClick={handleRegisterInvoice}
                className="w-full flex items-center justify-between p-3.5 bg-charcoal-900 border border-gold-500/30 hover:border-gold-500 text-gold-400 text-xs font-bold rounded-2xl cursor-pointer"
              >
                <span>Save to Company Ledger</span>
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Company Invoice Ledger list (with swipe gesture support) */}
          <div className="p-6 rounded-3xl glass-panel space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold font-display text-white">Company Invoice Ledger</h3>
              <span className="text-[10px] font-mono bg-luxury-green-950 px-2 py-0.5 rounded-full text-gold-400">
                {invoices.length}
              </span>
            </div>
            <p className="text-[9px] text-gray-400 font-mono leading-relaxed">Swipe left to delete permanently, swipe right to mark as paid.</p>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {invoices.length > 0 ? (
                invoices.map((inv) => (
                  <SwipeableCard
                    key={inv.id}
                    id={inv.id}
                    leftLabel="Mark Paid"
                    leftBgColor="bg-emerald-950/40 border-emerald-500/20"
                    leftColor="text-emerald-400"
                    onSwipeLeft={onDeleteInvoice ? async () => {
                      setInvoiceToDeleteId(inv.id);
                    } : undefined}
                    onSwipeRight={onUpdateInvoice ? async () => {
                      await onUpdateInvoice(inv.id, { status: 'paid', balanceDue: 0 });
                      triggerToast("Invoice Marked Paid", `Invoice ${inv.id} marked as paid successfully!`);
                    } : undefined}
                    className="p-3 bg-charcoal-900 border border-luxury-green-800/10 rounded-2xl flex justify-between items-center cursor-pointer hover:border-gold-500/15 transition-colors group"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[9px] font-mono text-gray-500">{inv.id}</span>
                        <span className={`text-[8px] font-mono px-1 py-0.2 rounded-md ${
                          inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {inv.status}
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-gray-300 mt-1 truncate">{inv.coupleName}</h4>
                      <p className="text-[8px] text-gray-500 truncate">{inv.studioName}</p>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-white block">₹{inv.totalAmount.toLocaleString('en-IN')}</span>
                        <span className="text-[8px] text-gray-500 font-mono block mt-0.5">{inv.invoiceDate}</span>
                      </div>
                      {onDeleteInvoice && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInvoiceToDeleteId(inv.id);
                          }}
                          className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity animate-none"
                          title="Delete Invoice"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </SwipeableCard>
                ))
              ) : (
                <div className="text-center py-6 text-[10px] text-gray-500 font-mono border border-dashed border-luxury-green-800/10 rounded-2xl">
                  No invoice ledger history.
                </div>
              )}
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-400 leading-relaxed flex space-x-2">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>Printing handles spacing automatically and formats sheets perfectly in Portrait Mode.</span>
          </div>
        </div>
      </div>

      {/* Simulation Modal Overlay */}
      <AnimatePresence>
        {showSimulationModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 print:hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="w-full max-w-lg bg-charcoal-900 border border-luxury-green-800/40 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
            >
              {/* Subtle ambient gold and green organic background blur glows */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#d4af37]/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-luxury-green-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Header */}
              <div className="flex items-center space-x-3.5 mb-5 border-b border-white/5 pb-4">
                <div className={`p-3 rounded-2xl bg-[#d4af37]/10 border border-gold-500/20 text-gold-400 ${isSimulatingEmail ? 'animate-pulse' : ''}`}>
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-display text-white">Client Email Notification Relay</h3>
                  <p className="text-xs text-gray-400">Simulation engine for automated wedding contract billing</p>
                </div>
              </div>

              {/* Recipient info */}
              <div className="bg-black/55 p-4 rounded-2xl border border-white/5 mb-5 space-y-2">
                <div className="flex justify-between items-center text-[11px] font-mono">
                  <span className="text-gray-400">Recipient Email</span>
                  <span className="text-gold-300 font-medium">{currentStudio?.email || 'partner@weddingstudio.com'}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] font-mono">
                  <span className="text-gray-400">Active Ledger Projects</span>
                  <span className="text-white font-medium">{studioProjects.length} Projects</span>
                </div>
                <div className="flex justify-between items-center text-[11px] font-mono">
                  <span className="text-gray-400">Pending Balance Due</span>
                  <span className="text-rose-400 font-bold">₹{balanceDue.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Progress Flow steps */}
              <div className="space-y-4 mb-5 bg-black/25 p-4 rounded-2xl border border-white/5">
                <div className="relative pl-6 space-y-5">
                  <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-charcoal-800" />

                  {/* Step 1 */}
                  <div className="relative flex items-start space-x-3">
                    <span className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold border transition-colors ${
                      simulationStep >= 2
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                        : simulationStep === 1
                          ? 'bg-gold-500 text-emerald-950 border-gold-500 animate-pulse'
                          : 'bg-charcoal-900 border-charcoal-800 text-gray-600'
                    }`}>
                      {simulationStep >= 2 ? '✓' : '1'}
                    </span>
                    <div>
                      <h4 className={`text-xs font-semibold ${simulationStep >= 1 ? 'text-white' : 'text-gray-500'}`}>
                        Link Generator Routing
                      </h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">Creating unique web hosting token for public invoice document.</p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="relative flex items-start space-x-3">
                    <span className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold border transition-colors ${
                      simulationStep >= 3
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                        : simulationStep === 2
                          ? 'bg-gold-500 text-emerald-950 border-gold-500 animate-pulse'
                          : 'bg-charcoal-900 border-charcoal-800 text-gray-600'
                    }`}>
                      {simulationStep >= 3 ? '✓' : '2'}
                    </span>
                    <div>
                      <h4 className={`text-xs font-semibold ${simulationStep >= 2 ? 'text-white' : 'text-gray-500'}`}>
                        SMTP Gateway Handshake
                      </h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">Verifying MX records and establishing secure TTL email session.</p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="relative flex items-start space-x-3">
                    <span className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold border transition-colors ${
                      simulationStep >= 5
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                        : (simulationStep === 3 || simulationStep === 4)
                          ? 'bg-gold-500 text-emerald-950 border-gold-500 animate-pulse'
                          : 'bg-charcoal-900 border-charcoal-800 text-gray-600'
                    }`}>
                      {simulationStep >= 5 ? '✓' : '3'}
                    </span>
                    <div>
                      <h4 className={`text-xs font-semibold ${simulationStep >= 3 ? 'text-white' : 'text-gray-500'}`}>
                        Delivery & Audit Logging
                      </h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">Dispatched notification with dynamic body containing receipt URL.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Console logs */}
              <div className="bg-black/80 rounded-2xl border border-white/5 p-4 font-mono text-[9px] text-emerald-400 h-28 overflow-y-auto space-y-1.5 scrollbar-thin">
                {simulationLogs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed">
                    <span className="text-gray-500 mr-1">&gt;</span> {log}
                  </div>
                ))}
              </div>

              {/* Footer controls */}
              <div className="mt-5 flex justify-between items-center pt-4 border-t border-white/5">
                <span className="text-[10px] font-mono text-gray-400 flex items-center gap-1.5">
                  {isSimulatingEmail ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-ping" />
                      Active Dispatch Relay
                    </>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Transmission Finished
                    </>
                  )}
                </span>

                {isSimulatingEmail ? (
                  <div className="text-xs font-mono text-gold-300 animate-pulse">Running Simulation...</div>
                ) : (
                  <button
                    onClick={() => setShowSimulationModal(false)}
                    className="px-5 py-2 bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-400 hover:to-gold-300 text-emerald-950 font-mono text-xs font-bold rounded-xl cursor-pointer transition-all shadow-md active:scale-95"
                  >
                    Done
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Invoice Confirmation Modal */}
      <AnimatePresence>
        {invoiceToDeleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={() => setInvoiceToDeleteId(null)} />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md p-6 overflow-hidden text-left bg-charcoal-900 border border-red-500/30 rounded-3xl shadow-[0_20px_50px_rgba(239,68,68,0.2)] z-10"
            >
              <div className="flex items-start space-x-3.5">
                <div className="p-3 bg-red-500/10 text-red-400 rounded-2xl border border-red-500/20">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-display">Delete Invoice</h3>
                  <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                    Are you sure you want to permanently delete invoice {invoiceToDeleteId}? This action cannot be undone and will scrub it from our financial statements.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setInvoiceToDeleteId(null)}
                  className="px-4 py-2.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (invoiceToDeleteId && onDeleteInvoice) {
                      await onDeleteInvoice(invoiceToDeleteId);
                      const deletedId = invoiceToDeleteId;
                      setInvoiceToDeleteId(null);
                      triggerToast("Invoice Deleted", `Invoice ${deletedId} deleted successfully!`);
                    }
                  }}
                  className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold text-xs rounded-xl shadow-[0_4px_15px_rgba(239,68,68,0.25)] transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.99]"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Notification Alert Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 flex items-center space-x-3 bg-luxury-green-950/90 border border-gold-500/30 p-4 rounded-2xl shadow-2xl backdrop-blur-md max-w-sm gold-glow animate-none"
          >
            <div className="p-2 bg-gold-500/25 rounded-xl text-gold-400">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">{toast.title}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{toast.desc}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
