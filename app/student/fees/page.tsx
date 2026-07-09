'use client'

import { useMemo, useState } from 'react'
import { AlertCircle, CreditCard, DollarSign, TrendingUp } from 'lucide-react'
import { useLocalStorageState } from '@/lib/useLocalStorage'
import { initialPayments } from '@/lib/paymentsData'
import { initialStudentProfile } from '@/lib/studentData'

export default function StudentFeesPage() {
  const [profile] = useLocalStorageState('esm_student_profile', initialStudentProfile)
  const [payments, setPayments] = useLocalStorageState('esm_payments', initialPayments)
  const [statusMessage, setStatusMessage] = useState('')

  const studentPayments = useMemo(
    () => payments.filter((payment) => payment.rollNo === profile.rollNumber),
    [payments, profile.rollNumber]
  )

  const totalPaid = studentPayments.reduce((sum, payment) => sum + payment.amountPaid, 0)
  const totalDue = studentPayments.reduce((sum, payment) => sum + payment.balanceDue, 0)
  const overdueCount = studentPayments.filter((payment) => payment.status === 'Overdue').length

  const handlePayNow = (id: number) => {
    setPayments((prev) =>
      prev.map((payment) =>
        payment.id === id
          ? {
              ...payment,
              status: 'Paid',
              amountPaid: payment.totalFees,
              balanceDue: 0,
              lastPayment: new Date().toISOString().slice(0, 10),
            }
          : payment
      )
    )
    setStatusMessage('Payment recorded successfully.')
    setTimeout(() => setStatusMessage(''), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-primary-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Fee Management
          </h2>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Track tuition payments, balances, and upcoming deadlines.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Paid</h3>
            <DollarSign className="h-4 w-4 text-success-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            ${totalPaid.toLocaleString()}
          </p>
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Outstanding</h3>
            <AlertCircle className="h-4 w-4 text-warning-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            ${totalDue.toLocaleString()}
          </p>
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Overdue</h3>
            <TrendingUp className="h-4 w-4 text-error-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{overdueCount}</p>
        </div>
      </div>

      {statusMessage && (
        <p className="text-sm text-success-600 dark:text-success-400">{statusMessage}</p>
      )}

      <div className="card space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Payment Schedule
        </h3>
        <div className="space-y-3">
          {studentPayments.map((payment) => (
            <div
              key={payment.id}
              className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {payment.term} - {payment.year}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Total ${payment.totalFees} | Paid ${payment.amountPaid} | Balance $
                  {payment.balanceDue}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Last payment {payment.lastPayment}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    payment.status === 'Paid'
                      ? 'bg-success-50 text-success-600 dark:bg-success-900/20 dark:text-success-400'
                      : payment.status === 'Overdue'
                      ? 'bg-error-50 text-error-600 dark:bg-error-900/20 dark:text-error-400'
                      : 'bg-warning-50 text-warning-600 dark:bg-warning-900/20 dark:text-warning-400'
                  }`}
                >
                  {payment.status}
                </span>
                {payment.status !== 'Paid' && (
                  <button
                    className="btn-primary text-sm px-3 py-2"
                    onClick={() => handlePayNow(payment.id)}
                  >
                    Pay Now
                  </button>
                )}
              </div>
            </div>
          ))}
          {studentPayments.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No payments found for your account yet.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
