'use client'

import { useMemo, useState, type FormEvent } from 'react'
import StudentTable, { type Student } from '@/components/students/StudentTable'
import DashboardShell from '@/components/dashboard/layout/DashboardShell'
import Link from 'next/link'
import { Plus, X } from 'lucide-react'
import { useLocalStorageState } from '@/lib/useLocalStorage'
import { seedStudents } from '@/lib/seedData'
import { initialSchoolProfile } from '@/lib/schoolData'

export default function StudentsPage() {
  const [students, setStudents] = useLocalStorageState('esm_students', seedStudents)
  const [schoolProfile] = useLocalStorageState('esm_school_profile', initialSchoolProfile)
  const [search, setSearch] = useState('')
  const [gradeFilter, setGradeFilter] = useState('All Grades')
  const [sectionFilter, setSectionFilter] = useState('All Sections')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [showForm, setShowForm] = useState(false)
  const [page, setPage] = useState(1)
  const [editingId, setEditingId] = useState<number | null>(null)
  const perPage = 5
  const [formError, setFormError] = useState('')
  const [formData, setFormData] = useState({
    rollNumber: '',
    name: '',
    grade: '',
    section: '',
    contact: '',
    status: 'Active',
  })

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(search.toLowerCase()) ||
        student.rollNumber.toLowerCase().includes(search.toLowerCase())
      const matchesGrade = gradeFilter === 'All Grades' || student.grade === gradeFilter
      const matchesSection =
        sectionFilter === 'All Sections' || student.section === sectionFilter
      const matchesStatus = statusFilter === 'All Status' || student.status === statusFilter
      return matchesSearch && matchesGrade && matchesSection && matchesStatus
    })
  }, [students, search, gradeFilter, sectionFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / perPage))
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * perPage
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + perPage)

  const handleRemove = (id: number) => {
    setStudents((prev) => prev.filter((student) => student.id !== id))
  }

  const handleClearFilters = () => {
    setSearch('')
    setGradeFilter('All Grades')
    setSectionFilter('All Sections')
    setStatusFilter('All Status')
    setPage(1)
  }

  const handleAddStudent = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError('')
    if (!formData.name || !formData.grade || !formData.section) {
      return
    }
    const nextId = students.length ? Math.max(...students.map((s) => s.id)) + 1 : 1
    const existingRolls = new Set(
      students
        .filter((student) => student.id !== editingId)
        .map((student) => String(student.rollNumber).toLowerCase())
    )
    const normalizedRoll = formData.rollNumber.trim()
    if (normalizedRoll && existingRolls.has(normalizedRoll.toLowerCase())) {
      setFormError('That roll number is already in use.')
      return
    }
    let rollNumber = normalizedRoll
    if (!rollNumber) {
      let counter = nextId
      let candidate = `2024${String(counter).padStart(3, '0')}`
      while (existingRolls.has(candidate.toLowerCase())) {
        counter += 1
        candidate = `2024${String(counter).padStart(3, '0')}`
      }
      rollNumber = candidate
    }
    if (editingId) {
      setStudents((prev) =>
        prev.map((student) =>
          student.id === editingId
            ? {
                ...student,
                rollNumber,
                name: formData.name,
                grade: formData.grade,
                section: formData.section,
                contact: formData.contact || 'N/A',
                status: formData.status as Student['status'],
              }
            : student
        )
      )
    } else {
      setStudents((prev) => [
        {
          id: nextId,
          studentId: `STD-${String(nextId).padStart(4, '0')}`,
          rollNumber,
          name: formData.name,
          grade: formData.grade,
          section: formData.section,
          contact: formData.contact || 'N/A',
          email: '',
          status: formData.status as Student['status'],
          createdAt: new Date().toISOString(),
          schoolId: schoolProfile.schoolId || '',
        },
        ...prev,
      ])
    }
    setFormData({
      rollNumber: '',
      name: '',
      grade: '',
      section: '',
      contact: '',
      status: 'Active',
    })
    setShowForm(false)
    setEditingId(null)
    setPage(1)
  }

  const handleEditStudent = (id: number) => {
    const student = students.find((item) => item.id === id)
    if (!student) return
    setFormData({
      rollNumber: student.rollNumber,
      name: student.name,
      grade: student.grade,
      section: student.section,
      contact: student.contact,
      status: student.status,
    })
    setEditingId(id)
    setShowForm(true)
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
              Students Management
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage and view all enrolled students in your institution
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setShowForm((prev) => !prev)}
              className="btn-secondary flex items-center gap-2"
            >
              {showForm ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              {showForm ? 'Close Form' : 'Quick Add'}
            </button>
            <Link
              href="/students/register"
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Register New Student</span>
            </Link>
          </div>
        </div>

        {showForm && (
          <form onSubmit={handleAddStudent} className="card">
            {formError && (
              <p className="mb-4 text-sm text-error-600 dark:text-error-400">
                {formError}
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Roll Number</label>
                <input
                  type="text"
                  value={formData.rollNumber}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, rollNumber: event.target.value }))
                  }
                  className="input-field mt-1"
                  placeholder="2024012"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Student Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, name: event.target.value }))
                  }
                  className="input-field mt-1"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Contact</label>
                <input
                  type="text"
                  value={formData.contact}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, contact: event.target.value }))
                  }
                  className="input-field mt-1"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Grade *</label>
                <select
                  value={formData.grade}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, grade: event.target.value }))
                  }
                  className="input-field mt-1"
                  required
                >
                  <option value="">Select Grade</option>
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
                  value={formData.section}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, section: event.target.value }))
                  }
                  className="input-field mt-1"
                  required
                >
                  <option value="">Select Section</option>
                  <option>A</option>
                  <option>B</option>
                  <option>C</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Status</label>
                <select
                  value={formData.status}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      status: event.target.value as Student['status'],
                    }))
                  }
                  className="input-field mt-1"
                >
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                }}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                {editingId ? 'Update Student' : 'Add Student'}
              </button>
            </div>
          </form>
        )}

        <div className="card">
          <div className="flex flex-wrap gap-4 mb-6">
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
              <option>Active</option>
              <option>Inactive</option>
            </select>
            <button type="button" className="btn-secondary" onClick={handleClearFilters}>
              Clear Filters
            </button>
          </div>

          <StudentTable
            students={paginatedStudents}
            onRemove={handleRemove}
            onEdit={handleEditStudent}
          />

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredStudents.length === 0 ? 0 : startIndex + 1}-
              {Math.min(startIndex + perPage, filteredStudents.length)} of{' '}
              {filteredStudents.length} students
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
        </div>
      </div>
    </DashboardShell>
  )
}
