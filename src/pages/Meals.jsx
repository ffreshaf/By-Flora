import { useEffect, useState } from 'react';
import { useDog } from '../hooks/useDog.js';
import { logCareEvent, getEventsForDog } from '../db/careEvents.js';
import { calculateDailyFood } from '../utils/food.js';
import { startOfToday } from '../utils/reminders.js';
import { formatEventTime } from '../utils/format.js';
import { scheduleSmartReminders } from '../utils/notifications.js';
import './Home.css';
import { useAuth } from '../contexts/AuthContext.jsx';

function Meals() {
  const { dog, loading } = useDog();
  const { household } = useAuth();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (dog && household?.id) loadEvents();
  }, [dog, household?.id]);

  async function loadEvents() {
    const all = await getEventsForDog(household.id, dog.id);
    setEvents(all.filter((e) => e.type === 'feed'));
  }

  async function handleLog() {
    await logCareEvent(household.id, dog.id, 'feed');
    await loadEvents();
    await scheduleSmartReminders(dog.id);
  }

  if (loading) return <p>Loading...</p>;
  if (!dog) return <p className="care-note">Set up her profile in Settings first.</p>;

  const { mealsPerDay, gramsPerMeal } = calculateDailyFood(dog);
  const mealsToday = events.filter((e) => e.timestamp >= startOfToday()).length;

  return (
    <div className="care-card">
      <h2>Meals</h2>
      <p className="care-note">Target: {mealsPerDay}× {gramsPerMeal}g per day</p>

      <div className="highlight-card highlight-card-solo">
        <span className="highlight-label">Today</span>
        <span className="highlight-value">{mealsToday} / {mealsPerDay}</span>
      </div>

      <button className="btn btn-primary log-btn" onClick={handleLog}>Log a meal</button>

      <h3 className="history-heading">History</h3>
      {events.length === 0 && <p className="care-note">No meals logged yet.</p>}
      <ul className="history-list">
        {events.map((e) => <li key={e.id}>{formatEventTime(e.timestamp)}</li>)}
      </ul>
    </div>
  );
}

export default Meals;