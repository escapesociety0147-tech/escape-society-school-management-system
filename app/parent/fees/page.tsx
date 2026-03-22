'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { CreditCard, DollarSign } from 'lucide-react'
import { useLocalStorageState } from '@/lib/useLocalStorage'
import { seedStudents } from '@/lib/seedData'
import type { FeePayment } from '@/components/fees/FeesTable'
import { initialPayments } from '@/lib/paymentsData'

export default function ParentFeesPage() {
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
  const [payments, setPayments] = useLocalStorageState<FeePayment[]>(
    'esm_payments',
    initialPayments
  )
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [paymentForm, setPaymentForm] = useState({
    paymentId: payments[0]?.id ?? 0,
    amount: '',
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

  const linkedPayments = payments.filter((payment) => linkedRolls.includes(payment.rollNo))

  const filteredPayments = useMemo(() => {
    return linkedPayments.filter((payment) =>
      statusFilter === 'All Status' ? true : payment.status === statusFilter
    )
  }, [linkedPayments, statusFilter])

  const totalBalance = linkedPayments.reduce((sum, payment) => sum + payment.balanceDue, 0)
  const totalPaid = linkedPayments.reduce((sum, payment) => sum + payment.amountPaid, 0)

  const applyPayment = (paymentId: number, amount: number) => {
    setPayments((prev) =>
      prev.map((payment) => {
        if (payment.id !== paymentId) return payment
        const newPaid = Math.min(payment.totalFees, payment.amountPaid + amount)
        const balanceDue = Math.max(payment.totalFees - newPaid, 0)
        const status = balanceDue === 0 ? 'Paid' : balanceDue < payment.totalFees ? 'Pending' : 'Overdue'
        return {
          ...payment,
          amountPaid: newPaid,
          balanceDue,
          status,
          lastPayment: new Date().toISOString().slice(0, 10),
        }
      })
    )
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const amount = Number(paymentForm.amount)
    if (Number.isNaN(amount) || amount <= 0) return
    applyPayment(Number(paymentForm.paymentId), amount)
    setPaymentForm((prev) => ({ ...prev, amount: '' }))
  }

  const markPaid = (paymentId: number) => {
    const payment = payments.find((item) => item.id === paymentId)
    if (!payment) return
    const balance = payment.balanceDue
    if (balance <= 0) return
    applyPayment(paymentId, balance)
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-primary-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Fees & Payments
          </h2>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Review balances synced from the school and submit payments.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Paid</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">${totalPaid}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500 dark:text-gray-400">Outstanding Balance</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">${totalBalance}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500 dark:text-gray-400">Active Payments</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{linkedPayments.length}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Make a Payment
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Select Fee</label>
            <select
              className="input-field"
              value={paymentForm.paymentId}
              onChange={(event) =>
                setPaymentForm((prev) => ({ ...prev, paymentId: Number(event.target.value) }))
              }
            >
              {linkedPayments.map((payment) => (
                <option key={payment.id} value={payment.id}>
                  {payment.student} - {payment.term} (${payment.balanceDue} due)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Amount</label>
            <input
              type="number"
              className="input-field"
              value={paymentForm.amount}
              onChange={(event) =>
                setPaymentForm((prev) => ({ ...prev, amount: event.target.value }))
              }
              min={1}
              placeholder="0.00"
            />
          </div>
        </div>
        <button className="btn-primary flex items-center gap-2" type="submit">
          <DollarSign className="h-4 w-4" />
          Submit Payment
        </button>
      </form>

      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Fee Schedule
          </h3>
          <select
            className="input-field w-full max-w-[200px]"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="All Status">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Overdue">Overdue</option>
            <option value="Paid">Paid</option>
          </select>
        </div>

        <div className="space-y-3">
          {filteredPayments.map((payment) => (
            <div
              key={payment.id}
              className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {payment.student} - {payment.term}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Due {payment.lastPayment} | Paid ${payment.amountPaid} of ${payment.totalFees}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    payment.status === 'Paid'
                      ? 'bg-success-50 text-success-600 dark:bg-success-900/20 dark:text-success-400'
                      : payment.status === 'Pending'
                      ? 'bg-warning-50 text-warning-600 dark:bg-warning-900/20 dark:text-warning-400'
                      : 'bg-error-50 text-error-600 dark:bg-error-900/20 dark:text-error-400'
                  }`}
                >
                  {payment.status}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Balance ${payment.balanceDue}
                </span>
                <button
                  className="btn-secondary text-sm"
                  onClick={() => markPaid(payment.id)}
                  disabled={payment.balanceDue === 0}
                >
                  {payment.balanceDue === 0 ? 'Paid' : 'Pay Balance'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredPayments.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No fees match your filter.
          </p>
        )}
      </div>
    </div>
  )
}
