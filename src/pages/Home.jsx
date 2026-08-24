import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDog } from '../hooks/useDog.js';
import { getEventsForDog } from '../db/careEvents.js';
import { startOfToday } from '../utils/reminders.js';
import CareRing from '../components/CareRing.jsx';
import { calculateDailyFood } from '../utils/food.js';
import { calculateExerciseMinutes } from '../utils/exercise.js';
import { PLAY_TARGET } from '../utils/reminders.js';
import './Home.css';

function Home() {
  const { dog, allDogs, loading, switchDog } = useDog();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (dog) loadEvents();
  }, [dog]);

  async function loadEvents() {
    setEvents(await getEventsForDog(dog.id));
  }

  if (loading) return <p>Loading...</p>;

  if (!dog) {
    return (
      <div className="care-card">
        <h2>Welcome!</h2>
        <p>Let's set up her profile first.</p>
        <Link to="/settings" className="btn btn-primary">Go to Settings</Link>
      </div>
    );
  }

  const { gramsPerDay, mealsPerDay, gramsPerMeal, goalNote } = calculateDailyFood(dog);
  const { minutesPerDay, sessions, minutesPerSession, note } = calculateExerciseMinutes(dog);

  const finalGramsPerDay = dog.foodOverrideGrams ?? gramsPerDay;
  const finalGramsPerMeal = Math.round(finalGramsPerDay / mealsPerDay);
  const finalMinutesPerDay = dog.exerciseOverrideMinutes ?? minutesPerDay;

  const todayEvents = events.filter((e) => e.timestamp >= startOfToday());
  const feedToday = todayEvents.filter((e) => e.type === 'feed').length;
  const walkMinutesToday = todayEvents.filter((e) => e.type === 'walk').reduce((s, e) => s + (e.durationMinutes || 0), 0);
  const playMinutesToday = todayEvents.filter((e) => e.type === 'play').reduce((s, e) => s + (e.durationMinutes || 0), 0);

  const feedProgress = mealsPerDay > 0 ? Math.min(feedToday / mealsPerDay, 1) : 0;
  const walkProgress = finalMinutesPerDay > 0 ? Math.min(walkMinutesToday / finalMinutesPerDay, 1) : 0;
  const playProgress = PLAY_TARGET > 0 ? Math.min(playMinutesToday / PLAY_TARGET, 1) : 0;
  const overallProgress = (feedProgress + walkProgress + playProgress) / 3;

  return (
    <div className="care-card">
      {allDogs.length > 1 && (
        <div className="dog-switcher">
          {allDogs.map((d) => (
            <button
              key={d.id}
              className={`dog-pill ${dog.id === d.id ? 'active' : ''}`}
              onClick={() => switchDog(d.id)}
            >
              {d.name}
            </button>
          ))}
        </div>
      )}

      <CareRing name={dog.name} progress={overallProgress} />
      <h2>{dog.name}</h2>

      <div className="highlight-grid">
        <div className="highlight-card">
          <span className="highlight-label">Food</span>
          <span className="highlight-value">{mealsPerDay}× {finalGramsPerMeal}g</span>
          <span className="highlight-detail">{finalGramsPerDay}g/day{dog.foodOverrideGrams ? ' · custom' : ''}</span>
        </div>
        <div className="highlight-card">
          <span className="highlight-label">Exercise</span>
          <span className="highlight-value">
            {sessions ? `${sessions}× ${minutesPerSession}m` : `${finalMinutesPerDay}m`}
          </span>
          <span className="highlight-detail">
            {sessions ? `${finalMinutesPerDay} min/day` : 'walk or split up'}{dog.exerciseOverrideMinutes ? ' · custom' : ''}
          </span>
        </div>
        <div className="highlight-card">
          <span className="highlight-label">Play</span>
          <span className="highlight-value">{PLAY_TARGET}m</span>
          <span className="highlight-detail">enrichment/day</span>
        </div>
      </div>

      {goalNote && <p className="care-note">{goalNote}</p>}
      {note && <p className="care-note">{note}</p>}

      <ul className="stat-list">
        <li>Age <span>{dog.ageMonths} mo</span></li>
        <li>Weight <span>{dog.weightKg} kg</span></li>
        <li>Size <span>{dog.size}</span></li>
        <li>Activity <span>{dog.activityLevel}</span></li>
      </ul>
    </div>
  );
}

export default Home;