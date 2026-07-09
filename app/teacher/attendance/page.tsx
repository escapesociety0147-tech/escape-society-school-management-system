'use client'

import { useEffect, useMemo, useState } from 'react'
import { CalendarCheck, Save, Users } from 'lucide-react'
import { useLocalStorageState } from '@/lib/useLocalStorage'
import { seedStudents } from '@/lib/seedData'
import { initialTeacherClasses, TeacherClass } from '@/lib/portalData'
import { initialAttendanceHistory } from '@/lib/attendanceData'

type AttendanceStatus = 'present' | 'absent'

export default function TeacherAttendancePage() {
  const [classes] = useLocalStorageState<TeacherClass[]>(
    'esm_teacher_classes',
    initialTeacherClasses
  )
  const [students] = useLocalStorageState('esm_students', seedStudents)
  const [history, setHistory] = useLocalStorageState(
    'esm_attendance_history',
    initialAttendanceHistory
  )
  const [selectedClassId, setSelectedClassId] = useState(
    classes[0]?.id ?? 0
  )
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState('')
  const [attendance, setAttendance] = useState<Record<number, AttendanceStatus>>({})
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState('')

  const selectedClass = classes.find((item) => item.id === selectedClassId) || classes[0]

  const roster = useMemo(() => {
    if (!selectedClass) return []
    return students.filter(
      (student) =>
        student.grade === selectedClass.grade &&
        student.section === selectedClass.section
    )
  }, [selectedClass, students])

  useEffect(() => {
    const next: Record<number, AttendanceStatus> = {}
    roster.forEach((student) => {
      next[student.id] = 'present'
    })
    setAttendance(next)
  }, [roster, selectedClassId])

  const filteredHistory = useMemo(() => {
    if (!history.length) return []
    const studentIdSet = new Set(students.map((student) => student.id))
    const classKeySet = new Set(classes.map((item) => `${item.grade}_${item.section}`))
    return history.filter((record) => {
      if (!record || !record.dateISO || !record.grade || !record.section) return false
      if (!record.attendance || Object.keys(record.attendance).length === 0) return false
      if (classKeySet.size > 0 && !classKeySet.has(`${record.grade}_${record.section}`)) {
        return false
      }
      if (studentIdSet.size === 0) return false
      return Object.keys(record.attendance).some((id) => studentIdSet.has(Number(id)))
    })
  }, [history, students, classes])

  useEffect(() => {
    if (!history.length) return
    if (filteredHistory.length !== history.length) {
      setHistory(filteredHistory)
      if (selectedRecordId && !filteredHistory.find((item) => item.id === selectedRecordId)) {
        setSelectedRecordId(null)
      }
    }
  }, [filteredHistory, history, selectedRecordId, setHistory])

  const setAll = (status: AttendanceStatus) => {
    const next: Record<number, AttendanceStatus> = {}
    roster.forEach((student) => {
      next[student.id] = status
    })
    setAttendance(next)
  }

  const toggleStatus = (id: number) => {
    setAttendance((prev) => ({
      ...prev,
      [id]: prev[id] === 'absent' ? 'present' : 'absent',
    }))
  }

  const handleSave = () => {
    if (!selectedClass) return
    if (!roster.length) {
      setSaveStatus('Add students to this class before saving attendance.')
      setTimeout(() => setSaveStatus(''), 2000)
      return
    }

    const recordId = `${date}_${selectedClass.grade}_${selectedClass.section}`
    const dateLabel = new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    })
    const present = roster.filter((student) => attendance[student.id] !== 'absent').length
    const absent = roster.length - present

    const record = {
      id: recordId,
      date: dateLabel,
      dateISO: date,
      grade: selectedClass.grade,
      section: selectedClass.section,
      present,
      absent,
      attendance,
      note: note.trim(),
    }

    setHistory((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === recordId)
      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex] = record
        return updated
      }
      return [record, ...prev]
    })
    setSelectedRecordId(record.id)
    setNote('')
    setSaveStatus('Attendance saved.')
    setTimeout(() => setSaveStatus(''), 2000)
  }

  const selectedRecord = filteredHistory.find((item) => item.id === selectedRecordId)

  const statusTone = saveStatus.startsWith('Add students')
    ? 'text-warning-600 dark:text-warning-400'
    : 'text-success-600 dark:text-success-400'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-6 w-6 text-primary-500" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Take Attendance
            </h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Mark attendance, save sessions, and keep notes in real time.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
            {roster.length} students
          </div>
          <button className="btn-primary flex items-center gap-2" onClick={handleSave}>
            <Save className="h-4 w-4" />
            Save Session
          </button>
        </div>
      </div>
      {saveStatus && <p className={`text-sm ${statusTone}`}>{saveStatus}</p>}

      <div className="card grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-2">Class</label>
          <select
            className="input-field"
            value={selectedClassId}
            onChange={(event) => setSelectedClassId(Number(event.target.value))}
          >
            {classes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.grade} {item.section} - {item.subject}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Date</label>
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Quick Set</label>
          <div className="flex gap-2">
          <button type="button" className="btn-secondary flex-1" onClick={() => setAll('present')}>
            All Present
          </button>
          <button type="button" className="btn-secondary flex-1" onClick={() => setAll('absent')}>
            All Absent
          </button>
          </div>
        </div>
        <div className="md:col-span-4">
          <label className="block text-sm font-medium mb-2">Session Notes</label>
          <input
            className="input-field"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Add any notes for this session"
          />
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-primary-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Student Roster
          </h3>
        </div>
        {roster.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No students found for this class. Update the class section or add roster records.
          </p>
        ) : (
          <div className="space-y-2">
            {roster.map((student) => (
              <div
                key={student.id}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {student.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Roll {student.rollNumber} | {student.contact}
                  </p>
                </div>
                <button
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    attendance[student.id] === 'absent'
                      ? 'bg-error-50 text-error-600 dark:bg-error-900/20 dark:text-error-400'
                      : 'bg-success-50 text-success-600 dark:bg-success-900/20 dark:text-success-400'
                  }`}
                  onClick={() => toggleStatus(student.id)}
                >
                  {attendance[student.id] || 'present'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Attendance History
            </h3>
          </div>
          <div className="space-y-3">
            {filteredHistory.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No attendance sessions saved yet.
              </p>
            ) : (
              filteredHistory.map((record) => {
                const label = `${record.grade} ${record.section}`
                return (
                  <button
                    key={record.id}
                    className={`w-full text-left border rounded-lg p-4 transition ${
                      selectedRecordId === record.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => setSelectedRecordId(record.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {label}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {record.date} {record.note ? `| ${record.note}` : ''}
                        </p>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {record.present} present / {record.absent} absent
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Session Details
            </h3>
          </div>
          {selectedRecord ? (
            <div className="space-y-3">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {selectedRecord.date}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Present: {selectedRecord.present} | Absent: {selectedRecord.absent}
              </div>
              <div className="space-y-2">
                {Object.entries(selectedRecord.attendance)
                  .map(([studentId, status]) => {
                    const student = students.find((item) => item.id === Number(studentId))
                    if (!student) return null
                    return (
                      <div
                        key={`${selectedRecord.id}-${studentId}`}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-gray-700 dark:text-gray-300">
                          {student.name}
                        </span>
                        <span
                          className={`${
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
                  .filter(Boolean)}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Select a session to view details.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
