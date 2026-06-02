import { Home, Dumbbell, TrendingUp, ClipboardCheck, MessageSquare, Package, UserCog } from 'lucide-react'

// Client-only navigation. Deliberately excludes coach tools (clients, food DB,
// analytics, billing/settings) so clients can't see or change coach data.
export const CLIENT_NAV = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/my-plan', label: 'My Plan', icon: Dumbbell },
  { to: '/progress', label: 'Progress', icon: TrendingUp },
  { to: '/check-ins', label: 'Check-Ins', icon: ClipboardCheck },
  { to: '/messages', label: 'Messages', icon: MessageSquare },
  { to: '/packages', label: 'Packages', icon: Package },
  { to: '/account', label: 'Account', icon: UserCog },
]
