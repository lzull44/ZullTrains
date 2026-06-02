import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  User, Palette, Bell, CreditCard, LogOut, Moon, Sun, Check, DollarSign,
  Package, BookOpen, Unlock, Sparkles, ChevronRight, Instagram, Camera,
} from 'lucide-react'

import {
  PageTransition, SectionHeader, Card, Button, Badge,
} from '../components/ui/index.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import { COACH, PACKAGES } from '../data/coach.js'
import { clearPersisted } from '../hooks/usePersistentState.js'
import { wipeToLive } from '../context/AppDataContext.jsx'

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'billing', label: 'Billing & Revenue', icon: CreditCard },
  { id: 'account', label: 'Account', icon: LogOut },
]

const PAYMENTS = [
  { name: 'Marcus Bell', plan: 'Monthly Coaching', amount: 350, date: 'May 24', status: 'Paid' },
  { name: 'Sofia Reyes', plan: '12-Week Transformation', amount: 599, date: 'May 22', status: 'Paid' },
  { name: 'Devon Clarke', plan: '2-Week Trial', amount: 99, date: 'May 20', status: 'Pending' },
]

const UPSELLS = [
  { icon: Package, title: 'Digital product upsells', copy: 'Sell programs & guides as add-ons at checkout.' },
  { icon: BookOpen, title: 'Recipe ebook sales', copy: 'Bundle macro-friendly recipe ebooks for passive revenue.' },
  { icon: Unlock, title: 'Program unlocks', copy: 'Gate premium training blocks behind one-time unlocks.' },
]

