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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CalendarDays,
  ClipboardList,
  Loader2,
  Package,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { StockEntry } from "../backend.d";
import { AppNav } from "../components/shared/AppNav";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useBeverageItems,
  useCreateStockEntry,
  useDeleteStockEntry,
  useGiftItems,
  useMyEntries,
  useRooms,
  useUpdateStockEntry,
} from "../hooks/useQueries";

interface StockEntryFormProps {
  entry?: StockEntry;
  onClose?: () => void;
}

function StockEntryForm({ entry, onClose }: StockEntryFormProps) {
  const roomsQuery = useRooms();
  const giftsQuery = useGiftItems();
  const beveragesQuery = useBeverageItems();
  const createEntry = useCreateStockEntry();
  const updateEntry = useUpdateStockEntry();
  const { identity } = useInternetIdentity();

  const storedName = localStorage.getItem(
    `user-name-${identity?.getPrincipal().toString()}`,
  );

  const [roomId, setRoomId] = useState(entry ? entry.roomId.toString() : "");
  const [itemId, setItemId] = useState(entry ? entry.itemId.toString() : "");
  const [availableQty, setAvailableQty] = useState(
    entry ? Number(entry.availableQty).toString() : "",
  );
  const [closingQty, setClosingQty] = useState(
    entry ? Number(entry.closingQty).toString() : "",
  );
  const [balanceQty, setBalanceQty] = useState(
    entry ? Number(entry.balanceQty).toString() : "",
  );
  const [staffName, setStaffName] = useState(
    entry?.staffName ?? storedName ?? "",
  );
  const [date, setDate] = useState(
    entry
      ? new Date(Number(entry.date) / 1_000_000).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
  );

  const allItems = useMemo(
    () => [
      ...(giftsQuery.data ?? []).map((i) => ({ ...i, label: `🎁 ${i.name}` })),
      ...(beveragesQuery.data ?? []).map((i) => ({
        ...i,
        label: `☕ ${i.name}`,
      })),
    ],
    [giftsQuery.data, beveragesQuery.data],
  );

  // Auto-calculate balance
  function handleAvailableChange(v: string) {
    setAvailableQty(v);
    const avail = Number(v) || 0;
    const closing = Number(closingQty) || 0;
    setBalanceQty(Math.max(0, avail - closing).toString());
  }

  function handleClosingChange(v: string) {
    setClosingQty(v);
    const avail = Number(availableQty) || 0;
    const closing = Number(v) || 0;
    setBalanceQty(Math.max(0, avail - closing).toString());
  }

  const isPending = createEntry.isPending || updateEntry.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!roomId || !itemId || !staffName.trim() || !date) {
      toast.error("Please fill in all required fields");
      return;
    }

    const dateMs = new Date(date).getTime();
    const dateNs = BigInt(dateMs) * BigInt(1_000_000);

    try {
      if (entry) {
        await updateEntry.mutateAsync({
          id: entry.id,
          roomId: BigInt(roomId),
          itemId: BigInt(itemId),
          availableQty: BigInt(Number(availableQty) || 0),
          closingQty: BigInt(Number(closingQty) || 0),
          balanceQty: BigInt(Number(balanceQty) || 0),
          staffName,
          date: dateNs,
        });
        toast.success("Entry updated");
      } else {
        await createEntry.mutateAsync({
          roomId: BigInt(roomId),
          itemId: BigInt(itemId),
          availableQty: BigInt(Number(availableQty) || 0),
          closingQty: BigInt(Number(closingQty) || 0),
          balanceQty: BigInt(Number(balanceQty) || 0),
          staffName,
          date: dateNs,
        });
        toast.success("Stock entry added!");
        // Reset form
        setRoomId("");
        setItemId("");
        setAvailableQty("");
        setClosingQty("");
        setBalanceQty("");
        setDate(new Date().toISOString().split("T")[0]);
      }
      onClose?.();
    } catch {
      toast.error("Failed to save entry. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Room */}
        <div className="space-y-1.5">
          <Label htmlFor="room" className="text-sm font-medium">
            Conference Room <span className="text-destructive">*</span>
          </Label>
          <Select value={roomId} onValueChange={setRoomId} required>
            <SelectTrigger id="room" data-ocid="entry.room.select">
              <SelectValue placeholder="Select room" />
            </SelectTrigger>
            <SelectContent>
              {(roomsQuery.data ?? []).map((r) => (
                <SelectItem key={r.id.toString()} value={r.id.toString()}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Item */}
        <div className="space-y-1.5">
          <Label htmlFor="item" className="text-sm font-medium">
            Item <span className="text-destructive">*</span>
          </Label>
          <Select value={itemId} onValueChange={setItemId} required>
            <SelectTrigger id="item" data-ocid="entry.item.select">
              <SelectValue placeholder="Select item" />
            </SelectTrigger>
            <SelectContent className="max-h-[240px]">
              {allItems.length === 0 ? (
                <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                  No items available
                </div>
              ) : (
                allItems.map((i) => (
                  <SelectItem key={i.id.toString()} value={i.id.toString()}>
                    {i.label}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Available Qty */}
        <div className="space-y-1.5">
          <Label htmlFor="avail" className="text-sm font-medium">
            Available Qty <span className="text-destructive">*</span>
          </Label>
          <Input
            id="avail"
            type="number"
            min="0"
            value={availableQty}
            onChange={(e) => handleAvailableChange(e.target.value)}
            placeholder="0"
            required
            data-ocid="entry.available.input"
          />
        </div>

        {/* Closing Qty */}
        <div className="space-y-1.5">
          <Label htmlFor="closing" className="text-sm font-medium">
            Closing Qty <span className="text-destructive">*</span>
          </Label>
          <Input
            id="closing"
            type="number"
            min="0"
            value={closingQty}
            onChange={(e) => handleClosingChange(e.target.value)}
            placeholder="0"
            required
            data-ocid="entry.closing.input"
          />
        </div>

        {/* Balance Qty (auto-calculated) */}
        <div className="space-y-1.5">
          <Label htmlFor="balance" className="text-sm font-medium">
            Balance Qty{" "}
            <span className="text-xs text-muted-foreground">(auto)</span>
          </Label>
          <Input
            id="balance"
            type="number"
            min="0"
            value={balanceQty}
            onChange={(e) => setBalanceQty(e.target.value)}
            placeholder="0"
            data-ocid="entry.balance.input"
          />
        </div>

        {/* Staff Name */}
        <div className="space-y-1.5">
          <Label htmlFor="staff" className="text-sm font-medium">
            Staff Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="staff"
            value={staffName}
            onChange={(e) => setStaffName(e.target.value)}
            placeholder="Your name"
            required
            data-ocid="entry.staffname.input"
          />
        </div>

        {/* Date */}
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="entryDate" className="text-sm font-medium">
            Date <span className="text-destructive">*</span>
          </Label>
          <Input
            id="entryDate"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full"
            data-ocid="entry.date.input"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        {onClose && (
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
            data-ocid="entry.cancel_button"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isPending}
          className="flex-1 gap-2"
          data-ocid="entry.submit_button"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {entry ? "Update Entry" : "Add Stock Entry"}
        </Button>
      </div>
    </form>
  );
}

function MyEntriesTable() {
  const [editEntry, setEditEntry] = useState<StockEntry | undefined>();
  const myEntriesQuery = useMyEntries();
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

  async function handleDelete(id: bigint) {
    try {
      await deleteEntry.mutateAsync(id);
      toast.success("Entry deleted");
    } catch {
      toast.error("Failed to delete entry");
    }
  }

  if (myEntriesQuery.isPending) {
    return (
      <div className="space-y-2">
        {["entry-sk-1", "entry-sk-2", "entry-sk-3", "entry-sk-4"].map((k) => (
          <Skeleton key={k} className="h-10 rounded-lg" />
        ))}
      </div>
    );
  }

  const entries = myEntriesQuery.data ?? [];

  if (entries.length === 0) {
    return (
      <div
        className="text-center py-16 text-muted-foreground"
        data-ocid="myentries.empty_state"
      >
        <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="font-medium">No entries yet</p>
        <p className="text-sm mt-1">
          Your stock entries will appear here after you add them
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-border overflow-hidden shadow-card">
        <ScrollArea>
          <Table data-ocid="myentries.table">
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="text-xs font-semibold uppercase">
                  Room
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase">
                  Item
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase">
                  Available
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase">
                  Closing
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase">
                  Balance
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase">
                  Date
                </TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry, idx) => (
                <TableRow
                  key={entry.id.toString()}
                  className="hover:bg-muted/30"
                  data-ocid={`myentries.row.${idx + 1}`}
                >
                  <TableCell className="text-sm font-medium whitespace-nowrap">
                    {roomMap.get(entry.roomId.toString()) ??
                      `Room ${entry.roomId}`}
                  </TableCell>
                  <TableCell className="text-sm max-w-[160px]">
                    <span className="truncate block">
                      {itemMap.get(entry.itemId.toString()) ??
                        `Item ${entry.itemId}`}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                      {Number(entry.availableQty)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {Number(entry.closingQty)}
                  </TableCell>
                  <TableCell className="text-sm">
                    <Badge className="bg-success/10 text-success border-success/20 text-xs">
                      {Number(entry.balanceQty)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {new Date(
                      Number(entry.date) / 1_000_000,
                    ).toLocaleDateString("en-IN")}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => setEditEntry(entry)}
                        data-ocid={`myentries.edit_button.${idx + 1}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            data-ocid={`myentries.delete_button.${idx + 1}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent data-ocid="myentries.dialog">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Entry</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete this stock entry.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel data-ocid="myentries.cancel_button">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(entry.id)}
                              className="bg-destructive text-destructive-foreground"
                              data-ocid="myentries.confirm_button"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editEntry} onOpenChange={() => setEditEntry(undefined)}>
        <DialogContent className="max-w-lg" data-ocid="myentries.modal">
          <DialogHeader>
            <DialogTitle>Edit Stock Entry</DialogTitle>
          </DialogHeader>
          {editEntry && (
            <StockEntryForm
              entry={editEntry}
              onClose={() => setEditEntry(undefined)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function StaffDashboard() {
  const [activeTab, setActiveTab] = useState("add");
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString() ?? "";
  const storedName = localStorage.getItem(`user-name-${principal}`);
  const displayName = storedName ?? "Staff Member";

  return (
    <div className="min-h-screen bg-background">
      <AppNav isAdmin={false} />

      <main className="max-w-4xl mx-auto px-4 lg:px-6 py-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                Welcome, {displayName}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Log and track stock entries for conference rooms
              </p>
            </div>
            <Badge className="bg-success/10 text-success border-success/30 gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              Active
            </Badge>
          </div>
        </motion.div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="bg-muted/50 border border-border/60 h-10">
            <TabsTrigger
              value="add"
              className="gap-1.5 text-xs"
              data-ocid="staff.add.tab"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Entry
            </TabsTrigger>
            <TabsTrigger
              value="entries"
              className="gap-1.5 text-xs"
              data-ocid="staff.entries.tab"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              My Entries
            </TabsTrigger>
          </TabsList>

          {/* Add Entry Form */}
          <TabsContent value="add" className="mt-0">
            <Card className="shadow-card border-border/60">
              <CardHeader className="pb-4">
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Package className="w-4 h-4 text-primary" />
                  </div>
                  New Stock Entry
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StockEntryForm />
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Entries Table */}
          <TabsContent value="entries" className="mt-0">
            <div className="mb-4 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-muted-foreground" />
              <h2 className="font-display text-lg font-semibold text-foreground">
                My Stock Entries
              </h2>
            </div>
            <MyEntriesTable />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-4 mt-12">
        <div className="max-w-4xl mx-auto px-4 lg:px-6">
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
