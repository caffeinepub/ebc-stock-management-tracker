import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Clock, Edit, User, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getUpdateRequests,
  updateUpdateRequest,
} from "../../lib/registrationStore";
import type { UpdateRequest } from "../../lib/registrationStore";

function StatusBadge({ status }: { status: UpdateRequest["status"] }) {
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

function RoleBadge({ role }: { role: "Manager" | "Supervisor" }) {
  if (role === "Manager") {
    return (
      <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs">
        💼 Manager
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

const DATA_TYPE_LABELS: Record<string, string> = {
  stock_entry: "Stock Entry",
  room_info: "Room Info",
  item_info: "Item Info",
};

export function UpdateRequestsPanel() {
  const [requests, setRequests] = useState<UpdateRequest[]>([]);

  const loadRequests = () => {
    const all = getUpdateRequests();
    const pending = all.filter((r) => r.status === "pending");
    const others = all.filter((r) => r.status !== "pending");
    setRequests([...pending, ...others]);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: loadRequests is stable (no external deps)
  useEffect(() => {
    loadRequests();
    const interval = setInterval(loadRequests, 10_000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = (req: UpdateRequest) => {
    updateUpdateRequest(req.id, {
      status: "approved",
      resolvedAt: Date.now(),
    });
    loadRequests();
    toast.success("Update approved");
  };

  const handleReject = (req: UpdateRequest) => {
    updateUpdateRequest(req.id, {
      status: "rejected",
      resolvedAt: Date.now(),
    });
    loadRequests();
    toast.error("Update rejected");
  };

  if (requests.length === 0) {
    return (
      <div
        className="text-center py-12 text-muted-foreground"
        data-ocid="update-requests.empty_state"
      >
        <Edit className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="font-medium">No update requests yet</p>
        <p className="text-sm mt-1">
          When Managers or Supervisors submit data update requests, they will
          appear here for your review
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.some((r) => r.status === "pending") && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold text-warning uppercase tracking-wider">
            Pending ({requests.filter((r) => r.status === "pending").length})
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>
      )}

      {requests.map((req, idx) => (
        <Card
          key={req.id}
          className="border-border/60 shadow-card"
          data-ocid={`update-requests.item.${idx + 1}`}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Edit className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-foreground text-sm">
                      {req.requestedByName}
                    </p>
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3 text-muted-foreground" />
                      <span className="font-mono text-xs text-muted-foreground">
                        {req.requestedBy}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground/70">
                      Data Type:
                    </span>{" "}
                    {DATA_TYPE_LABELS[req.dataType] ?? req.dataType}
                  </p>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {req.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Submitted: {formatDate(req.submittedAt)}
                  </p>
                  {req.resolvedAt && (
                    <p className="text-xs text-muted-foreground">
                      Resolved: {formatDate(req.resolvedAt)}
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
                  data-ocid={`update-requests.approve.button.${idx + 1}`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleReject(req)}
                  className="flex-1 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground border border-destructive/30 gap-1.5 transition-colors"
                  data-ocid={`update-requests.reject.button.${idx + 1}`}
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
