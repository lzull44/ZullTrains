import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useAuth } from './context/AuthContext.jsx'
import { Layout } from './components/layout/Layout.jsx'
import { ClientLayout } from './components/layout/ClientLayout.jsx'

import Landing from './pages/Landing.jsx'
import Legal from './pages/Legal.jsx'
import Apply from './pages/Apply.jsx'
import Calculator from './pages/Calculator.jsx'
import Login from './pages/Login.jsx'
import Onboarding from './pages/Onboarding.jsx'
import Leads from './pages/Leads.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Clients from './pages/Clients.jsx'
import ClientProfile from './pages/ClientProfile.jsx'
import MealBuilder from './pages/MealBuilder.jsx'
import WorkoutBuilder from './pages/WorkoutBuilder.jsx'
import Messages from './pages/Messages.jsx'
import FoodDatabase from './pages/FoodDatabase.jsx'
import GroceryList from './pages/GroceryList.jsx'
import Progress from './pages/Progress.jsx'
import CheckIns from './pages/CheckIns.jsx'
import Analytics from './pages/Analytics.jsx'
import Settings from './pages/Settings.jsx'

import ClientHome from './pages/client/ClientHome.jsx'
import ClientPlan from './pages/client/ClientPlan.jsx'
import ClientProgress from './pages/client/ClientProgress.jsx'
import ClientAccount from './pages/client/ClientAccount.jsx'
import ClientCheckIns from './pages/client/ClientCheckIns.jsx'
import ClientMessages from './pages/client/ClientMessages.jsx'
import ClientPackages from './pages/client/ClientPackages.jsx'

export default function App() {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return (
      <Routes location={location}>
        <Route path="/" element={<Landing />} />
        <Route path="/apply" element={<Apply />} />
        <Route path="/calculator" element={<Calculator />} />
        <Route path="/legal" element={<Legal />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    )
  }

  // ---- Client portal: locked-down, coach tools are not even routable ----
  if (user.role === 'client') {
    return (
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/legal" element={<Legal />} />
          <Route element={<ClientLayout />}>
            <Route index element={<ClientHome />} />
            <Route path="my-plan" element={<ClientPlan />} />
            <Route path="progress" element={<ClientProgress />} />
            <Route path="check-ins" element={<ClientCheckIns />} />
            <Route path="messages" element={<ClientMessages />} />
            <Route path="packages" element={<ClientPackages />} />
            <Route path="account" element={<ClientAccount />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AnimatePresence>
    )
  }

  // ---- Coach app ----
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/legal" element={<Legal />} />
        <Route path="/apply" element={<Apply />} />
        <Route path="/calculator" element={<Calculator />} />
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="clients" element={<Clients />} />
          <Route path="clients/:id" element={<ClientProfile />} />
          <Route path="leads" element={<Leads />} />
          <Route path="meal-builder" element={<MealBuilder />} />
          <Route path="workout-builder" element={<WorkoutBuilder />} />
          <Route path="messages" element={<Messages />} />
          <Route path="food-database" element={<FoodDatabase />} />
          <Route path="grocery-list" element={<GroceryList />} />
          <Route path="progress" element={<Progress />} />
          <Route path="check-ins" element={<CheckIns />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AnimatePresence>
  )
}
