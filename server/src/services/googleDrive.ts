import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';

export interface DrivePhoto {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
}

export interface DriveFolder {
  id: string;
  name: string;
}

export interface RecentFolder {
  id: string;
  name: string;
  createdTime: string;
}

export interface FolderContents {
  id: string;
  name: string;
  photos: DrivePhoto[];
  folders: DriveFolder[];
}

const FOLDER_MIME = 'application/vnd.google-apps.folder';

function getAuthClient() {
  const scopes = ['https://www.googleapis.com/auth/drive.readonly'];
  const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;

  if (!keyPath) {
    return new google.auth.GoogleAuth({ scopes });
  }

  const resolvedPath = path.isAbsolute(keyPath)
    ? keyPath
    : path.resolve(__dirname, '../../../', keyPath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Service account key file not found: ${resolvedPath}`);
  }

  return new google.auth.GoogleAuth({ keyFile: resolvedPath, scopes });
}

export async function listPhotos(folderId: string): Promise<DrivePhoto[]> {
  const auth = getAuthClient();
  const drive = google.drive({ version: 'v3', auth });

  const photos: DrivePhoto[] = [];
  let pageToken: string | undefined;

  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
      fields: 'nextPageToken, files(id, name, mimeType, thumbnailLink)',
      pageSize: 100,
      pageToken,
    });

    const files = res.data.files ?? [];
    for (const file of files) {
      if (file.id && file.name && file.mimeType) {
        photos.push({
          id: file.id,
          name: file.name,
          mimeType: file.mimeType,
          thumbnailLink: file.thumbnailLink ?? undefined,
        });
      }
    }

    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);

  return photos;
}

export async function listFolderContents(folderId: string): Promise<FolderContents> {
  const auth = getAuthClient();
  const drive = google.drive({ version: 'v3', auth });

  const nameRes = await drive.files.get({ fileId: folderId, fields: 'name' });
  const folderName = nameRes.data.name ?? 'Folder';

  const photos: DrivePhoto[] = [];
  const folders: DriveFolder[] = [];
  let pageToken: string | undefined;

  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false and (mimeType contains 'image/' or mimeType = '${FOLDER_MIME}')`,
      fields: 'nextPageToken, files(id, name, mimeType, thumbnailLink)',
      pageSize: 100,
      pageToken,
      orderBy: 'folder,name',
    });

    for (const file of res.data.files ?? []) {
      if (!file.id || !file.name || !file.mimeType) continue;
      if (file.mimeType === FOLDER_MIME) {
        folders.push({ id: file.id, name: file.name });
      } else {
        photos.push({
          id: file.id,
          name: file.name,
          mimeType: file.mimeType,
          thumbnailLink: file.thumbnailLink ?? undefined,
        });
      }
    }

    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);

  return { id: folderId, name: folderName, photos, folders };
}

export async function listRecentFolders(rootId: string, limit: number): Promise<RecentFolder[]> {
  const auth = getAuthClient();
  const drive = google.drive({ version: 'v3', auth });

  const all: RecentFolder[] = [];
  const queue: string[] = [rootId];

  while (queue.length > 0) {
    const batch = queue.splice(0, queue.length);
    await Promise.all(
      batch.map(async (parentId) => {
        let pageToken: string | undefined;
        do {
          const res = await drive.files.list({
            q: `'${parentId}' in parents and mimeType = '${FOLDER_MIME}' and trashed = false`,
            fields: 'nextPageToken, files(id, name, createdTime)',
            pageSize: 100,
            pageToken,
          });
          for (const f of res.data.files ?? []) {
            if (f.id && f.name && f.createdTime) {
              all.push({ id: f.id, name: f.name, createdTime: f.createdTime });
              queue.push(f.id);
            }
          }
          pageToken = res.data.nextPageToken ?? undefined;
        } while (pageToken);
      })
    );
  }

  return all
    .sort((a, b) => new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime())
    .slice(0, limit);
}

export async function getPhotoStream(fileId: string) {
  const auth = getAuthClient();
  const drive = google.drive({ version: 'v3', auth });

  const res = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'stream' }
  );

  return { stream: res.data, mimeType: res.headers['content-type'] as string };
}

export async function getFileThumbnailLink(fileId: string): Promise<string | null> {
  const auth = getAuthClient();
  const drive = google.drive({ version: 'v3', auth });
  const res = await drive.files.get({ fileId, fields: 'thumbnailLink' });
  return res.data.thumbnailLink ?? null;
}

export async function getThumbnailStream(thumbnailLink: string) {
  const auth = getAuthClient();
  const client = await auth.getClient();
  const res = await (client as any).request({
    url: thumbnailLink,
    responseType: 'stream',
  });
  return { stream: res.data, mimeType: res.headers['content-type'] as string };
}
