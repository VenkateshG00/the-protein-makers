export const MEAL_TIMINGS = {
  morning: {
    label: 'Breakfast',
    prepStart: '5:00 AM',
    prepEnd: '7:00 AM',
    deliveryStart: '7:00 AM',
    deliveryEnd: '9:00 AM',
    cutoff: '9:00 PM (prev day)',
    icon: '🌅',
  },
  afternoon: {
    label: 'Lunch',
    prepStart: '9:00 AM',
    prepEnd: '11:30 AM',
    deliveryStart: '12:00 PM',
    deliveryEnd: '2:00 PM',
    cutoff: '8:00 AM',
    icon: '☀️',
  },
  dinner: {
    label: 'Dinner',
    prepStart: '3:00 PM',
    prepEnd: '6:00 PM',
    deliveryStart: '7:00 PM',
    deliveryEnd: '9:00 PM',
    cutoff: '2:00 PM',
    icon: '🌙',
  },
} as const;

export type MealSlot = keyof typeof MEAL_TIMINGS;
