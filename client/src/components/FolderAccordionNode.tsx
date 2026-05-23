import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { FolderTreeNode } from '../types';
import { useFolderAccess } from '../context/FolderAccessContext';
import { useAuth } from '../auth/AuthContext';

interface Props {
  node: FolderTreeNode;
  /** Set of folder IDs on the path from root → active folder */
  activePath: ReadonlySet<string>;
  activeId: string;
  depth: number;
  onSelect?: () => void;
}

export function FolderAccordionNode({ node, activePath, activeId, depth, onSelect }: Props) {
  const isActive = node.id === activeId;
  const hasChildren = node.children.length > 0;
  const { user, guestMode } = useAuth();
  const { approvedFolderIds, pendingFolderIds } = useFolderAccess();
  const isApproved = !guestMode && approvedFolderIds.has(node.id);
  const isPending = !guestMode && !isApproved && pendingFolderIds.has(node.id);
  const isLocked = guestMode || (!!user && !user.fullAccess && !isApproved && !isPending);

  // Start expanded if this node is on the active path; user can toggle freely after that
  const [expanded, setExpanded] = useState(() => activePath.has(node.id));

  // When navigation lands on this node's path, expand it automatically
  useEffect(() => {
    if (activePath.has(node.id)) setExpanded(true);
  }, [activePath, node.id]);

  const toggleExpand = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpanded((prev) => !prev);
  };

  return (
    <div className="tree-node">
      <div
        className={`tree-node__row ${isActive ? 'tree-node__row--active' : ''}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        <button
          className="tree-node__chevron"
          onClick={toggleExpand}
          aria-label={expanded ? 'Collapse' : 'Expand'}
          disabled={!hasChildren}
        >
          {hasChildren ? (expanded ? '▾' : '▸') : '·'}
        </button>
        <Link
          to={`/folder/${node.id}`}
          className="tree-node__link"
          onClick={onSelect}
        >
          <span className="tree-node__name">{node.name}</span>
          {isLocked && (
            <svg className="tree-node__lock" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-label="Access required">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          )}
          {isPending && (
            <svg className="tree-node__lock tree-node__lock--pending" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-label="Access requested">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          )}
          {isApproved && (
            <svg className="tree-node__lock tree-node__lock--approved" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-label="Access granted">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </Link>
      </div>

      {expanded && hasChildren && (
        <div className="tree-node__children">
          {node.children.map((child) => (
            <FolderAccordionNode
              key={child.id}
              node={child}
              activePath={activePath}
              activeId={activeId}
              depth={depth + 1}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
