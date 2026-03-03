import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  ChevronDown,
  LogOut,
  Settings,
  Shield,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import { useApprovals } from "../../hooks/useQueries";

interface AppNavProps {
  isAdmin?: boolean;
}

export function AppNav({ isAdmin = false }: AppNavProps) {
  const { identity, clear } = useInternetIdentity();
  const [notifOpen, setNotifOpen] = useState(false);

  const approvalsQuery = useApprovals();
  const pendingCount =
    approvalsQuery.data?.filter((a) => a.status === "pending").length ?? 0;

  const principal = identity?.getPrincipal().toString() ?? "";
  const shortPrincipal = `${principal.slice(0, 8)}...${principal.slice(-6)}`;
  const storedName = localStorage.getItem(`user-name-${principal}`);
  const displayName = storedName ?? (isAdmin ? "Administrator" : "Staff User");
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border shadow-nav"
    >
      <div className="flex items-center justify-between px-4 lg:px-6 h-16">
        {/* Left: Logo */}
        <div className="flex items-center gap-3">
          <img
            src="/assets/generated/conferstock-logo-transparent.dim_120x120.png"
            alt="Logo"
            className="w-8 h-8"
          />
          <div className="hidden sm:block">
            <p className="font-display text-base font-bold text-foreground leading-none">
              EBC Stock Management Tracker
            </p>
            <p className="text-[10px] text-muted-foreground">
              Stock Tracker Platform
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          {isAdmin && (
            <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  data-ocid="nav.notifications.button"
                >
                  <Bell className="w-4 h-4" />
                  {pendingCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                      {pendingCount > 9 ? "9+" : pendingCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-sm font-semibold">Notifications</p>
                </div>
                {pendingCount > 0 ? (
                  <div className="p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-warning" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {pendingCount} pending approval
                          {pendingCount !== 1 ? "s" : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Users waiting for access
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                    No new notifications
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 pl-2 pr-3"
                data-ocid="nav.user.dropdown_menu"
              >
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                  {initials}
                </div>
                <span className="hidden sm:block text-sm max-w-[120px] truncate font-medium">
                  {displayName}
                </span>
                {isAdmin && (
                  <Badge className="hidden sm:flex bg-primary/10 text-primary border-primary/20 text-[10px] px-1.5 py-0 gap-0.5">
                    <Shield className="w-2.5 h-2.5" />
                    Admin
                  </Badge>
                )}
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-sm font-medium text-foreground truncate">
                  {displayName}
                </p>
                <p className="text-xs text-muted-foreground font-mono truncate">
                  {shortPrincipal}
                </p>
              </div>
              <DropdownMenuItem className="gap-2 text-sm cursor-pointer">
                <Settings className="w-4 h-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={clear}
                className="gap-2 text-sm text-destructive focus:text-destructive cursor-pointer"
                data-ocid="nav.logout.button"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.header>
  );
}
