export type UserRole = 'admin' | 'teacher' | 'parent' | 'student'

export type ThreadParticipant = {
  role: UserRole
  name: string
  title: string
  email?: string
  userId?: string
}

export type MessageThread = {
  id: number
  participants: ThreadParticipant[]
  lastMessage: string
  time: string
  status: 'Online' | 'Offline' | 'Busy'
  unreadBy: Record<UserRole, number>
}

export type MessageEntry = {
  senderRole: UserRole
  senderName: string
  message: string
  time: string
  timestamp?: number
}

export const initialMessageThreads: MessageThread[] = []

export const initialThreadMessages: Record<number, MessageEntry[]> = {}
