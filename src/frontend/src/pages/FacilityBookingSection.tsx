import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  Eye,
  History,
  Trash2,
  Users,
  UtensilsCrossed,
  XCircle,
} from "lucide-react";
import { useCallback, useState } from "react";
import { CorporateNotificationPopup } from "../components/shared/CorporateNotificationPopup";
import { useActor } from "../hooks/useActor";
import { useNotificationPoller } from "../hooks/useNotificationPoller";
import { submitBookingRequestToBackend } from "../lib/backendBookingApi";
import {
  addConfirmedBooking,
  isSlotBlocked,
  persistBookingAnalytics,
} from "../lib/bookingStore";

// ─── Types ─────────────────────────────────────────────────────────────────────
type DemoRole = "Super Admin" | "Admin" | "Manager" | "Supervisor" | "Staff";
type BookingStatus = "Pending" | "Approved" | "Completed" | "Cancelled";
type ActivePanel = "conference" | "dining";
type BookingSubTab = "today" | "upcoming" | "history";

interface Booking {
  id: string;
  type: "conference" | "dining";
  room: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  eventName: string;
  organizerName: string;
  contact: string;
  notes: string;
  status: BookingStatus;
  createdAt: string;
  // dining only
  eventType?: string;
  numGuests?: number;
  // NEW: designation and booking purpose
  designation?: string;
  bookingPurpose?: string;
}

interface AuditEntry {
  action: string;
  userRole: DemoRole;
  bookingId: string;
  timestamp: string;
  details: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────────
const CONFERENCE_ROOMS = [
  "MYRIAD",
  "GOTHAM",
  "BROADWAY",
  "CALIBERI",
  "FUTURA",
  "HELVETICA",
  "GARAMMOND",
  "GEORGIA",
  "ARIEL",
  "AVINER",
  "CABIN 01",
  "CABIN 02",
  "CABIN 03",
  "CABIN 04",
  "CABIN 05",
  "CABIN 06",
];

const DINING_ROOMS = [
  "VASANT",
  "GRISHMA",
  "VARSHA",
  "HEMANT",
  "SHARAD",
  "SHISHIR",
];

const DINING_EVENT_TYPES = [
  "Corporate Lunch",
  "Business Dinner",
  "Team Celebration",
  "Client Meeting",
  "Conference",
  "Other",
];

const DEMO_ROLES: DemoRole[] = [
  "Super Admin",
  "Admin",
  "Manager",
  "Supervisor",
  "Staff",
];

const DESIGNATIONS = [
  "CEO",
  "COO",
  "CTO",
  "CIO",
  "General Manager",
  "Project Manager",
  "Team Lead",
  "Senior Developer",
  "Junior Developer",
  "Business Analyst",
  "QA Lead",
  "QA Tester",
  "HR Manager",
  "Operations Manager",
  "IT Director",
  "Solution Architect",
  "DevOps Engineer",
  "Systems Analyst",
  "Network Engineer",
  "Database Administrator",
];

const BOOKING_PURPOSES = [
  "Manager Meeting",
  "Project Launch",
  "Team Discussion",
  "Corporate Business",
  "IT Sector Professional Meeting",
  "Client Presentation",
  "Product Review",
  "Sprint Planning",
  "Board Meeting",
  "Training Session",
];

const LS_CONF = "fbm_conference_bookings";
const LS_DINING = "fbm_dining_bookings";
const LS_AUDIT = "fbm_audit_log";

// ─── LocalStorage helpers ───────────────────────────────────────────────────────
function loadBookings(key: string): Booking[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Booking[]) : [];
  } catch {
    return [];
  }
}

function saveBookings(key: string, bookings: Booking[]): void {
  localStorage.setItem(key, JSON.stringify(bookings));
}

function appendAudit(
  entry: Omit<AuditEntry, "timestamp">,
  role: DemoRole,
): void {
  try {
    const log = loadAudit();
    log.push({ ...entry, userRole: role, timestamp: new Date().toISOString() });
    localStorage.setItem(LS_AUDIT, JSON.stringify(log));
  } catch {
    /* ignore */
  }
}

function loadAudit(): AuditEntry[] {
  try {
    const raw = localStorage.getItem(LS_AUDIT);
    return raw ? (JSON.parse(raw) as AuditEntry[]) : [];
  } catch {
    return [];
  }
}

