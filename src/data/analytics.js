// Aggregate mock analytics used by Dashboard and Analytics pages.

export const WEEKLY_TREND = [
  { week: 'W1', compliance: 82, calories: 2480, weight: 79.2 },
  { week: 'W2', compliance: 85, calories: 2440, weight: 78.9 },
  { week: 'W3', compliance: 79, calories: 2510, weight: 78.7 },
  { week: 'W4', compliance: 88, calories: 2390, weight: 78.2 },
  { week: 'W5', compliance: 91, calories: 2350, weight: 77.8 },
  { week: 'W6', compliance: 87, calories: 2410, weight: 77.6 },
  { week: 'W7', compliance: 93, calories: 2330, weight: 77.1 },
  { week: 'W8', compliance: 95, calories: 2300, weight: 76.7 },
]

export const MACRO_ADHERENCE = [
  { day: 'Mon', protein: 98, carbs: 92, fat: 88 },
  { day: 'Tue', protein: 95, carbs: 85, fat: 91 },
  { day: 'Wed', protein: 101, carbs: 96, fat: 84 },
  { day: 'Thu', protein: 92, carbs: 78, fat: 95 },
  { day: 'Fri', protein: 97, carbs: 88, fat: 90 },
  { day: 'Sat', protein: 88, carbs: 110, fat: 102 },
  { day: 'Sun', protein: 94, carbs: 91, fat: 87 },
]

export const REVENUE_TREND = [
  { month: 'Jan', mrr: 4200 },
  { month: 'Feb', mrr: 4800 },
  { month: 'Mar', mrr: 5600 },
  { month: 'Apr', mrr: 6100 },
  { month: 'May', mrr: 7400 },
]

export const RECENT_ACTIVITY = [
  { id: 1, who: 'Emma Novak', avatar: 'EN', action: 'submitted a weekly check-in', meta: 'Adherence 97%', time: '12m ago', color: '#14b8a6' },
  { id: 2, who: 'Marcus Bell', avatar: 'MB', action: 'logged all meals', meta: '2,090 kcal', time: '38m ago', color: '#ec4899' },
  { id: 3, who: 'Aaliyah Khan', avatar: 'AK', action: 'uploaded progress photos', meta: '3 photos', time: '1h ago', color: '#f43f5e' },
  { id: 4, who: 'David Chen', avatar: 'DC', action: 'missed daily step goal', meta: '6,400 / 10,000', time: '3h ago', color: '#f59e0b' },
  { id: 5, who: 'Liam Walsh', avatar: 'LW', action: 'check-in overdue', meta: '2 weeks', time: '1d ago', color: '#8b5cf6' },
]

export const CHECKIN_QUEUE = [
  { id: 'c5', name: 'Liam Walsh', avatar: 'LW', due: 'Overdue', color: '#8b5cf6' },
  { id: 'c3', name: 'David Chen', avatar: 'DC', due: 'Due today', color: '#f59e0b' },
  { id: 'c2', name: 'Sofia Reyes', avatar: 'SR', due: 'Due tomorrow', color: '#0ea5e9' },
]
