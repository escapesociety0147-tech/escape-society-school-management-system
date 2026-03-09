'use client'

import { useMemo, useState } from 'react'
import { Calendar, Clock, MapPin, Users } from 'lucide-react'
import { useLocalStorageState } from '@/lib/useLocalStorage'
import { initialEvents, type SchoolEvent } from '@/lib/eventsData'

export default function ParentEventsPage() {
  const [events] = useLocalStorageState<SchoolEvent[]>('esm_events', initialEvents)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch =
        event.title.toLowerCase().includes(search.toLowerCase()) ||
        event.organizer.toLowerCase().includes(search.toLowerCase())
      const matchesType = filterType === 'all' || event.type === filterType
      return matchesSearch && matchesType
    })
  }, [events, search, filterType])

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Calendar className="h-6 w-6 text-primary-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Upcoming Events
          </h2>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Stay synced with upcoming school events and parent activities.
        </p>
      </div>

      <div className="card flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <input
          className="input-field flex-1"
          placeholder="Search events"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          className="input-field w-full lg:w-56"
          value={filterType}
          onChange={(event) => setFilterType(event.target.value)}
        >
          <option value="all">All Types</option>
          <option value="academic">Academic</option>
          <option value="administrative">Administrative</option>
          <option value="training">Training</option>
          <option value="cultural">Cultural</option>
          <option value="sports">Sports</option>
        </select>
      </div>

      <div className="space-y-4">
        {filteredEvents.map((event) => (
          <div
            key={event.id}
            className="card flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
          >
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {event.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {event.description}
              </p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300">
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {event.date}
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {event.time}
                </span>
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {event.location}
                </span>
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {event.attendees} attending
                </span>
              </div>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400">
              {event.type}
            </span>
          </div>
        ))}
        {filteredEvents.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No events match your search.
          </p>
        )}
      </div>
    </div>
  )
}
