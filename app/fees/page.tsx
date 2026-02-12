'use client'

import { useMemo, useState, type FormEvent } from 'react'
import FeesTable, { type FeePayment } from '@/components/fees/FeesTable'
import DashboardShell from '@/components/dashboard/layout/DashboardShell'
import { TrendingUp, AlertCircle, Clock, DollarSign, Plus, X } from 'lucide-react'
import { useLocalStorageState } from '@/lib/useLocalStorage'
import { initialPayments } from '@/lib/paymentsData'
import { seedStudents } from '@/lib/seedData'
import type { Student } from '@/components/students/StudentTable'

export default function FeesPage() {
  const [payments, setPayments] = useLocalStorageState('esm_payments', initialPayments)
  const [students] = useLocalStorageState<Student[]>('esm_students', seedStudents)
  const [yearFilter, setYearFilter] = useState('2025-2026')
  const [termFilter, setTermFilter] = useState('All Terms')
  const [gradeFilter, setGradeFilter] = useState('All Grades')
  const [sectionFilter, setSectionFilter] = useState('All Sections')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const perPage = 5
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formError, setFormError] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState<number | ''>('')
  const [formData, setFormData] = useState({
    student: '',
    rollNo: '',
    grade: '',
    section: '',
    totalFees: '',
    amountPaid: '',
    status: 'Pending' as FeePayment['status'],
    year: '2025-2026',
    term: 'Term 2',
    method: 'Bank Transfer',
  })

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const matchesYear = yearFilter === 'All Years' || payment.year === yearFilter
      const matchesTerm = termFilter === 'All Terms' || payment.term === termFilter
      const matchesGrade = gradeFilter === 'All Grades' || payment.grade === gradeFilter
      const matchesSection = sectionFilter === 'All Sections' || payment.section === sectionFilter
      const matchesStatus = statusFilter === 'All Status' || payment.status === statusFilter
      const matchesSearch =
        payment.student.toLowerCase().includes(search.toLowerCase()) ||
        payment.rollNo.toLowerCase().includes(search.toLowerCase())
      return (
        matchesYear && matchesTerm && matchesGrade && matchesSection && matchesStatus && matchesSearch
      )
    })
  }, [payments, yearFilter, termFilter, gradeFilter, sectionFilter, statusFilter, search])

  const now = new Date()
  const currentMonth = now.toISOString().slice(0, 7)
  const monthLabel = now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / perPage))
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * perPage
  const paginatedPayments = filteredPayments.slice(startIndex, startIndex + perPage)

  const totalCollected = filteredPayments.reduce((sum, payment) => sum + payment.amountPaid, 0)
  const pendingTotal = filteredPayments
    .filter((payment) => payment.status === 'Pending')
    .reduce((sum, payment) => sum + payment.balanceDue, 0)
  const overdueTotal = filteredPayments
    .filter((payment) => payment.status === 'Overdue')
    .reduce((sum, payment) => sum + payment.balanceDue, 0)

  const thisMonthTotal = filteredPayments
    .filter((payment) => payment.lastPayment.startsWith(currentMonth))
    .reduce((sum, payment) => sum + payment.amountPaid, 0)

  const paymentMethodTotals = filteredPayments.reduce<Record<string, number>>((acc, payment) => {
    const method = payment.method || 'Unspecified'
    acc[method] = (acc[method] || 0) + payment.amountPaid
    return acc
  }, {})
  const paymentMethodTotal = Object.values(paymentMethodTotals).reduce((sum, value) => sum + value, 0)
  const paymentMethodBreakdown = Object.entries(paymentMethodTotals).map(([method, amount]) => ({
    method,
    amount,
    percentage: paymentMethodTotal ? Math.round((amount / paymentMethodTotal) * 100) : 0,
  }))

  const overdueAlerts = filteredPayments
    .filter((payment) => payment.status === 'Overdue')
    .map((payment) => {
      const parsedDate = new Date(payment.lastPayment)
      const daysOverdue = Number.isNaN(parsedDate.getTime())
        ? null
        : Math.max(0, Math.floor((now.getTime() - parsedDate.getTime()) / (1000 * 60 * 60 * 24)))
      return { ...payment, daysOverdue }
    })

  const handleToggleStatus = (id: number) => {
    setPayments((prev) =>
      prev.map((payment) => {
        if (payment.id !== id) return payment
        const statusOrder: FeePayment['status'][] = ['Pending', 'Overdue', 'Paid']
        const nextStatus = statusOrder[(statusOrder.indexOf(payment.status) + 1) % statusOrder.length]
        if (nextStatus === 'Paid') {
          return { ...payment, status: 'Paid', amountPaid: payment.totalFees, balanceDue: 0 }
        }
        if (nextStatus === 'Pending') {
          const partialPaid = Math.round(payment.totalFees * 0.5)
          return {
            ...payment,
            status: 'Pending',
            amountPaid: partialPaid,
            balanceDue: payment.totalFees - partialPaid,
          }
        }
        return {
          ...payment,
          status: 'Overdue',
          amountPaid: payment.amountPaid,
          balanceDue: payment.totalFees - payment.amountPaid,
        }
      })
    )
  }

  const handleRecordPayment = (id: number) => {
    setPayments((prev) =>
      prev.map((payment) =>
        payment.id === id
          ? { ...payment, status: 'Paid', amountPaid: payment.totalFees, balanceDue: 0 }
          : payment
      )
    )
  }

  const handleRemovePayment = (id: number) => {
    setPayments((prev) => prev.filter((payment) => payment.id !== id))
  }

  const handleSelectStudent = (studentId: number | '') => {
    setSelectedStudentId(studentId)
    if (!studentId) {
      setFormData((prev) => ({
        ...prev,
        student: '',
        rollNo: '',
        grade: '',
        section: '',
      }))
      return
    }
    const match = students.find((student) => student.id === Number(studentId))
    if (!match) return
    setFormData((prev) => ({
      ...prev,
      student: match.name,
      rollNo: match.rollNumber,
      grade: match.grade,
      section: match.section,
    }))
  }

  const handleEditPayment = (id: number) => {
    const payment = payments.find((item) => item.id === id)
    if (!payment) return
    const match = students.find(
      (student) => student.rollNumber.toLowerCase() === payment.rollNo.toLowerCase()
    )
    setSelectedStudentId(match ? match.id : '')
    setFormData({
      student: payment.student,
      rollNo: payment.rollNo,
      grade: payment.grade,
      section: payment.section,
      totalFees: String(payment.totalFees),
      amountPaid: String(payment.amountPaid),
      status: payment.status,
      year: payment.year,
      term: payment.term,
      method: payment.method || 'Bank Transfer',
    })
    setEditingId(id)
    setShowForm(true)
  }

  const handleSavePayment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError('')
    if (!formData.student || !formData.rollNo || !formData.grade || !formData.section) return
    const matchedStudent = students.find(
      (student) => student.rollNumber.toLowerCase() === formData.rollNo.trim().toLowerCase()
    )
    if (!matchedStudent) {
      setFormError('Select a registered student to create a payment record.')
      return
    }

    const totalFees = Number.parseFloat(formData.totalFees) || 0
    const rawPaid = Number.parseFloat(formData.amountPaid) || 0
    const amountPaidBase = formData.status === 'Paid' ? totalFees : rawPaid
    const amountPaid = Math.min(amountPaidBase, totalFees)
    const balanceDue = Math.max(totalFees - amountPaid, 0)
    const gradeSection = `${matchedStudent.grade}-${matchedStudent.section}`
    const lastPayment = new Date().toISOString().slice(0, 10)
    const studentName = matchedStudent.name

    if (editingId) {
      setPayments((prev) =>
        prev.map((payment) =>
          payment.id === editingId
            ? {
                ...payment,
                student: studentName,
                rollNo: matchedStudent.rollNumber,
                grade: matchedStudent.grade,
                section: matchedStudent.section,
                gradeSection,
                totalFees,
                amountPaid,
                balanceDue,
                status: formData.status,
                year: formData.year,
                term: formData.term,
                method: formData.method,
                lastPayment,
              }
            : payment
        )
      )
    } else {
      const nextId = payments.length ? Math.max(...payments.map((p) => p.id)) + 1 : 1
      setPayments((prev) => [
        {
          id: nextId,
          student: studentName,
          rollNo: matchedStudent.rollNumber,
          grade: matchedStudent.grade,
          section: matchedStudent.section,
          gradeSection,
          totalFees,
          amountPaid,
          balanceDue,
          status: formData.status,
          year: formData.year,
          term: formData.term,
          method: formData.method,
          lastPayment,
        },
        ...prev,
      ])
    }

    setFormData({
      student: '',
      rollNo: '',
      grade: '',
      section: '',
      totalFees: '',
      amountPaid: '',
      status: 'Pending',
      year: '2025-2026',
      term: 'Term 2',
      method: 'Bank Transfer',
    })
    setEditingId(null)
    setSelectedStudentId('')
    setShowForm(false)
    setPage(1)
  }

  const handlePageChange = (nextPage: number) => {
    setPage(Math.min(Math.max(nextPage, 1), totalPages))
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Fee Management
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Track and manage student fee payments, generate reports and monitor collection status
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm((prev) => !prev)}
            className="btn-primary flex items-center gap-2"
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? 'Close Form' : 'Add Payment'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSavePayment} className="card space-y-4">
            {formError && (
              <p className="text-sm text-error-600 dark:text-error-400">{formError}</p>
            )}
            {students.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No registered students yet. Add students before creating payment records.
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
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
                <label className="text-sm text-gray-600 dark:text-gray-400">Year</label>
                <select
                  className="input-field mt-1"
                  value={formData.year}
                  onChange={(event) => setFormData((prev) => ({ ...prev, year: event.target.value }))}
                >
                  <option>2025-2026</option>
                  <option>2024-2025</option>
                  <option>2023-2024</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Term</label>
                <select
                  className="input-field mt-1"
                  value={formData.term}
                  onChange={(event) => setFormData((prev) => ({ ...prev, term: event.target.value }))}
                >
                  <option>Term 1</option>
                  <option>Term 2</option>
                  <option>Term 3</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Grade *</label>
                <select
                  className="input-field mt-1"
                  value={formData.grade}
                  onChange={(event) => setFormData((prev) => ({ ...prev, grade: event.target.value }))}
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
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Total Fees</label>
                <input
                  type="number"
                  className="input-field mt-1"
                  value={formData.totalFees}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, totalFees: event.target.value }))
                  }
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Amount Paid</label>
                <input
                  type="number"
                  className="input-field mt-1"
                  value={formData.amountPaid}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, amountPaid: event.target.value }))
                  }
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Status</label>
                <select
                  className="input-field mt-1"
                  value={formData.status}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      status: event.target.value as FeePayment['status'],
                    }))
                  }
                >
                  <option>Paid</option>
                  <option>Pending</option>
                  <option>Overdue</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Payment Method</label>
                <select
                  className="input-field mt-1"
                  value={formData.method}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, method: event.target.value }))
                  }
                >
                  <option>Bank Transfer</option>
                  <option>Card</option>
                  <option>Cash</option>
                  <option>Check</option>
                  <option>Online</option>
                </select>
              </div>
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
                {editingId ? 'Update Payment' : 'Save Payment'}
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Total Fees Collected</h3>
              <DollarSign className="h-5 w-5 text-success-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              ${totalCollected.toLocaleString()}
            </p>
            <p className="text-sm text-success-600 dark:text-success-400 mt-1">
              {filteredPayments.length} records in scope
            </p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Pending Fees</h3>
              <Clock className="h-5 w-5 text-warning-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              ${pendingTotal.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {filteredPayments.filter((payment) => payment.status === 'Pending').length} students
            </p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Overdue Fees</h3>
              <AlertCircle className="h-5 w-5 text-error-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              ${overdueTotal.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {filteredPayments.filter((payment) => payment.status === 'Overdue').length} students
            </p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">This Month</h3>
              <TrendingUp className="h-5 w-5 text-primary-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              ${thisMonthTotal.toLocaleString()}
            </p>
            <p className="text-sm text-success-600 dark:text-success-400 mt-1">
              Updated for {monthLabel}
            </p>
          </div>
        </div>

        <div className="card">
          <div className="flex flex-wrap gap-4 mb-6">
            <select
              className="input-field flex-1 min-w-[150px]"
              value={yearFilter}
              onChange={(event) => {
                setYearFilter(event.target.value)
                setPage(1)
              }}
            >
              <option>All Years</option>
              <option>2025-2026</option>
              <option>2024-2025</option>
              <option>2023-2024</option>
            </select>
            <select
              className="input-field flex-1 min-w-[150px]"
              value={termFilter}
              onChange={(event) => {
                setTermFilter(event.target.value)
                setPage(1)
              }}
            >
              <option>All Terms</option>
              <option>Term 1</option>
              <option>Term 2</option>
              <option>Term 3</option>
            </select>
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
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value)
                setPage(1)
              }}
            >
              <option>All Status</option>
              <option>Paid</option>
              <option>Pending</option>
              <option>Overdue</option>
            </select>
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search by name or roll number"
                className="input-field"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPage(1)
                }}
              />
            </div>
          </div>

          <FeesTable
            payments={paginatedPayments}
            onToggleStatus={handleToggleStatus}
            onRecordPayment={handleRecordPayment}
            onEdit={handleEditPayment}
            onRemove={handleRemovePayment}
          />

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredPayments.length === 0 ? 0 : startIndex + 1}-
              {Math.min(startIndex + perPage, filteredPayments.length)} of{' '}
              {filteredPayments.length} records
            </p>
            <div className="flex space-x-2">
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
              <h4 className="font-semibold mb-4">Payment Methods</h4>
              <div className="space-y-3">
                {paymentMethodBreakdown.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No payment method data yet.
                  </p>
                ) : (
                  paymentMethodBreakdown.map((item) => {
                    const color =
                      item.method === 'Bank Transfer'
                        ? 'bg-primary-500'
                        : item.method === 'Card'
                        ? 'bg-accent-500'
                        : item.method === 'Cash'
                        ? 'bg-success-500'
                        : item.method === 'Check'
                        ? 'bg-warning-500'
                        : item.method === 'Online'
                        ? 'bg-info-500'
                        : 'bg-slate-500'
                    return (
                      <div key={item.method}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {item.method}
                          </span>
                          <span className="text-sm font-medium">{item.percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`${color} h-2 rounded-full`}
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Overdue Alerts</h4>
              <div className="space-y-3">
                {overdueAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3 border border-error-200 dark:border-error-800 bg-error-50 dark:bg-error-900/20 rounded-lg"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {alert.student}
                        </p>
                        <p className="text-error-600 dark:text-error-400 text-sm">
                          ${alert.balanceDue.toLocaleString()} overdue
                        </p>
                      </div>
                      <span className="bg-error-100 dark:bg-error-800 text-error-800 dark:text-error-300 text-xs font-semibold px-2 py-1 rounded">
                        {alert.daysOverdue === null ? '--' : `${alert.daysOverdue} days`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-3 text-sm btn-secondary py-2">
                View All Overdue ({filteredPayments.filter((payment) => payment.status === 'Overdue').length})
              </button>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Grade-wise Collection Status</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                        Grade
                      </th>
                      <th className="text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                        Collection Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'].map(
                      (grade) => {
                        const gradePayments = filteredPayments.filter(
                          (payment) => payment.grade === grade
                        )
                        const gradeCollected = gradePayments.reduce(
                          (sum, payment) => sum + payment.amountPaid,
                          0
                        )
                        const gradeTotal = gradePayments.reduce(
                          (sum, payment) => sum + payment.totalFees,
                          0
                        )
                        const rate = gradeTotal ? Math.round((gradeCollected / gradeTotal) * 100) : 0
                        return (
                      <tr key={grade} className="border-b border-gray-200 dark:border-gray-700">
                        <td className="py-2 text-sm">{grade}</td>
                        <td className="py-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className={`${
                                  rate >= 95 ? 'bg-success-500' :
                                  rate >= 90 ? 'bg-warning-500' :
                                  'bg-error-500'
                                } h-2 rounded-full`}
                                style={{ width: `${rate}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium min-w-[40px]">
                              {rate}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    )})}
                    <tr>
                      <td className="py-2 text-sm font-medium">Overall</td>
                      <td className="py-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-primary-500 h-2 rounded-full"
                              style={{
                                width: `${
                                  filteredPayments.reduce((sum, payment) => sum + payment.totalFees, 0)
                                    ? Math.round(
                                        (filteredPayments.reduce(
                                          (sum, payment) => sum + payment.amountPaid,
                                          0
                                        ) /
                                          filteredPayments.reduce(
                                            (sum, payment) => sum + payment.totalFees,
                                            0
                                          )) *
                                          100
                                      )
                                    : 0
                                }%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium min-w-[40px]">
                            {filteredPayments.reduce((sum, payment) => sum + payment.totalFees, 0)
                              ? Math.round(
                                  (filteredPayments.reduce(
                                    (sum, payment) => sum + payment.amountPaid,
                                    0
                                  ) /
                                    filteredPayments.reduce(
                                      (sum, payment) => sum + payment.totalFees,
                                      0
                                    )) *
                                    100
                                )
                              : 0}
                            %
                          </span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