function generateId(prefix: string): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${year}-${rand}`;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function timesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

// ─── Style helpers ──────────────────────────────────────────────────────────────
const glass: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "16px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.18)",
  borderRadius: "8px",
  color: "#e2e8f0",
  padding: "9px 12px",
  fontSize: "13px",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  color: "#94a3b8",
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.7px",
  textTransform: "uppercase",
  marginBottom: "5px",
};

function statusBadge(status: BookingStatus): React.CSSProperties {
  const base: React.CSSProperties = {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.3px",
  };
  switch (status) {
    case "Pending":
      return {
        ...base,
        background: "rgba(217,119,6,0.2)",
        color: "#fcd34d",
        border: "1px solid rgba(217,119,6,0.4)",
      };
    case "Approved":
      return {
        ...base,
        background: "rgba(5,150,105,0.2)",
        color: "#6ee7b7",
        border: "1px solid rgba(5,150,105,0.4)",
      };
    case "Completed":
      return {
        ...base,
        background: "rgba(59,130,246,0.2)",
        color: "#93c5fd",
        border: "1px solid rgba(59,130,246,0.4)",
      };
    case "Cancelled":
      return {
        ...base,
        background: "rgba(220,38,38,0.2)",
        color: "#fca5a5",
        border: "1px solid rgba(220,38,38,0.4)",
      };
  }
}

// ─── Role permission helpers ────────────────────────────────────────────────────
// All approved users (Super Admin, Admin, Manager, Supervisor, Staff) can create bookings
function canCreate(_role: DemoRole): boolean {
  return true;
}
function canApproveReject(role: DemoRole): boolean {
  return role === "Super Admin" || role === "Admin";
}
function canEdit(role: DemoRole): boolean {
  return role === "Super Admin" || role === "Admin";
}
function canDelete(role: DemoRole): boolean {
  return role === "Super Admin";
}
// All approved users can view all booking data (dates, times, status, upcoming, past)
function canViewAll(_role: DemoRole): boolean {
  return true;
}

// ─── Calendar helper ─────────────────────────────────────────────────────────────
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// ─── Mini Calendar Component ─────────────────────────────────────────────────────
interface MiniCalendarProps {
  bookings: Booking[];
  selectedRoom: string;
  prevBtnId: string;
  nextBtnId: string;
  type: "conference" | "dining";
}

function MiniCalendar({
  bookings,
  selectedRoom,
  prevBtnId,
  nextBtnId,
}: MiniCalendarProps) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const monthBookings = bookings.filter((b) => {
    const [y, m] = b.date.split("-").map(Number);
    const matchesRoom = !selectedRoom || b.room === selectedRoom;
    return y === year && m - 1 === month && matchesRoom;
  });

  const bookedDates = new Set(monthBookings.map((b) => b.date));

  const selectedDayBookings = selectedDate
    ? bookings.filter(
        (b) =>
          b.date === selectedDate && (!selectedRoom || b.room === selectedRoom),
      )
    : [];

  const goToPrevMonth = () => {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else setMonth((m) => m - 1);
    setSelectedDate(null);
  };
  const goToNextMonth = () => {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else setMonth((m) => m + 1);
    setSelectedDate(null);
  };

  const cells: { key: string; day: number | null }[] = [];
  for (let i = 0; i < firstDay; i++)
    cells.push({ key: `${year}-${month}-pad-${i}`, day: null });
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ key: `${year}-${month}-${d}`, day: d });

  return (
    <div>
      {/* Calendar header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "16px",
        }}
      >
        <button
          type="button"
          data-ocid={prevBtnId}
          onClick={goToPrevMonth}
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "8px",
            color: "#e2e8f0",
            cursor: "pointer",
            padding: "6px 10px",
            display: "flex",
            alignItems: "center",
          }}
          aria-label="Previous month"
        >
          <ChevronLeft style={{ width: "14px", height: "14px" }} />
        </button>
        <span style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "14px" }}>
          {MONTH_NAMES[month]} {year}
        </span>
        <button
          type="button"
          data-ocid={nextBtnId}
          onClick={goToNextMonth}
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "8px",
            color: "#e2e8f0",
            cursor: "pointer",
            padding: "6px 10px",
            display: "flex",
            alignItems: "center",
          }}
          aria-label="Next month"
        >
          <ChevronRight style={{ width: "14px", height: "14px" }} />
        </button>
      </div>

      {/* Day names */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "2px",
          marginBottom: "6px",
        }}
      >
        {DAY_NAMES.map((d) => (
          <div
            key={d}
            style={{
              textAlign: "center",
              color: "#64748b",
              fontSize: "11px",
              fontWeight: 700,
              padding: "4px 0",
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Date cells */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "2px",
        }}
      >
        {cells.map(({ key, day }) => {
          if (day === null) return <div key={key} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const hasBookings = bookedDates.has(dateStr);
          const isToday = dateStr === todayStr();
          const isSelected = dateStr === selectedDate;

          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedDate(isSelected ? null : dateStr)}
              style={{
                padding: "6px 2px",
                borderRadius: "6px",
                border: isSelected
                  ? "2px solid #3b82f6"
                  : "1px solid transparent",
                background: isSelected
                  ? "rgba(59,130,246,0.25)"
                  : isToday
                    ? "rgba(59,130,246,0.12)"
                    : "transparent",
                color: isToday ? "#93c5fd" : "#cbd5e1",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: isToday || hasBookings ? 700 : 400,
                textAlign: "center",
                position: "relative",
                transition: "background 0.15s",
              }}
              title={
                hasBookings
                  ? `${monthBookings.filter((b) => b.date === dateStr).length} booking(s)`
                  : undefined
              }
            >
              {day}
              {hasBookings && (
                <span
                  style={{
                    position: "absolute",
                    bottom: "1px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "5px",
                    height: "5px",
                    borderRadius: "50%",
                    background: "#3b82f6",
                    display: "block",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day bookings */}
      {selectedDate && (
        <div style={{ marginTop: "16px", ...glass, padding: "12px" }}>
          <div
            style={{
              color: "#93c5fd",
              fontSize: "12px",
              fontWeight: 700,
              marginBottom: "8px",
            }}
          >
            📅 {selectedDate}
          </div>
          {selectedDayBookings.length === 0 ? (
            <div style={{ color: "#64748b", fontSize: "12px" }}>
              No bookings for this date
              {selectedRoom ? ` in ${selectedRoom}` : ""}.
            </div>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "6px" }}
            >
              {selectedDayBookings.map((b) => (
                <div
                  key={b.id}
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: "8px",
                    padding: "8px 10px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "4px",
                    }}
                  >
                    <span
                      style={{
                        color: "#e2e8f0",
                        fontSize: "12px",
                        fontWeight: 600,
                      }}
                    >
                      {b.room}
                    </span>
                    <span style={statusBadge(b.status)}>{b.status}</span>
                  </div>
                  <div
                    style={{
                      color: "#94a3b8",
                      fontSize: "11px",
                      marginTop: "3px",
                    }}
                  >
                    {b.eventName} · {b.startTime}–{b.endTime}
                  </div>
                  <div style={{ color: "#64748b", fontSize: "11px" }}>
                    {b.organizerName}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── MODULE 3: Room Availability Badge ────────────────────────────────────────
interface RoomAvailabilityBadgeProps {
  room: string;
  date: string;
  startTime: string;
  bookings: Booking[];
}

function RoomAvailabilityBadge({
  room,
  date,
  startTime,
  bookings,
}: RoomAvailabilityBadgeProps) {
  // Check if confirmed/approved booking exists
  const hasApproved = bookings.some(
    (b) =>
      b.room === room &&
      b.date === date &&
      (b.status === "Approved" || b.status === "Completed") &&
      (!startTime ||
        b.startTime === startTime ||
        timesOverlap(startTime, startTime, b.startTime, b.endTime)),
  );
  // Check if any pending
  const hasPending =
    !hasApproved &&
    bookings.some(
      (b) =>
        b.room === room &&
        b.date === date &&
        b.status === "Pending" &&
        (!startTime ||
          timesOverlap(startTime, startTime, b.startTime, b.endTime)),
    );

  // Also check confirmed (calendar blocked) slots
  const isConfirmedBlocked = isSlotBlocked(room, date, startTime);

  const isBooked = hasApproved || isConfirmedBlocked;
  const dot = isBooked ? "🔴" : hasPending ? "🟡" : "🟢";
  const label = isBooked
    ? "Booked"
    : hasPending
      ? "Pending Approval"
      : "Available";
  const color = isBooked ? "#fca5a5" : hasPending ? "#fcd34d" : "#6ee7b7";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "2px 8px",
        borderRadius: "10px",
        fontSize: "10px",
        fontWeight: 700,
        background: isBooked
          ? "rgba(220,38,38,0.12)"
          : hasPending
            ? "rgba(217,119,6,0.12)"
            : "rgba(5,150,105,0.12)",
        border: `1px solid ${isBooked ? "rgba(220,38,38,0.25)" : hasPending ? "rgba(217,119,6,0.25)" : "rgba(5,150,105,0.25)"}`,
        color,
        letterSpacing: "0.3px",
      }}
    >
      {dot} {label}
    </span>
  );
}

// ─── Conference Room Panel ──────────────────────────────────────────────────────
interface ConferencePanelProps {
  role: DemoRole;
}

function ConferenceRoomPanel({ role }: ConferencePanelProps) {
  const { actor } = useActor();
  const [bookings, setBookings] = useState<Booking[]>(() =>
    loadBookings(LS_CONF),
  );
  const [subTab, setSubTab] = useState<BookingSubTab>("today");
  const [calRoom, setCalRoom] = useState<string>("");
  const [formMsg, setFormMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  // MODULE 7: History search
  const [historySearch, setHistorySearch] = useState("");
  // MODULE 9: Approval greeting
  const [approvalGreetingBooking, setApprovalGreetingBooking] =
    useState<Booking | null>(null);
  // Notification polling: track last organizer name to receive backend notifications
  const [lastOrganizerName, setLastOrganizerName] = useState("");
  const { currentNotification, dismissNotification } =
    useNotificationPoller(lastOrganizerName);

  // Form state
  const [form, setForm] = useState({
    room: "",
    date: "",
    startTime: "",
    endTime: "",
    eventName: "",
    organizerName: "",
    contact: "",
    notes: "",
    designation: "",
    bookingPurpose: "",
  });

  const updateForm = (field: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setFormMsg(null);

      if (
        !form.room ||
        !form.date ||
        !form.startTime ||
        !form.endTime ||
        !form.eventName ||
        !form.organizerName ||
        !form.contact ||
        !form.designation ||
        !form.bookingPurpose
      ) {
        setFormMsg({ type: "error", text: "Please fill all required fields." });
        return;
      }
      if (form.startTime >= form.endTime) {
        setFormMsg({
          type: "error",
          text: "End time must be after start time.",
        });
        return;
      }

      // MODULE 1: Double Booking Prevention
      // Check confirmed (calendar-blocked) slots first
      if (isSlotBlocked(form.room, form.date, form.startTime)) {
        setFormMsg({
          type: "error",
          text: "This room is already reserved for the selected time slot. Please choose another available slot.",
        });
        return;
      }

      // Conflict detection in pending/approved bookings
      const current = loadBookings(LS_CONF);
      const conflict = current.find(
        (b) =>
          b.room === form.room &&
          b.date === form.date &&
          b.status !== "Cancelled" &&
          timesOverlap(form.startTime, form.endTime, b.startTime, b.endTime),
      );
      if (conflict) {
        setFormMsg({
          type: "error",
          text: "This room is already reserved for the selected time slot. Please choose another available slot.",
        });
        return;
      }

      const newBooking: Booking = {
        id: generateId("CR"),
        type: "conference",
        room: form.room,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        eventName: form.eventName,
        organizerName: form.organizerName,
        contact: form.contact,
        notes: form.notes,
        status: "Pending",
        createdAt: new Date().toISOString(),
        designation: form.designation,
        bookingPurpose: form.bookingPurpose,
      };

      const updated = [...current, newBooking];
      saveBookings(LS_CONF, updated);
      // Backend sync: fire-and-forget so cross-device requests appear in admin panel
      if (actor) {
        submitBookingRequestToBackend(actor, {
          id: newBooking.id,
          bookingType: newBooking.type,
          room: newBooking.room,
          date: newBooking.date,
          startTime: newBooking.startTime,
          endTime: newBooking.endTime,
          eventName: newBooking.eventName,
          organizerName: newBooking.organizerName,
          contact: newBooking.contact,
          notes: newBooking.notes,
          submittedBy: newBooking.organizerName,
          designation: newBooking.designation ?? "",
          bookingPurpose: newBooking.bookingPurpose ?? "",
        }).catch(() => {});
      }
      appendAudit(
        {
          action: "CREATE",
          userRole: role,
          bookingId: newBooking.id,
          details: `Created booking for ${form.room} on ${form.date}`,
        },
        role,
      );
      setBookings(updated);
      // Save organizer name so notification poller can detect approval notifications
      if (newBooking.organizerName) {
        setLastOrganizerName(newBooking.organizerName);
      }
      setForm({
        room: "",
        date: "",
        startTime: "",
        endTime: "",
        eventName: "",
        organizerName: "",
        contact: "",
        notes: "",
        designation: "",
        bookingPurpose: "",
      });
      setFormMsg({
        type: "success",
        text: `Booking ${newBooking.id} submitted successfully. Awaiting approval.`,
      });
    },
    [form, role, actor],
  );

  const updateStatus = (id: string, status: BookingStatus) => {
    const all = loadBookings(LS_CONF);
    const target = all.find((b) => b.id === id);
    const updated = all.map((b) => (b.id === id ? { ...b, status } : b));
    saveBookings(LS_CONF, updated);
    appendAudit(
      {
        action: status.toUpperCase(),
        userRole: role,
        bookingId: id,
        details: `Status changed to ${status}`,
      },
      role,
    );

    // MODULE 2: Auto Calendar Blocking — persist confirmed booking
    if (status === "Approved" && target) {
      addConfirmedBooking({
        id: target.id,
        room_name: target.room,
        booking_date: target.date,
        booking_time: target.startTime,
        booked_by: target.organizerName,
        approved_by: role,
        status: "confirmed",
        created_at: new Date().toISOString(),
      });
      persistBookingAnalytics();
      // MODULE 9: Show corporate greeting
      setApprovalGreetingBooking(target);
    }

    setBookings(updated);
  };

  const deleteBooking = (id: string) => {
    const updated = loadBookings(LS_CONF).filter((b) => b.id !== id);
    saveBookings(LS_CONF, updated);
    appendAudit(
      {
        action: "DELETE",
        userRole: role,
        bookingId: id,
        details: "Booking deleted",
      },
      role,
    );
    setBookings(updated);
  };

  const today = todayStr();

  // MODULE 7: history filtered by name
  const historyBookings = (() => {
    if (subTab !== "history") return [];
    const q = historySearch.toLowerCase().trim();
    if (!q) return [];
    return [...bookings]
      .filter((b) => b.organizerName.toLowerCase().includes(q))
      .sort((a, b) => b.date.localeCompare(a.date));
  })();

  const visibleBookings = (() => {
    if (subTab === "history") return historyBookings;
    let list = bookings;
    if (!canViewAll(role)) {
      // Supervisor sees limited: only own-day or today
      list = list.filter((b) => b.date >= today);
    }
    if (subTab === "today") return list.filter((b) => b.date === today);
    return list
      .filter((b) => b.date > today)
      .sort((a, b) => a.date.localeCompare(b.date));
  })();

  // MODULE 5: Priority map — pending bookings sorted by createdAt asc
  const pendingPriorityMap = (() => {
    const pending = [...bookings]
      .filter((b) => b.status === "Pending")
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const map: Record<string, number> = {};
    pending.forEach((b, i) => {
      map[b.id] = i + 1;
    });
    return map;
  })();

  return (
    <div>
      {/* Corporate IT Notification Popup — polls backend for approval/rejection from any device */}
      <CorporateNotificationPopup
        notification={currentNotification}
        onClose={dismissNotification}
      />

      {/* MODULE 9: Corporate Greeting Modal */}
      {approvalGreetingBooking && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.75)",
            padding: "24px",
          }}
        >
          <div
            style={{
              ...glass,
              maxWidth: "520px",
              width: "100%",
              padding: "36px 32px",
              boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "rgba(5,150,105,0.15)",
                border: "1px solid rgba(5,150,105,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}
            >
              <CheckCircle
                style={{ width: "28px", height: "28px", color: "#6ee7b7" }}
              />
            </div>
            <div
              style={{
                color: "#6ee7b7",
                fontWeight: 700,
                fontSize: "18px",
                marginBottom: "16px",
                letterSpacing: "0.3px",
              }}
            >
              Booking Successfully Confirmed
            </div>
            <div
              style={{
                color: "#cbd5e1",
                fontSize: "13px",
                lineHeight: 1.8,
                textAlign: "left",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "10px",
                padding: "20px",
                marginBottom: "20px",
                whiteSpace: "pre-line",
              }}
            >
              {`Dear ${approvalGreetingBooking.organizerName},

Your request for the ${approvalGreetingBooking.room} has been successfully approved.

The room has been reserved for your selected schedule.

We appreciate your cooperation in maintaining a well-organized and professional workplace environment.

Thank you for utilizing the Conference and Dining Facility Management System.

