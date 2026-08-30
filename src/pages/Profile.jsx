import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useDog } from '../hooks/useDog.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getHouseholdMembers } from '../db/households.js';
import CareRing from '../components/CareRing.jsx';
import { calculateDailyFood } from '../utils/food.js';
import { calculateExerciseMinutes } from '../utils/exercise.js';
import './Home.css';

function Profile() {
  const { dog, allDogs, loading, switchDog } = useDog();
  const { user, household } = useAuth();
  const [members, setMembers] = useState([]);

  useEffect(() => {
    if (household) loadMembers();
  }, [household?.id]);

  async function loadMembers() {
    const list = await getHouseholdMembers(household.id);
    setMembers(list);
  }

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
    <div className="home-page">

      {/* HERO — identity */}
      <section className="home-hero">
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

        <CareRing name={dog.name} photo={dog.photo} />

        <div className="profile-identity">
          <div>
            <h2>{dog.name}</h2>
            {dog.breed && <p className="profile-breed">{dog.breed}</p>}
          </div>
        </div>
      </section>

      {/* DETAILS */}
      <section className="home-section">
        <div className="home-section-heading">
          <h2>Details</h2>
        </div>

        <ul className="stat-list home-stats">
          {dog.breed && <li>Breed <span>{dog.breed}</span></li>}
          <li>Age <span>{dog.ageMonths} mo</span></li>
          <li>Weight <span>{dog.weightKg} kg</span></li>
          <li>Size <span>{dog.size}</span></li>
          <li>Activity <span>{dog.activityLevel}</span></li>
          <li>Weight goal <span>{dog.weightGoal || 'maintain'}</span></li>
          <li>Daily food <span>{finalGramsPerDay}g{dog.foodOverrideGrams ? ' · custom' : ''}</span></li>
          <li>Daily exercise <span>{finalMinutesPerDay}m{dog.exerciseOverrideMinutes ? ' · custom' : ''}</span></li>
        </ul>
      </section>

      {/* FAMILY */}
      {household && (
        <section className="home-section">
          <div className="home-section-heading">
            <h2>Family</h2>
          </div>

          <div className="custom-reminder-list">
            {members.map((m) => (
              <div className="custom-reminder-card" key={m.uid}>
                <div>
                  <strong>{m.name}{m.uid === user.uid ? ' (you)' : ''}</strong>
                  <small>{m.email}</small>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <Link to="/settings" className="btn btn-primary log-btn">⚙️ Settings</Link>

    </div>
  );
}

export default Profile;