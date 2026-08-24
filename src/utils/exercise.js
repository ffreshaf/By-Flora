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
  const { ageMonths, size, activityLevel, weightGoal } = dog;

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
  let minutesPerDay = Math.round(base * modifier);
  let note = 'One walk or split into a few shorter ones — total time is what counts.';

  if (weightGoal === 'lose') {
    // Start slightly below the standard target and build up gradually rather than jumping straight in
    minutesPerDay = Math.round(minutesPerDay * 0.85);
    note = 'Start here and build up over a few weeks as her fitness improves — low-impact activity (walks, swimming) is easiest on joints while she loses weight.';
  }

  return { minutesPerDay, sessions: null, minutesPerSession: null, note };
}