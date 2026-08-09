import { collection, getDocs, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { CalendarEvent, AppNotification } from '../types';

export interface DeadlineCheckResult {
  timestamp: string;
  checkedCount: number;
  upcomingCount: number;
  triggeredNotifications: {
    id: string;
    eventId: string;
    title: string;
    dueDate: string;
    hoursRemaining: number;
  }[];
}

/**
 * Safely parses a due date value into milliseconds.
 * Supports YYYY-MM-DD date strings, ISO date strings, JS Dates, and Firestore timestamps.
 */
export function parseDueDateToMs(dateVal: any): number {
  if (!dateVal) return 0;

  // If Firestore Timestamp object
  if (typeof dateVal?.toMillis === 'function') {
    return dateVal.toMillis();
  }
  if (dateVal.seconds !== undefined) {
    return dateVal.seconds * 1000 + (dateVal.nanoseconds || 0) / 1000000;
  }

  // JS Date
  if (dateVal instanceof Date) {
    return dateVal.getTime();
  }

  if (typeof dateVal === 'string') {
    const trimmed = dateVal.trim();
    // YYYY-MM-DD format: treat as end of day (23:59:59) in local time
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [year, month, day] = trimmed.split('-').map(Number);
      return new Date(year, month - 1, day, 23, 59, 59, 999).getTime();
    }
    const parsed = new Date(trimmed).getTime();
    return isNaN(parsed) ? 0 : parsed;
  }

  if (typeof dateVal === 'number') {
    return dateVal;
  }

  return 0;
}

/**
 * Checks if a given due timestamp is within 24 hours of reference time.
 */
export function isWithin24Hours(dueMs: number, refTimeMs: number = Date.now()): { isWithin: boolean; hoursRemaining: number } {
  if (!dueMs) return { isWithin: false, hoursRemaining: 0 };

  const diffMs = dueMs - refTimeMs;
  const hoursRemaining = diffMs / (1000 * 60 * 60);

  // Consider "within 24 hours" if due in the next 24 hours OR overdue within the last 12 hours
  const isWithin = hoursRemaining >= -12 && hoursRemaining <= 24;

  return { isWithin, hoursRemaining };
}

/**
 * Background Task Runner Execution:
 * Checks upcoming project deadlines in the 'calendar' collection
 * and triggers an automated notification if a task/event is within 24 hours of its due date.
 */
export async function runDeadlineRunnerCheck(
  currentCalendarEvents?: CalendarEvent[],
  existingNotifications?: AppNotification[]
): Promise<DeadlineCheckResult> {
  const result: DeadlineCheckResult = {
    timestamp: new Date().toLocaleTimeString(),
    checkedCount: 0,
    upcomingCount: 0,
    triggeredNotifications: []
  };

  try {
    // 1. Load events from 'calendar' collection in Firestore if not supplied
    let calendarEvents: CalendarEvent[] = [];
    if (currentCalendarEvents && currentCalendarEvents.length > 0) {
      calendarEvents = currentCalendarEvents;
    } else {
      const calSnap = await getDocs(collection(db, 'calendar'));
      calSnap.forEach(docSnap => {
        calendarEvents.push({ ...docSnap.data() as any, id: docSnap.id });
      });
    }

    // 2. Load notifications from 'notifications' collection if not supplied
    let notifList: AppNotification[] = [];
    if (existingNotifications) {
      notifList = existingNotifications;
    } else {
      const notifSnap = await getDocs(collection(db, 'notifications'));
      notifSnap.forEach(docSnap => {
        notifList.push({ ...docSnap.data() as any, id: docSnap.id });
      });
    }

    result.checkedCount = calendarEvents.length;
    const nowMs = Date.now();

    for (const evt of calendarEvents) {
      const dateStr = evt.start;
      if (!dateStr) continue;

      const dueMs = parseDueDateToMs(dateStr);
      if (!dueMs) continue;

      const { isWithin, hoursRemaining } = isWithin24Hours(dueMs, nowMs);

      if (isWithin) {
        result.upcomingCount++;

        // Deduplication ID per calendar event and due date
        const dateKey = typeof dateStr === 'string' ? dateStr.slice(0, 10) : new Date(dueMs).toISOString().slice(0, 10);
        const dedupeId = `notif-deadline-${evt.id}-${dateKey}`;

        // Check if an alert for this calendar event has already been created
        const alreadyNotified = notifList.some(
          n => n.id === dedupeId ||
               n.calendarEventId === evt.id ||
               (n.title.includes('Deadline') && n.message.includes(evt.title))
        );

        if (!alreadyNotified) {
          const formattedHours = hoursRemaining < 0
            ? `overdue by ${Math.abs(Math.round(hoursRemaining))}h`
            : `due in ~${Math.max(1, Math.round(hoursRemaining))}h`;

          const notificationTitle = `⏰ Deadline Alert: ${evt.title}`;
          const notificationMessage = `Upcoming deadline "${evt.title}" ${evt.coupleName ? `(${evt.coupleName})` : ''} is ${formattedHours} [Due: ${dateKey}]!`;

          const notifPayload: Omit<AppNotification, 'createdAt'> & { createdAt: any } = {
            id: dedupeId,
            title: notificationTitle,
            message: notificationMessage,
            type: 'delivery_tomorrow',
            projectId: evt.projectId || '',
            calendarEventId: evt.id,
            isAutomated: true,
            read: false,
            createdAt: serverTimestamp()
          };

          try {
            const notifRef = doc(db, 'notifications', dedupeId);
            await setDoc(notifRef, notifPayload, { merge: true });

            result.triggeredNotifications.push({
              id: dedupeId,
              eventId: evt.id,
              title: evt.title,
              dueDate: dateKey,
              hoursRemaining: Math.round(hoursRemaining)
            });

            console.log(`[Deadline Runner] Triggered automated notification for task/event '${evt.title}' (${dedupeId})`);
          } catch (writeErr) {
            console.error(`[Deadline Runner] Failed to write notification for ${evt.id}:`, writeErr);
          }
        }
      }
    }
  } catch (error) {
    console.error("[Deadline Runner] Error during execution:", error);
  }

  return result;
}
