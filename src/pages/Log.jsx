import { useEffect, useState } from 'react';
import { useDog } from '../hooks/useDog.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { logCareEvent, getEventsForDog } from '../db/careEvents.js';
import { calculateDailyFood } from '../utils/food.js';
import { calculateExerciseMinutes } from '../utils/exercise.js';
import { getBathStatus, startOfToday, PLAY_TARGET } from '../utils/reminders.js';
import { formatEventTime } from '../utils/format.js';
import { scheduleSmartReminders } from '../utils/notifications.js';
import { notifyOtherMembers } from '../utils/pushNotify.js';
import LogControls from '../components/LogControls.jsx';
import './Home.css';

const TABS = [
  { id: 'meals', label: 'Meals', icon: '🍖' },
  { id: 'activity', label: 'Activity', icon: '🐾' },
  { id: 'hygiene', label: 'Hygiene', icon: '🧴' },
];

const HYGIENE_TYPES = [
  { id: 'bath', label: 'Bath', icon: '🛁', intervalField: 'bathIntervalDays', defaultInterval: 28 },
  { id: 'groom', label: 'Groom', icon: '✂️', intervalField: 'groomIntervalDays', defaultInterval: 42 },
  { id: 'nails', label: 'Nails', icon: '💅', intervalField: 'nailIntervalDays', defaultInterval: 21 },
];

function Log() {
  const { dog, loading } = useDog();
  const { household, user } = useAuth();
  const [activeTab, setActiveTab] = useState('meals');
  const [activeHygiene, setActiveHygiene] = useState('bath');
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (dog && household?.id) loadEvents();
  }, [dog, household?.id]);

  async function loadEvents() {
    const all = await getEventsForDog(household.id, dog.id);
    setEvents(all);
  }

  async function logAndNotify(type, minutes = null, { reschedule = false } = {}) {
    await logCareEvent(
      household.id,
      dog.id,
      type,
      minutes,
      user.uid,
      user.displayName || user.email
    );

    await loadEvents();

    if (reschedule) {
      await scheduleSmartReminders(household.id, dog.id);
    }

    await notifyOtherMembers({
      household,
      loggerUid: user.uid,
      loggerName: user.displayName || user.email,
      dogName: dog.name,
      careType: type,
    });
  }

  async function handleLogMeal() {
    await logAndNotify('feed', null, { reschedule: true });
  }

  async function handleLogActivity(type, minutes) {
    await logAndNotify(type, minutes, { reschedule: true });
  }

  async function handleLogHygiene(type) {
    await logAndNotify(type);
  }

  if (loading) return <p>Loading...</p>;
  if (!dog) return <p className="care-note">Set up her profile in Settings first.</p>;

  const mealEvents = events.filter((e) => e.type === 'feed');
  const activityEvents = events.filter((e) => e.type === 'walk' || e.type === 'play');

  const { mealsPerDay, gramsPerMeal } = calculateDailyFood(dog);
  const mealsToday = mealEvents.filter((e) => e.timestamp >= startOfToday()).length;

  const { minutesPerDay: exerciseTarget } = calculateExerciseMinutes(dog);
  const todayActivity = activityEvents.filter((e) => e.timestamp >= startOfToday());
  const walkMinutesToday = todayActivity
    .filter((e) => e.type === 'walk')
    .reduce((s, e) => s + (e.durationMinutes || 0), 0);
  const playMinutesToday = todayActivity
    .filter((e) => e.type === 'play')
    .reduce((s, e) => s + (e.durationMinutes || 0), 0);

  const activeHygieneConfig = HYGIENE_TYPES.find((h) => h.id === activeHygiene);
  const hygieneEvents = events.filter((e) => e.type === activeHygiene);
  const hygieneIntervalDays = dog[activeHygieneConfig.intervalField] || activeHygieneConfig.defaultInterval;
  const hygieneStatus = getBathStatus(hygieneEvents[0]?.timestamp, hygieneIntervalDays);
  const playTarget = dog.playTargetMinutes ?? PLAY_TARGET;

  return (
    <div className="care-card">
      <h2>Log care for {dog.name}</h2>

      <div className="log-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`log-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="log-tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'meals' && (
        <div className="log-panel">
          <p className="care-note">Target: {mealsPerDay}× {gramsPerMeal}g per day</p>

          <div className="highlight-card highlight-card-solo">
            <span className="highlight-label">Today</span>
            <span className="highlight-value">{mealsToday} / {mealsPerDay}</span>
          </div>

          <button className="btn btn-primary log-btn" onClick={handleLogMeal}>Log a meal</button>

          <h3 className="history-heading">History</h3>
          {mealEvents.length === 0 && <p className="care-note">No meals logged yet.</p>}
          <ul className="history-list">
            {mealEvents.map((e) => <li key={e.id}>{formatEventTime(e.timestamp)}</li>)}
          </ul>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="log-panel">
          <div className="highlight-grid highlight-grid-2">
            <div className="highlight-card">
              <span className="highlight-label">Walk</span>
              <span className="highlight-value">{walkMinutesToday}/{exerciseTarget}m</span>
            </div>
            <div className="highlight-card">
              <span className="highlight-label">Play</span>
              <span className="highlight-value">{playMinutesToday}/{PLAY_TARGET}m</span>
            </div>
          </div>

          <p className="care-note">Log a walk</p>
          <LogControls onLog={(min) => handleLogActivity('walk', min)} />

          <p className="care-note" style={{ marginTop: '16px' }}>Log play time</p>
          <LogControls onLog={(min) => handleLogActivity('play', min)} />

          <h3 className="history-heading">History</h3>
          {activityEvents.length === 0 && <p className="care-note">Nothing logged yet.</p>}
          <ul className="history-list">
            {activityEvents.map((e) => (
              <li key={e.id}>
                <span className="history-type">{e.type === 'walk' ? 'Walk' : 'Play'}</span>
                {formatEventTime(e.timestamp)} · {e.durationMinutes ?? '—'} min
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeTab === 'hygiene' && (
        <div className="log-panel">
          <div className="hygiene-switcher">
            {HYGIENE_TYPES.map((h) => (
              <button
                key={h.id}
                className={`dog-pill ${activeHygiene === h.id ? 'active' : ''}`}
                onClick={() => setActiveHygiene(h.id)}
              >
                {h.icon} {h.label}
              </button>
            ))}
          </div>

          <div className={`highlight-card highlight-card-solo ${hygieneStatus.isDue ? 'is-due-card' : ''}`}>
            <span className="highlight-label">Status</span>
            <span className="highlight-value highlight-value-small">{hygieneStatus.message}</span>
          </div>

          <p className="care-note">Every {hygieneIntervalDays} days</p>

          <button className="btn btn-primary log-btn" onClick={() => handleLogHygiene(activeHygiene)}>
            Log {activeHygieneConfig.label.toLowerCase()}
          </button>

          <h3 className="history-heading">History</h3>
          {hygieneEvents.length === 0 && <p className="care-note">No {activeHygieneConfig.label.toLowerCase()} logged yet.</p>}
          <ul className="history-list">
            {hygieneEvents.map((e) => <li key={e.id}>{formatEventTime(e.timestamp)}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

export default Log;