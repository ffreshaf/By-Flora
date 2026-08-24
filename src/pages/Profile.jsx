import { Link } from 'react-router-dom';
import { useDog } from '../hooks/useDog.js';
import CareRing from '../components/CareRing.jsx';
import { calculateDailyFood } from '../utils/food.js';
import { calculateExerciseMinutes } from '../utils/exercise.js';
import './Home.css';

function Profile() {
  const { dog, allDogs, loading, switchDog } = useDog();

  if (loading) return <p>Loading...</p>;

  if (!dog) {
    return (
      <div className="care-card">
        <h2>No dogs yet</h2>
        <p className="care-note">Add a profile to get started.</p>
        <Link to="/settings" className="btn btn-primary log-btn">Go to Settings</Link>
      </div>
    );
  }

  const { gramsPerDay } = calculateDailyFood(dog);
  const { minutesPerDay } = calculateExerciseMinutes(dog);
  const finalGramsPerDay = dog.foodOverrideGrams ?? gramsPerDay;
  const finalMinutesPerDay = dog.exerciseOverrideMinutes ?? minutesPerDay;

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

      <CareRing name={dog.name} />
      <h2>{dog.name}</h2>

      <ul className="stat-list">
        <li>Age <span>{dog.ageMonths} mo</span></li>
        <li>Weight <span>{dog.weightKg} kg</span></li>
        <li>Size <span>{dog.size}</span></li>
        <li>Activity <span>{dog.activityLevel}</span></li>
        <li>Weight goal <span>{dog.weightGoal || 'maintain'}</span></li>
        <li>Daily food <span>{finalGramsPerDay}g{dog.foodOverrideGrams ? ' · custom' : ''}</span></li>
        <li>Daily exercise <span>{finalMinutesPerDay}m{dog.exerciseOverrideMinutes ? ' · custom' : ''}</span></li>
      </ul>

      <Link to="/settings" className="btn btn-primary log-btn">⚙️ Edit in Settings</Link>
    </div>
  );
}

export default Profile;