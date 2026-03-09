'use client'

import { apiFetch } from '@/lib/auth'

import { useMemo, useState, useEffect, type FormEvent } from 'react'
import ResultsTable, { type ResultRow } from '@/components/results/ResultsTable'
import DashboardShell from '@/components/dashboard/layout/DashboardShell'
import { TrendingUp, Target, Award, Plus, X, RefreshCw } from 'lucide-react'

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

const calculateGrade = (p: number) => p >= 90 ? 'A+' : p >= 80 ? 'A' : p >= 70 ? 'B' : p >= 60 ? 'C' : 'D'
const calculateRemarks = (p: number) => p >= 90 ? 'Excellent' : p >= 80 ? 'Strong performance' : p >= 70 ? 'Satisfactory' : p >= 60 ? 'Average' : 'Needs improvement'
const parseScore = (v: string) => Math.min(Math.max(parseFloat(v) || 0, 0), 100)

export default function ResultsPage() {
  const [results, setResults] = useState<ResultRow[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [gradeFilter, setGradeFilter] = useState('All Grades')
  const [sectionFilter, setSectionFilter] = useState('All Sections')
  const [subjectFilter, setSubjectFilter] = useState('All Subjects')
  const [page, setPage] = useState(1)
  const perPage = 5
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState<number | ''>('')
  const [formData, setFormData] = useState({ rollNo: '', name: '', classGrade: '', section: '', math: '', english: '', science: '', history: '' })

  const fetchData = async () => {
    setLoading(true); setError('')
    try {
      const [resultsData, studentsData] = await Promise.all([apiFetch('/results'), apiFetch('/students')])
      setStudents(studentsData)
      const mapped: ResultRow[] = resultsData.map((r: any) => {
        const student = studentsData.find((s: any) => s.id === r.student_id)
        const math = r.math_score ?? 0
        const english = r.english_score ?? 0
        const science = r.science_score ?? 0
        const history = r.history_score ?? 0
        const total = math + english + science + history
        const percentage = parseFloat((total / 4).toFixed(1))
        return {
          id: r.id,
          rollNo: student?.roll_number || '',
          name: student?.name || `Student #${r.student_id}`,
          classGrade: student?.grade || '',
          section: student?.section || '',
          math, english, science, history, total, percentage,
          grade: calculateGrade(percentage),
          remarks: calculateRemarks(percentage),
        }
      })
      setResults(mapped)
    } catch (err: any) { setError(err.message || 'Failed to load results.') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const filteredResults = useMemo(() => {
    const filtered = results.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.rollNo.toLowerCase().includes(search.toLowerCase())
      const matchesGrade = gradeFilter === 'All Grades' || s.classGrade === gradeFilter
      const matchesSection = sectionFilter === 'All Sections' || s.section === sectionFilter
      return matchesSearch && matchesGrade && matchesSection
    })
    if (subjectFilter === 'All Subjects') return filtered
    const keyMap: Record<string, keyof ResultRow> = { Mathematics: 'math', English: 'english', Science: 'science', History: 'history' }
    const key = keyMap[subjectFilter] || 'math'
    return [...filtered].sort((a, b) => ((b[key] as number) || 0) - ((a[key] as number) || 0))
  }, [results, search, gradeFilter, sectionFilter, subjectFilter])

  const totalPages = Math.max(1, Math.ceil(filteredResults.length / perPage))
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * perPage
  const paginatedResults = filteredResults.slice(startIndex, startIndex + perPage)

  const averagePercentage = filteredResults.reduce((s, r) => s + r.percentage, 0) / (filteredResults.length || 1)
  const topStudent = filteredResults.reduce<ResultRow | null>((top, s) => (!top || s.percentage > top.percentage) ? s : top, null)
  const passRate = (filteredResults.filter(s => s.percentage >= 50).length / (filteredResults.length || 1)) * 100
  const gradeCounts = filteredResults.reduce<Record<string, number>>((acc, s) => { acc[s.grade] = (acc[s.grade] || 0) + 1; return acc }, {})
  const subjectAverages = { Mathematics: filteredResults.reduce((s, r) => s + r.math, 0) / (filteredResults.length || 1), English: filteredResults.reduce((s, r) => s + r.english, 0) / (filteredResults.length || 1), Science: filteredResults.reduce((s, r) => s + r.science, 0) / (filteredResults.length || 1), History: filteredResults.reduce((s, r) => s + r.history, 0) / (filteredResults.length || 1) }
  const topPerformers = [...filteredResults].sort((a, b) => b.percentage - a.percentage).slice(0, 3)
  const needsSupport = [...filteredResults].sort((a, b) => a.percentage - b.percentage).slice(0, 2)

  const handleSelectStudent = (studentId: number | '') => {
    setSelectedStudentId(studentId)
    if (!studentId) { setFormData(p => ({ ...p, rollNo: '', name: '', classGrade: '', section: '' })); return }
    const match = students.find(s => s.id === Number(studentId))
    if (match) setFormData(p => ({ ...p, rollNo: match.roll_number || '', name: match.name, classGrade: match.grade || '', section: match.section || '' }))
  }

  const handleSaveResult = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setFormError('')
    if (!selectedStudentId) { setFormError('Please select a student.'); return }
    const math = parseScore(formData.math), english = parseScore(formData.english), science = parseScore(formData.science), history = parseScore(formData.history)
    setSubmitting(true)
    try {
      if (editingId) {
        await apiFetch(`/results/${editingId}`, { method: 'PUT', body: JSON.stringify({ math_score: math, english_score: english, science_score: science, history_score: history }) })
      } else {
        await apiFetch('/results', { method: 'POST', body: JSON.stringify({ student_id: selectedStudentId, math_score: math, english_score: english, science_score: science, history_score: history }) })
      }
      setFormData({ rollNo: '', name: '', classGrade: '', section: '', math: '', english: '', science: '', history: '' })
      setSelectedStudentId(''); setShowForm(false); setEditingId(null); setPage(1)
      await fetchData()
    } catch (err: any) { setFormError(err.message || 'Failed to save result.') }
    finally { setSubmitting(false) }
  }

  const handleEditResult = (id: number) => {
    const result = results.find(r => r.id === id); if (!result) return
    const match = students.find(s => s.roll_number === result.rollNo)
    setSelectedStudentId(match?.id || '')
    setFormData({ rollNo: result.rollNo, name: result.name, classGrade: result.classGrade, section: result.section, math: String(result.math), english: String(result.english), science: String(result.science), history: String(result.history) })
    setEditingId(id); setShowForm(true)
  }

  const handleRemoveResult = async (id: number) => {
    if (!confirm('Delete this result?')) return
    try { await apiFetch(`/results/${id}`, { method: 'DELETE' }); setResults(prev => prev.filter(r => r.id !== id)) }
    catch (err: any) { alert(err.message) }
  }

  const now = new Date()
  const academicStartYear = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Exam Results Management</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage and track student exam performance</p>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={fetchData} className="btn-secondary flex items-center gap-2"><RefreshCw className="h-4 w-4" /> Refresh</button>
            <button type="button" onClick={() => setShowForm(p => !p)} className="btn-primary flex items-center gap-2">
              {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{showForm ? 'Close Form' : 'Add Result'}
            </button>
          </div>
        </div>

        {showForm && (
          <form onSubmit={handleSaveResult} className="card space-y-4">
            {formError && <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">Student *</label>
                <select className="input-field mt-1" value={selectedStudentId} onChange={e => handleSelectStudent(e.target.value ? Number(e.target.value) : '')} required>
                  <option value="">Select student</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.roll_number || 'No roll'})</option>)}
                </select>
              </div>
              <div><label className="text-sm text-gray-600 dark:text-gray-400">Roll No</label><input type="text" className="input-field mt-1" value={formData.rollNo} readOnly /></div>
              <div><label className="text-sm text-gray-600 dark:text-gray-400">Grade</label><input type="text" className="input-field mt-1" value={formData.classGrade} readOnly /></div>
              {[{ label: 'Math', key: 'math' }, { label: 'English', key: 'english' }, { label: 'Science', key: 'science' }, { label: 'History', key: 'history' }].map(sub => (
                <div key={sub.key}>
                  <label className="text-sm text-gray-600 dark:text-gray-400">{sub.label}</label>
                  <input type="number" min="0" max="100" className="input-field mt-1" value={(formData as any)[sub.key]} onChange={e => setFormData(p => ({ ...p, [sub.key]: e.target.value }))} />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setEditingId(null); setSelectedStudentId('') }}>Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-60">{submitting ? 'Saving...' : editingId ? 'Update Result' : 'Save Result'}</button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="card"><div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold">Average Score</h3><TrendingUp className="h-5 w-5 text-success-500" /></div><p className="text-3xl font-bold">{averagePercentage.toFixed(1)}%</p><p className="text-sm text-success-600 mt-1">{filteredResults.length} students</p></div>
          <div className="card"><div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold">Highest Score</h3><Award className="h-5 w-5 text-warning-500" /></div><p className="text-3xl font-bold">{topStudent ? `${topStudent.percentage}%` : '--'}</p><p className="text-sm text-gray-600 mt-1">{topStudent?.name || 'No data'}</p></div>
          <div className="card"><div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold">Pass Rate</h3><Target className="h-5 w-5 text-primary-500" /></div><p className="text-3xl font-bold">{passRate.toFixed(0)}%</p><p className="text-sm text-success-600 mt-1">Target: 85%</p></div>
          <div className="card"><h3 className="text-lg font-semibold mb-2">Exam Details</h3><div className="space-y-2 text-sm"><div className="flex justify-between"><span className="text-gray-600">Year:</span><span className="font-medium">{academicStartYear}-{academicStartYear + 1}</span></div><div className="flex justify-between"><span className="text-gray-600">Grade:</span><span className="font-medium">{gradeFilter}</span></div><div className="flex justify-between"><span className="text-gray-600">Subject:</span><span className="font-medium">{subjectFilter}</span></div></div></div>
        </div>

        <div className="card">
          {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex justify-between"><span>{error}</span><button onClick={fetchData} className="underline">Retry</button></div>}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px]"><input type="text" placeholder="Search student..." className="input-field" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} /></div>
            <select className="input-field flex-1 min-w-[150px]" value={gradeFilter} onChange={e => { setGradeFilter(e.target.value); setPage(1) }}>
              <option>All Grades</option>{['Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12'].map(g => <option key={g}>{g}</option>)}
            </select>
            <select className="input-field flex-1 min-w-[150px]" value={sectionFilter} onChange={e => { setSectionFilter(e.target.value); setPage(1) }}>
              <option>All Sections</option>{['A','B','C'].map(s => <option key={s}>Section {s}</option>)}
            </select>
            <select className="input-field flex-1 min-w-[150px]" value={subjectFilter} onChange={e => { setSubjectFilter(e.target.value); setPage(1) }}>
              <option>All Subjects</option>{['Mathematics','English','Science','History'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="text-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-3"></div><p className="text-gray-500">Loading results...</p></div>
          ) : (
            <>
              <ResultsTable results={paginatedResults} onEdit={handleEditResult} onRemove={handleRemoveResult} />
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">Showing {filteredResults.length === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + perPage, filteredResults.length)} of {filteredResults.length} students</p>
                <div className="flex space-x-2">
                  <button type="button" onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50">Previous</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => <button key={n} type="button" onClick={() => setPage(n)} className={`px-3 py-1 rounded text-sm ${n === currentPage ? 'bg-primary-600 text-white' : 'border border-gray-300 dark:border-gray-600'}`}>{n}</button>)}
                  <button type="button" onClick={() => setPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50">Next</button>
                </div>
              </div>
            </>
          )}

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div><h4 className="font-semibold mb-4">Grade Distribution</h4><div className="space-y-2">{[{grade:'A+',color:'bg-success-500'},{grade:'A',color:'bg-success-400'},{grade:'B',color:'bg-warning-400'},{grade:'C',color:'bg-warning-500'},{grade:'D',color:'bg-error-500'}].map(item => { const count = gradeCounts[item.grade] || 0; return <div key={item.grade} className="flex items-center justify-between"><span className="text-gray-700 dark:text-gray-300">{item.grade}</span><div className="flex items-center space-x-2"><div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2"><div className={`${item.color} h-2 rounded-full`} style={{ width: `${filteredResults.length ? (count/filteredResults.length)*100 : 0}%` }}></div></div><span className="text-sm font-medium">{count}</span></div></div> })}</div></div>
            <div><h4 className="font-semibold mb-4">Subject Performance</h4><div className="space-y-2">{Object.entries(subjectAverages).map(([subject, avg]) => <div key={subject} className="flex items-center justify-between"><span className="text-gray-700 dark:text-gray-300">{subject}</span><div className="flex items-center space-x-2"><div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2"><div className="bg-primary-500 h-2 rounded-full" style={{ width: `${avg}%` }}></div></div><span className="text-sm font-medium">{avg.toFixed(0)}%</span></div></div>)}</div></div>
            <div><h4 className="font-semibold mb-4">Performance Highlights</h4><div className="space-y-4"><div><h5 className="text-sm font-medium text-success-600 mb-2">TOP PERFORMERS</h5><ul className="space-y-1">{topPerformers.map(s => <li key={s.id} className="text-sm">{s.name}: {s.percentage}%</li>)}</ul></div><div><h5 className="text-sm font-medium text-error-600 mb-2">NEEDS SUPPORT</h5><ul className="space-y-1">{needsSupport.map(s => <li key={s.id} className="text-sm">{s.name}: {s.percentage}%</li>)}</ul></div></div></div>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
