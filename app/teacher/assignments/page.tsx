'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { FileCheck, Plus, Search, Edit3, Trash2, Users } from 'lucide-react'
import { useLocalStorageState } from '@/lib/useLocalStorage'
import {
  initialTeacherAssignments,
  initialTeacherClasses,
  TeacherAssignment,
  TeacherClass,
} from '@/lib/portalData'

export default function TeacherAssignmentsPage() {
  const [classes] = useLocalStorageState<TeacherClass[]>(
    'esm_teacher_classes',
    initialTeacherClasses
  )
  const [assignments, setAssignments] = useLocalStorageState<TeacherAssignment[]>(
    'esm_teacher_assignments',
    initialTeacherAssignments
  )
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('All Classes')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({
    classId: classes[0]?.id ?? 0,
    title: '',
    dueDate: new Date().toISOString().slice(0, 10),
    total: '25',
    description: '',
  })

  const filteredAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      const matchesSearch =
        assignment.title.toLowerCase().includes(search.toLowerCase()) ||
        assignment.description.toLowerCase().includes(search.toLowerCase())
      const matchesClass =
        classFilter === 'All Classes' ||
        assignment.classId === Number(classFilter)
      return matchesSearch && matchesClass
    })
  }, [assignments, search, classFilter])

  const classOptions = ['All Classes', ...classes.map((item) => `${item.id}`)]

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const total = Number(form.total)
    const existing = assignments.find((item) => item.id === editingId)
    const entry: TeacherAssignment = {
      id: editingId ?? Date.now(),
      classId: Number(form.classId),
      title: form.title.trim(),
      dueDate: form.dueDate,
      status: existing?.status ?? 'Open',
      submissions: existing?.submissions ?? 0,
      total: Number.isNaN(total) ? 0 : total,
      description: form.description.trim(),
      createdAt: existing?.createdAt || new Date().toISOString(),
    }

    if (editingId) {
      setAssignments((prev) =>
        prev.map((item) => (item.id === editingId ? entry : item))
      )
    } else {
      setAssignments((prev) => [entry, ...prev])
    }

    setEditingId(null)
    setForm({
      classId: classes[0]?.id ?? 0,
      title: '',
      dueDate: new Date().toISOString().slice(0, 10),
      total: '25',
      description: '',
    })
  }

  const handleEdit = (assignment: TeacherAssignment) => {
    setEditingId(assignment.id)
    setForm({
      classId: assignment.classId,
      title: assignment.title,
      dueDate: assignment.dueDate,
      total: `${assignment.total}`,
      description: assignment.description,
    })
  }

  const handleRemove = (id: number) => {
    setAssignments((prev) => prev.filter((item) => item.id !== id))
  }

  const handleToggleStatus = (id: number) => {
    setAssignments((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: item.status === 'Open' ? 'Closed' : 'Open' }
          : item
      )
    )
  }

  const handleAddSubmission = (id: number) => {
    setAssignments((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              submissions: Math.min(item.submissions + 1, item.total),
            }
          : item
      )
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <FileCheck className="h-6 w-6 text-primary-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Assignments
          </h2>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Create assignments, track submissions, and close tasks when done.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {editingId ? 'Edit Assignment' : 'Create Assignment'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Class</label>
            <select
              className="input-field"
              value={form.classId}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, classId: Number(event.target.value) }))
              }
            >
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.grade} {item.section} - {item.subject}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-4">
            <label className="block text-sm font-medium mb-2">Title</label>
            <input
              className="input-field"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Assignment title"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Due Date</label>
            <input
              type="date"
              className="input-field"
              value={form.dueDate}
              onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Total Students</label>
            <input
              type="number"
              className="input-field"
              value={form.total}
              onChange={(event) => setForm((prev) => ({ ...prev, total: event.target.value }))}
              min={0}
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-sm font-medium mb-2">Description</label>
            <input
              className="input-field"
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Summary of instructions"
            />
          </div>
        </div>
        <button type="submit" className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {editingId ? 'Update Assignment' : 'Add Assignment'}
        </button>
      </form>

      <div className="card space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              className="input-field pl-10"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search assignments"
            />
          </div>
          <select
            className="input-field w-full lg:w-60"
            value={classFilter}
            onChange={(event) => setClassFilter(event.target.value)}
          >
            {classOptions.map((option) => {
              if (option === 'All Classes') {
                return (
                  <option key={option} value={option}>
                    {option}
                  </option>
                )
              }
              const classInfo = classes.find((item) => item.id === Number(option))
              return (
                <option key={option} value={option}>
                  {classInfo ? `${classInfo.grade} ${classInfo.section} - ${classInfo.subject}` : 'Class'}
                </option>
              )
            })}
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredAssignments.map((assignment) => {
            const classInfo = classes.find((item) => item.id === assignment.classId)
            const label = classInfo
              ? `${classInfo.grade} ${classInfo.section} - ${classInfo.subject}`
              : 'Class'
            const progress = assignment.total
              ? Math.round((assignment.submissions / assignment.total) * 100)
              : 0
            return (
              <div key={assignment.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {assignment.title}
                    </h4>
                  </div>
                  <button
                    className={`text-xs px-2 py-1 rounded-full ${
                      assignment.status === 'Open'
                        ? 'bg-success-50 text-success-600 dark:bg-success-900/20 dark:text-success-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                    }`}
                    onClick={() => handleToggleStatus(assignment.id)}
                  >
                    {assignment.status}
                  </button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                  Due {assignment.dueDate}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {assignment.description || 'No description added.'}
                </p>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span>{assignment.submissions}/{assignment.total} submissions</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full bg-primary-500 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    className="btn-secondary flex items-center gap-2 text-sm"
                    onClick={() => handleAddSubmission(assignment.id)}
                  >
                    <Users className="h-4 w-4" />
                    Add Submission
                  </button>
                  <button
                    className="btn-secondary flex items-center gap-2 text-sm"
                    onClick={() => handleEdit(assignment)}
                  >
                    <Edit3 className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    className="btn-secondary flex items-center gap-2 text-sm text-error-600 dark:text-error-400"
                    onClick={() => handleRemove(assignment.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {filteredAssignments.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No assignments match your filters.
          </p>
        )}
      </div>
    </div>
  )
}
