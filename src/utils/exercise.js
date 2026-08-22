const SIZE_BASE_MINUTES = {
  small: 30,
  medium: 45,
  large: 60,
  giant: 40
};

const ACTIVITY_MODIFIERS = {
  low: 0.7,
  moderate: 1.0,
  active: 1.3,
  'very active': 1.6
};

export function calculateExerciseMinutes(dog) {
  const { ageMonths, size, activityLevel } = dog;

  // Puppy rule: ~5 min per month of age, twice a day, until ~12 months
  if (ageMonths < 12) {
    const perSession = Math.min(ageMonths * 5, 60);
    return {
      minutesPerDay: perSession * 2,
      sessions: 2,
      minutesPerSession: perSession,
      note: 'Puppy rule: short, frequent sessions protect growing joints.'
    };
  }

  const base = SIZE_BASE_MINUTES[size] ?? SIZE_BASE_MINUTES.medium;
  const modifier = ACTIVITY_MODIFIERS[activityLevel] ?? ACTIVITY_MODIFIERS.moderate;
  const minutesPerDay = Math.round(base * modifier);

  return {
    minutesPerDay,
    sessions: 2,
    minutesPerSession: Math.round(minutesPerDay / 2),
    note: null
  };
}