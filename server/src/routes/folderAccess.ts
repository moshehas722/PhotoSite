import { Router, Request, Response } from 'express';
import {
  createFolderAccessRequest,
  listMyFolderAccessRequests,
} from '../services/folderAccess';

export const folderAccessRouter = Router();

folderAccessRouter.post('/', async (req: Request, res: Response) => {
  const user = req.session.user;
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const { folderId, folderName } = (req.body ?? {}) as {
    folderId?: string;
    folderName?: string;
  };
  if (!folderId || typeof folderId !== 'string') {
    res.status(400).json({ error: 'folderId is required' });
    return;
  }
  try {
    const id = await createFolderAccessRequest(user, folderId, (folderName ?? '').trim());
    res.json({ id });
  } catch (err: unknown) {
    if (err instanceof Error && (err as Error & { code?: string }).code === 'DUPLICATE') {
      res.status(409).json({ error: err.message });
      return;
    }
    console.error('Failed to create folder access request:', err);
    res.status(500).json({ error: 'Failed to create folder access request' });
  }
});

folderAccessRouter.get('/mine', async (req: Request, res: Response) => {
  const user = req.session.user;
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  try {
    const requests = await listMyFolderAccessRequests(user.sub);
    res.json({ requests });
  } catch (err) {
    console.error('Failed to list folder access requests:', err);
    res.status(500).json({ error: 'Failed to list folder access requests' });
  }
});
