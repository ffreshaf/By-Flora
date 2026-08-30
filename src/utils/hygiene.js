export const HYGIENE_TYPES = [
  {
    id: 'bath',
    label: 'Bath',
    icon: '🛁',
    intervalField: 'bathIntervalDays',
    defaultInterval: 28,
    notifTitle: 'Bath time 🛁',
    notifBody: (name) => `It's about time to give ${name} a bath.`
  },
  {
    id: 'groom',
    label: 'Groom',
    icon: '✂️',
    intervalField: 'groomIntervalDays',
    defaultInterval: 42,
    notifTitle: 'Grooming time ✂️',
    notifBody: (name) => `${name} is due for a groom/trim.`
  },
  {
    id: 'nails',
    label: 'Nails',
    icon: '💅',
    intervalField: 'nailIntervalDays',
    defaultInterval: 21,
    notifTitle: 'Nail trim time 💅',
    notifBody: (name) => `${name}'s nails are due for a trim.`
  },
];