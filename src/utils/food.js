const PUPPY_UNDER_4M = 3.0;
const PUPPY_4_TO_12M = 2.0;
const ADULT_FACTORS = {
  low: 1.2,
  moderate: 1.6,
  active: 2.0,
  'very active': 2.5
};

function getMealsPerDay(ageMonths) {
  if (ageMonths < 4) return 4;
  if (ageMonths < 12) return 3;
  return 2;
}

export function calculateDailyFood(dog) {
  const { weightKg, ageMonths, activityLevel, kcalPer100g } = dog;

  const rer = 70 * Math.pow(weightKg, 0.75);

  let factor;
  if (ageMonths < 4) {
    factor = PUPPY_UNDER_4M;
  } else if (ageMonths < 12) {
    factor = PUPPY_4_TO_12M;
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
    gramsPerMeal
  };
}