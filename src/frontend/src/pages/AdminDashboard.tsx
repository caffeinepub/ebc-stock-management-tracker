import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  Users,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { ApprovalStatus } from "../backend.d";
import { AnalyticsCharts } from "../components/dashboard/AnalyticsCharts";
import { QuickActions } from "../components/dashboard/QuickActions";
import { SeedInitializer } from "../components/dashboard/SeedInitializer";
import { StatCards } from "../components/dashboard/StatCards";
import { UserApprovalPanel } from "../components/dashboard/UserApprovalPanel";
import { AppNav } from "../components/shared/AppNav";
import { StockTable } from "../components/stock/StockTable";
import { useApprovals } from "../hooks/useQueries";

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const approvalsQuery = useApprovals();
  const pendingCount =
    approvalsQuery.data?.filter((a) => a.status === ApprovalStatus.pending)
      .length ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <SeedInitializer />
      <AppNav isAdmin />

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
                data-ocid="admin.overview.tab"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="gap-1.5 text-xs data-[state=active]:shadow-none"
                data-ocid="admin.analytics.tab"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
              <TabsTrigger
                value="approvals"
                className="gap-1.5 text-xs data-[state=active]:shadow-none"
                data-ocid="admin.approvals.tab"
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
                value="stock"
                className="gap-1.5 text-xs data-[state=active]:shadow-none"
                data-ocid="admin.stock.tab"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Stock Tracker</span>
              </TabsTrigger>
              <TabsTrigger
                value="actions"
                className="gap-1.5 text-xs data-[state=active]:shadow-none"
                data-ocid="admin.actions.tab"
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
              {/* Recent quick actions */}
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <h2 className="font-display text-base font-semibold text-foreground mb-4">
                    Quick Actions
                  </h2>
                  <QuickActions />
                </div>
              </div>

              {/* Pending approvals sidebar */}
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

      {/* Footer */}
      <footer className="border-t border-border/50 py-4 mt-12">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <p className="text-xs text-muted-foreground text-center">
            © {new Date().getFullYear()} ConferStock Elite. Built with love
            using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
