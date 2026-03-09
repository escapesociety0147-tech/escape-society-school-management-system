'use client'

import { useMemo, useState, useEffect, type FormEvent } from 'react'
import FeesTable, { type FeePayment } from '@/components/fees/FeesTable'
import DashboardShell from '@/components/dashboard/layout/DashboardShell'
import { TrendingUp, AlertCircle, Clock, DollarSign, Plus, X, RefreshCw } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

function getToken(): string {
  const match = document.cookie.match(/auth_token=([^;]+)/)
  return match ? match[1] : ''
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken()
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Request failed')
  }
  return res.json()
}

export default function FeesPage() {
  const [payments, setPayments] = useState<FeePayment[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [yearFilter, setYearFilter] = useState('All Years')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const perPage = 5
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState<number | ''>('')
  const [formData, setFormData] = useState({
    totalFees: '', amountPaid: '', status: 'pending' as string,
    feeType: '', term: 'Term 1',
  })

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const [paymentsData, studentsData] = await Promise.all([
        apiFetch('/payments'),
        apiFetch('/students'),
      ])
      setStudents(studentsData)
      const mapped: FeePayment[] = paymentsData.map((p: any) => {
        const student = studentsData.find((s: any) => s.id === p.student_id)
        return {
          id: p.id,
          student: student?.name || `Student #${p.student_id}`,
          rollNo: student?.roll_number || '',
          grade: student?.grade || '',
          section: student?.section || '',
          gradeSection: `${student?.grade || ''}-${student?.section || ''}`,
          totalFees: p.amount_due,
          amountPaid: p.amount_paid,
          balanceDue: p.amount_due - p.amount_paid,
          status: p.status.charAt(0).toUpperCase() + p.status.slice(1) as FeePayment['status'],
          year: '2025-2026',
          term: p.fee_type || 'Term 1',
          method: 'Bank Transfer',
          lastPayment: p.last_payment || new Date().toISOString().slice(0, 10),
        }
      })
      setPayments(mapped)
    } catch (err: any) {
      setError(err.message || 'Failed to load payments.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const matchesStatus = statusFilter === 'All Status' || p.status === statusFilter
      const matchesSearch = p.student.toLowerCase().includes(search.toLowerCase()) || p.rollNo.toLowerCase().includes(search.toLowerCase())
      return matchesStatus && matchesSearch
    })
  }, [payments, statusFilter, search])

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / perPage))
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * perPage
  const paginatedPayments = filteredPayments.slice(startIndex, startIndex + perPage)

  const totalCollected = payments.reduce((sum, p) => sum + p.amountPaid, 0)
  const pendingTotal = payments.filter(p => p.status === 'Pending').reduce((sum, p) => sum + p.balanceDue, 0)
  const overdueTotal = payments.filter(p => p.status === 'Overdue').reduce((sum, p) => sum + p.balanceDue, 0)
  const now = new Date()
  const monthLabel = now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormError('')
    if (!selectedStudentId) { setFormError('Please select a student.'); return }
    setSubmitting(true)
    try {
      if (editingId) {
        await apiFetch(`/payments/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify({
            amount_due: parseFloat(formData.totalFees),
            amount_paid: parseFloat(formData.amountPaid) || 0,
            status: formData.status,
            fee_type: formData.feeType,
            last_payment: new Date().toISOString().slice(0, 10),
          }),
        })
      } else {
        await apiFetch('/payments', {
          method: 'POST',
          body: JSON.stringify({
            student_id: selectedStudentId,
            amount_due: parseFloat(formData.totalFees),
            amount_paid: parseFloat(formData.amountPaid) || 0,
            status: formData.status,
            fee_type: formData.feeType,
            last_payment: new Date().toISOString().slice(0, 10),
          }),
        })
      }
      setFormData({ totalFees: '', amountPaid: '', status: 'pending', feeType: '', term: 'Term 1' })
      setSelectedStudentId('')
      setShowForm(false)
      setEditingId(null)
      await fetchData()
    } catch (err: any) {
      setFormError(err.message || 'Failed to save payment.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleStatus = async (id: number) => {
    const payment = payments.find(p => p.id === id)
    if (!payment) return
    const statusOrder = ['Pending', 'Overdue', 'Paid']
    const next = statusOrder[(statusOrder.indexOf(payment.status) + 1) % statusOrder.length].toLowerCase()
    try {
      await apiFetch(`/payments/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: next }),
      })
      await fetchData()
    } catch { }
  }

  const handleRecordPayment = async (id: number) => {
    const payment = payments.find(p => p.id === id)
    if (!payment) return
    try {
      await apiFetch(`/payments/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'paid', amount_paid: payment.totalFees }),
      })
      await fetchData()
    } catch { }
  }

  const handleRemovePayment = async (id: number) => {
    if (!confirm('Delete this payment record?')) return
    try {
      await apiFetch(`/payments/${id}`, { method: 'DELETE' })
      setPayments(prev => prev.filter(p => p.id !== id))
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleEditPayment = (id: number) => {
    const payment = payments.find(p => p.id === id)
    if (!payment) return
    const student = students.find(s => s.name === payment.student)
    setSelectedStudentId(student?.id || '')
    setFormData({
      totalFees: String(payment.totalFees),
      amountPaid: String(payment.amountPaid),
      status: payment.status.toLowerCase(),
      feeType: payment.term || '',
      term: 'Term 1',
    })
    setEditingId(id)
    setShowForm(true)
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Fee Management</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Track and manage student fee payments</p>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={fetchData} className="btn-secondary flex items-center gap-2"><RefreshCw className="h-4 w-4" /> Refresh</button>
            <button type="button" onClick={() => setShowForm(p => !p)} className="btn-primary flex items-center gap-2">
              {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {showForm ? 'Close' : 'Add Payment'}
            </button>
          </div>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="card space-y-4">
            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">Student *</label>
                <select className="input-field mt-1" value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value ? Number(e.target.value) : '')} required>
                  <option value="">Select student</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.roll_number || 'No roll'})</option>)}
                </select>
              </div>
              <div><label className="text-sm text-gray-600 dark:text-gray-400">Fee Type</label><input type="text" value={formData.feeType} onChange={e => setFormData(p => ({ ...p, feeType: e.target.value }))} className="input-field mt-1" placeholder="e.g. Tuition" /></div>
              <div><label className="text-sm text-gray-600 dark:text-gray-400">Total Fees</label><input type="number" value={formData.totalFees} onChange={e => setFormData(p => ({ ...p, totalFees: e.target.value }))} className="input-field mt-1" required /></div>
              <div><label className="text-sm text-gray-600 dark:text-gray-400">Amount Paid</label><input type="number" value={formData.amountPaid} onChange={e => setFormData(p => ({ ...p, amountPaid: e.target.value }))} className="input-field mt-1" /></div>
              <div><label className="text-sm text-gray-600 dark:text-gray-400">Status</label>
                <select className="input-field mt-1" value={formData.status} onChange={e => setFormData(p => ({ ...p, status: e.target.value }))}>
                  <option value="paid">Paid</option><option value="pending">Pending</option><option value="overdue">Overdue</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setEditingId(null); setSelectedStudentId('') }}>Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-60">{submitting ? 'Saving...' : editingId ? 'Update' : 'Save Payment'}</button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="card"><div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold">Total Collected</h3><DollarSign className="h-5 w-5 text-success-500" /></div><p className="text-3xl font-bold">${totalCollected.toLocaleString()}</p><p className="text-sm text-success-600 mt-1">{payments.length} records</p></div>
          <div className="card"><div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold">Pending Fees</h3><Clock className="h-5 w-5 text-warning-500" /></div><p className="text-3xl font-bold">${pendingTotal.toLocaleString()}</p><p className="text-sm text-gray-600 mt-1">{payments.filter(p => p.status === 'Pending').length} students</p></div>
          <div className="card"><div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold">Overdue Fees</h3><AlertCircle className="h-5 w-5 text-error-500" /></div><p className="text-3xl font-bold">${overdueTotal.toLocaleString()}</p><p className="text-sm text-gray-600 mt-1">{payments.filter(p => p.status === 'Overdue').length} students</p></div>
          <div className="card"><div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold">This Month</h3><TrendingUp className="h-5 w-5 text-primary-500" /></div><p className="text-3xl font-bold">${totalCollected.toLocaleString()}</p><p className="text-sm text-success-600 mt-1">{monthLabel}</p></div>
        </div>

        <div className="card">
          {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex justify-between"><span>{error}</span><button onClick={fetchData} className="underline">Retry</button></div>}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px]"><input type="text" placeholder="Search by name or roll number" className="input-field" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} /></div>
            <select className="input-field flex-1 min-w-[150px]" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
              <option>All Status</option><option>Paid</option><option>Pending</option><option>Overdue</option>
            </select>
          </div>

          {loading ? (
            <div className="text-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-3"></div><p className="text-gray-500">Loading payments...</p></div>
          ) : (
            <>
              <FeesTable payments={paginatedPayments} onToggleStatus={handleToggleStatus} onRecordPayment={handleRecordPayment} onEdit={handleEditPayment} onRemove={handleRemovePayment} />
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">Showing {filteredPayments.length === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + perPage, filteredPayments.length)} of {filteredPayments.length} records</p>
                <div className="flex space-x-2">
                  <button type="button" onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50">Previous</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                    <button key={n} type="button" onClick={() => setPage(n)} className={`px-3 py-1 rounded text-sm ${n === currentPage ? 'bg-primary-600 text-white' : 'border border-gray-300 dark:border-gray-600'}`}>{n}</button>
                  ))}
                  <button type="button" onClick={() => setPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50">Next</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
