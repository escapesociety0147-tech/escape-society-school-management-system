'use client'

import { Edit, Trash2 } from 'lucide-react'

export interface ResultRow {
  id: number
  rollNo: string
  name: string
  classGrade: string
  section: string
  math: number
  english: number
  science: number
  history: number
  total: number
  percentage: number
  grade: string
  remarks: string
}

interface ResultsTableProps {
  results: ResultRow[]
  onEdit?: (id: number) => void
  onRemove?: (id: number) => void
}

export default function ResultsTable({ results, onEdit, onRemove }: ResultsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead>
          <tr>
            <th className="table-header">Photo</th>
            <th className="table-header">Roll No.</th>
            <th className="table-header">Student Name</th>
            <th className="table-header">Math</th>
            <th className="table-header">English</th>
            <th className="table-header">Science</th>
            <th className="table-header">History</th>
            <th className="table-header">Total</th>
            <th className="table-header">Percentage</th>
            <th className="table-header">Grade</th>
            <th className="table-header">Remarks</th>
            <th className="table-header">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {results.map((student) => (
            <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
              <td className="px-6 py-4">
                <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                  <span className="text-primary-600 dark:text-primary-400 font-medium">
                    {student.name.charAt(0)}
                  </span>
                </div>
              </td>
              <td className="table-cell font-medium">{student.rollNo}</td>
              <td className="table-cell font-medium">{student.name}</td>
              <td className="table-cell">
                <span className={`font-semibold ${
                  student.math >= 90 ? 'text-success-600 dark:text-success-400' :
                  student.math >= 70 ? 'text-warning-600 dark:text-warning-400' :
                  'text-error-600 dark:text-error-400'
                }`}>
                  {student.math}
                </span>
              </td>
              <td className="table-cell">
                <span className={`font-semibold ${
                  student.english >= 90 ? 'text-success-600 dark:text-success-400' :
                  student.english >= 70 ? 'text-warning-600 dark:text-warning-400' :
                  'text-error-600 dark:text-error-400'
                }`}>
                  {student.english}
                </span>
              </td>
              <td className="table-cell">
                <span className={`font-semibold ${
                  student.science >= 90 ? 'text-success-600 dark:text-success-400' :
                  student.science >= 70 ? 'text-warning-600 dark:text-warning-400' :
                  'text-error-600 dark:text-error-400'
                }`}>
                  {student.science}
                </span>
              </td>
              <td className="table-cell">
                <span className={`font-semibold ${
                  student.history >= 90 ? 'text-success-600 dark:text-success-400' :
                  student.history >= 70 ? 'text-warning-600 dark:text-warning-400' :
                  'text-error-600 dark:text-error-400'
                }`}>
                  {student.history}
                </span>
              </td>
              <td className="table-cell font-bold">{student.total}</td>
              <td className="table-cell">
                <span className={`font-bold ${
                  student.percentage >= 90 ? 'text-success-600 dark:text-success-400' :
                  student.percentage >= 70 ? 'text-warning-600 dark:text-warning-400' :
                  student.percentage >= 50 ? 'text-orange-600 dark:text-orange-400' :
                  'text-error-600 dark:text-error-400'
                }`}>
                  {student.percentage}%
                </span>
              </td>
              <td className="table-cell">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  student.grade === 'A+' ? 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-300' :
                  student.grade === 'A' ? 'bg-success-50 text-success-700 dark:bg-success-800 dark:text-success-200' :
                  student.grade === 'B' ? 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-300' :
                  student.grade === 'C' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' :
                  'bg-error-100 text-error-800 dark:bg-error-900 dark:text-error-300'
                }`}>
                  {student.grade}
                </span>
              </td>
              <td className="table-cell text-sm">{student.remarks}</td>
              <td className="table-cell">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => onEdit?.(student.id)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <Edit className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove?.(student.id)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <Trash2 className="h-4 w-4 text-error-600 dark:text-error-400" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
