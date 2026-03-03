import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useIsAdmin, useIsApproved } from "./hooks/useQueries";
import { AdminDashboard } from "./pages/AdminDashboard";
import { LandingPage } from "./pages/LandingPage";
import { PendingApprovalPage } from "./pages/PendingApprovalPage";
import { StaffDashboard } from "./pages/StaffDashboard";

function AppLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-3">
          <img
            src="/assets/generated/conferstock-logo-transparent.dim_120x120.png"
            alt="ConferStock Elite"
            className="w-12 h-12 animate-pulse"
          />
          <span className="font-display text-2xl font-bold text-foreground">
            ConferStock Elite
          </span>
        </div>
        <div className="flex flex-col gap-2 w-64">
          <Skeleton className="h-2 w-full rounded-full" />
          <Skeleton className="h-2 w-4/5 rounded-full" />
          <Skeleton className="h-2 w-3/5 rounded-full" />
        </div>
        <p className="text-muted-foreground text-sm animate-pulse">
          Initializing secure connection...
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const { isFetching: actorFetching } = useActor();
  const isAdminQuery = useIsAdmin();
  const isApprovedQuery = useIsApproved();

  // Show loader while initializing
  if (isInitializing) {
    return <AppLoader />;
  }

  // No identity = show landing/login page
  if (!identity) {
    return (
      <>
        <LandingPage />
        <Toaster position="top-right" />
      </>
    );
  }

  // Identity loaded but still fetching actor / role checks
  if (actorFetching || isAdminQuery.isPending || isApprovedQuery.isPending) {
    return <AppLoader />;
  }

  const isAdmin = isAdminQuery.data ?? false;
  const isApproved = isApprovedQuery.data ?? false;

  // Admin always gets full access
  if (isAdmin) {
    return (
      <>
        <AdminDashboard />
        <Toaster position="top-right" />
      </>
    );
  }

  // Approved staff member
  if (isApproved) {
    return (
      <>
        <StaffDashboard />
        <Toaster position="top-right" />
      </>
    );
  }

  // Logged in but not yet approved
  return (
    <>
      <PendingApprovalPage />
      <Toaster position="top-right" />
    </>
  );
}
