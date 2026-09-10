import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDog } from '../contexts/DogContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { LocalNotifications } from '@capacitor/local-notifications';
import {
  scheduleCustomReminder,
  scheduleCustomRemindersForDog,
  customReminderNotificationId
} from '../utils/notifications.js';
import {
  addReminder,
  updateReminder,
  deleteReminder,
  getRemindersForDog,
  removeExpiredOneTimeReminders
} from '../db/reminders.js';
import ReminderForm from '../components/ReminderForm.jsx';
import './Home.css';

function SettingsCustomReminders() {
  const { dog, loading } = useDog();
  const { household } = useAuth();

  const [customReminders, setCustomReminders] = useState([]);
  const [addingReminder, setAddingReminder] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);

  useEffect(() => {
    if (dog) {
      loadCustomReminders();
    } else {
      setCustomReminders([]);
    }
  }, [dog?.id]);

  async function loadCustomReminders() {
    await removeExpiredOneTimeReminders(household.id, dog.id);
    const reminders = await getRemindersForDog(household.id, dog.id);
    setCustomReminders(reminders);
  }

  async function handleAddReminder(reminderData) {
    if (!dog) return;

    try {
      const reminderId = await addReminder(household.id, dog.id, {
        ...reminderData,
        createdAt: Date.now()
      });

      const savedReminder = { id: reminderId, ...reminderData };

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

    await updateReminder(household.id, dog.id, editingReminder.id, reminderData);
    await scheduleCustomRemindersForDog(household.id, dog.id);
    await loadCustomReminders();
    setEditingReminder(null);
  }

  async function handleDeleteReminder(id) {
    if (!confirm('Delete this reminder?')) return;

    try {
      await LocalNotifications.cancel({
        notifications: [{ id: customReminderNotificationId(id) }]
      });

      await deleteReminder(household.id, dog.id, id);
      await loadCustomReminders();
    } catch (error) {
      console.error('Failed to delete reminder:', error);
    }
  }

  if (loading) return <p>Loading...</p>;

  if (!dog) {
    return (
      <div className="care-card">
        <Link to="/settings" className="settings-back-link">‹ Settings</Link>
        <h2>Custom reminders</h2>
        <p className="care-note">Add a dog profile first.</p>
      </div>
    );
  }

  return (
    <div className="care-card">
      <Link to="/settings" className="settings-back-link">‹ Settings</Link>
      <h2>Custom reminders for {dog.name}</h2>

      {customReminders.length === 0 && !addingReminder && (
        <p className="care-note">No custom reminders yet.</p>
      )}

      <div className="custom-reminder-list">
        {customReminders.map((reminder) => (
          <div className="custom-reminder-card" key={reminder.id}>
            <div>
              <strong>{reminder.title}</strong>
              <small>
                {reminder.repeats
                  ? `Every ${reminder.intervalDays} days`
                  : `Once on ${reminder.date}`}
                {' · '}
                {reminder.time}
              </small>
            </div>

            <div className="custom-reminder-actions">
              <button className="btn btn-secondary btn-small" onClick={() => setEditingReminder(reminder)}>
                Edit
              </button>
              <button className="dog-photo-remove" onClick={() => handleDeleteReminder(reminder.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {addingReminder ? (
        <ReminderForm onSave={handleAddReminder} onCancel={() => setAddingReminder(false)} />
      ) : editingReminder ? (
        <ReminderForm
          initialReminder={editingReminder}
          onSave={handleUpdateReminder}
          onCancel={() => setEditingReminder(null)}
        />
      ) : (
        <button className="btn btn-primary custom-reminder-add-btn" onClick={() => setAddingReminder(true)}>
          + Add reminder
        </button>
      )}
    </div>
  );
}

export default SettingsCustomReminders;