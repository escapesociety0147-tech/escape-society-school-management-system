'use client'

import { apiFetch } from '@/lib/auth'

import { useEffect, useMemo, useState } from 'react'
import AttendanceTable, { type AttendanceStudent } from '@/components/attendance/AttendanceTable'
import DashboardShell from '@/components/dashboard/layout/DashboardShell'
import { Calendar, CheckCircle, XCircle, RefreshCw } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

function getToken(): string {
  const match = document.cookie.match(/auth_token=([^;]+)/)
  return match ? match[1] : ''
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken()
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Request failed')
  }
  return res.json()
}

type AttendanceStudentRecord = AttendanceStudent & { grade: string; section: string }

export default function AttendancePage() {
  const [allStudents, setAllStudents] = useState<AttendanceStudentRecord[]>([])
  const [selectedGrade, setSelectedGrade] = useState('Grade 8')
  const [selectedSection, setSelectedSection] = useState('A')
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [attendance, setAttendance] = useState<Record<number, 'present' | 'absent'>>({})
  const [saveStatus, setSaveStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [historyRecords, setHistoryRecords] = useState<any[]>([])

  const fetchStudents = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await apiFetch('/students')
      const mapped: AttendanceStudentRecord[] = data.map((s: any) => ({
        id: s.id,
        rollNo: s.roll_number || '',
        name: s.name,
        grade: s.grade || '',
        section: s.section || '',
      }))
      setAllStudents(mapped)
    } catch (err: any) {
      setError(err.message || 'Failed to load students.')
    } finally {
      setLoading(false)
    }
  }

  const fetchHistory = async () => {
    try {
      const data = await apiFetch('/attendance')
      setHistoryRecords(data)
    } catch { }
  }

  useEffect(() => {
    fetchStudents()
    fetchHistory()
  }, [])

  const activeStudents = useMemo(() =>
    allStudents.filter(s => s.grade === selectedGrade && s.section === selectedSection),
    [allStudents, selectedGrade, selectedSection]
  )

  useEffect(() => {
    const next: Record<number, 'present' | 'absent'> = {}
    activeStudents.forEach(s => { next[s.id] = 'present' })
    setAttendance(next)
  }, [activeStudents])

  const attendanceSummary = useMemo(() => {
    const total = activeStudents.length
    const present = activeStudents.filter(s => attendance[s.id] !== 'absent').length
    const absent = total - present
    return { total, present, absent, rate: total ? ((present / total) * 100).toFixed(1) : '0.0' }
  }, [activeStudents, attendance])

  const handleAttendanceChange = (studentId: number, status: 'present' | 'absent') => {
    setAttendance(prev => ({ ...prev, [studentId]: status }))
  }

  const handleSaveAttendance = async () => {
    setSaving(true)
    try {
      await Promise.all(
        activeStudents.map(student =>
          apiFetch('/attendance', {
            method: 'POST',
            body: JSON.stringify({
              student_id: student.id,
              date: attendanceDate,
              status: attendance[student.id] || 'present',
            }),
          })
        )
      )
      setSaveStatus(`Saved at ${new Date().toLocaleTimeString()}`)
      setTimeout(() => setSaveStatus(''), 3000)
      await fetchHistory()
    } catch (err: any) {
      setSaveStatus('Failed to save: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance Management</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Mark and view student attendance with real-time indicators</p>
          </div>
          <button onClick={fetchStudents} className="btn-secondary flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>

        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="card">
              <div className="flex flex-wrap gap-4 mb-6">
                <select className="input-field flex-1 min-w-[150px]" value={selectedGrade} onChange={e => setSelectedGrade(e.target.value)}>
                  <option>Select Grade</option>
                  {['Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12'].map(g => <option key={g}>{g}</option>)}
                </select>
                <select className="input-field flex-1 min-w-[150px]" value={selectedSection} onChange={e => setSelectedSection(e.target.value)}>
                  <option>Select Section</option>
                  {['A','B','C'].map(s => <option key={s}>{s}</option>)}
                </select>
                <input type="date" className="input-field flex-1 min-w-[150px]" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} />
              </div>

              <div className="flex gap-4 mb-6">
                <div className="flex-1 bg-success-50 dark:bg-success-900/20 rounded-lg p-3 text-center">
                  <CheckCircle className="h-6 w-6 text-success-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-success-700 dark:text-success-400">{attendanceSummary.present}</p>
                  <p className="text-sm text-success-600">Present</p>
                </div>
                <div className="flex-1 bg-error-50 dark:bg-error-900/20 rounded-lg p-3 text-center">
                  <XCircle className="h-6 w-6 text-error-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-error-700 dark:text-error-400">{attendanceSummary.absent}</p>
                  <p className="text-sm text-error-600">Absent</p>
                </div>
                <div className="flex-1 bg-primary-50 dark:bg-primary-900/20 rounded-lg p-3 text-center">
                  <Calendar className="h-6 w-6 text-primary-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-primary-700 dark:text-primary-400">{attendanceSummary.rate}%</p>
                  <p className="text-sm text-primary-600">Rate</p>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-3"></div>
                  <p className="text-gray-500">Loading students...</p>
                </div>
              ) : (
                <AttendanceTable
                  students={activeStudents}
                  attendance={attendance}
                  onAttendanceChange={handleAttendanceChange}
                  title={`Mark Attendance - ${selectedGrade} ${selectedSection}`}
                />
              )}

              <div className="flex items-center justify-between mt-4">
                {saveStatus && <p className="text-sm text-success-600 dark:text-success-400">{saveStatus}</p>}
                <button onClick={handleSaveAttendance} disabled={saving || activeStudents.length === 0} className="ml-auto btn-primary disabled:opacity-60">
                  {saving ? 'Saving...' : 'Save Attendance'}
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-4">Recent Records</h3>
            {historyRecords.length === 0 ? (
              <p className="text-sm text-gray-500">No attendance records yet.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {historyRecords.slice(0, 20).map((record: any) => (
                  <div key={record.id} className="flex justify-between text-sm p-2 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                    <span className="font-medium">Student #{record.student_id}</span>
                    <span className="text-gray-500">{record.date}</span>
                    <span className={record.status === 'present' ? 'text-success-600' : 'text-error-600'}>{record.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
