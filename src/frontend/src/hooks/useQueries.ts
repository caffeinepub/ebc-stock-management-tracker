import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ApprovalStatus, type Item, ItemCategory } from "../backend.d";
import { useActor } from "./useActor";

// ─── Query Keys ─────────────────────────────────────────────────────────────
export const QUERY_KEYS = {
  dashboardStats: ["dashboardStats"],
  allEntries: ["allEntries"],
  myEntries: ["myEntries"],
  rooms: ["rooms"],
  giftItems: ["items", "gift"],
  beverageItems: ["items", "beverage"],
  approvals: ["approvals"],
  isAdmin: ["isAdmin"],
  isApproved: ["isApproved"],
  userRole: ["userRole"],
} as const;

// ─── Auth / Access Queries ───────────────────────────────────────────────────
export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: QUERY_KEYS.isAdmin,
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useIsApproved() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: QUERY_KEYS.isApproved,
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerApproved();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useUserRole() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: QUERY_KEYS.userRole,
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export function useDashboardStats() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: QUERY_KEYS.dashboardStats,
    queryFn: async () => {
      if (!actor) return { roomsCount: BigInt(0), itemsCount: BigInt(0) };
      return actor.getDashboardStats();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Entries ─────────────────────────────────────────────────────────────────
export function useAllEntries() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: QUERY_KEYS.allEntries,
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllEntries();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMyEntries() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: QUERY_KEYS.myEntries,
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyEntries();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Rooms ───────────────────────────────────────────────────────────────────
export function useRooms() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: QUERY_KEYS.rooms,
    queryFn: async () => {
      if (!actor) return [];
      return actor.listRooms();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Items ───────────────────────────────────────────────────────────────────
export function useGiftItems() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: QUERY_KEYS.giftItems,
    queryFn: async () => {
      if (!actor) return [];
      return actor.getItemsByCategory(ItemCategory.gift);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useBeverageItems() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: QUERY_KEYS.beverageItems,
    queryFn: async () => {
      if (!actor) return [];
      return actor.getItemsByCategory(ItemCategory.beverage);
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Approvals ───────────────────────────────────────────────────────────────
export function useApprovals() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: QUERY_KEYS.approvals,
    queryFn: async () => {
      if (!actor) return [];
      return actor.listApprovals();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10_000,
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────
export function useRequestApproval() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      return actor.requestApproval();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.isApproved });
    },
  });
}

export function useSetApproval() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      principal,
      status,
    }: {
      principal: Principal;
      status: ApprovalStatus;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.setApproval(principal, status);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.approvals });
    },
  });
}

export function useAddRoom() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      description,
    }: {
      name: string;
      description: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.addRoom(name, description);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.rooms });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.dashboardStats });
    },
  });
}

export function useUpdateRoom() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      name,
      description,
    }: {
      id: bigint;
      name: string;
      description: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateRoom(id, name, description);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.rooms });
    },
  });
}

export function useDeleteRoom() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteRoom(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.rooms });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.dashboardStats });
    },
  });
}

export function useAddItem() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      category,
      stockQty,
    }: {
      name: string;
      category: ItemCategory;
      stockQty: bigint;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.addItem(name, category, stockQty);
    },
    onSuccess: (_, { category }) => {
      const key =
        category === ItemCategory.gift
          ? QUERY_KEYS.giftItems
          : QUERY_KEYS.beverageItems;
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.dashboardStats });
    },
  });
}

export function useUpdateItem() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      name,
      category,
      stockQty,
    }: {
      id: bigint;
      name: string;
      category: ItemCategory;
      stockQty: bigint;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateItem(id, name, category, stockQty);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.giftItems });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.beverageItems });
    },
  });
}

export function useDeleteItem() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteItem(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.giftItems });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.beverageItems });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.dashboardStats });
    },
  });
}

export function useCreateStockEntry() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      roomId,
      itemId,
      availableQty,
      closingQty,
      balanceQty,
      staffName,
      date,
    }: {
      roomId: bigint;
      itemId: bigint;
      availableQty: bigint;
      closingQty: bigint;
      balanceQty: bigint;
      staffName: string;
      date: bigint;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createStockEntry(
        roomId,
        itemId,
        availableQty,
        closingQty,
        balanceQty,
        staffName,
        date,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.allEntries });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.myEntries });
    },
  });
}

export function useUpdateStockEntry() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      roomId,
      itemId,
      availableQty,
      closingQty,
      balanceQty,
      staffName,
      date,
    }: {
      id: bigint;
      roomId: bigint;
      itemId: bigint;
      availableQty: bigint;
      closingQty: bigint;
      balanceQty: bigint;
      staffName: string;
      date: bigint;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateStockEntry(
        id,
        roomId,
        itemId,
        availableQty,
        closingQty,
        balanceQty,
        staffName,
        date,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.allEntries });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.myEntries });
    },
  });
}

export function useDeleteStockEntry() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteStockEntry(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.allEntries });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.myEntries });
    },
  });
}

export function usePrefilledItems() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      gifts,
      beverages,
    }: {
      gifts: Item[];
      beverages: Item[];
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.prefilledItems(gifts, beverages);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.giftItems });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.beverageItems });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.dashboardStats });
    },
  });
}
