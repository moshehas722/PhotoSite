import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { FolderTreeNode } from '../types';

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
