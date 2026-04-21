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
  const fullAccess = user?.fullAccess === true;
  const purchased = approvedIds.has(photo.id) || fullAccess;
  const pending = !fullAccess && !approvedIds.has(photo.id) && pendingIds.has(photo.id);

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
        <a
          className="photo-card__download"
          href={`/api/photos/${photo.id}/full`}
          download
          onClick={(e) => e.stopPropagation()}
          aria-label="Download full resolution"
          title="Download full resolution"
        >
          <svg
            className="photo-card__download-icon"
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </a>
      )}
      {user && pending && (
        <span
          className="photo-card__pending"
          title="Awaiting admin approval"
          role="img"
          aria-label="Awaiting admin approval"
        >
          <svg
            className="photo-card__pending-icon"
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M5 22h14" />
            <path d="M5 2h14" />
            <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
            <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
          </svg>
        </span>
      )}
      <div className="photo-card__overlay">
        <span className="photo-card__name">{photo.name}</span>
      </div>
    </div>
  );
}
