import { useState } from 'react';

const SIZES = ['small', 'medium', 'large', 'giant'];
const ACTIVITY_LEVELS = ['low', 'moderate', 'active', 'very active'];

function DogForm({ initialDog, onSave }) {
  const [name, setName] = useState(initialDog?.name || '');
  const [ageMonths, setAgeMonths] = useState(initialDog?.ageMonths || '');
  const [weightKg, setWeightKg] = useState(initialDog?.weightKg || '');
  const [size, setSize] = useState(initialDog?.size || 'medium');
  const [activityLevel, setActivityLevel] = useState(initialDog?.activityLevel || 'moderate');
  const [kcalPer100g, setKcalPer100g] = useState(initialDog?.kcalPer100g || 350);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Please enter a name.');
      return;
    }
    if (!ageMonths || Number(ageMonths) <= 0) {
      setError('Please enter a valid age in months.');
      return;
    }
    if (!weightKg || Number(weightKg) <= 0) {
      setError('Please enter a valid weight.');
      return;
    }

    setError('');
    onSave({
      name: name.trim(),
      ageMonths: Number(ageMonths),
      weightKg: Number(weightKg),
      size,
      activityLevel,
      kcalPer100g: Number(kcalPer100g)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="dog-form">
      <div className="form-group">
        <label htmlFor="name">Name</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Luna"
        />
      </div>

      <div className="form-group">
        <label htmlFor="age">Age (months)</label>
        <input
          id="age"
          type="number"
          min="0"
          value={ageMonths}
          onChange={(e) => setAgeMonths(e.target.value)}
          placeholder="e.g. 24"
        />
      </div>

      <div className="form-group">
        <label htmlFor="weight">Weight (kg)</label>
        <input
          id="weight"
          type="number"
          min="0"
          step="0.1"
          value={weightKg}
          onChange={(e) => setWeightKg(e.target.value)}
          placeholder="e.g. 12.5"
        />
      </div>

      <div className="form-group">
        <label htmlFor="size">Size</label>
        <select id="size" value={size} onChange={(e) => setSize(e.target.value)}>
          {SIZES.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="activity">Activity level</label>
        <select id="activity" value={activityLevel} onChange={(e) => setActivityLevel(e.target.value)}>
          {ACTIVITY_LEVELS.map((a) => (
            <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="kcal">Food energy (kcal per 100g)</label>
        <input
            id="kcal"
            type="number"
            min="0"
            value={kcalPer100g}
            onChange={(e) => setKcalPer100g(e.target.value)}
            placeholder="e.g. 350"
        />
        <small>Check your dog food bag — usually listed as kcal/100g or kcal/cup.</small>
      </div>

      {error && <p className="form-error">{error}</p>}

      <button type="submit">Save profile</button>
    </form>
  );
}

export default DogForm;