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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Room } from "../../backend.d";
import {
  useAddRoom,
  useDeleteRoom,
  useRooms,
  useUpdateRoom,
} from "../../hooks/useQueries";

interface RoomFormProps {
  room?: Room;
  onClose: () => void;
}

function RoomForm({ room, onClose }: RoomFormProps) {
  const [name, setName] = useState(room?.name ?? "");
  const [desc, setDesc] = useState(room?.description ?? "");
  const addRoom = useAddRoom();
  const updateRoom = useUpdateRoom();

  const isPending = addRoom.isPending || updateRoom.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Room name is required");
      return;
    }
    try {
      if (room) {
        await updateRoom.mutateAsync({ id: room.id, name, description: desc });
        toast.success("Room updated");
      } else {
        await addRoom.mutateAsync({ name, description: desc });
        toast.success("Room added");
      }
      onClose();
    } catch {
      toast.error("Failed to save room");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="roomName">Room Name</Label>
        <Input
          id="roomName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Board Room, Conference Hall A"
          required
          data-ocid="room.name.input"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="roomDesc">Description</Label>
        <Textarea
          id="roomDesc"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Optional room description"
          rows={3}
          data-ocid="room.description.textarea"
        />
      </div>
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          data-ocid="room.cancel_button"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending} data-ocid="room.save_button">
          {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          {room ? "Update Room" : "Add Room"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function RoomsManager() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRoom, setEditRoom] = useState<Room | undefined>();

  const roomsQuery = useRooms();
  const deleteRoom = useDeleteRoom();

  function openAdd() {
    setEditRoom(undefined);
    setDialogOpen(true);
  }

  function openEdit(room: Room) {
    setEditRoom(room);
    setDialogOpen(true);
  }

  async function handleDelete(id: bigint) {
    try {
      await deleteRoom.mutateAsync(id);
      toast.success("Room deleted");
    } catch {
      toast.error("Failed to delete room");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {roomsQuery.data?.length ?? 0} conference rooms configured
        </p>
        <Button
          size="sm"
          onClick={openAdd}
          className="gap-1.5"
          data-ocid="rooms.add.primary_button"
        >
          <Plus className="w-4 h-4" />
          Add Room
        </Button>
      </div>

      {roomsQuery.isPending ? (
        <div className="grid gap-3">
          {["room-sk-1", "room-sk-2", "room-sk-3"].map((k) => (
            <Skeleton key={k} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : (roomsQuery.data ?? []).length === 0 ? (
        <div
          className="text-center py-12 text-muted-foreground"
          data-ocid="rooms.empty_state"
        >
          <Building2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No rooms yet</p>
          <p className="text-sm mt-1">Add conference rooms to get started</p>
        </div>
      ) : (
        <div className="grid gap-3">
          <AnimatePresence>
            {(roomsQuery.data ?? []).map((room, idx) => (
              <motion.div
                key={room.id.toString()}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, delay: idx * 0.04 }}
                data-ocid={`rooms.item.${idx + 1}`}
              >
                <Card className="border-border/60 hover:border-primary/30 transition-colors shadow-card">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm">
                        {room.name}
                      </p>
                      {room.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {room.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => openEdit(room)}
                        data-ocid={`rooms.edit_button.${idx + 1}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            data-ocid={`rooms.delete_button.${idx + 1}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent data-ocid="rooms.dialog">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Room</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete &quot;{room.name}
                              &quot;? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel data-ocid="rooms.cancel_button">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(room.id)}
                              className="bg-destructive text-destructive-foreground"
                              data-ocid="rooms.confirm_button"
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
            ))}
          </AnimatePresence>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-ocid="rooms.modal">
          <DialogHeader>
            <DialogTitle>
              {editRoom ? "Edit Room" : "Add Conference Room"}
            </DialogTitle>
          </DialogHeader>
          <RoomForm room={editRoom} onClose={() => setDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
