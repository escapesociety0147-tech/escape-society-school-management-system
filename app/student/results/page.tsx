'use client'

import { useMemo, useState } from 'react'
import { Award, BookOpen, Target } from 'lucide-react'
import { useLocalStorageState } from '@/lib/useLocalStorage'
import { initialResults } from '@/lib/resultsData'
import { initialStudentProfile } from '@/lib/studentData'

type NoteMap = Record<number, string>
type AckMap = Record<number, boolean>

export default function StudentResultsPage() {
  const [profile] = useLocalStorageState('esm_student_profile', initialStudentProfile)
  const [results] = useLocalStorageState('esm_results', initialResults)
  const [notes, setNotes] = useLocalStorageState<NoteMap>('esm_student_result_notes', {})
  const [acknowledged, setAcknowledged] = useLocalStorageState<AckMap>(
    'esm_student_results_ack',
    {}
  )
  const [statusMessage, setStatusMessage] = useState('')

  const studentResults = useMemo(() => {
    return results.filter((result) => result.rollNo === profile.rollNumber)
  }, [results, profile.rollNumber])

  const averagePercentage =
    studentResults.reduce((sum, result) => sum + result.percentage, 0) /
    (studentResults.length || 1)
  const topScore = studentResults.reduce((max, result) => Math.max(max, result.percentage), 0)
  const passRate =
    (studentResults.filter((result) => result.percentage >= 50).length /
      (studentResults.length || 1)) *
    100

  const handleAcknowledge = (id: number) => {
    setAcknowledged((prev) => ({ ...prev, [id]: true }))
    setStatusMessage('Result acknowledged.')
    setTimeout(() => setStatusMessage(''), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Results
          </h2>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Track your assessments, grades, and feedback in real time.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Average Score</h3>
            <Target className="h-4 w-4 text-primary-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {averagePercentage.toFixed(1)}%
          </p>
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Highest Score</h3>
            <Award className="h-4 w-4 text-success-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {topScore.toFixed(1)}%
          </p>
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Pass Rate</h3>
            <BookOpen className="h-4 w-4 text-info-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {passRate.toFixed(0)}%
          </p>
        </div>
      </div>

      {statusMessage && (
        <p className="text-sm text-success-600 dark:text-success-400">{statusMessage}</p>
      )}

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Result History
        </h3>
        <div className="space-y-4">
          {studentResults.map((result) => (
            <div
              key={result.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {result.classGrade} {result.section}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Total {result.total} | Grade {result.grade} | {result.remarks}
                  </p>
                </div>
                <div className="text-sm text-primary-600 dark:text-primary-400">
                  {result.percentage}%
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600 dark:text-gray-300">
                <div>Math: {result.math}</div>
                <div>English: {result.english}</div>
                <div>Science: {result.science}</div>
                <div>History: {result.history}</div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <div className="lg:col-span-2">
                  <label className="text-sm text-gray-600 dark:text-gray-400">
                    Note to teacher
                  </label>
                  <input
                    className="input-field mt-2"
                    placeholder="Share feedback or questions"
                    value={notes[result.id] || ''}
                    onChange={(event) =>
                      setNotes((prev) => ({ ...prev, [result.id]: event.target.value }))
                    }
                  />
                </div>
                <div className="flex items-end">
                  <button
                    className="btn-secondary w-full"
                    onClick={() => handleAcknowledge(result.id)}
                    disabled={acknowledged[result.id]}
                  >
                    {acknowledged[result.id] ? 'Acknowledged' : 'Acknowledge'}
                  </button>
                </div>
              </div>
            </div>
          ))}
          {studentResults.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Results will appear once assessments are graded.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