export default function Settings() {
  const { user, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const [tab, setTab] = useState('profile')

  const [profile, setProfile] = useState({
    name: user?.name || 'Coach Zull',
    email: user?.email || 'coach@zullcoaching.com',
    business: 'ZullCoaching',
    bio: COACH.bio,
    instagram: COACH.handle,
  })
  const [avatar, setAvatar] = useState(COACH.avatar)
  const [saved, setSaved] = useState(false)

  const onPhoto = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setAvatar(reader.result)
    reader.readAsDataURL(file)
  }
  const igHandle = profile.instagram.replace(/^@/, '')

  const [notifs, setNotifs] = useState({
    checkinReminders: true,
    newClientAlerts: true,
    weeklySummary: false,
  })

  const saveProfile = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  return (
    <PageTransition>
      <SectionHeader title="Settings" subtitle="Profile, preferences & billing" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        {/* Tab nav */}
        <Card className="h-fit overflow-hidden p-1.5">
          {TABS.map((t) => {
            const active = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                  active
                    ? 'bg-accent-500/10 text-accent-700 dark:text-accent-400'
                    : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5'
                }`}
              >
                <t.icon size={17} />
                {t.label}
              </button>
            )
          })}
        </Card>

        {/* Tab content */}
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-6"
        >
          {tab === 'profile' && (
            <Card className="p-6">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Profile</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Your public coaching details.</p>

              {/* Profile picture */}
              <div className="mt-6 flex items-center gap-5">
                <div className="relative h-20 w-20 shrink-0">
                  {avatar ? (
                    <img src={avatar} alt="Profile" className="h-20 w-20 rounded-2xl object-cover ring-2 ring-accent-500/30" />
                  ) : (
                    <div className="grid h-20 w-20 place-items-center rounded-2xl bg-accent-500/10 text-2xl font-bold text-accent-600 dark:text-accent-400 ring-2 ring-accent-500/20">
                      {profile.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                    </div>
                  )}
                </div>
                <div>
                  <label className="btn-outline cursor-pointer px-4 py-2.5 text-sm">
                    <Camera size={15} /> Upload photo
                    <input type="file" accept="image/*" onChange={onPhoto} className="hidden" />
                  </label>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">JPG or PNG. Square images look best.</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label="Coach name">
                  <input
                    className="input"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  />
                </Field>
                <Field label="Email">
                  <input
                    className="input"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  />
                </Field>
                <Field label="Business name" className="sm:col-span-2">
                  <input
                    className="input"
                    value={profile.business}
                    onChange={(e) => setProfile({ ...profile, business: e.target.value })}
                  />
                </Field>
                <Field label="Instagram" className="sm:col-span-2">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                      <input
                        className="input pl-7"
                        value={igHandle}
                        onChange={(e) => setProfile({ ...profile, instagram: e.target.value })}
                        placeholder="zulllandin"
                      />
                    </div>
                    <a
                      href={`https://instagram.com/${igHandle}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-outline px-3 py-2.5 text-sm"
                    >
                      <Instagram size={15} /> View
                    </a>
                  </div>
                </Field>
                <Field label="Bio" className="sm:col-span-2">
                  <textarea
                    className="input resize-none"
                    rows={3}
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  />
                </Field>
              </div>
              <div className="mt-6 flex items-center justify-end gap-3">
                {saved && (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-accent-600 dark:text-accent-400">
                    <Check size={15} /> Saved
                  </span>
                )}
                <Button onClick={saveProfile}>Save changes</Button>
              </div>
            </Card>
          )}

          {tab === 'appearance' && (
            <Card className="p-6">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Appearance</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Customize how ZullCoaching looks.</p>

              <div className="mt-6 flex items-center justify-between rounded-2xl border border-gray-100 p-4 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-300">
                    {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Dark mode</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Currently {theme === 'dark' ? 'on' : 'off'}
                    </div>
                  </div>
                </div>
                <Toggle on={theme === 'dark'} onChange={toggle} />
              </div>

              <div className="mt-4 flex items-center justify-between rounded-2xl border border-gray-100 p-4 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent-500/10 text-accent-600 dark:text-accent-400">
                    <Palette size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Accent color</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">ZullCoaching green</div>
                  </div>
                </div>
                <span className="h-7 w-7 rounded-full bg-accent-600 ring-2 ring-accent-500/30" />
              </div>
            </Card>
          )}

          {tab === 'notifications' && (
            <Card className="p-6">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Notifications</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Choose what you get pinged about.</p>
              <div className="mt-6 divide-y divide-gray-100 dark:divide-white/5">
                <ToggleRow
                  label="Check-in reminders"
                  desc="Nudge clients with outstanding weekly check-ins."
                  on={notifs.checkinReminders}
                  onChange={(v) => setNotifs({ ...notifs, checkinReminders: v })}
                />
                <ToggleRow
                  label="New client alerts"
                  desc="Get notified when a new client signs up."
                  on={notifs.newClientAlerts}
                  onChange={(v) => setNotifs({ ...notifs, newClientAlerts: v })}
                />
                <ToggleRow
                  label="Weekly summary"
                  desc="A Monday digest of roster adherence & revenue."
                  on={notifs.weeklySummary}
                  onChange={(v) => setNotifs({ ...notifs, weeklySummary: v })}
                />
              </div>
            </Card>
          )}

          {tab === 'billing' && <BillingSection avatar={avatar} instagram={igHandle} />}

          {tab === 'account' && (
            <Card className="p-6">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Account</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Signed in as {profile.email}.
              </p>
              <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-500/20 dark:bg-rose-500/5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Log out</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      End your session and return to the sign-in screen.
                    </div>
                  </div>
                  <Button variant="danger" onClick={logout}>
                    <LogOut size={16} />
                    Log out
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-gray-100 p-4 dark:border-white/5">
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Reset app data</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Clear all saved clients, plans &amp; logs from this browser and restore the demo defaults.
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (window.confirm('Reset all saved data on this device back to demo defaults?')) {
                      clearPersisted()
                      window.location.reload()
                    }
                  }}
                >
                  Reset
                </Button>
              </div>

              <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-accent-500/30 bg-accent-500/5 p-4">
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                    Switch to live mode <Badge className="bg-accent-500/15 text-accent-700 dark:text-accent-300">Launch</Badge>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Wipe every demo client, fake stat, and seed message so your dashboard reflects only real data.
                    Do this right before you start onboarding actual clients.
                  </div>
                </div>
                <Button
                  variant="primary"
                  onClick={() => {
                    if (window.confirm('This wipes ALL demo data (clients, plans, messages, fake activity) and switches the app to live mode. You can keep using it normally; the dashboard will just be honest. Continue?')) {
                      wipeToLive()
                    }
                  }}
                >
                  Start clean
                </Button>
              </div>
            </Card>
          )}
        </motion.div>
      </div>
    </PageTransition>
  )
}

