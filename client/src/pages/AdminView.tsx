import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  fetchPendingTransactions,
  approveTransaction,
  rejectTransaction,
  fetchAdminSettings,
  saveAdminSettings,
  fetchAboutContent,
  saveAboutContent,
  fetchProfile,
  saveProfile,
  fetchAdmins,
  addAdmin,
  removeAdmin,
  type AdminSettings,
  type SiteProfile,
  type AdminEntry,
} from '../api';
import type { Transaction } from '../transactions/TransactionsContext';
import './AdminView.css';

function extractFolderId(input: string): string {
  const trimmed = input.trim();
  const urlMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (urlMatch) return urlMatch[1];
  if (/^[a-zA-Z0-9_-]+$/.test(trimmed)) return trimmed;
  return trimmed;
}


function SettingsPanel() {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [folderInput, setFolderInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminSettings()
      .then((s) => { setSettings(s); setFolderInput(s.driveFolderId); })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    const id = extractFolderId(folderInput);
    setSaving(true);
    setSaveMsg(null);
    try {
      await saveAdminSettings(id);
      setSettings((prev) => prev ? { ...prev, driveFolderId: id } : prev);
      setFolderInput(id);
      setSaveMsg('Saved.');
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="admin-settings">
      <div className="admin-settings__field">
        <label className="admin-settings__label">Google Drive Folder</label>
        <div className="admin-settings__row">
          <input
            className="admin-settings__input"
            type="text"
            placeholder="Paste folder URL or ID"
            value={folderInput}
            onChange={(e) => setFolderInput(e.target.value)}
          />
          <button
            className="admin-view__btn admin-view__btn--primary"
            onClick={() => void handleSave()}
            disabled={saving || !folderInput.trim()}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
        {saveMsg && (
          <span className={`admin-settings__msg ${saveMsg === 'Saved.' ? 'admin-settings__msg--ok' : 'admin-settings__msg--err'}`}>
            {saveMsg}
          </span>
        )}
        {settings?.driveFolderId && (
          <span className="admin-settings__current">Current ID: {settings.driveFolderId}</span>
        )}
      </div>

      <div className="admin-settings__field">
        <label className="admin-settings__label">Service Account</label>
        {settings?.serviceAccountEmail
          ? <code className="admin-settings__code">{settings.serviceAccountEmail}</code>
          : <span className="admin-settings__current">Not configured</span>
        }
        <p className="admin-settings__hint">
          The site reads photos using this service account. You must share each Drive folder with it as <strong>Viewer</strong>.
        </p>
        <ol className="admin-settings__steps">
          <li>Open <a href="https://drive.google.com" target="_blank" rel="noreferrer">Google Drive</a> and navigate to your photos folder.</li>
          <li>Right-click the folder → <strong>Share</strong>.</li>
          <li>In the "Add people and groups" box, paste the email above.</li>
          <li>Set the role to <strong>Viewer</strong>.</li>
          <li>Uncheck "Notify people" (the service account has no inbox), then click <strong>Share</strong>.</li>
          <li>Repeat for any sub-folders that aren't already inherited.</li>
        </ol>
      </div>

    </section>
  );
}

function ProfilePanel() {
  const [profile, setProfile_] = useState<SiteProfile>({ phone: '', instagram: '', facebook: '' });
  const [aboutText, setAboutText] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile().then(setProfile_).catch(() => {});
    fetchAboutContent().then(setAboutText).catch(() => {});
  }, []);

  const handleChange = (field: keyof SiteProfile) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setProfile_((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      await Promise.all([saveProfile(profile), saveAboutContent(aboutText)]);
      setMsg('Saved.');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="admin-settings">
      <div className="admin-settings__field">
        <label className="admin-settings__label">Phone Number</label>
        <input
          className="admin-settings__input"
          type="tel"
          placeholder="+1 555 000 0000"
          value={profile.phone}
          onChange={handleChange('phone')}
        />
      </div>

      <div className="admin-settings__field">
        <label className="admin-settings__label">Instagram URL</label>
        <input
          className="admin-settings__input"
          type="url"
          placeholder="https://instagram.com/yourhandle"
          value={profile.instagram}
          onChange={handleChange('instagram')}
        />
      </div>

      <div className="admin-settings__field">
        <label className="admin-settings__label">Facebook URL</label>
        <input
          className="admin-settings__input"
          type="url"
          placeholder="https://facebook.com/yourpage"
          value={profile.facebook}
          onChange={handleChange('facebook')}
        />
      </div>

      <div className="admin-settings__field">
        <label className="admin-settings__label">About Page</label>
        <textarea
          className="admin-settings__textarea"
          value={aboutText}
          onChange={(e) => setAboutText(e.target.value)}
          rows={12}
          placeholder="Write the about page content here…"
          spellCheck
        />
        <p className="admin-settings__hint">
          Separate sections with a blank line. The first line of each section becomes a heading.
        </p>
      </div>

      <div className="admin-settings__row">
        <button
          className="admin-view__btn admin-view__btn--primary"
          onClick={() => void handleSave()}
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        {msg && (
          <span className={`admin-settings__msg ${msg === 'Saved.' ? 'admin-settings__msg--ok' : 'admin-settings__msg--err'}`}>
            {msg}
          </span>
        )}
      </div>
    </section>
  );
}

