import '../css/Home.css';

function About() {
  return (
    <section className="about-section">

      <div className="about-box description-box">
        <h2 className="about-title">About By Flora</h2>

        <p className="about-text">
          By Flora is a personal project created to make taking care
          of my dog a little easier. It combines a simple care tracker
          with reminders for meals, walks, play and baths.
        </p>

        <p className="about-text">
          The project is also an exploration of modern web and mobile
          development using React, Vite and Capacitor.
        </p>
      </div>

      <div className="about-box features-box">
        <h2 className="about-subtitle">Built with</h2>

        <ul className="about-list">
          <li>React & JSX</li>
          <li>React Router</li>
          <li>Vite</li>
          <li>IndexedDB for local storage</li>
          <li>Capacitor native notifications</li>
          <li>Smart care reminders</li>
          <li>Responsive mobile-first design</li>
          <li>Custom CSS & branding</li>
          <li>Ai Usage because college teachers suck</li>   
        </ul>
      </div>

    </section>
  );
}

export default About;