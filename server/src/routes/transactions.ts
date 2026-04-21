import { Router, Request, Response } from 'express';
import {
  createTransaction,
  listMyTransactions,
  TransactionStatus,
} from '../services/transactions';

export const transactionsRouter = Router();

function requireUser(req: Request, res: Response): Express.Request['session']['user'] | null {
  const user = req.session.user;
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return null;
  }
  return user;
}

transactionsRouter.post('/', async (req: Request, res: Response) => {
  const user = requireUser(req, res);
  if (!user) return;
  try {
    const { photoIds } = req.body as { photoIds?: unknown };
    if (
      !Array.isArray(photoIds) ||
      photoIds.length === 0 ||
      photoIds.some((id) => typeof id !== 'string')
    ) {
      res.status(400).json({ error: 'photoIds must be a non-empty array of strings' });
      return;
    }
    const transactionId = await createTransaction(user, photoIds as string[]);
    res.json({ transactionId });
  } catch (err) {
    console.error('Failed to create transaction:', err);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

transactionsRouter.get('/mine', async (req: Request, res: Response) => {
  const user = requireUser(req, res);
  if (!user) return;
  const status = req.query.status as TransactionStatus | undefined;
  if (status !== 'pending' && status !== 'approved' && status !== 'rejected') {
    res.status(400).json({ error: 'status must be pending|approved|rejected' });
    return;
  }
  try {
    const transactions = await listMyTransactions(user.sub, status);
    res.json({ transactions });
  } catch (err) {
    console.error('Failed to list transactions:', err);
    res.status(500).json({ error: 'Failed to list transactions' });
  }
});
