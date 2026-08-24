import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDog } from '../hooks/useDog.js';
import { addDog, updateDog, deleteDog } from '../db/dogs.js';
import { scheduleSmartReminders, getReminderDefs, saveReminderTimes } from '../utils/notifications.js';
import DogForm from '../components/DogForm.jsx';
import './Home.css';

function toTimeInputValue(hour, minute) {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function fromTimeInputValue(value) {
  const [hour, minute] = value.split(':').map(Number);
  return { hour, minute };
}

function Settings() {
  const { dog, allDogs, loading, reload, switchDog } = useDog();
  const [saved, setSaved] = useState(false);
  const [addingNew, setAddingNew] = useState(false);

  const [reminderTimes, setReminderTimes] = useState([]);
  const [remindersSaved, setRemindersSaved] = useState(false);

  useEffect(() => {
    loadReminderTimes();
  }, []);

  async function loadReminderTimes() {
    const defs = await getReminderDefs();
    setReminderTimes(defs);
  }

  function handleTimeChange(id, value) {
    const { hour, minute } = fromTimeInputValue(value);
    setReminderTimes((prev) =>
      prev.map((r) => (r.id === id ? { ...r, hour, minute } : r))
    );
  }

  async function handleSaveReminderTimes() {
    await saveReminderTimes(reminderTimes.map(({ id, hour, minute }) => ({ id, hour, minute })));
    if (dog) await scheduleSmartReminders(dog.id);
    setRemindersSaved(true);
    setTimeout(() => setRemindersSaved(false), 2000);
  }

  async function handleSave(dogData) {
    let id;
    if (dog && !addingNew) {
      id = await updateDog(dog.id, dogData);
    } else {
      id = await addDog(dogData);
    }
    await switchDog(id);
    setAddingNew(false);

    try {
      await scheduleSmartReminders(id);
    } catch (error) {
      console.error('Could not schedule reminders:', error);
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleDelete() {
    if (!dog) return;
    if (!confirm(`Remove ${dog.name}'s profile? This can't be undone.`)) return;
    await deleteDog(dog.id);
    await reload();
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div className="care-card">
      <h2>Settings</h2>

      <p className="settings-section-label">Dogs</p>
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

      <DogForm key={addingNew ? 'new' : dog?.id} initialDog={addingNew ? null : dog} onSave={handleSave} />

      {saved && <p className="care-note">Saved!</p>}

      {dog && !addingNew && (
        <button className="btn btn-secondary" onClick={handleDelete} style={{ marginTop: '10px', marginBottom: '4px' }}>
          Remove this profile
        </button>
      )}

      <p className="settings-section-label">Reminder times</p>
      <div className="reminder-time-list">
        {reminderTimes.map((r) => (
          <div className="reminder-time-row" key={r.id}>
            <label htmlFor={`reminder-${r.id}`}>{r.title.replace(/[^\w\s]/g, '').trim()}</label>
            <input
              id={`reminder-${r.id}`}
              type="time"
              value={toTimeInputValue(r.hour, r.minute)}
              onChange={(e) => handleTimeChange(r.id, e.target.value)}
            />
          </div>
        ))}
      </div>
      <button className="btn btn-primary log-btn" onClick={handleSaveReminderTimes}>Save reminder times</button>
      {remindersSaved && <p className="care-note">Reminder times updated!</p>}

      <p className="settings-footer">
        <Link to="/profile">← Back to Profile</Link> · <Link to="/about">About this app</Link>
      </p>
    </div>
  );
}

export default Settings;