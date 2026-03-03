import type { Item, Room, StockEntry } from "../backend.d";

export function exportStockEntriesCSV(
  entries: StockEntry[],
  rooms: Room[],
  items: Item[],
) {
  const roomMap = new Map(rooms.map((r) => [r.id.toString(), r.name]));
  const itemMap = new Map(items.map((i) => [i.id.toString(), i.name]));

  const headers = [
    "Room",
    "Item",
    "Available",
    "Closing",
    "Balance",
    "Staff",
    "Date",
  ];

  const rows = entries.map((entry) => {
    const date = new Date(Number(entry.date) / 1_000_000).toLocaleDateString();
    return [
      roomMap.get(entry.roomId.toString()) ?? entry.roomId.toString(),
      itemMap.get(entry.itemId.toString()) ?? entry.itemId.toString(),
      entry.availableQty.toString(),
      entry.closingQty.toString(),
      entry.balanceQty.toString(),
      entry.staffName,
      date,
    ];
  });

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `stock-entries-${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
