import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchRecentFolders } from '../api';
import type { RecentFolder } from '../types';

export function WhatsNew({ onSelect }: { onSelect?: () => void }) {
  const [folders, setFolders] = useState<RecentFolder[]>([]);

  useEffect(() => {
    fetchRecentFolders()
      .then(setFolders)
      .catch(() => {});
  }, []);

  if (folders.length === 0) return null;

  return (
    <div className="whats-new">
      <div className="sidebar__header">What's New</div>
      {folders.map((f) => (
        <Link key={f.id} to={`/folder/${f.id}`} className="whats-new__item" onClick={onSelect}>
          <span className="tree-node__icon">🆕</span>
          <span className="whats-new__name">{f.name}</span>
        </Link>
      ))}
    </div>
  );
}
