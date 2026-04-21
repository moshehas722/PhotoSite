# Deployment (Google Cloud Platform)

## Topology

```
Browser
  │
  └─ https://photosite-493918.web.app
       │
       ├─ Static SPA (HTML/JS/CSS)         ← Firebase Hosting
       │
       └─ /api/**  rewrite                 ← Firebase Hosting → Cloud Run
            │
            └─ Express server              ← Cloud Run (photosite-server, us-central1)
                 │
                 ├─ Google Drive API        (service account, attached to Cloud Run)
                 └─ Firestore Native        (sessions + purchases collections)
```

## Project

- **GCP Project ID**: `photosite-493918`
- **Region**: `us-central1` for Cloud Run and Firestore
- **Firebase project**: same GCP project, added via `firebase projects:addfirebase`
- **Hosting URL**: `https://photosite-493918.web.app` (plus `*.firebaseapp.com` alias)

## Service account

A single service account runs everything:
`photosite-drive-service@photosite-493918.iam.gserviceaccount.com`

Roles:
- **Google Drive** — shared as Viewer on the target Drive folder (done in Drive UI, not IAM)
- `roles/datastore.user` — read/write Firestore
- `roles/secretmanager.secretAccessor` — granted per-secret, not project-wide

This service account is attached to the Cloud Run service via `--service-account`. No JSON key file exists in production — the Drive/Firestore clients use Application Default Credentials supplied by the runtime.

## Enabled APIs

```
run.googleapis.com
cloudbuild.googleapis.com
artifactregistry.googleapis.com
secretmanager.googleapis.com
firebasehosting.googleapis.com
iamcredentials.googleapis.com
firestore.googleapis.com
```

## Secrets (Secret Manager)

- `session-secret` — 32-byte hex random string, signs the session cookie
- `google-oauth-client-id` — the Google OAuth Web Client ID used to verify ID tokens

Each is granted `roles/secretmanager.secretAccessor` to the service account above. Cloud Run mounts both as env vars via `--set-secrets`.

## Cloud Run service

- **Service ID**: `photosite-server`
- **Build**: `gcloud run deploy --source ./server` — Cloud Build picks up `server/Dockerfile` (Node 20 slim, multi-stage: tsc build → runtime copy).
- **Env vars** (plaintext via `--set-env-vars`):
  - `GOOGLE_DRIVE_FOLDER_ID` — the root Drive folder
  - `NODE_ENV=production`
- **Secrets** (via `--set-secrets`):
  - `SESSION_SECRET=session-secret:latest`
  - `GOOGLE_OAUTH_CLIENT_ID=google-oauth-client-id:latest`
- **Auth**: `--allow-unauthenticated` — the service is public; auth is enforced in-app via the session cookie.
- **Session affinity**: enabled (`--session-affinity`). Not strictly required now that sessions are in Firestore, but harmless.

## Firestore

- **Mode**: Native
- **Location**: `us-central1`
- **Collections**:
  - `sessions` — Express session docs. Schema: `{ session: string (JSON), expiresAt: number (epoch ms) }`. Read path deletes expired docs lazily.
  - `purchases` — one doc per (user, photo). ID: `${userSub}_${photoId}`. Fields: `{ userSub, photoId, purchasedAt }`.

No security rules are configured; Firestore is accessed server-side only, authenticated via the Cloud Run service account. The client never talks to Firestore directly.

## Firebase Hosting

- **Public dir**: `client/dist` (output of `vite build`)
- **Rewrites** (see `firebase.json`):
  - `/api/**` → Cloud Run service `photosite-server` in `us-central1`
  - `**` → `/index.html` (SPA fallback)
- **Important**: Firebase Hosting strips all cookies on Cloud Run rewrites *except* the one named `__session`. The Express session middleware is configured with `name: '__session'` for this reason. API responses are also served with `Cache-Control: private, no-store` to prevent Firebase/browser caches from serving wrong-user data or swallowing `Set-Cookie` headers.

## OAuth client

