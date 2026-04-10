# UtiliTrack IAM — Demo Guide (All 5 User Stories)
# Base URL: http://localhost:8080/api
# Use Bearer token in Authorization header after login

# ════════════════════════════════════════════
# US001 — Admin Creates Users & Roles (RBAC)
# ════════════════════════════════════════════

## 1. Login as Admin
POST /api/iam/login
{ "email": "admin@utilitrack.com", "password": "admin123" }
→ Copy token from response

## 2. Create Role
POST /api/iam/roles   [Bearer token]
{ "name": "TECHNICIAN", "description": "Field technician" }
→ 201 Created

## 3. Duplicate Role → 409
POST /api/iam/roles   [Bearer token]
{ "name": "TECHNICIAN" }
→ 409 Conflict

## 4. Create User
POST /api/iam/users   [Bearer token]
{ "name": "John Tech", "email": "john@utilitrack.com", "temporaryPassword": "Temp@123" }
→ forcePasswordChange: true

## 5. Assign Role to User
POST /api/iam/users/2/roles   [Bearer token]
{ "roleNames": ["TECHNICIAN"] }
→ User now has TECHNICIAN role

## 6. List Users (paginated)
GET /api/iam/users?page=0&size=10   [Bearer token]

## 7. Non-Admin Tries Admin Endpoint → 403
POST /api/iam/roles   [Technician's token]
{ "name": "PLANNER" }
→ 403 Forbidden


# ════════════════════════════════════════════
# US002 — Secure Login (JWT + Lockout)
# ════════════════════════════════════════════

## 1. Valid Login → JWT
POST /api/iam/login
{ "email": "john@utilitrack.com", "password": "Temp@123" }
→ token, forcePasswordChange: true, roles: ["TECHNICIAN"]

## 2. Wrong Password → Feedback
POST /api/iam/login
{ "email": "john@utilitrack.com", "password": "WrongPass" }
→ "Invalid password. 4 attempt(s) remaining."

## 3. Repeat Until Lockout (5 failures)
POST /api/iam/login  (repeat 4 more times)
→ "Account locked for 15 minutes after too many failed attempts."

## 4. Try Again While Locked
POST /api/iam/login
→ "Account locked. Try again in 15 minute(s)."


# ════════════════════════════════════════════
# US003 — Password Reset
# ════════════════════════════════════════════

## 1. Request Password Reset
POST /api/iam/forgot-password
{ "email": "john@utilitrack.com" }
→ "If that email is registered, a reset link has been sent."
→ Check console/logs for token (or email inbox)

## 2. Reset Password with Token
POST /api/iam/reset-password
{ "token": "<token-from-email>", "newPassword": "NewPass@123" }
→ "Password reset successful"

## 3. Try Expired Token → 400
POST /api/iam/reset-password
{ "token": "<old-token>", "newPassword": "NewPass@123" }
→ "Token has expired"

## 4. Try Used Token → 400
POST /api/iam/reset-password  (same token again)
→ "Token already used"

## 5. Weak Password → 400
POST /api/iam/reset-password
{ "token": "<valid>", "newPassword": "weak" }
→ Validation error: must have uppercase + number + special char

## 6. Login with New Password
POST /api/iam/login
{ "email": "john@utilitrack.com", "password": "NewPass@123" }
→ 200 OK, new JWT

## 7. Change Password (forcePasswordChange flow)
POST /api/iam/change-password   [Bearer token]
{ "currentPassword": "NewPass@123", "newPassword": "Another@456" }


# ════════════════════════════════════════════
# US004 — Admin Views Audit Logs
# ════════════════════════════════════════════

## 1. View All Audit Logs
GET /api/iam/audit-logs   [Admin Bearer token]
→ Shows: LOGIN, CREATE_USER, CREATE_ROLE, ASSIGN_ROLE, PASSWORD_RESET...

## 2. Filter by Action
GET /api/iam/audit-logs?action=LOGIN   [Admin token]

## 3. Filter by User
GET /api/iam/audit-logs?actorEmail=john@utilitrack.com

## 4. Filter by Date Range
GET /api/iam/audit-logs?from=2026-01-01T00:00:00&to=2026-12-31T23:59:59

## 5. Non-Admin Tries Audit Logs → 403
GET /api/iam/audit-logs   [Technician token]
→ 403 Forbidden

## 6. Verify in MySQL (TEAM-63)
SELECT * FROM audit_logs ORDER BY performed_at DESC LIMIT 20;


# ════════════════════════════════════════════
# US005 — Admin Registers Assets
# ════════════════════════════════════════════

## 1. Register New Asset
POST /api/assets   [Admin Bearer token]
{
  "name": "Main Transformer T1",
  "assetType": "TRANSFORMER",
  "serialNumber": "TRF-2026-001",
  "location": "Substation A, Zone 1",
  "installationDate": "2026-01-15",
  "description": "220kV primary transformer"
}
→ 201 Created, status: ACTIVE

## 2. Duplicate Serial → 409
POST /api/assets   [Admin token]
{ "serialNumber": "TRF-2026-001", ... }
→ 409 Conflict: "Asset with serial number already exists"

## 3. Missing Required Field → 400
POST /api/assets   [Admin token]
{ "name": "Pump" }  (no serialNumber, no location)
→ 400 Validation error

## 4. List Assets (with filters)
GET /api/assets?type=TRANSFORMER&status=ACTIVE&page=0&size=10

## 5. Asset Types Available:
TRANSFORMER, FEEDER, SUBSTATION, PIPE, METER, VALVE, PUMP, GENERATOR, OTHER

## 6. Non-Admin Tries to Register → 403
POST /api/assets   [Technician token]
→ 403 Forbidden: only Admin can register assets
