import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDog } from '../contexts/DogContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { updateDog } from '../db/dogs.js';
import { PLAY_TARGET } from '../utils/reminders.js';
import { scheduleHygieneReminders } from '../utils/notifications.js';
import './Home.css';

function SettingsCareTargets() {
  const { dog, loading, reload } = useDog();
  const { household } = useAuth();

  const [foodOverride, setFoodOverride] = useState('');
  const [exerciseOverride, setExerciseOverride] = useState('');
  const [playTarget, setPlayTarget] = useState('');
  const [bathIntervalDays, setBathIntervalDays] = useState(28);
  const [groomIntervalDays, setGroomIntervalDays] = useState(42);
  const [nailIntervalDays, setNailIntervalDays] = useState(21);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (dog) {
      setFoodOverride(dog.foodOverrideGrams ?? '');
      setExerciseOverride(dog.exerciseOverrideMinutes ?? '');
      setPlayTarget(dog.playTargetMinutes ?? '');
      setBathIntervalDays(dog.bathIntervalDays || 28);
      setGroomIntervalDays(dog.groomIntervalDays || 42);
      setNailIntervalDays(dog.nailIntervalDays || 21);
    }
  }, [dog?.id]);

  async function handleSave() {
    if (!household?.id || !dog) return;

    await updateDog(household.id, dog.id, {
      foodOverrideGrams: foodOverride ? Number(foodOverride) : null,
      exerciseOverrideMinutes: exerciseOverride ? Number(exerciseOverride) : null,
      playTargetMinutes: playTarget ? Number(playTarget) : null,
      bathIntervalDays: Number(bathIntervalDays),
      groomIntervalDays: Number(groomIntervalDays),
      nailIntervalDays: Number(nailIntervalDays),
    });

    await reload();

    await scheduleHygieneReminders(household.id, dog.id);

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) return <p>Loading...</p>;

  if (!dog) {
    return (
      <div className="care-card">
        <Link to="/settings" className="settings-back-link">‹ Settings</Link>
        <h2>Care targets</h2>
        <p className="care-note">Add a dog profile first.</p>
      </div>
    );
  }

  return (
    <div className="care-card">
      <Link to="/settings" className="settings-back-link">‹ Settings</Link>
      <h2>Care targets for {dog.name}</h2>
      <p className="care-note" style={{ marginTop: -8 }}>
        Leave a field blank to use the app's calculated default.
      </p>

      <div className="form-group">
        <label htmlFor="foodOverride">Daily food override (g)</label>
        <input
          id="foodOverride"
          type="number"
          min="0"
          value={foodOverride}
          onChange={(e) => setFoodOverride(e.target.value)}
          placeholder="Leave blank to use the calculated amount"
        />
        <small>Use this if your vet gave you a specific target.</small>
      </div>

      <div className="form-group">
        <label htmlFor="exerciseOverride">Daily exercise override (min)</label>
        <input
          id="exerciseOverride"
          type="number"
          min="0"
          value={exerciseOverride}
          onChange={(e) => setExerciseOverride(e.target.value)}
          placeholder="Leave blank to use the calculated amount"
        />
      </div>

      <div className="form-group">
        <label htmlFor="playTarget">Daily play target (min)</label>
        <input
          id="playTarget"
          type="number"
          min="0"
          value={playTarget}
          onChange={(e) => setPlayTarget(e.target.value)}
          placeholder={`Leave blank to use the default (${PLAY_TARGET} min)`}
        />
      </div>

      <div className="form-group">
        <label htmlFor="bathInterval">Bath frequency (days)</label>
        <input
          id="bathInterval"
          type="number"
          min="1"
          max="365"
          value={bathIntervalDays}
          onChange={(e) => setBathIntervalDays(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label htmlFor="groomInterval">Grooming/trim frequency (days)</label>
        <input
          id="groomInterval"
          type="number"
          min="1"
          max="365"
          value={groomIntervalDays}
          onChange={(e) => setGroomIntervalDays(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label htmlFor="nailInterval">Nail trimming frequency (days)</label>
        <input
          id="nailInterval"
          type="number"
          min="1"
          max="365"
          value={nailIntervalDays}
          onChange={(e) => setNailIntervalDays(e.target.value)}
        />
      </div>

      <button className="btn btn-primary log-btn" onClick={handleSave} style={{ marginTop: '12px' }}>Save care targets</button>

      {saved && (
        <div className="save-confirmation">
          <span className="save-check">✓</span>
          <span>Care targets updated</span>
        </div>
      )}
    </div>
  );
}

export default SettingsCareTargets;