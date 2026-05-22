import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { FolderAccordionNode } from './FolderAccordionNode';
import { fetchFolderTree } from '../api';
import type { FolderTreeNode } from '../types';
import './Sidebar.css';

/** Walk the tree and return the IDs from root down to targetId, or null if not found. */
function findPath(node: FolderTreeNode, targetId: string): string[] | null {
  if (node.id === targetId) return [node.id];
  for (const child of node.children) {
    const sub = findPath(child, targetId);
    if (sub) return [node.id, ...sub];
  }
  return null;
}

export function Sidebar() {
  const [open, setOpen] = useState(false);
  const [tree, setTree] = useState<FolderTreeNode | null>(null);
  const location = useLocation();

  const pathParts = location.pathname.split('/');
  const activeId = pathParts[2] ?? 'root';

  useEffect(() => {
    fetchFolderTree().then(setTree).catch(console.error);
  }, []);

  /** Set of IDs on the path root → active folder — drives accordion expansion */
  const activePath = useMemo<ReadonlySet<string>>(() => {
    if (!tree) return new Set();
    return new Set(findPath(tree, activeId) ?? []);
  }, [tree, activeId]);

  const close = () => setOpen(false);

  return (
    <>
      <button
        className="sidebar__toggle"
        onClick={() => setOpen(!open)}
        aria-label="Toggle galleries"
      >
        ☰ Galleries
      </button>
      {open && <div className="sidebar__backdrop" onClick={close} />}
      <aside className={`sidebar ${open ? 'sidebar--open' : ''}`}>

        <div className="sidebar__tree">
          {tree === null ? (
            <div className="sidebar__loading">Loading…</div>
          ) : tree.children.length === 0 ? (
            <div className="sidebar__loading">No galleries found.</div>
          ) : (
            tree.children.map((child) => (
              <FolderAccordionNode
                key={child.id}
                node={child}
                activePath={activePath}
                activeId={activeId}
                depth={0}
                onSelect={close}
              />
            ))
          )}
        </div>
      </aside>
    </>
  );
}
