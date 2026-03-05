// ─── bookingStore.ts ─────────────────────────────────────────────────────────
// Confirmed booking storage + analytics helpers for the room booking system.

export interface ConfirmedBooking {
  id: string;
  room_name: string;
  booking_date: string;
  booking_time: string; // startTime HH:MM
  booked_by: string; // organizerName
  approved_by: string;
  status: "confirmed";
  created_at: string;
}

export interface BookingAnalytics {
  totalConference: number;
  totalDining: number;
  mostBookedRoom: string;
  peakHour: string; // e.g. "14:00"
  roomUsageCounts: Record<string, number>;
}

const LS_CONFIRMED = "room_bookings_confirmed";
const LS_CONF = "fbm_conference_bookings";
const LS_DINING = "fbm_dining_bookings";

export function getConfirmedBookings(): ConfirmedBooking[] {
  try {
    const raw = localStorage.getItem(LS_CONFIRMED);
    return raw ? (JSON.parse(raw) as ConfirmedBooking[]) : [];
  } catch {
    return [];
  }
}

export function addConfirmedBooking(b: ConfirmedBooking): void {
  try {
    const existing = getConfirmedBookings();
    // Avoid duplicate entries
    if (!existing.find((e) => e.id === b.id)) {
      existing.push(b);
      localStorage.setItem(LS_CONFIRMED, JSON.stringify(existing));
    }
  } catch {
    // ignore storage errors
  }
}

export function isSlotBlocked(
  room: string,
  date: string,
  startTime: string,
): boolean {
  const confirmed = getConfirmedBookings();
  return confirmed.some(
    (b) =>
      b.room_name === room &&
      b.booking_date === date &&
      b.booking_time === startTime,
  );
}

// ─── Analytics ───────────────────────────────────────────────────────────────

interface GenericBooking {
  id: string;
  type?: string;
  room: string;
  startTime: string;
}

function loadRaw<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

export function computeBookingAnalytics(): BookingAnalytics {
  const confBookings = loadRaw<GenericBooking>(LS_CONF);
  const diningBookings = loadRaw<GenericBooking>(LS_DINING);

  const totalConference = confBookings.length;
  const totalDining = diningBookings.length;

  const allBookings = [...confBookings, ...diningBookings];

  // Room usage counts
  const roomUsageCounts: Record<string, number> = {};
  for (const b of allBookings) {
    roomUsageCounts[b.room] = (roomUsageCounts[b.room] ?? 0) + 1;
  }

  // Most booked room
  let mostBookedRoom = "N/A";
  let maxCount = 0;
  for (const [room, count] of Object.entries(roomUsageCounts)) {
    if (count > maxCount) {
      maxCount = count;
      mostBookedRoom = room;
    }
  }

  // Peak hour (most frequent startTime hour)
  const hourCounts: Record<string, number> = {};
  for (const b of allBookings) {
    if (b.startTime) {
      const hour = `${b.startTime.slice(0, 2)}:00`;
      hourCounts[hour] = (hourCounts[hour] ?? 0) + 1;
    }
  }
  let peakHour = "N/A";
  let maxHour = 0;
  for (const [hour, count] of Object.entries(hourCounts)) {
    if (count > maxHour) {
      maxHour = count;
      peakHour = hour;
    }
  }

  return {
    totalConference,
    totalDining,
    mostBookedRoom,
    peakHour,
    roomUsageCounts,
  };
}

// ─── Booking Analytics collection tracking ────────────────────────────────────
// Saves a snapshot of analytics to the booking_analytics localStorage key.
export function persistBookingAnalytics(): void {
  try {
    const analytics = computeBookingAnalytics();
    localStorage.setItem("booking_analytics", JSON.stringify(analytics));
  } catch {
    // ignore
  }
}
