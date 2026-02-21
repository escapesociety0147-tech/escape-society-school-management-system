'use client'

import { useMemo, useState } from 'react'
import {
  Calendar,
  Mail,
  MapPin,
  Phone,
  User,
  Users,
} from 'lucide-react'
import { useLocalStorageState } from '@/lib/useLocalStorage'
import { seedStudents } from '@/lib/seedData'
import { initialEvents, type SchoolEvent } from '@/lib/eventsData'
import { initialSchoolProfile } from '@/lib/schoolData'

export default function ParentProfilePage() {
  const [message, setMessage] = useState('')
  const [profile] = useLocalStorageState('esm_parent_profile', {
    name: '',
    role: '',
    email: '',
    phone: '',
    parentId: '',
    schoolId: '',
  })
  const [schoolProfile] = useLocalStorageState('esm_school_profile', initialSchoolProfile)
  const [students] = useLocalStorageState('esm_students', seedStudents)
  const [linkedStudents] = useLocalStorageState<number[]>(
    'esm_parent_links',
    []
  )
  const [parents] = useLocalStorageState('esm_parents', [])
  const [events] = useLocalStorageState<SchoolEvent[]>('esm_events', initialEvents)

  const parentRecord = useMemo(() => {
    if (!profile.parentId && !profile.email) return null
    return parents.find((parent: { parentId?: string; email?: string }) => {
      if (profile.parentId && String(parent.parentId) === String(profile.parentId)) return true
      if (profile.email && String(parent.email || '').toLowerCase() === profile.email.toLowerCase()) return true
      return false
    })
  }, [parents, profile.email, profile.parentId])

  const linkedIds =
    linkedStudents.length > 0
      ? linkedStudents
      : (parentRecord?.linkedStudentIds as number[] | undefined) || []
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
  const linkedDetails = schoolStudents.filter((student) => linkedIds.includes(student.id))
  const upcomingEvents = useMemo(() => {
    return [...events].slice(0, 3)
  }, [events])
  const tenureYears = useMemo(() => {
    if (!parentRecord?.createdAt) return 0
    const started = new Date(parentRecord.createdAt)
    const now = new Date()
    const years = now.getFullYear() - started.getFullYear()
    const hasNotReachedAnniversary =
      now.getMonth() < started.getMonth() ||
      (now.getMonth() === started.getMonth() && now.getDate() < started.getDate())
    return Math.max(0, years - (hasNotReachedAnniversary ? 1 : 0))
  }, [parentRecord])
  const portalStatus = linkedDetails.length > 0 ? 'Active' : 'Pending'

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
          <button className="btn-primary" onClick={() => handleAction('Family ID downloaded.')}>
            Download Family ID
          </button>
        </div>
      </div>
      {message && (
        <p className="text-sm text-success-600 dark:text-success-400">{message}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Linked Children</h3>
            <Users className="h-5 w-5 text-primary-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{linkedDetails.length}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Active student profiles
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Family Since</h3>
            <Calendar className="h-5 w-5 text-primary-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {tenureYears}y
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {parentRecord?.createdAt
              ? `Joined ${new Date(parentRecord.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  year: 'numeric',
                })}`
              : 'Join date not set'}
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Preferred Contact</h3>
            <Phone className="h-5 w-5 text-success-500" />
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{profile.phone}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Mobile
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Portal Status</h3>
            <Users className="h-5 w-5 text-warning-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{portalStatus}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {linkedDetails.length > 0 ? 'Linked to students' : 'Awaiting student link'}
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
                  <span className="text-sm font-medium">Parent ID</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {parentRecord?.parentId || profile.parentId || 'Not set'}
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
            <h3 className="text-lg font-semibold mb-4">Linked Children</h3>
            <div className="space-y-3">
              {linkedDetails.map((child) => (
                <div
                  key={child.id}
                  className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <p className="font-medium text-gray-900 dark:text-white">
                    {child.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {child.grade} {child.section} - Roll {child.rollNumber}
                  </p>
                </div>
              ))}
              {linkedDetails.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No linked students yet.
                </p>
              )}
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full btn-secondary py-2">
                Update contact info
              </button>
              <button className="w-full btn-secondary py-2">
                Request meeting
              </button>
              <button className="w-full btn-primary py-2">
                Send feedback
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
