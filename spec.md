# EBC Stock Management Tracker

## Current State

The app has a full backend canister with:
- `submitRegistration` (open, no auth) -- registration requests saved to backend
- `submitBookingRequest` (requires `UserApproval.isApproved`) -- THIS IS THE BUG: anonymous users cannot submit bookings
- `getAllBookingRequests` (admin-only) -- returns all booking requests
- `getAllRegistrationRequests` (admin-only) -- returns all registration requests
- `approveBookingRequest` / `rejectBookingRequest` -- admin-only
- `approveRegistration` / `rejectRegistration` -- admin-only

The AdminDashboardStandalone has:
- "Bookings" tab with a "PENDING APPROVAL REQUESTS" section that fetches from backend
- "Registrations" tab with RegistrationRequestsPanel
- Both poll every 3 seconds

The issue: `submitBookingRequest` requires `UserApproval.isApproved(approvalState, caller)` which checks ICP principal-based approval. Users submit bookings anonymously (no Internet Identity) so this check always fails. Bookings never reach the backend and never appear in admin dashboard.

## Requested Changes (Diff)

### Add
- Nothing new to add -- the system is architecturally correct

### Modify
- **Backend `submitBookingRequest`**: Remove the `UserApproval.isApproved` check. Booking requests should be publicly submittable (anyone can submit, admin approves/rejects). The admin approval system is the gatekeeping -- not the submission.
- **Backend `submitStockApprovalRequest`**: Same fix -- remove the approval check so stock requests can also be submitted publicly.
- **AdminDashboardStandalone**: Add a unified "PENDING APPROVAL REQUESTS" section at the top of the Bookings tab that also shows pending registration requests inline, so admin sees ALL pending requests (registrations + bookings) in one place. Each shows user name, role, request type, details, date/time, and APPROVE/REJECT buttons.

### Remove
- Nothing to remove

## Implementation Plan

1. Fix `main.mo`: Change `submitBookingRequest` to not require `UserApproval.isApproved` -- make it open/public (no auth check, any caller can submit).
2. Fix `main.mo`: Change `submitStockApprovalRequest` similarly.
3. Update `AdminDashboardStandalone.tsx`: Add a top-level "PENDING APPROVAL REQUESTS" consolidated section that shows both pending registrations and pending backend bookings together, with full details and APPROVE/REJECT for each. This section shows across all tabs for clarity, or is prominently featured in the Bookings/Overview tab.
4. The existing RegistrationRequestsPanel and BookingRequests panels stay intact -- the new section is additive.
