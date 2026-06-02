import {
  LayoutDashboard, Users, UtensilsCrossed, Dumbbell, Database, ShoppingCart,
  TrendingUp, ClipboardCheck, MessageSquare, BarChart3, Settings, Inbox,
} from 'lucide-react'

export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/leads', label: 'Leads', icon: Inbox },
  { to: '/clients', label: 'Clients', icon: Users },
  { to: '/messages', label: 'Messages', icon: MessageSquare },
  { to: '/meal-builder', label: 'Meal Builder', icon: UtensilsCrossed },
  { to: '/workout-builder', label: 'Workout Builder', icon: Dumbbell },
  { to: '/food-database', label: 'Food Database', icon: Database },
  { to: '/grocery-list', label: 'Grocery List', icon: ShoppingCart },
  { to: '/progress', label: 'Progress Tracker', icon: TrendingUp },
  { to: '/check-ins', label: 'Check-Ins', icon: ClipboardCheck },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
]
