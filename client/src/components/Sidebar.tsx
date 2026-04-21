import { useState } from 'react';
import { FolderTreeNode } from './FolderTreeNode';
import { WhatsNew } from './WhatsNew';
import './Sidebar.css';

export function Sidebar() {
  const [open, setOpen] = useState(false);
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
        <WhatsNew onSelect={close} />
        <div className="sidebar__header">Galleries</div>
        <div className="sidebar__tree">
          <FolderTreeNode folderId="root" name="Home" depth={0} defaultExpanded onSelect={close} />
        </div>
      </aside>
    </>
  );
}
