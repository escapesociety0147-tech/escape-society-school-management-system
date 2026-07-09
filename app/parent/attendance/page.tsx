'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { CalendarCheck, CheckCircle, Mail } from 'lucide-react'
import { useLocalStorageState } from '@/lib/useLocalStorage'
import { seedStudents } from '@/lib/seedData'
import { initialAttendanceHistory } from '@/lib/attendanceData'

type ExcuseNote = {
  id: number
  studentId: number
  date: string
  note: string
}

export default function ParentAttendancePage() {
  const [students] = useLocalStorageState('esm_students', seedStudents)
  const [attendanceHistory] = useLocalStorageState(
    'esm_attendance_history',
    initialAttendanceHistory
  )
  const [linkedStudents, setLinkedStudents] = useLocalStorageState<number[]>(
    'esm_parent_links',
    []
  )
  const [parentProfile] = useLocalStorageState('esm_parent_profile', {
    name: '',
    role: '',
    email: '',
    phone: '',
    schoolId: '',
  })
  const [excuseNotes, setExcuseNotes] = useLocalStorageState<ExcuseNote[]>(
    'esm_attendance_excuses',
    []
  )
  const [acknowledged, setAcknowledged] = useLocalStorageState<string[]>(
    'esm_attendance_ack',
    []
  )
  const [childFilter, setChildFilter] = useState('All Children')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [form, setForm] = useState({
    studentId: linkedStudents[0] ?? 0,
    date: new Date().toISOString().slice(0, 10),
    note: '',
  })

  const schoolId = String(parentProfile.schoolId || '').toLowerCase()
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
  const hasLinkedStudents = linkedDetails.length > 0

  useEffect(() => {
    if (!linkedDetails.length) {
      if (form.studentId !== 0) {
        setForm((prev) => ({ ...prev, studentId: 0 }))
      }
      return
    }
    if (!linkedDetails.some((student) => student.id === form.studentId)) {
      setForm((prev) => ({ ...prev, studentId: linkedDetails[0].id }))
    }
  }, [linkedDetails, form.studentId])

  const attendanceRows = useMemo(() => {
    return attendanceHistory.flatMap((record) => {
      return linkedDetails
        .filter(
          (student) =>
            student.grade === record.grade &&
            student.section === record.section &&
            record.attendance?.[student.id]
        )
        .map((student) => {
          const statusValue = record.attendance?.[student.id] as 'present' | 'absent'
          const note = excuseNotes.find(
            (item) => item.studentId === student.id && item.date === record.dateISO
          )
          const statusLabel = note ? 'Excused' : statusValue === 'absent' ? 'Absent' : 'Present'
          return {
            key: `${record.id}_${student.id}`,
            student,
            date: record.dateISO,
            dateLabel: record.date,
            status: statusLabel,
            note: note?.note || '',
          }
        })
    })
  }, [attendanceHistory, linkedDetails, excuseNotes])

  const filteredAttendance = attendanceRows.filter((row) => {
    const matchesChild =
      childFilter === 'All Children' || row.student.id === Number(childFilter)
    const matchesStatus = statusFilter === 'All Status' || row.status === statusFilter
    return matchesChild && matchesStatus
  })

  const handleExcuseSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!hasLinkedStudents) return
    if (!form.note.trim()) return
    const existing = excuseNotes.find(
      (note) => note.studentId === form.studentId && note.date === form.date
    )
    if (existing) {
      setExcuseNotes((prev) =>
        prev.map((note) =>
          note.id === existing.id ? { ...note, note: form.note.trim() } : note
        )
      )
    } else {
      setExcuseNotes((prev) => [
        {
          id: Date.now(),
          studentId: form.studentId,
          date: form.date,
          note: form.note.trim(),
        },
        ...prev,
      ])
    }
    setForm((prev) => ({ ...prev, note: '' }))
  }

  const toggleAcknowledged = (key: string) => {
    setAcknowledged((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <CalendarCheck className="h-6 w-6 text-primary-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Attendance Overview
          </h2>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Review daily attendance synced from the school records and submit excuse notes.
        </p>
      </div>

      {!hasLinkedStudents && (
        <p className="text-sm text-warning-600 dark:text-warning-400">
          No linked students yet. Add students to your account to view attendance.
        </p>
      )}
      <form onSubmit={handleExcuseSubmit} className="card space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Submit Excuse Note
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Child</label>
            <select
              className="input-field"
              value={form.studentId}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, studentId: Number(event.target.value) }))
              }
              disabled={!hasLinkedStudents}
            >
              {linkedDetails.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.name} ({child.grade} {child.section})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Date</label>
            <input
              type="date"
              className="input-field"
              value={form.date}
              onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
              disabled={!hasLinkedStudents}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Note</label>
            <input
              className="input-field"
              value={form.note}
              onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
              placeholder="Reason for absence"
              required
              disabled={!hasLinkedStudents}
            />
          </div>
        </div>
        <button className="btn-primary flex items-center gap-2" type="submit" disabled={!hasLinkedStudents}>
          <Mail className="h-4 w-4" />
          Send to School
        </button>
      </form>

      <div className="card space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <select
            className="input-field w-full lg:w-64"
            value={childFilter}
            onChange={(event) => setChildFilter(event.target.value)}
          >
            <option value="All Children">All Children</option>
            {linkedDetails.map((child) => (
              <option key={child.id} value={child.id}>
                {child.name}
              </option>
            ))}
          </select>
          <select
            className="input-field w-full lg:w-40"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="All Status">All Status</option>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Excused">Excused</option>
          </select>
        </div>

        <div className="space-y-3">
          {filteredAttendance.map((row) => {
            const acknowledgedKey = `${row.date}_${row.student.id}`
            const isAcknowledged = acknowledged.includes(acknowledgedKey)
            return (
              <div
                key={row.key}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {row.student.name} - {row.dateLabel}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Status: {row.status} {row.note ? `| ${row.note}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      row.status === 'Present'
                        ? 'bg-success-50 text-success-600 dark:bg-success-900/20 dark:text-success-400'
                        : row.status === 'Excused'
                        ? 'bg-warning-50 text-warning-600 dark:bg-warning-900/20 dark:text-warning-400'
                        : 'bg-error-50 text-error-600 dark:bg-error-900/20 dark:text-error-400'
                    }`}
                  >
                    {row.status}
                  </span>
                  <button
                    className={`flex items-center gap-2 text-sm ${
                      isAcknowledged
                        ? 'text-success-600 dark:text-success-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                    onClick={() => toggleAcknowledged(acknowledgedKey)}
                  >
                    <CheckCircle className="h-4 w-4" />
                    {isAcknowledged ? 'Acknowledged' : 'Acknowledge'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {filteredAttendance.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No attendance records match your filters.
          </p>
        )}
      </div>
    </div>
  )
}
