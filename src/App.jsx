import { Routes, Route, NavLink } from 'react-router-dom'
import { useState } from 'react'
import './App.css'
import Home from './pages/Home.jsx'
import Settings from './pages/Settings.jsx'
import Meals from './pages/Meals.jsx'
import Activity from './pages/Activity.jsx'
import Baths from './pages/Baths.jsx'
import About from './pages/About.jsx'

function App() {
  const [spinning, setSpinning] = useState(false);

  const handleLogoClick = () => {
    setSpinning(true);
    setTimeout(() => setSpinning(false), 2000);
  }

  return (
    <div className="app-shell">
      <header>
        <h1>By Flora</h1>
        <img src="/By-Flora.png" alt="By Flora Logo" className={`logo ${spinning ? 'spinning' : ''}`} onClick={handleLogoClick} />
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
        <NavLink to="/" end className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>Home</NavLink>
        <NavLink to="/meals" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>Meals</NavLink>
        <NavLink to="/activity" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>Activity</NavLink>
        <NavLink to="/baths" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>Baths</NavLink>
        <NavLink to="/settings" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>Settings</NavLink>
      </nav>
    </div>
  )
}

export default App