import { Router, Request, Response } from 'express';
import {
  cancelPendingTransaction,
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

/** Firestore doc IDs may appear URL-encoded when taken from paths; trim whitespace from clients. */
function normalizeTransactionId(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  try {
    const trimmed = decodeURIComponent(raw.trim());
    return trimmed.length > 0 ? trimmed : null;
  } catch {
    return null;
  }
}

async function respondCancel(
  res: Response,
  id: string,
  userSub: string,
  userEmail: string
): Promise<void> {
  try {
    const result = await cancelPendingTransaction(id, userSub, userEmail);
    if (!result.ok) {
      const status =
        result.reason === 'not_found'
          ? 404
          : result.reason === 'forbidden'
            ? 403
            : 409;
      const message =
        result.reason === 'not_found'
          ? 'Transaction not found'
          : result.reason === 'forbidden'
            ? 'Not allowed'
            : 'Transaction is no longer pending';
      res.status(status).json({ error: message });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('Failed to cancel transaction:', err);
    res.status(500).json({ error: 'Failed to cancel transaction' });
  }
}

/** Mounted on `app` in index.ts so POST /api/transactions/cancel always hits session + handler (see Router quirks). */
export async function handleCancelTransactionBody(req: Request, res: Response): Promise<void> {
  const user = requireUser(req, res);
  if (!user) return;
  const id = normalizeTransactionId((req.body as { id?: unknown })?.id);
  if (!id) {
    res.status(400).json({ error: 'id is required' });
    return;
  }
  await respondCancel(res, id, user.sub, user.email);
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

transactionsRouter.post('/:id/cancel', async (req: Request, res: Response) => {
  const user = requireUser(req, res);
  if (!user) return;
  const id = normalizeTransactionId(req.params.id);
  if (!id) {
    res.status(400).json({ error: 'Invalid transaction id' });
    return;
  }
  await respondCancel(res, id, user.sub, user.email);
});
