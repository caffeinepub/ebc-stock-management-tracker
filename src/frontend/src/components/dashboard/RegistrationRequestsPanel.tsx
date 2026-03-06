import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  ClipboardCopy,
  Clock,
  Loader2,
  Mail,
  Phone,
  UserPlus,
  XCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useActor } from "../../hooks/useActor";
import {
  approveRegistrationOnBackend,
  fetchAllRegistrationRequests,
  rejectRegistrationOnBackend,
} from "../../lib/backendRegistrationApi";
import { storeNotification } from "../../lib/notificationApi";
import {
  generateTempPassword,
  generateTempUserId,
} from "../../lib/registrationStore";
import type { RegistrationRequest } from "../../lib/registrationStore";

interface ApprovalDialogState {
  open: boolean;
  request: RegistrationRequest | null;
  tempUserId: string;
  tempPassword: string;
}

function StatusBadge({ status }: { status: RegistrationRequest["status"] }) {
  if (status === "approved") {
    return (
      <Badge className="bg-success/10 text-success border-success/20 gap-1 text-xs">
        <CheckCircle2 className="w-3 h-3" />
        Approved
      </Badge>
    );
  }
  if (status === "rejected") {
    return (
      <Badge className="bg-destructive/10 text-destructive border-destructive/20 gap-1 text-xs">
        <XCircle className="w-3 h-3" />
        Rejected
      </Badge>
    );
  }
  return (
    <Badge className="bg-warning/10 text-warning border-warning/20 gap-1 text-xs">
      <Clock className="w-3 h-3" />
      Pending
    </Badge>
  );
}

