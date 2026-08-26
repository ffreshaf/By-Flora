import { useState } from 'react';

const SIZES = ['small', 'medium', 'large', 'giant'];

const ACTIVITY_LEVELS = ['low', 'moderate', 'active', 'very active'];

function resizeImage(file, maxSize = 700) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();

      img.onload = () => {
        const scale = Math.min(
          1,
          maxSize / Math.max(img.width, img.height)
        );

        const canvas = document.createElement('canvas');

        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);

        const ctx = canvas.getContext('2d');

        ctx.drawImage(
          img,
          0,
          0,
          canvas.width,
          canvas.height
        );

        // Compress the image so IndexedDB doesn't get filled
        // with huge original camera photos.
        resolve(
          canvas.toDataURL('image/jpeg', 0.82)
        );
      };

      img.onerror = reject;
      img.src = reader.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function DogForm({ initialDog, onSave }) {
  const [name, setName] = useState(initialDog?.name || '');

  const [breed, setBreed] = useState(
    initialDog?.breed || ''
  );

  const [photo, setPhoto] = useState(
    initialDog?.photo || ''
  );

  const [ageMonths, setAgeMonths] = useState(
    initialDog?.ageMonths || ''
  );

  const [weightKg, setWeightKg] = useState(
    initialDog?.weightKg || ''
  );

  const [size, setSize] = useState(
    initialDog?.size || 'medium'
  );

  const [activityLevel, setActivityLevel] = useState(
    initialDog?.activityLevel || 'moderate'
  );

  const [kcalPer100g, setKcalPer100g] = useState(
    initialDog?.kcalPer100g || 350
  );

  const [weightGoal, setWeightGoal] = useState(
    initialDog?.weightGoal || 'maintain'
  );

  const [targetWeightKg, setTargetWeightKg] = useState(
    initialDog?.targetWeightKg || ''
  );

  const [foodOverride, setFoodOverride] = useState(
    initialDog?.foodOverrideGrams ?? ''
  );

  const [exerciseOverride, setExerciseOverride] = useState(
    initialDog?.exerciseOverrideMinutes ?? ''
  );

  const [bathIntervalDays, setBathIntervalDays] = useState(
    initialDog?.bathIntervalDays ?? 28
  );

  const [error, setError] = useState('');

  const [photoError, setPhotoError] = useState('');

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    setPhotoError('');

    // Don't accept anything other than an image.
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please choose an image.');
      return;
    }

    // Keep very large files from being processed unnecessarily.
    if (file.size > 15 * 1024 * 1024) {
      setPhotoError('Please choose an image smaller than 15MB.');
      return;
    }

    try {
      const compressedPhoto = await resizeImage(file);
      setPhoto(compressedPhoto);
    } catch (error) {
      console.error('Could not process dog photo:', error);
      setPhotoError('Could not use that photo. Please try another one.');
    }
  }

  function removePhoto() {
    setPhoto('');
  }

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
      breed: breed.trim(),
      photo,

      ageMonths: Number(ageMonths),
      weightKg: Number(weightKg),
      size,
      activityLevel,

      kcalPer100g: Number(kcalPer100g),
      weightGoal,

      targetWeightKg: targetWeightKg
        ? Number(targetWeightKg)
        : null,

      foodOverrideGrams: foodOverride
        ? Number(foodOverride)
        : null,

      exerciseOverrideMinutes: exerciseOverride
        ? Number(exerciseOverride)
        : null,

      bathIntervalDays: Number(bathIntervalDays)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="dog-form">

      {/* PHOTO */}

      <div className="dog-photo-form">

        <div className="dog-photo-preview">
          {photo ? (
            <img
              src={photo}
              alt={`${name || 'Dog'} profile`}
            />
          ) : (
            <span>🐶</span>
          )}
        </div>

        <div className="dog-photo-actions">

          <label
            htmlFor="dog-photo"
            className="btn btn-secondary dog-photo-button"
          >
            {photo ? 'Change photo' : 'Add a photo'}
          </label>

          <input
            id="dog-photo"
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            hidden
          />

          {photo && (
            <button
              type="button"
              className="dog-photo-remove"
              onClick={removePhoto}
            >
              Remove photo
            </button>
          )}

          <small>
            Add a photo so you can recognise her profile quickly.
          </small>

          {photoError && (
            <small className="form-error">
              {photoError}
            </small>
          )}

        </div>

      </div>

      {/* NAME */}

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

      {/* BREED */}

      <div className="form-group">
        <label htmlFor="breed">Breed</label>

        <input
          id="breed"
          type="text"
          value={breed}
          onChange={(e) => setBreed(e.target.value)}
          placeholder="e.g. Labrador, Cockapoo, Mixed"
        />

        <small>
          Optional — you can leave this blank if you're not sure.
        </small>
      </div>

      {/* AGE */}

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

      {/* WEIGHT */}

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

      {/* WEIGHT GOAL */}

      <div className="form-group">
        <label htmlFor="weightGoal">Weight goal</label>

        <select
          id="weightGoal"
          value={weightGoal}
          onChange={(e) => setWeightGoal(e.target.value)}
        >
          <option value="maintain">
            Maintain current weight
          </option>

          <option value="lose">
            Help her lose weight
          </option>

          <option value="gain">
            Help her gain weight
          </option>
        </select>
      </div>

      {weightGoal !== 'maintain' && (
        <div className="form-group">

          <label htmlFor="targetWeight">
            Target weight (kg) — optional
          </label>

          <input
            id="targetWeight"
            type="number"
            min="0"
            step="0.1"
            value={targetWeightKg}
            onChange={(e) =>
              setTargetWeightKg(e.target.value)
            }
            placeholder="Ask your vet for a healthy target"
          />

          <small>
            Leave blank if unsure — your vet can give the best target.
          </small>

        </div>
      )}

      {/* SIZE */}

      <div className="form-group">

        <label htmlFor="size">Size</label>

        <select
          id="size"
          value={size}
          onChange={(e) => setSize(e.target.value)}
        >
          {SIZES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>

      </div>

      {/* ACTIVITY */}

      <div className="form-group">

        <label htmlFor="activity">
          Activity level
        </label>

        <select
          id="activity"
          value={activityLevel}
          onChange={(e) =>
            setActivityLevel(e.target.value)
          }
        >
          {ACTIVITY_LEVELS.map((a) => (
            <option key={a} value={a}>
              {a.charAt(0).toUpperCase() + a.slice(1)}
            </option>
          ))}
        </select>

      </div>

      {/* FOOD ENERGY */}

      <div className="form-group">

        <label htmlFor="kcal">
          Food energy (kcal per 100g)
        </label>

        <input
          id="kcal"
          type="number"
          min="0"
          value={kcalPer100g}
          onChange={(e) =>
            setKcalPer100g(e.target.value)
          }
          placeholder="e.g. 350"
        />

        <small>
          Check your dog food bag — usually listed as
          kcal/100g or kcal/cup.
        </small>

      </div>

      {/* FOOD OVERRIDE */}

      <div className="form-group">

        <label htmlFor="foodOverride">
          Override daily food (g) — optional
        </label>

        <input
          id="foodOverride"
          type="number"
          min="0"
          value={foodOverride}
          onChange={(e) =>
            setFoodOverride(e.target.value)
          }
          placeholder="Leave blank to use the calculated amount"
        />

        <small>
          Use this if your vet gave you a specific target.
        </small>

      </div>

      {/* EXERCISE OVERRIDE */}

      <div className="form-group">

        <label htmlFor="exerciseOverride">
          Override daily exercise (min) — optional
        </label>

        <input
          id="exerciseOverride"
          type="number"
          min="0"
          value={exerciseOverride}
          onChange={(e) =>
            setExerciseOverride(e.target.value)
          }
          placeholder="Leave blank to use the calculated amount"
        />

      </div>

      <div className="form-group">
        <label htmlFor="bathInterval">
          Bath every
        </label>

        <div className="input-with-suffix">
          <input
            id="bathInterval"
            type="number"
            min="1"
            max="365"
            value={bathIntervalDays}
            onChange={(e) => setBathIntervalDays(e.target.value)}
          />
          <span>days</span>
        </div>

        <small>
          Choose how often {name || 'your dog'} usually needs a bath.
        </small>
      </div>

      {error && (
        <p className="form-error">
          {error}
        </p>
      )}

      <button type="submit">
        Save profile
      </button>

    </form>
  );
}

export default DogForm;