import type { Photo } from '../types';
import './PhotoCard.css';

interface Props {
  photo: Photo;
  onClick: () => void;
}

export function PhotoCard({ photo, onClick }: Props) {
  return (
    <div className="photo-card" onClick={onClick}>
      <img
        src={`/api/photos/${photo.id}/thumbnail`}
        alt={photo.name}
        loading="lazy"
      />
      <div className="photo-card__overlay">
        <span className="photo-card__name">{photo.name}</span>
      </div>
    </div>
  );
}
