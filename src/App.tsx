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
  getDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db, seedDatabaseIfEmpty } from './firebase';
import { compressImage } from './utils';
import { 
  Project, 
  Studio, 
  Editor, 
  Expense, 
  AppNotification, 
  CalendarEvent, 
  Revision, 
  PaymentHistory,
  UserProfile,
  UserRole
} from './types';

// Parallax Design Background
import ParallaxBackground from './components/ParallaxBackground';

// Importing Views
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import ProjectsView from './components/ProjectsView';
import RegistryView from './components/RegistryView';
import StudiosView from './components/StudiosView';
import EditorsView from './components/EditorsView';
import DataManagerView from './components/DataManagerView';
import ReportsView from './components/ReportsView';
import CalendarView from './components/CalendarView';
import NotificationsView from './components/NotificationsView';
import SettingsView from './components/SettingsView';
import LoginView from './components/LoginView';
import GeminiAIView from './components/GeminiAIView';
import InvoiceView from './components/InvoiceView';
import FinancialOverviewView from './components/FinancialOverviewView';
import { useDeadlineRunner } from './hooks/useDeadlineRunner';
import { Zap, X } from 'lucide-react';

// Helper to convert any Firebase/JS timestamp or date safely to milliseconds
const getTimestampMs = (val: any): number => {
  if (!val) return 0;
  if (typeof val.toMillis === 'function') return val.toMillis();
  if (val.seconds !== undefined) return val.seconds * 1000 + (val.nanoseconds || 0) / 1000000;
  if (val instanceof Date) return val.getTime();
  if (typeof val === 'string' || typeof val === 'number') {
    const parsed = new Date(val).getTime();
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [subActionTrigger, setSubActionTrigger] = useState<string>('');

  const lastCheckedSignatureRef = React.useRef<string>('');

  // Color Palette/Theme preference with local storage persistence
  const [theme, setTheme] = useState<'luxury-green' | 'midnight-gold' | 'royal-sapphire'>(() => {
    const saved = localStorage.getItem('tfc_theme');
    if (saved === 'midnight-gold' || saved === 'royal-sapphire') return saved;
    return 'luxury-green';
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
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);

  // Initialize Background Deadline Task Runner Service
  const {
    isRunning: runnerIsRunning,
    lastCheckTime: runnerLastCheckTime,
    checkCount: runnerCheckCount,
    recentToastMessage: runnerToastMessage,
    dismissToast: dismissRunnerToast,
    triggerManualCheck: handleRunnerManualCheck
  } = useDeadlineRunner(calendarEvents, notifications);

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

  // 3. Require password on every page open / refresh (no auto-persistent session)
  useEffect(() => {
    // Clear any cached user session on page load so user must log in with password every time
    localStorage.removeItem('tfc_user');
    setCurrentUser(null);
  }, []);

  // 4. Real-time Firestore Subscriptions
  useEffect(() => {
    let unsubProjects = () => {};
    let unsubStudios = () => {};
    let unsubEditors = () => {};
    let unsubExpenses = () => {};
    let unsubNotifs = () => {};
    let unsubCalendar = () => {};
    let unsubRevs = () => {};
    let unsubPayments = () => {};

    try {
      // Projects Sync
      unsubProjects = onSnapshot(
        collection(db, 'projects'),
        (snap) => {
          const list: Project[] = [];
          snap.forEach(docSnap => {
            list.push({ ...docSnap.data() as any, id: docSnap.id });
          });
          // Sort newest created first
          setProjects(list.sort((a, b) => getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt)));
        },
        (error) => {
          console.error("Error syncing projects from Firestore:", error);
        }
      );

      // Studios Sync
      unsubStudios = onSnapshot(
        collection(db, 'studios'),
        (snap) => {
          const list: Studio[] = [];
          snap.forEach(docSnap => {
            list.push({ ...docSnap.data() as any, id: docSnap.id });
          });
          setStudios(list);
        },
        (error) => {
          console.error("Error syncing studios from Firestore:", error);
        }
      );

      // Editors Sync
      unsubEditors = onSnapshot(
        collection(db, 'editors'),
        (snap) => {
          const list: Editor[] = [];
          snap.forEach(docSnap => {
            list.push({ ...docSnap.data() as any, id: docSnap.id });
          });
          setEditors(list);
        },
        (error) => {
          console.error("Error syncing editors from Firestore:", error);
        }
      );

      // Expenses Sync
      unsubExpenses = onSnapshot(
        collection(db, 'expenses'),
        (snap) => {
          const list: Expense[] = [];
          snap.forEach(docSnap => {
            list.push({ ...docSnap.data() as any, id: docSnap.id });
          });
          setExpenses(list.sort((a, b) => {
            const timeA = a.date ? new Date(a.date).getTime() : 0;
            const timeB = b.date ? new Date(b.date).getTime() : 0;
            return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
          }));
        },
        (error) => {
          console.error("Error syncing expenses from Firestore:", error);
        }
      );

      // Notifications Sync
      unsubNotifs = onSnapshot(
        collection(db, 'notifications'),
        (snap) => {
          const list: AppNotification[] = [];
          snap.forEach(docSnap => {
            list.push({ ...docSnap.data() as any, id: docSnap.id });
          });
          setNotifications(list.sort((a, b) => getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt)));
        },
        (error) => {
          console.error("Error syncing notifications from Firestore:", error);
        }
      );

      // Calendar Sync
      unsubCalendar = onSnapshot(
        collection(db, 'calendar'),
        (snap) => {
          const list: CalendarEvent[] = [];
          snap.forEach(docSnap => {
            list.push({ ...docSnap.data() as any, id: docSnap.id });
          });
          setCalendarEvents(list);
        },
        (error) => {
          console.error("Error syncing calendar events from Firestore:", error);
        }
      );

      // Revisions Sync
      unsubRevs = onSnapshot(
        collection(db, 'revisionHistory'),
        (snap) => {
          const list: Revision[] = [];
          snap.forEach(docSnap => {
            list.push({ ...docSnap.data() as any, id: docSnap.id });
          });
          setRevisions(list.sort((a, b) => (b.revisionNumber || 0) - (a.revisionNumber || 0)));
        },
        (error) => {
          console.error("Error syncing revision history from Firestore:", error);
        }
      );

      // Payments Sync
      unsubPayments = onSnapshot(
        collection(db, 'editorPayments'),
        (snap) => {
          const list: PaymentHistory[] = [];
          snap.forEach(docSnap => {
            list.push({ ...docSnap.data() as any, id: docSnap.id });
          });
          setPayments(list.sort((a, b) => {
            const timeA = a.date ? new Date(a.date).getTime() : 0;
            const timeB = b.date ? new Date(b.date).getTime() : 0;
            return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
          }));
        },
        (error) => {
          console.error("Error syncing payments from Firestore:", error);
        }
      );

      // Invoices Sync
      onSnapshot(
        collection(db, 'studioInvoices'),
        (snap) => {
          const list: any[] = [];
          snap.forEach(docSnap => {
            list.push({ ...docSnap.data(), id: docSnap.id });
          });
          setInvoices(list);
        },
        (error) => {
          console.error("Error syncing invoices from Firestore:", error);
        }
      );
    } catch (e) {
      console.error("Critical error setting up real-time subscriptions:", e);
    }

    return () => {
      unsubProjects();
      unsubStudios();
      unsubEditors();
      unsubExpenses();
      unsubNotifs();
      unsubCalendar();
      unsubRevs();
      unsubPayments();
    };
  }, []);

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
    let sanitizedStudio = { ...studio };
    if (sanitizedStudio.logoUrl && sanitizedStudio.logoUrl.startsWith('data:image/')) {
      sanitizedStudio.logoUrl = await compressImage(sanitizedStudio.logoUrl, 400, 400, 0.7);
    }
    const docRef = doc(db, 'studios', studio.id);
    await setDoc(docRef, {
      ...cleanUndefined(sanitizedStudio),
      createdAt: serverTimestamp()
    });
  };

  const handleUpdateStudio = async (id: string, updates: Partial<Studio>) => {
    let sanitizedUpdates = { ...updates };
    if (sanitizedUpdates.logoUrl && sanitizedUpdates.logoUrl.startsWith('data:image/')) {
      sanitizedUpdates.logoUrl = await compressImage(sanitizedUpdates.logoUrl, 400, 400, 0.7);
    }
    const docRef = doc(db, 'studios', id);
    await updateDoc(docRef, cleanUndefined(sanitizedUpdates));
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

  const handleUpdateExpense = async (id: string, updates: Partial<Expense>) => {
    const docRef = doc(db, 'expenses', id);
    await updateDoc(docRef, cleanUndefined(updates));
  };

  const handleDeleteExpense = async (id: string) => {
    const docRef = doc(db, 'expenses', id);
    await deleteDoc(docRef);
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

  const handleUpdatePayment = async (id: string, updates: Partial<PaymentHistory>) => {
    const docRef = doc(db, 'editorPayments', id);
    await updateDoc(docRef, cleanUndefined(updates));
  };

  const handleDeletePayment = async (id: string) => {
    try {
      console.log("handleDeletePayment initiating for ID:", id);
      const docRef = doc(db, 'editorPayments', id);
      await deleteDoc(docRef);
      console.log("handleDeletePayment completed successfully for ID:", id);
    } catch (error) {
      console.error("Error deleting payment document:", error);
      alert("Failed to delete transaction: " + (error instanceof Error ? error.message : String(error)));
      throw error;
    }
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

  const handleClearAllNotifications = async () => {
    notifications.forEach(async (n) => {
      await deleteDoc(doc(db, 'notifications', n.id));
    });
  };

  // Invoice Draft Save & Delete
  const handleSaveInvoiceDraft = async (invoiceData: any) => {
    const docId = invoiceData.invoiceNo || `AI-2026-${Date.now().toString().slice(-4)}`;
    const docRef = doc(db, 'studioInvoices', docId);
    await setDoc(docRef, {
      ...cleanUndefined(invoiceData),
      id: docId,
      createdAt: serverTimestamp()
    });
  };

  const handleDeleteInvoiceDraft = async (id: string) => {
    const docRef = doc(db, 'studioInvoices', id);
    await deleteDoc(docRef);
  };

  // Calendar Events CRUD
  const handleAddCalendarEvent = async (evt: Omit<CalendarEvent, 'id'>) => {
    const generatedId = `evt-${Date.now()}`;
    const docRef = doc(db, 'calendar', generatedId);
    await setDoc(docRef, {
      ...cleanUndefined(evt),
      id: generatedId,
      createdAt: serverTimestamp()
    });
  };

  const handleUpdateCalendarEvent = async (id: string, updates: Partial<CalendarEvent>) => {
    const docRef = doc(db, 'calendar', id);
    await updateDoc(docRef, cleanUndefined(updates));
  };

  const handleDeleteCalendarEvent = async (id: string) => {
    const docRef = doc(db, 'calendar', id);
    await deleteDoc(docRef);
  };

  // Clear / Reset Entire database
  const handleResetDatabase = async () => {
    // Clear all existing manually (seedDatabaseIfEmpty automatically bypasses if studios present, so we clean)
    projects.forEach(p => deleteDoc(doc(db, 'projects', p.id)));
    studios.forEach(s => deleteDoc(doc(db, 'studios', s.id)));
    editors.forEach(ed => deleteDoc(doc(db, 'editors', ed.id)));
    expenses.forEach(e => deleteDoc(doc(db, 'expenses', e.id)));
    notifications.forEach(n => deleteDoc(doc(db, 'notifications', n.id)));
    calendarEvents.forEach(c => deleteDoc(doc(db, 'calendar', c.id)));
    revisions.forEach(r => deleteDoc(doc(db, 'revisionHistory', r.id)));
    payments.forEach(p => deleteDoc(doc(db, 'editorPayments', p.id)));

    // Seeder will re-fire
    setTimeout(() => {
      seedDatabaseIfEmpty();
    }, 1000);
  };

  // Helper for deterministic user ID
  const getUserUid = (email: string, role: string) => {
    const cleanEmail = email.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
    if (cleanEmail.includes('satish') || cleanEmail.includes('sateesh')) return 'admin-satish';
    if (cleanEmail.includes('vansh')) return 'editor-vansh-auth';
    if (cleanEmail.includes('weddingbykk') || cleanEmail.includes('kk')) return 'studio-kk-auth';
    return `${role}-${cleanEmail}`;
  };

  // --- Login handler ---
  const handleLogin = async (email: string, role: UserRole, id?: string) => {
    const userUid = getUserUid(email, role);

    let defaultName = 'Satish Tiwari';
    if (email === 'vansh@framecut.com' || email === 'vansh2000') {
      defaultName = 'Vansh Tiwari';
    } else if (email === 'kk@weddingbykk.com') {
      defaultName = 'Wedding By KK';
    }

    let loadedPhotoURL: string | undefined = undefined;
    let loadedName: string = defaultName;

    // 1. First check localStorage for cached profile
    try {
      const cached = localStorage.getItem(`tfc_user_profile_${userUid}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.photoURL) loadedPhotoURL = parsed.photoURL;
        if (parsed.name) loadedName = parsed.name;
      }
    } catch (e) {
      console.error("Error reading cached profile from localStorage:", e);
    }

    // 2. Try fetching from Firestore doc `users/{userUid}`
    try {
      const userDocRef = doc(db, 'users', userUid);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        if (data.photoURL) loadedPhotoURL = data.photoURL;
        if (data.name) loadedName = data.name;
      } else {
        // Initialize doc in Firestore
        await setDoc(userDocRef, {
          uid: userUid,
          email,
          name: loadedName,
          role,
          photoURL: loadedPhotoURL || null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
    } catch (e) {
      console.error("Error fetching or initializing user document from Firestore:", e);
    }

    const profile: UserProfile = {
      uid: userUid,
      email,
      name: loadedName,
      photoURL: loadedPhotoURL,
      role,
      studioId: role === 'studio' ? id : undefined,
      editorId: role === 'editor' ? id : undefined,
      createdAt: new Date()
    };

    setCurrentUser(profile);
    localStorage.setItem(`tfc_user_profile_${userUid}`, JSON.stringify(profile));

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

  const handleUpdateProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser) return;

    let finalPhotoURL = updates.photoURL !== undefined ? updates.photoURL : currentUser.photoURL;
    if (finalPhotoURL && finalPhotoURL.startsWith('data:image/')) {
      finalPhotoURL = await compressImage(finalPhotoURL, 300, 300, 0.7);
    }

    const updatedProfile: UserProfile = {
      ...currentUser,
      ...updates,
      photoURL: finalPhotoURL
    };

    setCurrentUser(updatedProfile);
    localStorage.setItem(`tfc_user_profile_${currentUser.uid}`, JSON.stringify(updatedProfile));

    try {
      // Sync update to firestore users collection
      const docRef = doc(db, 'users', currentUser.uid);
      await setDoc(docRef, {
        name: updatedProfile.name,
        photoURL: updatedProfile.photoURL || null,
        email: updatedProfile.email,
        role: updatedProfile.role,
        uid: updatedProfile.uid,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // If user is an editor, sync photoURL to editor card in editors collection
      if (currentUser.editorId && finalPhotoURL) {
        const editorRef = doc(db, 'editors', currentUser.editorId);
        await updateDoc(editorRef, {
          photo: finalPhotoURL,
          name: updatedProfile.name
        });
      }

      // If user is a studio, sync photoURL to studio logoUrl in studios collection
      if (currentUser.studioId && finalPhotoURL) {
        const studioRef = doc(db, 'studios', currentUser.studioId);
        await updateDoc(studioRef, {
          logoUrl: finalPhotoURL,
          ownerName: updatedProfile.name
        });
      }
    } catch (e) {
      console.error("Error updating user profile in Firestore:", e);
    }
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
            payments={payments}
            onLogPayment={handleLogPayment}
            onUpdateProject={handleUpdateProject}
            onDeleteProject={handleDeleteProject}
            onDeletePayment={handleDeletePayment}
            onUpdatePayment={handleUpdatePayment}
          />
        );
      case 'gemini':
        return (
          <GeminiAIView
            projects={projects}
            studios={studios}
            editors={editors}
            expenses={expenses}
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
            onUpdateProject={handleUpdateProject}
            onDeleteProject={handleDeleteProject}
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
            calendarEvents={calendarEvents}
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
            onAddStudio={handleAddStudio}
            onUpdateStudio={handleUpdateStudio}
            onDeleteStudio={handleDeleteStudio}
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
      case 'financial_overview':
        return (
          <FinancialOverviewView
            projects={projects}
            expenses={expenses}
            editors={editors}
            studios={studios}
            payments={payments}
            onAddExpense={handleAddExpense}
            onUpdateExpense={handleUpdateExpense}
            onDeleteExpense={handleDeleteExpense}
            onUpdatePayment={handleUpdatePayment}
            onDeletePayment={handleDeletePayment}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        );
      case 'invoice':
        return (
          <InvoiceView
            projects={projects}
            studios={studios}
            payments={payments}
            invoices={invoices}
            currentUser={currentUser}
            onLogPayment={handleLogPayment}
            onSaveInvoiceDraft={handleSaveInvoiceDraft}
            onDeleteInvoiceDraft={handleDeleteInvoiceDraft}
          />
        );
      case 'datamanager':
        return (
          <DataManagerView
            projects={roleFilteredProjects}
            onUpdateProject={handleUpdateProject}
            onDeleteProject={handleDeleteProject}
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
            onAddEvent={handleAddCalendarEvent}
            onUpdateEvent={handleUpdateCalendarEvent}
            onDeleteEvent={handleDeleteCalendarEvent}
          />
        );
      case 'notifications':
        return (
          <NotificationsView
            notifications={roleFilteredNotifications}
            calendarEvents={calendarEvents}
            runnerIsRunning={runnerIsRunning}
            runnerLastCheckTime={runnerLastCheckTime}
            runnerCheckCount={runnerCheckCount}
            onRunnerManualCheck={handleRunnerManualCheck}
            onMarkRead={handleMarkRead}
            onClearNotification={handleClearNotification}
            onClearAllNotifications={handleClearAllNotifications}
          />
        );
      case 'settings':
        return (
          <SettingsView
            onResetDatabase={handleResetDatabase}
            isOnline={isOnline}
            currentUser={currentUser}
            onUpdateProfile={handleUpdateProfile}
            theme={theme}
            onThemeChange={setTheme}
            projects={projects}
            studios={studios}
            editors={editors}
            expenses={expenses}
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
    <div className="flex flex-col md:flex-row min-h-screen bg-charcoal-950 text-gray-200 relative overflow-x-hidden">
      {/* Multi-layered Parallax Ambient Background Canvas */}
      <ParallaxBackground />
      
      {/* Floating sidebar menu */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Sidebar layout spacer to reserve space on desktop and prevent reflows on hover */}
      <div className="hidden md:block w-24 shrink-0 mr-4" />

      {/* Main View Container with Parallax Perspective */}
      <main id="main-content-flow" className="flex-1 p-4 md:p-8 md:pl-6 overflow-x-hidden min-h-screen relative z-10">
        <div className="max-w-7xl mx-auto pb-28 md:pb-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 14, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(2px)' }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="w-full"
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Floating Automated Background Runner Toast Notification */}
      <AnimatePresence>
        {runnerToastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 max-w-md p-4 rounded-2xl bg-charcoal-900/95 border border-gold-500/50 text-white shadow-2xl backdrop-blur-md flex items-start justify-between space-x-3 gold-glow"
          >
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-xl bg-gold-500/20 text-gold-400 shrink-0 mt-0.5">
                <Zap className="w-5 h-5" />
              </div>
              <div className="text-xs font-mono">
                <div className="font-bold text-gold-400 uppercase tracking-wide">Automated Deadline Runner</div>
                <div className="text-gray-200 mt-1 leading-relaxed">{runnerToastMessage}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={dismissRunnerToast}
              className="p-1 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
