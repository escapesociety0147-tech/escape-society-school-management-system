'use client'

import { useMemo, useState } from 'react'
import DashboardShell from '@/components/dashboard/layout/DashboardShell'
import {
  Calendar,
  Mail,
  MapPin,
  Phone,
  Shield,
  User,
} from 'lucide-react'
import { useLocalStorageState } from '@/lib/useLocalStorage'
import { initialSchoolProfile } from '@/lib/schoolData'
import { seedStudents } from '@/lib/seedData'
import { initialAttendanceHistory } from '@/lib/attendanceData'
import { initialResults } from '@/lib/resultsData'
import { initialPayments } from '@/lib/paymentsData'
import { initialDocuments } from '@/lib/documentsData'
import { initialEvents } from '@/lib/eventsData'
import { initialMessageThreads } from '@/lib/messagesData'
import type { AuthUser } from '@/lib/authStore'
import { normalizeEmail } from '@/lib/authStore'

const activities: Array<{ title: string; time: string }> = []

export default function ProfilePage() {
  const [message, setMessage] = useState('')
  const [profile] = useLocalStorageState('esm_profile', {
    name: '',
    role: '',
    email: '',
    phone: '',
  })
  const [schoolProfile] = useLocalStorageState('esm_school_profile', initialSchoolProfile)
  const [students] = useLocalStorageState('esm_students', seedStudents)
  const [teachers] = useLocalStorageState('esm_teachers', [])
  const [parents] = useLocalStorageState('esm_parents', [])
  const [attendanceHistory] = useLocalStorageState(
    'esm_attendance_history',
    initialAttendanceHistory
  )
  const [results] = useLocalStorageState('esm_results', initialResults)
  const [payments] = useLocalStorageState('esm_payments', initialPayments)
  const [documents] = useLocalStorageState('esm_documents', initialDocuments)
  const [events] = useLocalStorageState('esm_events', initialEvents)
  const [threads] = useLocalStorageState('esm_message_threads', initialMessageThreads)
  const [users] = useLocalStorageState<AuthUser[]>('esm_users', [])
  const [preferences] = useLocalStorageState('esm_preferences', {
    language: 'English (US)',
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    defaultDashboard: 'Overview',
  })

  const adminUser = useMemo(
    () =>
      users.find(
        (user) => normalizeEmail(user.email) === normalizeEmail(profile.email)
      ),
    [users, profile.email]
  )
  const tenureYears = useMemo(() => {
    if (!adminUser?.createdAt) return 0
    const started = new Date(adminUser.createdAt)
    const now = new Date()
    const years = now.getFullYear() - started.getFullYear()
    const hasNotReachedAnniversary =
      now.getMonth() < started.getMonth() ||
      (now.getMonth() === started.getMonth() && now.getDate() < started.getDate())
    return Math.max(0, years - (hasNotReachedAnniversary ? 1 : 0))
  }, [adminUser])

  const moduleCounts = {
    Students: students.length,
    Teachers: teachers.length,
    Parents: parents.length,
    Attendance: attendanceHistory.length,
    Results: results.length,
    Fees: payments.length,
    Documents: documents.length,
    Events: events.length,
    Messages: threads.length,
  }
  const activeModules = Object.values(moduleCounts).filter((count) => count > 0).length
  const managedRecords = students.length + teachers.length + parents.length
  const responsibilities = Object.entries(moduleCounts)
    .filter(([, count]) => count > 0)
    .map(([label, count]) => `Manage ${count} ${label.toLowerCase()} records`)

  const handleAction = (text: string) => {
    setMessage(text)
    setTimeout(() => setMessage(''), 2000)
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <User className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {profile.name || 'Profile'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {profile.role || 'Role'} - {schoolProfile.name || 'School'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="btn-secondary" onClick={() => handleAction('Profile editor opened.')}>
              Edit profile
            </button>
            <button className="btn-primary" onClick={() => handleAction('ID card downloaded.')}>
              Download ID
            </button>
          </div>
        </div>
        {message && (
          <p className="text-sm text-success-600 dark:text-success-400">{message}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Tenure</h3>
              <Calendar className="h-5 w-5 text-primary-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {tenureYears}y
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {adminUser?.createdAt
                ? `Joined ${new Date(adminUser.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric',
                  })}`
                : 'Join date not set'}
            </p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Active Modules</h3>
              <Shield className="h-5 w-5 text-info-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{activeModules}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {activeModules > 0 ? 'Modules with data' : 'No modules active yet'}
            </p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">School ID</h3>
              <Shield className="h-5 w-5 text-success-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {schoolProfile.schoolId || '--'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Share with staff and families
            </p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Managed Records</h3>
              <Shield className="h-5 w-5 text-warning-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {managedRecords}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Students, teachers, and parents
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Profile Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <Mail className="h-4 w-4 text-primary-500" />
                    <span className="text-sm font-medium">Email</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {profile.email}
                  </p>
                </div>
                <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <Phone className="h-4 w-4 text-primary-500" />
                    <span className="text-sm font-medium">Phone</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {profile.phone}
                  </p>
                </div>
                <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <MapPin className="h-4 w-4 text-primary-500" />
                    <span className="text-sm font-medium">School Address</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {schoolProfile.address || 'Address not set'}
                    {schoolProfile.city ? `, ${schoolProfile.city}` : ''}
                  </p>
                </div>
                <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <Calendar className="h-4 w-4 text-primary-500" />
                    <span className="text-sm font-medium">Timezone</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {preferences.timezone}
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Responsibilities</h3>
              <div className="space-y-3">
                {responsibilities.length === 0 ? (
                  <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400">
                    No responsibilities recorded yet.
                  </div>
                ) : (
                  responsibilities.map((item) => (
                    <div
                      key={item}
                      className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400"
                    >
                      {item}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {activities.map((activity) => (
                <div
                  key={activity.title}
                  className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <p className="font-medium text-gray-900 dark:text-white">
                    {activity.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {activity.time}
                  </p>
                </div>
              ))}
              {activities.length === 0 && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No recent activity yet.
                </p>
              )}
            </div>
          </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full btn-secondary py-2">
                  Request access change
                </button>
                <button className="w-full btn-secondary py-2">
                  Update availability
                </button>
                <button className="w-full btn-primary py-2">
                  Schedule 1:1 meeting
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
