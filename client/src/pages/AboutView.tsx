import { useEffect, useState } from 'react';
import { fetchAboutContent, fetchPublicProfile, type SiteProfile } from '../api';
import './AboutView.css';

const DEFAULT_CONTENT = `Photo Album
A private photo gallery for browsing, selecting, and purchasing photos from our collection. Photos are organized into folders and can be viewed in full resolution via the lightbox.

How it works
– Browse folders using the sidebar panel.
– Click any photo to open a full-screen lightbox view.
– Add photos to your cart and submit a purchase request.
– Sign in with your Google account to track your purchases.`;

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.29 6.29l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  );
}

function ContactSection({ profile }: { profile: SiteProfile }) {
  const hasAny = profile.phone || profile.instagram || profile.facebook;
  if (!hasAny) return null;

  return (
    <section className="about-view__section">
      <h2>Contact me</h2>
      <div className="about-view__contact">
        {profile.phone && (
          <a className="about-view__contact-link" href={`tel:${profile.phone}`}>
            <span className="about-view__contact-icon"><PhoneIcon /></span>
            {profile.phone}
          </a>
        )}
        {profile.instagram && (
          <a className="about-view__contact-link" href={profile.instagram} target="_blank" rel="noreferrer">
            <span className="about-view__contact-icon"><InstagramIcon /></span>
            Instagram
          </a>
        )}
        {profile.facebook && (
          <a className="about-view__contact-link" href={profile.facebook} target="_blank" rel="noreferrer">
            <span className="about-view__contact-icon"><FacebookIcon /></span>
            Facebook
          </a>
        )}
      </div>
    </section>
  );
}

function renderContent(text: string) {
  return text.split(/\n{2,}/).map((block, i) => {
    const lines = block.split('\n').filter(Boolean);
    if (lines.length === 0) return null;
    return (
      <section key={i} className="about-view__section">
        {lines.map((line, j) => {
          if (j === 0 && lines.length > 1) return <h2 key={j}>{line}</h2>;
          return <p key={j}>{line}</p>;
        })}
      </section>
    );
  });
}

export function AboutView() {
  const [content, setContent] = useState<string | null>(null);
  const [profile, setProfile] = useState<SiteProfile | null>(null);

  useEffect(() => {
    fetchAboutContent().then(c => setContent(c || DEFAULT_CONTENT));
    fetchPublicProfile().then(setProfile);
  }, []);

  return (
    <div className="about-view">
      <h1 className="about-view__title">About</h1>
      {profile && <ContactSection profile={profile} />}
      {content !== null && renderContent(content)}
    </div>
  );
}