function RoleBadge({
  role,
}: { role: "Manager" | "Supervisor" | "First Time User" }) {
  if (role === "Manager") {
    return (
      <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs">
        💼 Manager
      </Badge>
    );
  }
  if (role === "First Time User") {
    return (
      <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-xs">
        🆕 First Time User
      </Badge>
    );
  }
  return (
    <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">
      📋 Supervisor
    </Badge>
  );
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RegistrationRequestsPanel() {
  const { actor } = useActor();
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [approvalDialog, setApprovalDialog] = useState<ApprovalDialogState>({
    open: false,
    request: null,
    tempUserId: "",
    tempPassword: "",
  });

  // Keep a stable ref to actor so the interval callback always uses the latest actor
  const actorRef = useRef(actor);
  actorRef.current = actor;

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      const currentActor = actorRef.current;
      if (!currentActor) {
        // Actor not ready — clear loading so UI doesn't stay stuck
        if (!cancelled) setInitialLoading(false);
        return;
      }
      try {
        const data = await fetchAllRegistrationRequests(currentActor);
        if (!cancelled) {
          setRequests(data);
          setInitialLoading(false);
        }
      } catch {
        // Silently swallow fetch errors -- just keep showing the last known data
        if (!cancelled) setInitialLoading(false);
      }
    };

    // Immediate fetch on mount
    refresh();

    // Safety fallback: if actor is null for more than 3 seconds, stop showing spinner
    const fallbackTimer = setTimeout(() => {
      if (!cancelled) setInitialLoading(false);
    }, 3_000);

    // Poll every 3 seconds for near-real-time cross-device updates
    const interval = setInterval(refresh, 3_000);

    // Refresh when the admin tab regains focus
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      clearTimeout(fallbackTimer);
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  // Re-fetch when actor becomes available
  useEffect(() => {
    if (!actor) return;
    let cancelled = false;
    fetchAllRegistrationRequests(actor)
      .then((data) => {
        if (!cancelled) {
          setRequests(data);
          setInitialLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setInitialLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [actor]);

  const handleApprove = async (req: RegistrationRequest) => {
    if (!actor) {
      toast.error("Connection not ready. Please try again.");
      return;
    }

    const tempUserId = generateTempUserId();
    const tempPassword = generateTempPassword();

    try {
      await approveRegistrationOnBackend(
        actor,
        req.id,
        tempUserId,
        tempPassword,
      );

      // Refresh list from backend
      const updated = await fetchAllRegistrationRequests(actor);
      setRequests(updated);

      setApprovalDialog({
        open: true,
        request: { ...req, tempUserId, tempPassword },
        tempUserId,
        tempPassword,
      });

      // Store corporate IT notification for user's device (fire-and-forget)
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
      // Also store with tempUserId as recipientKey so user can poll by userId
      storeNotification(
        actor,
        tempUserId,
        "registration_approved",
        "Welcome to Corporate IT System — Registration Approved",
        approvalMessage,
        tempUserId,
        tempPassword,
      ).catch(() => {});
    } catch {
      toast.error("Failed to approve request. Please try again.");
    }
  };

  const handleReject = async (req: RegistrationRequest) => {
    if (!actor) {
      toast.error("Connection not ready. Please try again.");
      return;
    }

    try {
      await rejectRegistrationOnBackend(actor, req.id);

      // Refresh list from backend
      const updated = await fetchAllRegistrationRequests(actor);
      setRequests(updated);

      toast.error("Registration request rejected.");

      // Store corporate IT rejection notification (fire-and-forget)
      const rejectionMessage = `Dear ${req.name},

We regret to inform you that your Registration Request for the EBC Stock Management Tracker has been reviewed by the Application Administration Team and could not be approved at this time.

This decision has been made in accordance with our established corporate registration protocols and access management policies. We appreciate your interest in joining our platform and acknowledge the effort you have made in submitting your request.

If you believe this decision was made in error, or if you wish to resubmit your registration, we encourage you to:

• Verify that all submitted information is accurate and complete.
• Ensure that your registration is submitted through the correct organizational channel.
• Contact your department head or IT administration representative for further guidance.
• Resubmit your application with any required additional documentation or corrections.

Our system maintains strict role-based access controls to ensure data security and compliance. We thank you for your understanding and continued cooperation with our organizational policies.

For further assistance, please reach out to the Application Administration Team or your designated IT support contact.

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
          "",
          "",
        ).catch(() => {});
      }
    } catch {
      toast.error("Failed to reject request. Please try again.");
    }
  };

  const handleCopyCredentials = () => {
    const text = `User ID: ${approvalDialog.tempUserId}\nPassword: ${approvalDialog.tempPassword}`;
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success("Credentials copied to clipboard"))
      .catch(() => toast.error("Failed to copy credentials"));
  };

  const handleCloseDialog = () => {
    setApprovalDialog({
      open: false,
      request: null,
      tempUserId: "",
      tempPassword: "",
    });
  };

  // Show spinner while first fetch completes
  if (initialLoading) {
    return (
      <div
        className="flex items-center justify-center py-12 text-muted-foreground"
        data-ocid="reg-requests.loading_state"
      >
        <Loader2 className="w-6 h-6 animate-spin mr-3" />
        <span className="text-sm">Loading registration requests...</span>
      </div>
    );
  }

  // Only show empty state when there are genuinely no requests at all
  const pendingRequests = requests.filter((r) => r.status === "pending");

  if (requests.length === 0) {
    return (
      <div
        className="text-center py-12 text-muted-foreground"
        data-ocid="reg-requests.empty_state"
      >
        <UserPlus className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="font-medium">No access requests yet</p>
        <p className="text-sm mt-1">
          Users who request access will appear here
        </p>
      </div>
    );
  }

  // If all requests are non-pending (all approved/rejected), show a note but still render list
  const hasPending = pendingRequests.length > 0;

  return (
    <div className="space-y-3">
      {/* Approval Message Dialog */}
      <Dialog open={approvalDialog.open} onOpenChange={handleCloseDialog}>
        <DialogContent
          className="max-w-lg"
          data-ocid="reg-requests.approve.dialog"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-success" />
              User Approved
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Greeting message preview */}
            <div className="bg-muted/50 border border-border rounded-lg p-4 text-sm space-y-2 max-h-72 overflow-y-auto">
              <p className="font-semibold text-foreground">
                Subject: Welcome to Conference Service Manager System
              </p>
              <div className="h-px bg-border" />
              <p className="text-muted-foreground leading-relaxed">
                Dear{" "}
                <span className="font-semibold text-foreground">
                  {approvalDialog.request?.name}
                </span>
                ,
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We are pleased to inform you that your registration has been
                successfully approved by the Application Administration Team.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Welcome to our IT-enabled Corporate Conference Service
                Management System.
              </p>
              <p className="text-muted-foreground">
                Your temporary login credentials are:
              </p>
              <div className="bg-background border border-border rounded-md p-3 font-mono text-sm space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">User ID:</span>
                  <span className="font-bold text-primary">
                    {approvalDialog.tempUserId}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Password:</span>
                  <span className="font-bold text-primary">
                    {approvalDialog.tempPassword}
                  </span>
                </div>
              </div>
              <p className="text-muted-foreground leading-relaxed text-xs">
                Please maintain professional discipline and confidentiality
                while accessing the system. This platform operates under
                structured corporate guidelines and monitoring protocols.
              </p>
              <p className="text-muted-foreground leading-relaxed text-xs">
                We expect responsible usage, accurate reporting, and respectful
                coordination with all departments.
              </p>
              <div className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
                <p>Best Regards,</p>
                <p className="font-semibold text-foreground">
                  Application Administration Team
                </p>
                <p>Conference Service Manager</p>
                <p>Corporate IT Division</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleCopyCredentials}
                variant="outline"
                className="flex-1 gap-2"
                data-ocid="reg-requests.copy-credentials.button"
              >
                <ClipboardCopy className="w-4 h-4" />
                Copy Credentials
              </Button>
              <Button
                onClick={handleCloseDialog}
                className="flex-1"
                data-ocid="reg-requests.approve.close_button"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pending section header */}
      {hasPending && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold text-warning uppercase tracking-wider">
            Pending ({pendingRequests.length})
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>
      )}

      {requests.map((req, idx) => (
        <Card
          key={req.id}
          className="border-border/60 shadow-card"
          data-ocid={`reg-requests.item.${idx + 1}`}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <UserPlus className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0 space-y-1">
                  <p className="font-semibold text-foreground text-sm">
                    {req.name}
                  </p>
                  {req.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-muted-foreground shrink-0" />
                      <p className="text-xs text-muted-foreground truncate">
                        {req.email}
                      </p>
                    </div>
                  )}
                  {req.mobile && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-muted-foreground shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        {req.mobile}
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Submitted: {formatDate(req.submittedAt)}
                  </p>
                  {req.tempUserId && req.status === "approved" && (
                    <p className="text-xs font-mono text-success">
                      ID: {req.tempUserId}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                <RoleBadge role={req.role} />
                <StatusBadge status={req.status} />
              </div>
            </div>

            {req.status === "pending" && (
              <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                <Button
                  size="sm"
                  onClick={() => handleApprove(req)}
                  className="flex-1 bg-success/10 text-success hover:bg-success hover:text-success-foreground border border-success/30 gap-1.5 transition-colors"
                  data-ocid={`reg-requests.approve.button.${idx + 1}`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleReject(req)}
                  className="flex-1 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground border border-destructive/30 gap-1.5 transition-colors"
                  data-ocid={`reg-requests.reject.button.${idx + 1}`}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Reject
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
