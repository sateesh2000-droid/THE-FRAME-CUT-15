import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc, 
  setDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db, seedDatabaseIfEmpty } from './firebase';
import { 
  Project, 
  Studio, 
  Editor, 
  Expense, 
  Invoice, 
  AppNotification, 
  CalendarEvent, 
  Revision, 
  PaymentHistory,
  UserProfile,
  UserRole
} from './types';

// Importing Views
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import ProjectsView from './components/ProjectsView';
import RegistryView from './components/RegistryView';
import StudiosView from './components/StudiosView';
import EditorsView from './components/EditorsView';
import FinanceView from './components/FinanceView';
import DataManagerView from './components/DataManagerView';
import InvoiceView from './components/InvoiceView';
import ReportsView from './components/ReportsView';
import CalendarView from './components/CalendarView';
import NotificationsView from './components/NotificationsView';
import SettingsView from './components/SettingsView';
import LoginView from './components/LoginView';
import GeminiAIView from './components/GeminiAIView';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [subActionTrigger, setSubActionTrigger] = useState<string>('');

  // Color Palette/Theme preference with local storage persistence
  const [theme, setTheme] = useState<'luxury-green' | 'midnight-gold'>(() => {
    const saved = localStorage.getItem('tfc_theme');
    return (saved === 'midnight-gold') ? 'midnight-gold' : 'luxury-green';
  });

  useEffect(() => {
    localStorage.setItem('tfc_theme', theme);
    document.body.classList.add('theme-transition');
    document.body.setAttribute('data-theme', theme);

    const timer = setTimeout(() => {
      document.body.classList.remove('theme-transition');
    }, 1000);

    return () => clearTimeout(timer);
  }, [theme]);

  // Firestore Collections States
  const [projects, setProjects] = useState<Project[]>([]);
  const [studios, setStudios] = useState<Studio[]>([]);
  const [editors, setEditors] = useState<Editor[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [payments, setPayments] = useState<PaymentHistory[]>([]);

  // 1. Online / Offline network detection listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 2. Seeding database if empty on start
  useEffect(() => {
    const runSeed = async () => {
      await seedDatabaseIfEmpty();
    };
    runSeed();
  }, []);

  // 3. Simulated persistent login session
  useEffect(() => {
    const savedUser = localStorage.getItem('tfc_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setCurrentUser(parsed);
      // Editors default to their assigned tab
      if (parsed.role === 'editor') {
        setActiveTab('projects');
      } else if (parsed.role === 'studio') {
        setActiveTab('projects');
      }
    }
  }, []);

  // 4. Real-time Firestore Subscriptions
  useEffect(() => {
    // Projects Sync
    const unsubProjects = onSnapshot(collection(db, 'projects'), (snap) => {
      const list: Project[] = [];
      snap.forEach(docSnap => {
        list.push({ ...docSnap.data() as any, id: docSnap.id });
      });
      // Sort newest created first
      setProjects(list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    });

    // Studios Sync
    const unsubStudios = onSnapshot(collection(db, 'studios'), (snap) => {
      const list: Studio[] = [];
      snap.forEach(docSnap => {
        list.push({ ...docSnap.data() as any, id: docSnap.id });
      });
      setStudios(list);
    });

    // Editors Sync
    const unsubEditors = onSnapshot(collection(db, 'editors'), (snap) => {
      const list: Editor[] = [];
      snap.forEach(docSnap => {
        list.push({ ...docSnap.data() as any, id: docSnap.id });
      });
      setEditors(list);
    });

    // Expenses Sync
    const unsubExpenses = onSnapshot(collection(db, 'expenses'), (snap) => {
      const list: Expense[] = [];
      snap.forEach(docSnap => {
        list.push({ ...docSnap.data() as any, id: docSnap.id });
      });
      setExpenses(list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    });

    // Invoices Sync
    const unsubInvoices = onSnapshot(collection(db, 'invoices'), (snap) => {
      const list: Invoice[] = [];
      snap.forEach(docSnap => {
        list.push({ ...docSnap.data() as any, id: docSnap.id });
      });
      setInvoices(list);
    });

    // Notifications Sync
    const unsubNotifs = onSnapshot(collection(db, 'notifications'), (snap) => {
      const list: AppNotification[] = [];
      snap.forEach(docSnap => {
        list.push({ ...docSnap.data() as any, id: docSnap.id });
      });
      setNotifications(list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    });

    // Calendar Sync
    const unsubCalendar = onSnapshot(collection(db, 'calendar'), (snap) => {
      const list: CalendarEvent[] = [];
      snap.forEach(docSnap => {
        list.push({ ...docSnap.data() as any, id: docSnap.id });
      });
      setCalendarEvents(list);
    });

    // Revisions Sync
    const unsubRevs = onSnapshot(collection(db, 'revisionHistory'), (snap) => {
      const list: Revision[] = [];
      snap.forEach(docSnap => {
        list.push({ ...docSnap.data() as any, id: docSnap.id });
      });
      setRevisions(list.sort((a, b) => b.revisionNumber - a.revisionNumber));
    });

    // Payments Sync
    const unsubPayments = onSnapshot(collection(db, 'editorPayments'), (snap) => {
      const list: PaymentHistory[] = [];
      snap.forEach(docSnap => {
        list.push({ ...docSnap.data() as any, id: docSnap.id });
      });
      setPayments(list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    });

    return () => {
      unsubProjects();
      unsubStudios();
      unsubEditors();
      unsubExpenses();
      unsubInvoices();
      unsubNotifs();
      unsubCalendar();
      unsubRevs();
      unsubPayments();
    };
  }, []);

  // 5. Automated Invoice Due Date Notifications check
  useEffect(() => {
    if (invoices.length === 0) return;

    const checkInvoiceDueDates = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const invoice of invoices) {
        if (invoice.status === 'paid') {
          // If the invoice is paid, clean up any pending notifications for it
          const approachingId = `notif-approaching-${invoice.id}`;
          const overdueId = `notif-overdue-${invoice.id}`;
          const hasApproaching = notifications.some(n => n.id === approachingId);
          const hasOverdue = notifications.some(n => n.id === overdueId);
          
          if (hasApproaching || hasOverdue) {
            try {
              if (hasApproaching) {
                await deleteDoc(doc(db, 'notifications', approachingId));
              }
              if (hasOverdue) {
                await deleteDoc(doc(db, 'notifications', overdueId));
              }
            } catch (e) {
              console.error('Error clearing paid invoice notifications:', e);
            }
          }
          continue;
        }

        const due = new Date(invoice.dueDate);
        due.setHours(0, 0, 0, 0);

        // Calculate difference in days
        const diffTime = due.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const studioId = invoice.studioId;

        if (diffDays < 0) {
          // Overdue invoice!
          const overdueId = `notif-overdue-${invoice.id}`;
          const existingNotif = notifications.find(n => n.id === overdueId);
          if (!existingNotif) {
            try {
              await setDoc(doc(db, 'notifications', overdueId), {
                id: overdueId,
                title: `Invoice Overdue: ${invoice.id}`,
                message: `Invoice ${invoice.id} for "${invoice.coupleName}" was due on ${invoice.dueDate} (overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'}). Outstanding balance: INR ${invoice.balanceDue.toLocaleString('en-IN')}.`,
                type: 'payment_pending',
                projectId: invoice.projectId,
                studioId: studioId,
                read: false,
                createdAt: new Date()
              });

              // Also auto-update status to overdue if not already
              if (invoice.status !== 'overdue') {
                await updateDoc(doc(db, 'invoices', invoice.id), { status: 'overdue' });
              }
            } catch (e) {
              console.error('Error creating overdue invoice notification:', e);
            }
          }
        } else if (diffDays <= 3 && diffDays >= 0) {
          // Approaching invoice (due within 3 days)
          const approachingId = `notif-approaching-${invoice.id}`;
          const existingNotif = notifications.find(n => n.id === approachingId);
          if (!existingNotif) {
            try {
              await setDoc(doc(db, 'notifications', approachingId), {
                id: approachingId,
                title: `Invoice Due Approaching: ${invoice.id}`,
                message: `Invoice ${invoice.id} for "${invoice.coupleName}" is due in ${diffDays} day${diffDays === 1 ? '' : 's'} (${invoice.dueDate}). Balance: INR ${invoice.balanceDue.toLocaleString('en-IN')}.`,
                type: 'invoice_pending',
                projectId: invoice.projectId,
                studioId: studioId,
                read: false,
                createdAt: new Date()
              });
            } catch (e) {
              console.error('Error creating approaching invoice notification:', e);
            }
          }
        }
      }
    };

    checkInvoiceDueDates();
  }, [invoices, notifications]);

  // Helper to recursively remove undefined properties from objects to prevent Firestore setDoc/updateDoc failures.
  const cleanUndefined = (obj: any): any => {
    if (obj === undefined || obj === null) return null;
    if (Array.isArray(obj)) {
      return obj.map(cleanUndefined);
    }
    if (typeof obj === 'object') {
      const constructorName = obj.constructor?.name;
      if (constructorName && constructorName !== 'Object' && constructorName !== 'Array') {
        return obj;
      }
      const clean: any = {};
      for (const key of Object.keys(obj)) {
        const val = obj[key];
        if (val !== undefined) {
          clean[key] = cleanUndefined(val);
        }
      }
      return clean;
    }
    return obj;
  };

  // --- CRUD Database Operations ---

  // Projects CRUD
  const handleAddProject = async (project: Omit<Project, 'createdAt' | 'updatedAt'>) => {
    const docRef = doc(db, 'projects', project.id);
    const cleanedProject = cleanUndefined(project);
    await setDoc(docRef, {
      ...cleanedProject,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  };

  const handleUpdateProject = async (id: string, updates: Partial<Project>) => {
    const docRef = doc(db, 'projects', id);
    const cleanedUpdates = cleanUndefined(updates);
    await updateDoc(docRef, {
      ...cleanedUpdates,
      updatedAt: serverTimestamp()
    });
  };

  const handleDeleteProject = async (id: string) => {
    const docRef = doc(db, 'projects', id);
    await deleteDoc(docRef);
  };

  // Revisions Logging
  const handleAddRevision = async (revision: Omit<Revision, 'id' | 'createdAt'>) => {
    const nextId = `rev-${Date.now()}`;
    const docRef = doc(db, 'revisionHistory', nextId);
    await setDoc(docRef, {
      ...cleanUndefined(revision),
      id: nextId,
      createdAt: serverTimestamp()
    });
  };

  const handleResolveRevision = async (revId: string) => {
    const docRef = doc(db, 'revisionHistory', revId);
    await updateDoc(docRef, { status: 'resolved' });
  };

  const handleDeleteRevision = async (revId: string) => {
    const docRef = doc(db, 'revisionHistory', revId);
    await deleteDoc(docRef);
  };

  // Studios CRUD
  const handleAddStudio = async (studio: Omit<Studio, 'createdAt'>) => {
    const docRef = doc(db, 'studios', studio.id);
    await setDoc(docRef, {
      ...cleanUndefined(studio),
      createdAt: serverTimestamp()
    });
  };

  const handleUpdateStudio = async (id: string, updates: Partial<Studio>) => {
    const docRef = doc(db, 'studios', id);
    await updateDoc(docRef, cleanUndefined(updates));
  };

  const handleDeleteStudio = async (id: string) => {
    const docRef = doc(db, 'studios', id);
    await deleteDoc(docRef);
  };

  // Editors CRUD
  const handleAddEditor = async (editor: Omit<Editor, 'id'>) => {
    const generatedId = `editor-${editor.name.toLowerCase().replace(/\s+/g, '-')}`;
    const docRef = doc(db, 'editors', generatedId);
    await setDoc(docRef, {
      ...cleanUndefined(editor),
      id: generatedId,
      createdAt: serverTimestamp()
    });
  };

  const handleUpdateEditor = async (id: string, updates: Partial<Editor>) => {
    const docRef = doc(db, 'editors', id);
    await updateDoc(docRef, cleanUndefined(updates));
  };

  const handleDeleteEditor = async (id: string) => {
    const docRef = doc(db, 'editors', id);
    await deleteDoc(docRef);
  };

  // Expense Logger
  const handleAddExpense = async (expense: Omit<Expense, 'id' | 'createdAt'>) => {
    const generatedId = `exp-${Date.now()}`;
    const docRef = doc(db, 'expenses', generatedId);
    await setDoc(docRef, {
      ...cleanUndefined(expense),
      id: generatedId,
      createdAt: serverTimestamp()
    });
  };

  const handleDeleteExpense = async (id: string) => {
    const docRef = doc(db, 'expenses', id);
    await deleteDoc(docRef);
  };

  const handleDeleteInvoice = async (id: string) => {
    const docRef = doc(db, 'invoices', id);
    await deleteDoc(docRef);
  };

  const handleUpdateInvoice = async (id: string, updates: Partial<Invoice>) => {
    const docRef = doc(db, 'invoices', id);
    await updateDoc(docRef, cleanUndefined(updates));
  };

  // Invoice creator
  const handleAddInvoice = async (invoice: Omit<Invoice, 'id' | 'createdAt'>) => {
    const generatedId = `INV-2026-${Date.now().toString().slice(-4)}`;
    const docRef = doc(db, 'invoices', generatedId);
    await setDoc(docRef, {
      ...cleanUndefined(invoice),
      id: generatedId,
      createdAt: serverTimestamp()
    });
  };

  // Settle Editor Payment ledger
  const handleLogPayment = async (pay: Omit<PaymentHistory, 'id' | 'createdAt'>) => {
    const generatedId = `pay-${Date.now()}`;
    const docRef = doc(db, 'editorPayments', generatedId);
    await setDoc(docRef, {
      ...cleanUndefined(pay),
      id: generatedId,
      createdAt: serverTimestamp()
    });
  };

  const handleDeletePayment = async (id: string) => {
    const docRef = doc(db, 'editorPayments', id);
    await deleteDoc(docRef);
  };

  // Notification managers
  const handleMarkRead = async (id: string) => {
    const docRef = doc(db, 'notifications', id);
    await updateDoc(docRef, { read: true });
  };

  const handleClearNotification = async (id: string) => {
    const docRef = doc(db, 'notifications', id);
    await deleteDoc(docRef);
  };

  // Clear / Reset Entire database
  const handleResetDatabase = async () => {
    // Clear all existing manually (seedDatabaseIfEmpty automatically bypasses if studios present, so we clean)
    projects.forEach(p => deleteDoc(doc(db, 'projects', p.id)));
    studios.forEach(s => deleteDoc(doc(db, 'studios', s.id)));
    editors.forEach(ed => deleteDoc(doc(db, 'editors', ed.id)));
    expenses.forEach(e => deleteDoc(doc(db, 'expenses', e.id)));
    invoices.forEach(i => deleteDoc(doc(db, 'invoices', i.id)));
    notifications.forEach(n => deleteDoc(doc(db, 'notifications', n.id)));
    calendarEvents.forEach(c => deleteDoc(doc(db, 'calendar', c.id)));
    revisions.forEach(r => deleteDoc(doc(db, 'revisionHistory', r.id)));
    payments.forEach(p => deleteDoc(doc(db, 'editorPayments', p.id)));

    // Seeder will re-fire
    setTimeout(() => {
      seedDatabaseIfEmpty();
    }, 1000);
  };

  // --- Login handler ---
  const handleLogin = async (email: string, role: UserRole, id?: string) => {
    const profile: UserProfile = {
      uid: `${role}-uid-${Date.now()}`,
      email,
      name: (email === 'satish@framecut.com' || email === 'sateesh2000') ? 'Satish Tiwari' : (email === 'vansh@framecut.com' || email === 'vansh2000') ? 'Vansh Tiwari' : 'Wedding By KK',
      role,
      studioId: role === 'studio' ? id : undefined,
      editorId: role === 'editor' ? id : undefined,
      createdAt: new Date()
    };
    setCurrentUser(profile);
    localStorage.setItem('tfc_user', JSON.stringify(profile));
    
    // Redirect role-specific defaults
    if (role === 'editor' || role === 'studio') {
      setActiveTab('projects');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('tfc_user');
  };

  const handleQuickAction = (tab: string, subAction?: string) => {
    if (tab === 'projects' && subAction === 'add_project') {
      setActiveTab('registry');
      return;
    }
    setActiveTab(tab);
    if (subAction) {
      setSubActionTrigger(subAction);
      setTimeout(() => setSubActionTrigger(''), 500); // clear
    }
  };

  // Filter project arrays based on roles
  const getRoleFilteredProjects = () => {
    if (currentUser?.role === 'editor' && currentUser.editorId) {
      // Editors only see assigned weddings
      return projects.filter(p => p.assignedEditorId === currentUser.editorId);
    }
    if (currentUser?.role === 'studio' && currentUser.studioId) {
      // Studios only see their weddings
      return projects.filter(p => p.studioId === currentUser.studioId);
    }
    return projects;
  };

  const roleFilteredProjects = getRoleFilteredProjects();

  const getRoleFilteredNotifications = () => {
    if (currentUser?.role === 'studio' && currentUser.studioId) {
      return notifications.filter(n => {
        if (n.studioId) return n.studioId === currentUser.studioId;
        if (n.projectId) {
          const proj = projects.find(p => p.id === n.projectId);
          return proj?.studioId === currentUser.studioId;
        }
        return false;
      });
    }
    if (currentUser?.role === 'editor' && currentUser.editorId) {
      return notifications.filter(n => {
        if (n.projectId) {
          const proj = projects.find(p => p.id === n.projectId);
          return proj?.assignedEditorId === currentUser.editorId || proj?.secondEditorId === currentUser.editorId;
        }
        return true;
      });
    }
    return notifications;
  };

  const roleFilteredNotifications = getRoleFilteredNotifications();

  // Render correct tab view panel
  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            projects={projects}
            studios={studios}
            editors={editors}
            expenses={expenses}
            notifications={roleFilteredNotifications}
            calendarEvents={calendarEvents}
            onQuickAction={handleQuickAction}
            isOnline={isOnline}
            invoices={invoices}
            payments={payments}
            onLogPayment={handleLogPayment}
            onUpdateProject={handleUpdateProject}
          />
        );
      case 'gemini':
        return (
          <GeminiAIView
            projects={projects}
            studios={studios}
            editors={editors}
            expenses={expenses}
            invoices={invoices}
            calendarEvents={calendarEvents}
            currentUser={currentUser}
          />
        );
      case 'registry':
        return (
          <RegistryView
            studios={studios}
            editors={editors}
            projects={projects}
            userRole={currentUser?.role || 'admin'}
            currentStudioId={currentUser?.studioId}
            onAddProject={handleAddProject}
            onRedirectToProjects={() => setActiveTab('projects')}
          />
        );
      case 'projects':
        return (
          <ProjectsView
            projects={roleFilteredProjects}
            studios={studios}
            editors={editors}
            revisions={revisions}
            userRole={currentUser?.role || 'admin'}
            currentStudioId={currentUser?.studioId}
            onAddProject={handleAddProject}
            onUpdateProject={handleUpdateProject}
            onDeleteProject={handleDeleteProject}
            onAddRevision={handleAddRevision}
            onResolveRevision={handleResolveRevision}
            onDeleteRevision={handleDeleteRevision}
            onRedirectToRegistry={() => setActiveTab('registry')}
            initialTriggerAction={subActionTrigger === 'add_project' ? 'add_project' : undefined}
          />
        );
      case 'studios':
        return (
          <StudiosView
            studios={studios}
            projects={projects}
            invoices={invoices}
            onAddStudio={handleAddStudio}
            onUpdateStudio={handleUpdateStudio}
            onDeleteStudio={handleDeleteStudio}
            onDeleteInvoice={handleDeleteInvoice}
            onUpdateInvoice={handleUpdateInvoice}
          />
        );
      case 'editors':
        return (
          <EditorsView
            editors={editors}
            projects={projects}
            payments={payments}
            userRole={currentUser?.role || 'admin'}
            currentEditorId={currentUser?.editorId}
            currentUserEmail={currentUser?.email}
            onAddEditor={handleAddEditor}
            onUpdateEditor={handleUpdateEditor}
            onDeleteEditor={handleDeleteEditor}
            onLogPayment={handleLogPayment}
            onDeletePayment={handleDeletePayment}
          />
        );
      case 'finance':
        return (
          <FinanceView
            projects={projects}
            expenses={expenses}
            editors={editors}
            studios={studios}
            payments={payments}
            invoices={invoices}
            onAddExpense={handleAddExpense}
            onDeleteExpense={handleDeleteExpense}
            initialTriggerAction={subActionTrigger === 'add_expense' ? 'add_expense' : undefined}
          />
        );
      case 'datamanager':
        return (
          <DataManagerView
            projects={roleFilteredProjects}
            onUpdateProject={handleUpdateProject}
          />
        );
      case 'invoice':
        return (
          <InvoiceView
            projects={roleFilteredProjects}
            studios={studios}
            invoices={invoices}
            onAddInvoice={handleAddInvoice}
            onDeleteInvoice={handleDeleteInvoice}
            onUpdateInvoice={handleUpdateInvoice}
          />
        );
      case 'reports':
        return (
          <ReportsView
            projects={projects}
            studios={studios}
            editors={editors}
            expenses={expenses}
          />
        );
      case 'calendar':
        return (
          <CalendarView
            projects={roleFilteredProjects}
            events={calendarEvents}
          />
        );
      case 'notifications':
        return (
          <NotificationsView
            notifications={roleFilteredNotifications}
            onMarkRead={handleMarkRead}
            onClearNotification={handleClearNotification}
          />
        );
      case 'settings':
        return (
          <SettingsView
            onResetDatabase={handleResetDatabase}
            isOnline={isOnline}
            currentUser={currentUser}
            theme={theme}
            onThemeChange={setTheme}
            projects={projects}
            studios={studios}
            editors={editors}
            expenses={expenses}
            invoices={invoices}
            calendarEvents={calendarEvents}
            revisions={revisions}
            payments={payments}
          />
        );
      default:
        return <div>View not found</div>;
    }
  };

  // If not logged in, render cinematic brand portal
  if (!currentUser) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-charcoal-950 text-gray-200">
      
      {/* Floating sidebar menu */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Sidebar layout spacer to reserve space on desktop and prevent reflows on hover */}
      <div className="hidden md:block w-24 shrink-0 mr-4" />

      {/* Main View Container */}
      <main id="main-content-flow" className="flex-1 p-4 md:p-8 md:pl-6 overflow-x-hidden min-h-screen">
        <div className="max-w-7xl mx-auto pb-28 md:pb-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
