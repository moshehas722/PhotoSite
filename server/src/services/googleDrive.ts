import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';

export interface DrivePhoto {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
}

function getAuthClient() {
  const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;
  if (!keyPath) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY_PATH is not set');

  const resolvedPath = path.isAbsolute(keyPath)
    ? keyPath
    : path.resolve(__dirname, '../../../', keyPath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Service account key file not found: ${resolvedPath}`);
  }

  return new google.auth.GoogleAuth({
    keyFile: resolvedPath,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
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

export async function getPhotoStream(fileId: string) {
  const auth = getAuthClient();
  const drive = google.drive({ version: 'v3', auth });

  const res = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'stream' }
  );

  return { stream: res.data, mimeType: res.headers['content-type'] as string };
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
