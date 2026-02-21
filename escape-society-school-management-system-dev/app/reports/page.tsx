'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import DashboardShell from '@/components/dashboard/layout/DashboardShell'
import {
  AlertTriangle,
  BarChart3,
  Calendar,
  Clock,
  Download,
  FileText,
  Filter,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { useLocalStorageState } from '@/lib/useLocalStorage'
import { initialAttendanceHistory } from '@/lib/attendanceData'
import { initialResults } from '@/lib/resultsData'
import { initialPayments } from '@/lib/paymentsData'
import { initialEvents } from '@/lib/eventsData'
import { initialDocuments } from '@/lib/documentsData'

const reportStatusStyles: Record<string, string> = {
  Ready: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300',
  Processing: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300',
  'Needs Review': 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-300',
  Scheduled: 'bg-info-100 text-info-700 dark:bg-info-900/30 dark:text-info-300',
}

const initialReports: Array<{
  id: number
  name: string
  type: string
  generated: string
  owner: string
  status: string
  size: string
  createdAt?: number
  readyAt?: number
  records?: number
}> = []

const initialSchedules: Array<{
  id: number
  name: string
  reportId: number
  frequency: string
  nextRun: string
  recipients: string
  createdAt?: number
}> = []

const templates = [
  'Daily Attendance',
  'Fee Aging Summary',
  'Grade Distribution',
  'Teacher Workload',
  'Parent Engagement',
  'Exam Trends',
]

export default function ReportsPage() {
  const [profile] = useLocalStorageState('esm_profile', {
    name: '',
    role: '',
    email: '',
    phone: '',
  })
  const [reports, setReports] = useLocalStorageState('esm_reports', initialReports)
  const [schedules, setSchedules] = useLocalStorageState('esm_report_schedules', initialSchedules)
  const hasReports = reports.length > 0
  const [attendanceHistory] = useLocalStorageState(
    'esm_attendance_history',
    initialAttendanceHistory
  )
  const [results] = useLocalStorageState('esm_results', initialResults)
  const [payments] = useLocalStorageState('esm_payments', initialPayments)
  const [events] = useLocalStorageState('esm_events', initialEvents)
  const [documents] = useLocalStorageState('esm_documents', initialDocuments)
  const [teachers] = useLocalStorageState('esm_teachers', [])
  const [reportType, setReportType] = useState('Report Type')
  const [academicYear, setAcademicYear] = useState('Academic Year')
  const [gradeLevel, setGradeLevel] = useState('Grade')
  const [term, setTerm] = useState('Term')
  const [searchTag, setSearchTag] = useState('')
  const [exportStatus, setExportStatus] = useState('')
  const [reportStatus, setReportStatus] = useState('')
  const [templateStatus, setTemplateStatus] = useState('')
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [scheduleStatus, setScheduleStatus] = useState('')
  const [scheduleForm, setScheduleForm] = useState({
    reportId: 0,
    frequency: 'Weekly',
    nextRun: '',
    recipients: '',
  })

  useEffect(() => {
    if (!reports.length) {
      if (scheduleForm.reportId !== 0) {
        setScheduleForm((prev) => ({ ...prev, reportId: 0 }))
      }
      return
    }
    if (!reports.find((report) => report.id === scheduleForm.reportId)) {
      setScheduleForm((prev) => ({ ...prev, reportId: reports[0].id }))
    }
  }, [reports, scheduleForm.reportId])

  useEffect(() => {
    if (!schedules.length) return
    const reportIds = new Set(reports.map((report) => report.id))
    const cleaned = schedules.filter(
      (schedule) => schedule.reportId && reportIds.has(schedule.reportId)
    )
    if (cleaned.length !== schedules.length) {
      setSchedules(cleaned)
    }
  }, [reports, schedules, setSchedules])

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      if (!searchTag) return true
      const query = searchTag.toLowerCase()
      return (
        report.name.toLowerCase().includes(query) ||
        report.type.toLowerCase().includes(query) ||
        report.owner.toLowerCase().includes(query)
      )
    })
  }, [reports, searchTag])

  const reportCategories = useMemo(() => {
    const palette: Record<string, string> = {
      Attendance: 'bg-primary-500',
      Academics: 'bg-accent-500',
      Results: 'bg-accent-500',
      Finance: 'bg-warning-500',
      Operations: 'bg-info-500',
      HR: 'bg-secondary-500',
      General: 'bg-slate-500',
    }
    const totals = reports.reduce<Record<string, number>>((acc, report) => {
      const key = report.type || 'General'
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})
    const total = reports.length || 1
    return Object.entries(totals).map(([label, count]) => ({
      label,
      value: Math.round((count / total) * 100),
      color: palette[label] || 'bg-slate-500',
    }))
  }, [reports])

  const avgDeliveryMinutes = useMemo(() => {
    const completed = reports.filter((report) => report.createdAt && report.readyAt)
    if (!completed.length) return null
    const averageMs =
      completed.reduce((sum, report) => sum + (report.readyAt! - report.createdAt!), 0) /
      completed.length
    return Math.round(averageMs / 60000)
  }, [reports])

  const nextScheduledRun = useMemo(() => {
    if (!schedules.length) return 'No schedules yet'
    const sorted = [...schedules].sort((a, b) => a.nextRun.localeCompare(b.nextRun))
    return sorted[0]?.nextRun || 'No schedules yet'
  }, [schedules])

  const dataCounts = useMemo(() => {
    const operationsCount = events.length + documents.length
    const generalCount =
      attendanceHistory.length +
      results.length +
      payments.length +
      operationsCount +
      teachers.length
    return {
      Attendance: attendanceHistory.length,
      'Academic Results': results.length,
      Finance: payments.length,
      Operations: operationsCount,
      HR: teachers.length,
      General: generalCount,
    }
  }, [attendanceHistory, results, payments, events, documents, teachers])

  const handleRunReport = () => {
    setReportStatus('')
    const nextId = reports.length ? Math.max(...reports.map((report) => report.id)) + 1 : 1
    const resolvedType = reportType === 'Report Type' ? 'General' : reportType
    const dataCount = dataCounts[resolvedType as keyof typeof dataCounts] ?? 0
    if (!dataCount) {
      setReportStatus(`No ${resolvedType.toLowerCase()} data yet. Add records to generate reports.`)
      setTimeout(() => setReportStatus(''), 2000)
      return
    }
    const resolvedGrade = gradeLevel === 'Grade' ? '' : ` - ${gradeLevel}`
    const resolvedYear = academicYear === 'Academic Year' ? '' : ` ${academicYear}`
    const resolvedTerm = term === 'Term' ? '' : ` ${term}`
    const generated = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    })
    const createdAt = Date.now()
    const sizeEstimate = Math.max(0.5, Math.min(12.0, 0.5 + dataCount / 50))
    const newReport = {
      id: nextId,
      name: `${resolvedType} Report${resolvedGrade}${resolvedYear}${resolvedTerm}`,
      type: resolvedType,
      generated,
      owner: profile.name || 'Analytics Hub',
      status: 'Processing',
      size: `${sizeEstimate.toFixed(1)} MB`,
      createdAt,
      records: dataCount,
    }

    setReports((prev) => [newReport, ...prev])
    setTimeout(() => {
      setReports((prev) =>
        prev.map((report) =>
          report.id === nextId ? { ...report, status: 'Ready', readyAt: Date.now() } : report
        )
      )
    }, 1200)
  }

  const handleExport = () => {
    if (!filteredReports.length) {
      setExportStatus('No reports to export yet.')
      setTimeout(() => setExportStatus(''), 2000)
      return
    }
    setExportStatus(`Exported ${filteredReports.length} reports just now.`)
    setTimeout(() => setExportStatus(''), 2000)
  }

  const handleToggleStatus = (id: number) => {
    const statusOrder = ['Ready', 'Processing', 'Needs Review', 'Scheduled']
    setReports((prev) =>
      prev.map((report) => {
        if (report.id !== id) return report
        const nextStatus =
          statusOrder[(statusOrder.indexOf(report.status) + 1) % statusOrder.length]
        return { ...report, status: nextStatus }
      })
    )
  }

  const handleRemoveReport = (id: number) => {
    setReports((prev) => prev.filter((report) => report.id !== id))
  }

  const handleSaveSchedule = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setScheduleStatus('')
    const selectedReport = reports.find((report) => report.id === scheduleForm.reportId)
    if (!selectedReport) {
      setScheduleStatus('Generate a report before scheduling.')
      setTimeout(() => setScheduleStatus(''), 2000)
      return
    }
    if (!scheduleForm.nextRun || !scheduleForm.recipients) return
    setSchedules((prev) => [
      {
        id: Date.now(),
        reportId: selectedReport.id,
        name: selectedReport.name,
        frequency: scheduleForm.frequency,
        nextRun: scheduleForm.nextRun,
        recipients: scheduleForm.recipients,
        createdAt: Date.now(),
      },
      ...prev,
    ])
    setScheduleForm((prev) => ({
      ...prev,
      nextRun: '',
      recipients: '',
    }))
    setShowScheduleForm(false)
  }

  const handleSaveTemplate = () => {
    setTemplateStatus('Template saved.')
    setTimeout(() => setTemplateStatus(''), 2000)
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary-500" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Reports & Analytics
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Build, schedule, and export actionable reports for stakeholders across the school.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="btn-secondary flex items-center gap-2" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Export Data
            </button>
            <button className="btn-primary flex items-center gap-2" onClick={handleRunReport}>
              <Sparkles className="h-4 w-4" />
              Generate Report
            </button>
          </div>
        </div>

        {showScheduleForm && (
          <form onSubmit={handleSaveSchedule} className="card">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <select
                value={scheduleForm.reportId}
                onChange={(event) =>
                  setScheduleForm((prev) => ({ ...prev, reportId: Number(event.target.value) }))
                }
                className="input-field"
                disabled={!hasReports}
                required
              >
                {!hasReports && <option value={0}>Generate a report first</option>}
                {hasReports &&
                  reports.map((report) => (
                    <option key={report.id} value={report.id}>
                      {report.name}
                    </option>
                  ))}
              </select>
              <select
                value={scheduleForm.frequency}
                onChange={(event) =>
                  setScheduleForm((prev) => ({ ...prev, frequency: event.target.value }))
                }
                className="input-field"
                disabled={!hasReports}
              >
                <option>Weekly</option>
                <option>Monthly</option>
                <option>Quarterly</option>
              </select>
              <input
                type="date"
                value={scheduleForm.nextRun}
                onChange={(event) =>
                  setScheduleForm((prev) => ({ ...prev, nextRun: event.target.value }))
                }
                className="input-field"
                disabled={!hasReports}
                required
              />
              <input
                type="text"
                value={scheduleForm.recipients}
                onChange={(event) =>
                  setScheduleForm((prev) => ({ ...prev, recipients: event.target.value }))
                }
                className="input-field"
                placeholder="Recipients"
                disabled={!hasReports}
                required
              />
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowScheduleForm(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Save Schedule
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Reports Generated</h3>
              <FileText className="h-5 w-5 text-primary-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{reports.length}</p>
            <p className="text-sm text-success-600 dark:text-success-400 mt-1">
              {reports.filter((report) => report.status === 'Ready').length} ready to export
            </p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Scheduled Reports</h3>
              <Calendar className="h-5 w-5 text-info-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{schedules.length}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Next run: {nextScheduledRun}
            </p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Pending Reviews</h3>
              <AlertTriangle className="h-5 w-5 text-warning-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {reports.filter((report) => report.status === 'Needs Review').length}
            </p>
            <p className="text-sm text-warning-600 dark:text-warning-400 mt-1">
              {reports.filter((report) => report.status === 'Processing').length} processing
            </p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Avg Delivery Time</h3>
              <Clock className="h-5 w-5 text-success-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {avgDeliveryMinutes === null ? '--' : `${avgDeliveryMinutes}m`}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {avgDeliveryMinutes === null
                ? 'No report timing yet.'
                : 'Average time to generate.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <h3 className="text-lg font-semibold">Report Builder</h3>
            </div>
              <button
                type="button"
                className="btn-secondary text-sm px-3 py-1.5"
                onClick={handleSaveTemplate}
              >
                Save Template
              </button>
            </div>
            {templateStatus && (
              <p className="text-sm text-success-600 dark:text-success-400 mb-4">
                {templateStatus}
              </p>
            )}
            {reportStatus && (
              <p className="text-sm text-warning-600 dark:text-warning-400 mb-4">
                {reportStatus}
              </p>
            )}

              <div className="flex flex-wrap gap-4">
                <select
                  className="input-field flex-1 min-w-[160px]"
                  value={reportType}
                  onChange={(event) => setReportType(event.target.value)}
                >
                  <option>Report Type</option>
                  <option>Attendance</option>
                  <option>Academic Results</option>
                  <option>Finance</option>
                  <option>Operations</option>
                  <option>HR</option>
                </select>
                <select
                  className="input-field flex-1 min-w-[160px]"
                  value={academicYear}
                  onChange={(event) => setAcademicYear(event.target.value)}
                >
                  <option>Academic Year</option>
                  <option>2025-2026</option>
                  <option>2024-2025</option>
                  <option>2023-2024</option>
                </select>
                <select
                  className="input-field flex-1 min-w-[160px]"
                  value={gradeLevel}
                  onChange={(event) => setGradeLevel(event.target.value)}
                >
                  <option>Grade</option>
                  <option>Grade 7</option>
                  <option>Grade 8</option>
                  <option>Grade 9</option>
                  <option>Grade 10</option>
                  <option>Grade 11</option>
                  <option>Grade 12</option>
                </select>
                <select
                  className="input-field flex-1 min-w-[160px]"
                  value={term}
                  onChange={(event) => setTerm(event.target.value)}
                >
                  <option>Term</option>
                  <option>Term 1</option>
                  <option>Term 2</option>
                  <option>Term 3</option>
                </select>
                <div className="flex-1 min-w-[200px]">
                  <input
                    type="text"
                    placeholder="Search student, class, or tag"
                    className="input-field"
                    value={searchTag}
                    onChange={(event) => setSearchTag(event.target.value)}
                  />
                </div>
                <button type="button" className="btn-primary" onClick={handleRunReport}>
                  Run Report
                </button>
              </div>

              <div className="mt-6">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Popular Templates
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {templates.map((template) => (
                    <button
                      key={template}
                      type="button"
                      onClick={() => setSearchTag(template)}
                      className="px-3 py-1.5 rounded-full text-sm font-medium bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/50 transition"
                    >
                      {template}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Recent Reports</h3>
                <button className="btn-secondary text-sm px-3 py-1.5">
                  View All
                </button>
              </div>
              {exportStatus && (
                <p className="mb-3 text-sm text-success-600 dark:text-success-400">
                  {exportStatus}
                </p>
              )}

              <div className="table-container">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="table-header">Report</th>
                      <th className="table-header">Owner</th>
                      <th className="table-header">Generated</th>
                      <th className="table-header">Status</th>
                      <th className="table-header">Size</th>
                      <th className="table-header text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.length === 0 ? (
                      <tr>
                        <td className="table-cell text-center text-gray-500 dark:text-gray-400" colSpan={6}>
                          No reports generated yet.
                        </td>
                      </tr>
                    ) : (
                      filteredReports.map((report) => (
                        <tr
                          key={report.id}
                          className="border-b border-slate-200 dark:border-slate-700"
                        >
                          <td className="table-cell">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {report.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {report.type}
                              {typeof report.records === 'number'
                                ? ` • ${report.records} records`
                                : ''}
                            </div>
                          </td>
                          <td className="table-cell">{report.owner}</td>
                          <td className="table-cell">{report.generated}</td>
                          <td className="table-cell">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(report.id)}
                              className={`status-badge ${reportStatusStyles[report.status]}`}
                            >
                              {report.status}
                            </button>
                          </td>
                          <td className="table-cell">{report.size}</td>
                          <td className="table-cell text-right">
                            <div className="flex items-center justify-end gap-3">
                              <button className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                                Download
                              </button>
                              <button
                                type="button"
                                className="text-sm text-error-600 dark:text-error-400 hover:underline"
                                onClick={() => handleRemoveReport(report.id)}
                              >
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Scheduled Reports</h3>
                <Calendar className="h-5 w-5 text-primary-500" />
              </div>
              <button
                type="button"
                className="btn-secondary text-sm px-3 py-1.5 mb-4"
                onClick={() => setShowScheduleForm((prev) => !prev)}
                disabled={!hasReports}
              >
                {showScheduleForm ? 'Hide Form' : 'Add Schedule'}
              </button>
              {!hasReports && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Generate a report to enable scheduling.
                </p>
              )}
              {scheduleStatus && (
                <p className="text-sm text-warning-600 dark:text-warning-400 mb-3">
                  {scheduleStatus}
                </p>
              )}
              <div className="space-y-4">
                {schedules.length === 0 ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    No scheduled reports yet.
                  </p>
                ) : (
                  schedules.map((report) => (
                    <div
                      key={`${report.id ?? report.name}-${report.nextRun}`}
                      className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {report.name}
                        </p>
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                          {report.frequency}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Next run: {report.nextRun}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Recipients: {report.recipients}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Report Distribution</h3>
                <TrendingUp className="h-5 w-5 text-success-500" />
              </div>
              <div className="space-y-3">
                {reportCategories.length === 0 ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    No report data yet.
                  </p>
                ) : (
                  reportCategories.map((category) => (
                    <div key={category.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {category.label}
                        </span>
                        <span className="text-sm font-medium">{category.value}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`${category.color} h-2 rounded-full`}
                          style={{ width: `${category.value}%` }}
                        ></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <button className="w-full mt-4 text-sm btn-secondary py-2">
                View Detailed Analytics
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
