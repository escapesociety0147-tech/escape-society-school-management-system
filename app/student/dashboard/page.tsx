'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { CalendarCheck, CreditCard, FileText, MessageSquare, BookOpen, Calendar } from 'lucide-react'
import StatsCard from '@/components/dashboard/StatsCard'
import { useLocalStorageState } from '@/lib/useLocalStorage'
import { seedStudents } from '@/lib/seedData'
import { initialAttendanceHistory } from '@/lib/attendanceData'
import { initialResults } from '@/lib/resultsData'
import { initialDocuments } from '@/lib/documentsData'
import { initialPayments } from '@/lib/paymentsData'
import { initialEvents, type SchoolEvent } from '@/lib/eventsData'
import { initialMessageThreads } from '@/lib/messagesData'
import { initialStudentProfile } from '@/lib/studentData'

export default function StudentDashboardPage() {
  const [profile] = useLocalStorageState('esm_student_profile', initialStudentProfile)
  const [students] = useLocalStorageState('esm_students', seedStudents)
  const [attendanceHistory] = useLocalStorageState(
    'esm_attendance_history',
    initialAttendanceHistory
  )
  const [payments] = useLocalStorageState('esm_payments', initialPayments)
  const [results] = useLocalStorageState('esm_results', initialResults)
  const [documents] = useLocalStorageState('esm_documents', initialDocuments)
  const [documentReads] = useLocalStorageState<Record<number, 'Read' | 'Unread'>>(
    'esm_student_document_reads',
    {}
  )
  const [events] = useLocalStorageState<SchoolEvent[]>('esm_events', initialEvents)
  const [threads] = useLocalStorageState('esm_message_threads', initialMessageThreads)

  const studentRecord =
    students.find(
      (student) =>
        student.id === profile.id || student.rollNumber === profile.rollNumber
    ) || {
      id: profile.id,
      rollNumber: profile.rollNumber,
      name: profile.name,
      grade: profile.grade,
      section: profile.section,
      contact: profile.phone,
      status: 'Active',
    }

  const studentId = Number(studentRecord.id || profile.id)
  const studentRoll = studentRecord.rollNumber || profile.rollNumber
  const now = new Date()
  const currentMonth = now.toISOString().slice(0, 7)
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    .toISOString()
    .slice(0, 7)

  const attendanceStats = useMemo(() => {
    let present = 0
    let total = 0
    const records = attendanceHistory.filter(
      (record) =>
        record.grade === studentRecord.grade &&
        record.section === studentRecord.section &&
        record.attendance?.[studentId]
    )
    records.forEach((record) => {
      total += 1
      const status = record.attendance?.[studentId]
      if (!status) return
      if (status !== 'absent') present += 1
    })
    const rate = total ? Math.round((present / total) * 100) : 0
    return { present, total, rate }
  }, [attendanceHistory, studentRecord.grade, studentRecord.section, studentId])

  const attendanceSorted = useMemo(
    () =>
      [...attendanceHistory]
        .filter(
          (record) =>
            record.grade === studentRecord.grade &&
            record.section === studentRecord.section &&
            record.attendance?.[studentId]
        )
        .sort((a, b) => b.dateISO.localeCompare(a.dateISO)),
    [attendanceHistory, studentRecord.grade, studentRecord.section, studentId]
  )

  const calculateRate = (records: typeof attendanceSorted) => {
    if (!records.length) return 0
    let present = 0
    records.forEach((record) => {
      const status = record.attendance?.[studentId]
      if (!status) return
      if (status !== 'absent') present += 1
    })
    return Math.round((present / records.length) * 100)
  }

  const attendanceDelta = useMemo(() => {
    const recent = attendanceSorted.slice(0, 5)
    const previous = attendanceSorted.slice(5, 10)
    const recentRate = calculateRate(recent)
    const previousRate = calculateRate(previous)
    return recentRate - previousRate
  }, [attendanceSorted, studentId])

  const studentResults = results.filter((result) => result.rollNo === studentRoll)
  const averageScore =
    studentResults.reduce((sum, result) => sum + result.percentage, 0) /
    (studentResults.length || 1)

  const scoreDelta = useMemo(() => {
    const sorted = [...studentResults].sort((a, b) => b.id - a.id)
    const recent = sorted.slice(0, 3)
    const previous = sorted.slice(3, 6)
    const recentAvg =
      recent.reduce((sum, result) => sum + result.percentage, 0) / (recent.length || 1)
    const previousAvg =
      previous.reduce((sum, result) => sum + result.percentage, 0) / (previous.length || 1)
    return Number((recentAvg - previousAvg).toFixed(1))
  }, [studentResults])

  const studentPayments = payments.filter((payment) => payment.rollNo === studentRoll)
  const outstandingFees = studentPayments.reduce((sum, payment) => sum + payment.balanceDue, 0)
  const outstandingThisMonth = studentPayments
    .filter((payment) => payment.lastPayment.startsWith(currentMonth))
    .reduce((sum, payment) => sum + payment.balanceDue, 0)
  const outstandingPrevMonth = studentPayments
    .filter((payment) => payment.lastPayment.startsWith(previousMonth))
    .reduce((sum, payment) => sum + payment.balanceDue, 0)
  const outstandingDelta = Number((outstandingThisMonth - outstandingPrevMonth).toFixed(0))

  const studentThreads = threads.filter((thread) =>
    thread.participants.some((participant) => participant.role === 'student')
  )
  const unreadMessages = studentThreads.reduce(
    (sum, thread) => sum + (thread.unreadBy?.student ?? 0),
    0
  )

  const unreadDocuments = documents.filter(
    (doc) => (documentReads[doc.id] || 'Unread') === 'Unread'
  ).length

  const recentAttendance = [...attendanceHistory]
    .filter(
      (record) =>
        record.grade === studentRecord.grade &&
        record.section === studentRecord.section &&
        record.attendance?.[studentId]
    )
    .sort((a, b) => b.dateISO.localeCompare(a.dateISO))
    .slice(0, 3)

  const latestResults = [...studentResults].slice(0, 2)
  const upcomingEvents = [...events].slice(0, 3)
  const upcomingPayments = studentPayments
    .filter((payment) => payment.status !== 'Paid')
    .sort((a, b) => a.lastPayment.localeCompare(b.lastPayment))
    .slice(0, 2)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome, {studentRecord.name}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Track your attendance, grades, fees, and school updates in real time.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatsCard
          title="Attendance Rate"
          value={`${attendanceStats.rate}%`}
          change={`${attendanceDelta >= 0 ? '+' : ''}${attendanceDelta}%`}
          trend={attendanceDelta >= 0 ? 'up' : 'down'}
          icon={CalendarCheck}
          color="emerald"
          description={`${attendanceStats.present}/${attendanceStats.total} sessions`}
        />
        <StatsCard
          title="Average Score"
          value={`${averageScore.toFixed(1)}%`}
          change={`${scoreDelta >= 0 ? '+' : ''}${scoreDelta}%`}
          trend={scoreDelta >= 0 ? 'up' : 'down'}
          icon={BookOpen}
          color="blue"
          description={`${studentResults.length} results`}
        />
        <StatsCard
          title="Outstanding Fees"
          value={`$${outstandingFees}`}
          change={`${outstandingDelta >= 0 ? '+' : ''}${outstandingDelta}`}
          trend={outstandingDelta <= 0 ? 'down' : 'up'}
          icon={CreditCard}
          color="amber"
          description={`${studentPayments.length} records`}
        />
        <StatsCard
          title="Unread Messages"
          value={`${unreadMessages}`}
          change={`+${unreadMessages}`}
          trend={unreadMessages >= 0 ? 'up' : 'down'}
          icon={MessageSquare}
          color="purple"
          description={`${unreadDocuments} docs unread`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Upcoming Payments
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Keep an eye on your next due fees.
              </p>
            </div>
            <Link href="/student/fees" className="btn-secondary text-sm px-3 py-2">
              Manage Fees
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingPayments.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                All payments are settled. Great work!
              </p>
            ) : (
              upcomingPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-4"
                >
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {payment.term} - {payment.year}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Balance ${payment.balanceDue} | Last payment {payment.lastPayment}
                    </p>
                  </div>
                  <span className="text-sm text-warning-600 dark:text-warning-400">
                    {payment.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Quick Links
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Jump to updates.
              </p>
            </div>
            <FileText className="h-5 w-5 text-primary-500" />
          </div>
          <div className="space-y-3">
            <Link href="/student/attendance" className="btn-primary w-full justify-center">
              View Attendance
            </Link>
            <Link href="/student/results" className="btn-secondary w-full justify-center">
              View Results
            </Link>
            <Link href="/student/documents" className="btn-secondary w-full justify-center">
              Open Documents
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
                Latest attendance sessions from your classes.
              </p>
            </div>
            <Link
              href="/student/attendance"
              className="text-sm text-primary-600 hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {recentAttendance.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No attendance records yet.
              </p>
            ) : (
              recentAttendance.map((record) => {
                const status = record.attendance?.[studentId] as 'present' | 'absent'
                return (
                  <div
                    key={record.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-4"
                  >
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {record.date}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {record.grade} {record.section}
                      </p>
                    </div>
                    <span
                      className={`text-sm ${
                        status === 'absent'
                          ? 'text-error-600 dark:text-error-400'
                          : 'text-success-600 dark:text-success-400'
                      }`}
                    >
                      {status}
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
                Latest Results
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Recent assessment highlights.
              </p>
            </div>
            <BookOpen className="h-5 w-5 text-primary-500" />
          </div>
          <div className="space-y-3">
            {latestResults.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Results will appear here after grading.
              </p>
            ) : (
              latestResults.map((result) => (
                <div
                  key={result.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-4"
                >
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {result.classGrade} {result.section}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Total {result.total} | {result.remarks}
                    </p>
                  </div>
                  <span className="text-sm text-primary-600 dark:text-primary-400">
                    {result.grade} ({result.percentage}%)
                  </span>
                </div>
              ))
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
              Stay synced with the school calendar.
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
                <p className="font-semibold text-gray-900 dark:text-white">{event.title}</p>
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
