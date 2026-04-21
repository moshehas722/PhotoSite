import { useEffect, useState } from 'react';
import { fetchAboutContent } from '../api';
import './AboutView.css';

const DEFAULT_CONTENT = `Photo Album
A private photo gallery for browsing, selecting, and purchasing photos from our collection. Photos are organized into folders and can be viewed in full resolution via the lightbox.

How it works
– Browse folders using the sidebar panel.
– Click any photo to open a full-screen lightbox view.
– Add photos to your cart and submit a purchase request.
– Sign in with your Google account to track your purchases.

Contact
For questions or requests, reach out at moshe.hasson@gmail.com.`;

function renderContent(text: string) {
  return text.split(/\n{2,}/).map((block, i) => {
    const lines = block.split('\n').filter(Boolean);
    if (lines.length === 0) return null;
    return (
      <section key={i} className="about-view__section">
        {lines.map((line, j) => {
          if (j === 0 && lines.length > 1) {
            return <h2 key={j}>{line}</h2>;
          }
          return <p key={j}>{line}</p>;
        })}
      </section>
    );
  });
}

export function AboutView() {
  const [content, setContent] = useState<string | null>(null);

  useEffect(() => {
    fetchAboutContent().then(c => setContent(c || DEFAULT_CONTENT));
  }, []);

  return (
    <div className="about-view">
      <h1 className="about-view__title">About</h1>
      {content !== null && renderContent(content)}
    </div>
  );
}
