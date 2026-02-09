'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import AttendanceTable, { type AttendanceStudent } from '@/components/attendance/AttendanceTable'
import DashboardShell from '@/components/dashboard/layout/DashboardShell'
import { Calendar, CheckCircle, XCircle } from 'lucide-react'
import { useLocalStorageState } from '@/lib/useLocalStorage'
import { seedStudents } from '@/lib/seedData'
import { initialAttendanceHistory } from '@/lib/attendanceData'

type AttendanceStudentRecord = AttendanceStudent & { grade: string; section: string }

export default function AttendancePage() {
  const [students] = useLocalStorageState('esm_students', seedStudents)
  const allStudents: AttendanceStudentRecord[] = useMemo(
    () =>
      students.map((student) => ({
        id: student.id,
        rollNo: student.rollNumber,
        name: student.name,
        grade: student.grade,
        section: student.section,
      })),
    [students]
  )
  const studentIdSet = useMemo(() => new Set(allStudents.map((student) => student.id)), [allStudents])
  const defaultGrade = allStudents[0]?.grade ?? 'Grade 8'
  const defaultSection = allStudents[0]?.section ?? 'A'
  const buildAttendance = (list: AttendanceStudent[]) => {
    const next: Record<number, 'present' | 'absent'> = {}
    list.forEach((student) => {
      next[student.id] = 'present'
    })
    return next
  }
  const initialActiveStudents = allStudents.filter(
    (student) => student.grade === defaultGrade && student.section === defaultSection
  )
  const [selectedGrade, setSelectedGrade] = useState(defaultGrade)
  const [selectedSection, setSelectedSection] = useState(defaultSection)
  const [attendanceDate, setAttendanceDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  )
  const [activeStudents, setActiveStudents] = useState<AttendanceStudent[]>(
    initialActiveStudents
  )
  const [attendance, setAttendance] = useState<Record<number, 'present' | 'absent'>>(() =>
    buildAttendance(initialActiveStudents)
  )
  const [saveStatus, setSaveStatus] = useState('')
  const [attendanceHistory, setAttendanceHistory] = useLocalStorageState(
    'esm_attendance_history',
    initialAttendanceHistory
  )
  const [historyNote, setHistoryNote] = useState('')
  const skipAutoLoadRef = useRef(false)
  const hasSelection =
    selectedGrade && selectedSection && !selectedGrade.startsWith('Select') && !selectedSection.startsWith('Select')
  const tableTitle = hasSelection
    ? `Mark Attendance - ${selectedGrade} ${selectedSection}`
    : 'Mark Attendance'

  const attendanceSummary = useMemo(() => {
    const total = activeStudents.length
    const present = activeStudents.filter((student) => attendance[student.id] !== 'absent').length
    const absent = total - present
    return {
      total,
      present,
      absent,
      rate: total ? ((present / total) * 100).toFixed(1) : '0.0',
    }
  }, [activeStudents, attendance])

  const handleAttendanceChange = (studentId: number, status: 'present' | 'absent') => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }))
  }

  const handleLoadStudents = () => {
    const filtered = allStudents.filter(
      (student) => student.grade === selectedGrade && student.section === selectedSection
    )
    setActiveStudents(filtered)
    setAttendance(buildAttendance(filtered))
  }

  useEffect(() => {
    if (!allStudents.length) {
      setActiveStudents([])
      setAttendance({})
      return
    }
    if (skipAutoLoadRef.current) {
      skipAutoLoadRef.current = false
      return
    }
    const filtered = allStudents.filter(
      (student) => student.grade === selectedGrade && student.section === selectedSection
    )
    setActiveStudents(filtered)
    setAttendance(buildAttendance(filtered))
  }, [allStudents, selectedGrade, selectedSection])

  useEffect(() => {
    if (!attendanceHistory.length) return
    const cleaned = attendanceHistory.filter((record) => {
      if (!record || !record.dateISO || !record.grade || !record.section) return false
      if (!record.attendance || Object.keys(record.attendance).length === 0) return false
      if (studentIdSet.size === 0) return false
      const hasRegisteredStudent = Object.keys(record.attendance).some((id) =>
        studentIdSet.has(Number(id))
      )
      return hasRegisteredStudent
    })
    if (cleaned.length !== attendanceHistory.length) {
      setAttendanceHistory(cleaned)
      setHistoryNote('Removed attendance history without registered students.')
      setTimeout(() => setHistoryNote(''), 2000)
    }
  }, [attendanceHistory, setAttendanceHistory, studentIdSet])

  const handleSaveAttendance = () => {
    const recordId = `${attendanceDate}_${selectedGrade}_${selectedSection}`
    const dateLabel = new Date(attendanceDate).toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    })
    const record = {
      id: recordId,
      date: dateLabel,
      dateISO: attendanceDate,
      grade: selectedGrade,
      section: selectedSection,
      present: attendanceSummary.present,
      absent: attendanceSummary.absent,
      attendance,
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
    setSaveStatus(`Saved at ${new Date().toLocaleTimeString()}`)
    setTimeout(() => setSaveStatus(''), 2000)
  }

  const handleViewRecord = (record: (typeof initialAttendanceHistory)[number]) => {
    skipAutoLoadRef.current = true
    setSelectedGrade(record.grade)
    setSelectedSection(record.section)
    setAttendanceDate(record.dateISO)
    const filtered = allStudents.filter(
      (student) => student.grade === record.grade && student.section === record.section
    )
    setActiveStudents(filtered)
    if (record.attendance && Object.keys(record.attendance).length > 0) {
      setAttendance(record.attendance)
    } else {
      setAttendance(buildAttendance(filtered))
    }
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Attendance Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Mark and view student attendance with real-time indicators
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="card">
              <div className="flex flex-wrap gap-4 mb-6">
                <select
                  className="input-field flex-1 min-w-[150px]"
                  value={selectedGrade}
                  onChange={(event) => setSelectedGrade(event.target.value)}
                >
                  <option>Select Grade</option>
                  <option>Grade 7</option>
                  <option>Grade 8</option>
                  <option>Grade 9</option>
                  <option>Grade 10</option>
                  <option>Grade 11</option>
                  <option>Grade 12</option>
                </select>
                <select
                  className="input-field flex-1 min-w-[150px]"
                  value={selectedSection}
                  onChange={(event) => setSelectedSection(event.target.value)}
                >
                  <option>Select Section</option>
                  <option>A</option>
                  <option>B</option>
                  <option>C</option>
                </select>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(event) => setAttendanceDate(event.target.value)}
                  className="input-field flex-1 min-w-[150px]"
                />
                <button type="button" className="btn-primary" onClick={handleLoadStudents}>
                  Load Students
                </button>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Students</p>
                  <p className="text-2xl font-bold mt-1">{attendanceSummary.total}</p>
                </div>
                <div className="bg-success-50 dark:bg-success-900/20 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-success-700 dark:text-success-400">Present</p>
                      <p className="text-2xl font-bold mt-1 text-success-700 dark:text-success-400">
                        {attendanceSummary.present}
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-success-500" />
                  </div>
                </div>
                <div className="bg-error-50 dark:bg-error-900/20 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-error-700 dark:text-error-400">Absent</p>
                      <p className="text-2xl font-bold mt-1 text-error-700 dark:text-error-400">
                        {attendanceSummary.absent}
                      </p>
                    </div>
                    <XCircle className="h-8 w-8 text-error-500" />
                  </div>
                </div>
                <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-primary-700 dark:text-primary-400">Attendance Rate</p>
                      <p className="text-2xl font-bold mt-1 text-primary-700 dark:text-primary-400">
                        {attendanceSummary.rate}%
                      </p>
                    </div>
                    <span className="bg-primary-100 dark:bg-primary-800 text-primary-800 dark:text-primary-300 text-xs font-semibold px-2 py-1 rounded">
                      {Number(attendanceSummary.rate) >= 95 ? 'Excellent' : 'On Track'}
                    </span>
                  </div>
                </div>
              </div>

              <AttendanceTable
                students={activeStudents}
                attendance={attendance}
                onAttendanceChange={handleAttendanceChange}
                onSave={handleSaveAttendance}
                title={tableTitle}
              />
      {saveStatus && (
        <p className="mt-3 text-sm text-success-600 dark:text-success-400">{saveStatus}</p>
      )}
      {historyNote && (
        <p className="mt-3 text-sm text-warning-600 dark:text-warning-400">{historyNote}</p>
      )}
            </div>
          </div>

          <div>
            <div className="card mb-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Attendance History
              </h3>
              <div className="space-y-4">
                {[...attendanceHistory]
                  .sort((a, b) => b.dateISO.localeCompare(a.dateISO))
                  .map((record) => (
                  <div key={record.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">{record.date}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {record.grade}-{record.section}
                </p>
              </div>
              <div className="text-right">
                <p className="text-success-600 dark:text-success-400 font-medium">
                  {record.present} Present
                </p>
                <p className="text-error-600 dark:text-error-400 text-sm">
                  {record.absent} Absent
                </p>
              </div>
            </div>
            <button
              type="button"
              className="w-full mt-2 text-sm btn-secondary py-1"
              onClick={() => handleViewRecord(record)}
            >
              View Details
            </button>
          </div>
        ))}
                {attendanceHistory.length > 0 && (
                  <button
                    type="button"
                    className="w-full text-sm btn-secondary py-2"
                    onClick={() => {
                      setAttendanceHistory([])
                      setHistoryNote('Attendance history cleared.')
                      setTimeout(() => setHistoryNote(''), 2000)
                    }}
                  >
                    Clear Attendance History
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