function BillingSection({ avatar, instagram }) {
  return (
    <div className="space-y-6">
      {/* MRR + Stripe */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent-500/10 text-accent-600 dark:text-accent-400">
              <DollarSign size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">$8,420</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Monthly recurring revenue</div>
            </div>
          </div>
          <p className="mt-3 text-xs text-accent-600 dark:text-accent-400">+12% vs. last month</p>
        </Card>

        <Card className="flex flex-col justify-between p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-zinc-500/10 text-zinc-600 dark:text-zinc-400">
                <CreditCard size={20} />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">Stripe subscriptions</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Accept recurring payments.</div>
              </div>
            </div>
            <Placeholder />
          </div>
          <Button variant="outline" disabled className="mt-4 w-full">
            Connect Stripe
          </Button>
        </Card>
      </div>

      {/* Coaching packages */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Coaching packages</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Your active offers.</p>
          </div>
          <Placeholder />
        </div>
        <div className="mt-5 space-y-3">
          {PACKAGES.map((p) => (
            <div
              key={p.name}
              className={`flex items-center justify-between rounded-2xl border p-4 ${
                p.featured
                  ? 'border-accent-500/40 bg-accent-500/5'
                  : 'border-gray-100 dark:border-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                {avatar ? (
                  <img src={avatar} alt={p.name} className={`h-11 w-11 rounded-xl object-cover ring-2 ${p.featured ? 'ring-accent-500/40' : 'ring-gray-200 dark:ring-white/10'}`} />
                ) : (
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400">
                    <Package size={18} />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{p.name}</span>
                    {p.featured && (
                      <Badge className="bg-accent-500/10 text-accent-600 dark:text-accent-400">Most popular</Badge>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{p.clients} active clients</div>
                  {p.featured && (
                    <a
                      href={`https://instagram.com/${instagram}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-accent-600 hover:underline dark:text-accent-400"
                    >
                      <Instagram size={12} /> @{instagram}
                    </a>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  ${p.price}
                  {p.featured && <span className="text-xs font-normal text-gray-400">/mo</span>}
                </span>
                <Button variant="ghost" size="sm" disabled>
                  Edit
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Payment tracking */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Recent payments</h3>
          <Placeholder />
        </div>
        <div className="mt-5 overflow-hidden rounded-2xl border border-gray-100 dark:border-white/5">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-400 dark:bg-white/5">
              <tr>
                <th className="px-4 py-2.5 font-medium">Client</th>
                <th className="px-4 py-2.5 font-medium">Plan</th>
                <th className="px-4 py-2.5 font-medium">Amount</th>
                <th className="px-4 py-2.5 font-medium">Date</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {PAYMENTS.map((p) => (
                <tr key={p.name} className="text-gray-700 dark:text-gray-300">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{p.name}</td>
                  <td className="px-4 py-3">{p.plan}</td>
                  <td className="px-4 py-3">${p.amount}</td>
                  <td className="px-4 py-3">{p.date}</td>
                  <td className="px-4 py-3">
                    <Badge
                      className={
                        p.status === 'Paid'
                          ? 'bg-accent-500/10 text-accent-600 dark:text-accent-400'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }
                    >
                      {p.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Upsells */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {UPSELLS.map((u) => (
          <Card key={u.title} className="flex flex-col p-5">
            <div className="flex items-start justify-between">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent-500/10 text-accent-600 dark:text-accent-400">
                <u.icon size={18} />
              </div>
              <Placeholder />
            </div>
            <div className="mt-4 flex-1">
              <div className="text-sm font-semibold text-gray-900 dark:text-white">{u.title}</div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{u.copy}</p>
            </div>
            <Button variant="outline" size="sm" disabled className="mt-4 w-full">
              <Sparkles size={14} />
              Set up
            </Button>
          </Card>
        ))}
      </div>
    </div>
  )
}

function Placeholder() {
  return (
    <span className="chip bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400">Coming soon</span>
  )
}

function Field({ label, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      {children}
    </label>
  )
}

function ToggleRow({ label, desc, on, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div>
        <div className="text-sm font-medium text-gray-900 dark:text-white">{label}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{desc}</div>
      </div>
      <Toggle on={on} onChange={() => onChange(!on)} />
    </div>
  )
}

function Toggle({ on, onChange }) {
  return (
    <button
      onClick={onChange}
      role="switch"
      aria-checked={on}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        on ? 'bg-accent-600' : 'bg-gray-200 dark:bg-white/10'
      }`}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm ${on ? 'left-[22px]' : 'left-0.5'}`}
      />
    </button>
  )
}
