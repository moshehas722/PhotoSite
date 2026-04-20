import { useState } from 'react';
import { FolderTreeNode } from './FolderTreeNode';
import './Sidebar.css';

export function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="sidebar__toggle"
        onClick={() => setOpen(!open)}
        aria-label="Toggle folders"
      >
        ☰ Folders
      </button>
      <aside className={`sidebar ${open ? 'sidebar--open' : ''}`}>
        <div className="sidebar__header">Folders</div>
        <div className="sidebar__tree">
          <FolderTreeNode folderId="root" name="All Photos" depth={0} defaultExpanded />
        </div>
      </aside>
    </>
  );
}
