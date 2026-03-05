import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
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
export type Time = bigint;
export interface BookingRequest {
    id: string;
    startTime: string;
    status: string;
    contact: string;
    endTime: string;
    date: string;
    designation: string;
    createdAt: Time;
    room: string;
    bookingPurpose: string;
    submittedBy: string;
    organizerName: string;
    notes: string;
    bookingType: string;
    eventName: string;
}
export interface Room {
    id: bigint;
    name: string;
    createdAt: Time;
    description: string;
}
export interface UserApprovalInfo {
    status: ApprovalStatus;
    principal: Principal;
}
export interface StockApprovalRequest {
    id: string;
    status: string;
    role: string;
    submittedAt: Time;
    description: string;
    dataType: string;
    requestedByName: string;
}
export interface Item {
    id: bigint;
    stockQty: bigint;
    name: string;
    createdAt: Time;
    category: ItemCategory;
}
export interface RegRequest {
    id: string;
    status: RegStatus;
    name: string;
    role: string;
    tempUserId: string;
    submittedAt: Time;
    email: string;
    mobile: string;
    tempPassword: string;
}
export interface Notification {
    id: string;
    title: string;
    recipientKey: string;
    notificationType: string;
    createdAt: Time;
    credentialsUserId: string;
    isRead: boolean;
    credentialsPassword: string;
    message: string;
}
export interface ApprovedUserRecord {
    status: string;
    name: string;
    createdAt: Time;
    role: string;
    tempUserId: string;
    email: string;
    mobile: string;
    tempPassword: string;
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
    approveBookingRequest(id: string): Promise<void>;
    approveRegistration(id: string, tempUserId: string, tempPassword: string): Promise<void>;
    approveStockApprovalRequest(id: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createStockEntry(roomId: bigint, itemId: bigint, availableQty: bigint, closingQty: bigint, balanceQty: bigint, staffName: string, date: Time): Promise<bigint>;
    deleteItem(id: bigint): Promise<void>;
    deleteRoom(id: bigint): Promise<void>;
    deleteStockEntry(id: bigint): Promise<void>;
    getAllBookingRequests(): Promise<Array<BookingRequest>>;
    getAllEntries(): Promise<Array<StockEntry>>;
    getAllRegistrationRequests(): Promise<Array<RegRequest>>;
    getAllStockApprovalRequests(): Promise<Array<StockApprovalRequest>>;
    getCallerUserRole(): Promise<UserRole>;
    getDashboardStats(): Promise<{
        roomsCount: bigint;
        itemsCount: bigint;
    }>;
    getEntriesByCategory(category: ItemCategory): Promise<Array<StockEntry>>;
    getItemsByCategory(category: ItemCategory): Promise<Array<Item>>;
    getMyEntries(): Promise<Array<StockEntry>>;
    getNotificationsForRecipient(recipientKey: string): Promise<Array<Notification>>;
    isCallerAdmin(): Promise<boolean>;
    isCallerApproved(): Promise<boolean>;
    listApprovals(): Promise<Array<UserApprovalInfo>>;
    listRooms(): Promise<Array<Room>>;
    loginWithCredentials(userId: string, password: string): Promise<ApprovedUserRecord | null>;
    markAllNotificationsReadForRecipient(recipientKey: string): Promise<void>;
    markNotificationRead(id: string): Promise<void>;
    prefilledItems(gifts: Array<Item>, beverages: Array<Item>): Promise<void>;
    rejectBookingRequest(id: string): Promise<void>;
    rejectRegistration(id: string): Promise<void>;
    rejectStockApprovalRequest(id: string): Promise<void>;
    requestApproval(): Promise<void>;
    setApproval(user: Principal, status: ApprovalStatus): Promise<void>;
    storeNotification(recipientKey: string, notificationType: string, title: string, message: string, credentialsUserId: string, credentialsPassword: string): Promise<string>;
    submitBookingRequest(id: string, bookingType: string, room: string, date: string, startTime: string, endTime: string, eventName: string, organizerName: string, contact: string, notes: string, submittedBy: string, designation: string, bookingPurpose: string): Promise<void>;
    submitRegistration(id: string, name: string, email: string, mobile: string, role: string): Promise<void>;
    submitStockApprovalRequest(id: string, requestedByName: string, role: string, dataType: string, description: string): Promise<void>;
    updateItem(id: bigint, name: string, category: ItemCategory, stockQty: bigint): Promise<void>;
    updateRoom(id: bigint, name: string, description: string): Promise<void>;
    updateStockEntry(id: bigint, roomId: bigint, itemId: bigint, availableQty: bigint, closingQty: bigint, balanceQty: bigint, staffName: string, date: Time): Promise<void>;
}
