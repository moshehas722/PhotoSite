# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from the repo root unless noted.

```bash
npm run install:all      # First-time install for root + client + server
npm run dev              # Runs client (Vite :5173) and server (Express :3001) concurrently via tsx/Vite watch
npm run build            # tsc for server, then vite build for client

# Type-check without emitting (run per-package):
cd server && npx tsc --noEmit
cd client && npx tsc --noEmit
```

There is **no test suite** and **no linter wired up** at the root. The client was scaffolded by Vite and has an `eslint.config.js`, but no npm script currently invokes it.

## Environment

The backend requires a `.env` file at the **repo root** (not inside `server/`). `dotenv` is loaded with an explicit path from `server/src/index.ts` because `concurrently` sets cwd to the root.

Required vars:
- `GOOGLE_DRIVE_FOLDER_ID` — root Drive folder ID (overridable at runtime via Firestore `config/settings.driveFolderId`)
- `GOOGLE_SERVICE_ACCOUNT_KEY_PATH` — path to service account JSON key; relative paths resolve from the **repo root**
- `GOOGLE_APPLICATION_CREDENTIALS` — alternative to the above; auto-resolved to absolute from repo root
- `SESSION_SECRET` — signs the `__session` cookie (defaults to `dev-secret-change-me` in dev)
- `VITE_GOOGLE_CLIENT_ID` — Google OAuth Web Client ID, **baked into the client bundle at build time** via Vite's `envDir: '..'` (reads the repo-root `.env`)
- `GOOGLE_OAUTH_CLIENT_ID` — server-side token audience for verification (can be comma-separated; falls back to `VITE_GOOGLE_CLIENT_ID`)
- `ADMIN_EMAILS` — comma-separated list of admin email addresses (supplemented by Firestore `config/settings.adminEmails`)
- `RESEND_API_KEY` — Resend API key for email notifications (optional; skips email if unset)
- `EMAIL_FROM` — sender address for emails (default: `noreply@maiphotos.com`)
- `SITE_URL` — used in approval notification links (e.g. `https://photosite-493918.web.app`)
- `CORS_ORIGIN` — allowed CORS origin (default: `http://localhost:5173`)
- `USE_FIRESTORE_SESSIONS=true` — force Firestore session store in dev (auto-enabled in production)
- `PORT` — server port (default: `3001`)

## Architecture

Monorepo with two packages: `client/` (React 19 + Vite + TypeScript) and `server/` (Express + TypeScript, run via `tsx watch`). No workspaces — each package has its own `node_modules`. Vite proxies `/api` → `localhost:3001` in dev; in production Firebase Hosting rewrites `/api/**` to Cloud Run.

### Backend

Express app at `server/src/index.ts`. Key design constraints:
- **Session cookie must be named `__session`** — Firebase Hosting strips all other cookies on Cloud Run rewrites.
- **All `/api` responses carry `Cache-Control: private, no-store`** — prevents Firebase CDN from caching per-user JSON or swallowing `Set-Cookie`.
- **`trust proxy` is enabled in production** — needed for `secure: true` cookies behind Firebase/Cloud Run.
- In production, sessions are stored in Firestore via `FirestoreSessionStore` (`services/sessionStore.ts`). In dev, MemoryStore is used unless `USE_FIRESTORE_SESSIONS=true`.

