import { Router, Request, Response } from 'express';
import {
  getPhotoStream,
  getThumbnailStream,
  getFileThumbnailLink,
} from '../services/googleDrive';
import { hasPurchased } from '../services/transactions';

export const photosRouter = Router();

photosRouter.get('/:id/thumbnail', async (req: Request, res: Response) => {
  try {
    const thumbnailLink = await getFileThumbnailLink(req.params.id);

    if (!thumbnailLink) {
      const { stream, mimeType } = await getPhotoStream(req.params.id);
      res.setHeader('Content-Type', mimeType ?? 'image/jpeg');
      stream.pipe(res);
      return;
    }

    const { stream, mimeType } = await getThumbnailStream(thumbnailLink);
    res.setHeader('Content-Type', mimeType ?? 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    stream.pipe(res);
  } catch (err) {
    console.error('Failed to get thumbnail:', err);
    res.status(500).json({ error: 'Failed to get thumbnail' });
  }
});

photosRouter.get('/:id/full', async (req: Request, res: Response) => {
  const userSub = req.session.user?.sub;
  if (!userSub) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  try {
    const owned = await hasPurchased(userSub, req.params.id);
    if (!owned) {
      res.status(403).json({ error: 'Photo not purchased' });
      return;
    }
    const { stream, mimeType } = await getPhotoStream(req.params.id);
    res.setHeader('Content-Type', mimeType ?? 'image/jpeg');
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.setHeader('Content-Disposition', `attachment; filename="photo-${req.params.id}.jpg"`);
    stream.pipe(res);
  } catch (err) {
    console.error('Failed to stream full photo:', err);
    res.status(500).json({ error: 'Failed to stream photo' });
  }
});
