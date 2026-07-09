'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
         Clock, MapPin, Users, AlertCircle, CheckCircle, X, CalendarDays } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLocalStorageState } from '@/lib/useLocalStorage'
import { initialEvents, type SchoolEvent } from '@/lib/eventsData'

interface DashboardCalendarProps {
  date: Date
  onDateChange: (date: Date) => void
}

interface CalendarEvent {
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

export default function DashboardCalendar({ date, onDateChange }: DashboardCalendarProps) {
  const router = useRouter()
  const [currentMonth, setCurrentMonth] = useState(date)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [events] = useLocalStorageState<SchoolEvent[]>('esm_events', initialEvents)

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate()

  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay()

  const toISODate = (value: string) => {
    const trimmed = value.trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
    const parsed = new Date(trimmed)
    if (Number.isNaN(parsed.getTime())) return ''
    return parsed.toISOString().slice(0, 10)
  }

  const calendarEvents = useMemo<CalendarEvent[]>(() => {
    return events
      .map((event) => ({
        id: event.id,
        title: event.title,
        date: toISODate(event.date),
        time: event.time,
        location: event.location,
        attendees: Number(event.attendees) || 0,
        type: event.type,
        priority: event.priority,
        organizer: event.organizer,
      }))
      .filter((event) => event.date)
  }, [events])

  const thisWeekCount = useMemo(() => {
    if (!calendarEvents.length) return 0
    const now = new Date()
    const start = new Date(now)
    start.setDate(now.getDate() - now.getDay())
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    end.setHours(23, 59, 59, 999)
    return calendarEvents.filter((event) => {
      const eventDate = new Date(event.date)
      return eventDate >= start && eventDate <= end
    }).length
  }, [calendarEvents])

  const highPriorityCount = useMemo(
    () => calendarEvents.filter((event) => event.priority === 'high').length,
    [calendarEvents]
  )

  const totalAttendees = useMemo(
    () => calendarEvents.reduce((sum, event) => sum + event.attendees, 0),
    [calendarEvents]
  )

  const getEventColor = (type: string) => {
    switch(type) {
      case 'academic': return 'bg-blue-500'
      case 'administrative': return 'bg-purple-500'
      case 'training': return 'bg-amber-500'
      case 'cultural': return 'bg-pink-500'
      case 'sports': return 'bg-emerald-500'
      case 'meeting': return 'bg-blue-500'
      case 'exam': return 'bg-purple-500'
      case 'deadline': return 'bg-rose-500'
      case 'event': return 'bg-emerald-500'
      default: return 'bg-slate-500'
    }
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

  const getPriorityIcon = (priority: string) => {
    switch(priority) {
      case 'high': return <AlertCircle className="h-4 w-4 text-rose-500" />
      case 'medium': return <Clock className="h-4 w-4 text-amber-500" />
      case 'low': return <CheckCircle className="h-4 w-4 text-emerald-500" />
      default: return <Clock className="h-4 w-4 text-slate-500" />
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth)
    newMonth.setMonth(currentMonth.getMonth() + (direction === 'next' ? 1 : -1))
    setCurrentMonth(newMonth)
  }

  const getEventsForDay = (day: number) => {
    const dateString = `${currentMonth.getFullYear()}-${(currentMonth.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
    return calendarEvents.filter(event => event.date === dateString)
  }

  const handleDayClick = (day: number) => {
    const dayEvents = getEventsForDay(day)
    if (dayEvents.length > 0) {
      setSelectedEvent(dayEvents[0])
    } else {
      onDateChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))
    }
  }

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const handleViewAllEvents = () => {
    router.push('/events') // Adjust this path to your actual events page route
  }

  return (
    <>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-lg transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5 text-teal-500" />
            <h3 className="font-bold text-slate-900 dark:text-white">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="px-3 py-1 text-sm bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-lg hover:bg-teal-200 dark:hover:bg-teal-800/40"
            >
              Today
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Week Days */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-slate-500 dark:text-slate-400 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty days before first day */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="h-10 rounded-lg" />
          ))}

          {/* Days of month */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const isToday = day === new Date().getDate() && 
                           currentMonth.getMonth() === new Date().getMonth() &&
                           currentMonth.getFullYear() === new Date().getFullYear()
            
            const dayEvents = getEventsForDay(day)
            const hasMultipleEvents = dayEvents.length > 1

            return (
              <button
                key={day}
                onClick={() => handleDayClick(day)}
                className={`
                  h-10 rounded-lg flex flex-col items-center justify-center relative cursor-pointer
                  ${isToday
                    ? 'bg-teal-500 text-white'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                  }
                  transition-colors
                `}
              >
                <span className={`text-sm font-medium ${isToday ? 'text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                  {day}
                </span>
                
                {/* Event Indicators */}
                {dayEvents.length > 0 && (
                  <div className="flex justify-center mt-1 space-x-0.5">
                    {hasMultipleEvents ? (
                      <div className="flex space-x-0.5">
                        {dayEvents.slice(0, 3).map((event, idx) => (
                          <div
                            key={idx}
                            className={`h-1.5 w-1.5 rounded-full ${getEventColor(event.type)}`}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className={`h-1.5 w-1.5 rounded-full ${getEventColor(dayEvents[0].type)}`} />
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* View All Events Button */}
        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={handleViewAllEvents}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-lg hover:shadow-lg transition-all duration-300 group"
          >
            <CalendarDays className="h-5 w-5" />
            <span className="font-medium">View All Events</span>
            <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
          </button>
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
                  <CalendarIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Event Details
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {formatEventDate(selectedEvent.date)}
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
