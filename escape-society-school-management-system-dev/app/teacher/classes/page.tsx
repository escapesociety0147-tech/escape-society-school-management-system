'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { BookOpen, Plus, Search, Users, Edit3, Trash2 } from 'lucide-react'
import { useLocalStorageState } from '@/lib/useLocalStorage'
import {
  initialTeacherClasses,
  TeacherClass,
} from '@/lib/portalData'

const gradeOptions = [
  'Grade 7',
  'Grade 8',
  'Grade 9',
  'Grade 10',
  'Grade 11',
  'Grade 12',
]

const sectionOptions = ['A', 'B', 'C', 'D']

export default function TeacherClassesPage() {
  const [classes, setClasses] = useLocalStorageState<TeacherClass[]>(
    'esm_teacher_classes',
    initialTeacherClasses
  )
  const [search, setSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('All Subjects')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({
    grade: 'Grade 9',
    section: 'A',
    subject: 'Mathematics',
    room: 'Room 204',
    schedule: 'Mon/Wed/Fri 09:00',
    students: '28',
  })

  const subjects = useMemo(() => {
    const unique = Array.from(new Set(classes.map((item) => item.subject)))
    return ['All Subjects', ...unique]
  }, [classes])

  const filteredClasses = useMemo(() => {
    return classes.filter((item) => {
      const matchesSearch =
        item.subject.toLowerCase().includes(search.toLowerCase()) ||
        `${item.grade} ${item.section}`.toLowerCase().includes(search.toLowerCase())
      const matchesSubject =
        subjectFilter === 'All Subjects' || item.subject === subjectFilter
      return matchesSearch && matchesSubject
    })
  }, [classes, search, subjectFilter])

  const totalStudents = classes.reduce((sum, item) => sum + item.students, 0)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const studentCount = Number(form.students || 0)
    const existing = classes.find((item) => item.id === editingId)
    const payload: TeacherClass = {
      id: editingId ?? Date.now(),
      grade: form.grade,
      section: form.section,
      subject: form.subject.trim(),
      room: form.room.trim(),
      schedule: form.schedule.trim(),
      students: Number.isNaN(studentCount) ? 0 : studentCount,
      createdAt: existing?.createdAt || new Date().toISOString(),
    }

    if (editingId) {
      setClasses((prev) =>
        prev.map((item) => (item.id === editingId ? payload : item))
      )
    } else {
      setClasses((prev) => [payload, ...prev])
    }

    setEditingId(null)
    setForm({
      grade: 'Grade 9',
      section: 'A',
      subject: 'Mathematics',
      room: 'Room 204',
      schedule: 'Mon/Wed/Fri 09:00',
      students: '28',
    })
  }

  const handleEdit = (item: TeacherClass) => {
    setEditingId(item.id)
    setForm({
      grade: item.grade,
      section: item.section,
      subject: item.subject,
      room: item.room,
      schedule: item.schedule,
      students: `${item.students}`,
    })
  }

  const handleRemove = (id: number) => {
    setClasses((prev) => prev.filter((item) => item.id !== id))
  }

  const resetForm = () => {
    setEditingId(null)
    setForm({
      grade: 'Grade 9',
      section: 'A',
      subject: 'Mathematics',
      room: 'Room 204',
      schedule: 'Mon/Wed/Fri 09:00',
      students: '28',
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary-500" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              My Classes
            </h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Organize the sections and subjects you teach in real time.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
            <Users className="h-4 w-4" />
            {classes.length} classes, {totalStudents} students
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {editingId ? 'Edit Class' : 'Add New Class'}
          </h3>
          <button type="button" className="btn-secondary text-sm" onClick={resetForm}>
            Reset
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Grade</label>
            <select
              className="input-field"
              value={form.grade}
              onChange={(event) => setForm((prev) => ({ ...prev, grade: event.target.value }))}
            >
              {gradeOptions.map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Section</label>
            <select
              className="input-field"
              value={form.section}
              onChange={(event) => setForm((prev) => ({ ...prev, section: event.target.value }))}
            >
              {sectionOptions.map((section) => (
                <option key={section} value={section}>
                  {section}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Subject</label>
            <input
              className="input-field"
              value={form.subject}
              onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
              placeholder="Subject name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Students</label>
            <input
              type="number"
              className="input-field"
              value={form.students}
              onChange={(event) => setForm((prev) => ({ ...prev, students: event.target.value }))}
              min={0}
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-sm font-medium mb-2">Room</label>
            <input
              className="input-field"
              value={form.room}
              onChange={(event) => setForm((prev) => ({ ...prev, room: event.target.value }))}
              placeholder="Room or online link"
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-sm font-medium mb-2">Schedule</label>
            <input
              className="input-field"
              value={form.schedule}
              onChange={(event) => setForm((prev) => ({ ...prev, schedule: event.target.value }))}
              placeholder="Mon/Wed/Fri 09:00"
            />
          </div>
        </div>

        <button type="submit" className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {editingId ? 'Update Class' : 'Add Class'}
        </button>
      </form>

      <div className="card">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between mb-4">
          <div className="relative w-full lg:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search classes"
              className="input-field pl-10"
            />
          </div>
          <select
            className="input-field w-full lg:w-56"
            value={subjectFilter}
            onChange={(event) => setSubjectFilter(event.target.value)}
          >
            {subjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredClasses.map((item) => (
            <div key={item.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {item.grade} {item.section}
                  </p>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {item.subject}
                  </h4>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {item.students} students
                </span>
              </div>
              <div className="mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                <p>Room: {item.room}</p>
                <p>Schedule: {item.schedule}</p>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm"
                  onClick={() => handleEdit(item)}
                >
                  <Edit3 className="h-4 w-4" />
                  Edit
                </button>
                <button
                  className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm text-error-600 dark:text-error-400"
                  onClick={() => handleRemove(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredClasses.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            No classes match your filters yet.
          </p>
        )}
      </div>
    </div>
  )
}
