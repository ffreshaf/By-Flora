import '../css/Home.css'

function AboutDescription() {
  return (
    <div className="about-box description-box">
      <h2 className="about-title">About this project</h2>
      <p className="about-text">
        The By Flora Project is a personal initiative to explore web development using modern tools like React and Vite, and an attempt to make an app that will help me take care of my actual dog.
      </p>
      <p className="about-text">
        Feel free to explore the site, click around, and check out the source code!
      </p>
    </div>
  );
}

function AboutFeatures() {
  return (
    <div className="about-box features-box">
      <h2 className="about-subtitle">This project features:</h2>
      <ul className="about-list">
        <li>React routing with <code>react-router-dom</code></li>
        <li>State management using hooks</li>
        <li>Custom branding and assets</li>
        <li>Fast builds with Vite</li>
        <li>SQL Backend</li>
        <li>JavaScript and CSS languages</li>
        <li>Ai Usage because college teachers suck</li>   
      </ul>
    </div>
  );
}

function About() {
    return (
    <section className="about-section">
      <AboutFeatures />
      <AboutDescription />
    </section>
    );
}

export default About;