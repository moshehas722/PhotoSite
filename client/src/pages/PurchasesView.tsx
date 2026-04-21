import { useState } from 'react';
import { useTransactions } from '../transactions/TransactionsContext';
import { useAuth } from '../auth/AuthContext';
import './PurchasesView.css';

function formatSubmittedAt(createdAt: number): string {
  try {
    return new Date(createdAt).toLocaleString();
  } catch {
    return '';
  }
}

export function PurchasesView() {
  const { user } = useAuth();
  const { approvedIds, pendingTransactions, cancelPendingTransaction } = useTransactions();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  if (!user) {
    return <div className="purchases-view__empty">Sign in to see your purchases.</div>;
  }

  const ids = Array.from(approvedIds);

  const handleCancel = async (id: string) => {
    setBusyId(id);
    setCancelError(null);
    try {
      await cancelPendingTransaction(id);
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Cancellation failed.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="purchases-view">
      <h2 className="purchases-view__title">My Purchases</h2>
      {pendingTransactions.length > 0 && (
        <section className="purchases-view__pending-section" aria-label="Pending approvals">
          <p className="purchases-view__pending-intro">
            {pendingTransactions.length} transaction
            {pendingTransactions.length === 1 ? '' : 's'} awaiting admin approval. You can cancel a
            request before it is reviewed.
          </p>
          {cancelError && <div className="purchases-view__cancel-error">{cancelError}</div>}
          <ul className="purchases-view__pending-list">
            {pendingTransactions.map((tx) => (
              <li key={tx.id} className="purchases-view__pending-row">
                <div className="purchases-view__pending-meta">
                  <span className="purchases-view__pending-date">
                    Submitted {formatSubmittedAt(tx.createdAt)}
                  </span>
                  <span className="purchases-view__pending-count">
                    {tx.photoIds.length} photo{tx.photoIds.length === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="purchases-view__pending-thumbs">
                  {tx.photoIds.slice(0, 6).map((pid) => (
                    <img
                      key={pid}
                      src={`/api/photos/${pid}/thumbnail`}
                      alt=""
                      loading="lazy"
                    />
                  ))}
                  {tx.photoIds.length > 6 && (
                    <span className="purchases-view__pending-more">
                      +{tx.photoIds.length - 6}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="purchases-view__cancel"
                  disabled={busyId !== null}
                  onClick={() => void handleCancel(tx.id)}
                >
                  {busyId === tx.id ? 'Cancelling…' : 'Cancel request'}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {ids.length === 0 ? (
        <div className="purchases-view__empty">You haven't purchased any photos yet.</div>
      ) : (
        <div className="purchases-view__grid">
          {ids.map((id) => (
            <div key={id} className="purchases-view__card">
              <img src={`/api/photos/${id}/thumbnail`} alt="" loading="lazy" />
              <a
                className="purchases-view__download"
                href={`/api/photos/${id}/full`}
                download
              >
                Download full resolution
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
