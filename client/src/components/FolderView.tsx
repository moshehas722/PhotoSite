import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchFolderContents } from '../api';
import type { FolderContents } from '../types';
import { Gallery } from './Gallery';
import { useFolderAccess } from '../context/FolderAccessContext';
import { useAuth } from '../auth/AuthContext';
import './FolderView.css';

export function FolderView() {
  const { folderId } = useParams<{ folderId?: string }>();
  const targetId = folderId ?? 'root';
  const { user } = useAuth();
  const { approvedFolderIds, pendingFolderIds, requestAccess, refresh } = useFolderAccess();
  const [requesting, setRequesting] = useState(false);

  const [contents, setContents] = useState<FolderContents | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setContents(null);
    setRequesting(false);
    refresh();

    fetchFolderContents(targetId)
      .then(setContents)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [targetId]); // eslint-disable-line react-hooks/exhaustive-deps

  const isRoot = targetId === 'root';
  const approved = approvedFolderIds.has(targetId);
  const pending = pendingFolderIds.has(targetId);
  const showAccessBtn = user && !user.fullAccess && !isRoot && !approved;

  const handleRequestAccess = async () => {
    if (requesting || pending || !contents) return;
    setRequesting(true);
    try {
      await requestAccess(targetId, contents.name);
    } catch {
      // duplicate — context reflects truth
    } finally {
      setRequesting(false);
    }
  };

  if (loading) return <div className="gallery-status">Loading…</div>;
  if (error) return <div className="gallery-status gallery-status--error">Error: {error}</div>;
  if (!contents) return null;

  return (
    <div className="folder-view">
      <div className="folder-view__header">
        <div className="folder-view__breadcrumb">
          {!isRoot && contents.parentId && contents.parentName && (
            <Link
              to={contents.parentId === 'root' ? '/' : `/folder/${contents.parentId}`}
              className="folder-view__parent-link"
            >
              {contents.parentName}
            </Link>
          )}
        </div>
        <div className="folder-view__title-row">
          <h2 className="folder-view__title">{isRoot ? 'Home' : contents.name}</h2>
        </div>
        {showAccessBtn && (
          pending || requesting ? (
            <span className="folder-view__access-note folder-view__access-note--pending">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {requesting ? 'Requesting…' : 'Access requested — awaiting approval'}
            </span>
          ) : (
            <button
              className="folder-view__access-note folder-view__access-note--btn"
              onClick={() => void handleRequestAccess()}
              title="Request access to download photos in this folder"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Request access to see hi-res version
            </button>
          )
        )}
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
        <Gallery photos={contents.photos} folderId={targetId} />
      )}
    </div>
  );
}
