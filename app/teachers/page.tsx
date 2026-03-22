'use client'

import { useMemo, useState, type FormEvent } from 'react'
import TeacherCard from '@/components/teachers/TeacherCard'
import DashboardShell from '@/components/dashboard/layout/DashboardShell'
import { Plus, X } from 'lucide-react'
import { useLocalStorageState } from '@/lib/useLocalStorage'

const initialTeachers: Array<{
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
}> = []

export default function TeachersPage() {
  const [teachers, setTeachers] = useLocalStorageState('esm_teachers', initialTeachers)
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('All Departments')
  const [subjectFilter, setSubjectFilter] = useState('All Subjects')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    empId: '',
    name: '',
    department: '',
    subjects: '',
    email: '',
    phone: '',
    status: 'Active',
  })

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

  const handleRemove = (id: number) => {
    setTeachers((prev) => prev.filter((teacher) => teacher.id !== id))
  }

  const handleToggleStatus = (id: number) => {
    setTeachers((prev) =>
      prev.map((teacher) =>
        teacher.id === id
          ? {
              ...teacher,
              status: teacher.status === 'Active' ? 'On Leave' : 'Active',
            }
          : teacher
      )
    )
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddTeacher = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextId = teachers.length ? Math.max(...teachers.map((t) => t.id)) + 1 : 1
    const normalizedEmpId = formData.empId.trim() || `EMP-${String(nextId).padStart(3, '0')}`
    const subjects = formData.subjects
      .split(',')
      .map((subject) => subject.trim())
      .filter(Boolean)

    if (!formData.name || !formData.department || subjects.length === 0) {
      return
    }

    if (editingId) {
      setTeachers((prev) =>
        prev.map((teacher) =>
          teacher.id === editingId
            ? {
                ...teacher,
                empId: normalizedEmpId,
                name: formData.name,
                department: formData.department,
                subjects,
                email: formData.email,
                phone: formData.phone,
                status: formData.status,
              }
            : teacher
        )
      )
    } else {
      setTeachers((prev) => [
        {
          id: nextId,
          empId: normalizedEmpId,
          name: formData.name,
          department: formData.department,
          subjects,
          email: formData.email,
          phone: formData.phone,
          status: formData.status,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ])
    }

    setFormData({
      empId: '',
      name: '',
      department: '',
      subjects: '',
      email: '',
      phone: '',
      status: 'Active',
    })
    setEditingId(null)
    setShowForm(false)
  }

  const handleEditTeacher = (id: number) => {
    const teacher = teachers.find((item) => item.id === id)
    if (!teacher) return
    setFormData({
      empId: teacher.empId,
      name: teacher.name,
      department: teacher.department,
      subjects: teacher.subjects.join(', '),
      email: teacher.email,
      phone: teacher.phone,
      status: teacher.status,
    })
    setEditingId(id)
    setShowForm(true)
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
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Teachers Management
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage teaching staff profiles and assignments
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm((prev) => !prev)}
            className="btn-primary flex items-center gap-2"
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? 'Close Form' : 'Add Teacher'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleAddTeacher} className="card space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Employee ID</label>
                <input
                  type="text"
                  value={formData.empId}
                  onChange={(event) => handleInputChange('empId', event.target.value)}
                  placeholder="EMP-007"
                  className="input-field mt-1"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(event) => handleInputChange('name', event.target.value)}
                  placeholder="Teacher name"
                  required
                  className="input-field mt-1"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Department *</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(event) => handleInputChange('department', event.target.value)}
                  placeholder="Department"
                  required
                  className="input-field mt-1"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">Subjects *</label>
                <input
                  type="text"
                  value={formData.subjects}
                  onChange={(event) => handleInputChange('subjects', event.target.value)}
                  placeholder="e.g. Algebra, Geometry"
                  required
                  className="input-field mt-1"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Status</label>
                <select
                  value={formData.status}
                  onChange={(event) => handleInputChange('status', event.target.value)}
                  className="input-field mt-1"
                >
                  <option>Active</option>
                  <option>On Leave</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(event) => handleInputChange('email', event.target.value)}
                  placeholder="name@school.edu"
                  className="input-field mt-1"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(event) => handleInputChange('phone', event.target.value)}
                  placeholder="(555) 123-4567"
                  className="input-field mt-1"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                {editingId ? 'Update Teacher' : 'Save Teacher'}
              </button>
            </div>
          </form>
        )}

        <div className="card">
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[250px]">
              <input
                type="text"
                placeholder="Search by name or employee ID"
                className="input-field"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <select
              className="input-field flex-1 min-w-[150px]"
              value={departmentFilter}
              onChange={(event) => setDepartmentFilter(event.target.value)}
            >
              <option>All Departments</option>
              <option>Mathematics</option>
              <option>Science</option>
              <option>English</option>
              <option>Social Studies</option>
              <option>Arts</option>
              <option>Physical Education</option>
            </select>
            <select
              className="input-field flex-1 min-w-[150px]"
              value={subjectFilter}
              onChange={(event) => setSubjectFilter(event.target.value)}
            >
              <option>All Subjects</option>
              <option>Algebra</option>
              <option>Biology</option>
              <option>Literature</option>
              <option>History</option>
              <option>Music</option>
              <option>Sports</option>
            </select>
            <select
              className="input-field flex-1 min-w-[150px]"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option>All Status</option>
              <option>Active</option>
              <option>On Leave</option>
            </select>
            <button type="button" onClick={handleClearFilters} className="btn-secondary">
              Clear Filters
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeachers.map((teacher) => (
              <TeacherCard
                key={teacher.id}
                teacher={teacher}
                onRemove={() => handleRemove(teacher.id)}
                onToggleStatus={() => handleToggleStatus(teacher.id)}
                onEdit={() => handleEditTeacher(teacher.id)}
              />
            ))}
          </div>

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
