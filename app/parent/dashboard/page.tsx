'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { CalendarCheck, CreditCard, FileText, MessageSquare, Users } from 'lucide-react'
import StatsCard from '@/components/dashboard/StatsCard'
import { useLocalStorageState } from '@/lib/useLocalStorage'
import { seedStudents } from '@/lib/seedData'
import { initialAttendanceHistory } from '@/lib/attendanceData'
import { initialResults } from '@/lib/resultsData'
import { initialDocuments } from '@/lib/documentsData'
import { initialPayments } from '@/lib/paymentsData'
import { initialMessageThreads } from '@/lib/messagesData'

export default function ParentDashboardPage() {
  const [profile] = useLocalStorageState('esm_parent_profile', {
    name: '',
    role: '',
    email: '',
    phone: '',
    schoolId: '',
  })
  const [students] = useLocalStorageState('esm_students', seedStudents)
  const [linkedStudents] = useLocalStorageState<number[]>(
    'esm_parent_links',
    []
  )
  const [attendanceHistory] = useLocalStorageState(
    'esm_attendance_history',
    initialAttendanceHistory
  )
  const [payments] = useLocalStorageState('esm_payments', initialPayments)
  const [results] = useLocalStorageState('esm_results', initialResults)
  const [documents] = useLocalStorageState('esm_documents', initialDocuments)
  const [documentReads] = useLocalStorageState<Record<number, 'Read' | 'Unread'>>(
    'esm_parent_document_reads',
    {}
  )
  const [threads] = useLocalStorageState('esm_message_threads', initialMessageThreads)

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
  const linkedDetails = schoolStudents.filter((student) => linkedStudents.includes(student.id))
  const linkedRolls = linkedDetails.map((student) => student.rollNumber)
  const now = new Date()
  const currentMonth = now.toISOString().slice(0, 7)
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    .toISOString()
    .slice(0, 7)
  const fourteenDaysAgo = new Date(now)
  fourteenDaysAgo.setDate(now.getDate() - 14)

  const attendanceRate = useMemo(() => {
    let present = 0
    let total = 0
    attendanceHistory.forEach((record) => {
      const recordDate = new Date(record.dateISO)
      if (Number.isNaN(recordDate.getTime()) || recordDate < fourteenDaysAgo) return
      linkedDetails.forEach((student) => {
        if (student.grade !== record.grade || student.section !== record.section) return
        const status = record.attendance?.[student.id]
        if (!status) return
        total += 1
        if (status !== 'absent') present += 1
      })
    })
    return total ? Math.round((present / total) * 100) : 0
  }, [attendanceHistory, linkedDetails, fourteenDaysAgo])

  const attendanceRatePrev = useMemo(() => {
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(now.getDate() - 7)
    const fourteenDaysAgo = new Date(now)
    fourteenDaysAgo.setDate(now.getDate() - 14)
    let present = 0
    let total = 0
    attendanceHistory.forEach((record) => {
      const recordDate = new Date(record.dateISO)
      if (Number.isNaN(recordDate.getTime())) return
      if (recordDate < fourteenDaysAgo || recordDate >= sevenDaysAgo) return
      linkedDetails.forEach((student) => {
        if (student.grade !== record.grade || student.section !== record.section) return
        const status = record.attendance?.[student.id]
        if (!status) return
        total += 1
        if (status !== 'absent') present += 1
      })
    })
    return total ? Math.round((present / total) * 100) : 0
  }, [attendanceHistory, linkedDetails, now])
  const attendanceDelta = attendanceRate - attendanceRatePrev

  const linkedPayments = payments.filter((payment) => linkedRolls.includes(payment.rollNo))
  const outstandingFees = linkedPayments.reduce((sum, payment) => sum + payment.balanceDue, 0)
  const outstandingThisMonth = linkedPayments
    .filter((payment) => payment.lastPayment.startsWith(currentMonth))
    .reduce((sum, payment) => sum + payment.balanceDue, 0)
  const outstandingPrevMonth = linkedPayments
    .filter((payment) => payment.lastPayment.startsWith(previousMonth))
    .reduce((sum, payment) => sum + payment.balanceDue, 0)
  const outstandingDelta = outstandingThisMonth - outstandingPrevMonth
  const parentThreads = useMemo(
    () =>
      threads.filter((thread) =>
        thread.participants.some((participant) => participant.role === 'parent')
      ),
    [threads]
  )
  const unreadMessages = parentThreads.reduce(
    (sum, thread) => sum + (thread.unreadBy?.parent ?? 0),
    0
  )
  const unreadDocuments = documents.filter(
    (doc) => (documentReads[doc.id] || 'Unread') === 'Unread'
  ).length

  const newLinkedThisMonth = linkedDetails.filter(
    (student) => student.createdAt?.startsWith(currentMonth)
  ).length

  const upcomingFees = [...linkedPayments]
    .filter((payment) => payment.status !== 'Paid')
    .sort((a, b) => a.lastPayment.localeCompare(b.lastPayment))
    .slice(0, 3)

  const latestResults = [...results]
    .filter((result) => linkedRolls.includes(result.rollNo))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 3)

  const recentDocs = [...documents]
    .sort((a, b) => b.updated.localeCompare(a.updated))
    .slice(0, 3)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome, {profile.name}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Track your children, fees, and school updates in one place.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatsCard
          title="Children"
          value={`${linkedDetails.length}`}
          change={`+${newLinkedThisMonth}`}
          trend="up"
          icon={Users}
          color="blue"
          description={newLinkedThisMonth ? `${newLinkedThisMonth} new this month` : 'Active profiles'}
        />
        <StatsCard
          title="Attendance Rate"
          value={`${attendanceRate}%`}
          change={`${attendanceDelta >= 0 ? '+' : ''}${attendanceDelta.toFixed(1)}%`}
          trend={attendanceDelta >= 0 ? 'up' : 'down'}
          icon={CalendarCheck}
          color="emerald"
          description="Last 14 days"
        />
        <StatsCard
          title="Outstanding Fees"
          value={`$${outstandingFees}`}
          change={`${outstandingDelta >= 0 ? '+' : ''}${outstandingDelta.toFixed(0)}`}
          trend={outstandingDelta <= 0 ? 'down' : 'up'}
          icon={CreditCard}
          color="amber"
          description="Across terms"
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
                Keep track of upcoming tuition and activity payments.
              </p>
            </div>
            <Link href="/parent/fees" className="btn-secondary text-sm px-3 py-2">
              Manage Fees
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingFees.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                All payments are settled. Nice work!
              </p>
            ) : (
              upcomingFees.map((fee) => {
                const child = linkedDetails.find((item) => item.rollNumber === fee.rollNo)
                return (
                  <div
                    key={fee.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-4"
                  >
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {child?.name || fee.student} - {fee.term}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Last payment {fee.lastPayment} | Balance ${fee.balanceDue}
                      </p>
                    </div>
                    <span className="text-sm text-warning-600 dark:text-warning-400">
                      {fee.status}
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
                Quick Links
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Jump to daily updates.
              </p>
            </div>
            <FileText className="h-5 w-5 text-primary-500" />
          </div>
          <div className="space-y-3">
            <Link href="/parent/attendance" className="btn-primary w-full justify-center">
              Review Attendance
            </Link>
            <Link href="/parent/results" className="btn-secondary w-full justify-center">
              View Results
            </Link>
            <Link href="/parent/documents" className="btn-secondary w-full justify-center">
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
                Latest Results
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Recent assessments and comments from teachers.
              </p>
            </div>
            <Link href="/parent/results" className="text-sm text-primary-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {latestResults.map((result) => {
              const child = linkedDetails.find((item) => item.rollNumber === result.rollNo)
              return (
                <div
                  key={result.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-4"
                >
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {child?.name || result.name} - {result.classGrade}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Section {result.section} | Roll {result.rollNo}
                    </p>
                  </div>
                  <span className="text-sm text-primary-600 dark:text-primary-400">
                    {result.grade} ({result.percentage}%)
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Documents
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                New forms and reports waiting.
              </p>
            </div>
            <FileText className="h-5 w-5 text-primary-500" />
          </div>
          <div className="space-y-3">
            {recentDocs.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{doc.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{doc.updated}</p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    (documentReads[doc.id] || 'Unread') === 'Unread'
                      ? 'bg-warning-50 text-warning-600 dark:bg-warning-900/20 dark:text-warning-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                  }`}
                >
                  {documentReads[doc.id] || 'Unread'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
