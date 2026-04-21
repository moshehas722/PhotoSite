import { Router, Request, Response } from 'express';
import { requireAdmin } from '../services/admin';
import {
  listPendingForAdmin,
  approveTransaction,
  rejectTransaction,
} from '../services/transactions';

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
