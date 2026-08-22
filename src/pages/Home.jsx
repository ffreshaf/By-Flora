import { useEffect, useState } from 'react';
import { addDog, getAllDogs, updateDog } from '../db/dogs.js';
import DogForm from '../components/DogForm.jsx';
import PassportStamp from '../components/PassportStamp.jsx';
import { calculateDailyFood } from '../utils/food.js';
import { calculateExerciseMinutes } from '../utils/exercise.js';
import './Home.css';

function Home() {
  const [dog, setDog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    loadDog();
  }, []);

  async function loadDog() {
    const dogs = await getAllDogs();
    setDog(dogs[0] || null);
    setLoading(false);
  }

  async function handleSave(dogData) {
    if (dog) {
      await updateDog(dog.id, dogData);
    } else {
      await addDog(dogData);
    }
    setEditing(false);
    await loadDog();
  }

  if (loading) return <p>Loading...</p>;

  if (!dog || editing) {
    return (
      <div className="care-card">
        <h2>{dog ? 'Edit profile' : "Let's set up your dog's profile"}</h2>
        <DogForm initialDog={dog} onSave={handleSave} />
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
          <span className="highlight-detail">{gramsPerDay}g total per day</span>
        </div>
        <div className="highlight-card">
          <span className="highlight-label">Exercise</span>
          <span className="highlight-value">
            {sessions ? `${sessions}× ${minutesPerSession}min` : `${minutesPerDay} min`}
          </span>
          <span className="highlight-detail">
            {sessions ? `${minutesPerDay} min total per day` : 'in one walk or split up'}
          </span>
        </div>
      </div>

      {note && <p className="care-note">{note}</p>}

      <ul className="stat-list">
        <li>Age <span>{dog.ageMonths} mo</span></li>
        <li>Weight <span>{dog.weightKg} kg</span></li>
        <li>Size <span>{dog.size}</span></li>
        <li>Activity <span>{dog.activityLevel}</span></li>
      </ul>

      <button className="btn btn-primary" onClick={() => setEditing(true)}>Edit profile</button>
    </div>
  );
}

export default Home;