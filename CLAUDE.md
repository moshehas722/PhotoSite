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

The backend requires a `.env` file at the **repo root** (not inside `server/`). `dotenv` is loaded with an explicit path (`path.resolve(__dirname, '../../.env')` from `server/src/index.ts`) because the working directory when started via `concurrently` is the root.

Required vars (see `.env.example`):
- `GOOGLE_DRIVE_FOLDER_ID` — id of the top-level Drive folder to expose
- `GOOGLE_SERVICE_ACCOUNT_KEY_PATH` — path to the service account JSON key. Relative paths resolve from the **repo root**, not `server/` (see `getAuthClient` in `server/src/services/googleDrive.ts`).

The Drive folder (and any subfolders you want to browse) must be shared with the service account's email as Viewer.

## Architecture

Monorepo with two packages: `client/` (React 19 + Vite + TypeScript) and `server/` (Express + TypeScript, run via `tsx watch`). No workspaces — each package has its own `node_modules`. Vite proxies `/api` → `localhost:3001`, so the client code never hardcodes the backend URL.

### Backend — Google Drive proxy

The server's only job is to authenticate to Drive via a service account and proxy content. Two routers:

- `GET /api/folders/:id` → `{ id, name, photos, folders }`. `:id` accepts `'root'` as an alias that's resolved to `GOOGLE_DRIVE_FOLDER_ID`. Single paginated `drive.files.list` call filters by `mimeType contains 'image/' or mimeType = application/vnd.google-apps.folder`, then splits results. See `listFolderContents` in `server/src/services/googleDrive.ts`.
- `GET /api/photos/:id` → streams full image. `GET /api/photos/:id/thumbnail` → fetches Drive's `thumbnailLink` server-side and restreams it (Drive thumbnail URLs require auth, so the browser can't hit them directly). Thumbnails are resolved via `getFileThumbnailLink(fileId)` — intentionally a per-file lookup so it works for any file regardless of which folder the client is browsing.

All three streaming endpoints are file-id-only (folder-agnostic), which is why subfolder navigation works without changes to the streaming code.

### Frontend — router-driven folder browsing

- `App.tsx` wraps everything in `CartProvider` + `BrowserRouter`. Routes: `/` and `/folder/:folderId` both render `<FolderView />`.
- `FolderView` reads `folderId` from `useParams` (defaulting to `'root'`), fetches `/api/folders/:id`, and passes `photos` to the presentational `<Gallery />`. Gallery owns the lightbox state and renders via `react-masonry-css` + `yet-another-react-lightbox`.
- `Sidebar` renders `<FolderTreeNode folderId="root" defaultExpanded />`. Each node holds its own expanded/children state and **lazy-loads its children** by calling `fetchFolderContents` the first time its chevron is clicked (or on mount for the root). This means deep-linking directly to `/folder/<id>` works, but the sidebar only shows the root + whatever the user has expanded — it does not try to reconstruct the ancestor chain.
- Cart state lives in `client/src/cart/CartContext.tsx`, persisted to `localStorage` under key `photosite.cart`. `PhotoCard` stops click propagation on the cart button so adding to cart doesn't also open the lightbox. Checkout is a stub — `CartDrawer.handleCheckout` just shows "Shopping cart accepted" for 2s, clears the cart, and closes.

### Adding a new backend endpoint

Add the handler to the appropriate router under `server/src/routes/`, mount it in `server/src/index.ts` under `/api/...`, and update the CORS origin there if the client's dev port changes. The service account auth client is recreated on each call in `googleDrive.ts` — cheap enough to not be worth caching for this scale.
