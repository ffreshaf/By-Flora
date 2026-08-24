import { Link } from 'react-router-dom';
import { useState } from 'react';

import { useDog } from '../hooks/useDog.js';

import { addDog, updateDog } from '../db/dogs.js';

import DogForm from '../components/DogForm.jsx';

import { scheduleSmartReminders } from '../utils/notifications.js';

import './Home.css';

function Settings() {
  const { dog, loading, reload } = useDog();

  const [saved, setSaved] = useState(false);

  async function handleSave(dogData) {
    let savedDog;

    if (dog) {
      savedDog = await updateDog(dog.id, dogData);
    } else {
      savedDog = await addDog(dogData);
    }

    // Refresh the dog shown in the app.
    await reload();

    // Recalculate notifications using the updated profile.
    if (savedDog?.id) {
      try {
        await scheduleSmartReminders(savedDog.id);
      } catch (error) {
        console.error(
          'Could not schedule reminders:',
          error
        );
      }
    }

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2000);
  }

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="care-card">
      <h2>
        {dog
          ? `${dog.name}'s profile`
          : "Let's set up her profile"}
      </h2>

      <DogForm
        initialDog={dog}
        onSave={handleSave}
      />

      {saved && (
        <p className="care-note">
          Saved!
        </p>
      )}

      <p className="settings-footer">
        <Link to="/about">
          About this app
        </Link>
      </p>
    </div>
  );
}

export default Settings;