'use client'

import { useMemo, useState } from 'react'
import {
  Bell,
  Globe,
  Lock,
  Settings as SettingsIcon,
  ShieldCheck,
  User,
} from 'lucide-react'
import { useLocalStorageState } from '@/lib/useLocalStorage'
import { seedStudents } from '@/lib/seedData'
import { initialAttendanceHistory } from '@/lib/attendanceData'
import { initialResults } from '@/lib/resultsData'
import { initialPayments } from '@/lib/paymentsData'
import { initialDocuments } from '@/lib/documentsData'
import type { AuthUser } from '@/lib/authStore'
import { normalizeEmail } from '@/lib/authStore'

const initialParentNotificationPrefs = [
  { id: 'email', label: 'Email notifications', description: 'Receive updates in your inbox', enabled: true },
  { id: 'sms', label: 'SMS alerts', description: 'Urgent alerts sent to your phone', enabled: true },
  { id: 'digest', label: 'Weekly digest', description: 'Summary every Friday afternoon', enabled: true },
  { id: 'security', label: 'Security alerts', description: 'Login and access warnings', enabled: true },
]

export default function ParentSettingsPage() {
  const [profile, setProfile] = useLocalStorageState('esm_parent_profile', {
    name: '',
    role: '',
    email: '',
    phone: '',
    schoolId: '',
  })
  const [preferences, setPreferences] = useLocalStorageState('esm_parent_preferences', {
    language: 'English (US)',
    timezone: 'America/Los_Angeles',
    dateFormat: 'MM/DD/YYYY',
    defaultDashboard: 'Family Overview',
  })
  const [notificationPrefs, setNotificationPrefs] = useLocalStorageState(
    'esm_parent_notification_prefs',
    initialParentNotificationPrefs
  )
  const [students] = useLocalStorageState('esm_students', seedStudents)
  const [linkedStudents] = useLocalStorageState<number[]>('esm_parent_links', [])
  const [attendanceHistory] = useLocalStorageState(
    'esm_attendance_history',
    initialAttendanceHistory
  )
  const [results] = useLocalStorageState('esm_results', initialResults)
  const [payments] = useLocalStorageState('esm_payments', initialPayments)
  const [documents] = useLocalStorageState('esm_documents', initialDocuments)
  const [users] = useLocalStorageState<AuthUser[]>('esm_users', [])
  const [session] = useLocalStorageState('esm_user_session', {
    id: '',
    role: '',
    name: '',
    email: '',
  })
  const [saveStatus, setSaveStatus] = useState('')

  const parentUser = useMemo(
    () =>
      users.find(
        (user) => normalizeEmail(user.email) === normalizeEmail(profile.email)
      ),
    [users, profile.email]
  )
  const passwordUpdatedLabel = parentUser?.createdAt
    ? new Date(parentUser.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      })
    : 'Not set'
  const activeSessions = session.id ? 1 : 0
  const schoolId = String(profile.schoolId || '').toLowerCase()
  const schoolStudents = useMemo(
    () =>
      schoolId
        ? students.filter(
            (student) => String(student.schoolId || '').toLowerCase() === schoolId
          )
        : students,
    [students, schoolId]
  )
  const linkedDetails = useMemo(
    () => schoolStudents.filter((student) => linkedStudents.includes(student.id)),
    [schoolStudents, linkedStudents]
  )
  const linkedRolls = linkedDetails.map((student) => student.rollNumber)
  const attendanceCount = useMemo(() => {
    let count = 0
    attendanceHistory.forEach((record) => {
      linkedDetails.forEach((student) => {
        if (
          student.grade === record.grade &&
          student.section === record.section &&
          record.attendance?.[student.id]
        ) {
          count += 1
        }
      })
    })
    return count
  }, [attendanceHistory, linkedDetails])
  const resultsCount = results.filter((result) => linkedRolls.includes(result.rollNo)).length
  const paymentsCount = payments.filter((payment) => linkedRolls.includes(payment.rollNo)).length
  const documentsCount = documents.length

  const handleSave = () => {
    setSaveStatus('Changes saved just now.')
    setTimeout(() => setSaveStatus(''), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <SettingsIcon className="h-6 w-6 text-primary-500" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Settings
            </h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Update your family profile, preferences, and notification settings.
          </p>
        </div>
        <button className="btn-primary" onClick={handleSave}>
          Save changes
        </button>
      </div>
      {saveStatus && (
        <p className="text-sm text-success-600 dark:text-success-400">{saveStatus}</p>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-primary-500" />
              <h3 className="text-lg font-semibold">Profile Settings</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Full name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(event) =>
                    setProfile((prev) => ({ ...prev, name: event.target.value }))
                  }
                  className="input-field mt-1"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Role</label>
                <input
                  type="text"
                  value={profile.role}
                  onChange={(event) =>
                    setProfile((prev) => ({ ...prev, role: event.target.value }))
                  }
                  className="input-field mt-1"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Email</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(event) =>
                    setProfile((prev) => ({ ...prev, email: event.target.value }))
                  }
                  className="input-field mt-1"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Phone</label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(event) =>
                    setProfile((prev) => ({ ...prev, phone: event.target.value }))
                  }
                  className="input-field mt-1"
                />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="h-5 w-5 text-primary-500" />
              <h3 className="text-lg font-semibold">Notification Preferences</h3>
            </div>
            <div className="space-y-4">
              {notificationPrefs.map((pref) => (
                <div
                  key={pref.id}
                  className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {pref.label}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {pref.description}
                    </p>
                  </div>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={pref.enabled}
                      onChange={(event) =>
                        setNotificationPrefs((prev) =>
                          prev.map((item) =>
                            item.id === pref.id
                              ? { ...item, enabled: event.target.checked }
                              : item
                          )
                        )
                      }
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer dark:bg-gray-700 peer-checked:bg-primary-600 relative transition">
                      <div className="absolute top-0.5 left-0.5 h-5 w-5 bg-white rounded-full transition peer-checked:translate-x-5"></div>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="h-5 w-5 text-primary-500" />
              <h3 className="text-lg font-semibold">Security</h3>
            </div>
            <div className="space-y-4">
              <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Multi-factor authentication
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Add an extra layer of protection to your account
                    </p>
                  </div>
                  <button className="btn-secondary text-sm px-3 py-1.5">
                    Enable
                  </button>
                </div>
              </div>
              <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Password
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Last updated {passwordUpdatedLabel}
                      </p>
                  </div>
                  <button className="btn-secondary text-sm px-3 py-1.5">
                    Change password
                  </button>
                </div>
              </div>
              <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Active sessions
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {activeSessions === 0
                          ? 'No active sessions'
                          : `${activeSessions} device signed in`}
                      </p>
                  </div>
                  <button className="btn-secondary text-sm px-3 py-1.5">
                    Manage
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="h-5 w-5 text-primary-500" />
              <h3 className="text-lg font-semibold">Preferences</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Language</label>
                <select
                  className="input-field mt-1"
                  value={preferences.language}
                  onChange={(event) =>
                    setPreferences((prev) => ({ ...prev, language: event.target.value }))
                  }
                >
                  <option>English (US)</option>
                  <option>English (UK)</option>
                  <option>Spanish</option>
                  <option>French</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Timezone</label>
                <select
                  className="input-field mt-1"
                  value={preferences.timezone}
                  onChange={(event) =>
                    setPreferences((prev) => ({ ...prev, timezone: event.target.value }))
                  }
                >
                  <option>America/Los_Angeles</option>
                  <option>America/New_York</option>
                  <option>America/Chicago</option>
                  <option>America/Denver</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Date format</label>
                <select
                  className="input-field mt-1"
                  value={preferences.dateFormat}
                  onChange={(event) =>
                    setPreferences((prev) => ({ ...prev, dateFormat: event.target.value }))
                  }
                >
                  <option>MM/DD/YYYY</option>
                  <option>DD/MM/YYYY</option>
                  <option>YYYY/MM/DD</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Default dashboard</label>
                <select
                  className="input-field mt-1"
                  value={preferences.defaultDashboard}
                  onChange={(event) =>
                    setPreferences((prev) => ({ ...prev, defaultDashboard: event.target.value }))
                  }
                >
                  <option>Family Overview</option>
                  <option>Attendance</option>
                  <option>Fees</option>
                  <option>Results</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="h-5 w-5 text-success-500" />
              <h3 className="text-lg font-semibold">Access Summary</h3>
            </div>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center justify-between">
                <span>Role</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {profile.role || 'Parent'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Linked Students</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {linkedDetails.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Attendance Records</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {attendanceCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Results</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {resultsCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Payments</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {paymentsCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Documents</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {documentsCount}
                </span>
              </div>
              <button className="w-full mt-3 text-sm btn-secondary py-2">
                View access logs
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