Best Regards
Corporate Facility Management Team`}
            </div>
            <button
              type="button"
              data-ocid="facility-booking.greeting.close_button"
              onClick={() => setApprovalGreetingBooking(null)}
              style={{
                background: "linear-gradient(135deg, #1d4ed8, #3b82f6)",
                border: "none",
                borderRadius: "8px",
                color: "white",
                fontWeight: 700,
                fontSize: "13px",
                padding: "10px 28px",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 340px",
          gap: "24px",
          alignItems: "start",
        }}
      >
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Booking Form */}
          {canCreate(role) ? (
            <div style={{ ...glass, padding: "24px" }}>
              {/* MODULE 3: Room Availability Summary */}
              {form.date && (
                <div
                  style={{
                    marginBottom: "20px",
                    padding: "14px 16px",
                    background: "rgba(59,130,246,0.05)",
                    border: "1px solid rgba(59,130,246,0.15)",
                    borderRadius: "10px",
                  }}
                >
                  <div
                    style={{
                      color: "#93c5fd",
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "0.7px",
                      textTransform: "uppercase",
                      marginBottom: "10px",
                    }}
                  >
                    Room Availability — {form.date}
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(90px, 1fr))",
                      gap: "6px",
                    }}
                  >
                    {CONFERENCE_ROOMS.map((r) => {
                      const hasApproved = bookings.some(
                        (b) =>
                          b.room === r &&
                          b.date === form.date &&
                          (b.status === "Approved" || b.status === "Completed"),
                      );
                      const hasPending =
                        !hasApproved &&
                        bookings.some(
                          (b) =>
                            b.room === r &&
                            b.date === form.date &&
                            b.status === "Pending",
                        );
                      const dot = hasApproved ? "🔴" : hasPending ? "🟡" : "🟢";
                      return (
                        <div
                          key={r}
                          style={{
                            background:
                              r === form.room
                                ? "rgba(59,130,246,0.12)"
                                : "rgba(255,255,255,0.03)",
                            border: `1px solid ${r === form.room ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.07)"}`,
                            borderRadius: "6px",
                            padding: "5px 7px",
                            fontSize: "10px",
                            color: "#94a3b8",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <span style={{ fontSize: "9px" }}>{dot}</span>
                          <span
                            style={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {r}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      marginTop: "8px",
                      flexWrap: "wrap",
                    }}
                  >
                    {[
                      { dot: "🟢", label: "Available" },
                      { dot: "🟡", label: "Pending Approval" },
                      { dot: "🔴", label: "Booked" },
                    ].map(({ dot, label }) => (
                      <span
                        key={label}
                        style={{ color: "#475569", fontSize: "10px" }}
                      >
                        {dot} {label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "20px",
                }}
              >
                <Building2
                  style={{ width: "18px", height: "18px", color: "#3b82f6" }}
                />
                <h3
                  style={{
                    color: "#f1f5f9",
                    fontWeight: 700,
                    fontSize: "15px",
                    margin: 0,
                  }}
                >
                  New Conference Room Booking
                </h3>
              </div>

              {formMsg && (
                <div
                  style={{
                    marginBottom: "16px",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    background:
                      formMsg.type === "success"
                        ? "rgba(5,150,105,0.15)"
                        : "rgba(220,38,38,0.15)",
                    border: `1px solid ${formMsg.type === "success" ? "rgba(5,150,105,0.4)" : "rgba(220,38,38,0.4)"}`,
                    color: formMsg.type === "success" ? "#6ee7b7" : "#fca5a5",
                    fontSize: "13px",
                    display: "flex",
                    gap: "8px",
                    alignItems: "flex-start",
                  }}
                >
                  {formMsg.type === "success" ? (
                    <CheckCircle
                      style={{
                        width: "15px",
                        height: "15px",
                        flexShrink: 0,
                        marginTop: "1px",
                      }}
                    />
                  ) : (
                    <AlertCircle
                      style={{
                        width: "15px",
                        height: "15px",
                        flexShrink: 0,
                        marginTop: "1px",
                      }}
                    />
                  )}
                  {formMsg.text}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "14px",
                  }}
                >
                  <div style={{ gridColumn: "1 / -1" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "5px",
                      }}
                    >
                      <label
                        htmlFor="cr-room"
                        style={{ ...labelStyle, marginBottom: 0 }}
                      >
                        Select Room *
                      </label>
                      {/* MODULE 3: Inline availability badge */}
                      {form.room && form.date && (
                        <RoomAvailabilityBadge
                          room={form.room}
                          date={form.date}
                          startTime={form.startTime}
                          bookings={bookings}
                        />
                      )}
                    </div>
                    <select
                      id="cr-room"
                      data-ocid="facility-booking.conference.room.select"
                      value={form.room}
                      onChange={(e) => updateForm("room", e.target.value)}
                      style={inputStyle}
                      required
                    >
                      <option
                        value=""
                        disabled
                        style={{ background: "#1e293b" }}
                      >
                        Choose a conference room…
                      </option>
                      {CONFERENCE_ROOMS.map((r) => (
                        <option
                          key={r}
                          value={r}
                          style={{ background: "#1e293b" }}
                        >
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="cr-date" style={labelStyle}>
                      Booking Date *
                    </label>
                    <input
                      id="cr-date"
                      data-ocid="facility-booking.conference.date.input"
                      type="date"
                      value={form.date}
                      onChange={(e) => updateForm("date", e.target.value)}
                      min={today}
                      style={{ ...inputStyle, colorScheme: "dark" }}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="cr-start-time" style={labelStyle}>
                      Start Time *
                    </label>
                    <input
                      id="cr-start-time"
                      data-ocid="facility-booking.conference.start-time.input"
                      type="time"
                      value={form.startTime}
                      onChange={(e) => updateForm("startTime", e.target.value)}
                      style={{ ...inputStyle, colorScheme: "dark" }}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="cr-end-time" style={labelStyle}>
                      End Time *
                    </label>
                    <input
                      id="cr-end-time"
                      data-ocid="facility-booking.conference.end-time.input"
                      type="time"
                      value={form.endTime}
                      onChange={(e) => updateForm("endTime", e.target.value)}
                      style={{ ...inputStyle, colorScheme: "dark" }}
                      required
                    />
                  </div>

                  <div style={{ gridColumn: "1 / -1" }}>
                    <label htmlFor="cr-event-name" style={labelStyle}>
                      Event Name *
                    </label>
                    <input
                      id="cr-event-name"
                      data-ocid="facility-booking.conference.event-name.input"
                      type="text"
                      value={form.eventName}
                      onChange={(e) => updateForm("eventName", e.target.value)}
                      placeholder="e.g. Quarterly Review Meeting"
                      style={inputStyle}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="cr-organizer" style={labelStyle}>
                      Organizer Name *
                    </label>
                    <input
                      id="cr-organizer"
                      data-ocid="facility-booking.conference.organizer.input"
                      type="text"
                      value={form.organizerName}
                      onChange={(e) =>
                        updateForm("organizerName", e.target.value)
                      }
                      placeholder="Full name"
                      style={inputStyle}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="cr-contact" style={labelStyle}>
                      Contact Number / Email *
                    </label>
                    <input
                      id="cr-contact"
                      data-ocid="facility-booking.conference.contact.input"
                      type="text"
                      value={form.contact}
                      onChange={(e) => updateForm("contact", e.target.value)}
                      placeholder="Phone or email"
                      style={inputStyle}
                      required
                    />
                  </div>

                  <div style={{ gridColumn: "1 / -1" }}>
                    <label htmlFor="cr-notes" style={labelStyle}>
                      Special Notes
                    </label>
                    <textarea
                      id="cr-notes"
                      data-ocid="facility-booking.conference.notes.textarea"
                      value={form.notes}
                      onChange={(e) => updateForm("notes", e.target.value)}
                      placeholder="Any special requirements or instructions…"
                      rows={3}
                      style={{
                        ...inputStyle,
                        resize: "vertical",
                        minHeight: "72px",
                      }}
                    />
                  </div>

                  <div>
                    <label htmlFor="cr-designation" style={labelStyle}>
                      Designation / Project Role *
                    </label>
                    <select
                      id="cr-designation"
                      data-ocid="facility-booking.conference.designation.select"
                      value={form.designation}
                      onChange={(e) =>
                        updateForm("designation", e.target.value)
                      }
                      style={inputStyle}
                      required
                    >
                      <option
                        value=""
                        disabled
                        style={{ background: "#1e293b" }}
                      >
                        Select designation…
                      </option>
                      {DESIGNATIONS.map((d) => (
                        <option
                          key={d}
                          value={d}
                          style={{ background: "#1e293b" }}
                        >
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="cr-booking-purpose" style={labelStyle}>
                      Booking Type / Purpose *
                    </label>
                    <select
                      id="cr-booking-purpose"
                      data-ocid="facility-booking.conference.booking-purpose.select"
                      value={form.bookingPurpose}
                      onChange={(e) =>
                        updateForm("bookingPurpose", e.target.value)
                      }
                      style={inputStyle}
                      required
                    >
                      <option
                        value=""
                        disabled
                        style={{ background: "#1e293b" }}
                      >
                        Select booking purpose…
                      </option>
                      {BOOKING_PURPOSES.map((p) => (
                        <option
                          key={p}
                          value={p}
                          style={{ background: "#1e293b" }}
                        >
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  data-ocid="facility-booking.conference.submit_button"
                  style={{
                    marginTop: "16px",
                    width: "100%",
                    background: "linear-gradient(135deg, #1d4ed8, #3b82f6)",
                    border: "none",
                    borderRadius: "10px",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "14px",
                    padding: "12px 24px",
                    cursor: "pointer",
                    letterSpacing: "0.3px",
                    boxShadow: "0 4px 16px rgba(59,130,246,0.35)",
                    transition: "opacity 0.2s, transform 0.15s",
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  Submit Booking Request
                </button>
              </form>
            </div>
          ) : (
            <div
              style={{
                ...glass,
                padding: "24px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <Eye
                style={{
                  width: "20px",
                  height: "20px",
                  color: "#64748b",
                  flexShrink: 0,
                }}
              />
              <div>
                <div
                  style={{
                    color: "#f1f5f9",
                    fontWeight: 600,
                    fontSize: "14px",
                  }}
                >
                  View-Only Access
                </div>
                <div
                  style={{
                    color: "#64748b",
                    fontSize: "13px",
                    marginTop: "3px",
                  }}
                >
                  You can view the conference room booking schedule.
                </div>
              </div>
            </div>
          )}

          {/* Booking List */}
          <div style={{ ...glass, padding: "24px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "16px",
              }}
            >
              <Clock
                style={{ width: "16px", height: "16px", color: "#3b82f6" }}
              />
              <h3
                style={{
                  color: "#f1f5f9",
                  fontWeight: 700,
                  fontSize: "15px",
                  margin: 0,
                }}
              >
                Bookings
              </h3>
            </div>

            {/* Sub-tabs */}
            <div
              style={{
                display: "flex",
                gap: "6px",
                marginBottom: "16px",
                background: "rgba(255,255,255,0.05)",
                borderRadius: "8px",
                padding: "4px",
              }}
            >
              <button
                type="button"
                data-ocid="facility-booking.conference.today.tab"
                onClick={() => setSubTab("today")}
                style={{
                  flex: 1,
                  padding: "7px 12px",
                  borderRadius: "6px",
                  border: "none",
                  background:
                    subTab === "today"
                      ? "linear-gradient(135deg, #1d4ed8, #3b82f6)"
                      : "transparent",
                  color: subTab === "today" ? "white" : "#94a3b8",
                  fontWeight: 600,
                  fontSize: "12px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "background 0.2s, color 0.2s",
                }}
              >
                Today
              </button>
              <button
                type="button"
                data-ocid="facility-booking.conference.upcoming.tab"
                onClick={() => setSubTab("upcoming")}
                style={{
                  flex: 1,
                  padding: "7px 12px",
                  borderRadius: "6px",
                  border: "none",
                  background:
                    subTab === "upcoming"
                      ? "linear-gradient(135deg, #1d4ed8, #3b82f6)"
                      : "transparent",
                  color: subTab === "upcoming" ? "white" : "#94a3b8",
                  fontWeight: 600,
                  fontSize: "12px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "background 0.2s, color 0.2s",
                }}
              >
                Upcoming
              </button>
              {/* MODULE 7: History tab */}
              <button
                type="button"
                data-ocid="facility-booking.conference.history.tab"
                onClick={() => setSubTab("history")}
                style={{
                  flex: 1,
                  padding: "7px 12px",
                  borderRadius: "6px",
                  border: "none",
                  background:
                    subTab === "history"
                      ? "linear-gradient(135deg, #1d4ed8, #3b82f6)"
                      : "transparent",
                  color: subTab === "history" ? "white" : "#94a3b8",
                  fontWeight: 600,
                  fontSize: "12px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "background 0.2s, color 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  justifyContent: "center",
                }}
              >
                <History style={{ width: "11px", height: "11px" }} />
                History
              </button>
            </div>

            {/* MODULE 7: History search input */}
            {subTab === "history" && (
              <div style={{ marginBottom: "12px" }}>
                <label
                  htmlFor="cr-history-search"
                  style={{ ...labelStyle, marginBottom: "6px" }}
                >
                  Enter your name to view your bookings:
                </label>
                <input
                  id="cr-history-search"
                  data-ocid="facility-booking.conference.history.search_input"
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Type organizer name…"
                  style={inputStyle}
                />
              </div>
            )}

            {subTab === "history" && !historySearch.trim() ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "32px 16px",
                  color: "#475569",
                  fontSize: "13px",
                }}
              >
                Enter your name above to see your booking history.
              </div>
            ) : visibleBookings.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "32px 16px",
                  color: "#475569",
                }}
              >
                <Building2
                  style={{
                    width: "32px",
                    height: "32px",
                    color: "#334155",
                    margin: "0 auto 10px",
                  }}
                />
                <div style={{ fontSize: "13px" }}>
                  No {subTab} conference bookings.
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {visibleBookings.map((b, idx) => (
                  <div
                    key={b.id}
                    data-ocid={`facility-booking.conference.booking.item.${idx + 1}`}
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      borderRadius: "10px",
                      padding: "14px",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        flexWrap: "wrap",
                        gap: "8px",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            flexWrap: "wrap",
                          }}
                        >
                          <span
                            style={{
                              color: "#93c5fd",
                              fontWeight: 700,
                              fontSize: "13px",
                            }}
                          >
                            {b.room}
                          </span>
                          <span style={statusBadge(b.status)}>{b.status}</span>
                          {/* MODULE 5: Priority badge */}
                          {b.status === "Pending" &&
                            pendingPriorityMap[b.id] && (
                              <span
                                style={{
                                  display: "inline-block",
                                  padding: "2px 7px",
                                  borderRadius: "10px",
                                  fontSize: "10px",
                                  fontWeight: 700,
                                  background: "rgba(245,158,11,0.15)",
                                  color: "#fcd34d",
                                  border: "1px solid rgba(245,158,11,0.3)",
                                }}
                              >
                                Priority #{pendingPriorityMap[b.id]}
                              </span>
                            )}
                        </div>
                        <div
                          style={{
                            color: "#f1f5f9",
                            fontWeight: 600,
                            fontSize: "13px",
                            marginTop: "4px",
                          }}
                        >
                          {b.eventName}
                        </div>
                        <div
                          style={{
                            color: "#64748b",
                            fontSize: "12px",
                            marginTop: "3px",
                          }}
                        >
                          📅 {b.date} · ⏰ {b.startTime}–{b.endTime}
                        </div>
                        <div style={{ color: "#64748b", fontSize: "12px" }}>
                          👤 {b.organizerName} · 📞 {b.contact}
                        </div>
                        {(b.designation || b.bookingPurpose) && (
                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              flexWrap: "wrap",
                              marginTop: "4px",
                            }}
                          >
                            {b.designation && (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  background: "rgba(59,130,246,0.08)",
                                  border: "1px solid rgba(59,130,246,0.2)",
                                  borderRadius: "6px",
                                  padding: "2px 8px",
                                  fontSize: "10px",
                                  color: "#93c5fd",
                                  fontWeight: 600,
                                }}
                              >
                                🏷️ {b.designation}
                              </span>
                            )}
                            {b.bookingPurpose && (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  background: "rgba(99,102,241,0.08)",
                                  border: "1px solid rgba(99,102,241,0.2)",
                                  borderRadius: "6px",
                                  padding: "2px 8px",
                                  fontSize: "10px",
                                  color: "#a5b4fc",
                                  fontWeight: 600,
                                }}
                              >
                                📋 {b.bookingPurpose}
                              </span>
                            )}
                          </div>
                        )}
                        {b.notes && (
                          <div
                            style={{
                              color: "#475569",
                              fontSize: "11px",
                              marginTop: "3px",
                              fontStyle: "italic",
                            }}
                          >
                            "{b.notes}"
                          </div>
                        )}
                        <div
                          style={{
                            color: "#374151",
                            fontSize: "10px",
                            marginTop: "3px",
                          }}
                        >
                          ID: {b.id}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    {(canApproveReject(role) || canDelete(role)) && (
                      <div
                        style={{
                          display: "flex",
                          gap: "6px",
                          marginTop: "10px",
                          flexWrap: "wrap",
                        }}
                      >
                        {canApproveReject(role) && b.status === "Pending" && (
                          <>
                            <button
                              type="button"
                              data-ocid={`facility-booking.conference.approve.button.${idx + 1}`}
                              onClick={() => updateStatus(b.id, "Approved")}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "5px 12px",
                                borderRadius: "6px",
                                border: "none",
                                background: "rgba(5,150,105,0.2)",
                                color: "#6ee7b7",
                                fontSize: "11px",
                                fontWeight: 700,
                                cursor: "pointer",
                                fontFamily: "inherit",
                              }}
                            >
                              <CheckCircle
                                style={{ width: "12px", height: "12px" }}
                              />{" "}
                              Approve
                            </button>
                            <button
                              type="button"
                              data-ocid={`facility-booking.conference.reject.button.${idx + 1}`}
                              onClick={() => updateStatus(b.id, "Cancelled")}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "5px 12px",
                                borderRadius: "6px",
                                border: "none",
                                background: "rgba(220,38,38,0.2)",
                                color: "#fca5a5",
                                fontSize: "11px",
                                fontWeight: 700,
                                cursor: "pointer",
                                fontFamily: "inherit",
                              }}
                            >
                              <XCircle
                                style={{ width: "12px", height: "12px" }}
                              />{" "}
                              Reject
                            </button>
                          </>
                        )}
                        {canApproveReject(role) && b.status === "Approved" && (
                          <button
                            type="button"
                            onClick={() => updateStatus(b.id, "Completed")}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "5px 12px",
                              borderRadius: "6px",
                              border: "none",
                              background: "rgba(59,130,246,0.2)",
                              color: "#93c5fd",
                              fontSize: "11px",
                              fontWeight: 700,
                              cursor: "pointer",
                              fontFamily: "inherit",
                            }}
                          >
                            <CheckCircle
                              style={{ width: "12px", height: "12px" }}
                            />{" "}
                            Mark Complete
                          </button>
                        )}
                        {canEdit(role) && (
                          <button
                            type="button"
                            onClick={() => {
                              /* edit placeholder */
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "5px 12px",
                              borderRadius: "6px",
                              border: "1px solid rgba(255,255,255,0.15)",
                              background: "transparent",
                              color: "#94a3b8",
                              fontSize: "11px",
                              fontWeight: 700,
                              cursor: "pointer",
                              fontFamily: "inherit",
                            }}
                          >
                            <Edit3 style={{ width: "12px", height: "12px" }} />{" "}
                            Edit
                          </button>
                        )}
                        {canDelete(role) && (
                          <button
                            type="button"
                            data-ocid={`facility-booking.conference.delete.button.${idx + 1}`}
                            onClick={() => deleteBooking(b.id)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "5px 12px",
                              borderRadius: "6px",
                              border: "none",
                              background: "rgba(220,38,38,0.15)",
                              color: "#fca5a5",
                              fontSize: "11px",
                              fontWeight: 700,
                              cursor: "pointer",
                              fontFamily: "inherit",
                            }}
                          >
                            <Trash2 style={{ width: "12px", height: "12px" }} />{" "}
                            Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Calendar */}
        <div
          style={{ ...glass, padding: "20px", position: "sticky", top: "80px" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "16px",
            }}
          >
            <Calendar
              style={{ width: "16px", height: "16px", color: "#3b82f6" }}
            />
            <h3
              style={{
                color: "#f1f5f9",
                fontWeight: 700,
                fontSize: "14px",
                margin: 0,
              }}
            >
              Room Availability
            </h3>
          </div>

          {/* Room filter */}
          <div style={{ marginBottom: "14px" }}>
            <label htmlFor="cr-cal-room" style={labelStyle}>
              Filter by Room
            </label>
            <select
              id="cr-cal-room"
              value={calRoom}
              onChange={(e) => setCalRoom(e.target.value)}
              style={{ ...inputStyle, fontSize: "12px" }}
            >
              <option value="" style={{ background: "#1e293b" }}>
                All Rooms
              </option>
              {CONFERENCE_ROOMS.map((r) => (
                <option key={r} value={r} style={{ background: "#1e293b" }}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <MiniCalendar
            bookings={bookings}
            selectedRoom={calRoom}
            prevBtnId="facility-booking.conference.calendar.prev"
            nextBtnId="facility-booking.conference.calendar.next"
            type="conference"
          />

          {/* Legend */}
          <div
            style={{
              marginTop: "14px",
              display: "flex",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#3b82f6",
                  display: "inline-block",
                }}
              />
              <span style={{ color: "#64748b", fontSize: "11px" }}>
                Has bookings
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "4px",
                  background: "rgba(59,130,246,0.25)",
                  border: "1px solid #3b82f6",
                  display: "inline-block",
                }}
              />
              <span style={{ color: "#64748b", fontSize: "11px" }}>Today</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Dining Room Panel ──────────────────────────────────────────────────────────
interface DiningPanelProps {
  role: DemoRole;
}

function DiningRoomPanel({ role }: DiningPanelProps) {
  const { actor } = useActor();
  const [bookings, setBookings] = useState<Booking[]>(() =>
    loadBookings(LS_DINING),
  );
  const [subTab, setSubTab] = useState<BookingSubTab>("today");
  const [formMsg, setFormMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [selectedCalDate, setSelectedCalDate] = useState<string | null>(null);
  // MODULE 7: History search
  const [historySearch, setHistorySearch] = useState("");
  // MODULE 9: Approval greeting
  const [approvalGreetingBooking, setApprovalGreetingBooking] =
    useState<Booking | null>(null);
  // Notification polling: track last organizer name to receive backend notifications
  const [lastOrganizerName, setLastOrganizerName] = useState("");
  const { currentNotification, dismissNotification } =
    useNotificationPoller(lastOrganizerName);

  const [form, setForm] = useState({
    room: "",
    eventType: "",
    date: "",
    startTime: "",
    endTime: "",
    numGuests: "",
    organizerName: "",
    contact: "",
    notes: "",
    designation: "",
    bookingPurpose: "",
  });

  const updateForm = (field: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setFormMsg(null);

      if (
        !form.room ||
        !form.eventType ||
        !form.date ||
        !form.startTime ||
        !form.endTime ||
        !form.organizerName ||
        !form.contact ||
        !form.designation ||
        !form.bookingPurpose
      ) {
        setFormMsg({ type: "error", text: "Please fill all required fields." });
        return;
      }
      if (form.startTime >= form.endTime) {
        setFormMsg({
          type: "error",
          text: "End time must be after start time.",
        });
        return;
      }

      // MODULE 1: Double Booking Prevention — check confirmed slots first
      if (isSlotBlocked(form.room, form.date, form.startTime)) {
        setFormMsg({
          type: "error",
          text: "This room is already reserved for the selected time slot. Please choose another available slot.",
        });
        return;
      }

      const current = loadBookings(LS_DINING);
      const conflict = current.find(
        (b) =>
          b.room === form.room &&
          b.date === form.date &&
          b.status !== "Cancelled" &&
          timesOverlap(form.startTime, form.endTime, b.startTime, b.endTime),
      );
      if (conflict) {
        setFormMsg({
          type: "error",
          text: "This room is already reserved for the selected time slot. Please choose another available slot.",
        });
        return;
      }

      const newBooking: Booking = {
        id: generateId("DR"),
        type: "dining",
        room: form.room,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        eventName: form.eventType,
        organizerName: form.organizerName,
        contact: form.contact,
        notes: form.notes,
        status: "Pending",
        createdAt: new Date().toISOString(),
        eventType: form.eventType,
        numGuests: form.numGuests
          ? Number.parseInt(form.numGuests, 10)
          : undefined,
        designation: form.designation,
        bookingPurpose: form.bookingPurpose,
      };

      const updated = [...current, newBooking];
      saveBookings(LS_DINING, updated);
      // Backend sync: fire-and-forget so cross-device requests appear in admin panel
      if (actor) {
        submitBookingRequestToBackend(actor, {
          id: newBooking.id,
          bookingType: newBooking.type,
          room: newBooking.room,
          date: newBooking.date,
          startTime: newBooking.startTime,
          endTime: newBooking.endTime,
          eventName: newBooking.eventName,
          organizerName: newBooking.organizerName,
          contact: newBooking.contact,
          notes: newBooking.notes,
          submittedBy: newBooking.organizerName,
          designation: newBooking.designation ?? "",
          bookingPurpose: newBooking.bookingPurpose ?? "",
        }).catch(() => {});
      }
      appendAudit(
        {
          action: "CREATE",
          userRole: role,
          bookingId: newBooking.id,
          details: `Created dining booking for ${form.room} on ${form.date}`,
        },
        role,
      );
      setBookings(updated);
      // Save organizer name so notification poller can detect approval notifications
      if (newBooking.organizerName) {
        setLastOrganizerName(newBooking.organizerName);
      }
      setForm({
        room: "",
        eventType: "",
        date: "",
        startTime: "",
        endTime: "",
        numGuests: "",
        organizerName: "",
        contact: "",
        notes: "",
        designation: "",
        bookingPurpose: "",
      });
      setFormMsg({
        type: "success",
        text: `Booking ${newBooking.id} submitted successfully. Awaiting approval.`,
      });
    },
    [form, role, actor],
  );

  const updateStatus = (id: string, status: BookingStatus) => {
    const all = loadBookings(LS_DINING);
    const target = all.find((b) => b.id === id);
    const updated = all.map((b) => (b.id === id ? { ...b, status } : b));
    saveBookings(LS_DINING, updated);
    appendAudit(
      {
        action: status.toUpperCase(),
        userRole: role,
        bookingId: id,
        details: `Status changed to ${status}`,
      },
      role,
    );

    // MODULE 2: Auto Calendar Blocking — persist confirmed booking
    if (status === "Approved" && target) {
      addConfirmedBooking({
        id: target.id,
        room_name: target.room,
        booking_date: target.date,
        booking_time: target.startTime,
        booked_by: target.organizerName,
        approved_by: role,
        status: "confirmed",
        created_at: new Date().toISOString(),
      });
      persistBookingAnalytics();
      // MODULE 9: Show corporate greeting
      setApprovalGreetingBooking(target);
    }

    setBookings(updated);
  };

  const deleteBooking = (id: string) => {
    const updated = loadBookings(LS_DINING).filter((b) => b.id !== id);
    saveBookings(LS_DINING, updated);
    appendAudit(
      {
        action: "DELETE",
        userRole: role,
        bookingId: id,
        details: "Booking deleted",
      },
      role,
    );
    setBookings(updated);
  };

  const today = todayStr();

  // MODULE 7: history filtered by name
  const historyBookings = (() => {
    if (subTab !== "history") return [];
    const q = historySearch.toLowerCase().trim();
    if (!q) return [];
    return [...bookings]
      .filter((b) => b.organizerName.toLowerCase().includes(q))
      .sort((a, b) => b.date.localeCompare(a.date));
  })();

  const visibleBookings = (() => {
    if (subTab === "history") return historyBookings;
    let list = bookings;
    if (!canViewAll(role)) list = list.filter((b) => b.date >= today);
    if (subTab === "today") return list.filter((b) => b.date === today);
    return list
      .filter((b) => b.date > today)
      .sort((a, b) => a.date.localeCompare(b.date));
  })();

  // MODULE 5: Priority map
  const pendingPriorityMap = (() => {
    const pending = [...bookings]
      .filter((b) => b.status === "Pending")
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const map: Record<string, number> = {};
    pending.forEach((b, i) => {
      map[b.id] = i + 1;
    });
    return map;
  })();

  const selectedDateBookings = selectedCalDate
    ? bookings
        .filter((b) => b.date === selectedCalDate)
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
    : [];

  return (
    <div>
      {/* Corporate IT Notification Popup — polls backend for approval/rejection from any device */}
      <CorporateNotificationPopup
        notification={currentNotification}
        onClose={dismissNotification}
      />

      {/* MODULE 9: Corporate Greeting Modal */}
      {approvalGreetingBooking && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.75)",
            padding: "24px",
          }}
        >
          <div
            style={{
              ...glass,
              maxWidth: "520px",
              width: "100%",
              padding: "36px 32px",
              boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "rgba(5,150,105,0.15)",
                border: "1px solid rgba(5,150,105,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}
            >
              <CheckCircle
                style={{ width: "28px", height: "28px", color: "#6ee7b7" }}
              />
            </div>
            <div
              style={{
                color: "#6ee7b7",
                fontWeight: 700,
                fontSize: "18px",
                marginBottom: "16px",
                letterSpacing: "0.3px",
              }}
            >
              Booking Successfully Confirmed
            </div>
            <div
              style={{
                color: "#cbd5e1",
                fontSize: "13px",
                lineHeight: 1.8,
                textAlign: "left",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "10px",
                padding: "20px",
                marginBottom: "20px",
                whiteSpace: "pre-line",
              }}
            >
              {`Dear ${approvalGreetingBooking.organizerName},

Your request for the ${approvalGreetingBooking.room} has been successfully approved.

The room has been reserved for your selected schedule.

We appreciate your cooperation in maintaining a well-organized and professional workplace environment.

Thank you for utilizing the Conference and Dining Facility Management System.

Best Regards
Corporate Facility Management Team`}
            </div>
            <button
              type="button"
              data-ocid="facility-booking.dining-greeting.close_button"
              onClick={() => setApprovalGreetingBooking(null)}
              style={{
                background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                border: "none",
                borderRadius: "8px",
                color: "white",
                fontWeight: 700,
                fontSize: "13px",
                padding: "10px 28px",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 340px",
          gap: "24px",
          alignItems: "start",
        }}
      >
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Form */}
          {canCreate(role) ? (
            <div style={{ ...glass, padding: "24px" }}>
              {/* MODULE 3: Room Availability Summary */}
              {form.date && (
                <div
                  style={{
                    marginBottom: "20px",
                    padding: "14px 16px",
                    background: "rgba(124,58,237,0.05)",
                    border: "1px solid rgba(124,58,237,0.15)",
                    borderRadius: "10px",
                  }}
                >
                  <div
                    style={{
                      color: "#c4b5fd",
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "0.7px",
                      textTransform: "uppercase",
                      marginBottom: "10px",
                    }}
                  >
                    Dining Room Availability — {form.date}
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(90px, 1fr))",
                      gap: "6px",
                    }}
                  >
                    {DINING_ROOMS.map((r) => {
                      const hasApproved = bookings.some(
                        (b) =>
                          b.room === r &&
                          b.date === form.date &&
                          (b.status === "Approved" || b.status === "Completed"),
                      );
                      const hasPending =
                        !hasApproved &&
                        bookings.some(
                          (b) =>
                            b.room === r &&
                            b.date === form.date &&
                            b.status === "Pending",
                        );
                      const dot = hasApproved ? "🔴" : hasPending ? "🟡" : "🟢";
                      return (
                        <div
                          key={r}
                          style={{
                            background:
                              r === form.room
                                ? "rgba(124,58,237,0.12)"
                                : "rgba(255,255,255,0.03)",
                            border: `1px solid ${r === form.room ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.07)"}`,
                            borderRadius: "6px",
                            padding: "5px 7px",
                            fontSize: "10px",
                            color: "#94a3b8",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <span style={{ fontSize: "9px" }}>{dot}</span>
                          <span
                            style={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {r}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      marginTop: "8px",
                      flexWrap: "wrap",
                    }}
                  >
                    {[
                      { dot: "🟢", label: "Available" },
                      { dot: "🟡", label: "Pending Approval" },
                      { dot: "🔴", label: "Booked" },
                    ].map(({ dot, label }) => (
                      <span
                        key={label}
                        style={{ color: "#475569", fontSize: "10px" }}
                      >
                        {dot} {label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "20px",
                }}
              >
                <UtensilsCrossed
                  style={{ width: "18px", height: "18px", color: "#a78bfa" }}
                />
                <h3
                  style={{
                    color: "#f1f5f9",
                    fontWeight: 700,
                    fontSize: "15px",
                    margin: 0,
                  }}
                >
                  New Dining Room Booking
                </h3>
              </div>

              {formMsg && (
                <div
                  style={{
                    marginBottom: "16px",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    background:
                      formMsg.type === "success"
                        ? "rgba(5,150,105,0.15)"
                        : "rgba(220,38,38,0.15)",
                    border: `1px solid ${formMsg.type === "success" ? "rgba(5,150,105,0.4)" : "rgba(220,38,38,0.4)"}`,
                    color: formMsg.type === "success" ? "#6ee7b7" : "#fca5a5",
                    fontSize: "13px",
                    display: "flex",
                    gap: "8px",
                    alignItems: "flex-start",
                  }}
                >
                  {formMsg.type === "success" ? (
                    <CheckCircle
                      style={{
                        width: "15px",
                        height: "15px",
                        flexShrink: 0,
                        marginTop: "1px",
                      }}
                    />
                  ) : (
                    <AlertCircle
                      style={{
                        width: "15px",
                        height: "15px",
                        flexShrink: 0,
                        marginTop: "1px",
                      }}
                    />
                  )}
                  {formMsg.text}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "14px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "5px",
                      }}
                    >
                      <label
                        htmlFor="dr-room"
                        style={{ ...labelStyle, marginBottom: 0 }}
                      >
                        Select Dining Room *
                      </label>
                      {/* MODULE 3: Inline availability badge */}
                      {form.room && form.date && (
                        <RoomAvailabilityBadge
                          room={form.room}
                          date={form.date}
                          startTime={form.startTime}
                          bookings={bookings}
                        />
                      )}
                    </div>
                    <select
                      id="dr-room"
                      data-ocid="facility-booking.dining.room.select"
                      value={form.room}
                      onChange={(e) => updateForm("room", e.target.value)}
                      style={inputStyle}
                      required
                    >
                      <option
                        value=""
                        disabled
                        style={{ background: "#1e293b" }}
                      >
                        Choose a dining room…
                      </option>
                      {DINING_ROOMS.map((r) => (
                        <option
                          key={r}
                          value={r}
                          style={{ background: "#1e293b" }}
                        >
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="dr-event-type" style={labelStyle}>
                      Event Type *
                    </label>
                    <select
                      id="dr-event-type"
                      data-ocid="facility-booking.dining.event-type.select"
                      value={form.eventType}
                      onChange={(e) => updateForm("eventType", e.target.value)}
                      style={inputStyle}
                      required
                    >
                      <option
                        value=""
                        disabled
                        style={{ background: "#1e293b" }}
                      >
                        Select event type…
                      </option>
                      {DINING_EVENT_TYPES.map((t) => (
                        <option
                          key={t}
                          value={t}
                          style={{ background: "#1e293b" }}
                        >
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="dr-date" style={labelStyle}>
                      Booking Date *
                    </label>
                    <input
                      id="dr-date"
                      data-ocid="facility-booking.dining.date.input"
                      type="date"
                      value={form.date}
                      onChange={(e) => updateForm("date", e.target.value)}
                      min={today}
                      style={{ ...inputStyle, colorScheme: "dark" }}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="dr-guests" style={labelStyle}>
                      Number of Guests
                    </label>
                    <input
                      id="dr-guests"
                      data-ocid="facility-booking.dining.guests.input"
                      type="number"
                      value={form.numGuests}
                      onChange={(e) => updateForm("numGuests", e.target.value)}
                      placeholder="0"
                      min={1}
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label htmlFor="dr-start-time" style={labelStyle}>
                      Start Time *
                    </label>
                    <input
                      id="dr-start-time"
                      data-ocid="facility-booking.dining.start-time.input"
                      type="time"
                      value={form.startTime}
                      onChange={(e) => updateForm("startTime", e.target.value)}
                      style={{ ...inputStyle, colorScheme: "dark" }}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="dr-end-time" style={labelStyle}>
                      End Time *
                    </label>
                    <input
                      id="dr-end-time"
                      data-ocid="facility-booking.dining.end-time.input"
                      type="time"
                      value={form.endTime}
                      onChange={(e) => updateForm("endTime", e.target.value)}
                      style={{ ...inputStyle, colorScheme: "dark" }}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="dr-organizer" style={labelStyle}>
                      Organizer Name *
                    </label>
                    <input
                      id="dr-organizer"
                      data-ocid="facility-booking.dining.organizer.input"
                      type="text"
                      value={form.organizerName}
                      onChange={(e) =>
                        updateForm("organizerName", e.target.value)
                      }
                      placeholder="Full name"
                      style={inputStyle}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="dr-contact" style={labelStyle}>
                      Contact Details *
                    </label>
                    <input
                      id="dr-contact"
                      data-ocid="facility-booking.dining.contact.input"
                      type="text"
                      value={form.contact}
                      onChange={(e) => updateForm("contact", e.target.value)}
                      placeholder="Phone or email"
                      style={inputStyle}
                      required
                    />
                  </div>

                  <div style={{ gridColumn: "1 / -1" }}>
                    <label htmlFor="dr-notes" style={labelStyle}>
                      Special Arrangement Notes
                    </label>
                    <textarea
                      id="dr-notes"
                      data-ocid="facility-booking.dining.notes.textarea"
                      value={form.notes}
                      onChange={(e) => updateForm("notes", e.target.value)}
                      placeholder="Dietary requirements, setup instructions, special requests…"
                      rows={3}
                      style={{
                        ...inputStyle,
                        resize: "vertical",
                        minHeight: "72px",
                      }}
                    />
                  </div>

                  <div>
                    <label htmlFor="dr-designation" style={labelStyle}>
                      Designation / Project Role *
                    </label>
                    <select
                      id="dr-designation"
                      data-ocid="facility-booking.dining.designation.select"
                      value={form.designation}
                      onChange={(e) =>
                        updateForm("designation", e.target.value)
                      }
                      style={inputStyle}
                      required
                    >
                      <option
                        value=""
                        disabled
                        style={{ background: "#1e293b" }}
                      >
                        Select designation…
                      </option>
                      {DESIGNATIONS.map((d) => (
                        <option
                          key={d}
                          value={d}
                          style={{ background: "#1e293b" }}
                        >
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="dr-booking-purpose" style={labelStyle}>
                      Booking Type / Purpose *
                    </label>
                    <select
                      id="dr-booking-purpose"
                      data-ocid="facility-booking.dining.booking-purpose.select"
                      value={form.bookingPurpose}
                      onChange={(e) =>
                        updateForm("bookingPurpose", e.target.value)
                      }
                      style={inputStyle}
                      required
                    >
                      <option
                        value=""
                        disabled
                        style={{ background: "#1e293b" }}
                      >
                        Select booking purpose…
                      </option>
                      {BOOKING_PURPOSES.map((p) => (
                        <option
                          key={p}
                          value={p}
                          style={{ background: "#1e293b" }}
                        >
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  data-ocid="facility-booking.dining.submit_button"
                  style={{
                    marginTop: "16px",
                    width: "100%",
                    background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                    border: "none",
                    borderRadius: "10px",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "14px",
                    padding: "12px 24px",
                    cursor: "pointer",
                    letterSpacing: "0.3px",
                    boxShadow: "0 4px 16px rgba(124,58,237,0.35)",
                    transition: "opacity 0.2s, transform 0.15s",
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  Submit Dining Room Request
                </button>
              </form>
            </div>
          ) : (
            <div
              style={{
                ...glass,
                padding: "24px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <Eye
                style={{
                  width: "20px",
                  height: "20px",
                  color: "#64748b",
                  flexShrink: 0,
                }}
              />
              <div>
                <div
                  style={{
                    color: "#f1f5f9",
                    fontWeight: 600,
                    fontSize: "14px",
                  }}
                >
                  View-Only Access
                </div>
                <div
                  style={{
                    color: "#64748b",
                    fontSize: "13px",
                    marginTop: "3px",
                  }}
                >
                  You can view the dining room booking schedule.
                </div>
              </div>
            </div>
          )}

          {/* Booking List */}
          <div style={{ ...glass, padding: "24px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "16px",
              }}
            >
              <UtensilsCrossed
                style={{ width: "16px", height: "16px", color: "#a78bfa" }}
              />
              <h3
                style={{
                  color: "#f1f5f9",
                  fontWeight: 700,
                  fontSize: "15px",
                  margin: 0,
                }}
              >
                Dining Bookings
              </h3>
            </div>

            {/* Sub-tabs */}
            <div
              style={{
                display: "flex",
                gap: "6px",
                marginBottom: "16px",
                background: "rgba(255,255,255,0.05)",
                borderRadius: "8px",
                padding: "4px",
              }}
            >
              <button
                type="button"
                data-ocid="facility-booking.dining.today.tab"
                onClick={() => setSubTab("today")}
                style={{
                  flex: 1,
                  padding: "7px 12px",
                  borderRadius: "6px",
                  border: "none",
                  background:
                    subTab === "today"
                      ? "linear-gradient(135deg, #7c3aed, #a855f7)"
                      : "transparent",
                  color: subTab === "today" ? "white" : "#94a3b8",
                  fontWeight: 600,
                  fontSize: "12px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "background 0.2s, color 0.2s",
                }}
              >
                Today
              </button>
              <button
                type="button"
                data-ocid="facility-booking.dining.upcoming.tab"
                onClick={() => setSubTab("upcoming")}
                style={{
                  flex: 1,
                  padding: "7px 12px",
                  borderRadius: "6px",
                  border: "none",
                  background:
                    subTab === "upcoming"
                      ? "linear-gradient(135deg, #7c3aed, #a855f7)"
                      : "transparent",
                  color: subTab === "upcoming" ? "white" : "#94a3b8",
                  fontWeight: 600,
                  fontSize: "12px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "background 0.2s, color 0.2s",
                }}
              >
                Upcoming
              </button>
              {/* MODULE 7: History tab */}
              <button
                type="button"
                data-ocid="facility-booking.dining.history.tab"
                onClick={() => setSubTab("history")}
                style={{
                  flex: 1,
                  padding: "7px 12px",
                  borderRadius: "6px",
                  border: "none",
                  background:
                    subTab === "history"
                      ? "linear-gradient(135deg, #7c3aed, #a855f7)"
                      : "transparent",
                  color: subTab === "history" ? "white" : "#94a3b8",
                  fontWeight: 600,
                  fontSize: "12px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "background 0.2s, color 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  justifyContent: "center",
                }}
              >
                <History style={{ width: "11px", height: "11px" }} />
                History
              </button>
            </div>

            {/* MODULE 7: History search input */}
            {subTab === "history" && (
              <div style={{ marginBottom: "12px" }}>
                <label
                  htmlFor="dr-history-search"
                  style={{ ...labelStyle, marginBottom: "6px" }}
                >
                  Enter your name to view your bookings:
                </label>
                <input
                  id="dr-history-search"
                  data-ocid="facility-booking.dining.history.search_input"
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Type organizer name…"
                  style={inputStyle}
                />
              </div>
            )}

            {subTab === "history" && !historySearch.trim() ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "32px 16px",
                  color: "#475569",
                  fontSize: "13px",
                }}
              >
                Enter your name above to see your booking history.
              </div>
            ) : visibleBookings.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "32px 16px",
                  color: "#475569",
                }}
              >
                <UtensilsCrossed
                  style={{
                    width: "32px",
                    height: "32px",
                    color: "#334155",
                    margin: "0 auto 10px",
                  }}
                />
                <div style={{ fontSize: "13px" }}>
                  No {subTab} dining bookings.
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {visibleBookings.map((b, idx) => (
                  <div
                    key={b.id}
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      borderRadius: "10px",
                      padding: "14px",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "8px",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            flexWrap: "wrap",
                          }}
                        >
                          <span
                            style={{
                              color: "#c4b5fd",
                              fontWeight: 700,
                              fontSize: "13px",
                            }}
                          >
                            {b.room}
                          </span>
                          {b.eventType && (
                            <span
                              style={{
                                color: "#94a3b8",
                                fontSize: "11px",
                                background: "rgba(124,58,237,0.15)",
                                padding: "2px 8px",
                                borderRadius: "12px",
                              }}
                            >
                              {b.eventType}
                            </span>
                          )}
                          <span style={statusBadge(b.status)}>{b.status}</span>
                          {/* MODULE 5: Priority badge */}
                          {b.status === "Pending" &&
                            pendingPriorityMap[b.id] && (
                              <span
                                style={{
                                  display: "inline-block",
                                  padding: "2px 7px",
                                  borderRadius: "10px",
                                  fontSize: "10px",
                                  fontWeight: 700,
                                  background: "rgba(245,158,11,0.15)",
                                  color: "#fcd34d",
                                  border: "1px solid rgba(245,158,11,0.3)",
                                }}
                              >
                                Priority #{pendingPriorityMap[b.id]}
                              </span>
                            )}
                        </div>
                        <div
                          style={{
                            color: "#64748b",
                            fontSize: "12px",
                            marginTop: "4px",
                          }}
                        >
                          📅 {b.date} · ⏰ {b.startTime}–{b.endTime}
                          {b.numGuests ? ` · 👥 ${b.numGuests} guests` : ""}
                        </div>
                        <div style={{ color: "#64748b", fontSize: "12px" }}>
                          👤 {b.organizerName} · 📞 {b.contact}
                        </div>
                        {(b.designation || b.bookingPurpose) && (
                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              flexWrap: "wrap",
                              marginTop: "4px",
                            }}
                          >
                            {b.designation && (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  background: "rgba(124,58,237,0.08)",
                                  border: "1px solid rgba(124,58,237,0.2)",
                                  borderRadius: "6px",
                                  padding: "2px 8px",
                                  fontSize: "10px",
                                  color: "#c4b5fd",
                                  fontWeight: 600,
                                }}
                              >
                                🏷️ {b.designation}
                              </span>
                            )}
                            {b.bookingPurpose && (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  background: "rgba(167,139,250,0.08)",
                                  border: "1px solid rgba(167,139,250,0.2)",
                                  borderRadius: "6px",
                                  padding: "2px 8px",
                                  fontSize: "10px",
                                  color: "#a78bfa",
                                  fontWeight: 600,
                                }}
                              >
                                📋 {b.bookingPurpose}
                              </span>
                            )}
                          </div>
                        )}
                        {b.notes && (
                          <div
                            style={{
                              color: "#475569",
                              fontSize: "11px",
                              marginTop: "3px",
                              fontStyle: "italic",
                            }}
                          >
                            "{b.notes}"
                          </div>
                        )}
                        <div
                          style={{
                            color: "#374151",
                            fontSize: "10px",
                            marginTop: "3px",
                          }}
                        >
                          ID: {b.id}
                        </div>
                      </div>
                    </div>

                    {(canApproveReject(role) || canDelete(role)) && (
                      <div
                        style={{
                          display: "flex",
                          gap: "6px",
                          marginTop: "10px",
                          flexWrap: "wrap",
                        }}
                      >
                        {canApproveReject(role) && b.status === "Pending" && (
                          <>
                            <button
                              type="button"
                              data-ocid={`facility-booking.dining.approve.button.${idx + 1}`}
                              onClick={() => updateStatus(b.id, "Approved")}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "5px 12px",
                                borderRadius: "6px",
                                border: "none",
                                background: "rgba(5,150,105,0.2)",
                                color: "#6ee7b7",
                                fontSize: "11px",
                                fontWeight: 700,
                                cursor: "pointer",
                                fontFamily: "inherit",
                              }}
                            >
                              <CheckCircle
                                style={{ width: "12px", height: "12px" }}
                              />{" "}
                              Approve
                            </button>
                            <button
                              type="button"
                              data-ocid={`facility-booking.dining.reject.button.${idx + 1}`}
                              onClick={() => updateStatus(b.id, "Cancelled")}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "5px 12px",
                                borderRadius: "6px",
                                border: "none",
                                background: "rgba(220,38,38,0.2)",
                                color: "#fca5a5",
                                fontSize: "11px",
                                fontWeight: 700,
                                cursor: "pointer",
                                fontFamily: "inherit",
                              }}
                            >
                              <XCircle
                                style={{ width: "12px", height: "12px" }}
                              />{" "}
                              Reject
                            </button>
                          </>
                        )}
                        {canApproveReject(role) && b.status === "Approved" && (
                          <button
                            type="button"
                            onClick={() => updateStatus(b.id, "Completed")}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "5px 12px",
                              borderRadius: "6px",
                              border: "none",
                              background: "rgba(59,130,246,0.2)",
                              color: "#93c5fd",
                              fontSize: "11px",
                              fontWeight: 700,
                              cursor: "pointer",
                              fontFamily: "inherit",
                            }}
                          >
                            <CheckCircle
                              style={{ width: "12px", height: "12px" }}
                            />{" "}
                            Mark Complete
                          </button>
                        )}
                        {canEdit(role) && (
                          <button
                            type="button"
                            onClick={() => {
                              /* edit placeholder */
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "5px 12px",
                              borderRadius: "6px",
                              border: "1px solid rgba(255,255,255,0.15)",
                              background: "transparent",
                              color: "#94a3b8",
                              fontSize: "11px",
                              fontWeight: 700,
                              cursor: "pointer",
                              fontFamily: "inherit",
                            }}
                          >
                            <Edit3 style={{ width: "12px", height: "12px" }} />{" "}
                            Edit
                          </button>
                        )}
                        {canDelete(role) && (
                          <button
                            type="button"
                            data-ocid={`facility-booking.dining.delete.button.${idx + 1}`}
                            onClick={() => deleteBooking(b.id)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "5px 12px",
                              borderRadius: "6px",
                              border: "none",
                              background: "rgba(220,38,38,0.15)",
                              color: "#fca5a5",
                              fontSize: "11px",
                              fontWeight: 700,
                              cursor: "pointer",
                              fontFamily: "inherit",
                            }}
                          >
                            <Trash2 style={{ width: "12px", height: "12px" }} />{" "}
                            Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Calendar + Daily Schedule */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            position: "sticky",
            top: "80px",
          }}
        >
          <div style={{ ...glass, padding: "20px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "16px",
              }}
            >
              <Calendar
                style={{ width: "16px", height: "16px", color: "#a78bfa" }}
              />
              <h3
                style={{
                  color: "#f1f5f9",
                  fontWeight: 700,
                  fontSize: "14px",
                  margin: 0,
                }}
              >
                Monthly Overview
              </h3>
            </div>
            <DiningCalendar
              bookings={bookings}
              onDateSelect={setSelectedCalDate}
              selectedDate={selectedCalDate}
            />
          </div>

          {/* Daily Schedule */}
          <div style={{ ...glass, padding: "20px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "12px",
              }}
            >
              <Clock
                style={{ width: "15px", height: "15px", color: "#a78bfa" }}
              />
              <h3
                style={{
                  color: "#f1f5f9",
                  fontWeight: 700,
                  fontSize: "13px",
                  margin: 0,
                }}
              >
                {selectedCalDate
                  ? `Schedule: ${selectedCalDate}`
                  : "Daily Schedule"}
              </h3>
            </div>
            {!selectedCalDate ? (
              <div style={{ color: "#475569", fontSize: "12px" }}>
                Click a date on the calendar to see the schedule.
              </div>
            ) : selectedDateBookings.length === 0 ? (
              <div style={{ color: "#475569", fontSize: "12px" }}>
                No events scheduled.
              </div>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                {selectedDateBookings.map((b) => (
                  <div
                    key={b.id}
                    style={{
                      background: "rgba(124,58,237,0.08)",
                      borderLeft: "3px solid #7c3aed",
                      borderRadius: "0 6px 6px 0",
                      padding: "8px 10px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "4px",
                      }}
                    >
                      <span
                        style={{
                          color: "#c4b5fd",
                          fontWeight: 700,
                          fontSize: "12px",
                        }}
                      >
                        {b.room}
                      </span>
                      <span style={statusBadge(b.status)}>{b.status}</span>
                    </div>
                    <div
                      style={{
                        color: "#94a3b8",
                        fontSize: "11px",
                        marginTop: "2px",
                      }}
                    >
                      {b.eventType} · {b.startTime}–{b.endTime}
                    </div>
                    {b.numGuests && (
                      <div style={{ color: "#64748b", fontSize: "11px" }}>
                        👥 {b.numGuests} guests
                      </div>
                    )}
                    <div style={{ color: "#64748b", fontSize: "11px" }}>
                      👤 {b.organizerName}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Dining-specific calendar (with date selection callback) ─────────────────────
interface DiningCalendarProps {
  bookings: Booking[];
  onDateSelect: (date: string | null) => void;
  selectedDate: string | null;
}

function DiningCalendar({
  bookings,
  onDateSelect,
  selectedDate,
}: DiningCalendarProps) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const monthBookings = bookings.filter((b) => {
    const [y, m] = b.date.split("-").map(Number);
    return y === year && m - 1 === month;
  });
  const bookedDates = new Set(monthBookings.map((b) => b.date));

  const goToPrevMonth = () => {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else setMonth((m) => m - 1);
    onDateSelect(null);
  };
  const goToNextMonth = () => {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else setMonth((m) => m + 1);
    onDateSelect(null);
  };

  const cells: { key: string; day: number | null }[] = [];
  for (let i = 0; i < firstDay; i++)
    cells.push({ key: `dining-${year}-${month}-pad-${i}`, day: null });
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ key: `dining-${year}-${month}-${d}`, day: d });

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "14px",
        }}
      >
        <button
          type="button"
          data-ocid="facility-booking.dining.calendar.prev"
          onClick={goToPrevMonth}
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "8px",
            color: "#e2e8f0",
            cursor: "pointer",
            padding: "5px 8px",
            display: "flex",
            alignItems: "center",
          }}
          aria-label="Previous month"
        >
          <ChevronLeft style={{ width: "13px", height: "13px" }} />
        </button>
        <span style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "13px" }}>
          {MONTH_NAMES[month]} {year}
        </span>
        <button
          type="button"
          data-ocid="facility-booking.dining.calendar.next"
          onClick={goToNextMonth}
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "8px",
            color: "#e2e8f0",
            cursor: "pointer",
            padding: "5px 8px",
            display: "flex",
            alignItems: "center",
          }}
          aria-label="Next month"
        >
          <ChevronRight style={{ width: "13px", height: "13px" }} />
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "2px",
          marginBottom: "4px",
        }}
      >
        {DAY_NAMES.map((d) => (
          <div
            key={d}
            style={{
              textAlign: "center",
              color: "#64748b",
              fontSize: "10px",
              fontWeight: 700,
              padding: "3px 0",
            }}
          >
            {d}
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "2px",
        }}
      >
        {cells.map(({ key, day }) => {
          if (day === null) return <div key={key} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const hasBookings = bookedDates.has(dateStr);
          const isToday = dateStr === todayStr();
          const isSelected = dateStr === selectedDate;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onDateSelect(isSelected ? null : dateStr)}
              style={{
                padding: "5px 2px",
                borderRadius: "5px",
                border: isSelected
                  ? "2px solid #a78bfa"
                  : "1px solid transparent",
                background: isSelected
                  ? "rgba(124,58,237,0.3)"
                  : isToday
                    ? "rgba(167,139,250,0.1)"
                    : "transparent",
                color: isToday ? "#c4b5fd" : "#cbd5e1",
                cursor: "pointer",
                fontSize: "11px",
                fontWeight: hasBookings || isToday ? 700 : 400,
                textAlign: "center",
                position: "relative",
              }}
            >
              {day}
              {hasBookings && (
                <span
                  style={{
                    position: "absolute",
                    bottom: "1px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "4px",
                    height: "4px",
                    borderRadius: "50%",
                    background: "#a78bfa",
                    display: "block",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main FacilityBookingSection ─────────────────────────────────────────────────
export function FacilityBookingSection() {
  const [activePanel, setActivePanel] = useState<ActivePanel>("conference");
  const [demoRole, setDemoRole] = useState<DemoRole>("Manager");

  const roleColors: Record<DemoRole, string> = {
    "Super Admin": "#f59e0b",
    Admin: "#3b82f6",
    Manager: "#8b5cf6",
    Supervisor: "#10b981",
    Staff: "#64748b",
  };

  return (
    <section
      data-ocid="facility-booking.section"
      style={{
        width: "100%",
        background:
          "linear-gradient(160deg, #070d1a 0%, #0a1628 40%, #0f1e38 70%, #0a1020 100%)",
        borderTop: "1px solid rgba(59,130,246,0.2)",
        paddingBottom: "64px",
        marginTop: 0,
      }}
    >
      {/* Subtle background texture */}
      <div style={{ position: "relative" }}>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              "radial-gradient(ellipse at 20% 0%, rgba(59,130,246,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 0%, rgba(124,58,237,0.06) 0%, transparent 60%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px" }}
        >
          {/* ─── Section Header ───────────────────────────────────────────────── */}
          <div
            style={{
              paddingTop: "64px",
              textAlign: "center",
              marginBottom: "40px",
              position: "relative",
            }}
          >
            {/* Top rule */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "16px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  flex: 1,
                  height: "1px",
                  background:
                    "linear-gradient(90deg, transparent, rgba(59,130,246,0.3))",
                }}
              />
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "7px 22px",
                  borderRadius: "50px",
                  background: "rgba(59,130,246,0.1)",
                  border: "1px solid rgba(59,130,246,0.25)",
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "#3b82f6",
                    display: "inline-block",
                    boxShadow: "0 0 8px rgba(59,130,246,0.6)",
                  }}
                />
                <span
                  style={{
                    color: "#93c5fd",
                    fontWeight: 700,
                    fontSize: "11px",
                    letterSpacing: "1.2px",
                    textTransform: "uppercase",
                  }}
                >
                  Enterprise Module
                </span>
              </div>
              <div
                style={{
                  flex: 1,
                  height: "1px",
                  background:
                    "linear-gradient(90deg, rgba(59,130,246,0.3), transparent)",
                }}
              />
            </div>

            <h2
              style={{
                fontSize: "clamp(26px, 3.5vw, 40px)",
                fontWeight: 900,
                color: "#f1f5f9",
                margin: "0 0 12px",
                letterSpacing: "-0.5px",
                lineHeight: 1.1,
              }}
            >
              Facility Booking{" "}
              <span
                style={{
                  background: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Management
              </span>
            </h2>
            <p
              style={{
                color: "#64748b",
                fontSize: "15px",
                maxWidth: "520px",
                margin: "0 auto",
                lineHeight: 1.7,
              }}
            >
              Book conference rooms and dining facilities with real-time
              availability, conflict detection, and role-based approval
              workflows.
            </p>

            {/* Demo role selector */}
            <div
              style={{
                position: "absolute",
                top: "64px",
                right: 0,
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "10px",
                padding: "8px 12px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: roleColors[demoRole],
                    display: "inline-block",
                    boxShadow: `0 0 8px ${roleColors[demoRole]}80`,
                  }}
                />
                <span
                  style={{
                    color: "#64748b",
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.5px",
                  }}
                >
                  VIEWING AS:
                </span>
              </div>
              <select
                data-ocid="facility-booking.role.select"
                value={demoRole}
                onChange={(e) => setDemoRole(e.target.value as DemoRole)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: roleColors[demoRole],
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  outline: "none",
                  fontFamily: "inherit",
                  padding: "2px 4px",
                }}
              >
                {DEMO_ROLES.map((r) => (
                  <option
                    key={r}
                    value={r}
                    style={{ background: "#0f2044", color: "#e2e8f0" }}
                  >
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ─── Role capability summary ──────────────────────────────────────── */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              justifyContent: "center",
              marginBottom: "32px",
            }}
          >
            {[
              { label: "Create Bookings", enabled: true },
              { label: "View All Bookings", enabled: true },
              {
                label: "Approve / Reject",
                enabled: canApproveReject(demoRole),
              },
              { label: "Edit Bookings", enabled: canEdit(demoRole) },
              { label: "Delete Bookings", enabled: canDelete(demoRole) },
            ].map((cap) => (
              <div
                key={cap.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "5px 12px",
                  borderRadius: "20px",
                  background: cap.enabled
                    ? "rgba(5,150,105,0.1)"
                    : "rgba(255,255,255,0.04)",
                  border: `1px solid ${cap.enabled ? "rgba(5,150,105,0.3)" : "rgba(255,255,255,0.08)"}`,
                  fontSize: "11px",
                  fontWeight: 600,
                  color: cap.enabled ? "#6ee7b7" : "#475569",
                }}
              >
                {cap.enabled ? "✓" : "✗"} {cap.label}
              </div>
            ))}
          </div>

          {/* ─── Tab Row ──────────────────────────────────────────────────────── */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              marginBottom: "28px",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              paddingBottom: "0",
            }}
          >
            <button
              type="button"
              data-ocid="facility-booking.conference.tab"
              onClick={() => setActivePanel("conference")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 24px",
                border: "none",
                borderBottom:
                  activePanel === "conference"
                    ? "2px solid #3b82f6"
                    : "2px solid transparent",
                background: "transparent",
                color: activePanel === "conference" ? "#93c5fd" : "#64748b",
                fontWeight: 700,
                fontSize: "14px",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "color 0.2s, border-color 0.2s",
                marginBottom: "-1px",
              }}
            >
              <Building2 style={{ width: "16px", height: "16px" }} />
              Conference Rooms
              <span
                style={{
                  background:
                    activePanel === "conference"
                      ? "rgba(59,130,246,0.2)"
                      : "rgba(255,255,255,0.06)",
                  color: activePanel === "conference" ? "#93c5fd" : "#475569",
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: "12px",
                }}
              >
                {CONFERENCE_ROOMS.length}
              </span>
            </button>

            <button
              type="button"
              data-ocid="facility-booking.dining.tab"
              onClick={() => setActivePanel("dining")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 24px",
                border: "none",
                borderBottom:
                  activePanel === "dining"
                    ? "2px solid #8b5cf6"
                    : "2px solid transparent",
                background: "transparent",
                color: activePanel === "dining" ? "#c4b5fd" : "#64748b",
                fontWeight: 700,
                fontSize: "14px",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "color 0.2s, border-color 0.2s",
                marginBottom: "-1px",
              }}
            >
              <UtensilsCrossed style={{ width: "16px", height: "16px" }} />
              Dining Rooms
              <span
                style={{
                  background:
                    activePanel === "dining"
                      ? "rgba(139,92,246,0.2)"
                      : "rgba(255,255,255,0.06)",
                  color: activePanel === "dining" ? "#c4b5fd" : "#475569",
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: "12px",
                }}
              >
                {DINING_ROOMS.length}
              </span>
            </button>
          </div>

          {/* ─── Active Panel ─────────────────────────────────────────────────── */}
          {activePanel === "conference" ? (
            <ConferenceRoomPanel role={demoRole} />
          ) : (
            <DiningRoomPanel role={demoRole} />
          )}

          {/* ─── Info footer ──────────────────────────────────────────────────── */}
          <div
            style={{
              marginTop: "40px",
              padding: "16px 24px",
              background: "rgba(59,130,246,0.05)",
              border: "1px solid rgba(59,130,246,0.15)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <Users
              style={{
                width: "16px",
                height: "16px",
                color: "#3b82f6",
                flexShrink: 0,
              }}
            />
            <div
              style={{ color: "#475569", fontSize: "12px", lineHeight: 1.5 }}
            >
              <span style={{ color: "#64748b", fontWeight: 600 }}>
                Booking data is stored locally in your browser.{" "}
              </span>
              All bookings require admin-level approval before confirmation.
              Double-booking is automatically prevented per room and time slot.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
