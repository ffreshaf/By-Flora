import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDog } from '../contexts/DogContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { addDog, updateDog, deleteDog } from '../db/dogs.js';
import { scheduleSmartReminders, cancelRemindersForDog } from '../utils/notifications.js';
import DogForm from '../components/DogForm.jsx';
import './Home.css';
import { auth } from '../firebase.js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

function SettingsDogs() {
  const { dog, allDogs, loading, reload, switchDog } = useDog();
  const { household } = useAuth();
  const [saved, setSaved] = useState(false);
  const [addingNew, setAddingNew] = useState(false);

  async function handleSave(dogData) {
    if (!household?.id) {
      console.error('No household ID available.');
      return;
    }

    try {
      let id;

      if (dog && !addingNew) {
        await updateDog(household.id, dog.id, dogData);
        id = dog.id;
      } else {
        id = await addDog(household.id, dogData);
      }

      await switchDog(id);
      setAddingNew(false);

      try {
        await scheduleSmartReminders(household.id, id);
      } catch (error) {
        console.error('Could not schedule reminders:', error);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('Could not save the profile. Check the console for details.');
    }
  }

  
  async function deleteDogPhoto(householdId, photoPath) {
    if (!photoPath) return;

    try {
      const idToken = await auth.currentUser.getIdToken();

      await fetch(`${SUPABASE_URL}/functions/v1/upload-dog-photo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ householdId, oldPath: photoPath, deleteOnly: true }),
      });
    } catch (err) {
      console.warn('Could not delete photo from storage:', err);
    }
  }

  async function handleDelete() {
    if (!dog) return;
    if (!confirm(`Remove ${dog.name}'s profile? This can't be undone.`)) return;

    await cancelRemindersForDog(household.id, dog.id);
    await deleteDogPhoto(household.id, dog.photoPath);
    await deleteDog(household.id, dog.id);
    await reload();
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div className="care-card">
      <Link to="/settings" className="settings-back-link">‹ Settings</Link>
      <h2>Dog profiles</h2>

      {allDogs.length > 0 && (
        <div className="dog-switcher">
          {allDogs.map((d) => (
            <button
              key={d.id}
              className={`dog-pill ${dog?.id === d.id && !addingNew ? 'active' : ''}`}
              onClick={() => { setAddingNew(false); switchDog(d.id); }}
            >
              {d.name}
            </button>
          ))}
          <button className="dog-pill dog-pill-add" onClick={() => setAddingNew(true)}>+ Add dog</button>
        </div>
      )}

      <DogForm key={addingNew ? 'new' : dog?.id} initialDog={addingNew ? null : dog} householdId={household?.id} onSave={handleSave} />

      {saved && (
        <div className="save-confirmation">
          <span className="save-check">✓</span>
          <span>Profile saved</span>
        </div>
      )}

      {dog && !addingNew && (
        <button className="btn btn-secondary" onClick={handleDelete} style={{ marginTop: '10px', marginBottom: '4px' }}>
          Remove this profile
        </button>
      )}
    </div>
  );
}

export default SettingsDogs;