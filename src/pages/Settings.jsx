import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDog } from '../hooks/useDog.js';
import { addDog, updateDog, deleteDog } from '../db/dogs.js';
import {
  scheduleSmartReminders,
  scheduleRemindersForAllDogs,
  scheduleCustomReminder,
  scheduleCustomRemindersForDog,
  getGlobalReminderSlots,
  getReminderSlotsForDog,
  saveGlobalReminderTimes,
  saveDogReminderTimes,
  clearDogReminderOverride,
  cancelRemindersForDog,
  customReminderNotificationId
} from '../utils/notifications.js';
import DogForm from '../components/DogForm.jsx';
import './Home.css';

import { LocalNotifications } from '@capacitor/local-notifications';

import {
  addReminder,
  updateReminder,
  deleteReminder,
  getRemindersForDog,
  removeExpiredOneTimeReminders
} from '../db/reminders.js';

import ReminderForm from '../components/ReminderForm.jsx';

import { useAuth } from '../contexts/AuthContext.jsx';
import { getHouseholdMembers } from '../db/households.js';
import { logOut } from '../auth/authService.js';

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

  const [customReminders, setCustomReminders] = useState([]);
  const [addingReminder, setAddingReminder] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null); 

  const { user, household } = useAuth();
  const [members, setMembers] = useState([]);
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    if (household) loadMembers();
  }, [household?.id]);

  async function loadMembers() {
    const list = await getHouseholdMembers(household.id);
    setMembers(list);
  }

  function handleCopyCode() {
    navigator.clipboard.writeText(household.inviteCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }

  async function handleSignOut() {
    if (!confirm('Sign out?')) return;
    await logOut();
  }

  useEffect(() => {
    if (dog) {
      loadCustomReminders();
    } else {
      setCustomReminders([]);
    }
  }, [dog?.id]);

  async function loadCustomReminders() {
    await removeExpiredOneTimeReminders(dog.id);

    const reminders = await getRemindersForDog(dog.id);
    setCustomReminders(reminders);
  }

  async function handleAddReminder(reminderData) {
    if (!dog) return;

    try {
      const reminderId = await addReminder({
        dogId: dog.id,
        ...reminderData,
        createdAt: Date.now()
      });

      const savedReminder = {
        id: reminderId,
        dogId: dog.id,
        ...reminderData
      };

      await scheduleCustomReminder(savedReminder, dog);

      await loadCustomReminders();
      setAddingReminder(false);
    } catch (error) {
      console.error('Failed to add reminder:', error);
      alert('Could not add reminder. Check the console for details.');
    }
  }

  async function handleUpdateReminder(reminderData) {
    if (!editingReminder) return;

    await updateReminder(
      editingReminder.id,
      reminderData
    );

    await scheduleCustomRemindersForDog(dog.id);

    await loadCustomReminders();

    setEditingReminder(null);
  }

  async function handleDeleteReminder(id) {
    if (!confirm('Delete this reminder?')) return;

    try {
      await LocalNotifications.cancel({
        notifications: [
          {
            id: customReminderNotificationId(id)
          }
        ]
      });

      await deleteReminder(id);
      await loadCustomReminders();
    } catch (error) {
      console.error('Failed to delete reminder:', error);
    }
  }

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

      {household && (
        <>
          <p className="settings-section-label" style={{ marginTop: 0 }}>
            Family
          </p>

          <div className="custom-reminder-card" style={{ marginBottom: 10 }}>
            <div>
              <strong>{household.name}</strong>
              <small>Invite code: {household.inviteCode}</small>
            </div>
            <button className="btn btn-secondary btn-small" onClick={handleCopyCode}>
              {codeCopied ? 'Copied!' : 'Copy code'}
            </button>
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

          <button className="btn btn-secondary" onClick={handleSignOut} style={{ marginTop: 4, marginBottom: 16 }}>
            Sign out
          </button>
        </>
      )}

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
      
      {remindersSaved && (
        <div className="save-confirmation">
          <span className="save-check">✓</span>
          <span>Reminder times updated</span>
        </div>
      )}

      <p className="care-note">
        {useCustomTimes
          ? `These times apply only to ${dog?.name}.`
          : "These are the app's default times — they apply to any dog without its own custom times."}
      </p>

      <p className="settings-section-label">
        Custom reminders {dog ? `for ${dog.name}` : ''}
      </p>

      {dog && (
        <>
          {customReminders.length === 0 && !addingReminder && (
            <p className="care-note">
              No custom reminders yet.
            </p>
          )}

          <div className="custom-reminder-list">
            {customReminders.map((reminder) => (
              <div
                className="custom-reminder-card"
                key={reminder.id}
              >
                <div>
                  <strong>{reminder.title}</strong>

                  <small>
                    {reminder.repeats
                      ? `Every ${reminder.intervalDays} days`
                      : `Once on ${reminder.date}`
                    }
                    {' · '}
                    {reminder.time}
                  </small>
                </div>

                <div className="custom-reminder-actions">
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={() => setEditingReminder(reminder)}
                  >
                    Edit
                  </button>

                  <button
                    className="dog-photo-remove"
                    onClick={() => handleDeleteReminder(reminder.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {addingReminder ? (
            <ReminderForm
              onSave={handleAddReminder}
              onCancel={() => setAddingReminder(false)}
            />
          ) : editingReminder ? (
            <ReminderForm
              initialReminder={editingReminder}
              onSave={handleUpdateReminder}
              onCancel={() => setEditingReminder(null)}
            />
          ) : (
            <button
              className="btn btn-primary custom-reminder-add-btn"
              onClick={() => setAddingReminder(true)}
            >
              + Add reminder
            </button>
          )}
        </>
      )}

      <Link to="/about" className="btn btn-secondary about-btn">
        About By Flora
      </Link>
    </div>
  );
}

export default Settings;