# UtiliTrack IAM — React Frontend

## Modules Covered
| Story | Description |
|-------|-------------|
| US001 | User Role Management |
| US002 | Secure Login / Password Reset |
| US004 | Audit Logs |
| US005 | Asset Registry |
| US010 | Crew Assignment |
| US011 | Work Log |

---

## Prerequisites
- Node.js 18+
- npm 9+
- UtiliTrack IAM Spring Boot backend running on **port 8081**

---

## Setup Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Backend URL
The app proxies to `http://localhost:8081` (set in `package.json`).

If your backend runs on a different port, edit `src/services/api.js`:
```js
const BASE_URL = 'http://localhost:YOUR_PORT/api';
```

### 3. Start the App
```bash
npm start
```
Opens at **http://localhost:3000**

---

## Pages

| Route | Page | User Story |
|-------|------|-----------|
| /login | Login / Password Reset | US002 |
| /dashboard | Overview stats + recent activity | — |
| /users | User & role management (CRUD + assign roles) | US001 |
| /assets | Asset registry (CRUD) | US005 |
| /crews | Crew management (CRUD + assign members) | US010 |
| /work-logs | Work log management | US011 |
| /audit-logs | Full audit trail with search/filter | US004 |

---

## Notes
- JWT token is stored in `localStorage` under key `iam_token`
- All API calls automatically include `Authorization: Bearer <token>`
- 401 responses auto-redirect to `/login`
- The app proxies `/api/*` calls to `http://localhost:8081`
