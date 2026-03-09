'use client'

import { apiFetch } from '@/lib/auth'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardShell from '@/components/dashboard/layout/DashboardShell'
import { Calendar, Clock, MapPin, Users, AlertCircle, CheckCircle, ChevronLeft, Search, Plus, List, Grid, Download, Share2, Edit, Trash2, Eye, X, RefreshCw } from 'lucide-react'
import type { SchoolEvent } from '@/lib/eventsData'

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

const getTypeColor = (type: string) => {
  switch(type) {
    case 'academic': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    case 'administrative': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
    case 'training': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    case 'cultural': return 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400'
    case 'sports': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    default: return 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400'
  }
}

const getPriorityColor = (priority: string) => {
  switch(priority) {
    case 'high': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
    case 'medium': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    case 'low': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    default: return 'bg-slate-100 text-slate-700'
  }
}

const getPriorityIcon = (priority: string) => {
  switch(priority) {
    case 'high': return <AlertCircle className="h-4 w-4 text-rose-500" />
    case 'medium': return <Clock className="h-4 w-4 text-amber-500" />
    default: return <CheckCircle className="h-4 w-4 text-emerald-500" />
  }
}

const emptyForm = { title: '', date: '', time: '', location: '', attendees: 0, type: 'academic', priority: 'medium', organizer: '', description: '' }

