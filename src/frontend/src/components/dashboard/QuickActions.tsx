import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Building2,
  FileSpreadsheet,
  FileText,
  Package,
  Plus,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useAllEntries,
  useBeverageItems,
  useGiftItems,
  useRooms,
} from "../../hooks/useQueries";
import { exportStockEntriesCSV } from "../../lib/exportCsv";
import { ItemsManager } from "../stock/ItemsManager";
import { RoomsManager } from "../stock/RoomsManager";

export function QuickActions() {
  const [showRooms, setShowRooms] = useState(false);
  const [showItems, setShowItems] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const entriesQuery = useAllEntries();
  const roomsQuery = useRooms();
  const giftsQuery = useGiftItems();
  const beveragesQuery = useBeverageItems();

  function handleExportCSV() {
    const entries = entriesQuery.data ?? [];
    const rooms = roomsQuery.data ?? [];
    const items = [...(giftsQuery.data ?? []), ...(beveragesQuery.data ?? [])];

    if (entries.length === 0) {
      toast.error("No stock entries to export");
      return;
    }

    exportStockEntriesCSV(entries, rooms, items);
    toast.success("CSV exported successfully");
  }

  const allItems = [...(giftsQuery.data ?? []), ...(beveragesQuery.data ?? [])];

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Button
          variant="outline"
          onClick={() => setShowRooms(true)}
          className="h-auto py-4 flex-col gap-2 border-border hover:border-primary/40 hover:bg-primary/5 transition-colors"
          data-ocid="quickaction.rooms.button"
        >
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <span className="text-xs font-medium text-foreground">
            Manage Rooms
          </span>
        </Button>

        <Button
          variant="outline"
          onClick={() => setShowItems(true)}
          className="h-auto py-4 flex-col gap-2 border-border hover:border-chart-2/40 hover:bg-chart-2/5 transition-colors"
          data-ocid="quickaction.items.button"
        >
          <div className="w-9 h-9 rounded-xl bg-chart-2/10 flex items-center justify-center">
            <Package className="w-5 h-5 text-chart-2" />
          </div>
          <span className="text-xs font-medium text-foreground">
            Manage Items
          </span>
        </Button>

        <Button
          variant="outline"
          onClick={() => setShowReport(true)}
          className="h-auto py-4 flex-col gap-2 border-border hover:border-success/40 hover:bg-success/5 transition-colors"
          data-ocid="quickaction.report.button"
        >
          <div className="w-9 h-9 rounded-xl bg-success/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-success" />
          </div>
          <span className="text-xs font-medium text-foreground">
            View Report
          </span>
        </Button>

        <Button
          variant="outline"
          onClick={handleExportCSV}
          className="h-auto py-4 flex-col gap-2 border-border hover:border-warning/40 hover:bg-warning/5 transition-colors"
          data-ocid="quickaction.csv.button"
        >
          <div className="w-9 h-9 rounded-xl bg-warning/10 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5 text-warning" />
          </div>
          <span className="text-xs font-medium text-foreground">
            Export CSV
          </span>
        </Button>
      </div>

      {/* Rooms Dialog */}
      <Dialog open={showRooms} onOpenChange={setShowRooms}>
        <DialogContent className="max-w-lg" data-ocid="quickaction.rooms.modal">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Conference Rooms
            </DialogTitle>
          </DialogHeader>
          <RoomsManager />
        </DialogContent>
      </Dialog>

      {/* Items Dialog */}
      <Dialog open={showItems} onOpenChange={setShowItems}>
        <DialogContent
          className="max-w-2xl"
          data-ocid="quickaction.items.modal"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-chart-2" />
              Stock Items Catalogue
            </DialogTitle>
          </DialogHeader>
          <ItemsManager />
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={showReport} onOpenChange={setShowReport}>
        <DialogContent
          className="max-w-md"
          data-ocid="quickaction.report.modal"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-success" />
              Stock Report Summary
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {[
              {
                label: "Conference Rooms",
                value: roomsQuery.data?.length ?? 0,
                color: "text-primary",
              },
              {
                label: "Total Items",
                value: allItems.length,
                color: "text-chart-2",
              },
              {
                label: "Gift Items",
                value: giftsQuery.data?.length ?? 0,
                color: "text-success",
              },
              {
                label: "Beverage Items",
                value: beveragesQuery.data?.length ?? 0,
                color: "text-warning",
              },
              {
                label: "Stock Entries",
                value: entriesQuery.data?.length ?? 0,
                color: "text-chart-5",
              },
              {
                label: "Total Available Stock",
                value: (entriesQuery.data ?? [])
                  .reduce((s, e) => s + Number(e.availableQty), 0)
                  .toLocaleString(),
                color: "text-primary",
              },
              {
                label: "Total Balance Stock",
                value: (entriesQuery.data ?? [])
                  .reduce((s, e) => s + Number(e.balanceQty), 0)
                  .toLocaleString(),
                color: "text-success",
              },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <span className="text-sm text-muted-foreground">
                  {row.label}
                </span>
                <span className={`text-sm font-bold font-display ${row.color}`}>
                  {row.value}
                </span>
              </div>
            ))}
            <Button
              onClick={handleExportCSV}
              className="w-full gap-2 mt-2"
              data-ocid="report.export.button"
            >
              <Plus className="w-4 h-4" />
              Export as CSV
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
