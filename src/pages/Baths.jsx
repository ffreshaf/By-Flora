import { useEffect, useState } from 'react';
import { useDog } from '../hooks/useDog.js';
import { logCareEvent, getEventsForDog } from '../db/careEvents.js';
import { getBathStatus } from '../utils/reminders.js';
import { formatEventTime } from '../utils/format.js';
import './Home.css';

function Baths() {
  const { dog, loading } = useDog();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (dog) loadEvents();
  }, [dog]);

  async function loadEvents() {
    const all = await getEventsForDog(dog.id);
    setEvents(all.filter((e) => e.type === 'bath'));
  }

  async function handleLog() {
    await logCareEvent(dog.id, 'bath');
    await loadEvents();
  }

  if (loading) return <p>Loading...</p>;
  if (!dog) return <p className="care-note">Set up her profile in Settings first.</p>;

  const status = getBathStatus(
    events[0]?.timestamp,
    dog.bathIntervalDays || 28
  );

  return (
    <div className="care-card">
      <h2>Baths</h2>

      <div className={`highlight-card highlight-card-solo ${status.isDue ? 'is-due-card' : ''}`}>
        <span className="highlight-label">Status</span>
        <span className="highlight-value highlight-value-small">{status.message}</span>
      </div>

      <p className="care-note">
        Every {dog.bathIntervalDays || 28} days
      </p>

      <button className="btn btn-primary log-btn" onClick={handleLog}>Log a bath</button>

      <h3 className="history-heading">History</h3>
      {events.length === 0 && <p className="care-note">No baths logged yet.</p>}
      <ul className="history-list">
        {events.map((e) => <li key={e.id}>{formatEventTime(e.timestamp)}</li>)}
      </ul>
    </div>
  );
}

export default Baths;