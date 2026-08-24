import { Routes, Route, NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { logCareEvent } from './db/careEvents.js';
import { getAllDogs } from './db/dogs.js';
import { requestNotificationPermission, setupActionTypes, scheduleDailyReminders } from './utils/notifications.js';
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

  useEffect(() => {
    initNotifications();
  }, []);

  async function initNotifications() {
    const granted = await requestNotificationPermission();
    if (!granted) return;

    await setupActionTypes();
    await scheduleDailyReminders();

    LocalNotifications.addListener('localNotificationActionPerformed', async (action) => {
      if (action.actionId === 'yes') {
        const careType = action.notification.extra?.careType;
        const dogs = await getAllDogs();
        const dog = dogs[0];
        if (dog && careType) {
          await logCareEvent(dog.id, careType, careType === 'feed' ? null : 20);
        }
      }
      // 'no' just dismisses — nothing to log
    });
  }

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