import {
  Routes,
  Route,
  NavLink,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import { useAuth } from './contexts/AuthContext.jsx';

import { App as CapacitorApp } from '@capacitor/app';
import { useEffect, useRef, useState } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';

import {
  requestNotificationPermission,
  scheduleRemindersForAllDogs,
  cancelOrphanedReminders
} from './utils/notifications.js';

import { initPush } from './utils/push.js';

import './App.css';

import Home from './pages/Home.jsx';
import Settings from './pages/Settings.jsx';
import Profile from './pages/Profile.jsx';
import Log from './pages/Log.jsx';
import About from './pages/About.jsx';
import Login from './pages/Login.jsx';
import HouseholdSetup from './pages/HouseholdSetup.jsx';
import SettingsFamily from './pages/SettingsFamily.jsx';
import SettingsDogs from './pages/SettingsDogs.jsx';
import SettingsCustomReminders from './pages/SettingsCustomReminders.jsx';
import SettingsReminderTimes from './pages/SettingsReminderTimes.jsx';
import ConfirmCare from './pages/ConfirmCare.jsx';
import SettingsCareTargets from './pages/SettingsCareTargets.jsx';
import History from './pages/History.jsx';

import AppLoader from './components/AppLoader.jsx';

const NAV_ITEMS = [
  { to: '/', end: true, icon: '🏠', label: 'Home' },
  { to: '/profile', icon: '👤', label: 'Profile' },
];

const SWIPE_ROUTES = ['/', '/log', '/profile'];

function App() {
  const [spinning, setSpinning] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const touchStart = useRef({ x: 0, y: 0 });

  const { user, household, emailVerified, loading: authLoading } = useAuth();

  useEffect(() => {
    let notificationListener;

    async function initNotifications() {
      try {
        notificationListener = await LocalNotifications.addListener(
          'localNotificationActionPerformed',
          async (action) => {
            console.log('Notification action received:', JSON.stringify(action));

            const { careType, dogId } = action.notification.extra || {};

            if (careType && dogId) {
              navigate(`/confirm?careType=${careType}&dogId=${dogId}`);
            }
          }
        );

        console.log('Notification listener registered successfully');

        const granted = await requestNotificationPermission();

        await initPush(user?.uid);

        if (!granted) {
          console.log('Notifications are not permitted');
          return;
        }

        if (!household?.id) {
          console.log('No household yet, skipping reminder scheduling');
          return;
        }

        try {
          await cancelOrphanedReminders(household.id);
        } catch (err) {
          console.log('cancelOrphanedReminders failed:', err);
        }

        try {
          await scheduleRemindersForAllDogs(household.id);
        } catch (err) {
          console.log('scheduleRemindersForAllDogs failed:', err);
        }

      } catch (err) {
        console.error('initNotifications failed:', err);
      }
    }

    if (user && household?.id) {
      initNotifications();
    }

    return () => {
      if (notificationListener) {
        notificationListener.remove();
        notificationListener = null;
      }
    };
  }, [user, household?.id]);

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

  if (authLoading) {
    return <AppLoader />;
  }
  
  if (!user) return <Login />;

  if (!emailVerified) {
    return <Login verificationOnly />;
  }
  if (!household) return <HouseholdSetup />;

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
            <Route path="/log" element={<Log />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/about" element={<About />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings/family" element={<SettingsFamily />} />
            <Route path="/settings/dogs" element={<SettingsDogs />} />
            <Route path="/settings/care-targets" element={<SettingsCareTargets />} />
            <Route path="/settings/reminders" element={<SettingsCustomReminders />} />
            <Route path="/settings/reminder-times" element={<SettingsReminderTimes />} />
            <Route path="/confirm" element={<ConfirmCare />} />
          </Routes>
        </div>
      </main>

      <nav className="bottom-nav">
        <NavLink
          to="/"
          end
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <span className="nav-icon">🏠</span>
          Home
        </NavLink>

        <div className="nav-fab-slot">
          <NavLink
            to="/log"
            className={({ isActive }) => `nav-fab${isActive ? ' active' : ''}`}
          >
            <span className="nav-fab-icon">+</span>
          </NavLink>
        </div>

        <NavLink
          to="/profile"
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <span className="nav-icon">👤</span>
          Profile
        </NavLink>
      </nav>
    </div>
  );
}

export default App;