import { useEffect, useState } from 'react';
import { useDog } from '../hooks/useDog.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { logCareEvent, getEventsForDog } from '../db/careEvents.js';
import { calculateDailyFood } from '../utils/food.js';
import { calculateExerciseMinutes } from '../utils/exercise.js';
import { getHygieneStatus, startOfToday, PLAY_TARGET } from '../utils/reminders.js';
import { formatEventTime } from '../utils/format.js';
import { scheduleSmartReminders, scheduleHygieneReminders } from '../utils/notifications.js';
import { notifyOtherMembers } from '../utils/pushNotify.js';
import { HYGIENE_TYPES } from '../utils/hygiene.js';
import LogControls from '../components/LogControls.jsx';
import { Link } from 'react-router-dom';
import './Home.css';

const TABS = [
  { id: 'meals', label: 'Meals', icon: '🍖' },
  { id: 'activity', label: 'Activity', icon: '🐾' },
  { id: 'hygiene', label: 'Hygiene', icon: '🧴' },
];

const ACTIVITY_TYPES = [
  { id: 'walk', label: 'Walk', icon: '🐾' },
  { id: 'play', label: 'Play', icon: '🎾' },
];

function Log() {
  const { dog, loading } = useDog();
  const { household, user } = useAuth();
  const [activeTab, setActiveTab] = useState('meals');
  const [activeActivity, setActiveActivity] = useState('walk');
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

  async function handleLogActivity(minutes) {
    await logAndNotify(activeActivity, minutes, { reschedule: true });
  }

  async function handleLogHygiene(type) {
    await logAndNotify(type);
    await scheduleHygieneReminders(household.id, dog.id);
  }

  if (loading) return <p>Loading...</p>;
  if (!dog) return <p className="care-note">Set up her profile in Settings first.</p>;

  const mealEventsAll = events.filter((e) => e.type === 'feed');
  const mealEvents = mealEventsAll.slice(0, 5);

  const { mealsPerDay, gramsPerMeal } = calculateDailyFood(dog);
  const mealsToday = mealEventsAll.filter((e) => e.timestamp >= startOfToday()).length;

  const { minutesPerDay: exerciseTarget } = calculateExerciseMinutes(dog);
  const playTarget = dog.playTargetMinutes ?? PLAY_TARGET;


  const activityEventsAll = events.filter((e) => e.type === activeActivity);
  const activeActivityConfig = ACTIVITY_TYPES.find((a) => a.id === activeActivity);
  const activityEvents = activityEventsAll.slice(0, 5);
  const activityTarget = activeActivity === 'walk' ? exerciseTarget : playTarget;
  const activityMinutesToday = activityEventsAll
    .filter((e) => e.timestamp >= startOfToday())
    .reduce((s, e) => s + (e.durationMinutes || 0), 0);

  const activeHygieneConfig = HYGIENE_TYPES.find((h) => h.id === activeHygiene);
  const hygieneEvents = events.filter((e) => e.type === activeHygiene).slice(5);
  const hygieneIntervalDays = dog[activeHygieneConfig.intervalField] || activeHygieneConfig.defaultInterval;
  const hygieneStatus = getHygieneStatus(hygieneEvents[0]?.timestamp, hygieneIntervalDays, activeHygieneConfig.label);

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

          {mealEvents.length > 0 && (
            <Link to="/history" className="history-see-all">See full history →</Link>
          )}
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="log-panel">
          <div className="hygiene-switcher">
            {ACTIVITY_TYPES.map((a) => (
              <button
                key={a.id}
                className={`dog-pill ${activeActivity === a.id ? 'active' : ''}`}
                onClick={() => setActiveActivity(a.id)}
              >
                {a.icon} {a.label}
              </button>
            ))}
          </div>

          <div className="highlight-card highlight-card-solo">
            <span className="highlight-label">{activeActivityConfig.label}</span>
            <span className="highlight-value">{activityMinutesToday}/{activityTarget}m</span>
          </div>

          <p className="care-note">Log {activeActivityConfig.label.toLowerCase()} time</p>
          <LogControls onLog={handleLogActivity} />

          <h3 className="history-heading">History</h3>
          {activityEvents.length === 0 && <p className="care-note">Nothing logged yet.</p>}
          <ul className="history-list">
            {activityEvents.map((e) => (
              <li key={e.id}>
                <span className="history-type">{activeActivityConfig.label}</span>
                {formatEventTime(e.timestamp)} · {e.durationMinutes ?? '—'} min
              </li>
            ))}
          </ul>

          {activityEvents.length > 0 && (
            <Link to="/history" className="history-see-all">See full history →</Link>
          )}
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

          {hygieneEvents.length > 0 && (
            <Link to="/history" className="history-see-all">See full history →</Link>
          )}
        </div>
      )}
    </div>
  );
}

export default Log;