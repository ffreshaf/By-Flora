import './HomeSkeleton.css';

export default function HomeSkeleton() {
  return (
    <div className="home-page home-skeleton">
      <section className="home-hero">
        <div className="skeleton skeleton-greeting" />
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-subtitle" />

        <div className="skeleton skeleton-ring" />

        <div className="skeleton skeleton-progress" />
      </section>

      <section className="home-section">
        <div className="skeleton skeleton-heading" />

        <div className="skeleton-list">
          <div className="skeleton skeleton-row" />
          <div className="skeleton skeleton-row" />
          <div className="skeleton skeleton-row" />
        </div>
      </section>

      <section className="home-section">
        <div className="skeleton skeleton-heading" />

        <div className="skeleton-grid">
          <div className="skeleton skeleton-card" />
          <div className="skeleton skeleton-card" />
          <div className="skeleton skeleton-card" />
        </div>
      </section>
    </div>
  );
}