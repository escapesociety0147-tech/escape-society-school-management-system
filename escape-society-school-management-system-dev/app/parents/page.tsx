'use client'

import { useMemo, useState, type FormEvent } from 'react'
import DashboardShell from '@/components/dashboard/layout/DashboardShell'
import { useLocalStorageState } from '@/lib/useLocalStorage'
import { seedStudents } from '@/lib/seedData'
import { initialSchoolProfile } from '@/lib/schoolData'
import { Plus, X, Users, Mail, Phone, Link as LinkIcon, Trash2, Pencil } from 'lucide-react'

type ParentRecord = {
  id: number
  parentId: string
  name: string
  email: string
  phone: string
  relationship: string
  schoolId?: string
  linkedStudentIds: number[]
  status: 'Active' | 'Pending' | 'Inactive'
  createdAt?: string
}

export default function ParentsPage() {
  const [parents, setParents] = useLocalStorageState<ParentRecord[]>('esm_parents', [])
  const [students] = useLocalStorageState('esm_students', seedStudents)
  const [schoolProfile] = useLocalStorageState('esm_school_profile', initialSchoolProfile)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | ParentRecord['status']>('All')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    relationship: 'Parent',
    linkedStudentIds: [] as number[],
  })

  const schoolId = String(schoolProfile.schoolId || '').toLowerCase()
  const schoolStudents = useMemo(
    () =>
      schoolId
        ? students.filter(
            (student) => String(student.schoolId || '').toLowerCase() === schoolId
          )
        : students,
    [students, schoolId]
  )

  const filteredParents = useMemo(() => {
    const query = search.trim().toLowerCase()
    return parents.filter((parent) => {
      const matchesSchool = schoolId
        ? String(parent.schoolId || '').toLowerCase() === schoolId
        : true
      const matchesQuery =
        !query ||
        parent.name.toLowerCase().includes(query) ||
        parent.parentId.toLowerCase().includes(query) ||
        parent.email.toLowerCase().includes(query)
      const matchesStatus =
        statusFilter === 'All' || parent.status === statusFilter
      return matchesSchool && matchesQuery && matchesStatus
    })
  }, [parents, search, statusFilter, schoolId])

  const linkedStudentNames = (ids: number[]) =>
    schoolStudents.filter((student) => ids.includes(student.id))

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      relationship: 'Parent',
      linkedStudentIds: [],
    })
    setEditingId(null)
    setShowForm(false)
  }

  const toggleStudentLink = (id: number) => {
    setFormData((prev) => ({
      ...prev,
      linkedStudentIds: prev.linkedStudentIds.includes(id)
        ? prev.linkedStudentIds.filter((studentId) => studentId !== id)
        : [...prev.linkedStudentIds, id],
    }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!formData.name.trim() || !formData.email.trim()) return

    const nextId = parents.length ? Math.max(...parents.map((p) => p.id)) + 1 : 1
    const parentId = `PAR-${String(editingId ?? nextId).padStart(4, '0')}`
    const status: ParentRecord['status'] =
      formData.linkedStudentIds.length > 0 ? 'Active' : 'Pending'

    if (editingId) {
      setParents((prev) =>
        prev.map((parent) =>
          parent.id === editingId
            ? {
                ...parent,
                name: formData.name.trim(),
                email: formData.email.trim(),
                phone: formData.phone.trim(),
                relationship: formData.relationship,
                linkedStudentIds: formData.linkedStudentIds,
                status,
              }
            : parent
        )
      )
    } else {
      const record: ParentRecord = {
        id: nextId,
        parentId,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        relationship: formData.relationship,
        linkedStudentIds: formData.linkedStudentIds,
        status,
        schoolId: schoolProfile.schoolId || '',
        createdAt: new Date().toISOString(),
      }
      setParents((prev) => [record, ...prev])
    }

    resetForm()
  }

  const handleEdit = (id: number) => {
    const parent = parents.find((item) => item.id === id)
    if (!parent) return
    setFormData({
      name: parent.name,
      email: parent.email,
      phone: parent.phone,
      relationship: parent.relationship,
      linkedStudentIds: parent.linkedStudentIds || [],
    })
    setEditingId(id)
    setShowForm(true)
  }

  const handleRemove = (id: number) => {
    setParents((prev) => prev.filter((parent) => parent.id !== id))
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Parents Management
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Track parent contacts and link them to student profiles.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm((prev) => !prev)}
            className="btn-primary flex items-center gap-2"
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? 'Close Form' : 'Add Parent'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="card space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Full Name *</label>
                <input
                  type="text"
                  className="input-field mt-1"
                  value={formData.name}
                  onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Email *</label>
                <input
                  type="email"
                  className="input-field mt-1"
                  value={formData.email}
                  onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Phone</label>
                <input
                  type="tel"
                  className="input-field mt-1"
                  value={formData.phone}
                  onChange={(event) => setFormData((prev) => ({ ...prev, phone: event.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Relationship</label>
                <select
                  className="input-field mt-1"
                  value={formData.relationship}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, relationship: event.target.value }))
                  }
                >
                  <option>Parent</option>
                  <option>Guardian</option>
                  <option>Grandparent</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400">Link Students</label>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {schoolStudents.map((student) => {
                  const checked = formData.linkedStudentIds.includes(student.id)
                  return (
                    <button
                      type="button"
                      key={student.id}
                      onClick={() => toggleStudentLink(student.id)}
                      className={`text-left border rounded-lg p-3 transition ${
                        checked
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {student.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {student.grade} {student.section} • Roll {student.rollNumber}
                      </p>
                    </button>
                  )
                })}
                {schoolStudents.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Add students before linking parents.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button type="button" className="btn-secondary" onClick={resetForm}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                {editingId ? 'Update Parent' : 'Save Parent'}
              </button>
            </div>
          </form>
        )}

        <div className="card">
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[240px]">
              <input
                type="text"
                className="input-field"
                placeholder="Search by name, email, or ID"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <select
              className="input-field flex-1 min-w-[180px]"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as ParentRecord['status'] | 'All')
              }
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredParents.map((parent) => {
              const linked = linkedStudentNames(parent.linkedStudentIds || [])
              return (
                <div
                  key={parent.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-xl p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {parent.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {parent.parentId} • {parent.relationship}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        parent.status === 'Active'
                          ? 'bg-success-50 text-success-600 dark:bg-success-900/20 dark:text-success-400'
                          : parent.status === 'Pending'
                          ? 'bg-warning-50 text-warning-600 dark:bg-warning-900/20 dark:text-warning-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                      }`}
                    >
                      {parent.status}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {parent.email}
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {parent.phone || 'No phone provided'}
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {linked.length} linked student{linked.length === 1 ? '' : 's'}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {linked.map((student) => (
                      <span
                        key={student.id}
                        className="text-xs px-2 py-1 rounded-full bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400 flex items-center gap-1"
                      >
                        <LinkIcon className="h-3 w-3" />
                        {student.name}
                      </span>
                    ))}
                    {linked.length === 0 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        No students linked yet.
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(parent.id)}
                      className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(parent.id)}
                      className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm text-error-600 dark:text-error-400"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {filteredParents.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              No parent profiles yet. Add parents to get started.
            </p>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
