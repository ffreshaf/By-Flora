import { useEffect, useState } from 'react';
import { logCareEvent, getEventsForDog } from '../db/careEvents.js';
import { startOfToday, getBathStatus, PLAY_TARGET } from '../utils/reminders.js';

function TodayCare({ dog, mealsPerDay, exerciseMinutesPerDay }) {
  const [events, setEvents] = useState([]);
  const [walkInput, setWalkInput] = useState('');
  const [playInput, setPlayInput] = useState('');

  useEffect(() => {
    loadEvents();
  }, [dog.id]);

  async function loadEvents() {
    setEvents(await getEventsForDog(dog.id));
  }

  const todayStart = startOfToday();
  const todayEvents = events.filter((e) => e.timestamp >= todayStart);

  const mealsToday = todayEvents.filter((e) => e.type === 'feed').length;
  const walkMinutesToday = todayEvents
    .filter((e) => e.type === 'walk')
    .reduce((sum, e) => sum + (e.durationMinutes || 0), 0);
  const playMinutesToday = todayEvents
    .filter((e) => e.type === 'play')
    .reduce((sum, e) => sum + (e.durationMinutes || 0), 0);

  const lastBath = events.find((e) => e.type === 'bath');
  const bathStatus = getBathStatus(lastBath?.timestamp);

  async function handleLogFeed() {
    await logCareEvent(dog.id, 'feed');
    await loadEvents();
  }

  async function handleLogWalk() {
    const minutes = Number(walkInput);
    if (!minutes || minutes <= 0) return;
    await logCareEvent(dog.id, 'walk', minutes);
    setWalkInput('');
    await loadEvents();
  }

  async function handleLogPlay() {
    const minutes = Number(playInput);
    if (!minutes || minutes <= 0) return;
    await logCareEvent(dog.id, 'play', minutes);
    setPlayInput('');
    await loadEvents();
  }

  async function handleLogBath() {
    await logCareEvent(dog.id, 'bath');
    await loadEvents();
  }

  return (
    <div className="today-care">
      <h3>Today's care</h3>

      <div className="care-row">
        <div className="care-row-info">
          <span className="care-row-label">Meals</span>
          <span className="care-row-progress">{mealsToday} / {mealsPerDay}</span>
        </div>
        <button className="btn btn-secondary btn-small" onClick={handleLogFeed}>Log meal</button>
      </div>

      <div className="care-row">
        <div className="care-row-info">
          <span className="care-row-label">Walk</span>
          <span className="care-row-progress">{walkMinutesToday} / {exerciseMinutesPerDay} min</span>
        </div>
        <div className="care-row-input">
          <input type="number" min="1" placeholder="min" value={walkInput} onChange={(e) => setWalkInput(e.target.value)} />
          <button className="btn btn-secondary btn-small" onClick={handleLogWalk}>Log</button>
        </div>
      </div>

      <div className="care-row">
        <div className="care-row-info">
          <span className="care-row-label">Play</span>
          <span className="care-row-progress">{playMinutesToday} / {PLAY_TARGET} min</span>
        </div>
        <div className="care-row-input">
          <input type="number" min="1" placeholder="min" value={playInput} onChange={(e) => setPlayInput(e.target.value)} />
          <button className="btn btn-secondary btn-small" onClick={handleLogPlay}>Log</button>
        </div>
      </div>

      <div className="care-row">
        <div className="care-row-info">
          <span className="care-row-label">Bath</span>
          <span className={`care-row-progress ${bathStatus.isDue ? 'is-due' : ''}`}>{bathStatus.message}</span>
        </div>
        <button className="btn btn-secondary btn-small" onClick={handleLogBath}>Log bath</button>
      </div>
    </div>
  );
}

export default TodayCare;