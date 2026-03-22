'use client'

import { MoreVertical, Download, Eye, Edit, Trash2 } from 'lucide-react'

export interface FeePayment {
  id: number
  student: string
  rollNo: string
  gradeSection: string
  totalFees: number
  amountPaid: number
  balanceDue: number
  status: 'Paid' | 'Pending' | 'Overdue'
  lastPayment: string
  year: string
  term: string
  grade: string
  section: string
  method?: string
}

interface FeesTableProps {
  payments: FeePayment[]
  onToggleStatus?: (id: number) => void
  onRecordPayment?: (id: number) => void
  onEdit?: (id: number) => void
  onRemove?: (id: number) => void
}

export default function FeesTable({
  payments,
  onToggleStatus,
  onRecordPayment,
  onEdit,
  onRemove,
}: FeesTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead>
          <tr>
            <th className="table-header">Student</th>
            <th className="table-header">Roll No.</th>
            <th className="table-header">Grade/Section</th>
            <th className="table-header">Total Fees</th>
            <th className="table-header">Amount Paid</th>
            <th className="table-header">Balance Due</th>
            <th className="table-header">Status</th>
            <th className="table-header">Last Payment</th>
            <th className="table-header">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {payments.map((payment) => (
            <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
              <td className="px-6 py-4">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mr-3">
                    <span className="text-primary-600 dark:text-primary-400 font-medium">
                      {payment.student.charAt(0)}
                    </span>
                  </div>
                  <span className="font-medium">{payment.student}</span>
                </div>
              </td>
              <td className="table-cell">{payment.rollNo}</td>
              <td className="table-cell">{payment.gradeSection}</td>
              <td className="table-cell font-bold">${payment.totalFees.toLocaleString()}</td>
              <td className="table-cell">
                <span className="font-semibold text-success-600 dark:text-success-400">
                  ${payment.amountPaid.toLocaleString()}
                </span>
              </td>
              <td className="table-cell">
                <span className={`font-bold ${
                  payment.balanceDue > 0
                    ? 'text-error-600 dark:text-error-400'
                    : 'text-success-600 dark:text-success-400'
                }`}>
                  ${payment.balanceDue.toLocaleString()}
                </span>
              </td>
              <td className="px-6 py-4">
                <button
                  type="button"
                  onClick={() => onToggleStatus?.(payment.id)}
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition ${
                    payment.status === 'Paid'
                      ? 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-300'
                      : payment.status === 'Pending'
                      ? 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-300'
                      : 'bg-error-100 text-error-800 dark:bg-error-900 dark:text-error-300'
                  }`}
                >
                  {payment.status}
                </button>
              </td>
              <td className="table-cell">{payment.lastPayment}</td>
              <td className="px-6 py-4">
                <div className="flex items-center space-x-2">
                  <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit?.(payment.id)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-primary-600 dark:text-primary-400"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRecordPayment?.(payment.id)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-success-600 dark:text-success-400"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove?.(payment.id)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-error-600 dark:text-error-400"
                  >
                    <Trash2 className="h-4 w-4" />
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
