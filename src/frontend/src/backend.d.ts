import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface UserApprovalInfo {
    status: ApprovalStatus;
    principal: Principal;
}
export type Time = bigint;
export interface Item {
    id: bigint;
    stockQty: bigint;
    name: string;
    createdAt: Time;
    category: ItemCategory;
}
export interface Room {
    id: bigint;
    name: string;
    createdAt: Time;
    description: string;
}
export interface StockEntry {
    id: bigint;
    itemId: bigint;
    staffName: string;
    availableQty: bigint;
    date: Time;
    createdAt: Time;
    createdBy: Principal;
    closingQty: bigint;
    balanceQty: bigint;
    roomId: bigint;
}
export enum ApprovalStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum ItemCategory {
    gift = "gift",
    beverage = "beverage"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addItem(name: string, category: ItemCategory, stockQty: bigint): Promise<bigint>;
    addRoom(name: string, description: string): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createStockEntry(roomId: bigint, itemId: bigint, availableQty: bigint, closingQty: bigint, balanceQty: bigint, staffName: string, date: Time): Promise<bigint>;
    deleteItem(id: bigint): Promise<void>;
    deleteRoom(id: bigint): Promise<void>;
    deleteStockEntry(id: bigint): Promise<void>;
    getAllEntries(): Promise<Array<StockEntry>>;
    getCallerUserRole(): Promise<UserRole>;
    getDashboardStats(): Promise<{
        roomsCount: bigint;
        itemsCount: bigint;
    }>;
    getEntriesByCategory(category: ItemCategory): Promise<Array<StockEntry>>;
    getItemsByCategory(category: ItemCategory): Promise<Array<Item>>;
    getMyEntries(): Promise<Array<StockEntry>>;
    isCallerAdmin(): Promise<boolean>;
    isCallerApproved(): Promise<boolean>;
    listApprovals(): Promise<Array<UserApprovalInfo>>;
    listRooms(): Promise<Array<Room>>;
    prefilledItems(gifts: Array<Item>, beverages: Array<Item>): Promise<void>;
    requestApproval(): Promise<void>;
    setApproval(user: Principal, status: ApprovalStatus): Promise<void>;
    updateItem(id: bigint, name: string, category: ItemCategory, stockQty: bigint): Promise<void>;
    updateRoom(id: bigint, name: string, description: string): Promise<void>;
    updateStockEntry(id: bigint, roomId: bigint, itemId: bigint, availableQty: bigint, closingQty: bigint, balanceQty: bigint, staffName: string, date: Time): Promise<void>;
}
