import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import {
  User,
  Mail,
  Calendar,
  Shield,
  Download,
  Trash2,
  LogOut,
  Moon,
  Sun,
  Sparkles,
  FileText,
  Check,
} from 'lucide-react'
import {
  Card,
  CardHeader,
  Button,
  Badge,
  SectionHeader,
  PageTransition,
} from '../../components/ui/index.jsx'
import { useTheme } from '../../context/ThemeContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useAppData } from '../../context/AppDataContext.jsx'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}
const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
}

function Field({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-gray-100 p-4 dark:border-white/5">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-300">
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <div className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
          {label}
        </div>
        <div className="mt-0.5 truncate text-sm font-semibold text-gray-900 dark:text-white">
          {value || '—'}
        </div>
      </div>
    </div>
  )
}

function ToggleSwitch({ on, onClick, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onClick}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
        on
          ? 'bg-gray-900 dark:bg-white'
          : 'bg-gray-200 dark:bg-white/10'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-transform dark:bg-gray-900 ${
          on ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

export default function ClientAccount() {
  const navigate = useNavigate()
  const { theme, toggle } = useTheme()
  const { user, logout } = useAuth()
  const {
    clients,
    getSubscription,
    getAgreement,
    cancelSubscription,
    exportClientData,
    deleteClient,
  } = useAppData()

  const me = clients.find((c) => c.id === user?.clientId) || clients[0]
  const subscription = me ? getSubscription(me.id) : null
  const agreement = me ? getAgreement(me.id) : null
  const isDark = theme === 'dark'

  const [downloaded, setDownloaded] = useState(false)

  const handleDownload = () => {
    if (!me) return
    const blob = new Blob([JSON.stringify(exportClientData(me.id), null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'zullcoaching-my-data.json'
    a.click()
    URL.revokeObjectURL(url)
    setDownloaded(true)
    setTimeout(() => setDownloaded(false), 2200)
  }

  const handleCancel = () => {
    if (!me) return
    if (window.confirm('Cancel your coaching plan? You can re-subscribe anytime.')) {
      cancelSubscription(me.id)
    }
  }

  const handleDelete = () => {
    if (!me) return
    const ok = window.confirm(
      'Delete your account? This permanently removes your profile, plan, messages, logs, and photos from this device. This cannot be undone.',
    )
    if (!ok) return
    deleteClient(me.id)
    logout()
    navigate('/')
  }

  return (
    <PageTransition>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        <SectionHeader
          title="Account"
          subtitle="Manage your profile, plan, and data"
        />

        {/* 1. Profile snapshot */}
        <motion.div variants={item}>
          <Card>
            <CardHeader
              title="Profile"
              subtitle="Your details on file"
              icon={User}
            />
            <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
              <Field icon={User} label="Name" value={me?.name} />
              <Field icon={Mail} label="Email" value={me?.email} />
              <Field icon={Calendar} label="Joined" value={me?.joined} />
              <Field icon={Sparkles} label="Goal" value={me?.goal} />
              <Field
                icon={User}
                label="Age"
                value={me?.age ? `${me.age} yrs` : '—'}
              />
              <Field
                icon={User}
                label="Height"
                value={me?.height ? `${me.height} cm` : '—'}
              />
              <Field
                icon={User}
                label="Weight"
                value={me?.weight ? `${me.weight} kg` : '—'}
              />
            </div>
            <div className="mx-5 mb-5 mt-1 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-500 dark:border-white/5 dark:bg-white/5 dark:text-gray-400">
              Edits to your plan or goals — message Coach Zull.
            </div>
          </Card>
        </motion.div>

        {/* 2. My subscription */}
        <motion.div variants={item}>
          <Card>
            <CardHeader
              title="My subscription"
              subtitle="Your active coaching plan"
              icon={Sparkles}
            />
            <div className="p-5 pt-3">
              {subscription ? (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gray-900 text-white dark:bg-white dark:text-gray-900">
                      <Sparkles size={20} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                          {subscription.name}
                        </h3>
                        <Badge className="bg-gray-900/5 text-gray-700 dark:bg-white/10 dark:text-gray-200">
                          {subscription.status || 'active'}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        ${subscription.price}
                        {subscription.cadence === 'per month'
                          ? ' /mo'
                          : subscription.cadence === 'trial'
                            ? ' trial'
                            : ' one-time'}
                        {subscription.trialEndsAt
                          ? ` · trial ends ${subscription.trialEndsAt}`
                          : ` · active since ${subscription.since}`}
                      </p>
                    </div>
                  </div>
                  <Button variant="danger" onClick={handleCancel}>
                    Cancel my plan
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No active plan.
                  </p>
                  <Link to="/packages">
                    <Button variant="primary">Browse packages</Button>
                  </Link>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* 3. Appearance */}
        <motion.div variants={item}>
          <Card>
            <CardHeader
              title="Appearance"
              subtitle="Choose how ZullCoaching looks"
              icon={isDark ? Moon : Sun}
            />
            <div className="flex items-center justify-between gap-4 p-5 pt-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  Dark mode
                </div>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {isDark
                    ? 'Easier on the eyes in low light.'
                    : 'Crisp and bright for daytime use.'}
                </p>
              </div>
              <ToggleSwitch on={isDark} onClick={toggle} label="Toggle dark mode" />
            </div>
          </Card>
        </motion.div>

        {/* 4. Coaching agreement */}
        <motion.div variants={item}>
          <Card>
            <CardHeader
              title="Coaching agreement"
              subtitle="Terms you accepted at signup"
              icon={FileText}
            />
            <div className="p-5 pt-3">
              {agreement ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-300">
                      <Shield size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        Signed on {agreement.signedAt}
                      </div>
                      {agreement.version && (
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                          Version {agreement.version}
                        </p>
                      )}
                    </div>
                  </div>
                  <Link to="/legal">
                    <Button variant="outline">Review policies</Button>
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  You'll accept the coaching agreement at checkout when you start a
                  plan.{' '}
                  <Link
                    to="/legal"
                    className="font-semibold text-gray-900 underline-offset-2 hover:underline dark:text-white"
                  >
                    Preview the policies
                  </Link>
                  .
                </p>
              )}
            </div>
          </Card>
        </motion.div>

        {/* 5. Your data (privacy) */}
        <motion.div variants={item}>
          <Card>
            <CardHeader
              title="Your data"
              subtitle="Privacy and exports"
              icon={Download}
            />
            <div className="flex flex-col gap-4 p-5 pt-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-md text-sm text-gray-500 dark:text-gray-400">
                Your data is yours. Export it anytime.
              </p>
              <Button variant="primary" onClick={handleDownload}>
                {downloaded ? (
                  <>
                    <Check size={16} /> Downloaded
                  </>
                ) : (
                  <>
                    <Download size={16} /> Download my data
                  </>
                )}
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* 6. Danger zone */}
        <motion.div variants={item}>
          <Card className="border-rose-500/30 dark:border-rose-500/30">
            <CardHeader
              title="Danger zone"
              subtitle="Permanent account actions"
              icon={Trash2}
            />
            <div className="p-5 pt-3">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button variant="outline" onClick={logout} className="sm:w-auto">
                  <LogOut size={16} /> Log out
                </Button>
                <Button variant="danger" onClick={handleDelete} className="sm:w-auto">
                  <Trash2 size={16} /> Delete my account
                </Button>
              </div>
              <p className="mt-4 max-w-2xl text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                Deleting removes your profile, plan, messages, logs, and photos from
                this device. If you've signed an agreement, that record remains in
                Coach Zull's records.
              </p>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </PageTransition>
  )
}
