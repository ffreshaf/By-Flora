import { Routes, Route, NavLink } from 'react-router-dom'
import { useState } from 'react'
import './App.css'
import Home from './pages/Home.jsx'
import Settings from './pages/Settings.jsx'
import Meals from './pages/Meals.jsx'
import Activity from './pages/Activity.jsx'
import Baths from './pages/Baths.jsx'
import About from './pages/About.jsx'

const NAV_ITEMS = [
  { to: '/', end: true, icon: '🏠', label: 'Home' },
  { to: '/meals', icon: '🍖', label: 'Meals' },
  { to: '/activity', icon: '🐾', label: 'Activity' },
  { to: '/baths', icon: '🛁', label: 'Baths' },
  { to: '/settings', icon: '⚙️', label: 'Settings' },
];

function App() {
  const [spinning, setSpinning] = useState(false);

  const handleLogoClick = () => {
    setSpinning(true);
    setTimeout(() => setSpinning(false), 1600);
  }

  return (
    <div className="app-shell">
      <header>
        <img src="/By-Flora.png" alt="By Flora Logo" className={`logo ${spinning ? 'spinning' : ''}`} onClick={handleLogoClick} />
        <h1>By Flora</h1>
        <p className="tagline">Everything for taking care of her</p>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/meals" element={<Meals />} />
          <Route path="/activity" element={<Activity />} />
          <Route path="/baths" element={<Baths />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>

      <nav className="bottom-nav">
        {NAV_ITEMS.map(({ to, end, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export default App