import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderTreeNode } from './FolderTreeNode';
import { WhatsNew } from './WhatsNew';
import { useAuth } from '../auth/AuthContext';
import './Sidebar.css';

export function Sidebar() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
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
        <WhatsNew />
        <nav className="sidebar__nav">
          <Link to="/" className="sidebar__nav-link" onClick={close}>Home</Link>
          <Link to="/about" className="sidebar__nav-link" onClick={close}>About</Link>
          {user && <Link to="/purchases" className="sidebar__nav-link" onClick={close}>My Purchases</Link>}
          {user?.isAdmin && <Link to="/admin" className="sidebar__nav-link" onClick={close}>Admin</Link>}
        </nav>
        <div className="sidebar__header">Galleries</div>
        <div className="sidebar__tree">
          <FolderTreeNode folderId="root" name="Home" depth={0} defaultExpanded />
        </div>
      </aside>
    </>
  );
}
