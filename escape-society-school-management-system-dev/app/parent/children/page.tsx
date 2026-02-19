'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Plus, Search, Users, Trash2 } from 'lucide-react'
import { useLocalStorageState } from '@/lib/useLocalStorage'
import { seedStudents } from '@/lib/seedData'

export default function ParentChildrenPage() {
  const [students] = useLocalStorageState('esm_students', seedStudents)
  const [linkedStudents, setLinkedStudents] = useLocalStorageState<number[]>(
    'esm_parent_links',
    []
  )
  const [parentProfile] = useLocalStorageState('esm_parent_profile', {
    name: '',
    role: '',
    email: '',
    phone: '',
    parentId: '',
    relationship: '',
    schoolId: '',
  })
  const [parents, setParents] = useLocalStorageState('esm_parents', [])
  const [search, setSearch] = useState('')
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
  const [selectedId, setSelectedId] = useState(0)

  const linkedDetails = useMemo(
    () => schoolStudents.filter((student) => linkedStudents.includes(student.id)),
    [schoolStudents, linkedStudents]
  )

  const filteredChildren = useMemo(() => {
    const query = search.toLowerCase()
    return linkedDetails.filter((child) => {
      return (
        child.name.toLowerCase().includes(query) ||
        child.rollNumber.toLowerCase().includes(query) ||
        child.grade.toLowerCase().includes(query)
      )
    })
  }, [linkedDetails, search])

  useEffect(() => {
    if (!schoolStudents.length) {
      if (selectedId !== 0) setSelectedId(0)
      return
    }
    const hasSelected = schoolStudents.some((student) => student.id === selectedId)
    if (!hasSelected) {
      setSelectedId(schoolStudents[0].id)
    }
  }, [schoolStudents, selectedId])

  useEffect(() => {
    if (!schoolId) return
    const validIds = new Set(schoolStudents.map((student) => student.id))
    const cleaned = linkedStudents.filter((id) => validIds.has(id))
    if (cleaned.length !== linkedStudents.length) {
      setLinkedStudents(cleaned)
    }
  }, [linkedStudents, schoolStudents, schoolId, setLinkedStudents])

  const handleLink = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedId) return
    if (!schoolStudents.some((student) => student.id === selectedId)) return
    setLinkedStudents((prev) => (prev.includes(selectedId) ? prev : [...prev, selectedId]))
  }

  const handleRemove = (id: number) => {
    setLinkedStudents((prev) => prev.filter((studentId) => studentId !== id))
  }

  useEffect(() => {
    if (!parentProfile.parentId && !parentProfile.email) return
    setParents((prev: Array<Record<string, unknown>>) =>
      prev.map((parent) => {
        const matchesId = parentProfile.parentId
          ? String(parent.parentId || '') === String(parentProfile.parentId)
          : false
        const matchesEmail = parentProfile.email
          ? String(parent.email || '').toLowerCase() === parentProfile.email.toLowerCase()
          : false
        if (!matchesId && !matchesEmail) return parent
        return {
          ...parent,
          linkedStudentIds: linkedStudents,
          status: linkedStudents.length > 0 ? 'Active' : 'Pending',
        }
      })
    )
  }, [linkedStudents, parentProfile.email, parentProfile.parentId, setParents])

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-primary-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Children Profiles
          </h2>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Link to students already registered by the school.
        </p>
      </div>

      <form onSubmit={handleLink} className="card space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Link a Child
        </h3>
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Select Student</label>
            <select
              className="input-field"
              value={selectedId}
              onChange={(event) => setSelectedId(Number(event.target.value))}
              disabled={schoolStudents.length === 0}
            >
              {schoolStudents.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} ({student.rollNumber}) - {student.grade} {student.section}
                </option>
              ))}
            </select>
            {schoolStudents.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                No students found for your school yet.
              </p>
            )}
          </div>
          <button type="submit" className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Link Child
          </button>
        </div>
      </form>

      <div className="card space-y-4">
        <div className="relative w-full lg:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            className="input-field pl-10"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search linked children"
          />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredChildren.map((child) => (
            <div key={child.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {child.name}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {child.grade} {child.section} | Roll {child.rollNumber}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    child.status === 'Active'
                      ? 'bg-success-50 text-success-600 dark:bg-success-900/20 dark:text-success-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                  }`}
                >
                  {child.status}
                </span>
              </div>
              <div className="mt-3 text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <p>Contact: {child.contact}</p>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm text-error-600 dark:text-error-400"
                  onClick={() => handleRemove(child.id)}
                >
                  <Trash2 className="h-4 w-4" />
                  Unlink
                </button>
              </div>
            </div>
          ))}
        </div>
        {filteredChildren.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No linked children match your search.
          </p>
        )}
      </div>
    </div>
  )
}
