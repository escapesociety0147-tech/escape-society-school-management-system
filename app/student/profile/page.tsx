'use client'

import { useMemo, useState } from 'react'
import { Calendar, Mail, MapPin, Phone, User, BookOpen } from 'lucide-react'
import { useLocalStorageState } from '@/lib/useLocalStorage'
import { initialStudentProfile } from '@/lib/studentData'
import { initialSchoolProfile } from '@/lib/schoolData'
import { initialEvents, type SchoolEvent } from '@/lib/eventsData'
import { initialResults } from '@/lib/resultsData'

export default function StudentProfilePage() {
  const [message, setMessage] = useState('')
  const [profile] = useLocalStorageState('esm_student_profile', initialStudentProfile)
  const [schoolProfile] = useLocalStorageState('esm_school_profile', initialSchoolProfile)
  const [events] = useLocalStorageState<SchoolEvent[]>('esm_events', initialEvents)
  const [results] = useLocalStorageState('esm_results', initialResults)

  const now = new Date()
  const academicYearStart = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1
  const academicYearLabel = `${academicYearStart}-${academicYearStart + 1}`

  const upcomingEvents = useMemo(() => [...events].slice(0, 3), [events])
  const recentResults = useMemo(
    () => results.filter((result) => result.rollNo === profile.rollNumber).slice(0, 3),
    [results, profile.rollNumber]
  )

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
              Student - {schoolProfile.name}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="btn-secondary" onClick={() => handleAction('Profile editor opened.')}>
            Edit profile
          </button>
          <button className="btn-primary" onClick={() => handleAction('Student ID downloaded.')}>
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
            <h3 className="text-lg font-semibold">Grade</h3>
            <BookOpen className="h-5 w-5 text-primary-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{profile.grade}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Section {profile.section}
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Roll Number</h3>
            <Calendar className="h-5 w-5 text-primary-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{profile.rollNumber}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Active student
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Email</h3>
            <Mail className="h-5 w-5 text-success-500" />
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{profile.email}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Primary contact
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Phone</h3>
            <Phone className="h-5 w-5 text-warning-500" />
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{profile.phone}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Student contact
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
                  <User className="h-4 w-4 text-primary-500" />
                  <span className="text-sm font-medium">Student ID</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {profile.studentId || 'Not assigned'}
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
                  <span className="text-sm font-medium">Campus</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {schoolProfile.address}, {schoolProfile.city}
                </p>
              </div>
              <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <Calendar className="h-4 w-4 text-primary-500" />
                  <span className="text-sm font-medium">Academic Year</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {academicYearLabel}
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
            <h3 className="text-lg font-semibold mb-4">Recent Results</h3>
            <div className="space-y-3">
              {recentResults.map((result) => (
                <div
                  key={result.id}
                  className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <p className="font-medium text-gray-900 dark:text-white">
                    {result.classGrade} {result.section}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {result.grade} - {result.percentage}% ({result.remarks})
                  </p>
                </div>
              ))}
              {recentResults.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Results will appear after grading.
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
                Message a teacher
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