interface TxRowProps {
  tx: Transaction;
  busyId: string | null;
  rejectingId: string | null;
  rejectNote: string;
  onApprove: (id: string) => void;
  onStartReject: (id: string) => void;
  onConfirmReject: (id: string) => void;
  onCancelReject: () => void;
  onRejectNoteChange: (v: string) => void;
}

function TxRow({
  tx, busyId, rejectingId, rejectNote,
  onApprove, onStartReject, onConfirmReject, onCancelReject, onRejectNoteChange,
}: TxRowProps) {
  const [expanded, setExpanded] = useState(false);
  const busy = busyId === tx.id;
  const rejecting = rejectingId === tx.id;

  return (
    <li className="tx-row">
      <div className="tx-row__main">
        <button className="tx-row__expand" onClick={() => setExpanded(e => !e)} aria-label="Toggle photos">
          <span className={`tx-row__chevron ${expanded ? 'tx-row__chevron--open' : ''}`}>›</span>
        </button>
        <div className="tx-row__info">
          <span className="tx-row__name">{tx.userName}</span>
          <span className="tx-row__email">{tx.userEmail}</span>
        </div>
        <span className="tx-row__date">{new Date(tx.createdAt).toLocaleDateString()}</span>
        <span className="tx-row__count">{tx.photoIds.length} photo{tx.photoIds.length === 1 ? '' : 's'}</span>
        <div className="tx-row__actions">
          <button
            className="admin-view__btn admin-view__btn--primary admin-view__btn--sm"
            disabled={busy}
            onClick={() => onApprove(tx.id)}
          >
            Approve
          </button>
          <button
            className="admin-view__btn admin-view__btn--sm"
            disabled={busy}
            onClick={() => onStartReject(tx.id)}
          >
            Reject
          </button>
        </div>
      </div>

      {rejecting && (
        <div className="tx-row__reject">
          <input
            type="text"
            placeholder="Reason (optional)"
            value={rejectNote}
            onChange={(e) => onRejectNoteChange(e.target.value)}
          />
          <button
            className="admin-view__btn admin-view__btn--danger admin-view__btn--sm"
            disabled={busy}
            onClick={() => onConfirmReject(tx.id)}
          >
            Confirm
          </button>
          <button className="admin-view__btn admin-view__btn--sm" onClick={onCancelReject}>
            Cancel
          </button>
        </div>
      )}

      {expanded && (
        <div className="tx-row__thumbs">
          {tx.photoIds.map((pid) => (
            <img key={pid} src={`/api/photos/${pid}/thumbnail`} alt="" loading="lazy" />
          ))}
        </div>
      )}
    </li>
  );
}

