import { Router, Request, Response } from 'express';
import { recordPurchases, listPurchasedPhotoIds } from '../services/purchases';

export const purchasesRouter = Router();

function requireUser(req: Request, res: Response): string | null {
  const sub = req.session.user?.sub;
  if (!sub) {
    res.status(401).json({ error: 'Not authenticated' });
    return null;
  }
  return sub;
}

purchasesRouter.post('/', async (req: Request, res: Response) => {
  const userSub = requireUser(req, res);
  if (!userSub) return;
  try {
    const { photoIds } = req.body as { photoIds?: unknown };
    if (!Array.isArray(photoIds) || photoIds.some((id) => typeof id !== 'string')) {
      res.status(400).json({ error: 'photoIds must be an array of strings' });
      return;
    }
    const count = await recordPurchases(userSub, photoIds as string[]);
    res.json({ count });
  } catch (err) {
    console.error('Failed to record purchases:', err);
    res.status(500).json({ error: 'Failed to record purchases' });
  }
});

purchasesRouter.get('/', async (req: Request, res: Response) => {
  const userSub = requireUser(req, res);
  if (!userSub) return;
  try {
    const photoIds = await listPurchasedPhotoIds(userSub);
    res.json({ photoIds });
  } catch (err) {
    console.error('Failed to list purchases:', err);
    res.status(500).json({ error: 'Failed to list purchases' });
  }
});
