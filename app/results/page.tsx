'use client'

import { useMemo, useState, type FormEvent } from 'react'
import ResultsTable, { type ResultRow } from '@/components/results/ResultsTable'
import DashboardShell from '@/components/dashboard/layout/DashboardShell'
import { TrendingUp, Target, Award, Plus, X } from 'lucide-react'
import { useLocalStorageState } from '@/lib/useLocalStorage'
import { initialResults } from '@/lib/resultsData'
import { seedStudents } from '@/lib/seedData'
import type { Student } from '@/components/students/StudentTable'

export default function ResultsPage() {
  const [results, setResults] = useLocalStorageState('esm_results', initialResults)
  const [students] = useLocalStorageState<Student[]>('esm_students', seedStudents)
  const [search, setSearch] = useState('')
  const [gradeFilter, setGradeFilter] = useState('All Grades')
  const [sectionFilter, setSectionFilter] = useState('All Sections')
  const [subjectFilter, setSubjectFilter] = useState('All Subjects')
  const [page, setPage] = useState(1)
  const perPage = 5
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formError, setFormError] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState<number | ''>('')
  const [formData, setFormData] = useState({
    rollNo: '',
    name: '',
    classGrade: '',
    section: '',
    math: '',
    english: '',
    science: '',
    history: '',
  })

  const filteredResults = useMemo(() => {
    const filtered = results.filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(search.toLowerCase()) ||
        student.rollNo.toLowerCase().includes(search.toLowerCase())
      const matchesGrade = gradeFilter === 'All Grades' || student.classGrade === gradeFilter
      const matchesSection = sectionFilter === 'All Sections' || student.section === sectionFilter
      return matchesSearch && matchesGrade && matchesSection
    })

    if (subjectFilter === 'All Subjects') {
      return filtered
    }

    const subjectKeyMap: Record<string, keyof ResultRow> = {
      Mathematics: 'math',
      English: 'english',
      Science: 'science',
      History: 'history',
    }
    const subjectKey = subjectKeyMap[subjectFilter] || 'math'
    return [...filtered].sort((a, b) => {
      const scoreA = typeof a[subjectKey] === 'number' ? (a[subjectKey] as number) : 0
      const scoreB = typeof b[subjectKey] === 'number' ? (b[subjectKey] as number) : 0
      return scoreB - scoreA
    })
  }, [results, search, gradeFilter, sectionFilter, subjectFilter])

  const now = new Date()
  const academicStartYear = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1
  const academicYearLabel = `${academicStartYear}-${academicStartYear + 1}`

  const totalPages = Math.max(1, Math.ceil(filteredResults.length / perPage))
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * perPage
  const paginatedResults = filteredResults.slice(startIndex, startIndex + perPage)

  const averagePercentage =
    filteredResults.reduce((sum, student) => sum + student.percentage, 0) /
    (filteredResults.length || 1)
  const topStudent = filteredResults.reduce<ResultRow | null>((top, student) => {
    if (!top || student.percentage > top.percentage) return student
    return top
  }, null)
  const passRate =
    (filteredResults.filter((student) => student.percentage >= 50).length /
      (filteredResults.length || 1)) *
    100

  const gradeCounts = filteredResults.reduce<Record<string, number>>((acc, student) => {
    acc[student.grade] = (acc[student.grade] || 0) + 1
    return acc
  }, {})

  const subjectAverages = {
    Mathematics:
      filteredResults.reduce((sum, student) => sum + student.math, 0) /
      (filteredResults.length || 1),
    English:
      filteredResults.reduce((sum, student) => sum + student.english, 0) /
      (filteredResults.length || 1),
    Science:
      filteredResults.reduce((sum, student) => sum + student.science, 0) /
      (filteredResults.length || 1),
    History:
      filteredResults.reduce((sum, student) => sum + student.history, 0) /
      (filteredResults.length || 1),
  }

  const topPerformers = [...filteredResults]
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 3)
  const needsSupport = [...filteredResults]
    .sort((a, b) => a.percentage - b.percentage)
    .slice(0, 2)

  const handlePageChange = (nextPage: number) => {
    setPage(Math.min(Math.max(nextPage, 1), totalPages))
  }

  const handleSelectStudent = (studentId: number | '') => {
    setSelectedStudentId(studentId)
    if (!studentId) {
      setFormData((prev) => ({
        ...prev,
        rollNo: '',
        name: '',
        classGrade: '',
        section: '',
      }))
      return
    }
    const match = students.find((student) => student.id === Number(studentId))
    if (!match) return
    setFormData((prev) => ({
      ...prev,
      rollNo: match.rollNumber,
      name: match.name,
      classGrade: match.grade,
      section: match.section,
    }))
  }

  const calculateGrade = (percentage: number) => {
    if (percentage >= 90) return 'A+'
    if (percentage >= 80) return 'A'
    if (percentage >= 70) return 'B'
    if (percentage >= 60) return 'C'
    return 'D'
  }

  const calculateRemarks = (percentage: number) => {
    if (percentage >= 90) return 'Excellent'
    if (percentage >= 80) return 'Strong performance'
    if (percentage >= 70) return 'Satisfactory'
    if (percentage >= 60) return 'Average'
    return 'Needs improvement'
  }

  const parseScore = (value: string) => {
    const score = Number.parseFloat(value)
    if (Number.isNaN(score)) return 0
    return Math.min(Math.max(score, 0), 100)
  }

  const handleSaveResult = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError('')
    if (!formData.rollNo || !formData.classGrade || !formData.section) return
    const matchedStudent = students.find(
      (student) => student.rollNumber.toLowerCase() === formData.rollNo.trim().toLowerCase()
    )
    if (!matchedStudent) {
      setFormError('Select a registered student to record results.')
      return
    }

    const math = parseScore(formData.math)
    const english = parseScore(formData.english)
    const science = parseScore(formData.science)
    const history = parseScore(formData.history)
    const total = math + english + science + history
    const percentage = Number((total / 4).toFixed(1))
    const grade = calculateGrade(percentage)
    const remarks = calculateRemarks(percentage)
    const rollNo = matchedStudent.rollNumber
    const name = matchedStudent.name
    const classGrade = matchedStudent.grade
    const section = matchedStudent.section

    if (editingId) {
      setResults((prev) =>
        prev.map((row) =>
          row.id === editingId
            ? {
                ...row,
                rollNo,
                name,
                classGrade,
                section,
                math,
                english,
                science,
                history,
                total,
                percentage,
                grade,
                remarks,
              }
            : row
        )
      )
    } else {
      const nextId = results.length ? Math.max(...results.map((row) => row.id)) + 1 : 1
      setResults((prev) => [
        {
          id: nextId,
          rollNo,
          name,
          classGrade,
          section,
          math,
          english,
          science,
          history,
          total,
          percentage,
          grade,
          remarks,
        },
        ...prev,
      ])
    }

    setFormData({
      rollNo: '',
      name: '',
      classGrade: '',
      section: '',
      math: '',
      english: '',
      science: '',
      history: '',
    })
    setEditingId(null)
    setSelectedStudentId('')
    setShowForm(false)
    setPage(1)
  }

  const handleEditResult = (id: number) => {
    const result = results.find((row) => row.id === id)
    if (!result) return
    const match = students.find(
      (student) => student.rollNumber.toLowerCase() === result.rollNo.toLowerCase()
    )
    setSelectedStudentId(match ? match.id : '')
    setFormData({
      rollNo: result.rollNo,
      name: result.name,
      classGrade: result.classGrade,
      section: result.section,
      math: String(result.math),
      english: String(result.english),
      science: String(result.science),
      history: String(result.history),
    })
    setEditingId(id)
    setShowForm(true)
  }

  const handleRemoveResult = (id: number) => {
    setResults((prev) => prev.filter((row) => row.id !== id))
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Exam Results Management
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage and track student exam performance
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm((prev) => !prev)}
            className="btn-primary flex items-center gap-2"
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? 'Close Form' : 'Add Result'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSaveResult} className="card space-y-4">
            {formError && (
              <p className="text-sm text-error-600 dark:text-error-400">{formError}</p>
            )}
            {students.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No registered students yet. Add students before recording results.
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">Student *</label>
                <select
                  className="input-field mt-1"
                  value={selectedStudentId}
                  onChange={(event) =>
                    handleSelectStudent(event.target.value ? Number(event.target.value) : '')
                  }
                  required
                >
                  <option value="">Select student</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name} (Roll {student.rollNumber})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Roll No *</label>
                <input
                  type="text"
                  className="input-field mt-1"
                  value={formData.rollNo}
                  onChange={(event) => setFormData((prev) => ({ ...prev, rollNo: event.target.value }))}
                  required
                  readOnly
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Student Name *</label>
                <input
                  type="text"
                  className="input-field mt-1"
                  value={formData.name}
                  onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                  required
                  readOnly
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Grade *</label>
                <select
                  className="input-field mt-1"
                  value={formData.classGrade}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, classGrade: event.target.value }))
                  }
                  required
                  disabled
                >
                  <option value="">Select</option>
                  <option>Grade 7</option>
                  <option>Grade 8</option>
                  <option>Grade 9</option>
                  <option>Grade 10</option>
                  <option>Grade 11</option>
                  <option>Grade 12</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Section *</label>
                <select
                  className="input-field mt-1"
                  value={formData.section}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, section: event.target.value }))
                  }
                  required
                  disabled
                >
                  <option value="">Select</option>
                  <option>A</option>
                  <option>B</option>
                  <option>C</option>
                </select>
              </div>
              {[
                { label: 'Math', key: 'math' },
                { label: 'English', key: 'english' },
                { label: 'Science', key: 'science' },
                { label: 'History', key: 'history' },
              ].map((subject) => (
                <div key={subject.key}>
                  <label className="text-sm text-gray-600 dark:text-gray-400">{subject.label}</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="input-field mt-1"
                    value={(formData as Record<string, string>)[subject.key]}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, [subject.key]: event.target.value }))
                    }
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                  setSelectedStudentId('')
                }}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                {editingId ? 'Update Result' : 'Save Result'}
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Average Score</h3>
              <TrendingUp className="h-5 w-5 text-success-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {averagePercentage.toFixed(1)}%
            </p>
            <p className="text-sm text-success-600 dark:text-success-400 mt-1">
              {filteredResults.length} students tracked
            </p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Highest Score</h3>
              <Award className="h-5 w-5 text-warning-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {topStudent ? `${topStudent.percentage}%` : '--'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {topStudent ? topStudent.name : 'No data'}
            </p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Pass Percentage</h3>
              <Target className="h-5 w-5 text-primary-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {passRate.toFixed(0)}%
            </p>
            <p className="text-sm text-success-600 dark:text-success-400 mt-1">
              {Math.max(passRate - 85, 0).toFixed(0)}% above 85% target
            </p>
          </div>

          <div className="card">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Exam Details</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Academic Year:</span>
                  <span className="font-medium">{academicYearLabel}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Grade/Class:</span>
                  <span className="font-medium">
                    {gradeFilter === 'All Grades' ? 'All Grades' : gradeFilter}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Subject:</span>
                  <span className="font-medium">{subjectFilter}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search student..."
                className="input-field"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPage(1)
                }}
              />
            </div>
            <select
              className="input-field flex-1 min-w-[150px]"
              value={gradeFilter}
              onChange={(event) => {
                setGradeFilter(event.target.value)
                setPage(1)
              }}
            >
              <option>All Grades</option>
              <option>Grade 7</option>
              <option>Grade 8</option>
              <option>Grade 9</option>
              <option>Grade 10</option>
              <option>Grade 11</option>
              <option>Grade 12</option>
            </select>
            <select
              className="input-field flex-1 min-w-[150px]"
              value={sectionFilter}
              onChange={(event) => {
                setSectionFilter(event.target.value)
                setPage(1)
              }}
            >
              <option>All Sections</option>
              <option>Section A</option>
              <option>Section B</option>
              <option>Section C</option>
            </select>
            <select
              className="input-field flex-1 min-w-[150px]"
              value={subjectFilter}
              onChange={(event) => {
                setSubjectFilter(event.target.value)
                setPage(1)
              }}
            >
              <option>All Subjects</option>
              <option>Mathematics</option>
              <option>English</option>
              <option>Science</option>
              <option>History</option>
            </select>
          </div>

          <ResultsTable
            results={paginatedResults}
            onEdit={handleEditResult}
            onRemove={handleRemoveResult}
          />

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredResults.length === 0 ? 0 : startIndex + 1}-
              {Math.min(startIndex + perPage, filteredResults.length)} of{' '}
              {filteredResults.length} students
            </p>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => handlePageChange(pageNumber)}
                  className={`px-3 py-1 rounded text-sm ${
                    pageNumber === currentPage
                      ? 'bg-primary-600 text-white'
                      : 'border border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {pageNumber}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div>
              <h4 className="font-semibold mb-4">Grade Distribution</h4>
              <div className="space-y-2">
                {[
                  { grade: 'A+', color: 'bg-success-500' },
                  { grade: 'A', color: 'bg-success-400' },
                  { grade: 'B', color: 'bg-warning-400' },
                  { grade: 'C', color: 'bg-warning-500' },
                  { grade: 'D', color: 'bg-error-500' },
                ].map((item) => {
                  const count = gradeCounts[item.grade] || 0
                  return (
                  <div key={item.grade} className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300">{item.grade}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`${item.color} h-2 rounded-full`}
                          style={{
                            width: `${filteredResults.length ? (count / filteredResults.length) * 100 : 0}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  </div>
                )})}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Subject Performance</h4>
              <div className="space-y-2">
                {Object.entries(subjectAverages).map(([subject, average]) => (
                  <div key={subject} className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300">{subject}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-primary-500 h-2 rounded-full"
                          style={{ width: `${average}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{average.toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Performance Highlights</h4>
              <div className="space-y-4">
                <div>
                  <h5 className="text-sm font-medium text-success-600 dark:text-success-400 mb-2">
                    TOP PERFORMERS
                  </h5>
                  <ul className="space-y-1">
                    {topPerformers.map((student) => (
                      <li key={student.id} className="text-sm">
                        {student.name}: {student.percentage}%
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-error-600 dark:text-error-400 mb-2">
                    NEEDS SUPPORT
                  </h5>
                  <ul className="space-y-1">
                    {needsSupport.map((student) => (
                      <li key={student.id} className="text-sm">
                        {student.name}: {student.percentage}%
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
