// ─── useNotificationPoller.ts ────────────────────────────────────────────────
// Custom hook that polls backend notifications for a given recipientKey
// and surfaces them one at a time.

import { useCallback, useEffect, useRef, useState } from "react";
import type { Notification } from "../backend.d";
import {
  getUnreadNotifications,
  markNotificationRead,
} from "../lib/notificationApi";
import { useActor } from "./useActor";

const POLL_INTERVAL_MS = 5_000;

export function useNotificationPoller(recipientKey: string) {
  const { actor } = useActor();
  const actorRef = useRef(actor);
  actorRef.current = actor;

  const [queue, setQueue] = useState<Notification[]>([]);
  const [currentNotification, setCurrentNotification] =
    useState<Notification | null>(null);

  // Advance queue: show the next notification when current is dismissed
  useEffect(() => {
    if (currentNotification === null && queue.length > 0) {
      const [next, ...rest] = queue;
      setCurrentNotification(next);
      setQueue(rest);
    }
  }, [currentNotification, queue]);

  // Polling effect
  useEffect(() => {
    if (!recipientKey) return;

    let cancelled = false;

    const poll = async () => {
      const currentActor = actorRef.current;
      if (!currentActor || !recipientKey) return;
      try {
        const notifications = await getUnreadNotifications(
          currentActor,
          recipientKey,
        );
        if (cancelled) return;
        if (notifications.length > 0) {
          // Merge new notifications into the queue (avoid duplicates via functional update)
          setQueue((prev) => {
            const existingIds = new Set(prev.map((n) => n.id));
            const genuinelyNew = notifications.filter(
              (n) => !existingIds.has(n.id),
            );
            if (genuinelyNew.length === 0) return prev;
            return [...prev, ...genuinelyNew];
          });
        }
      } catch {
        // silently ignore errors
      }
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [recipientKey]);

  const dismissNotification = useCallback(async () => {
    const current = currentNotification;
    if (!current) return;
    setCurrentNotification(null);
    const currentActor = actorRef.current;
    if (currentActor) {
      try {
        await markNotificationRead(currentActor, current.id);
      } catch {
        // silently ignore
      }
    }
  }, [currentNotification]);

  return { currentNotification, dismissNotification };
}
