import { usePurchases } from '../purchases/PurchasesContext';
import { useAuth } from '../auth/AuthContext';
import './PurchasesView.css';

export function PurchasesView() {
  const { user } = useAuth();
  const { purchasedIds } = usePurchases();

  if (!user) {
    return <div className="purchases-view__empty">Sign in to see your purchases.</div>;
  }

  const ids = Array.from(purchasedIds);

  if (ids.length === 0) {
    return <div className="purchases-view__empty">You haven't purchased any photos yet.</div>;
  }

  return (
    <div className="purchases-view">
      <h2 className="purchases-view__title">My Purchases</h2>
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
    </div>
  );
}
