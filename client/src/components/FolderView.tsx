import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchFolderContents } from '../api';
import type { FolderContents } from '../types';
import { Gallery } from './Gallery';
import { useFolderAccess } from '../context/FolderAccessContext';
import { useFolderHierarchy } from '../context/FolderHierarchyContext';
import { useAuth } from '../auth/AuthContext';
import { HomeIcon } from '../icons/HomeIcon';
import './FolderView.css';

export function FolderView() {
  const { folderId } = useParams<{ folderId?: string }>();
  const targetId = folderId ?? 'root';
  const { user, guestMode, exitGuestMode } = useAuth();
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

  const { getParent } = useFolderHierarchy();

  const isRoot = targetId === 'root';
  const approved = approvedFolderIds.has(targetId);
  const pending = pendingFolderIds.has(targetId);
  const showAccessBtn = user && !user.fullAccess && !isRoot && !approved;

  type Crumb = { id: string | null; name: string };
  const crumbs = useMemo<Crumb[]>(() => {
    if (isRoot || !contents) return [{ id: null, name: 'Home' }];
    const result: Crumb[] = [{ id: null, name: contents.name }];
    let id = targetId;
    let usedApiFallback = false;
    for (let depth = 0; depth < 8; depth++) {
      const parent = getParent(id);
      if (parent) {
        if (parent.parentId === 'root') { result.unshift({ id: 'root', name: 'Home' }); break; }
        result.unshift({ id: parent.parentId, name: parent.parentName });
        id = parent.parentId;
      } else if (!usedApiFallback && id === targetId && contents.parentId) {
        usedApiFallback = true;
        if (contents.parentId === 'root') { result.unshift({ id: 'root', name: 'Home' }); break; }
        result.unshift({ id: contents.parentId, name: contents.parentName ?? '' });
        id = contents.parentId;
      } else {
        result.unshift({ id: 'root', name: 'Home' }); break;
      }
    }
    return result;
  }, [isRoot, targetId, contents, getParent]);

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
        <nav className="folder-view__breadcrumbs" aria-label="breadcrumb">
          {crumbs.map((crumb, i) => (
            <span key={crumb.id ?? 'current'} className="folder-view__breadcrumb-item">
              {i > 0 && <span className="folder-view__breadcrumb-sep">›</span>}
              {crumb.id === null ? (
                <span className="folder-view__breadcrumb-current">
                  {isRoot ? <HomeIcon /> : crumb.name}
                </span>
              ) : (
                <Link
                  to={crumb.id === 'root' ? '/' : `/folder/${crumb.id}`}
                  className="folder-view__breadcrumb-link"
                  aria-label={crumb.id === 'root' ? 'Home' : undefined}
                >
                  {crumb.id === 'root' ? <HomeIcon /> : crumb.name}
                </Link>
              )}
            </span>
          ))}
        </nav>
        {guestMode && !isRoot && (
          <button
            className="folder-view__access-note folder-view__access-note--btn"
            onClick={exitGuestMode}
            title="Sign in to request hi-res access"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Login to request hi-res
          </button>
        )}
        {!guestMode && showAccessBtn && (
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
        {contents.photos.length > 0 && contents.folders.length > 0 && (
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
        <div className="subfolder-grid">
          {contents.folders.map((folder) => (
            <Link
              key={folder.id}
              to={`/folder/${folder.id}`}
              className="subfolder-tile"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="subfolder-tile__icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <span className="subfolder-tile__name">{folder.name}</span>
            </Link>
          ))}
        </div>
      ) : (
        <Gallery photos={contents.photos} folderId={targetId} />
      )}
    </div>
  );
}