Routers mounted under `/api`:
- `/auth` — Google OAuth login (`POST /google`), session check (`GET /me`), logout (`POST /logout`)
- `/folders` — `GET /folders/:id` → `{ id, name, photos, folders }`, `:id` accepts `'root'`
- `/photos` — `GET /photos/:id` streams full image; `GET /photos/:id/thumbnail` restreams Drive thumbnail server-side (Drive thumbnail URLs require auth, so the browser can't hit them directly)
- `/transactions` — cart checkout submit, user cancel, admin approve/reject
- `/folder-access` — users request per-folder access; admins approve/reject
- `/admin` — all admin operations; protected by `requireAdmin` middleware (checks `req.session.user.isAdmin`)

### Admin authorization

`isAdminEmail` (`services/admin.ts`) checks `ADMIN_EMAILS` env var first, then `config/settings.adminEmails` in Firestore. Admin emails from env cannot be removed via the admin UI. On every `GET /api/auth/me` call, `isAdmin` and `fullAccess` are re-evaluated from Firestore so changes apply without re-login.

**`fullAccess` flag** — set per-user in Firestore `users/{sub}.fullAccess`. Users with `fullAccess: true` can view and download all photos without going through the cart/purchase flow. Admins always have this.

### Firestore data model

All collections are accessed server-side only; the client never touches Firestore directly.

- `config/settings` — single document storing runtime config: `driveFolderId`, `adminEmails[]`, `aboutContent`, `cartEnabled`, `phone`, `instagram`, `facebook`
- `users/{sub}` — one doc per logged-in user: `email`, `name`, `picture`, `loginCount`, `lastLoginAt`, `fullAccess`
- `sessions/{id}` — Express session docs: `{ session: JSON string, expiresAt: epoch ms }`. TTL-checked lazily on read.
- `transactions/{id}` — photo purchase requests: `{ userSub, userEmail, userName, photoIds[], status: 'pending'|'approved'|'rejected', createdAt, decidedAt?, decidedByEmail?, rejectionNote? }`
- `folderAccessRequests/{id}` — per-folder access requests with the same status shape as transactions, plus `folderId`, `folderName`

### Frontend

- `App.tsx` wraps everything in providers (outermost → innermost): `GoogleOAuthProvider` → `ThemeProvider` → `AuthProvider` → `SiteConfigProvider` → `TransactionsProvider` → `FolderAccessProvider` → `CartProvider` → `FolderHierarchyProvider` → `BrowserRouter`
- Routes: `/` and `/folder/:folderId` → `<FolderView />`, `/purchases` → `<PurchasesView />`, `/admin` → `<AdminView />`, `/about` → `<AboutView />`
- **Folder browsing**: `FolderView` fetches `/api/folders/:id` and renders the photo grid. `Sidebar` lazy-loads children on first expand.
- **Cart**: state persisted to `localStorage` under `photosite.cart`. `CartDrawer.handleCheckout` creates a transaction via `POST /api/transactions`.
- **Folder access**: `FolderAccessContext` tracks `approvedFolderIds` and `pendingFolderIds` for the current user. When a user lacks access to a folder, a "Request access" button appears.
- **Site config**: `SiteConfigContext` fetches `GET /api/config` to get `cartEnabled`. Cart UI is hidden when disabled. Admin users with `fullAccess` also don't see the cart (they can download freely).
- All fetch calls include `credentials: 'include'` so the session cookie is sent.

### Email notifications (Resend)

`services/email.ts` sends two email types:
- Admin notification when a user requests folder access
- User notification when their folder access request is approved (includes a deep link using `SITE_URL`)

Email is fire-and-forget — failures are logged but don't fail the originating request. No emails are sent if `RESEND_API_KEY` is unset.

### Google Drive integration

`services/googleDrive.ts` authenticates via `GoogleAuth`:
- **Dev**: reads JSON key file at `GOOGLE_SERVICE_ACCOUNT_KEY_PATH` (resolved from repo root)
- **Production (Cloud Run)**: no key file — uses Application Default Credentials from the attached service account

The auth client is recreated per call — acceptable at this scale. Do not cache it without understanding token refresh.

### Adding a new backend endpoint

Add the handler to the appropriate router under `server/src/routes/`, mount it in `server/src/index.ts` under `/api/...`, and update the CORS origin there if the client's dev port changes.

## Deployment

Production stack: Firebase Hosting (static SPA) + Cloud Run (`photosite-server`, `us-central1`) + Firestore Native.

```bash
# Deploy server
gcloud run deploy photosite-server --source ./server --region us-central1 --quiet

# Deploy client
cd client && npm run build && cd ..
firebase deploy --only hosting
```

Env vars and secret bindings are retained across redeploys — only restate them to change values.

**Known pitfalls:**
- Do not rename the session cookie away from `__session` — Firebase Hosting strips all others.
- Do not remove `Cache-Control: private, no-store` from `/api` without reasoning about CDN caching of per-user data.
- Do not add a service-account JSON key to the Cloud Run container — ADC supplies credentials via the attached service account.
