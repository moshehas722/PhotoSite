import type { Photo } from '../types';
import { useCart } from '../cart/CartContext';
import { useAuth } from '../auth/AuthContext';
import { useTransactions } from '../transactions/TransactionsContext';
import './PhotoCard.css';

interface Props {
  photo: Photo;
  onClick: () => void;
}

export function PhotoCard({ photo, onClick }: Props) {
  const { add, remove, has } = useCart();
  const { user } = useAuth();
  const { approvedIds, pendingIds } = useTransactions();
  const inCart = has(photo.id);
  const purchased = approvedIds.has(photo.id);
  const pending = !purchased && pendingIds.has(photo.id);

  const toggleCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inCart) remove(photo.id);
    else add(photo);
  };

  return (
    <div className="photo-card" onClick={onClick}>
      <img
        src={`/api/photos/${photo.id}/thumbnail`}
        alt={photo.name}
        loading="lazy"
      />
      {user && !purchased && !pending && (
        <button
          className={`photo-card__cart ${inCart ? 'photo-card__cart--in' : ''}`}
          onClick={toggleCart}
          aria-label={inCart ? 'Remove from cart' : 'Add to cart'}
          title={inCart ? 'Remove from cart' : 'Add to cart'}
        >
          {inCart ? '✓' : '+'}
        </button>
      )}
      {user && purchased && (
        <span className="photo-card__purchased" title="Purchased">✓ Purchased</span>
      )}
      {user && pending && (
        <span className="photo-card__pending" title="Awaiting admin approval">⏳ Pending approval</span>
      )}
      <div className="photo-card__overlay">
        <span className="photo-card__name">{photo.name}</span>
      </div>
    </div>
  );
}
