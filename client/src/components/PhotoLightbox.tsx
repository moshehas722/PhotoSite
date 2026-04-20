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
  const slides = photos.map((p) => ({ src: `/api/photos/${p.id}` }));

  return (
    <Lightbox
      open={index >= 0}
      close={onClose}
      index={index}
      slides={slides}
      on={{ view: ({ index: i }) => onNavigate(i) }}
    />
  );
}
