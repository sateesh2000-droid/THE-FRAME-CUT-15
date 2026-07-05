import React, { useState } from 'react';
import { 
  Laptop, 
  User, 
  Phone, 
  Mail, 
  Star, 
  Calendar, 
  Briefcase, 
  Plus, 
  Edit, 
  Trash2, 
  IndianRupee, 
  CheckCircle, 
  TrendingUp, 
  PlusCircle,
  Clock,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Editor, Project, PaymentHistory } from '../types';

interface EditorsViewProps {
  editors: Editor[];
  projects: Project[];
  payments: PaymentHistory[];
  userRole?: string;
  currentEditorId?: string;
  currentUserEmail?: string;
  onAddEditor: (editor: Omit<Editor, 'id'>) => Promise<void>;
  onUpdateEditor: (id: string, updates: Partial<Editor>) => Promise<void>;
  onDeleteEditor: (id: string) => Promise<void>;
  onLogPayment: (payment: Omit<PaymentHistory, 'id' | 'createdAt'>) => Promise<void>;
  onDeletePayment?: (id: string) => Promise<void>;
}

const EditorsView = React.memo(function EditorsView({
  editors,
  projects,
  payments,
  userRole = 'admin',
  currentEditorId,
  currentUserEmail,
  onAddEditor,
  onUpdateEditor,
  onDeleteEditor,
  onLogPayment,
  onDeletePayment
}: EditorsViewProps) {
  const [selectedEditor, setSelectedEditor] = useState<Editor | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEditor, setEditingEditor] = useState<Editor | null>(null);

  // Helper to determine workload status based on active cuts count
  const getWorkloadStatus = (activeCount: number) => {
    if (activeCount === 0) {
      return {
        label: 'Available',
        bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
        dot: 'bg-emerald-400'
      };
    } else {
      return {
        label: 'Busy',
        bg: 'bg-amber-500/10 border-amber-500/20 text-amber-500',
        dot: 'bg-amber-500'
      };
    }
  };

  // Custom toast and confirmation states
  const [editorToDeleteId, setEditorToDeleteId] = useState<string | null>(null);
  const [paymentToDeleteId, setPaymentToDeleteId] = useState<string | null>(null);
  const [settlementToDeleteId, setSettlementToDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ title: string; desc: string } | null>(null);

  const triggerToast = (title: string, desc: string) => {
    setToast({ title, desc });
    setTimeout(() => setToast(null), 4000);
  };
  
  // Payment logger states
  const [isLoggingPayment, setIsLoggingPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentProjectId, setPaymentProjectId] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [rating, setRating] = useState(5.0);
  const [joinedDate, setJoinedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024 * 3) { // 3MB limit
        alert("Image file size should be less than 3MB.");
        return;
      }
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setPhoto(reader.result);
        }
        setIsUploading(false);
      };
      reader.onerror = () => {
        alert("Failed to read image file.");
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const openCreateModal = () => {
    setEditingEditor(null);
    setName('');
    setEmail('');
    setPhone('');
    setRating(5.0);
    setJoinedDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setPhoto('');
    setIsModalOpen(true);
  };

  const openEditModal = (editor: Editor, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEditor(editor);
    setName(editor.name);
    setEmail(editor.email);
    setPhone(editor.phone);
    setRating(editor.rating);
    setJoinedDate(editor.joinedDate);
    setNotes(editor.notes || '');
    setPhoto(editor.photo || '');
    setIsModalOpen(true);
  };

  const handleSaveEditor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const finalPhoto = photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200';
      if (editingEditor) {
        await onUpdateEditor(editingEditor.id, {
          name,
          email,
          phone,
          rating,
          joinedDate,
          notes,
          photo: finalPhoto
        });
        if (selectedEditor?.id === editingEditor.id) {
          setSelectedEditor({
            ...selectedEditor,
            name,
            email,
            phone,
            rating,
            joinedDate,
            notes,
            photo: finalPhoto
          });
        }
      } else {
        await onAddEditor({
          name,
          email,
          phone,
          rating,
          joinedDate,
          notes,
          photo: finalPhoto
        });
      }
      setIsModalOpen(false);
    } catch (error: any) {
      console.error("Error saving editor:", error);
      alert("Failed to save Editor Partner: " + (error?.message || error || "Unknown error"));
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditorToDeleteId(id);
  };

  const handleLogPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEditor || paymentAmount <= 0) return;

    const matchedProj = projects.find(p => p.id === paymentProjectId);

    await onLogPayment({
      entityId: selectedEditor.id,
      entityType: 'editor',
      projectId: paymentProjectId,
      projectCoupleName: matchedProj ? matchedProj.coupleName : 'Office Advance / Bonus',
      amount: paymentAmount,
      date: new Date().toISOString().split('T')[0],
      paymentMethod,
      notes: paymentNotes
    });

    setPaymentAmount(0);
    setPaymentNotes('');
    setIsLoggingPayment(false);
  };

  const myEditor = editors.find(
    e => e.id === currentEditorId || (e.email && currentUserEmail && e.email.toLowerCase() === currentUserEmail.toLowerCase())
  );

  if (userRole === 'editor') {
    if (!myEditor) {
      return (
        <div className="p-8 rounded-3xl glass-panel text-center max-w-xl mx-auto space-y-4 my-12">
          <Laptop className="w-16 h-16 text-amber-500 mx-auto" />
          <h2 className="text-xl font-bold text-white font-display">Editor Profile Not Found</h2>
          <p className="text-sm text-gray-400">
            Your login is authorized as an Editor, but it has not been linked to an active registry profile yet.
          </p>
          <div className="p-4 rounded-2xl bg-charcoal-950/50 border border-luxury-green-800/20 text-xs text-gray-300 font-mono">
            Active Login: {currentUserEmail}
          </div>
          <p className="text-xs text-gold-400">
            Please ask an Admin (Satish / Vansh) to register an Editor profile matching your email address.
          </p>
        </div>
      );
    }

    const editorProjects = projects.filter(p => p.assignedEditorId === myEditor.id || (p.isSplitProject && p.secondEditorId === myEditor.id));
    const completedCuts = editorProjects.filter(p => p.status === 'delivered' || p.status === 'closed').length;
    
    const totalEarningsVal = editorProjects.reduce((sum, p) => {
      if (p.isSplitProject) {
        if (p.assignedEditorId === myEditor.id) {
          return sum + (p.firstEditorShare || 0);
        } else if (p.secondEditorId === myEditor.id) {
          return sum + (p.secondEditorShare || 0);
        }
      }
      return sum + (p.editorPayment || 0);
    }, 0);
    const totalPaidVal = payments
      .filter(pay => pay.entityId === myEditor.id && pay.entityType === 'editor')
      .reduce((sum, pay) => sum + (pay.amount || 0), 0);

    const pendingBalance = totalEarningsVal - totalPaidVal;

    return (
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="p-6 rounded-3xl glass-panel flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <img
              src={myEditor.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'}
              alt={myEditor.name}
              className="w-14 h-14 rounded-2xl object-cover border border-gold-500/20"
            />
            <div>
              <h2 className="text-xl font-bold font-display text-white">Welcome, {myEditor.name}!</h2>
              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-gray-400">
                <p className="flex items-center space-x-1">
                  <Star className="w-3.5 h-3.5 fill-gold-500 text-gold-500" />
                  <span className="font-bold text-gold-400 font-mono">{myEditor.rating.toFixed(1)} Performance Index</span>
                </p>
                <span className="text-gray-500">•</span>
                <span className="font-mono">Joined on {myEditor.joinedDate}</span>
                <span className="text-gray-500">•</span>
                {(() => {
                  const activeCount = editorProjects.length - completedCuts;
                  const workload = getWorkloadStatus(activeCount);
                  return (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${workload.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${workload.dot} mr-1.5 animate-pulse-slow`} />
                      {workload.label} ({activeCount} Active Cuts)
                    </span>
                  );
                })()}
              </div>
            </div>
          </div>
          
          <button
            onClick={() => {
              setSelectedEditor(myEditor);
              setPaymentProjectId('');
              setIsLoggingPayment(!isLoggingPayment);
            }}
            className="flex items-center space-x-2 px-4.5 py-2.5 bg-gradient-to-r from-luxury-green-800 to-luxury-green-600 border border-gold-500/30 rounded-2xl text-white font-medium text-xs hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer gold-glow shrink-0"
          >
            <PlusCircle className="w-4 h-4 text-gold-300" />
            <span>{isLoggingPayment ? 'Close Log Option' : 'Self-Log Received Payment'}</span>
          </button>
        </div>

        {/* Financial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl glass-panel bg-gradient-to-br from-charcoal-900 to-charcoal-950 border border-luxury-green-800/10 flex flex-col justify-between">
            <span className="text-xs font-mono text-gray-500 uppercase tracking-wider block">Total Work Earned</span>
            <div className="mt-4">
              <span className="text-3xl font-bold text-white tracking-tight">₹{totalEarningsVal.toLocaleString('en-IN')}</span>
              <p className="text-[11px] text-gray-400 mt-2 font-mono">{editorProjects.length} Assigned Weddings ({completedCuts} Completed)</p>
            </div>
          </div>
          <div className="p-6 rounded-3xl glass-panel bg-gradient-to-br from-charcoal-900 to-charcoal-950 border border-emerald-500/10 flex flex-col justify-between">
            <span className="text-xs font-mono text-emerald-500 uppercase tracking-wider block">Total Payment Received</span>
            <div className="mt-4">
              <span className="text-3xl font-bold text-emerald-400 tracking-tight">₹{totalPaidVal.toLocaleString('en-IN')}</span>
              <p className="text-[11px] text-gray-400 mt-2 font-mono">Disbursed across wedding ledger records</p>
            </div>
          </div>
          <div className="p-6 rounded-3xl glass-panel bg-gradient-to-br from-charcoal-900 to-charcoal-950 border border-red-500/10 flex flex-col justify-between">
            <span className="text-xs font-mono text-red-500 uppercase tracking-wider block">Outstanding Due</span>
            <div className="mt-4">
              <span className="text-3xl font-bold text-red-400 tracking-tight">₹{pendingBalance >= 0 ? pendingBalance.toLocaleString('en-IN') : 0}</span>
              <p className="text-[11px] text-gray-400 mt-2 font-mono">{editorProjects.length - completedCuts} Active Productions</p>
            </div>
          </div>
        </div>

        {/* Self-Log Form Panel */}
        {isLoggingPayment && selectedEditor && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-3xl glass-panel border border-gold-500/20 bg-charcoal-950/60 space-y-4"
          >
            <div className="flex justify-between items-center border-b border-luxury-green-800/10 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gold-500 font-mono">Self-Log Received Payment</h3>
              <button 
                onClick={() => setIsLoggingPayment(false)}
                className="text-xs text-gray-500 hover:text-white"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleLogPaymentSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-gray-400 mb-1 uppercase">Select Wedding Project</label>
                  <select
                    value={paymentProjectId}
                    onChange={(e) => setPaymentProjectId(e.target.value)}
                    className="w-full bg-charcoal-900 border border-luxury-green-800/30 rounded-xl p-2.5 text-xs text-white"
                    required
                  >
                    <option value="">Choose Wedding Project</option>
                    {editorProjects.map(proj => (
                      <option key={proj.id} value={proj.id}>{proj.coupleName} (Contract: ₹{proj.editorPayment})</option>
                    ))}
                    <option value="misc_bonus">Miscellaneous / Advance / Bonus</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-gray-400 mb-1 uppercase">Amount Received (INR)</label>
                  <input
                    type="number"
                    placeholder="INR"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="w-full bg-charcoal-900 border border-luxury-green-800/30 rounded-xl p-2.5 text-xs text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-gray-400 mb-1 uppercase">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-charcoal-900 border border-luxury-green-800/30 rounded-xl p-2.5 text-xs text-gray-300"
                  >
                    <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                    <option value="UPI / GPay">UPI / Google Pay</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-gray-400 mb-1 uppercase">Receipt Notes / Transaction ID</label>
                  <input
                    type="text"
                    placeholder="e.g. UPI Ref, GPay Screenshot name, etc."
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    className="w-full bg-charcoal-900 border border-luxury-green-800/30 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLoggingPayment(false)}
                  className="px-4 py-2 text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gold-500 text-charcoal-950 font-bold text-xs rounded-xl"
                >
                  Save Payment Record
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Bottom Content: Assigned weddings and payment history list side-by-side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Assigned Weddings */}
          <div className="p-6 rounded-3xl glass-panel space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gold-500 font-mono">My Wedding Deliveries</h3>
            <div className="space-y-3.5 max-h-[450px] overflow-y-auto pr-1">
              {editorProjects.length > 0 ? (
                editorProjects.map((proj) => (
                  <div 
                    key={proj.id} 
                    className="p-4 rounded-2xl bg-charcoal-950/60 border border-luxury-green-800/10 flex justify-between items-center"
                  >
                    <div>
                      <span className="text-[9px] font-mono text-gold-400">{proj.id}</span>
                      <h4 className="text-xs font-bold text-white mt-1">{proj.coupleName}</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">{proj.studioName} • {proj.eventType}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-white block">₹{proj.editorPayment.toLocaleString('en-IN')}</span>
                      <span className={`inline-block text-[8px] font-mono px-2 py-0.5 rounded uppercase mt-1 ${
                        proj.status === 'delivered' || proj.status === 'closed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {proj.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-xs text-gray-500 font-mono">No wedding projects assigned to your registry.</div>
              )}
            </div>
          </div>

          {/* Payment History Log */}
          <div className="p-6 rounded-3xl glass-panel space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gold-500 font-mono">Ledger Receipts</h3>
            <div className="space-y-3.5 max-h-[450px] overflow-y-auto pr-1">
              {payments.filter(pay => pay.entityId === myEditor.id && pay.entityType === 'editor').length > 0 ? (
                payments.filter(pay => pay.entityId === myEditor.id && pay.entityType === 'editor').map((pay) => (
                  <div 
                    key={pay.id} 
                    className="p-4 bg-charcoal-950/30 rounded-2xl border border-luxury-green-800/5 flex justify-between items-center"
                  >
                    <div>
                      <span className="text-[9px] font-mono text-gray-500">{pay.date} • {pay.paymentMethod}</span>
                      <p className="text-xs text-gray-300 font-semibold mt-0.5 truncate">{pay.projectCoupleName}</p>
                      {pay.notes && <p className="text-[10px] text-gray-500 italic mt-0.5">Notes: {pay.notes}</p>}
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        + ₹{pay.amount.toLocaleString('en-IN')}
                      </span>
                      {onDeletePayment && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPaymentToDeleteId(pay.id);
                          }}
                          className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg ml-2"
                          title="Delete Payment Log"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-xs text-gray-500 font-mono">No payment history logged yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Header Panel */}
      <div className="p-6 rounded-3xl glass-panel flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-white">Post-Production Editors</h2>
          <p className="text-xs text-gray-400 mt-1">Manage core editor registries, rating indices, task load balances, and ledger settlements.</p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center space-x-2 px-4.5 py-2.5 bg-gradient-to-r from-luxury-green-800 to-luxury-green-600 border border-gold-500/30 rounded-2xl text-white font-medium text-xs hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer gold-glow shrink-0"
        >
          <Plus className="w-4 h-4 text-gold-300" />
          <span>Add Editor Account</span>
        </button>
      </div>

      {/* Editor Grid display */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {editors.map((editor) => {
          const editorProjects = projects.filter(p => p.assignedEditorId === editor.id || (p.isSplitProject && p.secondEditorId === editor.id));
          const completedCuts = editorProjects.filter(p => p.status === 'delivered' || p.status === 'closed').length;
          const totalEarningsVal = editorProjects.reduce((sum, p) => {
            if (p.isSplitProject) {
              if (p.assignedEditorId === editor.id) {
                return sum + (p.firstEditorShare || 0);
              } else if (p.secondEditorId === editor.id) {
                return sum + (p.secondEditorShare || 0);
              }
            }
            return sum + (p.editorPayment || 0);
          }, 0);
          
          const editorPaymentsTotal = payments
            .filter(pay => pay.entityId === editor.id && pay.entityType === 'editor')
            .reduce((sum, pay) => sum + (pay.amount || 0), 0);
            
          const pendingBalance = totalEarningsVal - editorPaymentsTotal;

          const activeCount = editorProjects.length - completedCuts;
          const workload = getWorkloadStatus(activeCount);

          return (
            <motion.div
              key={editor.id}
              layout
              onClick={() => { setSelectedEditor(editor); setIsDrawerOpen(true); }}
              className="p-6 rounded-3xl glass-panel relative overflow-hidden flex flex-col justify-between h-80 cursor-pointer group glass-panel-hover"
            >
              <div>
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3.5">
                    <img
                      src={editor.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'}
                      alt={editor.name}
                      className="w-12 h-12 rounded-2xl object-cover border border-luxury-green-800/30"
                    />
                    <div>
                      <h3 className="text-base font-bold text-white font-display group-hover:text-gold-400 transition-colors leading-tight">
                        {editor.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <div className="flex items-center space-x-1 text-gold-400">
                          <Star className="w-3 h-3 fill-gold-400" />
                          <span className="text-[10px] font-mono font-bold">{editor.rating.toFixed(1)}</span>
                        </div>
                        <span className="text-gray-600 text-[10px]">•</span>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold border ${workload.bg}`}>
                          <span className={`w-1 h-1 rounded-full ${workload.dot} mr-1 animate-pulse`} />
                          {workload.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => openEditModal(editor, e)}
                      className="p-2 hover:bg-luxury-green-800/20 text-gray-400 hover:text-gold-500 rounded-lg transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(editor.id, e)}
                      className="p-2 hover:bg-red-500/10 text-gray-400 hover:text-red-400 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 mt-5 text-[11px] text-gray-400">
                  <p className="flex items-center space-x-2">
                    <Mail className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                    <span className="truncate">{editor.email}</span>
                  </p>
                  <p className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                    <span>{editor.phone}</span>
                  </p>
                </div>
              </div>

              {/* Loader & Load Level */}
              <div className="border-t border-luxury-green-800/10 pt-4 mt-4 grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div>
                  <span className="text-gray-500 block">PRODUCTION LOAD</span>
                  <span className="text-white font-bold text-xs">{editorProjects.length - completedCuts} Active Cuts</span>
                </div>
                <div className="text-right">
                  <span className="text-gray-500 block">PENDING PAYOUT</span>
                  <span className="text-yellow-500 font-bold text-xs">₹{pendingBalance >= 0 ? pendingBalance.toLocaleString('en-IN') : 0}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Editor Detail Slideout Drawer */}
      <AnimatePresence>
        {isDrawerOpen && selectedEditor && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)} />

            <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
              <motion.div
                id="editor-detail-drawer"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 180 }}
                className="w-screen max-w-2xl bg-charcoal-900 border-l border-luxury-green-800/30 shadow-2xl flex flex-col justify-between"
              >
                {/* Drawer Header details */}
                <div className="p-6 border-b border-luxury-green-800/20 bg-charcoal-950/50 shrink-0 flex justify-between items-start">
                  <div className="flex items-center space-x-4">
                    <img
                      src={selectedEditor.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'}
                      alt=""
                      className="w-14 h-14 rounded-2xl object-cover border border-gold-500/20"
                    />
                    <div>
                      <h2 className="text-xl font-bold font-display text-white">{selectedEditor.name}</h2>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-gray-400">
                        <p className="flex items-center space-x-1">
                          <Star className="w-3.5 h-3.5 fill-gold-500 text-gold-500" />
                          <span className="font-bold text-gold-400 font-mono">{selectedEditor.rating.toFixed(1)} Editor Index</span>
                        </p>
                        <span className="text-gray-500">•</span>
                        {(() => {
                          const editorProjects = projects.filter(p => p.assignedEditorId === selectedEditor.id || (p.isSplitProject && p.secondEditorId === selectedEditor.id));
                          const completedCuts = editorProjects.filter(p => p.status === 'delivered' || p.status === 'closed').length;
                          const activeCount = editorProjects.length - completedCuts;
                          const workload = getWorkloadStatus(activeCount);
                          return (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${workload.bg}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${workload.dot} mr-1.5 animate-pulse`} />
                              {workload.label} ({activeCount} Active Cuts)
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-2 hover:bg-charcoal-800 rounded-xl text-gray-400"
                  >
                    ✕ Close
                  </button>
                </div>

                {/* Body elements */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  
                  {/* Financial Payout calculations */}
                  {(() => {
                    const editorProjects = projects.filter(p => p.assignedEditorId === selectedEditor.id || (p.isSplitProject && p.secondEditorId === selectedEditor.id));
                    const totalEarningsVal = editorProjects.reduce((sum, p) => {
                      if (p.isSplitProject) {
                        if (p.assignedEditorId === selectedEditor.id) {
                          return sum + (p.firstEditorShare || 0);
                        } else if (p.secondEditorId === selectedEditor.id) {
                          return sum + (p.secondEditorShare || 0);
                        }
                      }
                      return sum + (p.editorPayment || 0);
                    }, 0);
                    
                    const totalPaidVal = payments
                      .filter(pay => pay.entityId === selectedEditor.id && pay.entityType === 'editor')
                      .reduce((sum, pay) => sum + (pay.amount || 0), 0);

                    const pendingBalance = totalEarningsVal - totalPaidVal;

                    return (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-gold-500 font-mono">Editor ledger payouts</h3>
                          <button
                            onClick={() => setIsLoggingPayment(!isLoggingPayment)}
                            className="text-[10px] font-mono text-gold-400 hover:underline flex items-center space-x-1"
                          >
                            <PlusCircle className="w-3.5 h-3.5 mr-1" />
                            <span>Settle Payment</span>
                          </button>
                        </div>

                        {/* Settle Payment Panel */}
                        {isLoggingPayment && (
                          <form onSubmit={handleLogPaymentSubmit} className="p-4 bg-charcoal-950 rounded-2xl border border-gold-500/20 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[9px] font-mono text-gray-400 mb-1">Select Project</label>
                                <select
                                  value={paymentProjectId}
                                  onChange={(e) => setPaymentProjectId(e.target.value)}
                                  className="w-full bg-charcoal-900 border border-luxury-green-800/30 rounded-lg p-2 text-xs text-white"
                                  required
                                >
                                  <option value="">Choose Wedding Project</option>
                                  {editorProjects.map(proj => {
                                    const actualShare = proj.isSplitProject 
                                      ? (proj.assignedEditorId === selectedEditor.id ? proj.firstEditorShare : proj.secondEditorShare)
                                      : proj.editorPayment;
                                    return (
                                      <option key={proj.id} value={proj.id}>
                                        {proj.coupleName} (Share: ₹{(actualShare || 0).toLocaleString('en-IN')})
                                      </option>
                                    );
                                  })}
                                  <option value="misc_bonus">Miscellaneous / Advance / Bonus</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[9px] font-mono text-gray-400 mb-1">Settlement Amount (INR)</label>
                                <input
                                  type="number"
                                  placeholder="INR"
                                  value={paymentAmount}
                                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                                  className="w-full bg-charcoal-900 border border-luxury-green-800/30 rounded-lg p-2 text-xs text-white"
                                  required
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[9px] font-mono text-gray-400 mb-1">Payment Method</label>
                                <select
                                  value={paymentMethod}
                                  onChange={(e) => setPaymentMethod(e.target.value)}
                                  className="w-full bg-charcoal-900 border border-luxury-green-800/30 rounded-lg p-2 text-xs text-gray-300"
                                >
                                  <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                                  <option value="UPI / GPay">UPI / Google Pay</option>
                                  <option value="Cash">Cash</option>
                                  <option value="Cheque">Cheque</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[9px] font-mono text-gray-400 mb-1">Receipt Notes</label>
                                <input
                                  type="text"
                                  placeholder="Txn ID, reference, etc."
                                  value={paymentNotes}
                                  onChange={(e) => setPaymentNotes(e.target.value)}
                                  className="w-full bg-charcoal-900 border border-luxury-green-800/30 rounded-lg p-2 text-xs text-white"
                                />
                              </div>
                            </div>

                            <div className="flex justify-end space-x-2 pt-2">
                              <button
                                type="button"
                                onClick={() => setIsLoggingPayment(false)}
                                className="px-3 py-1 text-[10px] text-gray-400 hover:text-gray-200"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="px-3.5 py-1.5 bg-gold-500 text-charcoal-950 font-bold text-[10px] rounded-lg"
                              >
                                Confirm Settlement
                              </button>
                            </div>
                          </form>
                        )}

                        <div className="grid grid-cols-3 gap-3">
                          <div className="p-4 bg-charcoal-850/40 rounded-2xl border border-luxury-green-800/10 text-center">
                            <span className="text-[9px] font-mono text-gray-500 block">TOTAL WORK EARNED</span>
                            <span className="text-base font-bold text-white mt-1 block">₹{totalEarningsVal.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="p-4 bg-emerald-950/20 rounded-2xl border border-emerald-500/10 text-center">
                            <span className="text-[9px] font-mono text-emerald-500 block">DISBURSED PAID</span>
                            <span className="text-base font-bold text-emerald-400 mt-1 block">₹{totalPaidVal.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="p-4 bg-red-950/20 rounded-2xl border border-red-500/10 text-center">
                            <span className="text-[9px] font-mono text-red-500 block">OUTSTANDING DUE</span>
                            <span className="text-base font-bold text-red-400 mt-1 block">₹{pendingBalance >= 0 ? pendingBalance.toLocaleString('en-IN') : 0}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Assigned weddings history */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gold-500 font-mono">Assigned Wedding cuts</h3>
                    <div className="space-y-2">
                      {projects.filter(p => p.assignedEditorId === selectedEditor.id || (p.isSplitProject && p.secondEditorId === selectedEditor.id)).length > 0 ? (
                        projects.filter(p => p.assignedEditorId === selectedEditor.id || (p.isSplitProject && p.secondEditorId === selectedEditor.id)).map((proj) => {
                          const actualShare = proj.isSplitProject 
                            ? (proj.assignedEditorId === selectedEditor.id ? proj.firstEditorShare : proj.secondEditorShare)
                            : proj.editorPayment;
                          return (
                            <div 
                              key={proj.id} 
                              className="p-3.5 rounded-2xl bg-charcoal-950/60 border border-luxury-green-800/10 flex justify-between items-center"
                            >
                              <div>
                                <span className="text-[9px] font-mono text-gold-400">{proj.id}</span>
                                <h4 className="text-xs font-bold text-white mt-1">{proj.coupleName}</h4>
                                <p className="text-[10px] text-gray-400 mt-0.5">{proj.studioName} • {proj.eventType}</p>
                                {proj.isSplitProject && (
                                  <span className="inline-block text-[8px] font-mono px-1.5 py-0.5 rounded bg-gold-500/10 text-gold-400 border border-gold-500/15 uppercase mt-1">
                                    Split Project (Lead: {proj.assignedEditorName})
                                  </span>
                                )}
                              </div>

                              <div className="text-right">
                                <span className="text-xs font-bold text-white block">₹{(actualShare || 0).toLocaleString('en-IN')}</span>
                                <span className={`inline-block text-[8px] font-mono px-2 py-0.5 rounded uppercase mt-1 ${
                                  proj.status === 'delivered' || proj.status === 'closed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-500'
                                }`}>
                                  {proj.status}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-6 text-[10px] text-gray-500 font-mono">No projects assigned currently.</div>
                      )}
                    </div>
                  </div>

                  {/* Payment settlement history log */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gold-500 font-mono">Payment ledger log</h3>
                    <div className="space-y-2">
                      {payments.filter(pay => pay.entityId === selectedEditor.id && pay.entityType === 'editor').length > 0 ? (
                        payments.filter(pay => pay.entityId === selectedEditor.id && pay.entityType === 'editor').map((pay) => (
                          <div 
                            key={pay.id} 
                            className="p-3 bg-charcoal-950/30 rounded-xl border border-luxury-green-800/5 flex justify-between items-center"
                          >
                            <div>
                              <span className="text-[9px] font-mono text-gray-500">{pay.date} • {pay.paymentMethod}</span>
                              <p className="text-xs text-gray-300 font-semibold mt-0.5 truncate">{pay.projectCoupleName}</p>
                              {pay.notes && <p className="text-[10px] text-gray-500 italic mt-0.5">Notes: {pay.notes}</p>}
                            </div>
                            <div className="flex items-center space-x-2 shrink-0">
                              <span className="text-xs font-mono font-bold text-emerald-400">
                                + ₹{pay.amount.toLocaleString('en-IN')}
                              </span>
                              {onDeletePayment && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPaymentToDeleteId(pay.id);
                                  }}
                                  className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg ml-2"
                                  title="Delete Settlement Record"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-[10px] text-gray-500 font-mono">No settlements recorded.</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="p-6 border-t border-luxury-green-800/20 bg-charcoal-950/40 flex justify-between shrink-0">
                  <button
                    onClick={(e) => openEditModal(selectedEditor, e)}
                    className="flex items-center space-x-2 px-4 py-2.5 bg-luxury-green-800 text-gold-400 text-xs font-bold rounded-xl border border-gold-500/20"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit Profile Spec</span>
                  </button>

                  <button
                    onClick={(e) => handleDelete(selectedEditor.id, e)}
                    className="flex items-center space-x-2 px-4 py-2.5 hover:bg-red-500/10 text-red-400 text-xs font-bold rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Retire Editor</span>
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE & EDIT Editor modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />

              <motion.div
                id="editor-form-modal"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform rounded-3xl glass-panel relative z-10"
              >
                <h3 className="text-lg font-bold text-white font-display mb-5">
                  {editingEditor ? `Edit Profile: ${editingEditor.name}` : 'Register New Editor'}
                </h3>

                <form onSubmit={handleSaveEditor} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Editor Full Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
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
                      <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Joined Date</label>
                      <input
                        type="date"
                        required
                        value={joinedDate}
                        onChange={(e) => setJoinedDate(e.target.value)}
                        onClick={(e) => { try { e.currentTarget.showPicker(); } catch (err) {} }}
                        className="w-full bg-charcoal-900 border border-luxury-green-800/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
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

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Performance Index (1-5)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        max="5"
                        required
                        value={rating}
                        onChange={(e) => setRating(Number(e.target.value))}
                        className="w-full bg-charcoal-900 border border-luxury-green-800/30 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* Editor Profile Photo Section */}
                  <div className="p-4 bg-charcoal-950/40 border border-luxury-green-800/10 rounded-2xl space-y-3">
                    <label className="block text-[10px] font-mono text-gold-400 uppercase tracking-wider font-semibold">
                      Editor Profile Photo
                    </label>
                    <div className="flex items-center space-x-4">
                      {/* Avatar circular preview */}
                      <div className="relative shrink-0 w-16 h-16 rounded-full overflow-hidden border border-gold-500/20 bg-charcoal-900 flex items-center justify-center group">
                        {photo ? (
                          <>
                            <img 
                              src={photo} 
                              alt="Editor Preview" 
                              className="w-full h-full object-cover" 
                              referrerPolicy="no-referrer"
                            />
                            <button
                              type="button"
                              onClick={() => setPhoto('')}
                              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-red-400 font-mono font-bold transition-opacity duration-200"
                            >
                              Remove
                            </button>
                          </>
                        ) : (
                          <div className="text-gray-600 flex flex-col items-center">
                            <ImageIcon className="w-6 h-6 text-gray-500" />
                          </div>
                        )}
                      </div>

                      {/* Select methods */}
                      <div className="flex-1 space-y-2">
                        {/* File Upload Selector */}
                        <div className="relative">
                          <label className="flex items-center justify-center space-x-2 px-3 py-2 bg-[#211715] hover:bg-[#120c0b] border border-gold-500/10 hover:border-gold-500/30 text-gray-300 hover:text-white rounded-xl text-xs transition-all cursor-pointer font-semibold shadow-sm">
                            <Upload className="w-3.5 h-3.5 text-gold-400" />
                            <span>{isUploading ? "Reading..." : "Upload Profile Photo"}</span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={handleFileChange} 
                              className="hidden" 
                            />
                          </label>
                        </div>

                        {/* Optional text URL input */}
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Or paste image URL (https://...)"
                            value={photo.startsWith('data:image/') ? '' : photo}
                            onChange={(e) => setPhoto(e.target.value)}
                            className="w-full bg-charcoal-900/60 border border-luxury-green-800/15 rounded-xl px-3 py-1.5 text-[10px] text-gray-300 focus:outline-none placeholder:text-gray-600"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Core Editing Competencies / Notes</label>
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
                      {editingEditor ? 'Save profile' : 'Confirm Registration'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Editor Confirmation Modal */}
      <AnimatePresence>
        {editorToDeleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={() => setEditorToDeleteId(null)} />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md p-6 overflow-hidden text-left bg-charcoal-900 border border-red-500/30 rounded-3xl shadow-[0_20px_50px_rgba(239,68,68,0.2)] z-10"
            >
              <div className="flex items-start space-x-3.5">
                <div className="p-3 bg-red-500/10 text-red-400 rounded-2xl border border-red-500/20">
                  <Laptop className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-display">Retire Editor</h3>
                  <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                    Are you sure you want to retire this editor? Current production loads will need to be reallocated. This operation cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setEditorToDeleteId(null)}
                  className="px-4 py-2.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (editorToDeleteId) {
                      await onDeleteEditor(editorToDeleteId);
                      setEditorToDeleteId(null);
                      setSelectedEditor(null);
                      setIsDrawerOpen(false);
                      triggerToast("Editor Retired", "Editor profile and load records unlinked.");
                    }
                  }}
                  className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold text-xs rounded-xl shadow-[0_4px_15px_rgba(239,68,68,0.25)] transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.99]"
                >
                  Confirm Retire
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Payment Log Confirmation Modal */}
      <AnimatePresence>
        {paymentToDeleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={() => setPaymentToDeleteId(null)} />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md p-6 overflow-hidden text-left bg-charcoal-900 border border-red-500/30 rounded-3xl shadow-[0_20px_50px_rgba(239,68,68,0.2)] z-10"
            >
              <div className="flex items-start space-x-3.5">
                <div className="p-3 bg-red-500/10 text-red-400 rounded-2xl border border-red-500/20">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-display">Delete Payment Log</h3>
                  <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                    Are you sure you want to permanently delete this payment ledger record? This will erase the log from editor payout statements.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setPaymentToDeleteId(null)}
                  className="px-4 py-2.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (paymentToDeleteId && onDeletePayment) {
                      await onDeletePayment(paymentToDeleteId);
                      const deletedId = paymentToDeleteId;
                      setPaymentToDeleteId(null);
                      triggerToast("Payment Deleted", `Payment log ${deletedId} deleted successfully.`);
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
              <Laptop className="w-4 h-4" />
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

export default EditorsView;
