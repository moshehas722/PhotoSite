import { useState } from 'react';
import { useCart } from './CartContext';
import './CartDrawer.css';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CartDrawer({ open, onClose }: Props) {
  const { items, remove, clear } = useCart();
  const [accepted, setAccepted] = useState(false);

  const handleCheckout = () => {
    setAccepted(true);
    clear();
    setTimeout(() => {
      setAccepted(false);
      onClose();
    }, 2000);
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
            <p>Shopping cart accepted</p>
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
              <button className="cart-drawer__checkout" onClick={handleCheckout}>
                Accept Cart
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
