// ─── Types ─────────────────────────────────────────────────────────────────

export interface RegistrationRequest {
  id: string; // 'req_' + Date.now() + random
  name: string;
  email: string; // could be empty if mobile provided
  mobile: string; // could be empty if email provided
  role: "Manager" | "Supervisor";
  status: "pending" | "approved" | "rejected";
  submittedAt: number; // Date.now()
  approvedAt?: number;
  rejectedAt?: number;
  tempUserId?: string;
  tempPassword?: string;
}

export interface ApprovedUser {
  id: string; // same as RegistrationRequest id
  name: string;
  email: string;
  mobile: string;
  role: "Manager" | "Supervisor" | "administer";
  status: "active" | "suspended";
  tempUserId: string; // e.g. CSM1025
  tempPassword: string; // e.g. Corp@2026#KX
  createdAt: number;
}

export interface UpdateRequest {
  id: string;
  requestedBy: string; // tempUserId of requester
  requestedByName: string;
  role: "Manager" | "Supervisor";
  dataType: string; // e.g. 'stock_entry'
  description: string; // human-readable description of change
  payload: Record<string, unknown>; // the actual data to update
  status: "pending" | "approved" | "rejected";
  submittedAt: number;
  resolvedAt?: number;
}

// ─── Storage Keys ──────────────────────────────────────────────────────────

const REG_REQUESTS_KEY = "ebc_reg_requests";
const APPROVED_USERS_KEY = "ebc_approved_users";
const UPDATE_REQUESTS_KEY = "ebc_update_requests";
const SESSION_KEY = "ebc_current_session";

// ─── Helpers ───────────────────────────────────────────────────────────────

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Silently ignore storage errors
  }
}

// ─── Registration Requests ─────────────────────────────────────────────────

export function getRegistrationRequests(): RegistrationRequest[] {
  return readJson<RegistrationRequest[]>(REG_REQUESTS_KEY, []);
}

export function saveRegistrationRequest(req: RegistrationRequest): void {
  const existing = getRegistrationRequests();
  writeJson(REG_REQUESTS_KEY, [...existing, req]);
  // Dispatch a storage event so same-tab listeners (admin panel) detect the
  // new registration immediately without waiting for the polling interval.
  try {
    window.dispatchEvent(
      new StorageEvent("storage", { key: REG_REQUESTS_KEY }),
    );
  } catch {
    // Silently ignore -- browsers that don't support StorageEvent constructor
  }
}

export function updateRegistrationRequest(
  id: string,
  updates: Partial<RegistrationRequest>,
): void {
  const existing = getRegistrationRequests();
  const updated = existing.map((r) => (r.id === id ? { ...r, ...updates } : r));
  writeJson(REG_REQUESTS_KEY, updated);
  // Notify same-tab listeners immediately
  try {
    window.dispatchEvent(
      new StorageEvent("storage", { key: REG_REQUESTS_KEY }),
    );
  } catch {
    // Silently ignore
  }
}

// ─── Approved Users ────────────────────────────────────────────────────────

export function getApprovedUsers(): ApprovedUser[] {
  return readJson<ApprovedUser[]>(APPROVED_USERS_KEY, []);
}

export function saveApprovedUser(user: ApprovedUser): void {
  const existing = getApprovedUsers();
  // Upsert by id
  const idx = existing.findIndex((u) => u.id === user.id);
  if (idx !== -1) {
    const updated = [...existing];
    updated[idx] = user;
    writeJson(APPROVED_USERS_KEY, updated);
  } else {
    writeJson(APPROVED_USERS_KEY, [...existing, user]);
  }
}

export function getUserByCredentials(
  userId: string,
  password: string,
): ApprovedUser | null {
  const users = getApprovedUsers();
  return (
    users.find((u) => u.tempUserId === userId && u.tempPassword === password) ??
    null
  );
}

export function getAdminByCredentials(
  userId: string,
  password: string,
): ApprovedUser | null {
  const users = getApprovedUsers();
  // Also allow direct email login for the default admin
  return (
    users.find(
      (u) =>
        (u.tempUserId === userId || u.email === userId) &&
        u.tempPassword === password &&
        u.role === "administer" &&
        u.status === "active",
    ) ?? null
  );
}

// ─── Default Admin Seed ────────────────────────────────────────────────────

const DEFAULT_ADMIN_ID = "ebc_default_admin_seeded";

export function seedDefaultAdminIfNeeded(): void {
  const existing = getApprovedUsers();
  const existingAdmin = existing.find((u) => u.role === "administer");

  const defaultAdmin: ApprovedUser = {
    id: DEFAULT_ADMIN_ID,
    name: "Application Administrator",
    email: "indianai.videochannel@gmail.com",
    mobile: "",
    role: "administer",
    status: "active",
    tempUserId: "indianai.videochannel@gmail.com",
    tempPassword: "Admin@123",
    createdAt: existingAdmin?.createdAt ?? Date.now(),
  };

  // Always update the default admin record with latest credentials
  saveApprovedUser(defaultAdmin);
}

// ─── Update Requests ───────────────────────────────────────────────────────

export function getUpdateRequests(): UpdateRequest[] {
  return readJson<UpdateRequest[]>(UPDATE_REQUESTS_KEY, []);
}

export function saveUpdateRequest(req: UpdateRequest): void {
  const existing = getUpdateRequests();
  writeJson(UPDATE_REQUESTS_KEY, [...existing, req]);
}

export function updateUpdateRequest(
  id: string,
  updates: Partial<UpdateRequest>,
): void {
  const existing = getUpdateRequests();
  const updated = existing.map((r) => (r.id === id ? { ...r, ...updates } : r));
  writeJson(UPDATE_REQUESTS_KEY, updated);
}

// ─── ID / Password Generators ──────────────────────────────────────────────

export function generateTempUserId(): string {
  // CSM + 4-digit number between 1000 and 9999
  const num = Math.floor(1000 + Math.random() * 9000);
  return `CSM${num}`;
}

export function generateTempPassword(): string {
  const year = new Date().getFullYear();
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const r1 = chars[Math.floor(Math.random() * chars.length)];
  const r2 = chars[Math.floor(Math.random() * chars.length)];
  return `Corp@${year}#${r1}${r2}`;
}

// ─── Session Helpers ───────────────────────────────────────────────────────

export function setCurrentSession(user: ApprovedUser): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } catch {
    // Silently ignore
  }
}

export function getCurrentSession(): ApprovedUser | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ApprovedUser;
  } catch {
    return null;
  }
}

export function clearCurrentSession(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Silently ignore
  }
}
