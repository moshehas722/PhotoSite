import { Router, Request, Response } from 'express';
import {
  getPhotoStream,
  getThumbnailStream,
  getFileThumbnailLink,
} from '../services/googleDrive';

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

photosRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { stream, mimeType } = await getPhotoStream(req.params.id);
    res.setHeader('Content-Type', mimeType ?? 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    stream.pipe(res);
  } catch (err) {
    console.error('Failed to stream photo:', err);
    res.status(500).json({ error: 'Failed to stream photo' });
  }
});
