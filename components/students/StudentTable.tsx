'use client'

import { Edit, Trash2, Eye } from 'lucide-react'

export interface Student {
  id: number
  studentId?: string
  rollNumber: string
  name: string
  grade: string
  section: string
  contact: string
  email?: string
  status: 'Active' | 'Inactive'
  createdAt?: string
  schoolId?: string
}

interface StudentTableProps {
  students: Student[]
  onRemove?: (id: number) => void
  onEdit?: (id: number) => void
  onView?: (id: number) => void
}

export default function StudentTable({ students, onRemove, onEdit, onView }: StudentTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead>
          <tr>
            <th className="table-header">Photo</th>
            <th className="table-header">Student ID</th>
            <th className="table-header">Roll Number</th>
            <th className="table-header">Student Name</th>
            <th className="table-header">Grade</th>
            <th className="table-header">Section</th>
            <th className="table-header">Contact</th>
            <th className="table-header">Status</th>
            <th className="table-header">Actions</th>
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
              <td className="table-cell font-medium">{student.studentId || '--'}</td>
              <td className="table-cell font-medium">#{student.rollNumber}</td>
              <td className="table-cell font-medium">{student.name}</td>
              <td className="table-cell">{student.grade}</td>
              <td className="table-cell">{student.section}</td>
              <td className="table-cell">{student.contact}</td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  student.status === 'Active'
                    ? 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-300'
                    : 'bg-error-100 text-error-800 dark:bg-error-900 dark:text-error-300'
                }`}>
                  {student.status}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => onView?.(student.id)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </button>
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
