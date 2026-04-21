import express from 'express';
import cors from 'cors';
import session from 'express-session';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { photosRouter } from './routes/photos';
import { foldersRouter } from './routes/folders';
import { authRouter } from './routes/auth';

const envPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
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
app.use(
  session({
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
