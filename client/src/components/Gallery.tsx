import { useState } from 'react';
import Masonry from 'react-masonry-css';
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

interface Props {
  photos: Photo[];
}

export function Gallery({ photos }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  if (photos.length === 0) {
    return <div className="gallery-status">No photos in this folder.</div>;
  }

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
