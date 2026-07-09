'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardShell from '@/components/dashboard/layout/DashboardShell'
import { Calendar, Clock, MapPin, Users, AlertCircle, 
         CheckCircle, ChevronLeft, Filter, Search, Plus, 
         Grid, List, Download, Share2, Edit, Trash2, Eye, X } from 'lucide-react'
import { useLocalStorageState } from '@/lib/useLocalStorage'
import { initialEvents, type SchoolEvent } from '@/lib/eventsData'

export default function UpcomingEventsPage() {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [selectedEvent, setSelectedEvent] = useState<SchoolEvent | null>(null)
  const [events, setEvents] = useLocalStorageState<SchoolEvent[]>('esm_events', initialEvents)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingEventId, setEditingEventId] = useState<number | null>(null)
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    attendees: 0,
    type: 'academic',
    priority: 'medium',
    organizer: '',
    description: '',
  })

  const handleDeleteEvent = (id: number) => {
    setEvents((prev) => prev.filter((event) => event.id !== id))
  }

  const handleEditEvent = (event: SchoolEvent) => {
    const parsedDate = new Date(event.date)
    const dateISO = Number.isNaN(parsedDate.getTime())
      ? event.date
      : parsedDate.toISOString().slice(0, 10)
    setNewEvent({
      title: event.title,
      date: dateISO,
      time: event.time,
      location: event.location,
      attendees: event.attendees,
      type: event.type,
      priority: event.priority,
      organizer: event.organizer,
      description: event.description,
    })
    setEditingEventId(event.id)
    setShowCreateForm(true)
  }

  const handleCreateEvent = () => {
    if (!newEvent.title || !newEvent.date || !newEvent.time || !newEvent.location) return
    const nextId = events.length ? Math.max(...events.map((event) => event.id)) + 1 : 1
    const formattedDate = newEvent.date
      ? new Date(newEvent.date).toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric',
      })
      : newEvent.date

    if (editingEventId) {
      setEvents((prev) =>
        prev.map((event) =>
          event.id === editingEventId
            ? {
                ...event,
                title: newEvent.title,
                date: formattedDate,
                time: newEvent.time,
                location: newEvent.location,
                attendees: Number(newEvent.attendees) || 0,
                type: newEvent.type,
                priority: newEvent.priority,
                organizer: newEvent.organizer || 'School Office',
                description: newEvent.description || 'Updated event.',
              }
            : event
        )
      )
    } else {
      setEvents((prev) => [
        {
          id: nextId,
          title: newEvent.title,
          date: formattedDate,
          time: newEvent.time,
          location: newEvent.location,
          attendees: Number(newEvent.attendees) || 0,
          type: newEvent.type,
          priority: newEvent.priority,
          organizer: newEvent.organizer || 'School Office',
          description: newEvent.description || 'New event added.',
        },
        ...prev,
      ])
    }
    setShowCreateForm(false)
    setEditingEventId(null)
    setNewEvent({
      title: '',
      date: '',
      time: '',
      location: '',
      attendees: 0,
      type: 'academic',
      priority: 'medium',
      organizer: '',
      description: '',
    })
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
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch(priority) {
      case 'high': return <AlertCircle className="h-4 w-4 text-rose-500" />
      case 'medium': return <Clock className="h-4 w-4 text-amber-500" />
      case 'low': return <CheckCircle className="h-4 w-4 text-emerald-500" />
      default: return <Clock className="h-4 w-4 text-slate-500" />
    }
  }

  const eventTypes = [
    { id: 'all', label: 'All Events', color: 'bg-slate-500' },
    { id: 'academic', label: 'Academic', color: 'bg-blue-500' },
    { id: 'administrative', label: 'Administrative', color: 'bg-purple-500' },
    { id: 'cultural', label: 'Cultural', color: 'bg-pink-500' },
    { id: 'sports', label: 'Sports', color: 'bg-emerald-500' },
    { id: 'training', label: 'Training', color: 'bg-amber-500' },
  ]

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.organizer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === 'all' || event.type === filterType
    return matchesSearch && matchesType
  })

  const stats = {
    total: events.length,
    highPriority: events.filter((e) => e.priority === 'high').length,
    thisMonth: events.filter((e) => {
      const parsed = new Date(e.date)
      if (Number.isNaN(parsed.getTime())) return false
      const now = new Date()
      return parsed.getMonth() === now.getMonth() && parsed.getFullYear() === now.getFullYear()
    }).length,
    totalAttendees: events.reduce((sum, e) => sum + e.attendees, 0),
  }

  return (
    <DashboardShell>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-4"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </button>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Upcoming Events
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Manage and view all scheduled events
            </p>
          </div>
          
          <button
            onClick={() => setShowCreateForm((prev) => !prev)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:shadow-lg transition-all"
          >
            <Plus className="h-5 w-5" />
            <span>{showCreateForm ? 'Close Form' : 'Create New Event'}</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Events</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
              </div>
              <Calendar className="h-6 w-6 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">High Priority</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.highPriority}</p>
              </div>
              <AlertCircle className="h-6 w-6 text-rose-500" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">This Month</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.thisMonth}</p>
              </div>
              <Clock className="h-6 w-6 text-emerald-500" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Attendees</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {(stats.totalAttendees / 1000).toFixed(1)}K
                </p>
              </div>
              <Users className="h-6 w-6 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {showCreateForm && (
        <div className="mb-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            New Event Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Event title"
              value={newEvent.title}
              onChange={(event) => setNewEvent((prev) => ({ ...prev, title: event.target.value }))}
              className="input-field"
            />
            <input
              type="date"
              value={newEvent.date}
              onChange={(event) => setNewEvent((prev) => ({ ...prev, date: event.target.value }))}
              className="input-field"
            />
            <input
              type="text"
              placeholder="Time (e.g. 9:00 AM - 4:00 PM)"
              value={newEvent.time}
              onChange={(event) => setNewEvent((prev) => ({ ...prev, time: event.target.value }))}
              className="input-field"
            />
            <input
              type="text"
              placeholder="Location"
              value={newEvent.location}
              onChange={(event) =>
                setNewEvent((prev) => ({ ...prev, location: event.target.value }))
              }
              className="input-field"
            />
            <input
              type="number"
              placeholder="Expected attendees"
              value={newEvent.attendees}
              onChange={(event) =>
                setNewEvent((prev) => ({ ...prev, attendees: Number(event.target.value) }))
              }
              className="input-field"
            />
            <input
              type="text"
              placeholder="Organizer"
              value={newEvent.organizer}
              onChange={(event) =>
                setNewEvent((prev) => ({ ...prev, organizer: event.target.value }))
              }
              className="input-field"
            />
            <select
              value={newEvent.type}
              onChange={(event) => setNewEvent((prev) => ({ ...prev, type: event.target.value }))}
              className="input-field"
            >
              <option value="academic">Academic</option>
              <option value="administrative">Administrative</option>
              <option value="training">Training</option>
              <option value="cultural">Cultural</option>
              <option value="sports">Sports</option>
            </select>
            <select
              value={newEvent.priority}
              onChange={(event) =>
                setNewEvent((prev) => ({ ...prev, priority: event.target.value }))
              }
              className="input-field"
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <textarea
              placeholder="Description"
              value={newEvent.description}
              onChange={(event) =>
                setNewEvent((prev) => ({ ...prev, description: event.target.value }))
              }
              className="input-field md:col-span-2"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={() => {
                setShowCreateForm(false)
                setEditingEventId(null)
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="button" onClick={handleCreateEvent} className="btn-primary">
              {editingEventId ? 'Update Event' : 'Add Event'}
            </button>
          </div>
        </div>
      )}

      {/* Filters and Controls */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Event Type Filters */}
          <div className="flex flex-wrap gap-2">
            {eventTypes.map(type => (
              <button
                key={type.id}
                onClick={() => setFilterType(type.id)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-colors ${
                  filterType === type.id
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <div className={`h-2 w-2 rounded-full ${type.color}`} />
                <span className="text-sm font-medium">{type.label}</span>
              </button>
            ))}
          </div>

          {/* View Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="List View"
            >
              <List className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Calendar View"
            >
              <Grid className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
              <Filter className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
              <Download className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              No events found
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Try adjusting your search or filter criteria
            </p>
          </div>
        ) : (
          filteredEvents.map(event => (
            <div
              key={event.id}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getPriorityIcon(event.priority)}
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        {event.title}
                      </h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(event.type)}`}>
                        {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(event.priority)}`}>
                        {event.priority.charAt(0).toUpperCase() + event.priority.slice(1)} Priority
                      </span>
                    </div>
                  </div>

                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    {event.description}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5 text-slate-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Date</p>
                        <p className="font-medium text-slate-900 dark:text-white">{event.date}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-slate-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Time</p>
                        <p className="font-medium text-slate-900 dark:text-white">{event.time}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-5 w-5 text-slate-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Location</p>
                        <p className="font-medium text-slate-900 dark:text-white">{event.location}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-slate-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Attendees</p>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {event.attendees.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Organized by <span className="font-medium text-slate-900 dark:text-white">{event.organizer}</span>
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex md:flex-col space-x-2 md:space-x-0 md:space-y-2">
                  <button
                    onClick={() => setSelectedEvent(event)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View</span>
                  </button>
                  <button
                    onClick={() => handleEditEvent(event)}
                    className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center space-x-2"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit</span>
                  </button>
                  <button className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center space-x-2">
                    <Share2 className="h-4 w-4" />
                    <span>Share</span>
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(event.id)}
                    className="px-4 py-2 border border-rose-300 dark:border-rose-600 text-rose-700 dark:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors flex items-center space-x-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Event Details
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Complete event information
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Event Details */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  {getPriorityIcon(selectedEvent.priority)}
                  <h4 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {selectedEvent.title}
                  </h4>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(selectedEvent.type)}`}>
                      {selectedEvent.type.charAt(0).toUpperCase() + selectedEvent.type.slice(1)}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(selectedEvent.priority)}`}>
                      {selectedEvent.priority.charAt(0).toUpperCase() + selectedEvent.priority.slice(1)} Priority
                    </span>
                  </div>
                </div>
                
                <p className="text-slate-700 dark:text-slate-300 mb-6">
                  {selectedEvent.description}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Date & Time</p>
                      <div className="flex items-center space-x-3">
                        <Calendar className="h-5 w-5 text-slate-400" />
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{selectedEvent.date}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{selectedEvent.time}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Location</p>
                      <div className="flex items-center space-x-3">
                        <MapPin className="h-5 w-5 text-slate-400" />
                        <p className="font-medium text-slate-900 dark:text-white">{selectedEvent.location}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Attendees & Organizer</p>
                      <div className="flex items-center space-x-3 mb-3">
                        <Users className="h-5 w-5 text-slate-400" />
                        <p className="font-medium text-slate-900 dark:text-white">
                          {selectedEvent.attendees.toLocaleString()} expected attendees
                        </p>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Organized by <span className="font-medium text-slate-900 dark:text-white">{selectedEvent.organizer}</span>
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Status</p>
                      <div className="flex items-center space-x-2">
                        {getPriorityIcon(selectedEvent.priority)}
                        <span className="font-medium text-slate-900 dark:text-white capitalize">
                          {selectedEvent.priority} Priority • Upcoming
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-6 border-t border-slate-200 dark:border-slate-700">
                <button className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:shadow-lg transition-all flex items-center justify-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Add to Calendar</span>
                </button>
                <button className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center space-x-2">
                  <Share2 className="h-5 w-5" />
                  <span>Share Event</span>
                </button>
                <button className="flex-1 px-4 py-3 border border-emerald-300 dark:border-emerald-600 text-emerald-700 dark:text-emerald-400 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors flex items-center justify-center space-x-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>Mark Attending</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  )
}
