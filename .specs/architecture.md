# Architecture

## Overview

Monorepo with two packages, no workspaces:

```
client/   React 19 + Vite + TypeScript (static SPA)
server/   Express + TypeScript (API, runs via tsx in dev, node in prod)
```

Vite proxies `/api` to `localhost:3001` in dev. In production Firebase Hosting rewrites `/api/**` to Cloud Run so the browser sees a same-origin API.

## Client

- React Router: `/`, `/folder/:folderId`, `/purchases`.
- Context providers (nested in this order, outermost first): `GoogleOAuthProvider` → `AuthProvider` → `PurchasesProvider` → `CartProvider` → `BrowserRouter`.
  - `PurchasesProvider` must be inside `AuthProvider` (it reads `useAuth()` to refetch on login).
  - `CartProvider` must be inside `AuthProvider` (it clears the cart on logout).
- Folder browsing: `FolderView` fetches `GET /api/folders/:id` and renders the photo grid + subfolder tiles. The `Sidebar` renders a `FolderTreeNode` recursively; each node lazy-loads on first expand.
- Cart state is persisted to `localStorage` under `photosite.cart`. Purchases state is derived from `GET /api/purchases` on login and cached in memory (not persisted).
- All auth'd fetches include `credentials: 'include'` so the session cookie is sent.
- `VITE_GOOGLE_CLIENT_ID` is baked into the client bundle at build time via Vite's `envDir: '..'` (reads the repo-root `.env`).

## Server

- Express app, entry `server/src/index.ts`. No middleware framework beyond vanilla Express + `express-session` + `cors`.
- Routers mounted under `/api`: `authRouter` (`/auth`), `foldersRouter` (`/folders`), `photosRouter` (`/photos`), `purchasesRouter` (`/purchases`).
- `dotenv` loads from the repo-root `.env` only if the file exists (production reads env vars and secrets directly from Cloud Run).
- Session middleware uses cookie name `__session`. This is required by Firebase Hosting, which strips all cookies *except* `__session` on its Cloud Run rewrites. In production, sessions are stored in Firestore via a custom `FirestoreSessionStore`. In dev, the default MemoryStore is used.
- `trust proxy` is enabled in production so Express honors `X-Forwarded-Proto: https` from Firebase/Cloud Run (needed for `secure: true` cookies to be set).
- API responses carry `Cache-Control: private, no-store` to prevent Firebase Hosting or the browser from caching cookie-scoped JSON or swallowing `Set-Cookie` headers.

## Google Drive integration

- `server/src/services/googleDrive.ts` authenticates to Drive via `GoogleAuth`.
  - In production (Cloud Run): no key file — uses Application Default Credentials supplied by the attached service account.
  - In dev: reads a JSON key file whose path is `GOOGLE_SERVICE_ACCOUNT_KEY_PATH` (resolved relative to the repo root).
- `listFolderContents(folderId)` does a single paginated `drive.files.list` call filtering by `mimeType contains 'image/' or mimeType = folder`, then splits the results.
- Photo streaming endpoints (`/api/photos/:id/thumbnail`, `/api/photos/:id/full`) are file-id-only — they work for any Drive file the service account can read, regardless of which folder the client is browsing.
- Thumbnails (220px) are fetched via Drive's `thumbnailLink` (auth'd) and restreamed by the server. The browser never hits Drive directly.

## Purchases

- `server/src/services/purchases.ts` wraps a single Firestore collection, `purchases`.
- Document schema: `{ userSub, photoId, purchasedAt: Timestamp }`, doc ID = `${userSub}_${photoId}` for idempotent writes.
- `POST /api/purchases` writes a batch of docs.
- `GET /api/purchases` returns `{ photoIds: string[] }` for the signed-in user.
- `GET /api/photos/:id/full` checks `hasPurchased(userSub, photoId)` before streaming; returns 403 otherwise. 401 if not signed in.
- There is no payment processing. The `POST /api/purchases` handler simply records the purchase. If Stripe is added, the write moves into a webhook handler; the schema and gating stay the same.

## Auth flow

- Client uses `@react-oauth/google` (`GoogleLogin` button + `useGoogleOneTapLogin`). On success it receives a Google ID token (JWT).
- Client posts the token to `POST /api/auth/google`. The server verifies it with `OAuth2Client.verifyIdToken`, supporting multiple allowed audiences (comma-separated in `GOOGLE_OAUTH_CLIENT_ID` / `VITE_GOOGLE_CLIENT_ID`).
- On success the server stores `{ sub, email, name, picture }` in `req.session.user`. Subsequent requests are authenticated via the `__session` cookie.
- `GET /api/auth/me` returns the current session user (or `null`). `POST /api/auth/logout` destroys the session.

## Data stores

- **Google Drive** — source of truth for photos and folder structure. Read-only, shared with the service account as Viewer.
- **Firestore (Native mode, `us-central1`)** — two collections:
  - `sessions` — Express session docs keyed by session ID. TTL-checked on read.
  - `purchases` — one doc per (user, photo) pair.

## Type-checking

No test suite. No linter wired up at the root. Type-check per package:

```bash
cd server && npx tsc --noEmit
cd client && npx tsc --noEmit
```
