// Mock data for the client-side portal.

// Weekly training split assigned by the coach (read-only for the client).
export const WORKOUT_PLAN = [
  {
    day: 'Monday',
    focus: 'Push — Chest / Shoulders / Triceps',
    exercises: [
      { name: 'Barbell Bench Press', sets: 4, reps: '6-8', rpe: 8 },
      { name: 'Incline DB Press', sets: 3, reps: '8-10', rpe: 8 },
      { name: 'Seated Shoulder Press', sets: 3, reps: '8-10', rpe: 8 },
      { name: 'Cable Lateral Raise', sets: 3, reps: '12-15', rpe: 9 },
      { name: 'Rope Triceps Pushdown', sets: 3, reps: '10-12', rpe: 9 },
    ],
  },
  {
    day: 'Tuesday',
    focus: 'Pull — Back / Biceps',
    exercises: [
      { name: 'Weighted Pull-ups', sets: 4, reps: '6-8', rpe: 8 },
      { name: 'Barbell Row', sets: 3, reps: '8-10', rpe: 8 },
      { name: 'Lat Pulldown', sets: 3, reps: '10-12', rpe: 8 },
      { name: 'Face Pulls', sets: 3, reps: '15', rpe: 9 },
      { name: 'EZ-Bar Curl', sets: 3, reps: '10-12', rpe: 9 },
    ],
  },
  {
    day: 'Wednesday',
    focus: 'Rest / 8k steps + mobility',
    exercises: [],
  },
  {
    day: 'Thursday',
    focus: 'Legs — Quads / Hamstrings',
    exercises: [
      { name: 'Back Squat', sets: 4, reps: '5-7', rpe: 8 },
      { name: 'Romanian Deadlift', sets: 3, reps: '8-10', rpe: 8 },
      { name: 'Leg Press', sets: 3, reps: '10-12', rpe: 9 },
      { name: 'Leg Curl', sets: 3, reps: '12', rpe: 9 },
      { name: 'Standing Calf Raise', sets: 4, reps: '12-15', rpe: 9 },
    ],
  },
  {
    day: 'Friday',
    focus: 'Upper — Hypertrophy',
    exercises: [
      { name: 'Incline Bench Press', sets: 4, reps: '8-10', rpe: 8 },
      { name: 'Chest-Supported Row', sets: 4, reps: '10-12', rpe: 8 },
      { name: 'DB Shoulder Press', sets: 3, reps: '10-12', rpe: 8 },
      { name: 'Hammer Curl', sets: 3, reps: '12', rpe: 9 },
      { name: 'Overhead Triceps Ext.', sets: 3, reps: '12', rpe: 9 },
    ],
  },
  {
    day: 'Saturday',
    focus: 'Lower + Conditioning',
    exercises: [
      { name: 'Front Squat', sets: 3, reps: '8', rpe: 8 },
      { name: 'Hip Thrust', sets: 3, reps: '10-12', rpe: 8 },
      { name: 'Walking Lunges', sets: 3, reps: '12 / leg', rpe: 9 },
      { name: 'Incline Walk', sets: 1, reps: '20 min', rpe: 6 },
    ],
  },
  { day: 'Sunday', focus: 'Rest', exercises: [] },
]

// Notifications shown in the client portal (newest first).
export const CLIENT_NOTIFICATIONS = [
  { id: 1, type: 'checkin', title: 'Weekly check-in due', body: 'Submit your Week 9 check-in before Sunday 8 PM.', time: '2h ago', urgent: true },
  { id: 2, type: 'message', title: 'New message from Coach Zull', body: 'Great work this week — let’s push carbs on training days.', time: '5h ago', urgent: false },
  { id: 3, type: 'plan', title: 'Meal plan updated', body: 'Your calories were bumped +150 to support training.', time: '1d ago', urgent: false },
  { id: 4, type: 'workout', title: 'New training block', body: 'Week 9–12 hypertrophy block is now live.', time: '2d ago', urgent: false },
]

// The client's next check-in deadline.
export const NEXT_CHECKIN = {
  label: 'Week 9 Check-in',
  dueIn: 'Due in 2 days',
  dueDate: 'Sunday, 8:00 PM',
  status: 'upcoming', // upcoming | due | overdue
}

// Seed conversation between the client and the coach.
export const MESSAGE_SEED = [
  { id: 1, from: 'coach', text: 'Hey Marcus — solid week. Weight is trending down nicely. How’s energy in the gym?', time: 'Mon 9:14 AM' },
  { id: 2, from: 'client', text: 'Feeling strong! Bench went up 5lbs. A bit hungrier in the evenings though.', time: 'Mon 12:02 PM' },
  { id: 3, from: 'coach', text: 'Good problem to have. I added 150 cals to your training days — mostly carbs around the session. Check your plan.', time: 'Mon 12:20 PM' },
  { id: 4, from: 'client', text: 'Appreciate it 🙏 Will lock it in today.', time: 'Mon 12:31 PM' },
]
