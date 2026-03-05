import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  CheckCircle,
  CheckCircle2,
  ClipboardList,
  Edit,
  Inbox,
  LayoutDashboard,
  Loader2,
  LogOut,
  Mail,
  Phone,
  TrendingUp,
  UserPlus,
  Users,
  UtensilsCrossed,
  XCircle,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ApprovalStatus } from "../backend.d";
import type { BookingRequest } from "../backend.d";
import { AnalyticsCharts } from "../components/dashboard/AnalyticsCharts";
import { QuickActions } from "../components/dashboard/QuickActions";
import { RegistrationRequestsPanel } from "../components/dashboard/RegistrationRequestsPanel";
import { SeedInitializer } from "../components/dashboard/SeedInitializer";
import { StatCards } from "../components/dashboard/StatCards";
import { UpdateRequestsPanel } from "../components/dashboard/UpdateRequestsPanel";
import { UserApprovalPanel } from "../components/dashboard/UserApprovalPanel";
import { StockTable } from "../components/stock/StockTable";
import { useActor } from "../hooks/useActor";
import { useApprovals } from "../hooks/useQueries";
import {
  approveBookingRequestOnBackend,
  fetchAllBookingRequests,
  rejectBookingRequestOnBackend,
} from "../lib/backendBookingApi";
import {
  approveRegistrationOnBackend,
  fetchAllRegistrationRequests,
  rejectRegistrationOnBackend,
} from "../lib/backendRegistrationApi";
import {
  type BookingAnalytics,
  computeBookingAnalytics,
} from "../lib/bookingStore";
import { storeNotification } from "../lib/notificationApi";
import {
  generateTempPassword,
  generateTempUserId,
  getUpdateRequests,
} from "../lib/registrationStore";
import type { RegistrationRequest } from "../lib/registrationStore";

// ─── Booking types (mirrored from FacilityBookingSection) ──────────────────────
type BookingStatus = "Pending" | "Approved" | "Completed" | "Cancelled";

interface FacilityBooking {
  id: string;
  type: "conference" | "dining";
  room: string;
  date: string;
  startTime: string;
  endTime: string;
  eventName: string;
  organizerName: string;
  contact: string;
  notes: string;
  status: BookingStatus;
  createdAt: string;
  eventType?: string;
  numGuests?: number;
}

const LS_CONF = "fbm_conference_bookings";
const LS_DINING = "fbm_dining_bookings";

function loadFacilityBookings(key: string): FacilityBooking[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as FacilityBooking[]) : [];
  } catch {
    return [];
  }
}

function saveFacilityBookings(key: string, bookings: FacilityBooking[]): void {
  localStorage.setItem(key, JSON.stringify(bookings));
}

