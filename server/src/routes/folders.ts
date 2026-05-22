import { Router, Request, Response } from 'express';
import { listFolderContents, listRecentFolders, buildFolderTree } from '../services/googleDrive';
import { getDriveFolderId } from '../services/config';

export const foldersRouter = Router();


foldersRouter.get('/tree', async (_req: Request, res: Response) => {
  try {
    const rootId = await getDriveFolderId();
    const tree = await buildFolderTree(rootId);
    // Use the 'root' alias for the root node to match URL convention
    tree.id = 'root';
    res.json(tree);
  } catch (err) {
    console.error('Failed to build folder tree:', err);
    res.status(500).json({ error: 'Failed to build folder tree' });
  }
});

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
    const rootId = await getDriveFolderId();
    const folderId = req.params.id === 'root' ? rootId : req.params.id;
    const contents = await listFolderContents(folderId);
    // Normalise parent: if the real Drive root is the parent, expose it as 'root'
    const parentId = contents.parentId === rootId ? 'root' : contents.parentId;
    res.json({
      id: req.params.id === 'root' ? 'root' : contents.id,
      name: contents.name,
      photos: contents.photos.map(({ id, name, mimeType }) => ({ id, name, mimeType })),
      folders: contents.folders,
      parentId,
      parentName: contents.parentName,
    });
  } catch (err) {
    console.error('Failed to list folder contents:', err);
    res.status(500).json({ error: 'Failed to list folder contents' });
  }
});