A single OAuth 2.0 Web Client in GCP Console → APIs & Services → Credentials:
- **Authorized JavaScript origins**:
  - `http://localhost:5173` (dev)
  - `https://photosite-493918.web.app`
  - `https://photosite-493918.firebaseapp.com`

Same client ID is used for both the client (as `VITE_GOOGLE_CLIENT_ID`, baked into the bundle) and the server (as `GOOGLE_OAUTH_CLIENT_ID`, for token audience verification).

## Deploy commands

From the repo root:

**Server:**
```
gcloud run deploy photosite-server --source ./server --region us-central1 --quiet
```
Env vars and secret bindings are retained across redeploys — only restate them if you want to change them.

**Client:**
```
cd client && npm run build && cd ..
firebase deploy --only hosting
```

**First-time setup** (already done for this project):

```bash
# 1. Enable APIs
gcloud services enable run.googleapis.com cloudbuild.googleapis.com \
  artifactregistry.googleapis.com secretmanager.googleapis.com \
  firebasehosting.googleapis.com iamcredentials.googleapis.com firestore.googleapis.com

# 2. Create secrets
printf '%s' "$(openssl rand -hex 32)" | gcloud secrets create session-secret --data-file=-
printf '%s' "<oauth-client-id>" | gcloud secrets create google-oauth-client-id --data-file=-

# 3. Grant secret access to the service account
SA=photosite-drive-service@photosite-493918.iam.gserviceaccount.com
gcloud secrets add-iam-policy-binding session-secret \
  --member="serviceAccount:$SA" --role=roles/secretmanager.secretAccessor
gcloud secrets add-iam-policy-binding google-oauth-client-id \
  --member="serviceAccount:$SA" --role=roles/secretmanager.secretAccessor

# 4. Grant Firestore access
gcloud projects add-iam-policy-binding photosite-493918 \
  --member="serviceAccount:$SA" --role=roles/datastore.user

# 5. Create Firestore DB
gcloud firestore databases create --location=us-central1 --type=firestore-native

# 6. Associate Firebase with the GCP project
firebase projects:addfirebase photosite-493918

# 7. First Cloud Run deploy (also creates the service)
gcloud run deploy photosite-server --source ./server --region us-central1 \
  --service-account "$SA" \
  --set-env-vars "GOOGLE_DRIVE_FOLDER_ID=<folder-id>,NODE_ENV=production" \
  --set-secrets "SESSION_SECRET=session-secret:latest,GOOGLE_OAUTH_CLIENT_ID=google-oauth-client-id:latest" \
  --allow-unauthenticated --quiet

# 8. First hosting deploy
cd client && npm run build && cd ..
firebase deploy --only hosting
```

## Cost

Everything is on free-tier quotas:
- **Cloud Run**: 2M requests/month, 360k GB-s, 180k vCPU-s. Scales to zero when idle → 1–2s cold start on first request after idle period.
- **Firebase Hosting**: 10 GB storage, 360 MB/day egress.
- **Firestore**: 1 GB storage, 50k reads + 20k writes + 20k deletes per day.
- **Secret Manager**: 6 active secrets + 10k access ops/month free.
- **Cloud Build**: 120 build-minutes/day free.

Watch egress if the site gets popular — both Cloud Run and Firebase Hosting charge per GB beyond free-tier egress.

## Logs and debugging

```bash
# Cloud Run logs
gcloud run services logs read photosite-server --region us-central1 --limit 50

# Firestore from console
# https://console.cloud.google.com/firestore/databases/-default-/data/panel?project=photosite-493918
```

## Known pitfalls (for future editors)

- **Do not rename the session cookie** away from `__session`. Firebase Hosting strips every other name.
- **Do not remove `Cache-Control: private, no-store` from `/api`** without carefully reasoning about per-user data being served from CDN cache.
- **Do not cache the `GoogleAuth` client** across requests without understanding token refresh — the current code recreates it per call, which is fine at this scale.
- **Do not add a JSON service-account key file to the container**. Cloud Run provides credentials via the attached service account; the code falls back to that when `GOOGLE_SERVICE_ACCOUNT_KEY_PATH` is unset.
