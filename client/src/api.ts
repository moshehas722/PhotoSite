import type { FolderContents } from './types';

export async function fetchFolderContents(folderId: string): Promise<FolderContents> {
  const res = await fetch(`/api/folders/${encodeURIComponent(folderId)}`);
  if (!res.ok) throw new Error(`Failed to fetch folder: ${res.statusText}`);
  return res.json();
}
