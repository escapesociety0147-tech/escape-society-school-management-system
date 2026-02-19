export type SchoolEvent = {
  id: number
  title: string
  date: string
  time: string
  location: string
  attendees: number
  type: string
  priority: string
  organizer: string
  description: string
}

export const initialEvents: SchoolEvent[] = []
