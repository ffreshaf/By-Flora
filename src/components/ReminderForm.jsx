import { useState } from 'react';

function ReminderForm({ initialReminder, onSave, onCancel }) {
  const [title, setTitle] = useState(
    initialReminder?.title || ''
  );

  const [repeats, setRepeats] = useState(
    initialReminder?.repeats ?? true
  );

  const [intervalDays, setIntervalDays] = useState(
    initialReminder?.intervalDays || 30
  );

  const [date, setDate] = useState(
    initialReminder?.date || ''
  );

  const [time, setTime] = useState(
    initialReminder?.time || '09:00'
  );

  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();

    if (!title.trim()) {
      setError('Please enter a reminder name.');
      return;
    }

    if (!time) {
      setError('Please choose a reminder time.');
      return;
    }

    if (repeats) {
      if (!intervalDays || Number(intervalDays) <= 0) {
        setError('Please enter a valid interval.');
        return;
      }
    } else {
      if (!date) {
        setError('Please choose a date.');
        return;
      }
    }

    setError('');

    onSave({
      title: title.trim(),
      repeats,
      intervalDays: repeats ? Number(intervalDays) : null,
      date: repeats ? null : date,
      time,
      enabled: initialReminder?.enabled ?? true
    });
  }

  return (
    <form onSubmit={handleSubmit} className="dog-form">

      <div className="form-group">
        <label htmlFor="reminderTitle">
          Reminder name
        </label>

        <input
          id="reminderTitle"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Flea treatment"
        />
      </div>

      <div className="form-group">
        <label>
          Repeat
        </label>

        <label className="custom-times-toggle">
          <input
            type="checkbox"
            checked={repeats}
            onChange={(e) => setRepeats(e.target.checked)}
          />

          Repeat this reminder
        </label>
      </div>

      {repeats ? (
        <div className="form-group">
          <label htmlFor="reminderInterval">
            Repeat every (days)
          </label>

          <input
            id="reminderInterval"
            type="number"
            min="1"
            value={intervalDays}
            onChange={(e) => setIntervalDays(e.target.value)}
            placeholder="e.g. 30"
          />
        </div>
      ) : (
        <div className="form-group">
          <label htmlFor="reminderDate">
            Reminder date
          </label>

          <input
            id="reminderDate"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      )}

      <div className="form-group">
        <label htmlFor="reminderTime">
          Reminder time
        </label>

        <input
          id="reminderTime"
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />
      </div>

      {error && (
        <p className="form-error">
          {error}
        </p>
      )}

      <button type="submit">
        {initialReminder ? 'Save reminder' : 'Add reminder'}
      </button>

      {onCancel && (
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
        >
          Cancel
        </button>
      )}

    </form>
  );
}

export default ReminderForm;