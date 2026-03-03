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
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Coffee,
  Gift,
  Loader2,
  Package,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { type Item, ItemCategory } from "../../backend.d";
import {
  useAddItem,
  useBeverageItems,
  useDeleteItem,
  useGiftItems,
  useUpdateItem,
} from "../../hooks/useQueries";

interface ItemFormProps {
  item?: Item;
  defaultCategory?: ItemCategory;
  onClose: () => void;
}

function ItemForm({ item, defaultCategory, onClose }: ItemFormProps) {
  const [name, setName] = useState(item?.name ?? "");
  const [category, setCategory] = useState<ItemCategory>(
    item?.category ?? defaultCategory ?? ItemCategory.gift,
  );
  const [stockQty, setStockQty] = useState(
    item ? Number(item.stockQty).toString() : "0",
  );

  const addItem = useAddItem();
  const updateItem = useUpdateItem();
  const isPending = addItem.isPending || updateItem.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Item name is required");
      return;
    }
    try {
      if (item) {
        await updateItem.mutateAsync({
          id: item.id,
          name,
          category,
          stockQty: BigInt(Number(stockQty) || 0),
        });
        toast.success("Item updated");
      } else {
        await addItem.mutateAsync({
          name,
          category,
          stockQty: BigInt(Number(stockQty) || 0),
        });
        toast.success("Item added");
      }
      onClose();
    } catch {
      toast.error("Failed to save item");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="itemName">Item Name</Label>
        <Input
          id="itemName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Millet Chikkies, Red Bull"
          required
          data-ocid="item.name.input"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="itemCategory">Category</Label>
        <Select
          value={category}
          onValueChange={(v) => setCategory(v as ItemCategory)}
        >
          <SelectTrigger id="itemCategory" data-ocid="item.category.select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ItemCategory.gift}>
              <span className="flex items-center gap-2">
                <Gift className="w-4 h-4" />
                Gifts & Stationery
              </span>
            </SelectItem>
            <SelectItem value={ItemCategory.beverage}>
              <span className="flex items-center gap-2">
                <Coffee className="w-4 h-4" />
                Beverages & Snacks
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="stockQty">Initial Stock Quantity</Label>
        <Input
          id="stockQty"
          type="number"
          min="0"
          value={stockQty}
          onChange={(e) => setStockQty(e.target.value)}
          data-ocid="item.stockqty.input"
        />
      </div>
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          data-ocid="item.cancel_button"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending} data-ocid="item.save_button">
          {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          {item ? "Update Item" : "Add Item"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function ItemRow({
  item,
  idx,
  onEdit,
}: {
  item: Item;
  idx: number;
  onEdit: (item: Item) => void;
}) {
  const deleteItem = useDeleteItem();

  async function handleDelete() {
    try {
      await deleteItem.mutateAsync(item.id);
      toast.success("Item deleted");
    } catch {
      toast.error("Failed to delete item");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2, delay: idx * 0.03 }}
      data-ocid={`items.item.${idx + 1}`}
    >
      <Card className="border-border/60 hover:border-primary/20 transition-colors shadow-card">
        <CardContent className="p-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {item.name}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
                Stock: {Number(item.stockQty)}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => onEdit(item)}
              data-ocid={`items.edit_button.${idx + 1}`}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  data-ocid={`items.delete_button.${idx + 1}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent data-ocid="items.dialog">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Item</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete &quot;{item.name}&quot;?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-ocid="items.cancel_button">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground"
                    data-ocid="items.confirm_button"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function ItemsManager() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Item | undefined>();
  const [activeTab, setActiveTab] = useState("gifts");

  const giftsQuery = useGiftItems();
  const beveragesQuery = useBeverageItems();

  function openAdd() {
    setEditItem(undefined);
    setDialogOpen(true);
  }

  function openEdit(item: Item) {
    setEditItem(item);
    setDialogOpen(true);
  }

  const defaultCategory =
    activeTab === "gifts" ? ItemCategory.gift : ItemCategory.beverage;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {(giftsQuery.data?.length ?? 0) + (beveragesQuery.data?.length ?? 0)}{" "}
          total items in catalogue
        </p>
        <Button
          size="sm"
          onClick={openAdd}
          className="gap-1.5"
          data-ocid="items.add.primary_button"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 h-9">
          <TabsTrigger
            value="gifts"
            className="gap-1.5 text-xs"
            data-ocid="items.gifts.tab"
          >
            <Gift className="w-3.5 h-3.5" />
            Gifts & Stationery ({giftsQuery.data?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger
            value="beverages"
            className="gap-1.5 text-xs"
            data-ocid="items.beverages.tab"
          >
            <Coffee className="w-3.5 h-3.5" />
            Beverages & Snacks ({beveragesQuery.data?.length ?? 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gifts" className="mt-4">
          {giftsQuery.isPending ? (
            <div className="space-y-2">
              {[
                "gift-sk-1",
                "gift-sk-2",
                "gift-sk-3",
                "gift-sk-4",
                "gift-sk-5",
              ].map((k) => (
                <Skeleton key={k} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : (giftsQuery.data ?? []).length === 0 ? (
            <div
              className="text-center py-10 text-muted-foreground"
              data-ocid="items.gifts.empty_state"
            >
              <Gift className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No gift items yet</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[480px] overflow-y-auto scrollbar-thin pr-1">
              <AnimatePresence>
                {(giftsQuery.data ?? []).map((item, idx) => (
                  <ItemRow
                    key={item.id.toString()}
                    item={item}
                    idx={idx}
                    onEdit={openEdit}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>

        <TabsContent value="beverages" className="mt-4">
          {beveragesQuery.isPending ? (
            <div className="space-y-2">
              {["bev-sk-1", "bev-sk-2", "bev-sk-3", "bev-sk-4", "bev-sk-5"].map(
                (k) => (
                  <Skeleton key={k} className="h-14 rounded-xl" />
                ),
              )}
            </div>
          ) : (beveragesQuery.data ?? []).length === 0 ? (
            <div
              className="text-center py-10 text-muted-foreground"
              data-ocid="items.beverages.empty_state"
            >
              <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No beverage items yet</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[480px] overflow-y-auto scrollbar-thin pr-1">
              <AnimatePresence>
                {(beveragesQuery.data ?? []).map((item, idx) => (
                  <ItemRow
                    key={item.id.toString()}
                    item={item}
                    idx={idx}
                    onEdit={openEdit}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-ocid="items.modal">
          <DialogHeader>
            <DialogTitle>{editItem ? "Edit Item" : "Add New Item"}</DialogTitle>
          </DialogHeader>
          <ItemForm
            item={editItem}
            defaultCategory={defaultCategory}
            onClose={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
