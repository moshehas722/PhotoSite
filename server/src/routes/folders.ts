import { Router, Request, Response } from 'express';
import { listFolderContents } from '../services/googleDrive';

export const foldersRouter = Router();

const resolveFolderId = (paramId: string): string => {
  if (paramId === 'root') {
    const rootId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!rootId) throw new Error('GOOGLE_DRIVE_FOLDER_ID is not set');
    return rootId;
  }
  return paramId;
};

foldersRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const folderId = resolveFolderId(req.params.id);
    const contents = await listFolderContents(folderId);
    // Strip thumbnailLink before sending (frontend uses /api/photos/:id/thumbnail)
    res.json({
      id: req.params.id === 'root' ? 'root' : contents.id,
      name: contents.name,
      photos: contents.photos.map(({ id, name, mimeType }) => ({ id, name, mimeType })),
      folders: contents.folders,
    });
  } catch (err) {
    console.error('Failed to list folder contents:', err);
    res.status(500).json({ error: 'Failed to list folder contents' });
  }
});
