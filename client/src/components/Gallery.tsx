import { useEffect, useState } from 'react';
import Masonry from 'react-masonry-css';
import { fetchPhotos } from '../api';
import type { Photo } from '../types';
import { PhotoCard } from './PhotoCard';
import { PhotoLightbox } from './PhotoLightbox';
import './Gallery.css';

const BREAKPOINTS = {
  default: 4,
  1200: 3,
  900: 2,
  600: 1,
};

export function Gallery() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  useEffect(() => {
    fetchPhotos()
      .then(setPhotos)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="gallery-status">Loading photos…</div>;
  if (error) return <div className="gallery-status gallery-status--error">Error: {error}</div>;
  if (photos.length === 0) return <div className="gallery-status">No photos found in this folder.</div>;

  return (
    <>
      <Masonry
        breakpointCols={BREAKPOINTS}
        className="masonry-grid"
        columnClassName="masonry-grid__column"
      >
        {photos.map((photo, i) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            onClick={() => setLightboxIndex(i)}
          />
        ))}
      </Masonry>

      <PhotoLightbox
        photos={photos}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(-1)}
        onNavigate={setLightboxIndex}
      />
    </>
  );
}
