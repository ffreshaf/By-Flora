const PUPPY_UNDER_4M = 3.0;
const PUPPY_4_TO_12M = 2.0;
const ADULT_FACTORS = {
  low: 1.2,
  moderate: 1.6,
  active: 2.0,
  'very active': 2.5
};
const WEIGHT_LOSS_FACTOR = 1.0; // standard conservative factor for controlled weight loss
const WEIGHT_GAIN_FACTOR = 1.8;

function getMealsPerDay(ageMonths) {
  if (ageMonths < 4) return 4;
  if (ageMonths < 12) return 3;
  return 2;
}

export function calculateDailyFood(dog) {
  const { weightKg, ageMonths, activityLevel, kcalPer100g, weightGoal, targetWeightKg } = dog;

  // For weight loss, base the calculation on target weight if given (closer to true need),
  // otherwise fall back to current weight with the conservative loss factor.
  const calcWeight = weightGoal === 'lose' && targetWeightKg ? targetWeightKg : weightKg;
  const rer = 70 * Math.pow(calcWeight, 0.75);

  let factor;
  let goalNote = null;

  if (ageMonths < 4) {
    factor = PUPPY_UNDER_4M;
  } else if (ageMonths < 12) {
    factor = PUPPY_4_TO_12M;
  } else if (weightGoal === 'lose') {
    factor = WEIGHT_LOSS_FACTOR;
    goalNote = targetWeightKg
      ? `Calculated for a target of ${targetWeightKg}kg. Weigh her every 2 weeks and ask your vet to confirm pace.`
      : 'Using a conservative weight-loss factor. A vet-confirmed target weight will make this more accurate.';
  } else if (weightGoal === 'gain') {
    factor = WEIGHT_GAIN_FACTOR;
    goalNote = 'Higher-calorie target to support healthy weight gain — recheck her weight in a few weeks.';
  } else {
    factor = ADULT_FACTORS[activityLevel] ?? ADULT_FACTORS.moderate;
  }

  const der = rer * factor;
  const gramsPerDay = Math.round((der / kcalPer100g) * 100);
  const mealsPerDay = getMealsPerDay(ageMonths);
  const gramsPerMeal = Math.round(gramsPerDay / mealsPerDay);

  return {
    dailyKcal: Math.round(der),
    gramsPerDay,
    mealsPerDay,
    gramsPerMeal,
    goalNote
  };
}