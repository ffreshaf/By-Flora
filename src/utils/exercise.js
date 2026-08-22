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

  // Puppy rule: short, frequent sessions genuinely protect growing joints
  if (ageMonths < 12) {
    const perSession = Math.min(ageMonths * 5, 60);
    return {
      minutesPerDay: perSession * 2,
      sessions: 2,
      minutesPerSession: perSession,
      note: 'Puppy rule: keep it in short sessions — long walks can stress growing joints.'
    };
  }

  const base = SIZE_BASE_MINUTES[size] ?? SIZE_BASE_MINUTES.medium;
  const modifier = ACTIVITY_MODIFIERS[activityLevel] ?? ACTIVITY_MODIFIERS.moderate;
  const minutesPerDay = Math.round(base * modifier);

  return {
    minutesPerDay,
    sessions: null,
    minutesPerSession: null,
    note: 'One walk or split into a few shorter ones — total time is what counts.'
  };
}