function appendAuditFacility(bookingId: string, action: string): void {
  try {
    const raw = localStorage.getItem("fbm_audit_log");
    const log: unknown[] = raw ? JSON.parse(raw) : [];
    log.push({
      action,
      userRole: "Admin",
      bookingId,
      details: `Admin: Status changed to ${action}`,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem("fbm_audit_log", JSON.stringify(log));
  } catch {
    /* ignore */
  }
}

// ─── Status badge style (inline, no className) ──────────────────────────────
function statusStyle(status: BookingStatus): React.CSSProperties {
  const base: React.CSSProperties = {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: "20px",
    fontSize: "10px",
    fontWeight: 700,
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

export function AdminDashboardStandalone() {
  const [activeTab, setActiveTab] = useState("overview");
  const approvalsQuery = useApprovals();
  const { actor } = useActor();
  const actorRef = useRef(actor);
  actorRef.current = actor;

  // ─── Registration requests (backend, cross-device) ─────────────────────
  const [allRegistrationRequests, setAllRegistrationRequests] = useState<
    RegistrationRequest[]
  >([]);
  const [regInitialLoading, setRegInitialLoading] = useState(true);

  // Update requests still use localStorage (same-device workflow)
  const [updatePendingCount, setUpdatePendingCount] = useState(
    () => getUpdateRequests().filter((r) => r.status === "pending").length,
  );

  // MODULE 4/6: Booking pending count — polls both facility booking collections
  const [_pendingBookingsCount, setPendingBookingsCount] = useState(0);
  const [confBookings, setConfBookings] = useState<FacilityBooking[]>([]);
  const [diningBookings, setDiningBookings] = useState<FacilityBooking[]>([]);
  const [bookingAnalytics, setBookingAnalytics] = useState<BookingAnalytics>(
    () => computeBookingAnalytics(),
  );
  // Backend booking requests — cross-device real-time source of truth
  const [backendBookings, setBackendBookings] = useState<BookingRequest[]>([]);
  // Loading state for unified pending requests section
  const [pendingRequestsLoading, setPendingRequestsLoading] = useState(true);
  // Track which requests are being processed
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const refreshFacilityBookings = useCallback(() => {
    const conf = loadFacilityBookings(LS_CONF);
    const dining = loadFacilityBookings(LS_DINING);
    setConfBookings(conf);
    setDiningBookings(dining);
    setPendingBookingsCount(
      [...conf, ...dining].filter((b) => b.status === "Pending").length,
    );
    setBookingAnalytics(computeBookingAnalytics());
    // Fetch from backend canister for cross-device sync
    const currentActor = actorRef.current;
    if (currentActor) {
      fetchAllBookingRequests(currentActor)
        .then((reqs) => {
          setBackendBookings(reqs);
          setPendingRequestsLoading(false);
        })
        .catch(() => {
          setPendingRequestsLoading(false);
        });
    }
  }, []);

  // ─── Master refresh — fetches BOTH registrations AND bookings ──────────
  const refreshAllPendingData = useCallback(async () => {
    const currentActor = actorRef.current;
    if (!currentActor) return;

    // Fetch both in parallel for speed
    const [reqs, bookings] = await Promise.all([
      fetchAllRegistrationRequests(currentActor).catch(() => null),
      fetchAllBookingRequests(currentActor).catch(() => null),
    ]);

    if (reqs !== null) {
      setAllRegistrationRequests(reqs);
      setRegInitialLoading(false);
    }
    if (bookings !== null) {
      setBackendBookings(bookings);
      setPendingRequestsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const refreshUpdate = () => {
      setUpdatePendingCount(
        getUpdateRequests().filter((r) => r.status === "pending").length,
      );
    };

    const refresh = async () => {
      if (cancelled) return;
      const currentActor = actorRef.current;
      if (!currentActor) return;
      try {
        const [reqs, bookings] = await Promise.all([
          fetchAllRegistrationRequests(currentActor).catch(() => null),
          fetchAllBookingRequests(currentActor).catch(() => null),
        ]);
        if (cancelled) return;
        if (reqs !== null) {
          setAllRegistrationRequests(reqs);
          setRegInitialLoading(false);
        }
        if (bookings !== null) {
          setBackendBookings(bookings);
          setPendingRequestsLoading(false);
        }
        const conf = loadFacilityBookings(LS_CONF);
        const dining = loadFacilityBookings(LS_DINING);
        setConfBookings(conf);
        setDiningBookings(dining);
        setPendingBookingsCount(
          [...conf, ...dining].filter((b) => b.status === "Pending").length,
        );
        setBookingAnalytics(computeBookingAnalytics());
      } catch {
        // silently ignore
      }
    };

    refresh();
    refreshUpdate();
    refreshFacilityBookings();

    // Poll every 3 seconds for near-real-time badge updates
    const interval = setInterval(() => {
      refresh();
      refreshUpdate();
      refreshFacilityBookings();
    }, 3_000);

    // Refresh badge when admin tab regains focus
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        refresh();
        refreshUpdate();
        refreshFacilityBookings();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    const onFocus = () => {
      refresh();
      refreshUpdate();
      refreshFacilityBookings();
    };
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
    };
  }, [refreshFacilityBookings]);

  // Also refetch when actor first becomes available
  useEffect(() => {
    if (!actor) return;
    refreshAllPendingData().catch(() => {});
  }, [actor, refreshAllPendingData]);

  const regPendingCount = allRegistrationRequests.filter(
    (r) => r.status === "pending",
  ).length;

  const pendingCount =
    (approvalsQuery.data?.filter((a) => a.status === ApprovalStatus.pending)
      .length ?? 0) +
    regPendingCount +
    updatePendingCount;

  // Backend bookings pending count (cross-device source of truth)
  const pendingBackendBookingsCount = backendBookings.filter(
    (b) => b.status === "pending",
  ).length;

  // ─── Total ALL pending count for notification bell ──────────────────────
  const totalAllPendingCount = regPendingCount + pendingBackendBookingsCount;

  // ─── Unified pending requests for the new "Pending Requests" tab ────────
  const pendingRegistrations = allRegistrationRequests.filter(
    (r) => r.status === "pending",
  );
  const pendingBookingRequests = backendBookings
    .filter((b) => b.status === "pending")
    .sort((a, b) => {
      if (a.createdAt < b.createdAt) return -1;
      if (a.createdAt > b.createdAt) return 1;
      return 0;
    });

  // ─── Handlers for unified pending requests ──────────────────────────────
  const handleApproveRegistration = async (req: RegistrationRequest) => {
    if (!actor) {
      toast.error("Connection not ready. Please try again.");
      return;
    }
    if (processingIds.has(req.id)) return;

    const tempUserId = generateTempUserId();
    const tempPassword = generateTempPassword();

    setProcessingIds((prev) => new Set([...prev, req.id]));
    try {
      await approveRegistrationOnBackend(
        actor,
        req.id,
        tempUserId,
        tempPassword,
      );

      // Store notification for user
      const approvalMessage = `Dear ${req.name} (${req.role}),

We are delighted to inform you that your registration request has been reviewed and APPROVED by the Application Administration Team of the EBC Corporate Management System.

Welcome to the EBC Stock Management Tracker — our enterprise-grade Corporate Conference and Facility Management Platform. You are now an active member of our digital workforce management system.

Your temporary login credentials have been generated and are provided herein. Please use these credentials to access the platform for the first time. You will be required to maintain confidentiality of your login information at all times.

As a registered user, you are expected to:
• Adhere strictly to the operational protocols and guidelines of the organization.
• Use the system responsibly and only for authorized corporate purposes.
• Report any discrepancies or unauthorized access immediately to the IT Administration.
• Maintain professional discipline in all system interactions.
• Comply with all data security, audit, and compliance requirements.

We trust that you will be a responsible and accountable member of our system. Your participation contributes to an organized and efficient corporate environment.

Best Regards,
Application Administration Team
EBC Stock Management Tracker
Corporate IT Division`;

      const recipientKey = req.email || req.mobile;
      if (recipientKey) {
        storeNotification(
          actor,
          recipientKey,
          "registration_approved",
          "Welcome to Corporate IT System — Registration Approved",
          approvalMessage,
          tempUserId,
          tempPassword,
        ).catch(() => {});
      }
      storeNotification(
        actor,
        tempUserId,
        "registration_approved",
        "Welcome to Corporate IT System — Registration Approved",
        approvalMessage,
        tempUserId,
        tempPassword,
      ).catch(() => {});

      toast.success(`Registration approved — User ID: ${tempUserId}`);
      await refreshAllPendingData();
    } catch {
      toast.error("Failed to approve registration. Please try again.");
    } finally {
      setProcessingIds((prev) => {
        const s = new Set(prev);
        s.delete(req.id);
        return s;
      });
    }
  };

  const handleRejectRegistration = async (req: RegistrationRequest) => {
    if (!actor) {
      toast.error("Connection not ready. Please try again.");
      return;
    }
    if (processingIds.has(req.id)) return;

    setProcessingIds((prev) => new Set([...prev, req.id]));
    try {
      await rejectRegistrationOnBackend(actor, req.id);

      const rejectionMessage = `Dear ${req.name},

We regret to inform you that your Registration Request for the EBC Stock Management Tracker has been reviewed by the Application Administration Team and could not be approved at this time.

This decision has been made in accordance with our established corporate registration protocols and access management policies. We appreciate your interest in joining our platform.

If you wish to resubmit your registration, please ensure:
• All submitted information is accurate and complete.
• Your registration is submitted through the correct organizational channel.
• Contact your department head or IT administration for further guidance.
• Resubmit with any required additional documentation or corrections.

Best Regards,
Application Administration Team
EBC Stock Management Tracker
Corporate IT Division`;

      const recipientKey = req.email || req.mobile;
      if (recipientKey) {
        storeNotification(
          actor,
          recipientKey,
          "registration_rejected",
          "Registration Request — Not Approved",
          rejectionMessage,
        ).catch(() => {});
      }

      toast.error("Registration request rejected.");
      await refreshAllPendingData();
    } catch {
      toast.error("Failed to reject registration. Please try again.");
    } finally {
      setProcessingIds((prev) => {
        const s = new Set(prev);
        s.delete(req.id);
        return s;
      });
    }
  };

  const handleApproveBooking = async (b: BookingRequest) => {
    if (!actor) {
      toast.error("Connection not ready. Please try again.");
      return;
    }
    if (processingIds.has(b.id)) return;

    setProcessingIds((prev) => new Set([...prev, b.id]));
    try {
      await approveBookingRequestOnBackend(actor, b.id);

      // Sync to localStorage too
      const lsKey = b.bookingType === "conference" ? LS_CONF : LS_DINING;
      const lsBookings = loadFacilityBookings(lsKey);
      saveFacilityBookings(
        lsKey,
        lsBookings.map((lb) =>
          lb.id === b.id ? { ...lb, status: "Approved" as BookingStatus } : lb,
        ),
      );

      const approvalMsg = `Dear ${b.organizerName},

We are pleased to inform you that your Conference Room / Dining Room Booking Request has been reviewed and officially APPROVED by the Corporate Facility Management Administration.

Your reservation for ${b.room} has been confirmed for ${b.date} from ${b.startTime} to ${b.endTime}.

Please ensure that all participants are informed of the confirmed schedule. We request you to adhere to the following corporate guidelines during the utilization of this facility:

• Arrive on time and ensure the room is vacated promptly after your scheduled session.
• Maintain cleanliness, order, and professional decorum at all times.
• Any additional requirements must be coordinated with the Facility Management Team in advance.
• Unauthorized use of reserved rooms or misuse of facilities is strictly prohibited.
• Cancellations or rescheduling must be requested through official channels at least 24 hours in advance.

We appreciate your compliance with our operational procedures and your dedication to maintaining a disciplined corporate environment.

Thank you for using the EBC Corporate Facility Management System.

Best Regards,
Corporate Facility Management Team
EBC Stock Management Tracker
IT Division`;

      storeNotification(
        actor,
        b.organizerName,
        "booking_approved",
        "Booking Successfully Confirmed",
        approvalMsg,
      ).catch(() => {});

      toast.success(`Booking for ${b.room} approved.`);
      await refreshAllPendingData();
      refreshFacilityBookings();
    } catch {
      toast.error("Failed to approve booking. Please try again.");
    } finally {
      setProcessingIds((prev) => {
        const s = new Set(prev);
        s.delete(b.id);
        return s;
      });
    }
  };

  const handleRejectBooking = async (b: BookingRequest) => {
    if (!actor) {
      toast.error("Connection not ready. Please try again.");
      return;
    }
    if (processingIds.has(b.id)) return;

    setProcessingIds((prev) => new Set([...prev, b.id]));
    try {
      await rejectBookingRequestOnBackend(actor, b.id);

      // Sync to localStorage too
      const lsKey = b.bookingType === "conference" ? LS_CONF : LS_DINING;
      const lsBookings = loadFacilityBookings(lsKey);
      saveFacilityBookings(
        lsKey,
        lsBookings.map((lb) =>
          lb.id === b.id ? { ...lb, status: "Cancelled" as BookingStatus } : lb,
        ),
      );

      const rejectionMsg = `Dear ${b.organizerName},

We regret to inform you that your Facility Booking Request for ${b.room} on ${b.date} has been reviewed and could not be approved at this time by the Corporate Facility Management Administration.

The decision to decline this request has been made in accordance with our established facility management protocols and scheduling priorities.

We strongly encourage you to review the Facility Booking Guidelines before submitting a new request. Please ensure that:

• All booking requests are submitted with complete and accurate information.
• The requested time slots do not conflict with pre-existing reservations.
• Requests are submitted at least 48 hours prior to the intended date.
• All requests must include a valid event name, organizer contact, and department details.

You are welcome to resubmit your booking request with the required corrections. Our Facility Management Team remains available to assist you.

Best Regards,
Corporate Facility Management Team
EBC Stock Management Tracker
IT Division`;

      storeNotification(
        actor,
        b.organizerName,
        "booking_rejected",
        "Booking Request Not Approved",
        rejectionMsg,
      ).catch(() => {});

      toast.error(`Booking for ${b.room} rejected.`);
      await refreshAllPendingData();
      refreshFacilityBookings();
    } catch {
      toast.error("Failed to reject booking. Please try again.");
    } finally {
      setProcessingIds((prev) => {
        const s = new Set(prev);
        s.delete(b.id);
        return s;
      });
    }
  };

  const handleLogout = () => {
    window.location.hash = "";
  };

  // AUTO-LOGOUT: 30 minutes of inactivity
  useEffect(() => {
    const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
    let timer: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        window.location.hash = "";
      }, TIMEOUT_MS);
    };

    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
    ] as const;

    for (const e of events) {
      window.addEventListener(e, resetTimer, { passive: true });
    }

    resetTimer(); // Start the timer immediately

    return () => {
      clearTimeout(timer);
      for (const e of events) {
        window.removeEventListener(e, resetTimer);
      }
    };
  }, []);

  // MODULE 4: Update booking status from admin panel
  const updateBookingStatus = (
    id: string,
    status: BookingStatus,
    type: "conference" | "dining",
  ) => {
    const key = type === "conference" ? LS_CONF : LS_DINING;
    const current = loadFacilityBookings(key);
    const updated = current.map((b) => (b.id === id ? { ...b, status } : b));
    saveFacilityBookings(key, updated);
    appendAuditFacility(id, status);
    refreshFacilityBookings();
  };

  // MODULE 5: Combined priority-sorted pending bookings
  const allPendingBookings = [...confBookings, ...diningBookings]
    .filter((b) => b.status === "Pending")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return (
    <div className="min-h-screen bg-background">
      <SeedInitializer />

      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/assets/generated/conferstock-logo-transparent.dim_120x120.png"
              alt="EBC"
              className="w-8 h-8"
            />
            <span className="font-display font-bold text-foreground text-base">
              EBC Stock Management Tracker
            </span>
            <Badge className="bg-primary/10 text-primary border-primary/30 text-xs">
              Application Admin
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {/* Notification bell — shows ALL pending items count */}
            <button
              type="button"
              onClick={() => setActiveTab("pending-requests")}
              data-ocid="admin-standalone.notifications.button"
              className="relative flex items-center justify-center w-9 h-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Pending Approval Requests"
            >
              <Bell className="w-4 h-4" />
              {totalAllPendingCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-warning text-warning-foreground text-[9px] font-bold flex items-center justify-center">
                  {totalAllPendingCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              data-ocid="admin-standalone.logout.button"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-muted"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <h1 className="font-display text-2xl font-bold text-foreground">
            Admin Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage stock, rooms, items, and user access
          </p>
        </motion.div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <div className="overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0">
            <TabsList className="bg-muted/50 border border-border/60 h-10 gap-0.5 w-full sm:w-auto">
              <TabsTrigger
                value="overview"
                className="gap-1.5 text-xs data-[state=active]:shadow-none"
                data-ocid="admin-standalone.overview.tab"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              {/* ─── NEW: Unified Pending Requests Tab ─── */}
              <TabsTrigger
                value="pending-requests"
                className="gap-1.5 text-xs data-[state=active]:shadow-none"
                data-ocid="admin-standalone.pending-requests.tab"
              >
                <Inbox className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Pending Requests</span>
                {totalAllPendingCount > 0 && (
                  <Badge className="h-4 px-1 text-[10px] bg-warning text-warning-foreground">
                    {totalAllPendingCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="gap-1.5 text-xs data-[state=active]:shadow-none"
                data-ocid="admin-standalone.analytics.tab"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
              {/* MODULE 4: New Bookings tab */}
              <TabsTrigger
                value="bookings"
                className="gap-1.5 text-xs data-[state=active]:shadow-none"
                data-ocid="admin-standalone.bookings.tab"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Bookings</span>
                {pendingBackendBookingsCount > 0 && (
                  <Badge className="h-4 px-1 text-[10px] bg-warning text-warning-foreground">
                    {pendingBackendBookingsCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="approvals"
                className="gap-1.5 text-xs data-[state=active]:shadow-none"
                data-ocid="admin-standalone.approvals.tab"
              >
                <Users className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Approvals</span>
                {pendingCount > 0 && (
                  <Badge className="h-4 px-1 text-[10px] bg-warning text-warning-foreground">
                    {pendingCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="registrations"
                className="gap-1.5 text-xs data-[state=active]:shadow-none"
                data-ocid="admin-standalone.registrations.tab"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Registrations</span>
                {regPendingCount > 0 && (
                  <Badge className="h-4 px-1 text-[10px] bg-warning text-warning-foreground">
                    {regPendingCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="update-requests"
                className="gap-1.5 text-xs data-[state=active]:shadow-none"
                data-ocid="admin-standalone.update-requests.tab"
              >
                <Edit className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Update Requests</span>
                {updatePendingCount > 0 && (
                  <Badge className="h-4 px-1 text-[10px] bg-warning text-warning-foreground">
                    {updatePendingCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="stock"
                className="gap-1.5 text-xs data-[state=active]:shadow-none"
                data-ocid="admin-standalone.stock.tab"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Stock Tracker</span>
              </TabsTrigger>
              <TabsTrigger
                value="actions"
                className="gap-1.5 text-xs data-[state=active]:shadow-none"
                data-ocid="admin-standalone.actions.tab"
              >
                <Zap className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Quick Actions</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-6 mt-0">
            <StatCards />
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <h2 className="font-display text-base font-semibold text-foreground mb-4">
                    Quick Actions
                  </h2>
                  <QuickActions />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-base font-semibold text-foreground">
                    Pending Access
                  </h2>
                  {pendingCount > 0 && (
                    <Badge className="bg-warning/10 text-warning border-warning/30">
                      {pendingCount} pending
                    </Badge>
                  )}
                </div>
                <UserApprovalPanel />
              </div>
            </div>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════
              NEW: UNIFIED PENDING REQUESTS FOR APPROVAL TAB
              Shows ALL pending requests (registrations + bookings) from ANY device.
              Real-time polling every 3 seconds.
          ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="pending-requests" className="mt-0">
            <div className="mb-5">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="font-display text-lg font-semibold text-foreground">
                  Pending Requests for Approval
                </h2>
                {totalAllPendingCount > 0 && (
                  <span
                    style={{
                      display: "inline-block",
                      padding: "2px 10px",
                      borderRadius: "12px",
                      fontSize: "12px",
                      fontWeight: 800,
                      background: "rgba(245,158,11,0.15)",
                      color: "#fcd34d",
                      border: "1px solid rgba(245,158,11,0.35)",
                    }}
                  >
                    {totalAllPendingCount} pending
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                All pending registration and room booking requests from any
                device — Approve or Reject in real time.
              </p>
            </div>

            {/* ── Loading state ── */}
            {(regInitialLoading || pendingRequestsLoading) && (
              <div
                data-ocid="admin-standalone.pending-requests.loading_state"
                className="flex items-center justify-center py-16 text-muted-foreground"
              >
                <Loader2 className="w-6 h-6 animate-spin mr-3" />
                <span className="text-sm">
                  Loading pending requests from all devices...
                </span>
              </div>
            )}

            {/* ── Empty state ── */}
            {!regInitialLoading &&
              !pendingRequestsLoading &&
              pendingRegistrations.length === 0 &&
              pendingBookingRequests.length === 0 && (
                <div
                  data-ocid="admin-standalone.pending-requests.empty_state"
                  className="text-center py-16 text-muted-foreground border border-border/60 rounded-xl"
                >
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-semibold text-base">All caught up!</p>
                  <p className="text-sm mt-1 opacity-70">
                    No pending requests at this time. New requests from any
                    device will appear here instantly.
                  </p>
                </div>
              )}

            {/* ── SECTION 1: Pending Registration Requests ── */}
            {!regInitialLoading && pendingRegistrations.length > 0 && (
              <div className="mb-8">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "14px",
                    paddingBottom: "8px",
                    borderBottom: "1px solid rgba(245,158,11,0.2)",
                  }}
                >
                  <UserPlus
                    style={{ width: "15px", height: "15px", color: "#fcd34d" }}
                  />
                  <span
                    style={{
                      color: "#fcd34d",
                      fontWeight: 800,
                      fontSize: "12px",
                      letterSpacing: "0.8px",
                      textTransform: "uppercase",
                    }}
                  >
                    First-Time User Registrations ({pendingRegistrations.length}
                    )
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {pendingRegistrations.map((req, idx) => {
                    const isProcessing = processingIds.has(req.id);
                    return (
                      <motion.div
                        key={req.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        data-ocid={`admin-standalone.pending-requests.item.${idx + 1}`}
                        style={{
                          background: "rgba(255,255,255,0.025)",
                          border: "1px solid rgba(245,158,11,0.15)",
                          borderRadius: "12px",
                          padding: "16px 18px",
                        }}
                      >
                        {/* Header row */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            flexWrap: "wrap",
                            gap: "8px",
                            marginBottom: "10px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              flexWrap: "wrap",
                            }}
                          >
                            {/* Type badge */}
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "3px 10px",
                                borderRadius: "10px",
                                fontSize: "10px",
                                fontWeight: 800,
                                background: "rgba(245,158,11,0.12)",
                                color: "#fcd34d",
                                border: "1px solid rgba(245,158,11,0.28)",
                                letterSpacing: "0.5px",
                              }}
                            >
                              👤 REGISTRATION
                            </span>
                            {/* Status badge */}
                            <span
                              style={{
                                display: "inline-block",
                                padding: "2px 8px",
                                borderRadius: "10px",
                                fontSize: "10px",
                                fontWeight: 700,
                                background: "rgba(217,119,6,0.2)",
                                color: "#fcd34d",
                                border: "1px solid rgba(217,119,6,0.4)",
                              }}
                            >
                              ⏳ Pending
                            </span>
                            {/* Role badge */}
                            <span
                              style={{
                                display: "inline-block",
                                padding: "2px 8px",
                                borderRadius: "10px",
                                fontSize: "10px",
                                fontWeight: 700,
                                background:
                                  req.role === "Manager"
                                    ? "rgba(59,130,246,0.12)"
                                    : "rgba(16,185,129,0.12)",
                                color:
                                  req.role === "Manager"
                                    ? "#93c5fd"
                                    : "#6ee7b7",
                                border:
                                  req.role === "Manager"
                                    ? "1px solid rgba(59,130,246,0.25)"
                                    : "1px solid rgba(16,185,129,0.25)",
                              }}
                            >
                              {req.role === "Manager"
                                ? "💼 Manager"
                                : "📋 Supervisor"}
                            </span>
                          </div>
                          <span style={{ color: "#475569", fontSize: "10px" }}>
                            {new Date(req.submittedAt).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </span>
                        </div>

                        {/* Details */}
                        <div style={{ marginBottom: "12px" }}>
                          <p
                            style={{
                              color: "#e2e8f0",
                              fontWeight: 700,
                              fontSize: "15px",
                              marginBottom: "4px",
                            }}
                          >
                            {req.name}
                          </p>
                          {req.email && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                marginBottom: "2px",
                              }}
                            >
                              <Mail
                                style={{
                                  width: "12px",
                                  height: "12px",
                                  color: "#64748b",
                                }}
                              />
                              <span
                                style={{ color: "#94a3b8", fontSize: "12px" }}
                              >
                                {req.email}
                              </span>
                            </div>
                          )}
                          {req.mobile && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              <Phone
                                style={{
                                  width: "12px",
                                  height: "12px",
                                  color: "#64748b",
                                }}
                              />
                              <span
                                style={{ color: "#94a3b8", fontSize: "12px" }}
                              >
                                {req.mobile}
                              </span>
                            </div>
                          )}
                          {req.id && (
                            <div
                              style={{
                                color: "#475569",
                                fontSize: "10px",
                                marginTop: "4px",
                              }}
                            >
                              Request ID: {req.id}
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            type="button"
                            disabled={isProcessing}
                            data-ocid={`admin-standalone.pending-requests.confirm_button.${idx + 1}`}
                            onClick={() => handleApproveRegistration(req)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "5px",
                              padding: "7px 16px",
                              borderRadius: "7px",
                              border: "1px solid rgba(5,150,105,0.4)",
                              background: isProcessing
                                ? "rgba(5,150,105,0.08)"
                                : "rgba(5,150,105,0.18)",
                              color: isProcessing ? "#475569" : "#6ee7b7",
                              fontSize: "12px",
                              fontWeight: 700,
                              cursor: isProcessing ? "not-allowed" : "pointer",
                              fontFamily: "inherit",
                              transition: "all 0.15s",
                            }}
                          >
                            {isProcessing ? (
                              <Loader2
                                style={{ width: "12px", height: "12px" }}
                                className="animate-spin"
                              />
                            ) : (
                              <CheckCircle
                                style={{ width: "12px", height: "12px" }}
                              />
                            )}
                            {isProcessing ? "Processing..." : "APPROVE"}
                          </button>
                          <button
                            type="button"
                            disabled={isProcessing}
                            data-ocid={`admin-standalone.pending-requests.delete_button.${idx + 1}`}
                            onClick={() => handleRejectRegistration(req)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "5px",
                              padding: "7px 16px",
                              borderRadius: "7px",
                              border: "1px solid rgba(220,38,38,0.4)",
                              background: isProcessing
                                ? "rgba(220,38,38,0.08)"
                                : "rgba(220,38,38,0.18)",
                              color: isProcessing ? "#475569" : "#fca5a5",
                              fontSize: "12px",
                              fontWeight: 700,
                              cursor: isProcessing ? "not-allowed" : "pointer",
                              fontFamily: "inherit",
                              transition: "all 0.15s",
                            }}
                          >
                            {isProcessing ? (
                              <Loader2
                                style={{ width: "12px", height: "12px" }}
                                className="animate-spin"
                              />
                            ) : (
                              <XCircle
                                style={{ width: "12px", height: "12px" }}
                              />
                            )}
                            {isProcessing ? "Processing..." : "REJECT"}
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── SECTION 2: Pending Conference & Dining Room Bookings ── */}
            {!pendingRequestsLoading && pendingBookingRequests.length > 0 && (
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "14px",
                    paddingBottom: "8px",
                    borderBottom: "1px solid rgba(59,130,246,0.2)",
                  }}
                >
                  <CalendarDays
                    style={{ width: "15px", height: "15px", color: "#93c5fd" }}
                  />
                  <span
                    style={{
                      color: "#93c5fd",
                      fontWeight: 800,
                      fontSize: "12px",
                      letterSpacing: "0.8px",
                      textTransform: "uppercase",
                    }}
                  >
                    Room Booking Requests ({pendingBookingRequests.length})
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {pendingBookingRequests.map((b, idx) => {
                    const isProcessing = processingIds.has(b.id);
                    const isConference = b.bookingType === "conference";
                    const bookingOffset = pendingRegistrations.length; // for consistent data-ocid numbering
                    return (
                      <motion.div
                        key={b.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        data-ocid={`admin-standalone.pending-requests.item.${bookingOffset + idx + 1}`}
                        style={{
                          background: "rgba(255,255,255,0.025)",
                          border: isConference
                            ? "1px solid rgba(59,130,246,0.15)"
                            : "1px solid rgba(124,58,237,0.15)",
                          borderRadius: "12px",
                          padding: "16px 18px",
                        }}
                      >
                        {/* Header row */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            flexWrap: "wrap",
                            gap: "8px",
                            marginBottom: "10px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              flexWrap: "wrap",
                            }}
                          >
                            {/* Priority badge */}
                            <span
                              style={{
                                display: "inline-block",
                                padding: "2px 8px",
                                borderRadius: "10px",
                                fontSize: "10px",
                                fontWeight: 800,
                                background: "rgba(245,158,11,0.15)",
                                color: "#fcd34d",
                                border: "1px solid rgba(245,158,11,0.3)",
                              }}
                            >
                              Priority #{idx + 1}
                            </span>
                            {/* Type badge */}
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "3px 10px",
                                borderRadius: "10px",
                                fontSize: "10px",
                                fontWeight: 800,
                                background: isConference
                                  ? "rgba(59,130,246,0.12)"
                                  : "rgba(124,58,237,0.12)",
                                color: isConference ? "#93c5fd" : "#c4b5fd",
                                border: isConference
                                  ? "1px solid rgba(59,130,246,0.28)"
                                  : "1px solid rgba(124,58,237,0.28)",
                                letterSpacing: "0.5px",
                              }}
                            >
                              {isConference
                                ? "🏢 CONFERENCE BOOKING"
                                : "🍽️ DINING BOOKING"}
                            </span>
                            {/* Status badge */}
                            <span
                              style={{
                                display: "inline-block",
                                padding: "2px 8px",
                                borderRadius: "10px",
                                fontSize: "10px",
                                fontWeight: 700,
                                background: "rgba(217,119,6,0.2)",
                                color: "#fcd34d",
                                border: "1px solid rgba(217,119,6,0.4)",
                              }}
                            >
                              ⏳ Pending
                            </span>
                          </div>
                          <span style={{ color: "#475569", fontSize: "10px" }}>
                            {b.id}
                          </span>
                        </div>

                        {/* Room & schedule */}
                        <div style={{ marginBottom: "10px" }}>
                          <p
                            style={{
                              color: isConference ? "#93c5fd" : "#c4b5fd",
                              fontWeight: 700,
                              fontSize: "16px",
                              marginBottom: "4px",
                            }}
                          >
                            {b.room}
                          </p>
                          <div
                            style={{
                              display: "flex",
                              gap: "16px",
                              flexWrap: "wrap",
                            }}
                          >
                            <span
                              style={{ color: "#94a3b8", fontSize: "12px" }}
                            >
                              📅 {b.date}
                            </span>
                            <span
                              style={{ color: "#94a3b8", fontSize: "12px" }}
                            >
                              ⏰ {b.startTime} – {b.endTime}
                            </span>
                          </div>
                        </div>

                        {/* Organizer details */}
                        <div style={{ marginBottom: "10px" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              marginBottom: "3px",
                            }}
                          >
                            <span
                              style={{ color: "#64748b", fontSize: "11px" }}
                            >
                              👤 Organizer:
                            </span>
                            <span
                              style={{
                                color: "#e2e8f0",
                                fontSize: "12px",
                                fontWeight: 600,
                              }}
                            >
                              {b.organizerName}
                            </span>
                          </div>
                          {b.contact && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                marginBottom: "3px",
                              }}
                            >
                              <span
                                style={{ color: "#64748b", fontSize: "11px" }}
                              >
                                📞 Contact:
                              </span>
                              <span
                                style={{ color: "#94a3b8", fontSize: "12px" }}
                              >
                                {b.contact}
                              </span>
                            </div>
                          )}
                          {b.eventName && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                marginBottom: "3px",
                              }}
                            >
                              <span
                                style={{ color: "#64748b", fontSize: "11px" }}
                              >
                                📋 Event:
                              </span>
                              <span
                                style={{ color: "#94a3b8", fontSize: "12px" }}
                              >
                                {b.eventName}
                              </span>
                            </div>
                          )}
                          {b.submittedBy && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                marginBottom: "3px",
                              }}
                            >
                              <span
                                style={{ color: "#64748b", fontSize: "11px" }}
                              >
                                🔑 User ID:
                              </span>
                              <span
                                style={{
                                  color: "#64748b",
                                  fontSize: "11px",
                                  fontFamily: "monospace",
                                }}
                              >
                                {b.submittedBy}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Designation & Purpose badges */}
                        {(b.designation || b.bookingPurpose) && (
                          <div
                            style={{
                              display: "flex",
                              gap: "6px",
                              flexWrap: "wrap",
                              marginBottom: "12px",
                            }}
                          >
                            {b.designation && (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "3px",
                                  background: "rgba(59,130,246,0.08)",
                                  border: "1px solid rgba(59,130,246,0.2)",
                                  borderRadius: "5px",
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
                                  gap: "3px",
                                  background: "rgba(99,102,241,0.08)",
                                  border: "1px solid rgba(99,102,241,0.2)",
                                  borderRadius: "5px",
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

                        {/* Action buttons */}
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            type="button"
                            disabled={isProcessing}
                            data-ocid={`admin-standalone.pending-requests.confirm_button.${bookingOffset + idx + 1}`}
                            onClick={() => handleApproveBooking(b)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "5px",
                              padding: "7px 16px",
                              borderRadius: "7px",
                              border: "1px solid rgba(5,150,105,0.4)",
                              background: isProcessing
                                ? "rgba(5,150,105,0.08)"
                                : "rgba(5,150,105,0.18)",
                              color: isProcessing ? "#475569" : "#6ee7b7",
                              fontSize: "12px",
                              fontWeight: 700,
                              cursor: isProcessing ? "not-allowed" : "pointer",
                              fontFamily: "inherit",
                              transition: "all 0.15s",
                            }}
                          >
                            {isProcessing ? (
                              <Loader2
                                style={{ width: "12px", height: "12px" }}
                                className="animate-spin"
                              />
                            ) : (
                              <CheckCircle
                                style={{ width: "12px", height: "12px" }}
                              />
                            )}
                            {isProcessing ? "Processing..." : "APPROVE"}
                          </button>
                          <button
                            type="button"
                            disabled={isProcessing}
                            data-ocid={`admin-standalone.pending-requests.delete_button.${bookingOffset + idx + 1}`}
                            onClick={() => handleRejectBooking(b)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "5px",
                              padding: "7px 16px",
                              borderRadius: "7px",
                              border: "1px solid rgba(220,38,38,0.4)",
                              background: isProcessing
                                ? "rgba(220,38,38,0.08)"
                                : "rgba(220,38,38,0.18)",
                              color: isProcessing ? "#475569" : "#fca5a5",
                              fontSize: "12px",
                              fontWeight: 700,
                              cursor: isProcessing ? "not-allowed" : "pointer",
                              fontFamily: "inherit",
                              transition: "all 0.15s",
                            }}
                          >
                            {isProcessing ? (
                              <Loader2
                                style={{ width: "12px", height: "12px" }}
                                className="animate-spin"
                              />
                            ) : (
                              <XCircle
                                style={{ width: "12px", height: "12px" }}
                              />
                            )}
                            {isProcessing ? "Processing..." : "REJECT"}
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics" className="mt-0">
            <div className="mb-4">
              <h2 className="font-display text-lg font-semibold text-foreground">
                Analytics &amp; Reports
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Track stock usage trends and room performance
              </p>
            </div>
            <AnalyticsCharts />
          </TabsContent>

          {/* MODULE 4: Bookings Tab */}
          <TabsContent value="bookings" className="mt-0">
            <div className="mb-4">
              <h2 className="font-display text-lg font-semibold text-foreground">
                Room Booking Management
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Approve or reject facility booking requests and monitor
                analytics
              </p>
            </div>

            {/* MODULE 6: Alert Banner */}
            {allPendingBookings.length > 0 && (
              <div
                data-ocid="admin-standalone.bookings.error_state"
                style={{
                  marginBottom: "20px",
                  padding: "14px 18px",
                  borderRadius: "10px",
                  background: "rgba(245,158,11,0.08)",
                  border: "1px solid rgba(245,158,11,0.25)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "4px",
                  }}
                >
                  <AlertTriangle
                    style={{ width: "15px", height: "15px", color: "#fcd34d" }}
                  />
                  <span
                    style={{
                      color: "#fcd34d",
                      fontWeight: 700,
                      fontSize: "13px",
                    }}
                  >
                    {allPendingBookings.length} New Room Booking Request
                    {allPendingBookings.length > 1 ? "s" : ""} Pending Approval
                  </span>
                </div>
                {allPendingBookings.map((b) => (
                  <div
                    key={b.id}
                    style={{
                      color: "#94a3b8",
                      fontSize: "12px",
                      paddingLeft: "23px",
                    }}
                  >
                    • New Room Booking Request —{" "}
                    <span style={{ color: "#e2e8f0", fontWeight: 600 }}>
                      {b.organizerName}
                    </span>{" "}
                    | <span style={{ color: "#93c5fd" }}>{b.room}</span> |{" "}
                    {b.date} {b.startTime}
                  </div>
                ))}
              </div>
            )}

            {/* MODULE 4: Analytics Stat Cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: "12px",
                marginBottom: "24px",
              }}
            >
              {[
                {
                  icon: Building2,
                  label: "Conference Bookings",
                  value: bookingAnalytics.totalConference,
                  color: "#3b82f6",
                  bg: "rgba(59,130,246,0.08)",
                  border: "rgba(59,130,246,0.2)",
                },
                {
                  icon: UtensilsCrossed,
                  label: "Dining Bookings",
                  value: bookingAnalytics.totalDining,
                  color: "#a78bfa",
                  bg: "rgba(124,58,237,0.08)",
                  border: "rgba(124,58,237,0.2)",
                },
                {
                  icon: TrendingUp,
                  label: "Most Booked Room",
                  value: bookingAnalytics.mostBookedRoom,
                  color: "#6ee7b7",
                  bg: "rgba(5,150,105,0.08)",
                  border: "rgba(5,150,105,0.2)",
                  isText: true,
                },
                {
                  icon: CalendarDays,
                  label: "Peak Booking Hour",
                  value: bookingAnalytics.peakHour,
                  color: "#fcd34d",
                  bg: "rgba(245,158,11,0.08)",
                  border: "rgba(245,158,11,0.2)",
                  isText: true,
                },
                {
                  icon: Users,
                  label: "Total Bookings",
                  value:
                    bookingAnalytics.totalConference +
                    bookingAnalytics.totalDining,
                  color: "#f87171",
                  bg: "rgba(220,38,38,0.08)",
                  border: "rgba(220,38,38,0.2)",
                },
              ].map(
                ({ icon: Icon, label, value, color, bg, border, isText }) => (
                  <div
                    key={label}
                    style={{
                      background: bg,
                      border: `1px solid ${border}`,
                      borderRadius: "10px",
                      padding: "14px 16px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        marginBottom: "6px",
                      }}
                    >
                      <Icon style={{ width: "14px", height: "14px", color }} />
                      <span
                        style={{
                          color: "#64748b",
                          fontSize: "10px",
                          fontWeight: 700,
                          letterSpacing: "0.5px",
                          textTransform: "uppercase",
                        }}
                      >
                        {label}
                      </span>
                    </div>
                    <div
                      style={{
                        color: "#f1f5f9",
                        fontWeight: 800,
                        fontSize: isText ? "14px" : "22px",
                        lineHeight: 1,
                      }}
                    >
                      {value}
                    </div>
                  </div>
                ),
              )}
            </div>

            {/* ═══ BACKEND: PENDING APPROVAL REQUESTS (cross-device) ═══ */}
            <div style={{ marginBottom: "28px" }}>
              <h3
                className="font-display text-base font-semibold text-foreground mb-3"
                style={{ fontSize: "14px" }}
              >
                PENDING APPROVAL REQUESTS{" "}
                {pendingBackendBookingsCount > 0 && (
                  <span
                    style={{
                      display: "inline-block",
                      padding: "1px 7px",
                      borderRadius: "10px",
                      fontSize: "11px",
                      fontWeight: 700,
                      background: "rgba(59,130,246,0.15)",
                      color: "#93c5fd",
                      border: "1px solid rgba(59,130,246,0.3)",
                      marginLeft: "6px",
                    }}
                  >
                    {pendingBackendBookingsCount}
                  </span>
                )}
              </h3>
              <p
                style={{
                  color: "#64748b",
                  fontSize: "11px",
                  marginBottom: "12px",
                }}
              >
                Live requests from all devices — approve or reject to update
                booking status
              </p>

              {backendBookings.filter((b) => b.status === "pending").length ===
              0 ? (
                <div
                  data-ocid="admin-standalone.backend-bookings.empty_state"
                  className="text-sm text-muted-foreground text-center py-8 border border-border/60 rounded-lg"
                >
                  No pending requests from backend yet. Requests from any device
                  will appear here instantly.
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {backendBookings
                    .filter((b) => b.status === "pending")
                    .sort((a, b) => {
                      if (a.createdAt < b.createdAt) return -1;
                      if (a.createdAt > b.createdAt) return 1;
                      return 0;
                    })
                    .map((b, idx) => (
                      <div
                        key={b.id}
                        data-ocid={`admin-standalone.backend-bookings.item.${idx + 1}`}
                        style={{
                          background: "rgba(59,130,246,0.04)",
                          border: "1px solid rgba(59,130,246,0.15)",
                          borderRadius: "10px",
                          padding: "14px 16px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            flexWrap: "wrap",
                            gap: "8px",
                            marginBottom: "8px",
                          }}
                        >
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
                                display: "inline-block",
                                padding: "2px 8px",
                                borderRadius: "10px",
                                fontSize: "10px",
                                fontWeight: 800,
                                background: "rgba(245,158,11,0.15)",
                                color: "#fcd34d",
                                border: "1px solid rgba(245,158,11,0.3)",
                              }}
                            >
                              Priority #{idx + 1}
                            </span>
                            <span
                              style={{
                                color:
                                  b.bookingType === "conference"
                                    ? "#93c5fd"
                                    : "#c4b5fd",
                                fontWeight: 700,
                                fontSize: "13px",
                              }}
                            >
                              {b.room}
                            </span>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "2px 8px",
                                borderRadius: "10px",
                                fontSize: "10px",
                                fontWeight: 700,
                                background:
                                  b.bookingType === "conference"
                                    ? "rgba(59,130,246,0.12)"
                                    : "rgba(124,58,237,0.12)",
                                color:
                                  b.bookingType === "conference"
                                    ? "#93c5fd"
                                    : "#c4b5fd",
                                border:
                                  b.bookingType === "conference"
                                    ? "1px solid rgba(59,130,246,0.25)"
                                    : "1px solid rgba(124,58,237,0.25)",
                              }}
                            >
                              {b.bookingType === "conference"
                                ? "Conference"
                                : "Dining"}
                            </span>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "2px 8px",
                                borderRadius: "10px",
                                fontSize: "10px",
                                fontWeight: 700,
                                background: "rgba(217,119,6,0.2)",
                                color: "#fcd34d",
                                border: "1px solid rgba(217,119,6,0.4)",
                              }}
                            >
                              Pending
                            </span>
                          </div>
                        </div>

                        <div
                          style={{
                            color: "#94a3b8",
                            fontSize: "12px",
                            marginBottom: "2px",
                          }}
                        >
                          📅 {b.date} · ⏰ {b.startTime}–{b.endTime}
                        </div>
                        <div
                          style={{
                            color: "#94a3b8",
                            fontSize: "12px",
                            marginBottom: "2px",
                          }}
                        >
                          👤 {b.organizerName} · 📞 {b.contact}
                        </div>
                        <div
                          style={{
                            color: "#475569",
                            fontSize: "11px",
                            marginBottom: "4px",
                          }}
                        >
                          {b.eventName}
                        </div>
                        {(b.designation || b.bookingPurpose) && (
                          <div
                            style={{
                              display: "flex",
                              gap: "6px",
                              flexWrap: "wrap",
                              marginBottom: "8px",
                            }}
                          >
                            {b.designation && (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "3px",
                                  background: "rgba(59,130,246,0.08)",
                                  border: "1px solid rgba(59,130,246,0.2)",
                                  borderRadius: "5px",
                                  padding: "2px 7px",
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
                                  gap: "3px",
                                  background: "rgba(99,102,241,0.08)",
                                  border: "1px solid rgba(99,102,241,0.2)",
                                  borderRadius: "5px",
                                  padding: "2px 7px",
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

                        <div
                          style={{
                            display: "flex",
                            gap: "6px",
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            type="button"
                            data-ocid={`admin-standalone.backend-bookings.confirm_button.${idx + 1}`}
                            onClick={() => {
                              if (!actor) return;
                              const bookingForNotif = b;
                              approveBookingRequestOnBackend(actor, b.id)
                                .then(() => {
                                  // Also sync to localStorage so local UI reflects change
                                  const lsKey =
                                    bookingForNotif.bookingType === "conference"
                                      ? LS_CONF
                                      : LS_DINING;
                                  const lsBookings =
                                    loadFacilityBookings(lsKey);
                                  const updated = lsBookings.map((lb) =>
                                    lb.id === bookingForNotif.id
                                      ? {
                                          ...lb,
                                          status: "Approved" as BookingStatus,
                                        }
                                      : lb,
                                  );
                                  saveFacilityBookings(lsKey, updated);
                                  refreshFacilityBookings();
                                  // Store corporate booking approval notification
                                  const approvalMsg = `Dear ${bookingForNotif.organizerName},

We are pleased to inform you that your Conference Room / Dining Room Booking Request has been reviewed and officially APPROVED by the Corporate Facility Management Administration.

Your reservation for ${bookingForNotif.room} has been confirmed for ${bookingForNotif.date} from ${bookingForNotif.startTime} to ${bookingForNotif.endTime}.

Please ensure that all participants are informed of the confirmed schedule. We request you to adhere to the following corporate guidelines during the utilization of this facility:

• Arrive on time and ensure the room is vacated promptly after your scheduled session.
• Maintain cleanliness, order, and professional decorum at all times.
• Any additional requirements must be coordinated with the Facility Management Team in advance.
• Unauthorized use of reserved rooms or misuse of facilities is strictly prohibited.
• Cancellations or rescheduling must be requested through official channels at least 24 hours in advance.

We appreciate your compliance with our operational procedures and your dedication to maintaining a disciplined corporate environment.

Thank you for using the EBC Corporate Facility Management System.

Best Regards,
Corporate Facility Management Team
EBC Stock Management Tracker
IT Division`;
                                  storeNotification(
                                    actor,
                                    bookingForNotif.organizerName,
                                    "booking_approved",
                                    "Booking Successfully Confirmed",
                                    approvalMsg,
                                  ).catch(() => {});
                                })
                                .catch(() => {});
                            }}
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
                            />
                            APPROVE
                          </button>
                          <button
                            type="button"
                            data-ocid={`admin-standalone.backend-bookings.delete_button.${idx + 1}`}
                            onClick={() => {
                              if (!actor) return;
                              const bookingForNotif = b;
                              rejectBookingRequestOnBackend(actor, b.id)
                                .then(() => {
                                  // Also sync to localStorage so local UI reflects change
                                  const lsKey =
                                    bookingForNotif.bookingType === "conference"
                                      ? LS_CONF
                                      : LS_DINING;
                                  const lsBookings =
                                    loadFacilityBookings(lsKey);
                                  const updated = lsBookings.map((lb) =>
                                    lb.id === bookingForNotif.id
                                      ? {
                                          ...lb,
                                          status: "Cancelled" as BookingStatus,
                                        }
                                      : lb,
                                  );
                                  saveFacilityBookings(lsKey, updated);
                                  refreshFacilityBookings();
                                  // Store corporate booking rejection notification
                                  const rejectionMsg = `Dear ${bookingForNotif.organizerName},

We regret to inform you that your Facility Booking Request for ${bookingForNotif.room} on ${bookingForNotif.date} has been reviewed and could not be approved at this time by the Corporate Facility Management Administration.

The decision to decline this request has been made in accordance with our established facility management protocols and scheduling priorities. We acknowledge your request and appreciate your initiative in utilizing the official booking system.

We strongly encourage you to review the Facility Booking Guidelines before submitting a new request. Please ensure that:

• All booking requests are submitted with complete and accurate information.
• The requested time slots do not conflict with pre-existing reservations.
• Requests are submitted at least 48 hours prior to the intended date.
• All requests must include a valid event name, organizer contact, and department details.

You are welcome to resubmit your booking request with the required corrections. Our Facility Management Team remains available to assist you in finding an appropriate alternative time slot.

We thank you for your understanding and continued cooperation.

Best Regards,
Corporate Facility Management Team
EBC Stock Management Tracker
IT Division`;
                                  storeNotification(
                                    actor,
                                    bookingForNotif.organizerName,
                                    "booking_rejected",
                                    "Booking Request Not Approved",
                                    rejectionMsg,
                                  ).catch(() => {});
                                })
                                .catch(() => {});
                            }}
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
                            />
                            REJECT
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* MODULE 4/5: Priority-sorted pending bookings */}
            <div>
              <h3
                className="font-display text-base font-semibold text-foreground mb-3"
                style={{ fontSize: "14px" }}
              >
                Pending Booking Requests{" "}
                {allPendingBookings.length > 0 && (
                  <span
                    style={{
                      display: "inline-block",
                      padding: "1px 7px",
                      borderRadius: "10px",
                      fontSize: "11px",
                      fontWeight: 700,
                      background: "rgba(217,119,6,0.15)",
                      color: "#fcd34d",
                      border: "1px solid rgba(217,119,6,0.3)",
                      marginLeft: "6px",
                    }}
                  >
                    {allPendingBookings.length}
                  </span>
                )}
              </h3>

              {allPendingBookings.length === 0 ? (
                <div
                  data-ocid="admin-standalone.bookings.empty_state"
                  className="text-sm text-muted-foreground text-center py-10 border border-border/60 rounded-lg"
                >
                  No pending booking requests.
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {allPendingBookings.map((b, idx) => (
                    <div
                      key={b.id}
                      data-ocid={`admin-standalone.bookings.item.${idx + 1}`}
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "10px",
                        padding: "14px 16px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          flexWrap: "wrap",
                          gap: "8px",
                          marginBottom: "6px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            flexWrap: "wrap",
                          }}
                        >
                          {/* MODULE 5: Priority badge */}
                          <span
                            style={{
                              display: "inline-block",
                              padding: "2px 8px",
                              borderRadius: "10px",
                              fontSize: "10px",
                              fontWeight: 800,
                              background: "rgba(245,158,11,0.15)",
                              color: "#fcd34d",
                              border: "1px solid rgba(245,158,11,0.3)",
                            }}
                          >
                            Priority #{idx + 1}
                          </span>
                          <span
                            style={{
                              color:
                                b.type === "conference" ? "#93c5fd" : "#c4b5fd",
                              fontWeight: 700,
                              fontSize: "13px",
                            }}
                          >
                            {b.room}
                          </span>
                          <span style={statusStyle(b.status)}>{b.status}</span>
                          <span
                            style={{
                              color: "#64748b",
                              fontSize: "10px",
                              background: "rgba(255,255,255,0.05)",
                              padding: "2px 6px",
                              borderRadius: "6px",
                            }}
                          >
                            {b.type === "conference" ? "Conference" : "Dining"}
                          </span>
                        </div>
                      </div>

                      <div style={{ color: "#94a3b8", fontSize: "12px" }}>
                        📅 {b.date} · ⏰ {b.startTime}–{b.endTime}
                      </div>
                      <div style={{ color: "#94a3b8", fontSize: "12px" }}>
                        👤 {b.organizerName} · 📞 {b.contact}
                      </div>
                      <div
                        style={{
                          color: "#475569",
                          fontSize: "11px",
                          marginTop: "2px",
                        }}
                      >
                        {b.eventName || b.eventType}
                      </div>

                      {/* MODULE 8: Only Admin / Super Admin see approve/reject */}
                      <div
                        style={{
                          display: "flex",
                          gap: "6px",
                          marginTop: "10px",
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          type="button"
                          data-ocid={`admin-standalone.bookings.confirm_button.${idx + 1}`}
                          onClick={() =>
                            updateBookingStatus(b.id, "Approved", b.type)
                          }
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
                          />
                          Approve
                        </button>
                        <button
                          type="button"
                          data-ocid={`admin-standalone.bookings.delete_button.${idx + 1}`}
                          onClick={() =>
                            updateBookingStatus(b.id, "Cancelled", b.type)
                          }
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
                          <XCircle style={{ width: "12px", height: "12px" }} />
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* All bookings summary */}
            {confBookings.length + diningBookings.length > 0 && (
              <div style={{ marginTop: "24px" }}>
                <h3
                  className="font-display text-base font-semibold text-foreground mb-3"
                  style={{ fontSize: "14px" }}
                >
                  All Bookings
                </h3>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {[...confBookings, ...diningBookings]
                    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                    .slice(0, 10)
                    .map((b, idx) => (
                      <div
                        key={b.id}
                        data-ocid={`admin-standalone.bookings.row.${idx + 1}`}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "10px 14px",
                          background: "rgba(255,255,255,0.02)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          borderRadius: "8px",
                          flexWrap: "wrap",
                          gap: "6px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span
                            style={{
                              color:
                                b.type === "conference" ? "#93c5fd" : "#c4b5fd",
                              fontWeight: 700,
                              fontSize: "12px",
                            }}
                          >
                            {b.room}
                          </span>
                          <span style={{ color: "#64748b", fontSize: "11px" }}>
                            {b.date} {b.startTime}
                          </span>
                          <span style={{ color: "#475569", fontSize: "11px" }}>
                            {b.organizerName}
                          </span>
                        </div>
                        <span style={statusStyle(b.status)}>{b.status}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Approvals */}
          <TabsContent value="approvals" className="mt-0">
            <div className="mb-4">
              <h2 className="font-display text-lg font-semibold text-foreground">
                User Approval Panel
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Approve or reject staff access requests
              </p>
            </div>
            <div className="max-w-xl">
              <UserApprovalPanel />
            </div>
          </TabsContent>

          {/* Registration Requests */}
          <TabsContent value="registrations" className="mt-0">
            <div className="mb-4">
              <h2 className="font-display text-lg font-semibold text-foreground">
                Registration Requests
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Approve or reject first-time Manager and Supervisor registration
                requests
              </p>
            </div>
            <div className="max-w-2xl">
              <RegistrationRequestsPanel />
            </div>
          </TabsContent>

          {/* Update Requests */}
          <TabsContent value="update-requests" className="mt-0">
            <div className="mb-4">
              <h2 className="font-display text-lg font-semibold text-foreground">
                Update Requests
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Review and approve data update requests from Managers and
                Supervisors
              </p>
            </div>
            <div className="max-w-2xl">
              <UpdateRequestsPanel />
            </div>
          </TabsContent>

          {/* Stock Table */}
          <TabsContent value="stock" className="mt-0">
            <div className="mb-4">
              <h2 className="font-display text-lg font-semibold text-foreground">
                Stock Tracker
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                All stock entries across conference rooms
              </p>
            </div>
            <StockTable />
          </TabsContent>

          {/* Quick Actions */}
          <TabsContent value="actions" className="mt-0">
            <div className="mb-4">
              <h2 className="font-display text-lg font-semibold text-foreground">
                Quick Actions
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Manage rooms, items, generate reports
              </p>
            </div>
            <div className="max-w-2xl">
              <QuickActions />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t border-border/50 py-4 mt-12">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <p className="text-xs text-muted-foreground text-center">
            © {new Date().getFullYear()} EBC Stock Management Tracker
          </p>
        </div>
      </footer>
    </div>
  );
}
