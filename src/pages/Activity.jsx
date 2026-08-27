import { useEffect, useState } from 'react';
import { useDog } from '../hooks/useDog.js';
import { logCareEvent, getEventsForDog } from '../db/careEvents.js';
import { calculateExerciseMinutes } from '../utils/exercise.js';
import { startOfToday, PLAY_TARGET } from '../utils/reminders.js';
import { formatEventTime } from '../utils/format.js';
import LogControls from '../components/LogControls.jsx';
import { scheduleSmartReminders } from '../utils/notifications.js';
import './Home.css';
import { useAuth } from '../contexts/AuthContext.jsx';

function Activity() {
  const { dog, loading } = useDog();
  const { household } = useAuth();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (dog && household?.id) loadEvents();
  }, [dog, household?.id]);

  async function loadEvents() {
    const all = await getEventsForDog(household.id, dog.id);
    setEvents(all.filter((e) => e.type === 'walk' || e.type === 'play'));
  }

  async function handleLog(type, minutes) {
    await logCareEvent(household.id, dog.id, type, minutes);
    await loadEvents();
    await scheduleSmartReminders(dog.id);
  }

  if (loading) return <p>Loading...</p>;
  if (!dog) return <p className="care-note">Set up her profile in Settings first.</p>;

  const { minutesPerDay: exerciseTarget } = calculateExerciseMinutes(dog);
  const todayEvents = events.filter((e) => e.timestamp >= startOfToday());
  const walkMinutesToday = todayEvents
    .filter((e) => e.type === 'walk')
    .reduce((s, e) => s + (e.durationMinutes || 0), 0);
  const playMinutesToday = todayEvents
    .filter((e) => e.type === 'play')
    .reduce((s, e) => s + (e.durationMinutes || 0), 0);

  return (
    <div className="care-card">
      <h2>Activity</h2>

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
      <LogControls onLog={(min) => handleLog('walk', min)} />

      <p className="care-note" style={{ marginTop: '16px' }}>Log play time</p>
      <LogControls onLog={(min) => handleLog('play', min)} />

      <h3 className="history-heading">History</h3>
      {events.length === 0 && <p className="care-note">Nothing logged yet.</p>}
      <ul className="history-list">
        {events.map((e) => (
          <li key={e.id}>
            <span className="history-type">{e.type === 'walk' ? 'Walk' : 'Play'}</span>
            {formatEventTime(e.timestamp)} · {e.durationMinutes ?? '—'} min
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Activity;