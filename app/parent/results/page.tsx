'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { BookOpen, CheckCircle, MessageSquare } from 'lucide-react'
import { useLocalStorageState } from '@/lib/useLocalStorage'
import { seedStudents } from '@/lib/seedData'
import type { ResultRow } from '@/components/results/ResultsTable'
import { initialResults } from '@/lib/resultsData'

type ParentNote = {
  resultId: number
  note: string
}

export default function ParentResultsPage() {
  const [students] = useLocalStorageState('esm_students', seedStudents)
  const [linkedStudents] = useLocalStorageState<number[]>(
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
  const [results] = useLocalStorageState<ResultRow[]>('esm_results', initialResults)
  const [notes, setNotes] = useLocalStorageState<ParentNote[]>('esm_parent_result_notes', [])
  const [acknowledged, setAcknowledged] = useLocalStorageState<number[]>(
    'esm_parent_results_ack',
    []
  )
  const [childFilter, setChildFilter] = useState('All Children')
  const [gradeFilter, setGradeFilter] = useState('All Grades')
  const [noteForm, setNoteForm] = useState({
    resultId: results[0]?.id ?? 0,
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
  const linkedRolls = schoolStudents
    .filter((student) => linkedStudents.includes(student.id))
    .map((student) => student.rollNumber)

  const filteredResults = useMemo(() => {
    return results.filter((result) => {
      const matchesChild =
        childFilter === 'All Children' || result.rollNo === childFilter
      const matchesGrade = gradeFilter === 'All Grades' || result.classGrade === gradeFilter
      return linkedRolls.includes(result.rollNo) && matchesChild && matchesGrade
    })
  }, [results, linkedRolls, childFilter, gradeFilter])

  const handleAcknowledge = (id: number) => {
    setAcknowledged((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
    )
  }

  const handleNoteSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!noteForm.note.trim()) return
    setNotes((prev) => {
      const existing = prev.find((note) => note.resultId === noteForm.resultId)
      if (existing) {
        return prev.map((note) =>
          note.resultId === noteForm.resultId
            ? { ...note, note: noteForm.note.trim() }
            : note
        )
      }
      return [...prev, { resultId: noteForm.resultId, note: noteForm.note.trim() }]
    })
    setNoteForm((prev) => ({ ...prev, note: '' }))
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Results & Report Cards
          </h2>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Review performance synced from the school results database.
        </p>
      </div>

      <form onSubmit={handleNoteSubmit} className="card space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Add Parent Note
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Result Entry</label>
            <select
              className="input-field"
              value={noteForm.resultId}
              onChange={(event) =>
                setNoteForm((prev) => ({ ...prev, resultId: Number(event.target.value) }))
              }
            >
              {filteredResults.map((result) => (
                <option key={result.id} value={result.id}>
                  {result.name} ({result.classGrade} {result.section})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Note</label>
            <input
              className="input-field"
              value={noteForm.note}
              onChange={(event) => setNoteForm((prev) => ({ ...prev, note: event.target.value }))}
              placeholder="Add a quick comment"
            />
          </div>
        </div>
        <button className="btn-primary flex items-center gap-2" type="submit">
          <MessageSquare className="h-4 w-4" />
          Save Note
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
            {linkedRolls.map((roll) => {
              const student = schoolStudents.find((item) => item.rollNumber === roll)
              return (
                <option key={roll} value={roll}>
                  {student?.name || roll}
                </option>
              )
            })}
          </select>
          <select
            className="input-field w-full lg:w-40"
            value={gradeFilter}
            onChange={(event) => setGradeFilter(event.target.value)}
          >
            <option value="All Grades">All Grades</option>
            {Array.from(new Set(filteredResults.map((result) => result.classGrade))).map(
              (grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              )
            )}
          </select>
        </div>

        <div className="space-y-3">
          {filteredResults.map((result) => {
            const note = notes.find((item) => item.resultId === result.id)
            const isAcknowledged = acknowledged.includes(result.id)
            return (
              <div
                key={result.id}
                className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {result.name} - {result.classGrade} {result.section}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Roll {result.rollNo} | Overall {result.percentage}%
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                    Math {result.math} | English {result.english} | Science {result.science} | History {result.history}
                  </p>
                  {note?.note && (
                    <p className="text-sm text-primary-600 dark:text-primary-400 mt-2">
                      Parent note: {note.note}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-primary-600 dark:text-primary-400">
                    {result.grade}
                  </span>
                  <button
                    className={`flex items-center gap-2 text-sm ${
                      isAcknowledged
                        ? 'text-success-600 dark:text-success-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                    onClick={() => handleAcknowledge(result.id)}
                  >
                    <CheckCircle className="h-4 w-4" />
                    {isAcknowledged ? 'Acknowledged' : 'Acknowledge'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {filteredResults.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No results match your filters.
          </p>
        )}
      </div>
    </div>
  )
}
