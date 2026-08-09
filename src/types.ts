export type UserRole = 'admin' | 'editor' | 'studio';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  studioId?: string; // If role is 'studio'
  editorId?: string; // If role is 'editor'
  photoURL?: string;
  createdAt: any;
}

export interface Studio {
  id: string; // Document ID
  name: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  gstNumber?: string;
  notes?: string;
  logoUrl?: string;
  upiId?: string;
  paymentLink?: string;
  createdAt: any;
}

export type ProjectStatus = 'data_received' | 'assigned' | 'editing' | 'review' | 'revision' | 'rendering' | 'delivered' | 'closed';

export type ProjectPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Project {
  id: string; // e.g. "PRJ-2026-001" or doc id
  projectName?: string;
  coupleName: string;
  brideName: string;
  groomName: string;
  couplePhoto?: string;
  studioId: string;
  studioName: string;
  eventType: string; // Wedding, Pre-Wedding, Engagement, etc.
  shootDate: string; // YYYY-MM-DD
  deliveryDate: string; // YYYY-MM-DD
  assignedEditorId?: string;
  assignedEditorName?: string;
  isSplitProject?: boolean;
  secondEditorId?: string;
  secondEditorName?: string;
  firstEditorShare?: number;
  secondEditorShare?: number;
  status: ProjectStatus;
  priority: ProjectPriority;
  projectAmount: number;
  editorPayment: number;
  otherExpenses: number;
  advancePayment: number;
  remainingBalance: number;
  notes?: string;
  createdAt: any;
  updatedAt: any;
  
  // Data manager fields
  hardDiskName?: string;
  dataSize?: string; // e.g., "1.2 TB"
  backupStatus?: 'pending' | 'backed_up';
  googleDriveLink?: string;
  deliveryFolder?: string;
  rawDataFolder?: string;
  finalExportFolder?: string;
  location?: string; // Physical or cloud storage location of hard disk or data
  customMilestones?: {
    id: string;
    label: string;
    completed: boolean;
    completedAt?: string;
  }[];
}

export interface Task {
  id: string;
  projectId: string;
  projectCoupleName: string;
  title: string;
  description?: string;
  assignedTo: string; // editor user id
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: any;
}

export interface Revision {
  id: string;
  projectId: string;
  revisionNumber: number;
  notes: string;
  date: string;
  status: 'pending' | 'resolved';
  createdAt: any;
}

export interface Expense {
  id: string;
  amount: number;
  category: 'hard_disk' | 'internet' | 'office_rent' | 'electricity' | 'travel' | 'freelance_editor' | 'other' | string;
  date: string;
  description: string;
  projectId?: string; // Optional links to projects
  paymentMethod?: string;
  createdAt: any;
}

export interface PaymentHistory {
  id: string;
  entityId: string; // Editor ID or Studio ID
  entityType: 'editor' | 'studio';
  projectId: string;
  projectCoupleName: string;
  amount: number;
  date: string;
  paymentMethod: string; // Cash, Bank Transfer, GPay, etc.
  notes?: string;
  receivedFrom?: string; // Person who initiated or made the payment
  createdAt: any;
}

export interface Editor {
  id: string;
  name: string;
  email: string;
  phone: string;
  photo?: string;
  rating: number; // e.g. 4.8
  joinedDate: string;
  notes?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'delivery_tomorrow' | 'payment_pending' | 'project_completed' | 'new_assignment' | 'revision_request';
  projectId?: string;
  studioId?: string;
  calendarEventId?: string;
  isAutomated?: boolean;
  read: boolean;
  createdAt: any;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // date
  type: 'delivery' | 'shoot' | 'meeting' | 'revision';
  projectId?: string;
  coupleName?: string;
  color: string;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description?: string;
  eventType: string;
  deliverables: string[];
  milestones: string[];
  priority: ProjectPriority;
  defaultProjectAmount?: number;
  defaultEditorPayment?: number;
  notes?: string;
  isDefault?: boolean;
  createdAt?: any;
}

export interface StudioInvoiceProjectItem {
  projectId: string;
  coupleName: string;
  projectType: string;
  amount: number;
  status: string;
  invoiceStatus: string;
  selected: boolean;
}

export interface StudioAdvancePaymentItem {
  id: string;
  date: string;
  paidBy: string;
  paymentMode: string;
  amount: number;
  adjusted: boolean;
}

export interface StudioInvoice {
  id: string; // e.g. "AI-2026-0015"
  studioId: string;
  studioName: string;
  date: string;
  projects: StudioInvoiceProjectItem[];
  advances: StudioAdvancePaymentItem[];
  projectTotal: number;
  advanceTotal: number;
  previousBalance: number;
  discount: number;
  totalPayable: number;
  paymentStatus: 'Full Payment' | 'Partial Payment' | 'Unpaid';
  accountHolder: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  upiId: string;
  driveLink?: string;
  notes?: string;
  createdAt?: any;
}
