import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  fetchAdminUsers,
  setUserFullAccess,
  fetchPendingFolderAccessRequests,
  approveFolderAccessRequest,
  rejectFolderAccessRequest,
  fetchCartEnabled,
  saveCartEnabled,
  type AdminSettings,
  type SiteProfile,
  type AdminEntry,
  type AdminUserStats,
  type FolderAccessRequest,
} from '../api';
import { useSiteConfig } from '../context/SiteConfigContext';
import type { Transaction } from '../transactions/TransactionsContext';
import './AdminView.css';

function extractFolderId(input: string): string {
  const trimmed = input.trim();
  const urlMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (urlMatch) return urlMatch[1];
  if (/^[a-zA-Z0-9_-]+$/.test(trimmed)) return trimmed;
  return trimmed;
}


function ServiceAccountEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  return (
    <div className="admin-settings__sa-row">
      <code className="admin-settings__code">{email}</code>
      <button
        className="admin-settings__copy-btn"
        onClick={() => void handleCopy()}
        title={copied ? 'Copied!' : 'Copy to clipboard'}
        aria-label={copied ? 'Copied!' : 'Copy service account email'}
      >
        {copied ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
      </button>
    </div>
  );
}

function SettingsPanel() {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [folderInput, setFolderInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const { cartEnabled, setCartEnabled: setCartEnabledCtx } = useSiteConfig();
  const [cartSaving, setCartSaving] = useState(false);

  useEffect(() => {
    fetchAdminSettings()
      .then((s) => { setSettings(s); setFolderInput(s.driveFolderId); })
      .catch(() => {});
    fetchCartEnabled().then(setCartEnabledCtx).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCartToggle = async (enabled: boolean) => {
    setCartSaving(true);
    try {
      await saveCartEnabled(enabled);
      setCartEnabledCtx(enabled);
    } catch {
      // silently ignore
    } finally {
      setCartSaving(false);
    }
  };

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
    <div className="admin-user-requests">
      <CollapsibleSection title="Cart &amp; Purchases">
        <section className="admin-settings">
          <div className="admin-settings__field">
            <label className="admin-users__filter">
              <input
                type="checkbox"
                checked={cartEnabled}
                disabled={cartSaving}
                onChange={(e) => void handleCartToggle(e.target.checked)}
              />
              <span>Enable cart and purchase flow</span>
            </label>
            <p className="admin-settings__hint">
              When disabled, the cart button and "Add to cart" icons are hidden for all users. Folder access requests still work normally.
            </p>
          </div>
        </section>
      </CollapsibleSection>

      <CollapsibleSection title="Google Drive">
        <section className="admin-settings">
          <div className="admin-settings__field">
            <label className="admin-settings__label">Folder</label>
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
              ? <ServiceAccountEmail email={settings.serviceAccountEmail} />
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
      </CollapsibleSection>
    </div>
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

  const picLabel =
    tx.photoIds.length === 1 ? '1 pic' : `${tx.photoIds.length} pics`;

  return (
    <li className="tx-row">
      <div className="tx-row__main">
        <button className="tx-row__expand" onClick={() => setExpanded(e => !e)} aria-label="Toggle photos">
          <span className={`tx-row__chevron ${expanded ? 'tx-row__chevron--open' : ''}`}>›</span>
        </button>
        <span className="tx-row__name">{tx.userName}</span>
        <span className="tx-row__email">{tx.userEmail}</span>
        <div className="tx-row__meta-line">
          <span className="tx-row__date">{new Date(tx.createdAt).toLocaleDateString()}</span>
          <span className="tx-row__count">{picLabel}</span>
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

function TransactionsPanel({ onCountChange }: { onCountChange?: (n: number) => void }) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const list = await fetchPendingTransactions();
      setTransactions(list);
      onCountChange?.(list.length);
    } catch {
      setError('Failed to load pending transactions.');
    }
  }, [onCountChange]);

  useEffect(() => {
    if (user?.isAdmin) void refresh();
  }, [user, refresh]);

  const handleApprove = async (id: string) => {
    setBusyId(id);
    try {
      await approveTransaction(id);
      setTransactions((prev) => {
        const next = prev.filter((t) => t.id !== id);
        onCountChange?.(next.length);
        return next;
      });
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
      setTransactions((prev) => {
        const next = prev.filter((t) => t.id !== id);
        onCountChange?.(next.length);
        return next;
      });
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

function formatLoginTime(ms: number | null): string {
  if (ms === null || ms === undefined) return '—';
  try {
    return new Date(ms).toLocaleString();
  } catch {
    return '—';
  }
}

function UsersPanel() {
  const { user: currentUser, refreshUser } = useAuth();
  const [users, setUsers] = useState<AdminUserStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busySub, setBusySub] = useState<string | null>(null);
  const [fullAccessOnly, setFullAccessOnly] = useState(false);

  const displayedUsers = useMemo(
    () => (fullAccessOnly ? users.filter((u) => u.fullAccess) : users),
    [users, fullAccessOnly]
  );

  const load = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      setUsers(await fetchAdminUsers());
    } catch {
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleFullAccessToggle = async (userSub: string, next: boolean) => {
    setBusySub(userSub);
    setError(null);
    try {
      await setUserFullAccess(userSub, next);
      setUsers((prev) =>
        prev.map((u) => (u.userSub === userSub ? { ...u, fullAccess: next } : u))
      );
      if (currentUser?.sub === userSub) await refreshUser();
    } catch {
      setError('Failed to update full access.');
    } finally {
      setBusySub(null);
    }
  };

  return (
    <section className="admin-users">
      <p className="admin-users__intro">
        Users who have signed in at least once, sorted by login count (highest first).{' '}
        <strong>Full access</strong> lets a user download every photo in full quality without checkout; they do not see the cart.
      </p>
      {!loading && users.length > 0 && (
        <div className="admin-users__toolbar">
          <label className="admin-users__filter">
            <input
              type="checkbox"
              checked={fullAccessOnly}
              onChange={(e) => setFullAccessOnly(e.target.checked)}
            />
            <span>Show only users with full access</span>
          </label>
        </div>
      )}
      {error && <div className="admin-view__error">{error}</div>}
      {loading ? (
        <div className="admin-view__empty">Loading…</div>
      ) : users.length === 0 ? (
        <div className="admin-view__empty">No login records yet.</div>
      ) : displayedUsers.length === 0 ? (
        <div className="admin-view__empty">
          No users with full access. Turn off the filter to see everyone.
        </div>
      ) : (
        <div className="admin-users__table-wrap">
          <table className="admin-users__table">
            <thead>
              <tr>
                <th scope="col" className="admin-users__th admin-users__th--user">
                  User
                </th>
                <th scope="col" className="admin-users__col-hide-mobile">
                  Email
                </th>
                <th
                  scope="col"
                  className="admin-users__th--numeric admin-users__col-hide-mobile"
                >
                  Logins
                </th>
                <th scope="col" className="admin-users__col-hide-mobile">
                  Last login
                </th>
                <th scope="col" className="admin-users__th--access">
                  Full access
                </th>
              </tr>
            </thead>
            <tbody>
              {displayedUsers.map((u) => (
                <tr key={u.userSub}>
                  <td>
                    <div className="admin-users__cell-user">
                      {u.picture ? (
                        <img
                          src={u.picture}
                          alt=""
                          className="admin-users__avatar"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="admin-users__avatar admin-users__avatar--placeholder" aria-hidden />
                      )}
                      <span className="admin-users__name">{u.name || '—'}</span>
                    </div>
                  </td>
                  <td className="admin-users__email admin-users__col-hide-mobile">
                    {u.email || '—'}
                  </td>
                  <td className="admin-users__numeric admin-users__col-hide-mobile">
                    {u.loginCount}
                  </td>
                  <td className="admin-users__muted admin-users__col-hide-mobile">
                    {formatLoginTime(u.lastLoginAt)}
                  </td>
                  <td className="admin-users__access-cell">
                    <label className="admin-users__access-label">
                      <input
                        type="checkbox"
                        checked={u.fullAccess}
                        disabled={busySub === u.userSub}
                        onChange={(e) =>
                          void handleFullAccessToggle(u.userSub, e.target.checked)
                        }
                        aria-label={`Full access for ${u.email || u.name}`}
                      />
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

function AccessRequestsPanel({ onCountChange }: { onCountChange?: (n: number) => void }) {
  const { user } = useAuth();
  const [requests, setRequests] = useState<FolderAccessRequest[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const list = await fetchPendingFolderAccessRequests();
      setRequests(list);
      onCountChange?.(list.length);
    } catch {
      setError('Failed to load access requests.');
    }
  }, [onCountChange]);

  useEffect(() => {
    if (user?.isAdmin) void refresh();
  }, [user, refresh]);

  const handleApprove = async (id: string) => {
    setBusyId(id);
    try {
      await approveFolderAccessRequest(id);
      setRequests((prev) => {
        const next = prev.filter((r) => r.id !== id);
        onCountChange?.(next.length);
        return next;
      });
    } catch {
      setError('Approval failed.');
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirmReject = async (id: string) => {
    setBusyId(id);
    try {
      await rejectFolderAccessRequest(id, rejectNote || undefined);
      setRequests((prev) => {
        const next = prev.filter((r) => r.id !== id);
        onCountChange?.(next.length);
        return next;
      });
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
      {requests.length === 0 ? (
        <div className="admin-view__empty">No pending access requests.</div>
      ) : (
        <ul className="tx-list">
          {requests.map((req) => {
            const busy = busyId === req.id;
            const rejecting = rejectingId === req.id;
            return (
              <li key={req.id} className="tx-row">
                <div className="tx-row__main">
                  <span className="tx-row__name">{req.userName}</span>
                  <span className="tx-row__email">{req.userEmail}</span>
                  <div className="tx-row__meta-line">
                    <span className="tx-row__date">{new Date(req.createdAt).toLocaleDateString()}</span>
                    <span className="tx-row__count">📁 {req.folderName || req.folderId}</span>
                    <div className="tx-row__actions">
                      <button
                        className="admin-view__btn admin-view__btn--primary admin-view__btn--sm"
                        disabled={busy}
                        onClick={() => void handleApprove(req.id)}
                      >
                        Approve
                      </button>
                      <button
                        className="admin-view__btn admin-view__btn--sm"
                        disabled={busy}
                        onClick={() => { setRejectingId(req.id); setRejectNote(''); }}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
                {rejecting && (
                  <div className="tx-row__reject">
                    <input
                      type="text"
                      placeholder="Reason (optional)"
                      value={rejectNote}
                      onChange={(e) => setRejectNote(e.target.value)}
                    />
                    <button
                      className="admin-view__btn admin-view__btn--danger admin-view__btn--sm"
                      disabled={busy}
                      onClick={() => void handleConfirmReject(req.id)}
                    >
                      Confirm
                    </button>
                    <button
                      className="admin-view__btn admin-view__btn--sm"
                      onClick={() => { setRejectingId(null); setRejectNote(''); }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function CollapsibleSection({ title, count, defaultOpen = true, children }: {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const initializedRef = useRef(false);

  // Once count resolves for the first time, collapse if empty.
  // Never auto-collapse again — don't fold the section while the admin is working.
  useEffect(() => {
    if (!initializedRef.current && count !== undefined) {
      initializedRef.current = true;
      if (count === 0) setOpen(false);
    }
  }, [count]);

  return (
    <div className="admin-collapsible">
      <button
        className="admin-collapsible__header"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className={`admin-collapsible__chevron ${open ? 'admin-collapsible__chevron--open' : ''}`}>›</span>
        <span className="admin-collapsible__title">{title}</span>
        {count !== undefined && (
          <span className={`admin-collapsible__badge ${count === 0 ? 'admin-collapsible__badge--empty' : ''}`}>
            {count}
          </span>
        )}
      </button>
      {open && <div className="admin-collapsible__body">{children}</div>}
    </div>
  );
}

function UserRequestsPanel() {
  const [txCount, setTxCount] = useState<number | undefined>(undefined);
  const [accessCount, setAccessCount] = useState<number | undefined>(undefined);

  return (
    <div className="admin-user-requests">
      <CollapsibleSection title="Pending Transactions" count={txCount}>
        <TransactionsPanel onCountChange={setTxCount} />
      </CollapsibleSection>
      <CollapsibleSection title="Folder Access Requests" count={accessCount}>
        <AccessRequestsPanel onCountChange={setAccessCount} />
      </CollapsibleSection>
    </div>
  );
}

type Tab = 'user-requests' | 'users' | 'gdrive' | 'profile' | 'administrators';

export function AdminView() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<Tab>('user-requests');

  if (loading) return null;
  if (!user || !user.isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="admin-view">
      <div className="admin-tabs">
        <button
          className={`admin-tabs__tab ${tab === 'user-requests' ? 'admin-tabs__tab--active' : ''}`}
          onClick={() => setTab('user-requests')}
        >
          User Requests
        </button>
        <button
          className={`admin-tabs__tab ${tab === 'users' ? 'admin-tabs__tab--active' : ''}`}
          onClick={() => setTab('users')}
        >
          Users
        </button>
        <button
          className={`admin-tabs__tab ${tab === 'gdrive' ? 'admin-tabs__tab--active' : ''}`}
          onClick={() => setTab('gdrive')}
        >
          Settings
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

      {tab === 'user-requests' && <UserRequestsPanel />}
      {tab === 'users' && <UsersPanel />}
      {tab === 'gdrive' && <SettingsPanel />}
      {tab === 'profile' && <ProfilePanel />}
      {tab === 'administrators' && <AdministratorsPanel />}
    </div>
  );
}