function TransactionsPanel() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  const refresh = useCallback(async () => {
    try {
      setError(null);
      setTransactions(await fetchPendingTransactions());
    } catch {
      setError('Failed to load pending transactions.');
    }
  }, []);

  useEffect(() => {
    if (user?.isAdmin) void refresh();
  }, [user, refresh]);

  const handleApprove = async (id: string) => {
    setBusyId(id);
    try {
      await approveTransaction(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch {
      setError('Approval failed.');
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirmReject = async (id: string) => {
    setBusyId(id);
    try {
      await rejectTransaction(id, rejectNote || undefined);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      setRejectingId(null);
      setRejectNote('');
    } catch {
      setError('Rejection failed.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section>
      {error && <div className="admin-view__error">{error}</div>}
      {transactions.length === 0 ? (
        <div className="admin-view__empty">No pending transactions.</div>
      ) : (
        <ul className="tx-list">
          {transactions.map((tx) => (
            <TxRow
              key={tx.id}
              tx={tx}
              busyId={busyId}
              rejectingId={rejectingId}
              rejectNote={rejectNote}
              onApprove={handleApprove}
              onStartReject={(id) => { setRejectingId(id); setRejectNote(''); }}
              onConfirmReject={handleConfirmReject}
              onCancelReject={() => { setRejectingId(null); setRejectNote(''); }}
              onRejectNoteChange={setRejectNote}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function AdministratorsPanel() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<AdminEntry[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [removingEmail, setRemovingEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setAdmins(await fetchAdmins());
    } catch {
      setError('Failed to load administrators.');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleAdd = async () => {
    const email = newEmail.trim().toLowerCase();
    if (!email) return;
    setAdding(true);
    setError(null);
    setMsg(null);
    try {
      await addAdmin(email);
      setNewEmail('');
      await load();
      setMsg('Administrator added.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add administrator.');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (email: string) => {
    setRemovingEmail(email);
    setError(null);
    setMsg(null);
    try {
      await removeAdmin(email);
      setAdmins((prev) => prev.filter((a) => a.email !== email));
      setMsg('Administrator removed.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to remove administrator.');
    } finally {
      setRemovingEmail(null);
    }
  };

  const isSelf = (email: string) => email === user?.email?.toLowerCase();

  return (
    <section className="admin-admins">
      {error && <div className="admin-view__error">{error}</div>}
      {msg && <div className="admin-admins__msg">{msg}</div>}

      <div className="admin-settings__field">
        <label className="admin-settings__label">Add Administrator</label>
        <div className="admin-settings__row">
          <input
            className="admin-settings__input"
            type="email"
            placeholder="user@example.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void handleAdd(); }}
          />
          <button
            className="admin-view__btn admin-view__btn--primary"
            onClick={() => void handleAdd()}
            disabled={adding || !newEmail.trim()}
          >
            {adding ? 'Adding…' : 'Add'}
          </button>
        </div>
      </div>

      <ul className="admin-admins__list">
        {admins.length === 0 && (
          <li className="admin-view__empty">No administrators configured.</li>
        )}
        {admins.map((admin) => (
          <li key={admin.email} className="admin-admins__row">
            <span className="admin-admins__email">{admin.email}</span>
            <div className="admin-admins__badges">
              {admin.source === 'env' && (
                <span className="admin-admins__badge">env</span>
              )}
              {isSelf(admin.email) && (
                <span className="admin-admins__badge admin-admins__badge--you">you</span>
              )}
            </div>
            <button
              className="admin-view__btn admin-view__btn--danger admin-view__btn--sm"
              disabled={!!removingEmail || admin.source === 'env' || isSelf(admin.email)}
              onClick={() => void handleRemove(admin.email)}
              title={
                isSelf(admin.email) ? 'Cannot remove yourself' :
                admin.source === 'env' ? 'Configured via environment variable' : undefined
              }
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

type Tab = 'transactions' | 'gdrive' | 'profile' | 'administrators';

export function AdminView() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<Tab>('transactions');

  if (loading) return null;
  if (!user || !user.isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="admin-view">
      <div className="admin-tabs">
        <button
          className={`admin-tabs__tab ${tab === 'transactions' ? 'admin-tabs__tab--active' : ''}`}
          onClick={() => setTab('transactions')}
        >
          Pending Transactions
        </button>
        <button
          className={`admin-tabs__tab ${tab === 'gdrive' ? 'admin-tabs__tab--active' : ''}`}
          onClick={() => setTab('gdrive')}
        >
          GDrive Folder
        </button>
        <button
          className={`admin-tabs__tab ${tab === 'profile' ? 'admin-tabs__tab--active' : ''}`}
          onClick={() => setTab('profile')}
        >
          Profile
        </button>
        <button
          className={`admin-tabs__tab ${tab === 'administrators' ? 'admin-tabs__tab--active' : ''}`}
          onClick={() => setTab('administrators')}
        >
          Administrators
        </button>
      </div>

      {tab === 'transactions' && <TransactionsPanel />}
      {tab === 'gdrive' && <SettingsPanel />}
      {tab === 'profile' && <ProfilePanel />}
      {tab === 'administrators' && <AdministratorsPanel />}
    </div>
  );
}
