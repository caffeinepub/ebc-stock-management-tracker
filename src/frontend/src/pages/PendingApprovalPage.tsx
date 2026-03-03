import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  Loader2,
  LogOut,
  Send,
  Shield,
  User,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { ApprovalStatus } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useApprovals, useRequestApproval } from "../hooks/useQueries";

export function PendingApprovalPage() {
  const { identity, clear } = useInternetIdentity();
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const principal = identity?.getPrincipal().toString() ?? "";
  const shortPrincipal = `${principal.slice(0, 16)}...${principal.slice(-8)}`;

  const approvalsQuery = useApprovals();
  const requestApproval = useRequestApproval();

  // Find this user's approval status
  const myApproval = approvalsQuery.data?.find(
    (a) => a.principal.toString() === principal,
  );
  const myStatus = myApproval?.status;

  const hasRequestedBefore =
    myStatus !== undefined ||
    submitted ||
    localStorage.getItem(`approval-requested-${principal}`) === "true";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !department.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      await requestApproval.mutateAsync();
      localStorage.setItem(`approval-requested-${principal}`, "true");
      localStorage.setItem(`user-name-${principal}`, fullName);
      localStorage.setItem(`user-dept-${principal}`, department);
      setSubmitted(true);
      toast.success("Access request submitted! Awaiting admin approval.");
    } catch {
      toast.error("Failed to submit request. Please try again.");
    }
  }

  const statusBadge = () => {
    if (myStatus === ApprovalStatus.approved) {
      return (
        <Badge className="bg-success/10 text-success border-success/20 gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Approved
        </Badge>
      );
    }
    if (myStatus === ApprovalStatus.rejected) {
      return (
        <Badge className="bg-destructive/10 text-destructive border-destructive/20 gap-1.5">
          <XCircle className="w-3.5 h-3.5" />
          Rejected
        </Badge>
      );
    }
    if (hasRequestedBefore) {
      return (
        <Badge className="bg-warning/10 text-warning border-warning/20 gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          Pending Approval
        </Badge>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-hero-pattern pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Header Card */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-3">
            <img
              src="/assets/generated/conferstock-logo-transparent.dim_120x120.png"
              alt="Logo"
              className="w-10 h-10"
            />
            <div>
              <p className="font-display text-xl font-bold text-foreground leading-none">
                ConferStock Elite
              </p>
              <p className="text-xs text-muted-foreground">
                Stock Tracker Platform
              </p>
            </div>
          </div>
        </div>

        <Card className="shadow-card-hover border-border/60 overflow-hidden">
          {/* Status banner at top */}
          {myStatus === ApprovalStatus.rejected && (
            <div className="bg-destructive/10 border-b border-destructive/20 px-6 py-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <p className="text-sm text-destructive font-medium">
                Your access request was rejected by admin.
              </p>
            </div>
          )}
          {hasRequestedBefore && myStatus !== ApprovalStatus.rejected && (
            <div className="bg-primary/5 border-b border-primary/10 px-6 py-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <p className="text-sm text-primary font-medium">
                Your account is not yet approved by Admin.
              </p>
            </div>
          )}

          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="font-display text-xl text-foreground">
                  {hasRequestedBefore
                    ? "Awaiting Access"
                    : "Request Staff Access"}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {hasRequestedBefore
                    ? "Your request has been submitted to admin"
                    : "Submit a request to gain staff access"}
                </p>
              </div>
              {statusBadge()}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Principal ID */}
            <div className="bg-muted/50 rounded-lg px-4 py-3 flex items-center gap-3">
              <Shield className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">
                  Your Identity
                </p>
                <p className="text-xs font-mono text-foreground truncate">
                  {shortPrincipal}
                </p>
              </div>
            </div>

            {/* Already submitted */}
            {hasRequestedBefore ? (
              <div className="space-y-4">
                {myStatus === ApprovalStatus.rejected ? (
                  <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-4 text-sm text-destructive">
                    Your access request was not approved. Please contact your
                    administrator for more information.
                  </div>
                ) : (
                  <div className="rounded-lg bg-primary/5 border border-primary/10 p-4">
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-foreground mb-1">
                          Request Pending
                        </p>
                        <p className="text-muted-foreground">
                          Your registration request has been sent to the admin.
                          You will be notified once approved. Please check back
                          later.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => approvalsQuery.refetch()}
                  className="w-full text-muted-foreground"
                  data-ocid="pending.refresh.button"
                >
                  <Loader2
                    className={`w-4 h-4 mr-2 ${approvalsQuery.isFetching ? "animate-spin" : ""}`}
                  />
                  Check Status
                </Button>
              </div>
            ) : (
              /* Registration form */
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="text-sm font-medium">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="pl-9"
                      required
                      data-ocid="register.fullname.input"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="department" className="text-sm font-medium">
                    Department
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="department"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Operations, HR, Finance"
                      className="pl-9"
                      required
                      data-ocid="register.department.input"
                    />
                  </div>
                </div>

                <div className="bg-muted/40 rounded-lg px-4 py-3">
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">Role:</strong> Staff
                    (requires admin approval)
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={requestApproval.isPending}
                  data-ocid="register.submit_button"
                >
                  {requestApproval.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {requestApproval.isPending
                    ? "Submitting..."
                    : "Submit Access Request"}
                </Button>
              </form>
            )}

            <div className="pt-2 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={clear}
                className="w-full text-muted-foreground hover:text-destructive gap-2"
                data-ocid="pending.logout.button"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-4">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </motion.div>
    </div>
  );
}
