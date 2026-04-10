# UtiliTrack IAM — 5 User Stories
## Spring Boot 3.2.3 | Java 17 | MySQL | Flyway | JWT | RBAC

## Project Structure
```
utilitrack-iam/
├── pom.xml
├── README.md
├── DEMO_GUIDE.md
└── src/main/java/com/utilitrack/iam/
    ├── UtiliTrackIamApplication.java   ← Main entry point
    ├── common/                          ← Shared (ApiResponse, exceptions, PagedResponse)
    ├── config/                          ← JwtUtil, JwtFilter, SecurityConfig
    ├── US001_user_role_management/      ← US001: Roles + Users + RBAC
    ├── US002_secure_login/              ← US002: JWT login + brute-force lockout
    ├── US003_password_reset/            ← US003: Forgot/Reset/Change password
    ├── US004_audit_logs/                ← US004: Admin audit log viewer
    └── US005_asset_registry/            ← US005: Asset registration
```

## How to Run in IntelliJ

### Step 1 — Open Project
File → Open → select `utilitrack-iam` folder → Trust Project → Maven auto-imports

### Step 2 — Configure MySQL
Edit `src/main/resources/application.properties`:
```
spring.datasource.password=YOUR_MYSQL_PASSWORD
```

### Step 3 — Bootstrap Admin (one-time SQL)
```sql
INSERT INTO roles (name, description) VALUES ('ADMIN', 'System administrator');
INSERT INTO users (name, email, password, force_password_change, enabled, login_attempts)
VALUES ('Super Admin', 'admin@utilitrack.com',
        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVkC1iSgXq', false, true, 0);
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.email='admin@utilitrack.com' AND r.name='ADMIN';
```
BCrypt hash above = `admin123`

### Step 4 — Run Application
Right-click `UtiliTrackIamApplication.java` → Run
OR: `mvn spring-boot:run`

### Step 5 — Run All Tests
Right-click `src/test` → Run All Tests
OR: `mvn test`

## API Endpoints Summary

| US | Method | URL | Auth | Description |
|----|--------|-----|------|-------------|
| US001 | POST | /api/iam/roles | ADMIN | Create role |
| US001 | GET | /api/iam/roles | ADMIN | List roles |
| US001 | POST | /api/iam/users | ADMIN | Create user |
| US001 | GET | /api/iam/users | ADMIN | List users |
| US001 | POST | /api/iam/users/{id}/roles | ADMIN | Assign roles |
| US002 | POST | /api/iam/login | Public | Login → JWT |
| US003 | POST | /api/iam/forgot-password | Public | Request reset email |
| US003 | POST | /api/iam/reset-password | Public | Reset with token |
| US003 | POST | /api/iam/change-password | Authenticated | Change password |
| US004 | GET | /api/iam/audit-logs | ADMIN | View audit logs |
| US005 | POST | /api/assets | ADMIN | Register asset |
| US005 | GET | /api/assets | ADMIN | List assets |

## Security Features
- JWT Bearer Token authentication
- BCrypt password hashing
- RBAC with @PreAuthorize("hasRole('ADMIN')")
- Login lockout after 5 failed attempts (US002)
- One-time use + expiring reset tokens (US003)
- Non-disclosure on forgot-password (US003)
- Full audit trail for all key actions (US004)
- Unique serial number enforcement for assets (US005)

See DEMO_GUIDE.md for complete curl examples.
