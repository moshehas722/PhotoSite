import express from 'express';
import cors from 'cors';
import session from 'express-session';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { Firestore } from '@google-cloud/firestore';
import { photosRouter } from './routes/photos';
import { foldersRouter } from './routes/folders';
import { authRouter } from './routes/auth';
import { transactionsRouter } from './routes/transactions';
import { adminRouter } from './routes/admin';
import { getAboutContent, getProfile } from './services/config';
import { FirestoreSessionStore } from './services/sessionStore';

const repoRoot = path.resolve(__dirname, '../..');
const envPath = path.resolve(repoRoot, '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

// Firestore/GoogleAuth resolves GOOGLE_APPLICATION_CREDENTIALS relative to
// process.cwd() (which is `server/` in dev). Match the convention used for
// GOOGLE_SERVICE_ACCOUNT_KEY_PATH and resolve it from the repo root.
if (
  process.env.GOOGLE_APPLICATION_CREDENTIALS &&
  !path.isAbsolute(process.env.GOOGLE_APPLICATION_CREDENTIALS)
) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = path.resolve(
    repoRoot,
    process.env.GOOGLE_APPLICATION_CREDENTIALS
  );
}

const app = express();
const PORT = process.env.PORT ?? 3001;
const isProduction = process.env.NODE_ENV === 'production';
const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:5173';

if (isProduction) {
  app.set('trust proxy', 1);
}

app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());

// Firebase Hosting + Cloud Run: avoid CDN/browser caching of API responses so
// Set-Cookie (login) and cookie-scoped JSON are not served from the wrong cache entry.
app.use('/api', (_req, res, next) => {
  res.set('Cache-Control', 'private, no-store');
  next();
});

const useFirestoreSessions =
  isProduction || process.env.USE_FIRESTORE_SESSIONS === 'true';
const sessionStore = useFirestoreSessions
  ? new FirestoreSessionStore(new Firestore())
  : undefined;

app.use(
  session({
    store: sessionStore,
    name: '__session',
    secret: process.env.SESSION_SECRET ?? 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })
);

app.use('/api/auth', authRouter);
app.use('/api/photos', photosRouter);
app.use('/api/folders', foldersRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/admin', adminRouter);

app.get('/api/profile', async (_req, res) => {
  try {
    res.json(await getProfile());
  } catch (err) {
    console.error('Failed to get profile:', err);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

app.get('/api/about', async (_req, res) => {
  try {
    const content = await getAboutContent();
    res.json({ content });
  } catch (err) {
    console.error('Failed to get about content:', err);
    res.status(500).json({ error: 'Failed to get about content' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
