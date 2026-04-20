import { Router, Request, Response } from 'express';
import { listPhotos, getPhotoStream, getThumbnailStream } from '../services/googleDrive';

export const photosRouter = Router();

const getFolderId = (): string => {
  const id = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!id) throw new Error('GOOGLE_DRIVE_FOLDER_ID is not set');
  return id;
};

photosRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const photos = await listPhotos(getFolderId());
    res.json(photos.map(({ id, name, mimeType }) => ({ id, name, mimeType })));
  } catch (err) {
    console.error('Failed to list photos:', err);
    res.status(500).json({ error: 'Failed to list photos' });
  }
});

photosRouter.get('/:id/thumbnail', async (req: Request, res: Response) => {
  try {
    const photos = await listPhotos(getFolderId());
    const photo = photos.find((p) => p.id === req.params.id);

    if (!photo) {
      res.status(404).json({ error: 'Photo not found' });
      return;
    }

    if (!photo.thumbnailLink) {
      // Fall back to full image if no thumbnail
      const { stream, mimeType } = await getPhotoStream(req.params.id);
      res.setHeader('Content-Type', mimeType ?? 'image/jpeg');
      stream.pipe(res);
      return;
    }

    const { stream, mimeType } = await getThumbnailStream(photo.thumbnailLink);
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
