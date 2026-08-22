import { useEffect, useState } from 'react';
import { addDog, getAllDogs, updateDog } from '../db/dogs.js';
import  DogForm  from '../components/DogForm.jsx';

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

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!dog || editing) {
    return (
        <div>
            <h2>{dog ? 'Edit profile' : "Let's set up your dog profile"}</h2>
            <DogForm initialDog={dog} onSave={handleSave} />
        </div>
    );
  }

  return (
    <div>
      <h2>{dog.name}</h2>
      <ul>
        <li>Age: {dog.ageMonths} months</li>
        <li>Weight: {dog.weightKg} kg</li>
        <li>Size: {dog.size}</li>
        <li>Activity level: {dog.activityLevel}</li>
      </ul>
      <button onClick={() => setEditing(true)}>Edit profile</button>
    </div>
  );
}

export default Home;