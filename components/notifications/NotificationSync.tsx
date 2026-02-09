'use client'

import { useEffect, useRef } from 'react'
import { useLocalStorageState } from '@/lib/useLocalStorage'
import { seedStudents } from '@/lib/seedData'
import { initialResults } from '@/lib/resultsData'
import { initialPayments } from '@/lib/paymentsData'
import { initialAttendanceHistory } from '@/lib/attendanceData'
import { initialEvents } from '@/lib/eventsData'
import { initialDocuments } from '@/lib/documentsData'
import { initialMessageThreads, type MessageThread } from '@/lib/messagesData'
import { notify } from '@/lib/notifications'
import type { Student } from '@/components/students/StudentTable'
import type { ResultRow } from '@/components/results/ResultsTable'
import type { FeePayment } from '@/components/fees/FeesTable'
import type { AttendanceHistoryRecord } from '@/lib/attendanceData'
import type { SchoolEvent } from '@/lib/eventsData'

type TeacherRecord = { id: number; name?: string; department?: string }
type ParentRecord = { id: number; name?: string; children?: Array<{ name?: string }> }
type DocumentRecord = { id: number; name?: string; category?: string; owner?: string }
type ReportRecord = { id: number; name?: string; type?: string; status?: string }

type SyncState = {
  students: Set<number>
  teachers: Set<number>
  parents: Set<number>
  results: Set<number>
  payments: Map<number, FeePayment['status']>
  attendance: Set<string>
  events: Set<number>
  documents: Set<number>
  reports: Set<number>
  threads: Map<number, string>
}

const buildSyncState = (
  students: Student[],
  teachers: TeacherRecord[],
  parents: ParentRecord[],
  results: ResultRow[],
  payments: FeePayment[],
  attendanceHistory: AttendanceHistoryRecord[],
  events: SchoolEvent[],
  documents: DocumentRecord[],
  reports: ReportRecord[],
  threads: MessageThread[]
): SyncState => ({
  students: new Set(students.map((item) => item.id)),
  teachers: new Set(teachers.map((item) => item.id)),
  parents: new Set(parents.map((item) => item.id)),
  results: new Set(results.map((item) => item.id)),
  payments: new Map(payments.map((item) => [item.id, item.status])),
  attendance: new Set(attendanceHistory.map((item) => item.id)),
  events: new Set(events.map((item) => item.id)),
  documents: new Set(documents.map((item) => item.id)),
  reports: new Set(reports.map((item) => item.id)),
  threads: new Map(threads.map((item) => [item.id, item.lastMessage])),
})

