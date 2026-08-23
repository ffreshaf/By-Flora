import { Link } from 'react-router-dom';
import { useDog } from '../hooks/useDog.js';
import PassportStamp from '../components/PassportStamp.jsx';
import { calculateDailyFood } from '../utils/food.js';
import { calculateExerciseMinutes } from '../utils/exercise.js';
import { PLAY_TARGET } from '../utils/reminders.js';
import './Home.css';

function Home() {
  const { dog, loading } = useDog();

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

  const { gramsPerDay, mealsPerDay, gramsPerMeal } = calculateDailyFood(dog);
  const { minutesPerDay, sessions, minutesPerSession, note } = calculateExerciseMinutes(dog);

  return (
    <div className="care-card">
      <PassportStamp name={dog.name} />
      <h2>{dog.name}</h2>

      <div className="highlight-grid">
        <div className="highlight-card">
          <span className="highlight-label">Food</span>
          <span className="highlight-value">{mealsPerDay}× {gramsPerMeal}g</span>
          <span className="highlight-detail">{gramsPerDay}g/day</span>
        </div>
        <div className="highlight-card">
          <span className="highlight-label">Exercise</span>
          <span className="highlight-value">
            {sessions ? `${sessions}× ${minutesPerSession}m` : `${minutesPerDay}m`}
          </span>
          <span className="highlight-detail">
            {sessions ? `${minutesPerDay} min/day` : 'walk or split up'}
          </span>
        </div>
        <div className="highlight-card">
          <span className="highlight-label">Play</span>
          <span className="highlight-value">{PLAY_TARGET}m</span>
          <span className="highlight-detail">enrichment/day</span>
        </div>
      </div>

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