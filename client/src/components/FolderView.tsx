import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchFolderContents } from '../api';
import type { FolderContents } from '../types';
import { Gallery } from './Gallery';

export function FolderView() {
  const { folderId } = useParams<{ folderId?: string }>();
  const targetId = folderId ?? 'root';

  const [contents, setContents] = useState<FolderContents | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setContents(null);

    fetchFolderContents(targetId)
      .then(setContents)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [targetId]);

  if (loading) return <div className="gallery-status">Loading…</div>;
  if (error) return <div className="gallery-status gallery-status--error">Error: {error}</div>;
  if (!contents) return null;

  return (
    <div className="folder-view">
      <h2 className="folder-view__title">{contents.name}</h2>
      {contents.photos.length === 0 && contents.folders.length > 0 ? (
        <div className="gallery-status">
          This folder has no photos — pick a subfolder in the sidebar.
        </div>
      ) : (
        <Gallery photos={contents.photos} />
      )}
    </div>
  );
}
