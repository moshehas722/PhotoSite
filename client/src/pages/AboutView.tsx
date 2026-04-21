import './AboutView.css';

export function AboutView() {
  return (
    <div className="about-view">
      <h1 className="about-view__title">About</h1>

      <section className="about-view__section">
        <h2>Photo Album</h2>
        <p>
          A private photo gallery for browsing, selecting, and purchasing photos
          from our collection. Photos are organized into folders and can be
          viewed in full resolution via the lightbox.
        </p>
      </section>

      <section className="about-view__section">
        <h2>How it works</h2>
        <ul className="about-view__list">
          <li>Browse folders using the sidebar panel.</li>
          <li>Click any photo to open a full-screen lightbox view.</li>
          <li>Add photos to your cart and submit a purchase request.</li>
          <li>Sign in with your Google account to track your purchases.</li>
        </ul>
      </section>

      <section className="about-view__section">
        <h2>Contact</h2>
        <p>
          For questions or requests, reach out at{' '}
          <a className="about-view__link" href="mailto:moshe.hasson@gmail.com">
            moshe.hasson@gmail.com
          </a>
          .
        </p>
      </section>
    </div>
  );
}
