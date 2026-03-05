// ─── notificationApi.ts ──────────────────────────────────────────────────────
// Helper functions that wrap the backend notification canister calls.

import type { Notification, backendInterface } from "../backend.d";

export async function storeNotification(
  actor: backendInterface,
  recipientKey: string,
  notificationType: string,
  title: string,
  message: string,
  credentialsUserId = "",
  credentialsPassword = "",
): Promise<string> {
  return actor.storeNotification(
    recipientKey,
    notificationType,
    title,
    message,
    credentialsUserId,
    credentialsPassword,
  );
}

export async function getUnreadNotifications(
  actor: backendInterface,
  recipientKey: string,
): Promise<Notification[]> {
  const all = await actor.getNotificationsForRecipient(recipientKey);
  return all.filter((n) => !n.isRead);
}

export async function markNotificationRead(
  actor: backendInterface,
  id: string,
): Promise<void> {
  await actor.markNotificationRead(id);
}

export async function markAllNotificationsRead(
  actor: backendInterface,
  recipientKey: string,
): Promise<void> {
  await actor.markAllNotificationsReadForRecipient(recipientKey);
}
