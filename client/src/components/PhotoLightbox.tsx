import { useCallback, useState } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';
import type { Photo } from '../types';
import { useCart } from '../cart/CartContext';
import { useAuth } from '../auth/AuthContext';
import { useTransactions } from '../transactions/TransactionsContext';
import './PhotoCard.css';
import './PhotoLightbox.css';

/** Fallback until onLoad — Zoom plugin needs numeric width/height on image slides or maxZoom stays 1 (toolbar zoom disabled). */
const PLACEHOLDER_DIM = { width: 3200, height: 2400 };

interface Props {
  photos: Photo[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function PhotoLightbox({ photos, index, onClose, onNavigate }: Props) {
  const { user } = useAuth();
  const { add, remove, has } = useCart();
  const { approvedIds, pendingIds } = useTransactions();
  const fullAccess = user?.fullAccess === true;
  const [naturalById, setNaturalById] = useState<
    Record<string, { width: number; height: number }>
  >({});

  const onImgLoad = useCallback((photoId: string, el: HTMLImageElement) => {
    const { naturalWidth: w, naturalHeight: h } = el;
    if (w > 0 && h > 0) {
      setNaturalById((prev) => {
        const cur = prev[photoId];
        if (cur?.width === w && cur?.height === h) return prev;
        return { ...prev, [photoId]: { width: w, height: h } };
      });
    }
  }, []);

  const slides = photos.map((p) => {
    const natural = naturalById[p.id];
    return {
      ...p,
      width: natural?.width ?? PLACEHOLDER_DIM.width,
      height: natural?.height ?? PLACEHOLDER_DIM.height,
      src:
        fullAccess || approvedIds.has(p.id)
          ? `/api/photos/${p.id}/full`
          : `/api/photos/${p.id}/thumbnail`,
      purchased: fullAccess || approvedIds.has(p.id),
      pending:
        !fullAccess && !approvedIds.has(p.id) && pendingIds.has(p.id),
    };
  });

  const toggleCart = (e: React.MouseEvent, photo: Photo) => {
    e.stopPropagation();
    if (has(photo.id)) remove(photo.id);
    else add(photo);
  };

  return (
    <Lightbox
      plugins={[Zoom]}
      zoom={{
        /** Thumbnails are often ~screen-sized; without this, maxZoom≈1 and pinch does nothing */
        maxZoomPixelRatio: 4,
        /** Better pinch handling on mobile Safari / Chrome */
        pinchZoomV4: true,
      }}
      open={index >= 0}
      close={onClose}
      index={index}
      slides={slides}
      on={{ view: ({ index: i }) => onNavigate(i) }}
      render={{
        slide: ({ slide }) => {
          const s = slide as (typeof slides)[number];
          const inCart = has(s.id);

          return (
            <div className="lightbox-slide">
              <img
                src={s.src}
                alt=""
                className="lightbox-slide__img"
                onLoad={(e) => onImgLoad(s.id, e.currentTarget)}
              />
              {user && !s.purchased && !s.pending && (
                <button
                  type="button"
                  className={`photo-card__cart ${inCart ? 'photo-card__cart--in' : ''}`}
                  onClick={(e) => toggleCart(e, s)}
                  aria-label={inCart ? 'Remove from cart' : 'Add to cart'}
                  title={inCart ? 'Remove from cart' : 'Add to cart'}
                >
                  {inCart ? '✓' : '+'}
                </button>
              )}
              {user && s.purchased && (
                <a
                  className="photo-card__download"
                  href={`/api/photos/${s.id}/full`}
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
              {user && s.pending && (
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
              {s.purchased ? null : s.pending && user ? (
                <div className="lightbox-slide__hint lightbox-slide__hint--pending">
                  Awaiting admin approval. Full resolution will be available after approval.
                </div>
              ) : (
                <div className="lightbox-slide__hint">
                  This is a low-res picture. Full-res picture will be available only after purchasing.
                </div>
              )}
            </div>
          );
        },
      }}
    />
  );
}
