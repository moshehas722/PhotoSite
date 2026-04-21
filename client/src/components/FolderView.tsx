import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchFolderContents } from '../api';
import type { FolderContents } from '../types';
import { Gallery } from './Gallery';
import { useFolderHierarchy } from '../context/FolderHierarchyContext';
import './FolderView.css';

export function FolderView() {
  const { folderId } = useParams<{ folderId?: string }>();
  const targetId = folderId ?? 'root';
  const { getParent } = useFolderHierarchy();
  const parent = targetId !== 'root' ? getParent(targetId) : null;

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
      <div className="folder-view__header">
        <div className="folder-view__breadcrumb">
          {parent && (
            <Link
              to={parent.parentId === 'root' ? '/' : `/folder/${parent.parentId}`}
              className="folder-view__parent-link"
            >
              {parent.parentName}
            </Link>
          )}
        </div>
        <h2 className="folder-view__title">{targetId === 'root' ? 'Home' : contents.name}</h2>
        {contents.folders.length > 0 && (
          <div className="folder-view__subfolders">
            {contents.folders.map((folder) => (
              <Link
                key={folder.id}
                to={`/folder/${folder.id}`}
                className="folder-view__subfolder-link"
              >
                {folder.name}
              </Link>
            ))}
          </div>
        )}
      </div>
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
