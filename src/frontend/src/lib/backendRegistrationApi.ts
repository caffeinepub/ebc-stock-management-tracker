import type { backendInterface } from "../backend.d";
import type { ApprovedUser, RegistrationRequest } from "./registrationStore";

// ─── Type Mappers ───────────────────────────────────────────────────────────

/**
 * Maps a backend RegRequest to the frontend RegistrationRequest type.
 * Backend status is a string enum ("pending" | "approved" | "rejected").
 * Backend submittedAt is bigint nanoseconds → convert to ms.
 */
function mapRegRequest(r: {
  id: string;
  status: { pending?: null; approved?: null; rejected?: null } | string;
  name: string;
  role: string;
  tempUserId: string;
  submittedAt: bigint;
  email: string;
  mobile: string;
  tempPassword: string;
}): RegistrationRequest {
  // Backend returns status as either a plain string or a Motoko variant object
  let status: RegistrationRequest["status"] = "pending";
  if (typeof r.status === "string") {
    if (r.status === "approved") status = "approved";
    else if (r.status === "rejected") status = "rejected";
    else status = "pending";
  } else if (typeof r.status === "object" && r.status !== null) {
    if ("approved" in r.status) status = "approved";
    else if ("rejected" in r.status) status = "rejected";
    else status = "pending";
  }

  const req: RegistrationRequest = {
    id: r.id,
    name: r.name,
    email: r.email,
    mobile: r.mobile,
    role: (r.role === "Supervisor" ? "Supervisor" : "Manager") as
      | "Manager"
      | "Supervisor",
    status,
    submittedAt: Number(r.submittedAt / 1_000_000n), // nanoseconds → milliseconds
  };

  if (r.tempUserId) req.tempUserId = r.tempUserId;
  if (r.tempPassword) req.tempPassword = r.tempPassword;

  return req;
}

/**
 * Maps a backend ApprovedUserRecord to the frontend ApprovedUser type.
 * Backend createdAt is bigint nanoseconds → convert to ms.
 */
function mapApprovedUserRecord(r: {
  status: string;
  name: string;
  createdAt: bigint;
  role: string;
  tempUserId: string;
  email: string;
  mobile: string;
  tempPassword: string;
}): ApprovedUser {
  let role: ApprovedUser["role"] = "Manager";
  if (r.role === "Supervisor") role = "Supervisor";
  else if (r.role === "administer") role = "administer";

  return {
    id: r.tempUserId, // use tempUserId as the id for login sessions
    name: r.name,
    email: r.email,
    mobile: r.mobile,
    role,
    status: r.status === "active" ? "active" : "suspended",
    tempUserId: r.tempUserId,
    tempPassword: r.tempPassword,
    createdAt: Number(r.createdAt / 1_000_000n), // nanoseconds → milliseconds
  };
}

// ─── API Functions ──────────────────────────────────────────────────────────

/**
 * Submit a new registration request to the backend canister.
 * Called from RegistrationForm on form submit.
 */
export async function submitRegistrationToBackend(
  actor: backendInterface,
  req: {
    id: string;
    name: string;
    email: string;
    mobile: string;
    role: string;
  },
): Promise<void> {
  await actor.submitRegistration(
    req.id,
    req.name,
    req.email,
    req.mobile,
    req.role,
  );
}

/**
 * Fetch all registration requests from the backend canister.
 * Returns them sorted: pending first, then by submittedAt descending.
 * Called from the Admin panel's RegistrationRequestsPanel.
 */
export async function fetchAllRegistrationRequests(
  actor: backendInterface,
): Promise<RegistrationRequest[]> {
  const raw = await actor.getAllRegistrationRequests();
  const mapped = raw.map(mapRegRequest);
  const pending = mapped.filter((r) => r.status === "pending");
  const others = mapped.filter((r) => r.status !== "pending");
  // Sort each group by submittedAt descending (most recent first)
  pending.sort((a, b) => b.submittedAt - a.submittedAt);
  others.sort((a, b) => b.submittedAt - a.submittedAt);
  return [...pending, ...others];
}

/**
 * Approve a registration request on the backend.
 * Generates and sends tempUserId and tempPassword to the canister.
 */
export async function approveRegistrationOnBackend(
  actor: backendInterface,
  id: string,
  tempUserId: string,
  tempPassword: string,
): Promise<void> {
  await actor.approveRegistration(id, tempUserId, tempPassword);
}

/**
 * Reject a registration request on the backend.
 */
export async function rejectRegistrationOnBackend(
  actor: backendInterface,
  id: string,
): Promise<void> {
  await actor.rejectRegistration(id);
}

/**
 * Login with credentials (userId + password) via the backend canister.
 * Returns null if invalid, or the mapped ApprovedUser if valid.
 */
export async function loginWithCredentialsFromBackend(
  actor: backendInterface,
  userId: string,
  password: string,
): Promise<ApprovedUser | null> {
  const result = await actor.loginWithCredentials(userId, password);
  if (result === null || result === undefined) return null;
  // Handle ICP Option type -- could be null or the record directly
  return mapApprovedUserRecord(result);
}
