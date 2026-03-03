import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  useAllEntries,
  useBeverageItems,
  useGiftItems,
  useRooms,
} from "../../hooks/useQueries";

const CHART_COLORS = [
  "oklch(0.48 0.18 255)",
  "oklch(0.55 0.16 145)",
  "oklch(0.72 0.18 75)",
  "oklch(0.58 0.22 27)",
  "oklch(0.62 0.2 210)",
];

function ChartSkeleton() {
  return (
    <div className="h-48 flex items-end gap-2 px-2">
      {["ch-sk-1", "ch-sk-2", "ch-sk-3", "ch-sk-4", "ch-sk-5", "ch-sk-6"].map(
        (k, i) => (
          <Skeleton
            key={k}
            className="flex-1 rounded-t"
            style={{ height: `${30 + ((i * 12) % 70)}%` }}
          />
        ),
      )}
    </div>
  );
}

export function AnalyticsCharts() {
  const [filterRoom, setFilterRoom] = useState<string>("all");
  const [filterDays, setFilterDays] = useState<string>("30");

  const entriesQuery = useAllEntries();
  const roomsQuery = useRooms();
  const giftsQuery = useGiftItems();
  const beveragesQuery = useBeverageItems();

  const isLoading =
    entriesQuery.isPending ||
    roomsQuery.isPending ||
    giftsQuery.isPending ||
    beveragesQuery.isPending;

  const roomMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of roomsQuery.data ?? []) {
      map.set(r.id.toString(), r.name);
    }
    return map;
  }, [roomsQuery.data]);

  // Filter entries by date range
  const cutoffMs = useMemo(() => {
    const days = Number.parseInt(filterDays);
    return Date.now() - days * 24 * 60 * 60 * 1000;
  }, [filterDays]);

  const filteredEntries = useMemo(() => {
    const entries = entriesQuery.data ?? [];
    return entries.filter((e) => {
      const entryMs = Number(e.date) / 1_000_000;
      const inDateRange = entryMs >= cutoffMs;
      const inRoom = filterRoom === "all" || e.roomId.toString() === filterRoom;
      return inDateRange && inRoom;
    });
  }, [entriesQuery.data, cutoffMs, filterRoom]);

  // Bar chart: room-wise stock usage
  const roomUsageData = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of filteredEntries) {
      const key = roomMap.get(e.roomId.toString()) ?? `Room ${e.roomId}`;
      map.set(key, (map.get(key) ?? 0) + Number(e.availableQty));
    }
    return Array.from(map.entries())
      .map(([room, total]) => ({ room, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [filteredEntries, roomMap]);

  // Line chart: daily trend
  const dailyTrendData = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of filteredEntries) {
      const date = new Date(Number(e.date) / 1_000_000).toLocaleDateString(
        "en-IN",
        { month: "short", day: "numeric" },
      );
      map.set(date, (map.get(date) ?? 0) + Number(e.closingQty));
    }
    return Array.from(map.entries())
      .map(([date, consumed]) => ({ date, consumed }))
      .slice(-14); // last 14 data points
  }, [filteredEntries]);

  // Pie chart: category distribution
  const categoryData = useMemo(() => {
    const giftIds = new Set(
      (giftsQuery.data ?? []).map((i) => i.id.toString()),
    );
    const bevIds = new Set(
      (beveragesQuery.data ?? []).map((i) => i.id.toString()),
    );

    let giftTotal = 0;
    let bevTotal = 0;

    for (const e of filteredEntries) {
      const idStr = e.itemId.toString();
      if (giftIds.has(idStr)) giftTotal += Number(e.availableQty);
      else if (bevIds.has(idStr)) bevTotal += Number(e.availableQty);
    }

    return [
      { name: "Gifts & Stationery", value: giftTotal },
      { name: "Beverages & Snacks", value: bevTotal },
    ].filter((d) => d.value > 0);
  }, [filteredEntries, giftsQuery.data, beveragesQuery.data]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <p className="text-sm font-medium text-muted-foreground">Filter by:</p>
        <Select value={filterDays} onValueChange={setFilterDays}>
          <SelectTrigger
            className="w-36 h-8 text-xs"
            data-ocid="analytics.days.select"
          >
            <SelectValue placeholder="Time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterRoom} onValueChange={setFilterRoom}>
          <SelectTrigger
            className="w-40 h-8 text-xs"
            data-ocid="analytics.room.select"
          >
            <SelectValue placeholder="All rooms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Rooms</SelectItem>
            {(roomsQuery.data ?? []).map((r) => (
              <SelectItem key={r.id.toString()} value={r.id.toString()}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bar chart */}
        <Card className="shadow-card border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">
              Room-wise Stock Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ChartSkeleton />
            ) : roomUsageData.length === 0 ? (
              <div
                className="h-48 flex items-center justify-center text-sm text-muted-foreground"
                data-ocid="analytics.bar.empty_state"
              >
                No data available for the selected filters
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={roomUsageData}
                  margin={{ top: 4, right: 8, left: -24, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="oklch(0.88 0.015 240)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="room"
                    tick={{ fontSize: 10, fill: "oklch(0.52 0.02 255)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "oklch(0.52 0.02 255)" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid oklch(0.88 0.015 240)",
                      fontSize: "12px",
                    }}
                  />
                  <Bar
                    dataKey="total"
                    name="Available Stock"
                    fill={CHART_COLORS[0]}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Line chart */}
        <Card className="shadow-card border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">
              Daily Consumption Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ChartSkeleton />
            ) : dailyTrendData.length === 0 ? (
              <div
                className="h-48 flex items-center justify-center text-sm text-muted-foreground"
                data-ocid="analytics.line.empty_state"
              >
                No consumption data for the selected period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart
                  data={dailyTrendData}
                  margin={{ top: 4, right: 8, left: -24, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="oklch(0.88 0.015 240)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "oklch(0.52 0.02 255)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "oklch(0.52 0.02 255)" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid oklch(0.88 0.015 240)",
                      fontSize: "12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="consumed"
                    name="Consumed"
                    stroke={CHART_COLORS[1]}
                    strokeWidth={2}
                    dot={{ fill: CHART_COLORS[1], r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Pie chart */}
        <Card className="shadow-card border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">
              Category Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ChartSkeleton />
            ) : categoryData.length === 0 ? (
              <div
                className="h-48 flex items-center justify-center text-sm text-muted-foreground"
                data-ocid="analytics.pie.empty_state"
              >
                No category data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${entry.name}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid oklch(0.88 0.015 240)",
                      fontSize: "12px",
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "11px" }}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Summary stats mini card */}
        <Card className="shadow-card border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">
              Period Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "Total Entries",
                  value: filteredEntries.length,
                  color: "text-primary",
                },
                {
                  label: "Rooms Used",
                  value: new Set(
                    filteredEntries.map((e) => e.roomId.toString()),
                  ).size,
                  color: "text-chart-2",
                },
                {
                  label: "Items Tracked",
                  value: new Set(
                    filteredEntries.map((e) => e.itemId.toString()),
                  ).size,
                  color: "text-success",
                },
                {
                  label: "Staff Members",
                  value: new Set(filteredEntries.map((e) => e.staffName)).size,
                  color: "text-warning",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-muted/40 rounded-lg p-3 text-center"
                >
                  <p
                    className={`font-display text-2xl font-bold ${stat.color}`}
                  >
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
