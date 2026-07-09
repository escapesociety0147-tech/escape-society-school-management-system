'use client'

import { useMemo, useState } from 'react'
import { CalendarCheck, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { useLocalStorageState } from '@/lib/useLocalStorage'
import { seedStudents } from '@/lib/seedData'
import { initialAttendanceHistory } from '@/lib/attendanceData'
import { initialStudentProfile } from '@/lib/studentData'

type NoteMap = Record<string, string>
type FlagMap = Record<string, boolean>

export default function StudentAttendancePage() {
  const [profile] = useLocalStorageState('esm_student_profile', initialStudentProfile)
  const [students] = useLocalStorageState('esm_students', seedStudents)
  const [attendanceHistory] = useLocalStorageState(
    'esm_attendance_history',
    initialAttendanceHistory
  )
  const [notes, setNotes] = useLocalStorageState<NoteMap>(
    'esm_student_attendance_notes',
    {}
  )
  const [flags, setFlags] = useLocalStorageState<FlagMap>(
    'esm_student_attendance_flags',
    {}
  )
  const [statusMessage, setStatusMessage] = useState('')

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

  const records = useMemo(() => {
    return [...attendanceHistory]
      .filter(
        (record) =>
          record.grade === studentRecord.grade &&
          record.section === studentRecord.section
      )
      .sort((a, b) => b.dateISO.localeCompare(a.dateISO))
      .flatMap((record) => {
        const status = record.attendance?.[studentId]
        if (!status) return []
        return [
          {
            ...record,
            status,
          },
        ]
      })
  }, [attendanceHistory, studentRecord.grade, studentRecord.section, studentId])

  const stats = useMemo(() => {
    const total = records.length
    const present = records.filter((record) => record.status !== 'absent').length
    const absent = total - present
    const rate = total ? Math.round((present / total) * 100) : 0
    return { total, present, absent, rate }
  }, [records])

  const handleNoteChange = (recordId: string, value: string) => {
    setNotes((prev) => ({ ...prev, [recordId]: value }))
  }

  const handleToggleFlag = (recordId: string) => {
    setFlags((prev) => ({ ...prev, [recordId]: !prev[recordId] }))
    setStatusMessage('Attendance request sent.')
    setTimeout(() => setStatusMessage(''), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <CalendarCheck className="h-6 w-6 text-primary-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Attendance
          </h2>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Review your attendance history and submit corrections when needed.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Sessions</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500 dark:text-gray-400">Present</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.present}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500 dark:text-gray-400">Absent</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.absent}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500 dark:text-gray-400">Attendance Rate</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.rate}%</p>
        </div>
      </div>

      {statusMessage && (
        <p className="text-sm text-success-600 dark:text-success-400">{statusMessage}</p>
      )}

      <div className="card space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Attendance Records
        </h3>
        <div className="space-y-4">
          {records.map((record) => (
            <div
              key={record.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {record.date}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {record.grade} {record.section}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {record.status === 'absent' ? (
                    <span className="flex items-center gap-2 text-error-600 dark:text-error-400 text-sm font-medium">
                      <XCircle className="h-4 w-4" /> Absent
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-success-600 dark:text-success-400 text-sm font-medium">
                      <CheckCircle className="h-4 w-4" /> Present
                    </span>
                  )}
                  <button
                    className={`btn-secondary text-sm flex items-center gap-2 ${
                      flags[record.id] ? 'text-warning-600 dark:text-warning-400' : ''
                    }`}
                    onClick={() => handleToggleFlag(record.id)}
                  >
                    <AlertTriangle className="h-4 w-4" />
                    {flags[record.id] ? 'Correction Sent' : 'Request Correction'}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">
                  Note to attendance office
                </label>
                <input
                  className="input-field mt-2"
                  placeholder="Add a note about this day"
                  value={notes[record.id] || ''}
                  onChange={(event) => handleNoteChange(record.id, event.target.value)}
                />
              </div>
            </div>
          ))}
          {records.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No attendance records available yet.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
