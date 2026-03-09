'use client'

import { useMemo, useState } from 'react'
import {
  BookOpen,
  Calendar,
  Mail,
  MapPin,
  Phone,
  Shield,
  User,
  Users,
} from 'lucide-react'
import { useLocalStorageState } from '@/lib/useLocalStorage'
import { initialTeacherClasses, TeacherClass } from '@/lib/portalData'
import { initialEvents, type SchoolEvent } from '@/lib/eventsData'
import { initialSchoolProfile } from '@/lib/schoolData'
import { initialAttendanceHistory } from '@/lib/attendanceData'
import { seedStudents } from '@/lib/seedData'
import type { AuthUser } from '@/lib/authStore'
import { normalizeEmail } from '@/lib/authStore'

export default function TeacherProfilePage() {
  const [message, setMessage] = useState('')
  const [profile] = useLocalStorageState('esm_teacher_profile', {
    name: '',
    role: '',
    email: '',
    phone: '',
  })
  const [schoolProfile] = useLocalStorageState('esm_school_profile', initialSchoolProfile)
  const [classes] = useLocalStorageState<TeacherClass[]>(
    'esm_teacher_classes',
    initialTeacherClasses
  )
  const [events] = useLocalStorageState<SchoolEvent[]>('esm_events', initialEvents)
  const [attendanceHistory] = useLocalStorageState(
    'esm_attendance_history',
    initialAttendanceHistory
  )
  const [students] = useLocalStorageState('esm_students', seedStudents)
  const [users] = useLocalStorageState<AuthUser[]>('esm_users', [])

  const upcomingEvents = useMemo(() => {
    return [...events].slice(0, 3)
  }, [events])

  const rosterCount = useMemo(() => {
    if (!classes.length) return 0
    return students.filter((student) =>
      classes.some(
        (item) => item.grade === student.grade && item.section === student.section
      )
    ).length
  }, [classes, students])

  const teacherUser = useMemo(
    () =>
      users.find(
        (user) => normalizeEmail(user.email) === normalizeEmail(profile.email)
      ),
    [users, profile.email]
  )
  const tenureYears = useMemo(() => {
    if (!teacherUser?.createdAt) return 0
    const started = new Date(teacherUser.createdAt)
    const now = new Date()
    const years = now.getFullYear() - started.getFullYear()
    const hasNotReachedAnniversary =
      now.getMonth() < started.getMonth() ||
      (now.getMonth() === started.getMonth() && now.getDate() < started.getDate())
    return Math.max(0, years - (hasNotReachedAnniversary ? 1 : 0))
  }, [teacherUser])

  const recentActivity = useMemo(() => {
    return attendanceHistory
      .filter((record) =>
        classes.some(
          (item) => item.grade === record.grade && item.section === record.section
        )
      )
      .slice(0, 3)
  }, [attendanceHistory, classes])

  const handleAction = (text: string) => {
    setMessage(text)
    setTimeout(() => setMessage(''), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <User className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {profile.name}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {profile.role} - {schoolProfile.name}
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
            <h3 className="text-lg font-semibold">Classes</h3>
            <BookOpen className="h-5 w-5 text-primary-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{classes.length}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Active sections
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Students</h3>
            <Users className="h-5 w-5 text-primary-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{rosterCount}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Across your assigned classes
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Tenure</h3>
            <Calendar className="h-5 w-5 text-success-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{tenureYears}y</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {teacherUser?.createdAt
              ? `Joined ${new Date(teacherUser.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  year: 'numeric',
                })}`
              : 'Join date not set'}
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Access Level</h3>
            <Shield className="h-5 w-5 text-warning-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">Teacher</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Classroom privileges
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
                    <span className="text-sm font-medium">School ID</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {schoolProfile.schoolId || 'Not set'}
                  </p>
                </div>
              </div>
            </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Upcoming Events</h3>
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <p className="font-medium text-gray-900 dark:text-white">
                    {event.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {event.date} - {event.location}
                  </p>
                </div>
              ))}
              {upcomingEvents.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No upcoming events scheduled.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {recentActivity.length === 0 ? (
                <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400">
                  No recent activity yet.
                </div>
              ) : (
                recentActivity.map((record) => (
                  <div
                    key={record.id}
                    className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <p className="font-medium text-gray-900 dark:text-white">
                      Attendance marked for {record.grade} {record.section}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {record.date}
                    </p>
                  </div>
                ))
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
  )
}