export default function NotificationSync() {
  const [students, , , studentsHydrated] = useLocalStorageState<Student[]>('esm_students', seedStudents)
  const [teachers, , , teachersHydrated] = useLocalStorageState<TeacherRecord[]>('esm_teachers', [])
  const [parents, , , parentsHydrated] = useLocalStorageState<ParentRecord[]>('esm_parents', [])
  const [results, , , resultsHydrated] = useLocalStorageState<ResultRow[]>('esm_results', initialResults)
  const [payments, , , paymentsHydrated] = useLocalStorageState<FeePayment[]>('esm_payments', initialPayments)
  const [attendanceHistory, , , attendanceHydrated] = useLocalStorageState<AttendanceHistoryRecord[]>(
    'esm_attendance_history',
    initialAttendanceHistory
  )
  const [events, , , eventsHydrated] = useLocalStorageState<SchoolEvent[]>('esm_events', initialEvents)
  const [documents, , , documentsHydrated] = useLocalStorageState<DocumentRecord[]>('esm_documents', initialDocuments)
  const [reports, , , reportsHydrated] = useLocalStorageState<ReportRecord[]>('esm_reports', [])
  const [threads, , , threadsHydrated] = useLocalStorageState<MessageThread[]>('esm_message_threads', initialMessageThreads)

  const allHydrated =
    studentsHydrated &&
    teachersHydrated &&
    parentsHydrated &&
    resultsHydrated &&
    paymentsHydrated &&
    attendanceHydrated &&
    eventsHydrated &&
    documentsHydrated &&
    reportsHydrated &&
    threadsHydrated

  const initializedRef = useRef(false)
  const prevRef = useRef<SyncState>(
    buildSyncState(
      students,
      teachers,
      parents,
      results,
      payments,
      attendanceHistory,
      events,
      documents,
      reports,
      threads
    )
  )

  useEffect(() => {
    if (!allHydrated) return
    const nextState = buildSyncState(
      students,
      teachers,
      parents,
      results,
      payments,
      attendanceHistory,
      events,
      documents,
      reports,
      threads
    )

    if (!initializedRef.current) {
      prevRef.current = nextState
      initializedRef.current = true
      return
    }

    students.forEach((student) => {
      if (prevRef.current.students.has(student.id)) return
      notify({
        title: 'New student registered',
        message: `${student.name || 'New student'} added to ${student.grade} ${student.section}.`,
        type: 'Update',
        channel: 'Admissions',
      })
    })

    teachers.forEach((teacher) => {
      if (prevRef.current.teachers.has(teacher.id)) return
      notify({
        title: 'New teacher onboarded',
        message: `${teacher.name || 'New teacher'} joined ${teacher.department || 'the faculty'}.`,
        type: 'Update',
        channel: 'HR',
      })
    })

    parents.forEach((parent) => {
      if (prevRef.current.parents.has(parent.id)) return
      const childrenCount = parent.children?.length || 0
      notify({
        title: 'New parent account',
        message:
          childrenCount > 0
            ? `${parent.name || 'Parent'} linked ${childrenCount} student(s).`
            : `${parent.name || 'Parent'} account added.`,
        type: 'Update',
        channel: 'Family',
      })
    })

    results.forEach((result) => {
      if (prevRef.current.results.has(result.id)) return
      notify({
        title: 'New result recorded',
        message: `${result.name || 'Student'} - ${result.classGrade} ${result.section}`,
        type: 'Update',
        channel: 'Academics',
      })
    })

    payments.forEach((payment) => {
      const prevStatus = prevRef.current.payments.get(payment.id)
      if (!prevStatus) {
        notify({
          title: 'New fee record',
          message: `${payment.student || 'Student'} - ${payment.term} ${payment.year}`,
          type: 'Reminder',
          channel: 'Finance',
        })
        return
      }
      if (prevStatus !== payment.status) {
        if (payment.status === 'Overdue') {
          notify({
            title: 'Fee marked overdue',
            message: `${payment.student || 'Student'} balance overdue.`,
            type: 'Alert',
            channel: 'Finance',
          })
        }
        if (payment.status === 'Paid') {
          notify({
            title: 'Fee marked paid',
            message: `${payment.student || 'Student'} payment recorded.`,
            type: 'Update',
            channel: 'Finance',
          })
        }
      }
    })

    attendanceHistory.forEach((record) => {
      if (prevRef.current.attendance.has(record.id)) return
      notify({
        title: 'Attendance saved',
        message: `${record.grade} ${record.section} - ${record.date}`,
        type: 'Update',
        channel: 'Attendance',
      })
    })

    events.forEach((event) => {
      if (prevRef.current.events.has(event.id)) return
      notify({
        title: 'New event scheduled',
        message: `${event.title || 'Event'} - ${event.date}`,
        type: 'Announcement',
        channel: 'Events',
      })
    })

    documents.forEach((doc) => {
      if (prevRef.current.documents.has(doc.id)) return
      notify({
        title: 'New document uploaded',
        message: `${doc.name || 'Document'}${doc.category ? ` - ${doc.category}` : ''}`,
        type: 'Announcement',
        channel: 'Documents',
      })
    })

    reports.forEach((report) => {
      if (prevRef.current.reports.has(report.id)) return
      notify({
        title: 'Report generated',
        message: report.name || 'New report ready.',
        type: 'Update',
        channel: 'Analytics',
      })
    })

    threads.forEach((thread) => {
      const prevMessage = prevRef.current.threads.get(thread.id)
      if (!prevMessage) {
        notify({
          title: 'New conversation started',
          message: thread.lastMessage || 'New thread created.',
          type: 'Update',
          channel: 'Messages',
          iconKey: 'mail',
        })
        return
      }
      if (prevMessage !== thread.lastMessage) {
        notify({
          title: 'New message received',
          message: thread.lastMessage,
          type: 'Update',
          channel: 'Messages',
          iconKey: 'mail',
        })
      }
    })

    prevRef.current = nextState
  }, [allHydrated, students, teachers, parents, results, payments, attendanceHistory, events, documents, reports, threads])

  return null
}
