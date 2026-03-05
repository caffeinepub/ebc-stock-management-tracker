import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useIsAdmin, useIsApproved } from "./hooks/useQueries";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AdminDashboardStandalone } from "./pages/AdminDashboardStandalone";
import { AdminLoginPanelPage } from "./pages/AdminLoginPanelPage";
import { AppAdminPanelPage } from "./pages/AppAdminPanelPage";
import { LandingPage } from "./pages/LandingPage";
import { ManagerPanelPage } from "./pages/ManagerPanelPage";
import { PendingApprovalPage } from "./pages/PendingApprovalPage";
import { StaffDashboard } from "./pages/StaffDashboard";
import { SupervisorPanelPage } from "./pages/SupervisorPanelPage";

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
            EBC Stock Management Tracker
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

function useHashRoute() {
  const [hash, setHash] = useState(() =>
    window.location.hash.replace(/^#/, ""),
  );
  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash.replace(/^#/, ""));
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);
  return hash;
}

/** Inner component that holds all identity-dependent hooks (always mounted). */
function AuthenticatedApp() {
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

export default function App() {
  const hash = useHashRoute();

  // Hash-based panel routing -- intercepts before identity checks
  if (hash === "app-admin") {
    return (
      <>
        <AppAdminPanelPage />
        <Toaster position="top-right" />
      </>
    );
  }
  if (hash === "admin-login") {
    return (
      <>
        <AdminLoginPanelPage />
        <Toaster position="top-right" />
      </>
    );
  }
  if (hash === "admin-dashboard") {
    return (
      <>
        <AdminDashboardStandalone />
        <Toaster position="top-right" />
      </>
    );
  }
  if (hash === "manager") {
    return (
      <>
        <ManagerPanelPage />
        <Toaster position="top-right" />
      </>
    );
  }
  if (hash === "supervisor") {
    return (
      <>
        <SupervisorPanelPage />
        <Toaster position="top-right" />
      </>
    );
  }

  // Default: identity-based routing
  return <AuthenticatedApp />;
}
