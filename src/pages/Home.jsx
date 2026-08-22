import { useEffect, useState } from 'react';
import { addDog, getAllDogs, updateDog } from '../db/dogs.js';
import DogForm from '../components/DogForm.jsx';
import PassportStamp from '../components/PassportStamp.jsx';
import { calculateDailyFood } from '../utils/food.js';
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

  const { dailyKcal, gramsPerDay } = calculateDailyFood(dog);

  return (
    <div className="care-card">
      <PassportStamp name={dog.name} />
      <h2>{dog.name}</h2>
      <ul className="stat-list">
        <li>Age <span>{dog.ageMonths} mo</span></li>
        <li>Weight <span>{dog.weightKg} kg</span></li>
        <li>Size <span>{dog.size}</span></li>
        <li>Activity <span>{dog.activityLevel}</span></li>
        <li>Daily food <span>{gramsPerDay}g / {dailyKcal} kcal</span></li>
      </ul>
      <button className="btn btn-primary" onClick={() => setEditing(true)}>Edit profile</button>
    </div>
  );
}

export default Home;