'use client'

import { Check, X } from 'lucide-react'

export interface AttendanceStudent {
  id: number
  rollNo: string
  name: string
}

interface AttendanceTableProps {
  students: AttendanceStudent[]
  attendance: Record<number, 'present' | 'absent'>
  onAttendanceChange: (studentId: number, status: 'present' | 'absent') => void
  onSave?: () => void
  title?: string
}

export default function AttendanceTable({
  students,
  attendance,
  onAttendanceChange,
  onSave,
  title,
}: AttendanceTableProps) {
  const hasStudents = students.length > 0

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title || 'Mark Attendance'}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Select present or absent for each student
        </p>
      </div>

      {hasStudents ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="table-header">Photo</th>
                <th className="table-header">Roll No.</th>
                <th className="table-header">Student Name</th>
                <th className="table-header">Attendance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4">
                    <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                      <span className="text-primary-600 dark:text-primary-400 font-medium">
                        {student.name.charAt(0)}
                      </span>
                    </div>
                  </td>
                  <td className="table-cell">{student.rollNo}</td>
                  <td className="table-cell font-medium">{student.name}</td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => onAttendanceChange(student.id, 'present')}
                        className={`flex items-center space-x-1 px-3 py-1 rounded-lg transition-colors ${
                          attendance[student.id] === 'present'
                            ? 'bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-300'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <Check className="h-4 w-4" />
                        <span>Present</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onAttendanceChange(student.id, 'absent')}
                        className={`flex items-center space-x-1 px-3 py-1 rounded-lg transition-colors ${
                          attendance[student.id] === 'absent'
                            ? 'bg-error-100 text-error-700 dark:bg-error-900 dark:text-error-300'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <X className="h-4 w-4" />
                        <span>Absent</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No students loaded for the selected grade and section.
        </p>
      )}

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={onSave}
          className="btn-primary px-6 py-2 flex items-center space-x-2"
          disabled={!hasStudents}
        >
          <Check className="h-5 w-5" />
          <span>Save Attendance</span>
        </button>
      </div>
    </div>
  )
}
