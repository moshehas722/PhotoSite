import type { Photo } from './types';

export async function fetchPhotos(): Promise<Photo[]> {
  const res = await fetch('/api/photos');
  if (!res.ok) throw new Error(`Failed to fetch photos: ${res.statusText}`);
  return res.json();
}
