import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Search,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { StockEntry } from "../../backend.d";
import {
  useAllEntries,
  useBeverageItems,
  useDeleteStockEntry,
  useGiftItems,
  useRooms,
} from "../../hooks/useQueries";

type SortKey =
  | "room"
  | "item"
  | "availableQty"
  | "closingQty"
  | "balanceQty"
  | "staffName"
  | "date";
type SortDir = "asc" | "desc";

export function StockTable() {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const entriesQuery = useAllEntries();
  const roomsQuery = useRooms();
  const giftsQuery = useGiftItems();
  const beveragesQuery = useBeverageItems();
  const deleteEntry = useDeleteStockEntry();

  const roomMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of roomsQuery.data ?? []) m.set(r.id.toString(), r.name);
    return m;
  }, [roomsQuery.data]);

  const itemMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const i of [
      ...(giftsQuery.data ?? []),
      ...(beveragesQuery.data ?? []),
    ]) {
      m.set(i.id.toString(), i.name);
    }
    return m;
  }, [giftsQuery.data, beveragesQuery.data]);

  type EnrichedEntry = StockEntry & {
    roomName: string;
    itemName: string;
    dateStr: string;
  };

  const enrichedEntries: EnrichedEntry[] = useMemo(() => {
    return (entriesQuery.data ?? []).map((e) => ({
      ...e,
      roomName: roomMap.get(e.roomId.toString()) ?? `Room ${e.roomId}`,
      itemName: itemMap.get(e.itemId.toString()) ?? `Item ${e.itemId}`,
      dateStr: new Date(Number(e.date) / 1_000_000).toLocaleDateString("en-IN"),
    }));
  }, [entriesQuery.data, roomMap, itemMap]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return enrichedEntries.filter(
      (e) =>
        e.roomName.toLowerCase().includes(q) ||
        e.itemName.toLowerCase().includes(q) ||
        e.staffName.toLowerCase().includes(q) ||
        e.dateStr.includes(q),
    );
  }, [enrichedEntries, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (sortKey) {
        case "room":
          aVal = a.roomName;
          bVal = b.roomName;
          break;
        case "item":
          aVal = a.itemName;
          bVal = b.itemName;
          break;
        case "availableQty":
          aVal = Number(a.availableQty);
          bVal = Number(b.availableQty);
          break;
        case "closingQty":
          aVal = Number(a.closingQty);
          bVal = Number(b.closingQty);
          break;
        case "balanceQty":
          aVal = Number(a.balanceQty);
          bVal = Number(b.balanceQty);
          break;
        case "staffName":
          aVal = a.staffName;
          bVal = b.staffName;
          break;
        default:
          aVal = Number(a.date);
          bVal = Number(b.date);
          break;
      }

      if (typeof aVal === "string") {
        return sortDir === "asc"
          ? aVal.localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal);
      }
      return sortDir === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
  }, [filtered, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col)
      return <ChevronsUpDown className="w-3 h-3 opacity-40" />;
    return sortDir === "asc" ? (
      <ChevronUp className="w-3 h-3" />
    ) : (
      <ChevronDown className="w-3 h-3" />
    );
  }

  async function handleDelete(id: bigint) {
    try {
      await deleteEntry.mutateAsync(id);
      toast.success("Entry deleted");
    } catch {
      toast.error("Failed to delete entry");
    }
  }

  const isLoading = entriesQuery.isPending || roomsQuery.isPending;

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search room, item, staff..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-sm"
          data-ocid="stock.search_input"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {["sk-1", "sk-2", "sk-3", "sk-4", "sk-5"].map((k) => (
            <Skeleton key={k} className="h-10 rounded-lg" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div
          className="text-center py-16 text-muted-foreground"
          data-ocid="stock.empty_state"
        >
          <p className="font-medium mb-1">No stock entries found</p>
          <p className="text-sm">
            {search
              ? "Try adjusting your search"
              : "Add stock entries to see them here"}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden shadow-card">
          <ScrollArea className="w-full" data-ocid="stock.table">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  {(
                    [
                      { key: "room", label: "Room" },
                      { key: "item", label: "Item" },
                      { key: "availableQty", label: "Available" },
                      { key: "closingQty", label: "Closing" },
                      { key: "balanceQty", label: "Balance" },
                      { key: "staffName", label: "Staff" },
                      { key: "date", label: "Date" },
                    ] as { key: SortKey; label: string }[]
                  ).map(({ key, label }) => (
                    <TableHead
                      key={key}
                      className="text-xs font-semibold uppercase tracking-wider cursor-pointer whitespace-nowrap hover:text-foreground"
                      onClick={() => toggleSort(key)}
                    >
                      <div className="flex items-center gap-1">
                        {label}
                        <SortIcon col={key} />
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((entry, idx) => (
                  <TableRow
                    key={entry.id.toString()}
                    className="hover:bg-muted/30 transition-colors"
                    data-ocid={`stock.row.${idx + 1}`}
                  >
                    <TableCell className="text-sm font-medium whitespace-nowrap">
                      {entry.roomName}
                    </TableCell>
                    <TableCell className="text-sm max-w-[160px]">
                      <span className="truncate block">{entry.itemName}</span>
                    </TableCell>
                    <TableCell className="text-sm">
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                        {Number(entry.availableQty)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {Number(entry.closingQty)}
                    </TableCell>
                    <TableCell className="text-sm">
                      <Badge className="bg-success/10 text-success border-success/20 text-xs">
                        {Number(entry.balanceQty)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {entry.staffName}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {entry.dateStr}
                    </TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            data-ocid={`stock.delete_button.${idx + 1}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent data-ocid="stock.dialog">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Entry</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this stock entry?
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel data-ocid="stock.cancel_button">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(entry.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              data-ocid="stock.confirm_button"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        Showing {sorted.length} of {enrichedEntries.length} entries
      </div>
    </div>
  );
}
