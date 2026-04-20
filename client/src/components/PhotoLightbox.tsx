import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import type { Photo } from '../types';

interface Props {
  photos: Photo[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function PhotoLightbox({ photos, index, onClose, onNavigate }: Props) {
  const slides = photos.map((p) => ({ src: `/api/photos/${p.id}/thumbnail` }));

  return (
    <Lightbox
      open={index >= 0}
      close={onClose}
      index={index}
      slides={slides}
      on={{ view: ({ index: i }) => onNavigate(i) }}
      render={{
        slide: ({ slide }) => (
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src={slide.src}
              alt=""
              style={{
                maxWidth: '95vw',
                maxHeight: '95vh',
                width: 'auto',
                height: '95vh',
                objectFit: 'contain',
                imageRendering: 'auto',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: 16,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0, 0, 0, 0.7)',
                color: '#fff',
                padding: '8px 16px',
                borderRadius: 6,
                fontSize: '0.9rem',
                textAlign: 'center',
                pointerEvents: 'none',
              }}
            >
              This is a low-res picture. Full-res picture will be available only after purchasing.
            </div>
          </div>
        ),
      }}
    />
  );
}
