'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { CalendarCheck, Plus, Users, X } from 'lucide-react'
import { useLocalStorageState } from '@/lib/useLocalStorage'
import { seedStudents } from '@/lib/seedData'
import { initialTeacherClasses, type TeacherClass } from '@/lib/portalData'
import { initialAttendanceHistory } from '@/lib/attendanceData'
import { initialSchoolProfile } from '@/lib/schoolData'
import AttendanceTable, { type AttendanceStudent } from '@/components/attendance/AttendanceTable'

export default function TeacherStudentsPage() {
  const [classes] = useLocalStorageState<TeacherClass[]>(
    'esm_teacher_classes',
    initialTeacherClasses
  )
  const [students, setStudents] = useLocalStorageState('esm_students', seedStudents)
  const [attendanceHistory, setAttendanceHistory] = useLocalStorageState(
    'esm_attendance_history',
    initialAttendanceHistory
  )
  const [schoolProfile] = useLocalStorageState('esm_school_profile', initialSchoolProfile)
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id ?? 0)
  const [showForm, setShowForm] = useState(false)
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState('')
  const [attendance, setAttendance] = useState<Record<number, 'present' | 'absent'>>({})
  const [formError, setFormError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    rollNumber: '',
    grade: '',
    section: '',
    contact: '',
    email: '',
  })

  const selectedClass = classes.find((item) => item.id === selectedClassId) || null

  useEffect(() => {
    if (!selectedClass) return
    setFormData((prev) => ({
      ...prev,
      grade: selectedClass.grade,
      section: selectedClass.section,
    }))
  }, [selectedClass])

  const roster = useMemo(() => {
    if (!selectedClass) return []
    return students.filter(
      (student) =>
        student.grade === selectedClass.grade &&
        student.section === selectedClass.section
    )
  }, [selectedClass, students])

  const attendanceStudents = useMemo<AttendanceStudent[]>(
    () =>
      roster.map((student) => ({
        id: student.id,
        rollNo: student.rollNumber,
        name: student.name,
      })),
    [roster]
  )

  useEffect(() => {
    const next: Record<number, 'present' | 'absent'> = {}
    roster.forEach((student) => {
      next[student.id] = 'present'
    })
    setAttendance(next)
  }, [roster, selectedClassId])

  const handleAddStudent = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError('')
    if (!formData.name || !formData.grade || !formData.section) {
      setFormError('Please complete the required fields.')
      return
    }
    const nextId = students.length ? Math.max(...students.map((s) => s.id)) + 1 : 1
    const normalizedRoll = formData.rollNumber.trim()
    const existingRolls = new Set(
      students.map((student) => String(student.rollNumber).toLowerCase())
    )
    if (normalizedRoll && existingRolls.has(normalizedRoll.toLowerCase())) {
      setFormError('That roll number is already in use.')
      return
    }
    let rollNumber = normalizedRoll
    if (!rollNumber) {
      let counter = nextId
      let candidate = `2024${String(counter).padStart(3, '0')}`
      while (existingRolls.has(candidate.toLowerCase())) {
        counter += 1
        candidate = `2024${String(counter).padStart(3, '0')}`
      }
      rollNumber = candidate
    }

    const newStudent = {
      id: nextId,
      studentId: `STD-${String(nextId).padStart(4, '0')}`,
      rollNumber,
      name: formData.name.trim(),
      grade: formData.grade,
      section: formData.section,
      contact: formData.contact || 'N/A',
      email: formData.email.trim(),
      status: 'Active',
      createdAt: new Date().toISOString(),
      schoolId: schoolProfile.schoolId || '',
    }
    setStudents((prev) => [newStudent, ...prev])
    setFormData({
      name: '',
      rollNumber: '',
      grade: selectedClass?.grade || '',
      section: selectedClass?.section || '',
      contact: '',
      email: '',
    })
    setShowForm(false)
  }

  const handleRemoveStudent = (id: number) => {
    setStudents((prev) => prev.filter((student) => student.id !== id))
  }

  const handleAttendanceChange = (studentId: number, status: 'present' | 'absent') => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }))
  }

  const handleSaveAttendance = () => {
    if (!selectedClass) return
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
    setAttendanceHistory((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === recordId)
      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex] = record
        return updated
      }
      return [record, ...prev]
    })
    setNote('')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary-500" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Class Students
            </h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Add students to your roster and mark attendance in real time.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((prev) => !prev)}
          className="btn-primary flex items-center gap-2"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Close Form' : 'Add Student'}
        </button>
      </div>

      <div className="card grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-2">Class</label>
          <select
            className="input-field"
            value={selectedClassId}
            onChange={(event) => setSelectedClassId(Number(event.target.value))}
            disabled={classes.length === 0}
          >
            {classes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.grade} {item.section} - {item.subject}
              </option>
            ))}
            {classes.length === 0 && <option>No classes available</option>}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Attendance Date</label>
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="input-field"
          />
        </div>
        <div className="md:col-span-3">
          <label className="block text-sm font-medium mb-2">Attendance Notes</label>
          <input
            className="input-field"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Optional notes for this session"
          />
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleAddStudent} className="card space-y-4">
          {formError && (
            <p className="text-sm text-error-600 dark:text-error-400">{formError}</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400">Student Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                required
                className="input-field mt-1"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400">Roll Number</label>
              <input
                type="text"
                value={formData.rollNumber}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, rollNumber: event.target.value }))
                }
                className="input-field mt-1"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
                className="input-field mt-1"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400">Contact</label>
              <input
                type="text"
                value={formData.contact}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, contact: event.target.value }))
                }
                className="input-field mt-1"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400">Grade *</label>
              <input
                type="text"
                value={formData.grade}
                onChange={(event) => setFormData((prev) => ({ ...prev, grade: event.target.value }))}
                required
                className="input-field mt-1"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400">Section *</label>
              <input
                type="text"
                value={formData.section}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, section: event.target.value }))
                }
                required
                className="input-field mt-1"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Student
            </button>
          </div>
        </form>
      )}

      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-primary-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Roster
          </h3>
        </div>
        {roster.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No students assigned to this class yet.
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
                    Roll {student.rollNumber} • {student.contact}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-secondary text-sm text-error-600 dark:text-error-400"
                  onClick={() => handleRemoveStudent(student.id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <CalendarCheck className="h-5 w-5 text-primary-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Mark Attendance
          </h3>
        </div>
        <AttendanceTable
          students={attendanceStudents}
          attendance={attendance}
          onAttendanceChange={handleAttendanceChange}
          onSave={handleSaveAttendance}
          title={
            selectedClass ? `Attendance - ${selectedClass.grade} ${selectedClass.section}` : 'Attendance'
          }
        />
      </div>
    </div>
  )
}
