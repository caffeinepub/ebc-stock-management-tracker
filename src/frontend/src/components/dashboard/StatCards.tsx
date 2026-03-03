import { Skeleton } from "@/components/ui/skeleton";
import { BarChart2, Building2, Package, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { useAllEntries, useDashboardStats } from "../../hooks/useQueries";

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subtext?: string;
  color: string;
  bgColor: string;
  delay?: number;
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  color,
  bgColor,
  delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className="bg-card rounded-xl p-5 border border-border shadow-card hover:shadow-card-hover transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            {label}
          </p>
          <p className="font-display text-3xl font-bold text-foreground leading-none mb-1">
            {value}
          </p>
          {subtext && (
            <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
          )}
        </div>
        <div
          className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center shrink-0`}
        >
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </motion.div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="bg-card rounded-xl p-5 border border-border shadow-card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Skeleton className="h-3 w-32 mb-3" />
          <Skeleton className="h-8 w-20 mb-2" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="w-12 h-12 rounded-xl" />
      </div>
    </div>
  );
}

export function StatCards() {
  const statsQuery = useDashboardStats();
  const entriesQuery = useAllEntries();

  if (statsQuery.isPending || entriesQuery.isPending) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {["rooms", "items", "available", "balance"].map((k) => (
          <StatCardSkeleton key={k} />
        ))}
      </div>
    );
  }

  const roomsCount = Number(statsQuery.data?.roomsCount ?? 0);
  const itemsCount = Number(statsQuery.data?.itemsCount ?? 0);
  const entries = entriesQuery.data ?? [];

  const totalAvailable = entries.reduce(
    (sum, e) => sum + Number(e.availableQty),
    0,
  );
  const totalBalance = entries.reduce(
    (sum, e) => sum + Number(e.balanceQty),
    0,
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={Building2}
        label="Conference Rooms"
        value={roomsCount}
        subtext="Active rooms"
        color="text-primary"
        bgColor="bg-primary/10"
        delay={0}
      />
      <StatCard
        icon={Package}
        label="Stock Items"
        value={itemsCount}
        subtext="Catalogue items"
        color="text-chart-2"
        bgColor="bg-chart-2/10"
        delay={0.1}
      />
      <StatCard
        icon={TrendingUp}
        label="Total Available"
        value={totalAvailable.toLocaleString()}
        subtext="Units available"
        color="text-success"
        bgColor="bg-success/10"
        delay={0.2}
      />
      <StatCard
        icon={BarChart2}
        label="Balance Stock"
        value={totalBalance.toLocaleString()}
        subtext="Units remaining"
        color="text-warning"
        bgColor="bg-warning/10"
        delay={0.3}
      />
    </div>
  );
}