export default function UpcomingEventsPage() {
  const router = useRouter()
  const [events, setEvents] = useState<SchoolEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [selectedEvent, setSelectedEvent] = useState<SchoolEvent | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingEventId, setEditingEventId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [newEvent, setNewEvent] = useState(emptyForm)

  const fetchEvents = async () => {
    setLoading(true); setError('')
    try {
      const data = await apiFetch('/events')
      const mapped: SchoolEvent[] = data.map((e: any) => ({
        id: e.id,
        title: e.title,
        date: e.date,
        time: e.time || '',
        location: e.location || '',
        attendees: e.attendees || 0,
        type: e.event_type || 'academic',
        priority: e.priority || 'medium',
        organizer: e.organizer || 'School Office',
        description: e.description || '',
      }))
      setEvents(mapped)
    } catch (err: any) { setError(err.message || 'Failed to load events.') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchEvents() }, [])

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.organizer.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === 'all' || event.type === filterType
    return matchesSearch && matchesType
  })

  const stats = {
    total: events.length,
    highPriority: events.filter(e => e.priority === 'high').length,
    thisMonth: events.filter(e => { const d = new Date(e.date); const n = new Date(); return !isNaN(d.getTime()) && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear() }).length,
    totalAttendees: events.reduce((sum, e) => sum + e.attendees, 0),
  }

  const handleSaveEvent = async () => {
    if (!newEvent.title || !newEvent.date) { setFormError('Title and date are required.'); return }
    setSubmitting(true); setFormError('')
    try {
      if (editingEventId) {
        await apiFetch(`/events/${editingEventId}`, {
          method: 'PUT',
          body: JSON.stringify({ title: newEvent.title, date: newEvent.date, time: newEvent.time, location: newEvent.location, attendees: Number(newEvent.attendees), event_type: newEvent.type, priority: newEvent.priority, organizer: newEvent.organizer, description: newEvent.description }),
        })
      } else {
        await apiFetch('/events', {
          method: 'POST',
          body: JSON.stringify({ title: newEvent.title, date: newEvent.date, time: newEvent.time, location: newEvent.location, attendees: Number(newEvent.attendees), event_type: newEvent.type, priority: newEvent.priority, organizer: newEvent.organizer || 'School Office', description: newEvent.description }),
        })
      }
      setNewEvent(emptyForm); setShowCreateForm(false); setEditingEventId(null)
      await fetchEvents()
    } catch (err: any) { setFormError(err.message || 'Failed to save event.') }
    finally { setSubmitting(false) }
  }

  const handleEditEvent = (event: SchoolEvent) => {
    const d = new Date(event.date)
    setNewEvent({ title: event.title, date: !isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : event.date, time: event.time, location: event.location, attendees: event.attendees, type: event.type, priority: event.priority, organizer: event.organizer, description: event.description })
    setEditingEventId(event.id); setShowCreateForm(true)
  }

  const handleDeleteEvent = async (id: number) => {
    if (!confirm('Delete this event?')) return
    try { await apiFetch(`/events/${id}`, { method: 'DELETE' }); setEvents(prev => prev.filter(e => e.id !== id)) }
    catch (err: any) { alert(err.message) }
  }

  const eventTypes = [
    { id: 'all', label: 'All Events', color: 'bg-slate-500' },
    { id: 'academic', label: 'Academic', color: 'bg-blue-500' },
    { id: 'administrative', label: 'Administrative', color: 'bg-purple-500' },
    { id: 'cultural', label: 'Cultural', color: 'bg-pink-500' },
    { id: 'sports', label: 'Sports', color: 'bg-emerald-500' },
    { id: 'training', label: 'Training', color: 'bg-amber-500' },
  ]

  return (
    <DashboardShell>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <button onClick={() => router.back()} className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-4">
              <ChevronLeft className="h-4 w-4" /><span>Back to Dashboard</span>
            </button>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Upcoming Events</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">Manage and view all scheduled events</p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchEvents} className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <RefreshCw className="h-4 w-4" /><span>Refresh</span>
            </button>
            <button onClick={() => setShowCreateForm(p => !p)} className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:shadow-lg transition-all">
              <Plus className="h-5 w-5" /><span>{showCreateForm ? 'Close Form' : 'Create New Event'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-4 rounded-xl"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-600 dark:text-slate-400">Total Events</p><p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p></div><Calendar className="h-6 w-6 text-blue-500" /></div></div>
          <div className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 p-4 rounded-xl"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-600 dark:text-slate-400">High Priority</p><p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.highPriority}</p></div><AlertCircle className="h-6 w-6 text-rose-500" /></div></div>
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-4 rounded-xl"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-600 dark:text-slate-400">This Month</p><p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.thisMonth}</p></div><Clock className="h-6 w-6 text-emerald-500" /></div></div>
          <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 p-4 rounded-xl"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-600 dark:text-slate-400">Total Attendees</p><p className="text-2xl font-bold text-slate-900 dark:text-white">{(stats.totalAttendees / 1000).toFixed(1)}K</p></div><Users className="h-6 w-6 text-purple-500" /></div></div>
        </div>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex justify-between"><span>{error}</span><button onClick={fetchEvents} className="underline">Retry</button></div>}

      {showCreateForm && (
        <div className="mb-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">{editingEventId ? 'Edit Event' : 'New Event Details'}</h3>
          {formError && <p className="text-sm text-red-600 mb-3">{formError}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Event title *" value={newEvent.title} onChange={e => setNewEvent(p => ({ ...p, title: e.target.value }))} className="input-field" />
            <input type="date" value={newEvent.date} onChange={e => setNewEvent(p => ({ ...p, date: e.target.value }))} className="input-field" />
            <input type="text" placeholder="Time (e.g. 9:00 AM - 4:00 PM)" value={newEvent.time} onChange={e => setNewEvent(p => ({ ...p, time: e.target.value }))} className="input-field" />
            <input type="text" placeholder="Location" value={newEvent.location} onChange={e => setNewEvent(p => ({ ...p, location: e.target.value }))} className="input-field" />
            <input type="number" placeholder="Expected attendees" value={newEvent.attendees} onChange={e => setNewEvent(p => ({ ...p, attendees: Number(e.target.value) }))} className="input-field" />
            <input type="text" placeholder="Organizer" value={newEvent.organizer} onChange={e => setNewEvent(p => ({ ...p, organizer: e.target.value }))} className="input-field" />
            <select value={newEvent.type} onChange={e => setNewEvent(p => ({ ...p, type: e.target.value }))} className="input-field">
              <option value="academic">Academic</option><option value="administrative">Administrative</option><option value="training">Training</option><option value="cultural">Cultural</option><option value="sports">Sports</option>
            </select>
            <select value={newEvent.priority} onChange={e => setNewEvent(p => ({ ...p, priority: e.target.value }))} className="input-field">
              <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
            </select>
            <textarea placeholder="Description" value={newEvent.description} onChange={e => setNewEvent(p => ({ ...p, description: e.target.value }))} className="input-field md:col-span-2" rows={3} />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button type="button" onClick={() => { setShowCreateForm(false); setEditingEventId(null) }} className="btn-secondary">Cancel</button>
            <button type="button" onClick={handleSaveEvent} disabled={submitting} className="btn-primary disabled:opacity-60">{submitting ? 'Saving...' : editingEventId ? 'Update Event' : 'Add Event'}</button>
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input type="text" placeholder="Search events..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex flex-wrap gap-2">
            {eventTypes.map(type => (
              <button key={type.id} onClick={() => setFilterType(type.id)} className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-colors ${filterType === type.id ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400'}`}>
                <div className={`h-2 w-2 rounded-full ${type.color}`} /><span className="text-sm font-medium">{type.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-3"></div><p className="text-gray-500">Loading events...</p></div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-12"><Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" /><h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No events found</h3><p className="text-slate-600 dark:text-slate-400">Try adjusting your search or filter criteria</p></div>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map(event => (
            <div key={event.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-all">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">{getPriorityIcon(event.priority)}<h3 className="text-xl font-bold text-slate-900 dark:text-white">{event.title}</h3></div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(event.type)}`}>{event.type.charAt(0).toUpperCase() + event.type.slice(1)}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(event.priority)}`}>{event.priority.charAt(0).toUpperCase() + event.priority.slice(1)} Priority</span>
                    </div>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">{event.description}</p>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="flex items-center space-x-2"><Calendar className="h-5 w-5 text-slate-400" /><div><p className="text-sm text-slate-600 dark:text-slate-400">Date</p><p className="font-medium">{event.date}</p></div></div>
                    <div className="flex items-center space-x-2"><Clock className="h-5 w-5 text-slate-400" /><div><p className="text-sm text-slate-600 dark:text-slate-400">Time</p><p className="font-medium">{event.time}</p></div></div>
                    <div className="flex items-center space-x-2"><MapPin className="h-5 w-5 text-slate-400" /><div><p className="text-sm text-slate-600 dark:text-slate-400">Location</p><p className="font-medium">{event.location}</p></div></div>
                    <div className="flex items-center space-x-2"><Users className="h-5 w-5 text-slate-400" /><div><p className="text-sm text-slate-600 dark:text-slate-400">Attendees</p><p className="font-medium">{event.attendees.toLocaleString()}</p></div></div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700"><p className="text-sm text-slate-600 dark:text-slate-400">Organized by <span className="font-medium text-slate-900 dark:text-white">{event.organizer}</span></p></div>
                </div>
                <div className="flex md:flex-col space-x-2 md:space-x-0 md:space-y-2">
                  <button onClick={() => setSelectedEvent(event)} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2"><Eye className="h-4 w-4" /><span>View</span></button>
                  <button onClick={() => handleEditEvent(event)} className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center space-x-2"><Edit className="h-4 w-4" /><span>Edit</span></button>
                  <button onClick={() => handleDeleteEvent(event.id)} className="px-4 py-2 border border-rose-300 dark:border-rose-600 text-rose-700 dark:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center space-x-2"><Trash2 className="h-4 w-4" /><span>Delete</span></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3"><div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500"><Calendar className="h-6 w-6 text-white" /></div><div><h3 className="text-xl font-bold text-slate-900 dark:text-white">Event Details</h3><p className="text-sm text-slate-600 dark:text-slate-400">Complete event information</p></div></div>
              <button onClick={() => setSelectedEvent(null)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">{getPriorityIcon(selectedEvent.priority)}<h4 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedEvent.title}</h4></div>
              <p className="text-slate-700 dark:text-slate-300">{selectedEvent.description}</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-3"><Calendar className="h-5 w-5 text-slate-400" /><div><p className="font-medium">{selectedEvent.date}</p><p className="text-sm text-slate-600">{selectedEvent.time}</p></div></div>
                <div className="flex items-center space-x-3"><MapPin className="h-5 w-5 text-slate-400" /><p className="font-medium">{selectedEvent.location}</p></div>
                <div className="flex items-center space-x-3"><Users className="h-5 w-5 text-slate-400" /><p className="font-medium">{selectedEvent.attendees.toLocaleString()} attendees</p></div>
                <div className="flex items-center space-x-2"><span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(selectedEvent.type)}`}>{selectedEvent.type}</span><span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedEvent.priority)}`}>{selectedEvent.priority}</span></div>
              </div>
              <p className="text-sm text-slate-600">Organized by <span className="font-medium text-slate-900 dark:text-white">{selectedEvent.organizer}</span></p>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  )
}
