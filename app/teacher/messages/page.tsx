'use client'

import { useEffect, useMemo, useState } from 'react'
import { Mail, MessageSquare, Send, UserCircle } from 'lucide-react'
import { useLocalStorageState } from '@/lib/useLocalStorage'
import type { AuthUser } from '@/lib/authStore'
import { resolveUserProfile, type UserProfileSnapshot } from '@/lib/userDirectory'
import UserProfileModal from '@/components/messages/UserProfileModal'
import {
  initialMessageThreads,
  initialThreadMessages,
  type MessageEntry,
  type MessageThread,
  type UserRole,
} from '@/lib/messagesData'

export default function TeacherMessagesPage() {
  const role: UserRole = 'teacher'
  const [profile] = useLocalStorageState('esm_teacher_profile', {
    name: '',
    role: '',
    email: '',
    phone: '',
  })
  const [threads, setThreads] = useLocalStorageState<MessageThread[]>(
    'esm_message_threads',
    initialMessageThreads
  )
  const [users] = useLocalStorageState<AuthUser[]>('esm_users', [])
  const [session] = useLocalStorageState('esm_user_session', {
    id: '',
    role: '',
    name: '',
    email: '',
  })
  const [messagesByThread, setMessagesByThread] = useLocalStorageState<
    Record<number, MessageEntry[]>
  >('esm_thread_messages', initialThreadMessages)
  const [activeThreadId, setActiveThreadId] = useState(0)
  const [draftMessage, setDraftMessage] = useState('')
  const [showNewThread, setShowNewThread] = useState(false)
  const [newThread, setNewThread] = useState({
    status: 'Online' as MessageThread['status'],
    recipientId: '',
  })
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [profileSnapshot, setProfileSnapshot] = useState<UserProfileSnapshot | null>(null)

  const visibleThreads = useMemo(
    () =>
      threads.filter((thread) =>
        thread.participants.some((participant) => participant.role === role)
      ),
    [threads]
  )
  const recipientOptions = useMemo(
    () => users.filter((user) => user.id !== session.id),
    [users, session.id]
  )

  useEffect(() => {
    if (!visibleThreads.length) return
    if (!visibleThreads.some((thread) => thread.id === activeThreadId)) {
      setActiveThreadId(visibleThreads[0].id)
    }
  }, [activeThreadId, visibleThreads])

  const getThreadDisplay = (thread: MessageThread) => {
    const counterpart =
      thread.participants.find((participant) => participant.role !== role) ??
      thread.participants[0]
    return {
      name: counterpart?.name ?? 'Conversation',
      role: counterpart?.title ?? 'Family',
    }
  }

  const activeThread = visibleThreads.find((thread) => thread.id === activeThreadId)
  const activeDisplay = activeThread ? getThreadDisplay(activeThread) : null
  const activeConversation = activeThread ? messagesByThread[activeThread.id] || [] : []
  const unreadTotal = visibleThreads.reduce(
    (sum, thread) => sum + (thread.unreadBy?.[role] ?? 0),
    0
  )
  const unreadThreads = visibleThreads.filter(
    (thread) => (thread.unreadBy?.[role] ?? 0) > 0
  ).length
  const responseStats = useMemo(() => {
    let totalMs = 0
    let responses = 0
    visibleThreads.forEach((thread) => {
      const messages = messagesByThread[thread.id] || []
      for (let index = 1; index < messages.length; index += 1) {
        const previous = messages[index - 1]
        const current = messages[index]
        if (current.senderRole === role && previous.senderRole !== role) {
          const previousTime = previous.timestamp || 0
          const currentTime = current.timestamp || 0
          if (previousTime && currentTime && currentTime >= previousTime) {
            totalMs += currentTime - previousTime
            responses += 1
          }
        }
      }
    })
    return {
      avgMinutes: responses ? Math.round(totalMs / 60000) : null,
      responses,
    }
  }, [messagesByThread, role, visibleThreads])

  const handleSelectThread = (id: number) => {
    setActiveThreadId(id)
    setThreads((prev) =>
      prev.map((thread) =>
        thread.id === id
          ? { ...thread, unreadBy: { ...thread.unreadBy, [role]: 0 } }
          : thread
      )
    )
  }

  const handleSendMessage = () => {
    if (!draftMessage.trim() || !activeThread) return
    const message: MessageEntry = {
      senderRole: role,
      senderName: profile.name || 'Teacher',
      message: draftMessage.trim(),
      time: new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      }),
      timestamp: Date.now(),
    }

    setMessagesByThread((prev) => ({
      ...prev,
      [activeThread.id]: [...(prev[activeThread.id] || []), message],
    }))
    setThreads((prev) =>
      prev.map((thread) => {
        if (thread.id !== activeThread.id) return thread
        const nextUnread = { ...thread.unreadBy }
        thread.participants.forEach((participant) => {
          if (participant.role === role) {
            nextUnread[participant.role] = 0
          } else {
            nextUnread[participant.role] = (nextUnread[participant.role] || 0) + 1
          }
        })
        return {
          ...thread,
          lastMessage: draftMessage.trim(),
          time: 'Just now',
          unreadBy: nextUnread,
        }
      })
    )
    setDraftMessage('')
  }

  const handleCreateThread = () => {
    if (!newThread.recipientId) return
    const recipient = recipientOptions.find((user) => user.id === newThread.recipientId)
    if (!recipient) return
    const recipientRole = recipient.role as UserRole
    const recipientTitle =
      recipient.role === 'admin'
        ? 'School Admin'
        : recipient.role.charAt(0).toUpperCase() + recipient.role.slice(1)
    const nextId = threads.length ? Math.max(...threads.map((thread) => thread.id)) + 1 : 1
    const newEntry: MessageThread = {
      id: nextId,
      participants: [
        {
          role,
          name: profile.name || session.name || 'Teacher',
          title: profile.role || 'Teacher',
          email: profile.email || session.email,
          userId: session.id,
        },
        {
          role: recipientRole,
          name: recipient.name,
          title: recipientTitle,
          email: recipient.email,
          userId: recipient.id,
        },
      ],
      lastMessage: '',
      time: 'Just now',
      status: newThread.status,
      unreadBy: { admin: 0, teacher: 0, parent: 0, student: 0 },
    }
    setThreads((prev) => [newEntry, ...prev])
    setMessagesByThread((prev) => ({ ...prev, [nextId]: [] }))
    setActiveThreadId(nextId)
    setShowNewThread(false)
    setNewThread({ recipientId: '', status: 'Online' })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary-500" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Parent Messages
            </h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Communicate with families and keep follow-ups organized.
          </p>
        </div>
        <button
          className="btn-primary flex items-center gap-2"
          type="button"
          onClick={() => setShowNewThread((prev) => !prev)}
        >
          <Mail className="h-4 w-4" />
          {showNewThread ? 'Close' : 'New Message'}
        </button>
      </div>

      {showNewThread && (
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm text-gray-600 dark:text-gray-400">Recipient</label>
              <select
                className="input-field mt-1"
                value={newThread.recipientId}
                onChange={(event) =>
                  setNewThread((prev) => ({ ...prev, recipientId: event.target.value }))
                }
              >
                <option value="">Select a user</option>
                {recipientOptions.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.role})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400">Status</label>
              <select
                className="input-field mt-1"
                value={newThread.status}
                onChange={(event) =>
                  setNewThread((prev) => ({
                    ...prev,
                    status: event.target.value as MessageThread['status'],
                  }))
                }
              >
                <option>Online</option>
                <option>Offline</option>
                <option>Busy</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowNewThread(false)}
            >
              Cancel
            </button>
            <button type="button" className="btn-primary" onClick={handleCreateThread}>
              Create Thread
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Unread Threads</h3>
            <MessageSquare className="h-5 w-5 text-primary-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {unreadThreads}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {unreadTotal} unread messages
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Avg Response</h3>
            <Send className="h-5 w-5 text-success-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {responseStats.avgMinutes === null ? '--' : `${responseStats.avgMinutes}m`}
          </p>
          <p className="text-sm text-success-600 dark:text-success-400 mt-1">
            {responseStats.avgMinutes === null
              ? 'No response data yet.'
              : `${responseStats.responses} replies tracked`}
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Active Families</h3>
            <UserCircle className="h-5 w-5 text-info-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {visibleThreads.length}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            In your inbox
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Follow-ups</h3>
            <Mail className="h-5 w-5 text-warning-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{unreadThreads}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Threads awaiting reply
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="card xl:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Conversations</h3>
            <button className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
              View all
            </button>
          </div>
          <div className="space-y-3">
            {visibleThreads.map((thread) => {
              const display = getThreadDisplay(thread)
              const unread = thread.unreadBy?.[role] ?? 0
              return (
                <div
                  key={thread.id}
                  className={`p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition ${
                    thread.id === activeThread?.id
                      ? 'bg-primary-50 dark:bg-primary-900/20'
                      : ''
                  }`}
                  onClick={() => handleSelectThread(thread.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {display.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {display.role} - {thread.status}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        {thread.lastMessage}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {thread.time}
                      </p>
                      {unread > 0 && (
                        <span className="inline-flex items-center justify-center mt-2 h-6 w-6 rounded-full bg-primary-500 text-white text-xs font-semibold">
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            {visibleThreads.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No conversations yet.
              </p>
            )}
          </div>
        </div>

        <div className="card xl:col-span-2">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Active conversation
              </p>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {activeDisplay?.name ?? 'No conversation selected'}
              </h3>
              {activeThread && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {activeDisplay?.role ?? 'Family'} - {activeThread.status}
                </p>
              )}
            </div>
            <button
              className="btn-secondary text-sm px-3 py-1.5"
              onClick={() => {
                if (!activeThread) return
                const counterpart =
                  activeThread.participants.find((participant) => participant.role !== role) ??
                  activeThread.participants[0]
                if (!counterpart) return
                const snapshot = resolveUserProfile(counterpart)
                if (snapshot) {
                  setProfileSnapshot(snapshot)
                  setProfileModalOpen(true)
                }
              }}
            >
              View profile
            </button>
          </div>

          <div className="chat-container border border-gray-200 dark:border-gray-700 rounded-lg">
            {activeConversation.map((item, index) => {
              const isOutgoing = item.senderRole === role
              return (
                <div
                  key={`${item.time}-${index}`}
                  className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                      isOutgoing
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    <p className="text-sm">{item.message}</p>
                    <p className="text-xs mt-1 opacity-70">{item.time}</p>
                  </div>
                </div>
              )
            })}
            {activeConversation.length === 0 && (
              <div className="p-6 text-sm text-gray-500 dark:text-gray-400">
                Select a conversation to view messages.
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
            <input
              type="text"
              placeholder="Write a reply..."
              className="input-field flex-1"
              value={draftMessage}
              onChange={(event) => setDraftMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  handleSendMessage()
                }
              }}
              disabled={!activeThread}
            />
            <button
              className="btn-primary flex items-center gap-2"
              onClick={handleSendMessage}
              disabled={!activeThread}
            >
              <Send className="h-4 w-4" />
              Send
            </button>
          </div>
        </div>
      </div>
      <UserProfileModal
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        name={profileSnapshot?.name || ''}
        role={profileSnapshot?.role || ''}
        email={profileSnapshot?.email}
        fields={profileSnapshot?.fields || []}
      />
    </div>
  )
}
