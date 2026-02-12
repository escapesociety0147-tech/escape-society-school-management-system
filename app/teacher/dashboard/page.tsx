'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { BookOpen, CalendarCheck, ClipboardList, FileCheck, Users, Calendar } from 'lucide-react'
import StatsCard from '@/components/dashboard/StatsCard'
import { useLocalStorageState } from '@/lib/useLocalStorage'
import {
  initialTeacherAssignments,
  initialTeacherClasses,
  TeacherAssignment,
  TeacherClass,
} from '@/lib/portalData'
import { initialAttendanceHistory } from '@/lib/attendanceData'
import { initialEvents, type SchoolEvent } from '@/lib/eventsData'
import { seedStudents } from '@/lib/seedData'

type FocusItem = {
  id: number
  label: string
  status: 'Pending' | 'In progress' | 'Done'
}

export default function TeacherDashboardPage() {
  const [profile] = useLocalStorageState('esm_teacher_profile', {
    name: '',
    role: '',
    email: '',
    phone: '',
  })
  const [classes] = useLocalStorageState<TeacherClass[]>(
    'esm_teacher_classes',
    initialTeacherClasses
  )
  const [assignments] = useLocalStorageState<TeacherAssignment[]>(
    'esm_teacher_assignments',
    initialTeacherAssignments
  )
  const [attendanceHistory] = useLocalStorageState(
    'esm_attendance_history',
    initialAttendanceHistory
  )
  const [events] = useLocalStorageState<SchoolEvent[]>('esm_events', initialEvents)
  const [students] = useLocalStorageState('esm_students', seedStudents)
  const [focusItems, setFocusItems] = useLocalStorageState<FocusItem[]>(
    'esm_teacher_focus',
    []
  )
  const [focusDraft, setFocusDraft] = useState('')

  const rosterCount = useMemo(() => {
    if (!classes.length) return 0
    return students.filter((student) =>
      classes.some(
        (item) => item.grade === student.grade && item.section === student.section
      )
    ).length
  }, [classes, students])
  const openAssignments = assignments.filter((item) => item.status === 'Open')
  const now = new Date()
  const currentMonth = now.toISOString().slice(0, 7)
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(now.getDate() - 7)
  const fourteenDaysAgo = new Date(now)
  fourteenDaysAgo.setDate(now.getDate() - 14)

  const newClassesThisMonth = classes.filter((item) =>
    item.createdAt?.startsWith(currentMonth)
  ).length
  const newStudentSlotsThisMonth = students.filter((student) => {
    if (!student.createdAt) return false
    if (!student.createdAt.startsWith(currentMonth)) return false
    return classes.some(
      (item) => item.grade === student.grade && item.section === student.section
    )
  }).length
  const newAssignmentsThisWeek = assignments.filter((item) => {
    if (!item.createdAt) return false
    const created = new Date(item.createdAt)
    return created >= sevenDaysAgo
  }).length

  const attendanceRate = useMemo(() => {
    if (!attendanceHistory.length) return 0
    const relevant = attendanceHistory.filter((record) =>
      classes.some(
        (item) => item.grade === record.grade && item.section === record.section
      ) && new Date(record.dateISO) >= sevenDaysAgo
    )
    const totals = relevant.reduce(
      (acc, record) => {
        acc.present += record.present
        acc.total += record.present + record.absent
        return acc
      },
      { present: 0, total: 0 }
    )
    return totals.total ? Math.round((totals.present / totals.total) * 100) : 0
  }, [attendanceHistory, classes, sevenDaysAgo])

  const attendanceRatePrev = useMemo(() => {
    const relevant = attendanceHistory.filter((record) => {
      const recordDate = new Date(record.dateISO)
      if (Number.isNaN(recordDate.getTime())) return false
      const isRelevantClass = classes.some(
        (item) => item.grade === record.grade && item.section === record.section
      )
      return isRelevantClass && recordDate < sevenDaysAgo && recordDate >= fourteenDaysAgo
    })
    if (!relevant.length) return 0
    const totals = relevant.reduce(
      (acc, record) => {
        acc.present += record.present
        acc.total += record.present + record.absent
        return acc
      },
      { present: 0, total: 0 }
    )
    return totals.total ? Math.round((totals.present / totals.total) * 100) : 0
  }, [attendanceHistory, classes, fourteenDaysAgo, sevenDaysAgo])
  const attendanceDelta = attendanceRate - attendanceRatePrev

  const upcomingAssignments = [...openAssignments]
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 3)

  const recentAttendance = attendanceHistory
    .filter((record) =>
      classes.some(
        (item) => item.grade === record.grade && item.section === record.section
      )
    )
    .slice(0, 3)
  const upcomingEvents = [...events].slice(0, 3)

  const handleAddFocus = () => {
    if (!focusDraft.trim()) return
    setFocusItems((prev) => [
      { id: Date.now(), label: focusDraft.trim(), status: 'Pending' },
      ...prev,
    ])
    setFocusDraft('')
  }

  const handleToggleFocus = (id: number) => {
    const statusOrder: FocusItem['status'][] = ['Pending', 'In progress', 'Done']
    setFocusItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        const nextIndex = (statusOrder.indexOf(item.status) + 1) % statusOrder.length
        return { ...item, status: statusOrder[nextIndex] }
      })
    )
  }

  const handleRemoveFocus = (id: number) => {
    setFocusItems((prev) => prev.filter((item) => item.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back, {profile.name}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Here is your live teaching overview for the week.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatsCard
          title="My Classes"
          value={`${classes.length}`}
          change={`+${newClassesThisMonth}`}
          trend="up"
          icon={BookOpen}
          color="blue"
          description={newClassesThisMonth ? `${newClassesThisMonth} new this month` : 'Active sections'}
        />
        <StatsCard
          title="Students"
          value={`${rosterCount}`}
          change={`+${newStudentSlotsThisMonth}`}
          trend="up"
          icon={Users}
          color="emerald"
          description={newStudentSlotsThisMonth ? 'New this month' : 'Across your roster'}
        />
        <StatsCard
          title="Attendance Rate"
          value={`${attendanceRate}%`}
          change={`${attendanceDelta >= 0 ? '+' : ''}${attendanceDelta.toFixed(1)}%`}
          trend={attendanceDelta >= 0 ? 'up' : 'down'}
          icon={CalendarCheck}
          color="amber"
          description="Last 7 days"
        />
        <StatsCard
          title="Open Assignments"
          value={`${openAssignments.length}`}
          change={`+${newAssignmentsThisWeek}`}
          trend="up"
          icon={FileCheck}
          color="purple"
          description={newAssignmentsThisWeek ? 'New this week' : 'Pending grading'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Upcoming Assignments
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Track what needs grading or feedback next.
              </p>
            </div>
            <Link href="/teacher/assignments" className="btn-secondary text-sm px-3 py-2">
              Manage
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingAssignments.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                All caught up! Create a new assignment to get started.
              </p>
            ) : (
              upcomingAssignments.map((assignment) => {
                const classInfo = classes.find((item) => item.id === assignment.classId)
                const label = classInfo
                  ? `${classInfo.grade} ${classInfo.section} - ${classInfo.subject}`
                  : 'Class'
                return (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-4"
                  >
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {assignment.title}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {label} | Due {assignment.dueDate}
                      </p>
                    </div>
                    <span className="text-sm text-primary-600 dark:text-primary-400">
                      {assignment.submissions}/{assignment.total} submitted
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Quick Actions
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Jump into your day.
              </p>
            </div>
            <ClipboardList className="h-5 w-5 text-primary-500" />
          </div>
          <div className="space-y-3">
            <Link href="/teacher/attendance" className="btn-primary w-full justify-center">
              Take Attendance
            </Link>
            <Link href="/teacher/gradebook" className="btn-secondary w-full justify-center">
              Update Grades
            </Link>
            <Link href="/teacher/classes" className="btn-secondary w-full justify-center">
              View Classes
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Attendance
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Snapshots from your latest sessions.
              </p>
            </div>
            <Link href="/teacher/attendance" className="text-sm text-primary-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {recentAttendance.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No attendance records yet. Start your first session.
              </p>
            ) : (
              recentAttendance.map((record) => {
                const label = `${record.grade} ${record.section}`
                return (
                  <div
                    key={record.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-4"
                  >
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {label}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {record.date} {record.note ? `| ${record.note}` : ''}
                      </p>
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {record.present} present / {record.absent} absent
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Weekly Focus
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Keep momentum with short goals.
              </p>
            </div>
            <FileCheck className="h-5 w-5 text-success-500" />
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <input
                className="input-field flex-1"
                placeholder="Add a weekly focus item"
                value={focusDraft}
                onChange={(event) => setFocusDraft(event.target.value)}
              />
              <button className="btn-secondary" type="button" onClick={handleAddFocus}>
                Add
              </button>
            </div>
            {focusItems.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No focus items yet.
              </p>
            ) : (
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                {focusItems.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-2 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2"
                  >
                    <span>{item.label}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          item.status === 'Done'
                            ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300'
                            : item.status === 'In progress'
                            ? 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                        }`}
                        onClick={() => handleToggleFocus(item.id)}
                      >
                        {item.status}
                      </button>
                      <button
                        type="button"
                        className="text-xs text-error-600 dark:text-error-400"
                        onClick={() => handleRemoveFocus(item.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Upcoming Events
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Synced from the school events calendar.
            </p>
          </div>
          <Calendar className="h-5 w-5 text-primary-500" />
        </div>
        <div className="space-y-3">
          {upcomingEvents.map((event) => (
            <div
              key={event.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-4"
            >
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {event.title}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {event.date} | {event.location}
                </p>
              </div>
              <span className="text-sm text-primary-600 dark:text-primary-400">
                {event.type}
              </span>
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
  )
}
