import coachAvatar from '../assets/coach-avatar.jpg'

// The single source of truth for the coach's public profile + offers.
// Used by the coach Settings page AND the client portal (packages, chat header).
export const COACH = {
  name: 'Coach Zull',
  handle: 'zulllandin',
  instagram: 'https://instagram.com/zulllandin',
  email: 'coach@zullcoaching.com',
  // Self-serve booking link (Calendly, SavvyCal, etc). Leave '' to fall back to
  // the "I'll reply within 24 hours" copy on the Apply success screen.
  calendlyUrl: '',
  avatar: coachAvatar,
  bio: 'Online physique & performance coach helping clients build sustainable results.',
}

export const PACKAGES = [
  {
    id: 'pkg-12wk',
    name: '12-Week Transformation',
    price: 599,
    cadence: 'one-time',
    clients: 14,
    blurb: 'A full 12-week build or cut with weekly check-ins, custom macros, and training.',
    perks: ['Custom meal & training plan', 'Weekly check-ins + feedback', 'Form reviews', 'Direct chat access'],
  },
  {
    id: 'pkg-6mo',
    name: '6-Month Coaching',
    price: 1149,
    cadence: 'one-time',
    monthsCovered: 6,
    clients: 0,
    blurb: 'Half-year commitment, paid upfront — biggest savings vs. monthly, deepest results.',
    perks: [
      '6 months of 1:1 coaching',
      'Periodized training across blocks',
      'Weekly macro adjustments',
      'Unlimited messaging',
      'Quarterly photo & strength review',
    ],
  },
  {
    id: 'pkg-monthly',
    name: 'Monthly Coaching',
    price: 350,
    cadence: 'per month',
    clients: 38,
    featured: true,
    blurb: 'Ongoing 1:1 coaching — adjustments every week, unlimited messaging.',
    perks: ['Everything in 12-Week', 'Macro adjustments weekly', 'Unlimited messaging', 'Priority support'],
  },
  {
    id: 'pkg-trial',
    name: '2-Week Trial',
    price: 99,
    cadence: 'trial',
    trialDays: 14,
    clients: 0,
    blurb: 'Try the full coaching experience for 14 days — plan, check-ins, direct messaging. Decide after.',
    perks: [
      'Custom 2-week meal & training plan',
      'Daily logging in the app',
      'One mid-trial check-in',
      'Direct messaging with me',
      'Easy convert to Monthly after',
    ],
  },
]
