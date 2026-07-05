import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  collection,
  doc,
  getDocs,
  setDoc,
  writeBatch,
  query,
  where,
  limit,
  serverTimestamp
} from 'firebase/firestore';

// Read from config file
import firebaseConfig from '../firebase-applet-config.json';

// Initialize App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with robust local caching
let db: any;
const dbId = (firebaseConfig as any).firestoreDatabaseId;

try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  }, dbId);
  console.log("Firestore initialized with persistent offline cache and database ID:", dbId);
} catch (err) {
  console.warn("Failed to initialize offline persistence, falling back to default memory cache:", err);
  db = getFirestore(app, dbId);
}

// No need to call enableIndexedDbPersistence since we already initialized with persistentLocalCache above.
// This prevents SDK warnings/errors about cache configuration redundancy.

const auth = getAuth(app);

export { auth, db };

// Seeding function to create default collections & documents if they are empty
export async function seedDatabaseIfEmpty() {
  try {
    const studiosRef = collection(db, 'studios');
    const snap = await getDocs(query(studiosRef, limit(1)));
    
    if (!snap.empty) {
      console.log("Database already contains data. Skipping seeding.");
      return;
    }
    
    console.log("Database is empty. Seeding default studios, editors, and projects...");
    const batch = writeBatch(db);

    // 1. Seed Default Studios
    const defaultStudios = [
      { id: 'studio-kk', name: 'Wedding By KK', ownerName: 'KK Sharma', phone: '+91 98765 43210', email: 'kk@weddingbykk.com', address: 'Bandra West, Mumbai', gstNumber: '27AAAAA1111A1Z1', notes: 'Premium studio, prefers gold cinema color tone.', createdAt: new Date() },
      { id: 'studio-moment', name: 'Moment Innovator', ownerName: 'Amit Verma', phone: '+91 98111 22233', email: 'amit@momentinnovator.com', address: 'Saket, New Delhi', gstNumber: '07BBBBB2222B2Z2', notes: 'High volume pre-weddings and weddings.', createdAt: new Date() },
      { id: 'studio-kriti', name: 'Kriti Photo', ownerName: 'Kriti Sen', phone: '+91 95555 66677', email: 'kriti@kritiphoto.com', address: 'Salt Lake, Kolkata', gstNumber: '19CCCCC3333C3Z3', notes: 'Specializes in artistic traditional events.', createdAt: new Date() },
      { id: 'studio-licious', name: 'The Wedding Licious', ownerName: 'Rajesh Mehta', phone: '+91 99999 88888', email: 'rajesh@weddinglicious.com', address: 'Indiranagar, Bengaluru', gstNumber: '29DDDDD4444D4Z4', notes: 'Luxury high-budget cinematic weddings.', createdAt: new Date() }
    ];

    defaultStudios.forEach(studio => {
      const docRef = doc(db, 'studios', studio.id);
      batch.set(docRef, studio);
    });

    // 2. Seed Default Editors in Firestore
    const defaultEditors = [
      { id: 'editor-vansh', name: 'Vansh Tiwari', email: 'vansh@framecut.com', phone: '+91 98333 44455', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200', rating: 4.9, joinedDate: '2025-01-15', notes: 'Expert in narrative storytelling, multi-cam sync, and speed ramping.', totalEarnings: 154000, pendingPayments: 24000 },
      { id: 'editor-sid', name: 'Siddharth Roy', email: 'sid@framecut.com', phone: '+91 97777 66655', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200', rating: 4.7, joinedDate: '2025-03-10', notes: 'Strong color grading skills. Works mostly on premium teasers.', totalEarnings: 85000, pendingPayments: 15000 }
    ];

    defaultEditors.forEach(editor => {
      const docRef = doc(db, 'editors', editor.id);
      batch.set(docRef, editor);
    });

    // 3. Seed Default Users (Admin + Editor profiles)
    const defaultUsers = [
      { uid: 'admin-satish', email: 'satish@framecut.com', name: 'Satish Tiwari', role: 'admin', createdAt: new Date() },
      { uid: 'editor-vansh-auth', email: 'vansh@framecut.com', name: 'Vansh Tiwari', role: 'editor', editorId: 'editor-vansh', createdAt: new Date() },
      { uid: 'studio-kk-auth', email: 'kk@weddingbykk.com', name: 'Wedding By KK', role: 'studio', studioId: 'studio-kk', createdAt: new Date() }
    ];

    defaultUsers.forEach(user => {
      const docRef = doc(db, 'users', user.uid);
      batch.set(docRef, user);
    });

    // 4. Seed Default Projects
    const defaultProjects = [
      {
        id: 'PRJ-2026-001',
        coupleName: 'Aarav & Meera',
        brideName: 'Meera',
        groomName: 'Aarav',
        couplePhoto: 'https://images.unsplash.com/photo-1607190074257-dd4b7af0309f?auto=format&fit=crop&q=80&w=600',
        studioId: 'studio-kk',
        studioName: 'Wedding By KK',
        eventType: 'Wedding + Teaser',
        shootDate: '2026-05-12',
        deliveryDate: '2026-07-05',
        assignedEditorId: 'editor-vansh',
        assignedEditorName: 'Vansh Tiwari',
        status: 'review',
        priority: 'high',
        projectAmount: 85000,
        editorPayment: 25000,
        otherExpenses: 5000,
        advancePayment: 40000,
        remainingBalance: 45000,
        notes: 'Needs heavy cinematic warm tones. Deliver 4K Teaser and 30-min Highlights.',
        createdAt: new Date(),
        updatedAt: new Date(),
        // Data manager
        hardDiskName: 'WD Black Wedding-A',
        dataSize: '1.8 TB',
        backupStatus: 'backed_up',
        googleDriveLink: 'https://drive.google.com/drive/folders/aarav_meera',
        deliveryFolder: '/Deliveries/Aarav_Meera_Final',
        rawDataFolder: '/Raw/WD_A/Aarav_Meera',
        finalExportFolder: '/Exports/Aarav_Meera_v2'
      },
      {
        id: 'PRJ-2026-002',
        coupleName: 'Rohan & Dia',
        brideName: 'Dia',
        groomName: 'Rohan',
        couplePhoto: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=600',
        studioId: 'studio-moment',
        studioName: 'Moment Innovator',
        eventType: 'Complete Wedding Film',
        shootDate: '2026-06-02',
        deliveryDate: '2026-07-15',
        assignedEditorId: 'editor-vansh',
        assignedEditorName: 'Vansh Tiwari',
        status: 'editing',
        priority: 'medium',
        projectAmount: 120000,
        editorPayment: 35000,
        otherExpenses: 8000,
        advancePayment: 60000,
        remainingBalance: 60000,
        notes: 'Includes drone footage and heavy transitions. Bride requested classic romantic songs.',
        createdAt: new Date(),
        updatedAt: new Date(),
        hardDiskName: 'Seagate Red Studio-4',
        dataSize: '2.4 TB',
        backupStatus: 'pending',
        googleDriveLink: 'https://drive.google.com/drive/folders/rohan_dia',
        deliveryFolder: '/Deliveries/Rohan_Dia_Draft',
        rawDataFolder: '/Raw/Seagate_4/Rohan_Dia',
        finalExportFolder: '/Exports/Rohan_Dia_v1'
      },
      {
        id: 'PRJ-2026-003',
        coupleName: 'Vikram & Pooja',
        brideName: 'Pooja',
        groomName: 'Vikram',
        couplePhoto: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=600',
        studioId: 'studio-licious',
        studioName: 'The Wedding Licious',
        eventType: 'Luxury Pre-Wedding Film',
        shootDate: '2026-06-20',
        deliveryDate: '2026-07-28',
        assignedEditorId: 'editor-sid',
        assignedEditorName: 'Siddharth Roy',
        status: 'data_received',
        priority: 'urgent',
        projectAmount: 95000,
        editorPayment: 30000,
        otherExpenses: 3000,
        advancePayment: 30000,
        remainingBalance: 65000,
        notes: 'Very high priority. Shot at locations in Udaipur. Color grading must be outstanding.',
        createdAt: new Date(),
        updatedAt: new Date(),
        hardDiskName: 'SanDisk Extreme Pro 01',
        dataSize: '950 GB',
        backupStatus: 'pending',
        googleDriveLink: 'https://drive.google.com/drive/folders/vikram_pooja',
        deliveryFolder: '/Deliveries/Vikram_Pooja',
        rawDataFolder: '/Raw/SanDisk_01/Vikram_Pooja',
        finalExportFolder: '/Exports/Vikram_Pooja'
      },
      {
        id: 'PRJ-2026-004',
        coupleName: 'Kabir & Rhea',
        couplePhoto: 'https://images.unsplash.com/photo-1621616875550-de064421f5f3?auto=format&fit=crop&q=80&w=600',
        brideName: 'Rhea',
        groomName: 'Kabir',
        studioId: 'studio-kriti',
        studioName: 'Kriti Photo',
        eventType: 'Traditional Highlight + Teaser',
        shootDate: '2026-04-18',
        deliveryDate: '2026-05-25',
        assignedEditorId: 'editor-sid',
        assignedEditorName: 'Siddharth Roy',
        status: 'delivered',
        priority: 'low',
        projectAmount: 70000,
        editorPayment: 20000,
        otherExpenses: 2000,
        advancePayment: 70000,
        remainingBalance: 0,
        notes: 'Fully approved. Clean simple narrative cuts.',
        createdAt: new Date(),
        updatedAt: new Date(),
        hardDiskName: 'WD Elements 12TB',
        dataSize: '1.1 TB',
        backupStatus: 'backed_up',
        googleDriveLink: 'https://drive.google.com/drive/folders/kabir_rhea',
        deliveryFolder: '/Deliveries/Kabir_Rhea_Approved',
        rawDataFolder: '/Raw/WD_12TB/Kabir_Rhea',
        finalExportFolder: '/Exports/Kabir_Rhea_Final'
      }
    ];

    defaultProjects.forEach(proj => {
      const docRef = doc(db, 'projects', proj.id);
      batch.set(docRef, proj);
    });

    // 5. Seed Default Expenses
    const defaultExpenses = [
      { id: 'exp-001', amount: 15000, category: 'hard_disk', date: '2026-06-05', description: 'Bought 2x 2TB WD Elements Portable HDDs', createdAt: new Date() },
      { id: 'exp-002', amount: 4500, category: 'internet', date: '2026-06-01', description: 'High-speed fiber internet subscription (1 Gbps)', createdAt: new Date() },
      { id: 'exp-003', amount: 35000, category: 'office_rent', date: '2026-06-01', description: 'June Rent for editing suite', createdAt: new Date() },
      { id: 'exp-004', amount: 8400, category: 'electricity', date: '2026-06-15', description: 'Electricity bill for editing machines & AC', createdAt: new Date() }
    ];

    defaultExpenses.forEach(exp => {
      const docRef = doc(db, 'expenses', exp.id);
      batch.set(docRef, exp);
    });

    // 6. Seed Invoices
    const defaultInvoices = [
      { id: 'INV-2026-001', projectId: 'PRJ-2026-001', coupleName: 'Aarav & Meera', studioId: 'studio-kk', studioName: 'Wedding By KK', invoiceDate: '2026-06-25', dueDate: '2026-07-05', subtotal: 85000, gstAmount: 15300, discount: 0, totalAmount: 100300, amountPaid: 40000, balanceDue: 60300, gstNumber: '27AAAAA1111A1Z1', status: 'sent', createdAt: new Date() },
      { id: 'INV-2026-004', projectId: 'PRJ-2026-004', coupleName: 'Kabir & Rhea', studioId: 'studio-kriti', studioName: 'Kriti Photo', invoiceDate: '2026-05-20', dueDate: '2026-05-30', subtotal: 70000, gstAmount: 0, discount: 5000, totalAmount: 65000, amountPaid: 65000, balanceDue: 0, gstNumber: '19CCCCC3333C3Z3', status: 'paid', createdAt: new Date() }
    ];

    defaultInvoices.forEach(inv => {
      const docRef = doc(db, 'invoices', inv.id);
      batch.set(docRef, inv);
    });

    // 7. Seed Calendar Events
    const defaultEvents = [
      { id: 'evt-1', title: 'Deliver Aarav & Meera Teaser', start: '2026-07-05', type: 'delivery', projectId: 'PRJ-2026-001', coupleName: 'Aarav & Meera', color: '#EAB308' },
      { id: 'evt-2', title: 'Deliver Rohan & Dia Highlights', start: '2026-07-15', type: 'delivery', projectId: 'PRJ-2026-002', coupleName: 'Rohan & Dia', color: '#10B981' },
      { id: 'evt-3', title: 'Udaipur Shoot Date Reference', start: '2026-06-20', type: 'shoot', projectId: 'PRJ-2026-003', coupleName: 'Vikram & Pooja', color: '#3B82F6' },
      { id: 'evt-4', title: 'Revision Deadline Vikram & Pooja', start: '2026-07-02', type: 'revision', projectId: 'PRJ-2026-003', coupleName: 'Vikram & Pooja', color: '#EF4444' }
    ];

    defaultEvents.forEach(evt => {
      const docRef = doc(db, 'calendar', evt.id);
      batch.set(docRef, evt);
    });

    // 8. Seed Default Revisions
    const defaultRevisions = [
      { id: 'rev-001', projectId: 'PRJ-2026-001', revisionNumber: 1, notes: 'Studio asked to replace transition at 2:15 and add more groom close-up shots during vows.', date: '2026-06-28', status: 'resolved', createdAt: new Date() },
      { id: 'rev-002', projectId: 'PRJ-2026-001', revisionNumber: 2, notes: 'Client requested to change song during sangeet sequence.', date: '2026-06-30', status: 'pending', createdAt: new Date() }
    ];

    defaultRevisions.forEach(rev => {
      const docRef = doc(db, 'revisionHistory', rev.id);
      batch.set(docRef, rev);
    });

    // 9. Seed Default Tasks
    const defaultTasks = [
      { id: 'tsk-001', projectId: 'PRJ-2026-001', projectCoupleName: 'Aarav & Meera', title: 'Draft multi-cam wedding sync', description: 'Align main 3 cameras and separate field recorder audio', assignedTo: 'editor-vansh', dueDate: '2026-06-15', status: 'completed', createdAt: new Date() },
      { id: 'tsk-002', projectId: 'PRJ-2026-001', projectCoupleName: 'Aarav & Meera', title: 'Color grading pass', description: 'Apply warm lut and balance shadows in vows scene', assignedTo: 'editor-vansh', dueDate: '2026-06-28', status: 'in_progress', createdAt: new Date() },
      { id: 'tsk-003', projectId: 'PRJ-2026-002', projectCoupleName: 'Rohan & Dia', title: 'Teaser first cut', description: 'Create dynamic 60s Instagram-ready teaser with high beats', assignedTo: 'editor-vansh', dueDate: '2026-07-02', status: 'pending', createdAt: new Date() }
    ];

    defaultTasks.forEach(tsk => {
      const docRef = doc(db, 'tasks', tsk.id);
      batch.set(docRef, tsk);
    });

    // 10. Seed Notifications
    const defaultNotifications = [
      { id: 'notif-1', title: 'Revision Request', message: 'Wedding By KK submitted a revision for Aarav & Meera.', type: 'revision_request', projectId: 'PRJ-2026-001', read: false, createdAt: new Date(Date.now() - 3600000) },
      { id: 'notif-2', title: 'Delivery Pending Tomorrow', message: 'Aarav & Meera is due for delivery tomorrow!', type: 'delivery_tomorrow', projectId: 'PRJ-2026-001', read: false, createdAt: new Date(Date.now() - 7200000) },
      { id: 'notif-3', title: 'Invoice Unpaid', message: 'Invoice INV-2026-001 for Aarav & Meera has been outstanding for 5 days.', type: 'payment_pending', projectId: 'PRJ-2026-001', read: true, createdAt: new Date(Date.now() - 86400000) }
    ];

    defaultNotifications.forEach(notif => {
      const docRef = doc(db, 'notifications', notif.id);
      batch.set(docRef, notif);
    });

    await batch.commit();
    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
