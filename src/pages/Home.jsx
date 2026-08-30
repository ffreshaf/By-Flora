import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useDog } from '../hooks/useDog.js';
import { getEventsForDog } from '../db/careEvents.js';
import { startOfToday, PLAY_TARGET } from '../utils/reminders.js';

import CareRing from '../components/CareRing.jsx';

import { calculateDailyFood } from '../utils/food.js';
import { calculateExerciseMinutes } from '../utils/exercise.js';

import './Home.css';

import { useAuth } from '../contexts/AuthContext.jsx';

function Home() {
  const { dog, allDogs, loading, switchDog } = useDog();
  const { household } = useAuth();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (dog && household?.id) {
      loadEvents();
    }
  }, [dog, household?.id]);

  async function loadEvents() {
    const data = await getEventsForDog(household.id, dog.id);
    setEvents(data);
  }

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!dog) {
    return (
      <div className="care-card welcome-card">
        <h2>Welcome! 🐾</h2>
        <p>Let's set up her profile first.</p>

        <Link to="/settings" className="btn btn-primary">
          Set up her profile
        </Link>
      </div>
    );
  }

  const {
    gramsPerDay,
    mealsPerDay,
    gramsPerMeal,
    goalNote
  } = calculateDailyFood(dog);

  const {
    minutesPerDay,
    sessions,
    minutesPerSession,
    note
  } = calculateExerciseMinutes(dog);

  const finalGramsPerDay =
    dog.foodOverrideGrams ?? gramsPerDay;

  const finalGramsPerMeal =
    Math.round(finalGramsPerDay / mealsPerDay);

  const finalMinutesPerDay =
    dog.exerciseOverrideMinutes ?? minutesPerDay;

  // -------------------------
  // TODAY
  // -------------------------

  const todayEvents = events.filter(
    (e) => e.timestamp >= startOfToday()
  );

  const feedToday = todayEvents.filter(
    (e) => e.type === 'feed'
  ).length;

  const walkMinutesToday = todayEvents
    .filter((e) => e.type === 'walk')
    .reduce(
      (sum, e) => sum + (e.durationMinutes || 0),
      0
    );

  const playMinutesToday = todayEvents
    .filter((e) => e.type === 'play')
    .reduce(
      (sum, e) => sum + (e.durationMinutes || 0),
      0
    );

  const feedProgress =
    mealsPerDay > 0
      ? Math.min(feedToday / mealsPerDay, 1)
      : 0;

  const walkProgress =
    finalMinutesPerDay > 0
      ? Math.min(
          walkMinutesToday / finalMinutesPerDay,
          1
        )
      : 0;

  const playTarget = dog.playTargetMinutes ?? PLAY_TARGET;

  const playProgress =
    playTarget > 0
      ? Math.min(playMinutesToday / playTarget, 1)
      : 0;

  const overallProgress =
    (feedProgress + walkProgress + playProgress) / 3;

  const allDone =
    feedProgress === 1 &&
    walkProgress === 1 &&
    playProgress === 1;

  // -------------------------
  // TIME OF DAY
  // -------------------------

  const hour = new Date().getHours();

  let greeting = 'Good morning';

  if (hour >= 12 && hour < 18) {
    greeting = 'Good afternoon';
  } else if (hour >= 18) {
    greeting = 'Good evening';
  }

  return (
    <div className="home-page">

      {/* HERO */}

      <section className="home-hero">

        {/* DOG SWITCHER */}

        {allDogs.length > 1 && (
          <div className="dog-switcher">
            {allDogs.map((d) => (
              <button
                key={d.id}
                className={`dog-pill ${
                  dog.id === d.id ? 'active' : ''
                }`}
                onClick={() => switchDog(d.id)}
              >
                {d.name}
              </button>
            ))}
          </div>
        )}

        <p className="home-greeting">
          {greeting} ☀️
        </p>

        <h1>{dog.name}</h1>

        <p className="home-subtitle">
          Here's how she's doing today
        </p>

        <CareRing
          name={dog.name}
          photo={dog.photo}
          progress={overallProgress}
        />

        <p className="progress-label">
          {allDone
            ? 'Everything is done! 🐾'
            : `${Math.round(overallProgress * 100)}% of today's care`}
        </p>
      </section>

      {/* TODAY */}

      <section className="home-section">

        <div className="home-section-heading">
          <h2>Today</h2>
        </div>

        <div className="today-list">

          {/* FOOD */}

          <div
            className={`today-row ${
              feedProgress === 1 ? 'complete' : ''
            }`}
          >
            <div className="today-icon">🍖</div>

            <div className="today-info">
              <strong>Food</strong>
              <span>
                {feedToday} of {mealsPerDay} meals
              </span>
            </div>

            <div className="today-status">
              {feedProgress === 1 ? '✓' : `${feedToday}/${mealsPerDay}`}
            </div>
          </div>

          {/* WALK */}

          <div
            className={`today-row ${
              walkProgress === 1 ? 'complete' : ''
            }`}
          >
            <div className="today-icon">🐾</div>

            <div className="today-info">
              <strong>Walk</strong>
              <span>
                {walkMinutesToday} / {finalMinutesPerDay} min
              </span>
            </div>

            <div className="today-status">
              {walkProgress === 1
                ? '✓'
                : `${walkMinutesToday}m`}
            </div>
          </div>

          {/* PLAY */}

          <div
            className={`today-row ${
              playProgress === 1 ? 'complete' : ''
            }`}
          >
            <div className="today-icon">🎾</div>

            <div className="today-info">
              <strong>Play</strong>
              <span>
                {playMinutesToday} / {PLAY_TARGET} min
              </span>
            </div>

            <div className="today-status">
              {playProgress === 1
                ? '✓'
                : `${playMinutesToday}m`}
            </div>
          </div>

        </div>

      </section>

      {/* DAILY PLAN */}

      <section className="home-section">

        <div className="home-section-heading">
          <h2>Her daily plan</h2>
        </div>

        <div className="plan-grid">

          <div className="plan-card">
            <span className="plan-icon">🍖</span>
            <span className="plan-label">Food</span>
            <strong>
              {mealsPerDay} × {finalGramsPerMeal}g
            </strong>
            <small>
              {finalGramsPerDay}g / day
            </small>
          </div>

          <div className="plan-card">
            <span className="plan-icon">🐾</span>
            <span className="plan-label">Exercise</span>
            <strong>
              {sessions
                ? `${sessions} × ${minutesPerSession}m`
                : `${finalMinutesPerDay}m`}
            </strong>
            <small>
              {finalMinutesPerDay} min / day
            </small>
          </div>

          <div className="plan-card">
            <span className="plan-icon">🎾</span>
            <span className="plan-label">Play</span>
            <strong>{PLAY_TARGET} min</strong>
            <small>enrichment / day</small>
          </div>

        </div>

        {(goalNote || note) && (
          <div className="home-notes">
            {goalNote && <p>{goalNote}</p>}
            {note && <p>{note}</p>}
          </div>
        )}

      </section>

      {/* DOG PROFILE */}

      <section className="home-section">

        <div className="home-section-heading">
          <h2>About {dog.name}</h2>

          <Link to="/settings">
            Edit
          </Link>
        </div>

        <ul className="stat-list home-stats">
          <li>
            Age
            <span>{dog.ageMonths} mo</span>
          </li>

          <li>
            Weight
            <span>{dog.weightKg} kg</span>
          </li>

          <li>
            Size
            <span>{dog.size}</span>
          </li>

          <li>
            Activity
            <span>{dog.activityLevel}</span>
          </li>
        </ul>

      </section>

    </div>
  );
}

export default Home;