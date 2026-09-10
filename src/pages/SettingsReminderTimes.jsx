import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDog } from '../contexts/DogContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import {
  scheduleSmartReminders,
  scheduleRemindersForAllDogs,
  getGlobalReminderSlots,
  getReminderSlotsForDog,
  saveGlobalReminderTimes,
  saveDogReminderTimes,
  clearDogReminderOverride
} from '../utils/notifications.js';
import './Home.css';

function SettingsReminderTimes() {
  const { dog, loading } = useDog();
  const { household } = useAuth();

  const [reminderTimes, setReminderTimes] = useState([]);
  const [useCustomTimes, setUseCustomTimes] = useState(false);
  const [remindersSaved, setRemindersSaved] = useState(false);

  useEffect(() => {
    if (dog && household?.id) loadReminderTimesForDog();
  }, [dog?.id, household?.id]);

  async function loadReminderTimesForDog() {
    if (!dog?.id || !household?.id) return;

    try {
      const slots = await getReminderSlotsForDog(household.id, dog.id);
      setReminderTimes(slots);
      setUseCustomTimes(!!dog.reminderTimes);
    } catch (error) {
      console.error('Failed to load reminder times:', error);
      setReminderTimes([]);
    }
  }

  function handleTimeChange(id, value) {
    const [hour, minute] = value.split(':').map(Number);
    setReminderTimes((prev) => prev.map((r) => (r.id === id ? { ...r, hour, minute } : r)));
  }

  async function handleToggleCustom(checked) {
    setUseCustomTimes(checked);
    if (!checked && dog) {
      await clearDogReminderOverride(household.id, dog.id);
      setReminderTimes(await getGlobalReminderSlots(household.id));
      await scheduleSmartReminders(household.id, dog.id);
    }
  }

  async function handleSaveReminderTimes() {
    if (!household?.id) return;

    const times = reminderTimes.map(({ id, hour, minute }) => ({ id, hour, minute }));

    if (useCustomTimes && dog) {
      await saveDogReminderTimes(household.id, dog.id, times);
      await scheduleSmartReminders(household.id, dog.id);
    } else {
      await saveGlobalReminderTimes(household.id, times);
      await scheduleRemindersForAllDogs(household.id);
    }

    setRemindersSaved(true);
    setTimeout(() => setRemindersSaved(false), 2000);
  }

  if (loading) return <p>Loading...</p>;

  if (!dog) {
    return (
      <div className="care-card">
        <Link to="/settings" className="settings-back-link">‹ Settings</Link>
        <h2>Reminder times</h2>
        <p className="care-note">Add a dog profile first.</p>
      </div>
    );
  }

  return (
    <div className="care-card">
      <Link to="/settings" className="settings-back-link">‹ Settings</Link>
      <h2>Reminder times for {dog.name}</h2>

      <label className="custom-times-toggle">
        <input
          type="checkbox"
          checked={useCustomTimes}
          onChange={(e) => handleToggleCustom(e.target.checked)}
        />
        Use custom times just for {dog.name}
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

      {remindersSaved && (
        <div className="save-confirmation">
          <span className="save-check">✓</span>
          <span>Reminder times updated</span>
        </div>
      )}

      <p className="care-note">
        {useCustomTimes
          ? `These times apply only to ${dog.name}.`
          : "These are the app's default times — they apply to any dog without its own custom times."}
      </p>
    </div>
  );
}

export default SettingsReminderTimes;