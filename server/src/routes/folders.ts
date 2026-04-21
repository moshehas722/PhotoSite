import { Router, Request, Response } from 'express';
import { listFolderContents, listRecentFolders } from '../services/googleDrive';
import { getDriveFolderId } from '../services/config';

export const foldersRouter = Router();

const resolveFolderId = async (paramId: string): Promise<string> => {
  if (paramId === 'root') return getDriveFolderId();
  return paramId;
};

foldersRouter.get('/recent', async (_req: Request, res: Response) => {
  try {
    const rootId = await getDriveFolderId();
    const folders = await listRecentFolders(rootId, 3);
    res.json({ folders });
  } catch (err) {
    console.error('Failed to list recent folders:', err);
    res.status(500).json({ error: 'Failed to list recent folders' });
  }
});

foldersRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const folderId = await resolveFolderId(req.params.id);
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
