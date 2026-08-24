import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDog } from '../hooks/useDog.js';
import { addDog, updateDog, deleteDog } from '../db/dogs.js';
import {
  scheduleSmartReminders,
  scheduleRemindersForAllDogs,
  getGlobalReminderSlots,
  getReminderSlotsForDog,
  saveGlobalReminderTimes,
  saveDogReminderTimes,
  clearDogReminderOverride,
  cancelRemindersForDog
} from '../utils/notifications.js';
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
  const [useCustomTimes, setUseCustomTimes] = useState(false);
  const [remindersSaved, setRemindersSaved] = useState(false);

  useEffect(() => {
    if (dog) loadReminderTimesForDog();
  }, [dog?.id]);

  async function loadReminderTimesForDog() {
    if (dog.reminderTimes) {
      setReminderTimes(await getReminderSlotsForDog(dog.id));
      setUseCustomTimes(true);
    } else {
      setReminderTimes(await getGlobalReminderSlots());
      setUseCustomTimes(false);
    }
  }

  function handleTimeChange(id, value) {
    const [hour, minute] = value.split(':').map(Number);
    setReminderTimes((prev) => prev.map((r) => (r.id === id ? { ...r, hour, minute } : r)));
  }

  async function handleToggleCustom(checked) {
    setUseCustomTimes(checked);
    if (!checked && dog) {
      await clearDogReminderOverride(dog.id);
      setReminderTimes(await getGlobalReminderSlots());
      await scheduleSmartReminders(dog.id);
    }
  }

  async function handleSaveReminderTimes() {
    const times = reminderTimes.map(({ id, hour, minute }) => ({ id, hour, minute }));

    if (useCustomTimes && dog) {
      await saveDogReminderTimes(dog.id, times);
      await scheduleSmartReminders(dog.id); // only this dog is affected
    } else {
      await saveGlobalReminderTimes(times);
      await scheduleRemindersForAllDogs(); // dogs WITHOUT their own override pick this up; dogs with one keep theirs
    }

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

    await cancelRemindersForDog(dog.id); // cancel BEFORE deleting, while we still know dog.id
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

      <p className="settings-section-label">
        Reminder times {dog ? `for ${dog.name}` : ''}
      </p>

      <label className="custom-times-toggle">
        <input
          type="checkbox"
          checked={useCustomTimes}
          onChange={(e) => handleToggleCustom(e.target.checked)}
        />
        Use custom times just for {dog?.name || 'this dog'}
      </label>

      <div className="reminder-time-list">
        {reminderTimes.map((r) => (
          <div className="reminder-time-row" key={r.id}>
            <label htmlFor={`reminder-${r.id}`}>{r.title.replace(/[^\w\s]/g, '').trim()}</label>
            <input
              id={`reminder-${r.id}`}
              type="time"
              value={`${String(r.hour).padStart(2, '0')}:${String(r.minute).padStart(2, '0')}`}
              onChange={(e) => handleTimeChange(r.id, e.target.value)}
            />
          </div>
        ))}
      </div>
      <button className="btn btn-primary log-btn" onClick={handleSaveReminderTimes}>Save reminder times</button>
      {remindersSaved && <p className="care-note">Reminder times updated!</p>}

      <p className="care-note">
        {useCustomTimes
          ? `These times apply only to ${dog?.name}.`
          : "These are the app's default times — they apply to any dog without its own custom times."}
      </p>
    </div>
  );
}

export default Settings;