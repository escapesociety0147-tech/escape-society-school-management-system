'use client'

import { useMemo, useState, useEffect, type FormEvent } from 'react'
import StudentTable, { type Student } from '@/components/students/StudentTable'
import DashboardShell from '@/components/dashboard/layout/DashboardShell'
import Link from 'next/link'
import { Plus, X, RefreshCw } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

function getToken(): string {
  const match = document.cookie.match(/auth_token=([^;]+)/)
  return match ? match[1] : ''
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken()
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Request failed')
  }
  return res.json()
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [gradeFilter, setGradeFilter] = useState('All Grades')
  const [sectionFilter, setSectionFilter] = useState('All Sections')
  const [showForm, setShowForm] = useState(false)
  const [page, setPage] = useState(1)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const perPage = 5

  const [formData, setFormData] = useState({
    rollNumber: '', name: '', email: '', grade: '', section: '', contact: '',
  })

  // Fetch students from backend
  const fetchStudents = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await apiFetch('/students')
      // Map backend fields to frontend Student type
      const mapped: Student[] = data.map((s: any) => ({
        id: s.id,
        studentId: s.student_id,
        rollNumber: s.roll_number || '',
        name: s.name,
        email: s.email,
        grade: s.grade || '',
        section: s.section || '',
        contact: s.contact || 'N/A',
        status: 'Active' as const,
        createdAt: s.created_at,
        schoolId: s.school_id || '',
        photoUrl: s.photo_url || '',
      }))
      setStudents(mapped)
    } catch (err: any) {
      setError(err.message || 'Failed to load students.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStudents() }, [])

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(search.toLowerCase()) ||
        student.rollNumber.toLowerCase().includes(search.toLowerCase())
      const matchesGrade = gradeFilter === 'All Grades' || student.grade === gradeFilter
      const matchesSection = sectionFilter === 'All Sections' || student.section === sectionFilter
      return matchesSearch && matchesGrade && matchesSection
    })
  }, [students, search, gradeFilter, sectionFilter])

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / perPage))
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * perPage
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + perPage)

  const handleRemove = async (id: number) => {
    if (!confirm('Are you sure you want to delete this student?')) return
    try {
      await apiFetch(`/students/${id}`, { method: 'DELETE' })
      setStudents(prev => prev.filter(s => s.id !== id))
    } catch (err: any) {
      alert(err.message || 'Failed to delete student.')
    }
  }

  const handleEditStudent = (id: number) => {
    const student = students.find(s => s.id === id)
    if (!student) return
    setFormData({
      rollNumber: student.rollNumber,
      name: student.name,
      email: student.email || '',
      grade: student.grade,
      section: student.section,
      contact: student.contact === 'N/A' ? '' : student.contact,
    })
    setEditingId(id)
    setShowForm(true)
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormError('')
    if (!formData.name || !formData.email || !formData.grade) {
      setFormError('Name, email and grade are required.')
      return
    }
    setSubmitting(true)
    try {
      if (editingId) {
        await apiFetch(`/students/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            grade: formData.grade,
            section: formData.section,
            contact: formData.contact,
            roll_number: formData.rollNumber,
          }),
        })
      } else {
        await apiFetch('/students', {
          method: 'POST',
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            grade: formData.grade,
            section: formData.section,
            contact: formData.contact,
            roll_number: formData.rollNumber,
          }),
        })
      }
      setFormData({ rollNumber: '', name: '', email: '', grade: '', section: '', contact: '' })
      setShowForm(false)
      setEditingId(null)
      setPage(1)
      await fetchStudents()
    } catch (err: any) {
      setFormError(err.message || 'Failed to save student.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClearFilters = () => {
    setSearch('')
    setGradeFilter('All Grades')
    setSectionFilter('All Sections')
    setPage(1)
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Students Management</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage and view all enrolled students in your institution</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={fetchStudents} className="btn-secondary flex items-center gap-2">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            <button type="button" onClick={() => setShowForm(prev => !prev)} className="btn-secondary flex items-center gap-2">
              {showForm ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              {showForm ? 'Close Form' : 'Quick Add'}
            </button>
            <Link href="/students/register" className="btn-primary flex items-center space-x-2">
              <Plus className="h-5 w-5" /><span>Register New Student</span>
            </Link>
          </div>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="card">
            {formError && <p className="mb-4 text-sm text-red-600 dark:text-red-400">{formError}</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Roll Number</label>
                <input type="text" value={formData.rollNumber} onChange={e => setFormData(p => ({ ...p, rollNumber: e.target.value }))} className="input-field mt-1" placeholder="e.g. 001" />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Student Name *</label>
                <input type="text" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className="input-field mt-1" required />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Email Address *</label>
                <input type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} className="input-field mt-1" required />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Contact</label>
                <input type="text" value={formData.contact} onChange={e => setFormData(p => ({ ...p, contact: e.target.value }))} className="input-field mt-1" />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Grade *</label>
                <select value={formData.grade} onChange={e => setFormData(p => ({ ...p, grade: e.target.value }))} className="input-field mt-1" required>
                  <option value="">Select Grade</option>
                  {['Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12'].map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Section</label>
                <select value={formData.section} onChange={e => setFormData(p => ({ ...p, section: e.target.value }))} className="input-field mt-1">
                  <option value="">Select Section</option>
                  {['A','B','C'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setEditingId(null) }}>Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-60">
                {submitting ? 'Saving...' : editingId ? 'Update Student' : 'Add Student'}
              </button>
            </div>
          </form>
        )}

        <div className="card">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex justify-between">
              <span>{error}</span>
              <button onClick={fetchStudents} className="underline">Retry</button>
            </div>
          )}

          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <input type="text" placeholder="Search by name or roll number" className="input-field" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
            </div>
            <select className="input-field flex-1 min-w-[150px]" value={gradeFilter} onChange={e => { setGradeFilter(e.target.value); setPage(1) }}>
              <option>All Grades</option>
              {['Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12'].map(g => <option key={g}>{g}</option>)}
            </select>
            <select className="input-field flex-1 min-w-[150px]" value={sectionFilter} onChange={e => { setSectionFilter(e.target.value); setPage(1) }}>
              <option>All Sections</option>
              {['A','B','C'].map(s => <option key={s}>Section {s}</option>)}
            </select>
            <button type="button" className="btn-secondary" onClick={handleClearFilters}>Clear Filters</button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-3"></div>
              <p className="text-gray-500">Loading students...</p>
            </div>
          ) : (
            <>
              <StudentTable students={paginatedStudents} onRemove={handleRemove} onEdit={handleEditStudent} />
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {filteredStudents.length === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + perPage, filteredStudents.length)} of {filteredStudents.length} students
                </p>
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
