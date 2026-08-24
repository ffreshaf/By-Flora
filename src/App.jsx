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
import { getAllDogs } from './db/dogs.js';

import {
  requestNotificationPermission,
  setupActionTypes,
  scheduleSmartReminders,
} from './utils/notifications.js';

import './App.css';

import Home from './pages/Home.jsx';
import Settings from './pages/Settings.jsx';
import Meals from './pages/Meals.jsx';
import Activity from './pages/Activity.jsx';
import Baths from './pages/Baths.jsx';
import About from './pages/About.jsx';

const NAV_ITEMS = [
  { to: '/', end: true, icon: '🏠', label: 'Home' },
  { to: '/meals', icon: '🍖', label: 'Meals' },
  { to: '/activity', icon: '🐾', label: 'Activity' },
  { to: '/baths', icon: '🛁', label: 'Baths' },
  { to: '/settings', icon: '⚙️', label: 'Settings' },
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
      const granted = await requestNotificationPermission();

      if (!granted) {
        console.log('Notifications are not permitted');
        return;
      }

      // Register the "Yes, done" / "Not yet" buttons.
      await setupActionTypes();

      // Find the current dog.
      const dogs = await getAllDogs();
      const dog = dogs[0];

      // Schedule the reminders.
      if (dog) {
        await scheduleSmartReminders(dog.id);
      }

      // Listen for notification actions.
      notificationListener =
        await LocalNotifications.addListener(
          'localNotificationActionPerformed',
          async (action) => {
            if (action.actionId === 'yes') {
              const careType =
                action.notification.extra?.careType;

              if (dog && careType) {
                await logCareEvent(
                  dog.id,
                  careType,
                  careType === 'feed' ? null : 20
                );

                // Recalculate reminders after logging.
                await scheduleSmartReminders(dog.id);
              }
            }

            CapacitorApp.minimizeApp();
          }
        );
    }

    initNotifications();

    // Clean up listener.
    return () => {
      if (notificationListener) {
        notificationListener.remove();
      }
    };
  }, []);

  const handleLogoClick = () => {
    setSpinning(true);

    setTimeout(() => {
      setSpinning(false);
    }, 1600);
  };

  function handleTouchStart(event) {
    const touch = event.touches[0];

    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
    };
  }

  function handleTouchEnd(event) {
    const touch = event.changedTouches[0];

    const deltaX = touch.clientX - touchStart.current.x;
    const deltaY = touch.clientY - touchStart.current.y;

    const horizontalDistance = Math.abs(deltaX);
    const verticalDistance = Math.abs(deltaY);

    // Ignore small movements.
    if (horizontalDistance < 55) return;

    // Ignore primarily vertical movements so normal scrolling works.
    if (verticalDistance > horizontalDistance * 0.75) {
      return;
    }

    // Don't swipe while interacting with controls.
    const target = event.target;

    if (
      target.closest(
        'input, textarea, select, button, a, [role="button"]'
      )
    ) {
      return;
    }

    const currentIndex = SWIPE_ROUTES.indexOf(
      location.pathname
    );

    // About and future non-main routes don't participate.
    if (currentIndex === -1) return;

    let nextIndex;

    if (deltaX < 0) {
      // Swipe left → next page.
      nextIndex = Math.min(
        currentIndex + 1,
        SWIPE_ROUTES.length - 1
      );
    } else {
      // Swipe right → previous page.
      nextIndex = Math.max(currentIndex - 1, 0);
    }

    if (nextIndex !== currentIndex) {
      navigate(SWIPE_ROUTES[nextIndex]);
    }
  }

  const isSwipePage = SWIPE_ROUTES.includes(
    location.pathname
  );

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

          <p className="tagline">
            Everything for taking care of her
          </p>
        </div>
      </header>

      <main
        className={isSwipePage ? 'swipe-area' : ''}
        onTouchStart={
          isSwipePage ? handleTouchStart : undefined
        }
        onTouchEnd={
          isSwipePage ? handleTouchEnd : undefined
        }
      >
        <div
          key={location.pathname}
          className="route-stage"
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/meals" element={<Meals />} />
            <Route path="/activity" element={<Activity />} />
            <Route path="/baths" element={<Baths />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </div>
      </main>

      <nav className="bottom-nav">
        {NAV_ITEMS.map(
          ({ to, end, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `nav-item${isActive ? ' active' : ''}`
              }
            >
              <span className="nav-icon">
                {icon}
              </span>

              {label}
            </NavLink>
          )
        )}
      </nav>

    </div>
  );
}

export default App;