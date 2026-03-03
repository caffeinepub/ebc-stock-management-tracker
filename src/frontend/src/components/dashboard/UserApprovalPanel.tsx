import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Principal } from "@icp-sdk/core/principal";
import {
  Building2,
  CheckCircle2,
  Clock,
  Loader2,
  User,
  Users,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { ApprovalStatus } from "../../backend.d";
import { useApprovals, useSetApproval } from "../../hooks/useQueries";

interface UserCardProps {
  principal: Principal;
  status: ApprovalStatus;
  index: number;
}

function statusBadge(status: ApprovalStatus) {
  if (status === ApprovalStatus.approved) {
    return (
      <Badge className="bg-success/10 text-success border-success/20 gap-1 text-xs">
        <CheckCircle2 className="w-3 h-3" />
        Approved
      </Badge>
    );
  }
  if (status === ApprovalStatus.rejected) {
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

function UserCard({ principal, status, index }: UserCardProps) {
  const setApproval = useSetApproval();
  const principalStr = principal.toString();
  const shortPrincipal = `${principalStr.slice(0, 12)}...${principalStr.slice(-8)}`;

  // Try to get stored name/dept
  const storedName = localStorage.getItem(`user-name-${principalStr}`);
  const storedDept = localStorage.getItem(`user-dept-${principalStr}`);

  const isPending = status === ApprovalStatus.pending;

  async function handleApprove() {
    try {
      await setApproval.mutateAsync({
        principal,
        status: ApprovalStatus.approved,
      });
      toast.success("User approved successfully");
    } catch {
      toast.error("Failed to approve user");
    }
  }

  async function handleReject() {
    try {
      await setApproval.mutateAsync({
        principal,
        status: ApprovalStatus.rejected,
      });
      toast.success("User rejected");
    } catch {
      toast.error("Failed to reject user");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      data-ocid={`approvals.item.${index + 1}`}
    >
      <Card className="border-border/60 shadow-card hover:shadow-card-hover transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-foreground text-sm">
                  {storedName ?? "New User"}
                </p>
                {storedDept && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Building2 className="w-3 h-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      {storedDept}
                    </p>
                  </div>
                )}
                <p className="text-xs font-mono text-muted-foreground mt-1 truncate">
                  {shortPrincipal}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {statusBadge(status)}
            </div>
          </div>

          {isPending && (
            <div className="flex gap-2 mt-3 pt-3 border-t border-border">
              <Button
                size="sm"
                onClick={handleApprove}
                disabled={setApproval.isPending}
                className="flex-1 bg-success/10 text-success hover:bg-success hover:text-success-foreground border border-success/30 gap-1.5 transition-colors"
                data-ocid={`approvals.approve.button.${index + 1}`}
              >
                {setApproval.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                Approve
              </Button>
              <Button
                size="sm"
                onClick={handleReject}
                disabled={setApproval.isPending}
                className="flex-1 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground border border-destructive/30 gap-1.5 transition-colors"
                data-ocid={`approvals.reject.button.${index + 1}`}
              >
                {setApproval.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <XCircle className="w-3.5 h-3.5" />
                )}
                Reject
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function UserApprovalPanel() {
  const approvalsQuery = useApprovals();

  const pending = (approvalsQuery.data ?? []).filter(
    (a) => a.status === ApprovalStatus.pending,
  );
  const others = (approvalsQuery.data ?? []).filter(
    (a) => a.status !== ApprovalStatus.pending,
  );

  if (approvalsQuery.isPending) {
    return (
      <div className="space-y-3">
        {["user-a", "user-b", "user-c"].map((k) => (
          <Skeleton key={k} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  const allApprovals = [...pending, ...others];

  if (allApprovals.length === 0) {
    return (
      <div
        className="text-center py-12 text-muted-foreground"
        data-ocid="approvals.empty_state"
      >
        <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="font-medium">No access requests yet</p>
        <p className="text-sm mt-1">
          Users who request access will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pending.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-semibold text-warning uppercase tracking-wider">
            Pending ({pending.length})
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>
      )}

      <AnimatePresence>
        {allApprovals.map((approval, idx) => (
          <UserCard
            key={approval.principal.toString()}
            principal={approval.principal}
            status={approval.status}
            index={idx}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
