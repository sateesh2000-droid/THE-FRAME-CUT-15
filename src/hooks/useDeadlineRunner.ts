import { useState, useEffect, useCallback, useRef } from 'react';
import { CalendarEvent, AppNotification } from '../types';
import { runDeadlineRunnerCheck, DeadlineCheckResult } from '../services/deadlineRunner';
import { playDeadlineAlertChime } from '../utils/chimeSound';

export function useDeadlineRunner(
  calendarEvents: CalendarEvent[],
  notifications: AppNotification[],
  enabled: boolean = true,
  intervalSeconds: number = 30
) {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<DeadlineCheckResult | null>(null);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);
  const [checkCount, setCheckCount] = useState<number>(0);
  const [recentToastMessage, setRecentToastMessage] = useState<string | null>(null);

  // Keep ref to avoid stale closure in interval
  const calendarEventsRef = useRef(calendarEvents);
  const notificationsRef = useRef(notifications);

  useEffect(() => {
    calendarEventsRef.current = calendarEvents;
  }, [calendarEvents]);

  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  const executeCheck = useCallback(async () => {
    setIsRunning(true);
    try {
      const res = await runDeadlineRunnerCheck(
        calendarEventsRef.current,
        notificationsRef.current
      );
      setLastResult(res);
      setLastCheckTime(new Date());
      setCheckCount(c => c + 1);

      if (res.triggeredNotifications.length > 0) {
        const count = res.triggeredNotifications.length;
        const titles = res.triggeredNotifications.map(t => t.title).join(', ');
        setRecentToastMessage(`⏰ Automated Alert Runner: Triggered ${count} notification(s) for task(s) within 24h of due date! (${titles})`);

        // Play subtle audio chime for deadline alerts within 24h window
        playDeadlineAlertChime(0.3);

        // Auto dismiss toast after 7 seconds
        setTimeout(() => {
          setRecentToastMessage(null);
        }, 7000);
      }
    } catch (err) {
      console.error("[useDeadlineRunner] Error running check:", err);
    } finally {
      setIsRunning(false);
    }
  }, []);

  // Periodic timer effect
  useEffect(() => {
    if (!enabled) return;

    // Run check immediately on mount or when enabled
    executeCheck();

    // Set recurring timer
    const timerId = setInterval(() => {
      executeCheck();
    }, Math.max(10, intervalSeconds) * 1000);

    return () => clearInterval(timerId);
  }, [enabled, intervalSeconds, executeCheck]);

  return {
    isRunning,
    lastResult,
    lastCheckTime,
    checkCount,
    recentToastMessage,
    dismissToast: () => setRecentToastMessage(null),
    triggerManualCheck: executeCheck
  };
}
