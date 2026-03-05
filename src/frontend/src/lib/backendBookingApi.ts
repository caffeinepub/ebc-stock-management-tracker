// ─── backendBookingApi.ts ────────────────────────────────────────────────────
// Helpers for submitting and managing booking/stock approval requests via the
// backend canister (cross-device real-time sync).

import type {
  BookingRequest,
  StockApprovalRequest,
  backendInterface,
} from "../backend.d";

// ─── Booking Requests ────────────────────────────────────────────────────────

export async function submitBookingRequestToBackend(
  actor: backendInterface,
  req: {
    id: string;
    bookingType: "conference" | "dining";
    room: string;
    date: string;
    startTime: string;
    endTime: string;
    eventName: string;
    organizerName: string;
    contact: string;
    notes: string;
    submittedBy: string;
    designation: string;
    bookingPurpose: string;
  },
): Promise<void> {
  await actor.submitBookingRequest(
    req.id,
    req.bookingType,
    req.room,
    req.date,
    req.startTime,
    req.endTime,
    req.eventName,
    req.organizerName,
    req.contact,
    req.notes,
    req.submittedBy,
    req.designation,
    req.bookingPurpose,
  );
}

export async function fetchAllBookingRequests(
  actor: backendInterface,
): Promise<BookingRequest[]> {
  const raw = await actor.getAllBookingRequests();
  // Sort: pending first, then by createdAt descending
  const sorted = [...raw].sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (a.status !== "pending" && b.status === "pending") return 1;
    // Both same status: sort by createdAt descending (bigint comparison)
    if (b.createdAt > a.createdAt) return 1;
    if (b.createdAt < a.createdAt) return -1;
    return 0;
  });
  return sorted;
}

export async function approveBookingRequestOnBackend(
  actor: backendInterface,
  id: string,
): Promise<void> {
  await actor.approveBookingRequest(id);
}

export async function rejectBookingRequestOnBackend(
  actor: backendInterface,
  id: string,
): Promise<void> {
  await actor.rejectBookingRequest(id);
}

// ─── Stock Approval Requests ─────────────────────────────────────────────────

export async function submitStockApprovalRequestToBackend(
  actor: backendInterface,
  req: {
    id: string;
    requestedByName: string;
    role: string;
    dataType: string;
    description: string;
  },
): Promise<void> {
  await actor.submitStockApprovalRequest(
    req.id,
    req.requestedByName,
    req.role,
    req.dataType,
    req.description,
  );
}

export async function fetchAllStockApprovalRequests(
  actor: backendInterface,
): Promise<StockApprovalRequest[]> {
  const raw = await actor.getAllStockApprovalRequests();
  const sorted = [...raw].sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (a.status !== "pending" && b.status === "pending") return 1;
    if (b.submittedAt > a.submittedAt) return 1;
    if (b.submittedAt < a.submittedAt) return -1;
    return 0;
  });
  return sorted;
}

export async function approveStockApprovalRequestOnBackend(
  actor: backendInterface,
  id: string,
): Promise<void> {
  await actor.approveStockApprovalRequest(id);
}

export async function rejectStockApprovalRequestOnBackend(
  actor: backendInterface,
  id: string,
): Promise<void> {
  await actor.rejectStockApprovalRequest(id);
}
