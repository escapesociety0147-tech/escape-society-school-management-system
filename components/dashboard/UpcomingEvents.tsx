'use client'

import { useMemo, useState } from 'react'
import { Calendar, Clock, MapPin, Users, AlertCircle, 
         CheckCircle, ChevronRight, MoreVertical, Plus, X } from 'lucide-react'
import { useLocalStorageState } from '@/lib/useLocalStorage'
import { initialEvents, type SchoolEvent } from '@/lib/eventsData'

interface Event {
  id: number
  title: string
  date: string
  time: string
  location: string
  attendees: number
  type: string
  priority: string
  organizer: string
}

export default function UpcomingEvents() {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [events] = useLocalStorageState<SchoolEvent[]>('esm_events', initialEvents)
  const upcomingEvents: Event[] = events

  const thisWeekCount = useMemo(() => {
    if (!upcomingEvents.length) return 0
    const now = new Date()
    const start = new Date(now)
    start.setDate(now.getDate() - now.getDay())
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    end.setHours(23, 59, 59, 999)
    return upcomingEvents.filter((event) => {
      const parsed = new Date(event.date)
      return !Number.isNaN(parsed.getTime()) && parsed >= start && parsed <= end
    }).length
  }, [upcomingEvents])

  const highPriorityCount = useMemo(
    () => upcomingEvents.filter((event) => event.priority === 'high').length,
    [upcomingEvents]
  )

  const totalAttendees = useMemo(
    () => upcomingEvents.reduce((sum, event) => sum + (event.attendees || 0), 0),
    [upcomingEvents]
  )

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

  const getPriorityIcon = (priority: string) => {
    switch(priority) {
      case 'high': return <AlertCircle className="h-4 w-4 text-rose-500" />
      case 'medium': return <Clock className="h-4 w-4 text-amber-500" />
      case 'low': return <CheckCircle className="h-4 w-4 text-emerald-500" />
      default: return <Clock className="h-4 w-4 text-slate-500" />
    }
  }

  const getEventColor = (type: string) => {
    switch(type) {
      case 'academic': return 'bg-blue-500'
      case 'administrative': return 'bg-purple-500'
      case 'training': return 'bg-amber-500'
      case 'cultural': return 'bg-pink-500'
      case 'sports': return 'bg-emerald-500'
      default: return 'bg-slate-500'
    }
  }

  return (
    <>
      <div className="relative group">
        {/* Background Glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
        
        <div className="relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-lg transition-all duration-300">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Upcoming Events
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {upcomingEvents.length} events scheduled this month
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-900 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  List
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'calendar'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Calendar
                </button>
              </div>
              <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <MoreVertical className="h-5 w-5 text-slate-500 dark:text-slate-400" />
              </button>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-3 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">This Week</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{thisWeekCount}</p>
                </div>
                <AlertCircle className="h-5 w-5 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-3 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">High Priority</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{highPriorityCount}</p>
                </div>
                <AlertCircle className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-3 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Total Attendees</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {totalAttendees ? `${(totalAttendees / 1000).toFixed(1)}K` : '0'}
                  </p>
                </div>
                <Users className="h-5 w-5 text-purple-500" />
              </div>
            </div>
          </div>

          {/* Events List */}
          <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin pr-2">
            {upcomingEvents.map((event) => (
              <button
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className="w-full text-left group/item bg-gradient-to-r from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getPriorityIcon(event.priority)}
                      <h4 className="font-semibold text-slate-900 dark:text-white">
                        {event.title}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(event.type)}`}>
                        {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {event.date}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-slate-400" />
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {event.time}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        <span className="text-sm text-slate-600 dark:text-slate-400 truncate">
                          {event.location}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-slate-400" />
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {event.attendees.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        Organized by {event.organizer}
                      </span>
                      <ChevronRight className="h-4 w-4 text-slate-400 group-hover/item:text-teal-500 transition-colors" />
                    </div>
                  </div>
                </div>
              </button>
            ))}
            {upcomingEvents.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No events scheduled yet.
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:shadow-lg transition-all">
                <Plus className="h-4 w-4" />
                <span>Add New Event</span>
              </button>
              <button className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium">
                View All Events →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${getEventColor(selectedEvent.type)}`}>
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Event Details
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {selectedEvent.date}
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
            <div className="space-y-4">
              <div>
                <div className="flex items-center space-x-3 mb-3">
                  {getPriorityIcon(selectedEvent.priority)}
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                    {selectedEvent.title}
                  </h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(selectedEvent.type)}`}>
                    {selectedEvent.type.charAt(0).toUpperCase() + selectedEvent.type.slice(1)}
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Time</p>
                      <p className="font-medium text-slate-900 dark:text-white">{selectedEvent.time}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Location</p>
                      <p className="font-medium text-slate-900 dark:text-white">{selectedEvent.location}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Attendees</p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {selectedEvent.attendees.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Organizer</p>
                    <p className="font-medium text-slate-900 dark:text-white">{selectedEvent.organizer}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Priority</p>
                    <div className="flex items-center space-x-2">
                      {getPriorityIcon(selectedEvent.priority)}
                      <span className="font-medium text-slate-900 dark:text-white capitalize">
                        {selectedEvent.priority} Priority
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button className="flex-1 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors">
                  Add to Calendar
                </button>
                <button className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
