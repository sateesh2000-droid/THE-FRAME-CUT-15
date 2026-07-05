import React, { useState } from 'react';
import { 
  Building2, 
  User, 
  Phone, 
  MapPin, 
  FileText, 
  TrendingUp, 
  Clock, 
  Briefcase, 
  Plus, 
  Edit, 
  Trash2, 
  BookOpen, 
  DollarSign, 
  ChevronRight,
  Info,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SwipeableCard from './SwipeableCard';
import { Studio, Project, Invoice } from '../types';
import Logo from './Logo';

interface StudiosViewProps {
  studios: Studio[];
  projects: Project[];
  invoices: Invoice[];
  onAddStudio: (studio: Omit<Studio, 'createdAt'>) => Promise<void>;
  onUpdateStudio: (id: string, updates: Partial<Studio>) => Promise<void>;
  onDeleteStudio: (id: string) => Promise<void>;
  onDeleteInvoice?: (id: string) => Promise<void>;
  onUpdateInvoice?: (id: string, updates: Partial<Invoice>) => Promise<void>;
}

const StudiosView = React.memo(function StudiosView({
  studios,
  projects,
  invoices,
  onAddStudio,
  onUpdateStudio,
  onDeleteStudio,
  onDeleteInvoice,
  onUpdateInvoice
}: StudiosViewProps) {
  const [selectedStudio, setSelectedStudio] = useState<Studio | null>(null);
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudio, setEditingStudio] = useState<Studio | null>(null);

  // Custom toast and confirmation states
  const [studioToDeleteId, setStudioToDeleteId] = useState<string | null>(null);
  const [invoiceToDeleteId, setInvoiceToDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ title: string; desc: string } | null>(null);

  const triggerToast = (title: string, desc: string) => {
    setToast({ title, desc });
    setTimeout(() => setToast(null), 4000);
  };

  // Form states
  const [name, setName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  const openCreateModal = () => {
    setEditingStudio(null);
    setName('');
    setOwnerName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setGstNumber('');
    setNotes('');
    setLogoUrl('');
    setIsModalOpen(true);
  };

  const openEditModal = (studio: Studio, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingStudio(studio);
    setName(studio.name);
    setOwnerName(studio.ownerName);
    setPhone(studio.phone);
    setEmail(studio.email);
    setAddress(studio.address);
    setGstNumber(studio.gstNumber || '');
    setNotes(studio.notes || '');
    setLogoUrl(studio.logoUrl || '');
    setIsModalOpen(true);
  };

  const handleSaveStudio = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStudio) {
        await onUpdateStudio(editingStudio.id, {
          name,
          ownerName,
          phone,
          email,
          address,
          gstNumber,
          notes,
          logoUrl
        });
        if (selectedStudio?.id === editingStudio.id) {
          setSelectedStudio({
            ...selectedStudio,
            name,
            ownerName,
            phone,
            email,
            address,
            gstNumber,
            notes,
            logoUrl
          });
        }
      } else {
        const generatedId = `studio-${name.toLowerCase().replace(/\s+/g, '-')}`;
        await onAddStudio({
          id: generatedId,
          name,
          ownerName,
          phone,
          email,
          address,
          gstNumber,
          notes,
          logoUrl
        });
      }
      setIsModalOpen(false);
    } catch (error: any) {
      console.error("Error saving studio:", error);
      alert("Failed to save Studio Partner: " + (error?.message || error || "Unknown error"));
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStudioToDeleteId(id);
  };

  return (
    <div className="space-y-6">
      
      {/* Top action header */}
      <div className="p-6 rounded-3xl glass-panel flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-white">Studio Partners Directory</h2>
          <p className="text-xs text-gray-400 mt-1">Manage wedding studios, invoices, and aggregated business pipelines.</p>
        </div>
        
        <button
          onClick={openCreateModal}
          className="flex items-center space-x-2 px-4.5 py-2.5 bg-gradient-to-r from-luxury-green-800 to-luxury-green-600 border border-gold-500/30 rounded-2xl text-white font-medium text-xs hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer gold-glow shrink-0"
        >
          <Plus className="w-4 h-4 text-gold-300" />
          <span>Add Studio Partner</span>
        </button>
      </div>

      {/* Grid of Studio Profiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {studios.map((studio) => {
          const studioProjects = projects.filter(p => p.studioId === studio.id);
          const totalBilling = studioProjects.reduce((sum, p) => sum + (p.projectAmount || 0), 0);
          const totalPaid = studioProjects.reduce((sum, p) => sum + (p.advancePayment || 0), 0);
          const outstanding = totalBilling - totalPaid;
          
          return (
            <motion.div
              key={studio.id}
              layout
              onClick={() => { setSelectedStudio(studio); setIsLedgerOpen(true); }}
              className="p-6 rounded-3xl glass-panel relative overflow-hidden flex flex-col justify-between h-80 cursor-pointer group glass-panel-hover"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-luxury-green-800/10 rounded-full blur-2xl pointer-events-none -z-10" />

              <div>
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-2xl bg-charcoal-900 border border-luxury-green-800/30 flex items-center justify-center overflow-hidden shrink-0">
                    {studio.logoUrl ? (
                      <img src={studio.logoUrl} alt={studio.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <Logo size={36} variant="gold" />
                    )}
                  </div>
                  
                  {/* Ledger quick controls */}
                  <div className="flex space-x-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => openEditModal(studio, e)}
                      className="p-2 hover:bg-luxury-green-800/20 text-gray-400 hover:text-gold-500 rounded-lg transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(studio.id, e)}
                      className="p-2 hover:bg-red-500/10 text-gray-400 hover:text-red-400 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white font-display mt-4 group-hover:text-gold-400 transition-colors truncate">
                  {studio.name}
                </h3>
                <p className="text-xs text-gray-400 font-mono flex items-center space-x-1.5 mt-1">
                  <User className="w-3.5 h-3.5 text-luxury-green-500 shrink-0" />
                  <span>{studio.ownerName}</span>
                </p>

                <div className="space-y-1 mt-4 text-[11px] text-gray-400">
                  <p className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                    <span>{studio.phone}</span>
                  </p>
                  <p className="flex items-center space-x-2 truncate">
                    <MapPin className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                    <span>{studio.address}</span>
                  </p>
                </div>
              </div>

              {/* Aggregations */}
              <div className="border-t border-luxury-green-800/10 pt-4 mt-4 grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div>
                  <span className="text-gray-500 block">PROJECTS</span>
                  <span className="text-white font-bold text-xs">{studioProjects.length} Engagements</span>
                </div>
                <div className="text-right">
                  <span className="text-gray-500 block">DUE BAL</span>
                  <span className="text-red-400 font-bold text-xs">₹{outstanding.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Studio LEDGER Slidout Panel */}
      <AnimatePresence>
        {isLedgerOpen && selectedStudio && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsLedgerOpen(false)} />

            <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
              <motion.div
                id="studio-ledger-panel"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 180 }}
                className="w-screen max-w-2xl bg-charcoal-900 border-l border-luxury-green-800/30 shadow-2xl flex flex-col justify-between"
              >
                {/* Header */}
                <div className="p-6 border-b border-luxury-green-800/20 bg-charcoal-950/50 shrink-0 flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono px-2.5 py-0.5 bg-luxury-green-950 text-gold-400 border border-gold-500/10 rounded-full">
                        Ledger Account
                      </span>
                      {selectedStudio.gstNumber && (
                        <span className="text-[10px] font-mono text-gray-400">GST: {selectedStudio.gstNumber}</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-3 mt-1.5">
                      <div className="w-10 h-10 rounded-xl bg-charcoal-900 border border-luxury-green-800/30 flex items-center justify-center overflow-hidden shrink-0">
                        {selectedStudio.logoUrl ? (
                          <img src={selectedStudio.logoUrl} alt={selectedStudio.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <Logo size={30} variant="gold" className="shrink-0" />
                        )}
                      </div>
                      <h2 className="text-2xl font-bold font-display text-white">{selectedStudio.name}</h2>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{selectedStudio.ownerName} • Partner Studio</p>
                  </div>

                  <button
                    onClick={() => setIsLedgerOpen(false)}
                    className="p-2 hover:bg-charcoal-800 rounded-xl text-gray-400"
                  >
                    ✕ Close
                  </button>
                </div>

                {/* Ledger Core Calculations */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  
                  {/* Revenue / Pending Summary banner */}
                  {(() => {
                    const studioProjects = projects.filter(p => p.studioId === selectedStudio.id);
                    const totalBilling = studioProjects.reduce((sum, p) => sum + (p.projectAmount || 0), 0);
                    const totalPaid = studioProjects.reduce((sum, p) => sum + (p.advancePayment || 0), 0);
                    const outstanding = totalBilling - totalPaid;

                    return (
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-4 bg-charcoal-800/40 border border-luxury-green-800/10 rounded-2xl text-center">
                          <span className="text-[9px] font-mono text-gray-500 block uppercase">Total Val of Work</span>
                          <span className="text-base font-bold text-white mt-1 block">₹{totalBilling.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="p-4 bg-emerald-950/20 border border-emerald-500/10 rounded-2xl text-center">
                          <span className="text-[9px] font-mono text-emerald-500 block uppercase">Received Advance</span>
                          <span className="text-base font-bold text-emerald-400 mt-1 block">₹{totalPaid.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="p-4 bg-red-950/20 border border-red-500/10 rounded-2xl text-center">
                          <span className="text-[9px] font-mono text-red-500 block uppercase">Pending Clearance</span>
                          <span className="text-base font-bold text-red-400 mt-1 block">₹{outstanding.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Wedding History timeline */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gold-500 font-mono">Wedding Pipeline History</h3>
                    
                    <div className="space-y-3">
                      {projects.filter(p => p.studioId === selectedStudio.id).length > 0 ? (
                        projects.filter(p => p.studioId === selectedStudio.id).map((proj) => (
                          <div 
                            key={proj.id} 
                            className="p-4 rounded-2xl bg-charcoal-950/60 border border-luxury-green-800/10 flex justify-between items-center"
                          >
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="text-[9px] font-mono text-gold-400">{proj.id}</span>
                                <span className="text-[9px] font-mono text-gray-500">{proj.deliveryDate}</span>
                              </div>
                              <h4 className="text-xs font-bold text-white mt-1">{proj.coupleName}</h4>
                              <p className="text-[10px] text-gray-400 mt-0.5">{proj.eventType}</p>
                            </div>

                            <div className="text-right">
                              <div className="text-xs font-bold text-white">₹{proj.projectAmount.toLocaleString('en-IN')}</div>
                              <span className={`inline-block text-[8px] font-mono px-2 py-0.5 rounded uppercase mt-1 ${
                                proj.status === 'delivered' || proj.status === 'closed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-500'
                              }`}>
                                {proj.status}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-[10px] text-gray-500 font-mono">No wedding projects filed for this partner.</div>
                      )}
                    </div>
                  </div>

                  {/* Studio Invoice Ledger history */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gold-500 font-mono">Invoice Records</h3>
                    
                    <div className="space-y-2">
                      {invoices.filter(inv => inv.studioId === selectedStudio.id).length > 0 ? (
                        invoices.filter(inv => inv.studioId === selectedStudio.id).map((inv) => (
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
                            className="p-3 bg-charcoal-950/30 rounded-xl border border-luxury-green-800/5 flex justify-between items-center cursor-pointer group"
                          >
                            <div className="flex-1 min-w-0 pr-2">
                              <span className="text-[9px] font-mono text-gray-500">{inv.id} • Issued {inv.invoiceDate}</span>
                              <h4 className="text-xs font-semibold text-gray-300 mt-0.5">{inv.coupleName}</h4>
                            </div>

                            <div className="flex items-center space-x-2 shrink-0">
                              <div className="text-right">
                                <span className="text-xs font-mono font-bold text-white block">₹{inv.totalAmount.toLocaleString('en-IN')}</span>
                                <span className={`inline-block text-[8px] font-mono px-1.5 py-0.5 rounded capitalize ${
                                  inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                                }`}>
                                  {inv.status}
                                </span>
                              </div>
                              {onDeleteInvoice && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setInvoiceToDeleteId(inv.id);
                                  }}
                                  className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Delete Invoice"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </SwipeableCard>
                        ))
                      ) : (
                        <div className="text-center py-4 text-[10px] text-gray-500 font-mono">No active invoices issued. Use the Invoice Generator to issue one.</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="p-6 border-t border-luxury-green-800/20 bg-charcoal-950/40 flex justify-between shrink-0">
                  <button
                    onClick={(e) => openEditModal(selectedStudio, e)}
                    className="flex items-center space-x-2 px-4 py-2.5 bg-luxury-green-800 text-gold-400 text-xs font-bold rounded-xl border border-gold-500/20"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit Profile Details</span>
                  </button>

                  <button
                    onClick={(e) => handleDelete(selectedStudio.id, e)}
                    className="flex items-center space-x-2 px-4 py-2.5 hover:bg-red-500/10 text-red-400 text-xs font-bold rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Studio Partner</span>
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE & EDIT modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />

              <motion.div
                id="studio-form-modal"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform rounded-3xl glass-panel relative z-10"
              >
                <h3 className="text-lg font-bold text-white font-display mb-5">
                  {editingStudio ? `Edit Profile: ${editingStudio.name}` : 'Register New Studio Partner'}
                </h3>

                <form onSubmit={handleSaveStudio} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Studio / Agency Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-charcoal-900 border border-luxury-green-800/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Owner Name</label>
                    <input
                      type="text"
                      required
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="w-full bg-charcoal-900 border border-luxury-green-800/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Phone Number</label>
                      <input
                        type="text"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-charcoal-900 border border-luxury-green-800/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">GST Registration</label>
                      <input
                        type="text"
                        placeholder="GST (Optional)"
                        value={gstNumber}
                        onChange={(e) => setGstNumber(e.target.value)}
                        className="w-full bg-charcoal-900 border border-luxury-green-800/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-charcoal-900 border border-luxury-green-800/30 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Office Address</label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-charcoal-900 border border-luxury-green-800/30 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase mb-2">Studio Logo / Brand Identity</label>
                    <div className="flex items-center space-x-4 p-3.5 bg-charcoal-950/40 border border-luxury-green-800/20 rounded-2xl">
                      <div className="w-16 h-16 rounded-2xl bg-charcoal-900 border border-luxury-green-800/30 flex items-center justify-center overflow-hidden shrink-0">
                        {logoUrl ? (
                          <img src={logoUrl} alt="Logo Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <Logo size={40} variant="gold" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-2">
                          <label className="cursor-pointer bg-luxury-green-800/30 hover:bg-luxury-green-800/60 text-gold-400 border border-gold-500/20 rounded-xl px-3.5 py-1.5 text-[10px] font-mono tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98]">
                            UPLOAD LOGO
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = () => {
                                    if (typeof reader.result === 'string') {
                                      setLogoUrl(reader.result);
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                          {logoUrl && (
                            <button
                              type="button"
                              onClick={() => setLogoUrl('')}
                              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl px-3.5 py-1.5 text-[10px] font-mono tracking-wider transition-all cursor-pointer"
                            >
                              CLEAR
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          placeholder="Or paste external image URL"
                          value={logoUrl.startsWith('data:') ? '' : logoUrl}
                          onChange={(e) => setLogoUrl(e.target.value)}
                          className="w-full bg-charcoal-900 border border-luxury-green-800/20 rounded-xl px-3 py-1.5 text-[10px] text-white focus:outline-none placeholder-gray-600 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Internal Notes</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-charcoal-900 border border-luxury-green-800/30 rounded-xl px-3 py-2 text-xs text-white h-20 resize-none"
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
                      {editingStudio ? 'Save Profile' : 'Register Studio'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Studio Partner Confirmation Modal */}
      <AnimatePresence>
        {studioToDeleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={() => setStudioToDeleteId(null)} />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md p-6 overflow-hidden text-left bg-charcoal-900 border border-red-500/30 rounded-3xl shadow-[0_20px_50px_rgba(239,68,68,0.2)] z-10"
            >
              <div className="flex items-start space-x-3.5">
                <div className="p-3 bg-red-500/10 text-red-400 rounded-2xl border border-red-500/20">
                  <Info className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-display">Delete Studio Partner</h3>
                  <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                    Are you sure you want to delete this studio partner? All associated wedding records will be unlinked. This operation cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setStudioToDeleteId(null)}
                  className="px-4 py-2.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (studioToDeleteId) {
                      await onDeleteStudio(studioToDeleteId);
                      setStudioToDeleteId(null);
                      setSelectedStudio(null);
                      setIsLedgerOpen(false);
                      triggerToast("Studio Deleted", "Studio partner and dependencies unlinked successfully.");
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
                  <Info className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-display">Delete Invoice</h3>
                  <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                    Are you sure you want to permanently delete invoice {invoiceToDeleteId}? This action will erase its historic entry from the records.
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
});

export default StudiosView;
