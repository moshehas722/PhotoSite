import { useState } from 'react';
import { useCart } from './CartContext';
import { useTransactions } from '../transactions/TransactionsContext';
import './CartDrawer.css';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CartDrawer({ open, onClose }: Props) {
  const { items, remove, clear } = useCart();
  const { submitTransaction } = useTransactions();
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleCheckout = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitTransaction(items.map((p) => p.id));
      setAccepted(true);
      clear();
      setTimeout(() => {
        setAccepted(false);
        setSubmitting(false);
        onClose();
      }, 2500);
    } catch (err) {
      console.error(err);
      setError('Submission failed. Please try again.');
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="cart-backdrop" onClick={onClose} />
      <aside className="cart-drawer">
        <div className="cart-drawer__header">
          <h2>Shopping Cart</h2>
          <button className="cart-drawer__close" onClick={onClose} aria-label="Close cart">×</button>
        </div>

        {accepted ? (
          <div className="cart-drawer__accepted">
            <div className="cart-drawer__accepted-icon">✓</div>
            <p>Submitted for approval</p>
            <p className="cart-drawer__accepted-sub">
              You'll be able to download once an admin confirms payment.
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="cart-drawer__empty">Your cart is empty.</div>
        ) : (
          <>
            <ul className="cart-drawer__list">
              {items.map((photo) => (
                <li key={photo.id} className="cart-drawer__item">
                  <img src={`/api/photos/${photo.id}/thumbnail`} alt={photo.name} />
                  <span className="cart-drawer__item-name">{photo.name}</span>
                  <button
                    className="cart-drawer__remove"
                    onClick={() => remove(photo.id)}
                    aria-label="Remove"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
            <div className="cart-drawer__footer">
              <div className="cart-drawer__count">{items.length} photo{items.length === 1 ? '' : 's'}</div>
              {error && <div className="cart-drawer__error">{error}</div>}
              <button className="cart-drawer__checkout" onClick={handleCheckout} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Cart for Approval'}
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
