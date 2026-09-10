import { Link } from 'react-router-dom';

import '../css/Home.css';

function About() {
  return (
    <section className="about-section">

      <Link to="/settings" className="settings-back-link">
        ‹ Settings
      </Link>

      {/* INTRO */}
      <div className="about-box description-box">

        <p className="about-eyebrow">BY FLORA</p>

        <h2 className="about-title">
          Taking care of her,
          <br />
          a little easier.
        </h2>

        <p className="about-text">
          By Flora is a personal dog-care companion designed to make
          everyday care simpler, more consistent and easier to remember.
        </p>

        <p className="about-text">
          Feeding, exercise, play, reminders, history and household
          coordination, all in one place.
        </p>

      </div>


      {/* WHAT IT DOES */}
      <div className="about-box">

        <div className="about-section-heading">
          <h2 className="about-subtitle">What By Flora does</h2>
        </div>

        <div className="about-feature-list">

          <div className="about-feature">
            <span className="about-feature-icon">🍖</span>

            <div>
              <strong>Daily care</strong>
              <p>
                Keep track of meals, walks, play and other care activities.
              </p>
            </div>
          </div>

          <div className="about-feature">
            <span className="about-feature-icon">🎯</span>

            <div>
              <strong>Care targets</strong>
              <p>
                Personalised food and exercise targets based on her profile.
              </p>
            </div>
          </div>

          <div className="about-feature">
            <span className="about-feature-icon">🔔</span>

            <div>
              <strong>Reminders</strong>
              <p>
                Gentle reminders to help keep her routine on track.
              </p>
            </div>
          </div>

          <div className="about-feature">
            <span className="about-feature-icon">📖</span>

            <div>
              <strong>Care history</strong>
              <p>
                See what has been done and look back at previous care.
              </p>
            </div>
          </div>

          <div className="about-feature">
            <span className="about-feature-icon">🐶</span>

            <div>
              <strong>Multiple dogs</strong>
              <p>
                Keep profiles and routines for every dog in the household.
              </p>
            </div>
          </div>

          <div className="about-feature">
            <span className="about-feature-icon">👨‍👩‍👧</span>

            <div>
              <strong>Family sharing</strong>
              <p>
                Help everyone in the household stay on the same page.
              </p>
            </div>
          </div>

        </div>

      </div>


      {/* TECHNOLOGY */}
      <div className="about-box">

        <div className="about-section-heading">
          <h2 className="about-subtitle">Built with</h2>
        </div>

        <div className="about-tech-tags">

          <span>React</span>
          <span>Vite</span>
          <span>React Router</span>
          <span>Firebase</span>
          <span>Firestore</span>
          <span>Supabase</span>
          <span>Edge Functions</span>
          <span>OneSignal</span>
          <span>Sentry</span>
          <span>Capacitor</span>
          <span>IndexedDB</span>

        </div>

        <p className="about-text about-tech-note">
          A modern web and mobile stack working together behind a
          simple, dog-focused interface.
        </p>

      </div>


      {/* HOW IT WORKS */}
      <div className="about-box">

        <div className="about-section-heading">
          <h2 className="about-subtitle">How it works</h2>
        </div>

        <div className="about-flow">

          <div className="about-flow-item">
            <span className="about-flow-icon">🐶</span>
            <strong>Her routine</strong>
            <small>
              Your dog's profile and care targets
            </small>
          </div>

          <div className="about-flow-arrow">↓</div>

          <div className="about-flow-item">
            <span className="about-flow-icon">☁️</span>
            <strong>Cloud services</strong>
            <small>
              Secure authentication and application data
            </small>
          </div>

          <div className="about-flow-arrow">↓</div>

          <div className="about-flow-item">
            <span className="about-flow-icon">🔔</span>
            <strong>Helpful reminders</strong>
            <small>
              Notifications when care is due
            </small>
          </div>

        </div>

      </div>


      {/* PROJECT */}
      <div className="about-box">

        <div className="about-section-heading">
          <h2 className="about-subtitle">A personal project</h2>
        </div>

        <p className="about-text">
          By Flora started with a simple idea: make the small,
          everyday responsibilities of caring for a dog easier to
          organise.
        </p>

        <p className="about-text">
          It has grown into an exploration of modern web and mobile
          development, combining React, cloud services, native
          capabilities, notifications and observability.
        </p>

        <p className="about-text">
          AI-assisted development has also been part of the process,
          alongside learning, experimentation and hands-on development.
        </p>

        <p className="about-signature">
          Made with care 🐾
        </p>

      </div>

    </section>
  );
}

export default About;
