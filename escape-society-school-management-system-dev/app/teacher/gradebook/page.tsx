'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { ClipboardList, Edit3, Plus, Search, Trash2 } from 'lucide-react'
import { useLocalStorageState } from '@/lib/useLocalStorage'
import { seedStudents } from '@/lib/seedData'
import {
  initialTeacherClasses,
  initialTeacherGradebook,
  TeacherClass,
  TeacherGradeEntry,
} from '@/lib/portalData'
import type { ResultRow } from '@/components/results/ResultsTable'
import { initialResults } from '@/lib/resultsData'

const subjectOptions = ['Mathematics', 'English', 'Science', 'History']

const gradeLetter = (score: number, maxScore: number) => {
  if (!maxScore) return 'N/A'
  const ratio = score / maxScore
  if (ratio >= 0.9) return 'A'
  if (ratio >= 0.8) return 'B'
  if (ratio >= 0.7) return 'C'
  if (ratio >= 0.6) return 'D'
  return 'F'
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

export default function TeacherGradebookPage() {
  const [classes] = useLocalStorageState<TeacherClass[]>(
    'esm_teacher_classes',
    initialTeacherClasses
  )
  const [gradebook, setGradebook] = useLocalStorageState<TeacherGradeEntry[]>(
    'esm_teacher_gradebook',
    initialTeacherGradebook
  )
  const [results, setResults] = useLocalStorageState<ResultRow[]>(
    'esm_results',
    initialResults
  )
  const [students] = useLocalStorageState('esm_students', seedStudents)
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('All Classes')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({
    classId: classes[0]?.id ?? 0,
    studentId: '',
    studentName: '',
    subject: subjectOptions[0],
    assignment: '',
    score: '',
    maxScore: '100',
    date: new Date().toISOString().slice(0, 10),
  })

  const selectedClass = classes.find((item) => item.id === Number(form.classId))
  const roster = useMemo(() => {
    if (!selectedClass) return []
    return students.filter(
      (student) =>
        student.grade === selectedClass.grade &&
        student.section === selectedClass.section
    )
  }, [selectedClass, students])

  const classOptions = ['All Classes', ...classes.map((item) => `${item.id}`)]

  const filteredGradebook = useMemo(() => {
    return gradebook.filter((entry) => {
      const matchesSearch =
        entry.studentName.toLowerCase().includes(search.toLowerCase()) ||
        entry.assignment.toLowerCase().includes(search.toLowerCase()) ||
        entry.subject.toLowerCase().includes(search.toLowerCase())
      const matchesClass =
        classFilter === 'All Classes' || entry.classId === Number(classFilter)
      return matchesSearch && matchesClass
    })
  }, [gradebook, search, classFilter])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const score = Number(form.score)
    const maxScore = Number(form.maxScore)
    const studentId = Number(form.studentId)
    const resolvedStudent = roster.find((student) => student.id === studentId)
    const studentName = resolvedStudent?.name || form.studentName || 'Student'
    const rollNo = resolvedStudent?.rollNumber ?? `S-${studentId || Date.now()}`
    const entry: TeacherGradeEntry = {
      id: editingId ?? Date.now(),
      classId: Number(form.classId),
      studentId: studentId || Date.now(),
      studentName,
      subject: form.subject.trim(),
      assignment: form.assignment.trim(),
      score: Number.isNaN(score) ? 0 : score,
      maxScore: Number.isNaN(maxScore) ? 100 : maxScore,
      grade: gradeLetter(score, maxScore),
      date: form.date,
    }

    if (editingId) {
      setGradebook((prev) =>
        prev.map((item) => (item.id === editingId ? entry : item))
      )
    } else {
      setGradebook((prev) => [entry, ...prev])
    }

    const subjectKeyMap: Record<string, keyof ResultRow> = {
      Mathematics: 'math',
      English: 'english',
      Science: 'science',
      History: 'history',
    }
    const subjectKey = subjectKeyMap[form.subject] || 'math'
    setResults((prev) => {
      const existing = prev.find((row) => row.rollNo === rollNo)
      const base = existing || {
        id: prev.length ? Math.max(...prev.map((row) => row.id)) + 1 : 1,
        rollNo,
        name: studentName,
        classGrade: resolvedStudent?.grade || selectedClass?.grade || 'Grade 9',
        section: resolvedStudent?.section || selectedClass?.section || 'A',
        math: 0,
        english: 0,
        science: 0,
        history: 0,
        total: 0,
        percentage: 0,
        grade: 'D',
        remarks: 'Needs improvement',
      }
      const updatedRow = {
        ...base,
        name: studentName,
        classGrade: resolvedStudent?.grade || base.classGrade,
        section: resolvedStudent?.section || base.section,
        [subjectKey]: Number.isNaN(score) ? 0 : score,
      } as ResultRow
      const total =
        updatedRow.math + updatedRow.english + updatedRow.science + updatedRow.history
      const percentage = Number((total / 4).toFixed(1))
      const grade = calculateGrade(percentage)
      const remarks = calculateRemarks(percentage)
      const finalRow = {
        ...updatedRow,
        total,
        percentage,
        grade,
        remarks,
      }
      if (existing) {
        return prev.map((row) => (row.id === existing.id ? finalRow : row))
      }
      return [finalRow, ...prev]
    })

    setEditingId(null)
    setForm({
      classId: classes[0]?.id ?? 0,
      studentId: '',
      studentName: '',
      subject: subjectOptions[0],
      assignment: '',
      score: '',
      maxScore: '100',
      date: new Date().toISOString().slice(0, 10),
    })
  }

  const handleEdit = (entry: TeacherGradeEntry) => {
    setEditingId(entry.id)
    setForm({
      classId: entry.classId,
      studentId: `${entry.studentId}`,
      studentName: entry.studentName,
      subject: entry.subject,
      assignment: entry.assignment,
      score: `${entry.score}`,
      maxScore: `${entry.maxScore}`,
      date: entry.date,
    })
  }

  const handleRemove = (id: number) => {
    setGradebook((prev) => prev.filter((item) => item.id !== id))
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-primary-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gradebook
          </h2>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Record scores, update grades, and review performance in real time.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {editingId ? 'Edit Grade Entry' : 'Add Grade Entry'}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Class</label>
            <select
              className="input-field"
              value={form.classId}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, classId: Number(event.target.value) }))
              }
            >
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.grade} {item.section} - {item.subject}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Student</label>
            {roster.length ? (
              <select
                className="input-field"
                value={form.studentId}
                onChange={(event) => {
                  const selected = roster.find(
                    (student) => student.id === Number(event.target.value)
                  )
                  setForm((prev) => ({
                    ...prev,
                    studentId: event.target.value,
                    studentName: selected?.name || prev.studentName,
                  }))
                }}
              >
                <option value="">Select student</option>
                {roster.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className="input-field"
                value={form.studentName}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, studentName: event.target.value }))
                }
                placeholder="Student name"
              />
            )}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Subject</label>
            <select
              className="input-field"
              value={form.subject}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, subject: event.target.value }))
              }
            >
              {subjectOptions.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-3">
            <label className="block text-sm font-medium mb-2">Assignment</label>
            <input
              className="input-field"
              value={form.assignment}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, assignment: event.target.value }))
              }
              placeholder="Assignment or assessment name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Score</label>
            <input
              type="number"
              className="input-field"
              value={form.score}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, score: event.target.value }))
              }
              min={0}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Max</label>
            <input
              type="number"
              className="input-field"
              value={form.maxScore}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, maxScore: event.target.value }))
              }
              min={1}
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Date</label>
            <input
              type="date"
              className="input-field"
              value={form.date}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, date: event.target.value }))
              }
            />
          </div>
        </div>

        <button type="submit" className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {editingId ? 'Update Entry' : 'Add Entry'}
        </button>
      </form>

      <div className="card space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              className="input-field pl-10"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search gradebook"
            />
          </div>
          <select
            className="input-field w-full lg:w-60"
            value={classFilter}
            onChange={(event) => setClassFilter(event.target.value)}
          >
            {classOptions.map((option) => {
              if (option === 'All Classes') {
                return (
                  <option key={option} value={option}>
                    {option}
                  </option>
                )
              }
              const classInfo = classes.find((item) => item.id === Number(option))
              return (
                <option key={option} value={option}>
                  {classInfo ? `${classInfo.grade} ${classInfo.section} - ${classInfo.subject}` : 'Class'}
                </option>
              )
            })}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <th className="py-3 px-2">Student</th>
                <th className="py-3 px-2">Assignment</th>
                <th className="py-3 px-2">Score</th>
                <th className="py-3 px-2">Grade</th>
                <th className="py-3 px-2">Date</th>
                <th className="py-3 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGradebook.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-gray-100 dark:border-gray-800"
                >
                  <td className="py-3 px-2">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {entry.studentName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {entry.subject}
                    </p>
                  </td>
                  <td className="py-3 px-2">{entry.assignment}</td>
                  <td className="py-3 px-2">
                    {entry.score}/{entry.maxScore}
                  </td>
                  <td className="py-3 px-2">
                    <span className="px-2 py-1 rounded-full text-xs bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400">
                      {entry.grade}
                    </span>
                  </td>
                  <td className="py-3 px-2">{entry.date}</td>
                  <td className="py-3 px-2 text-right space-x-2">
                    <button
                      className="text-primary-600 dark:text-primary-400"
                      onClick={() => handleEdit(entry)}
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      className="text-error-600 dark:text-error-400"
                      onClick={() => handleRemove(entry.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredGradebook.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No grade entries match your filters.
          </p>
        )}
      </div>
    </div>
  )
}
