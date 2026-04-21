import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { fetchFolderContents } from '../api';
import type { Folder } from '../types';

interface Props {
  folderId: string;
  name: string;
  depth: number;
  defaultExpanded?: boolean;
  onSelect?: () => void;
}

export function FolderTreeNode({ folderId, name, depth, defaultExpanded = false, onSelect }: Props) {
  const location = useLocation();
  const pathParts = location.pathname.split('/');
  const currentId = pathParts[2];
  const activeId = currentId ?? 'root';

  const [expanded, setExpanded] = useState(defaultExpanded);
  const [children, setChildren] = useState<Folder[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasNoChildren, setHasNoChildren] = useState(false);

  const loadChildren = async () => {
    if (children !== null || loading) return;
    setLoading(true);
    try {
      const data = await fetchFolderContents(folderId);
      setChildren(data.folders);
      if (data.folders.length === 0) setHasNoChildren(true);
    } catch (err) {
      console.error('Failed to load folder children:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (defaultExpanded) void loadChildren();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!expanded) void loadChildren();
    setExpanded(!expanded);
  };

  const isActive = folderId === activeId;
  const linkTo = folderId === 'root' ? '/' : `/folder/${folderId}`;

  return (
    <div className="tree-node">
      <div
        className={`tree-node__row ${isActive ? 'tree-node__row--active' : ''}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        <button
          className="tree-node__chevron"
          onClick={toggle}
          aria-label={expanded ? 'Collapse' : 'Expand'}
          disabled={hasNoChildren}
        >
          {hasNoChildren ? '·' : expanded ? '▾' : '▸'}
        </button>
        <Link to={linkTo} className="tree-node__link" onClick={onSelect}>
          <span className="tree-node__icon">{folderId === 'root' ? '🏠' : '🖼️'}</span>
          <span className="tree-node__name">{name}</span>
        </Link>
      </div>

      {expanded && (
        <div className="tree-node__children">
          {loading && <div className="tree-node__status" style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}>Loading…</div>}
          {children?.map((child) => (
            <FolderTreeNode
              key={child.id}
              folderId={child.id}
              name={child.name}
              depth={depth + 1}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
