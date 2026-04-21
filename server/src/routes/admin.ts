import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { requireAdmin, getEnvAdminEmails } from '../services/admin';
import {
  listPendingForAdmin,
  approveTransaction,
  rejectTransaction,
} from '../services/transactions';
import {
  getDriveFolderId, setDriveFolderId, getAboutContent, setAboutContent,
  getAdminEmailList, addAdminEmail, removeAdminEmail,
} from '../services/config';

export const adminRouter = Router();

adminRouter.use(requireAdmin);

adminRouter.get('/transactions/pending', async (_req: Request, res: Response) => {
  try {
    const transactions = await listPendingForAdmin();
    res.json({ transactions });
  } catch (err) {
    console.error('Failed to list pending transactions:', err);
    res.status(500).json({ error: 'Failed to list pending transactions' });
  }
});

adminRouter.post('/transactions/:id/approve', async (req: Request, res: Response) => {
  try {
    await approveTransaction(req.params.id, req.session.user!.email);
    res.json({ ok: true });
  } catch (err) {
    console.error('Failed to approve transaction:', err);
    res.status(500).json({ error: 'Failed to approve transaction' });
  }
});

adminRouter.post('/transactions/:id/reject', async (req: Request, res: Response) => {
  try {
    const { note } = (req.body ?? {}) as { note?: string };
    await rejectTransaction(req.params.id, req.session.user!.email, note);
    res.json({ ok: true });
  } catch (err) {
    console.error('Failed to reject transaction:', err);
    res.status(500).json({ error: 'Failed to reject transaction' });
  }
});

adminRouter.get('/settings', async (_req: Request, res: Response) => {
  try {
    const driveFolderId = await getDriveFolderId().catch(() => '');
    let serviceAccountEmail = '';
    const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;
    if (keyPath) {
      try {
        const resolved = path.isAbsolute(keyPath)
          ? keyPath
          : path.resolve(__dirname, '../../../', keyPath);
        const key = JSON.parse(fs.readFileSync(resolved, 'utf-8')) as { client_email?: string };
        serviceAccountEmail = key.client_email ?? '';
      } catch (e) {
        console.error('Failed to read service account key:', e);
      }
    }
    res.json({ driveFolderId, serviceAccountEmail });
  } catch (err) {
    console.error('Failed to get settings:', err);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

adminRouter.put('/settings', async (req: Request, res: Response) => {
  try {
    const { driveFolderId } = (req.body ?? {}) as { driveFolderId?: string };
    if (!driveFolderId || typeof driveFolderId !== 'string') {
      res.status(400).json({ error: 'driveFolderId is required' });
      return;
    }
    await setDriveFolderId(driveFolderId.trim());
    res.json({ ok: true });
  } catch (err) {
    console.error('Failed to save settings:', err);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

adminRouter.get('/administrators', async (req: Request, res: Response) => {
  try {
    const envEmails = getEnvAdminEmails();
    const firestoreEmails = await getAdminEmailList();
    const admins = [
      ...envEmails.map((email) => ({ email, source: 'env' as const })),
      ...firestoreEmails
        .filter((e) => !envEmails.includes(e))
        .map((email) => ({ email, source: 'firestore' as const })),
    ];
    res.json({ admins });
  } catch (err) {
    console.error('Failed to list administrators:', err);
    res.status(500).json({ error: 'Failed to list administrators' });
  }
});

adminRouter.post('/administrators', async (req: Request, res: Response) => {
  try {
    const { email } = (req.body ?? {}) as { email?: string };
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      res.status(400).json({ error: 'Valid email is required' });
      return;
    }
    await addAdminEmail(email.trim().toLowerCase());
    res.json({ ok: true });
  } catch (err) {
    console.error('Failed to add administrator:', err);
    res.status(500).json({ error: 'Failed to add administrator' });
  }
});

adminRouter.delete('/administrators/:email', async (req: Request, res: Response) => {
  try {
    const email = decodeURIComponent(req.params.email).toLowerCase().trim();
    const currentUserEmail = req.session.user!.email.toLowerCase();
    if (email === currentUserEmail) {
      res.status(400).json({ error: 'Cannot remove yourself as administrator' });
      return;
    }
    if (getEnvAdminEmails().includes(email)) {
      res.status(400).json({ error: 'Cannot remove env-configured administrators' });
      return;
    }
    await removeAdminEmail(email);
    res.json({ ok: true });
  } catch (err) {
    console.error('Failed to remove administrator:', err);
    res.status(500).json({ error: 'Failed to remove administrator' });
  }
});

adminRouter.put('/about', async (req: Request, res: Response) => {
  try {
    const { content } = (req.body ?? {}) as { content?: string };
    if (typeof content !== 'string') {
      res.status(400).json({ error: 'content is required' });
      return;
    }
    await setAboutContent(content);
    res.json({ ok: true });
  } catch (err) {
    console.error('Failed to save about content:', err);
    res.status(500).json({ error: 'Failed to save about content' });
  }
});
