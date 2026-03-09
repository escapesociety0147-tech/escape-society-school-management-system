'use client'

import { apiFetch } from '@/lib/auth'

import { useMemo, useState, useEffect, type FormEvent } from 'react'
import TeacherCard from '@/components/teachers/TeacherCard'
import DashboardShell from '@/components/dashboard/layout/DashboardShell'
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

type Teacher = {
  id: number
  empId: string
  name: string
  department: string
  subjects: string[]
  email: string
  phone: string
  status: string
  createdAt?: string
  schoolId?: string
  photoUrl?: string
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('All Departments')
  const [subjectFilter, setSubjectFilter] = useState('All Subjects')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [formData, setFormData] = useState({
    name: '', department: '', subjects: '', email: '', phone: '',
  })

  const fetchTeachers = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await apiFetch('/teachers')
      const mapped: Teacher[] = data.map((t: any) => ({
        id: t.id,
        empId: t.emp_id,
        name: t.name,
        department: t.department || '',
        subjects: t.subjects ? t.subjects.split(',').map((s: string) => s.trim()) : [],
        email: t.email,
        phone: t.phone || '',
        status: 'Active',
        createdAt: t.created_at,
        schoolId: t.school_id || '',
        photoUrl: t.photo_url || '',
      }))
      setTeachers(mapped)
    } catch (err: any) {
      setError(err.message || 'Failed to load teachers.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTeachers() }, [])

  const filteredTeachers = useMemo(() => {
    return teachers.filter((teacher) => {
      const matchesSearch =
        teacher.name.toLowerCase().includes(search.toLowerCase()) ||
        teacher.empId.toLowerCase().includes(search.toLowerCase())
      const matchesDepartment =
        departmentFilter === 'All Departments' || teacher.department === departmentFilter
      const matchesSubject =
        subjectFilter === 'All Subjects' || teacher.subjects.includes(subjectFilter)
      const matchesStatus =
        statusFilter === 'All Status' || teacher.status === statusFilter
      return matchesSearch && matchesDepartment && matchesSubject && matchesStatus
    })
  }, [teachers, search, departmentFilter, subjectFilter, statusFilter])

  const handleRemove = async (id: number) => {
    if (!confirm('Are you sure you want to delete this teacher?')) return
    try {
      await apiFetch(`/teachers/${id}`, { method: 'DELETE' })
      setTeachers(prev => prev.filter(t => t.id !== id))
    } catch (err: any) {
      alert(err.message || 'Failed to delete teacher.')
    }
  }

  const handleToggleStatus = (id: number) => {
    setTeachers(prev => prev.map(t =>
      t.id === id ? { ...t, status: t.status === 'Active' ? 'On Leave' : 'Active' } : t
    ))
  }

  const handleEditTeacher = (id: number) => {
    const teacher = teachers.find(t => t.id === id)
    if (!teacher) return
    setFormData({
      name: teacher.name,
      department: teacher.department,
      subjects: teacher.subjects.join(', '),
      email: teacher.email,
      phone: teacher.phone,
    })
    setEditingId(id)
    setShowForm(true)
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormError('')
    if (!formData.name || !formData.email || !formData.department) {
      setFormError('Name, email and department are required.')
      return
    }
    setSubmitting(true)
    try {
      if (editingId) {
        await apiFetch(`/teachers/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            department: formData.department,
            subjects: formData.subjects,
            phone: formData.phone,
          }),
        })
      } else {
        await apiFetch('/teachers', {
          method: 'POST',
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            department: formData.department,
            subjects: formData.subjects,
            phone: formData.phone,
          }),
        })
      }
      setFormData({ name: '', department: '', subjects: '', email: '', phone: '' })
      setShowForm(false)
      setEditingId(null)
      await fetchTeachers()
    } catch (err: any) {
      setFormError(err.message || 'Failed to save teacher.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClearFilters = () => {
    setSearch('')
    setDepartmentFilter('All Departments')
    setSubjectFilter('All Subjects')
    setStatusFilter('All Status')
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Teachers Management</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage teaching staff profiles and assignments</p>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={fetchTeachers} className="btn-secondary flex items-center gap-2">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            <button type="button" onClick={() => setShowForm(prev => !prev)} className="btn-primary flex items-center gap-2">
              {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {showForm ? 'Close Form' : 'Add Teacher'}
            </button>
          </div>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="card space-y-4">
            {formError && <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Full Name *</label>
                <input type="text" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="Teacher name" required className="input-field mt-1" />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Email *</label>
                <input type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} placeholder="name@school.edu" required className="input-field mt-1" />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Department *</label>
                <input type="text" value={formData.department} onChange={e => setFormData(p => ({ ...p, department: e.target.value }))} placeholder="e.g. Mathematics" required className="input-field mt-1" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">Subjects (comma separated)</label>
                <input type="text" value={formData.subjects} onChange={e => setFormData(p => ({ ...p, subjects: e.target.value }))} placeholder="e.g. Algebra, Geometry" className="input-field mt-1" />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Phone</label>
                <input type="tel" value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} placeholder="(555) 123-4567" className="input-field mt-1" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null) }} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-60">
                {submitting ? 'Saving...' : editingId ? 'Update Teacher' : 'Save Teacher'}
              </button>
            </div>
          </form>
        )}

        <div className="card">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex justify-between">
              <span>{error}</span>
              <button onClick={fetchTeachers} className="underline">Retry</button>
            </div>
          )}

          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[250px]">
              <input type="text" placeholder="Search by name or employee ID" className="input-field" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="input-field flex-1 min-w-[150px]" value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)}>
              <option>All Departments</option>
              {['Mathematics','Science','English','Social Studies','Arts','Physical Education'].map(d => <option key={d}>{d}</option>)}
            </select>
            <select className="input-field flex-1 min-w-[150px]" value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}>
              <option>All Subjects</option>
              {['Algebra','Biology','Literature','History','Music','Sports'].map(s => <option key={s}>{s}</option>)}
            </select>
            <select className="input-field flex-1 min-w-[150px]" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option>All Status</option>
              <option>Active</option>
              <option>On Leave</option>
            </select>
            <button type="button" onClick={handleClearFilters} className="btn-secondary">Clear Filters</button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-3"></div>
              <p className="text-gray-500">Loading teachers...</p>
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No teachers found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTeachers.map(teacher => (
                <TeacherCard
                  key={teacher.id}
                  teacher={teacher}
                  onRemove={() => handleRemove(teacher.id)}
                  onToggleStatus={() => handleToggleStatus(teacher.id)}
                  onEdit={() => handleEditTeacher(teacher.id)}
                />
              ))}
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredTeachers.length} of {teachers.length} teachers
            </p>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
