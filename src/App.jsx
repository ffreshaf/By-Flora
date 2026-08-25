import {
  Routes,
  Route,
  NavLink,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import { App as CapacitorApp } from '@capacitor/app';
import { useEffect, useRef, useState } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';

import { logCareEvent } from './db/careEvents.js';
import { getDog } from './db/dogs.js';

import {
  requestNotificationPermission,
  setupActionTypes,
  scheduleRemindersForAllDogs,
  scheduleSmartReminders,
  cancelOrphanedReminders
} from './utils/notifications.js';

import './App.css';

import Home from './pages/Home.jsx';
import Settings from './pages/Settings.jsx';
import Profile from './pages/Profile.jsx';
import Meals from './pages/Meals.jsx';
import Activity from './pages/Activity.jsx';
import Baths from './pages/Baths.jsx';
import About from './pages/About.jsx';
import History from './pages/History.jsx';

const NAV_ITEMS = [
  { to: '/', end: true, icon: '🏠', label: 'Home' },
  { to: '/meals', icon: '🍖', label: 'Meals' },
  { to: '/activity', icon: '🐾', label: 'Activity' },
  { to: '/baths', icon: '🛁', label: 'Baths' },
  { to: '/history', icon: '📊', label: 'History' },
  { to: '/profile', icon: '👤', label: 'Profile' },
];

const SWIPE_ROUTES = NAV_ITEMS.map((item) => item.to);

function App() {
  const [spinning, setSpinning] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const touchStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    let notificationListener;

    async function initNotifications() {
      try {
        const granted = await requestNotificationPermission();
        if (!granted) {
          console.log('Notifications are not permitted');
          return;
        }

        await setupActionTypes();

        try {
          await cancelOrphanedReminders();
        } catch (err) {
          console.log('cancelOrphanedReminders failed (continuing anyway):', err);
        }

        try {
          await scheduleRemindersForAllDogs();
        } catch (err) {
          console.log('scheduleRemindersForAllDogs failed (continuing anyway):', err);
        }

        // This MUST run regardless of whether the steps above succeeded
        notificationListener = await LocalNotifications.addListener(
          'localNotificationActionPerformed',
          async (action) => {
            console.log('Notification action received:', JSON.stringify(action));

            try {
              if (action.actionId === 'yes') {
                const { careType, dogId } = action.notification.extra || {};
                console.log('careType:', careType, 'dogId:', dogId);

                if (dogId && careType) {
                  const dog = await getDog(dogId);
                  console.log('Looked up dog:', dog);

                  if (dog) {
                    await logCareEvent(dog.id, careType, careType === 'feed' ? null : 20);
                    console.log('Logged event for', dog.name);
                    await scheduleSmartReminders(dog.id);
                  }
                } else {
                  console.log('Missing dogId or careType in notification extra data');
                }
              }
            } catch (err) {
              console.log('Error handling notification action:', err);
            }

            CapacitorApp.minimizeApp();
          }
        );

        console.log('Notification listener registered successfully');
      } catch (err) {
        console.log('initNotifications failed entirely:', err);
      }
    }

    initNotifications();

    return () => {
      if (notificationListener) {
        notificationListener.remove();
      }
    };
  }, []);

  const handleLogoClick = () => {
    setSpinning(true);
    setTimeout(() => setSpinning(false), 1600);
  };

  function handleTouchStart(event) {
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  }

  function handleTouchEnd(event) {
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStart.current.x;
    const deltaY = touch.clientY - touchStart.current.y;
    const horizontalDistance = Math.abs(deltaX);
    const verticalDistance = Math.abs(deltaY);

    if (horizontalDistance < 55) return;
    if (verticalDistance > horizontalDistance * 0.75) return;

    const target = event.target;
    if (target.closest('input, textarea, select, button, a, [role="button"]')) return;

    const currentIndex = SWIPE_ROUTES.indexOf(location.pathname);
    if (currentIndex === -1) return;

    let nextIndex;
    if (deltaX < 0) {
      nextIndex = Math.min(currentIndex + 1, SWIPE_ROUTES.length - 1);
    } else {
      nextIndex = Math.max(currentIndex - 1, 0);
    }

    if (nextIndex !== currentIndex) {
      navigate(SWIPE_ROUTES[nextIndex]);
    }
  }

  const isSwipePage = SWIPE_ROUTES.includes(location.pathname);

  return (
    <div className="app-shell">
      <header>
        <img
          src="/By-Flora.png"
          alt="By Flora Logo"
          className={`logo ${spinning ? 'spinning' : ''}`}
          onClick={handleLogoClick}
        />
        <div className="header-copy">
          <h1>By Flora</h1>
          <p className="tagline">Everything for taking care of her</p>
        </div>
      </header>

      <main
        className={isSwipePage ? 'swipe-area' : ''}
        onTouchStart={isSwipePage ? handleTouchStart : undefined}
        onTouchEnd={isSwipePage ? handleTouchEnd : undefined}
      >
        <div key={location.pathname} className="route-stage">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/meals" element={<Meals />} />
            <Route path="/activity" element={<Activity />} />
            <Route path="/baths" element={<Baths />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/about" element={<About />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </div>
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
  );
}

export default App;