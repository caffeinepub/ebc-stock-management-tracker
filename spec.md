# EBC Stock Management Tracker

## Current State
No existing code. Fresh build required.

## Requested Changes (Diff)

### Add
- Full app: EBC Stock Management Tracker (formerly ConferStock Elite)
- Home page with image carousel/gallery (9+ corporate photos: steward serving food, coffee service, corporate reception, conference rooms, meetings)
- Admin Login Panel (separate from staff login, email + password, role-based)
- Staff Registration System (temporary registration form, pending approval workflow)
- Admin Approval Dashboard (approve/reject pending users, generate credentials)
- Role-Based Access: Admin vs Staff
- Stock Management (items list with two categories)
- Conference room tracking
- Admin Dashboard with summary cards, analytics charts, stock table, quick actions

### Modify
- N/A (new project)

### Remove
- N/A (new project)

## Implementation Plan

### Backend (Motoko)
- User model: { id, name, email, mobile, department, role, status (Pending/Approved/Rejected), passwordHash, registrationDate }
- Admin functions: getUsers, approveUser, rejectUser, createAdmin
- Staff functions: registerRequest, login, getStockItems
- Stock model: { id, name, category, available, closing, balance, room, staff, date }
- StockItem categories: Gifts/Stationery (25 items) and Beverages/Snacks (24 items)
- Conference room model: { id, name }
- Seed data: 49 stock items pre-loaded, default admin account

### Frontend Pages
1. **Home Page** -- App name header, image carousel with 9+ photos (auto-cycle), welcome message, two login buttons (Admin Login / Staff Login)
2. **Admin Login Page** -- Email/password form, secure badge, role verification
3. **Staff Registration Page** -- Full name, email, mobile, department, role=Staff, submit → Pending Approval message
4. **Staff Login Page** -- Email/password, shows "Your account is not yet approved by Admin." if pending/rejected
5. **Admin Dashboard** -- 4 summary cards (rooms, stock items, available, balance), bar/line/pie charts, pending user approval panel with approve/reject buttons, stock management table (Room/Item/Available/Closing/Balance/Staff/Date), quick action buttons
6. **Staff Dashboard** -- Stock items list by category, ability to update quantities

### UI Design
- Corporate professional: blue, white, grey palette
- Rounded cards with soft shadows
- Top nav bar: app logo left, admin profile icon + notification bell + logout right
- Premium typography, smooth transitions
- Responsive layout
