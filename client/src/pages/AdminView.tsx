import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  fetchPendingTransactions,
  approveTransaction,
  rejectTransaction,
} from '../api';
import type { Transaction } from '../transactions/TransactionsContext';
import './AdminView.css';

export function AdminView() {
  const { user, loading } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const txs = await fetchPendingTransactions();
      setTransactions(txs);
    } catch (err) {
      console.error(err);
      setError('Failed to load pending transactions.');
    }
  }, []);

  useEffect(() => {
    if (user?.isAdmin) void refresh();
  }, [user, refresh]);

  if (loading) return null;
  if (!user || !user.isAdmin) return <Navigate to="/" replace />;

  const handleApprove = async (id: string) => {
    setBusyId(id);
    try {
      await approveTransaction(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error(err);
      setError('Approval failed.');
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id: string) => {
    setBusyId(id);
    try {
      await rejectTransaction(id, rejectNote || undefined);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      setRejectingId(null);
      setRejectNote('');
    } catch (err) {
      console.error(err);
      setError('Rejection failed.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="admin-view">
      <h2 className="admin-view__title">Pending Transactions</h2>
      {error && <div className="admin-view__error">{error}</div>}
      {transactions.length === 0 ? (
        <div className="admin-view__empty">No pending transactions.</div>
      ) : (
        <ul className="admin-view__list">
          {transactions.map((tx) => (
            <li key={tx.id} className="admin-view__row">
              <div className="admin-view__row-head">
                <div className="admin-view__user">
                  <strong>{tx.userName}</strong>
                  <span className="admin-view__email">{tx.userEmail}</span>
                </div>
                <div className="admin-view__meta">
                  <span>{tx.photoIds.length} photo{tx.photoIds.length === 1 ? '' : 's'}</span>
                  <span>{new Date(tx.createdAt).toLocaleString()}</span>
                </div>
              </div>
              <div className="admin-view__thumbs">
                {tx.photoIds.map((pid) => (
                  <img
                    key={pid}
                    src={`/api/photos/${pid}/thumbnail`}
                    alt=""
                    loading="lazy"
                  />
                ))}
              </div>
              {rejectingId === tx.id ? (
                <div className="admin-view__reject">
                  <input
                    type="text"
                    placeholder="Reason (optional)"
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                  />
                  <button
                    onClick={() => handleReject(tx.id)}
                    disabled={busyId === tx.id}
                    className="admin-view__btn admin-view__btn--danger"
                  >
                    Confirm reject
                  </button>
                  <button
                    onClick={() => {
                      setRejectingId(null);
                      setRejectNote('');
                    }}
                    className="admin-view__btn"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="admin-view__actions">
                  <button
                    onClick={() => handleApprove(tx.id)}
                    disabled={busyId === tx.id}
                    className="admin-view__btn admin-view__btn--primary"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => setRejectingId(tx.id)}
                    disabled={busyId === tx.id}
                    className="admin-view__btn"
                  >
                    Reject
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
