'use client'

import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  Bell,
  Calendar,
  CheckCircle,
  Filter,
  Info,
  Mail,
  Megaphone,
} from 'lucide-react'
import { useLocalStorageState } from '@/lib/useLocalStorage'
import { notify, type NotificationItem } from '@/lib/notifications'
import { pushToast } from '@/lib/toastBus'

const statusStyles: Record<string, string> = {
  Unread: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
  Read: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-800 dark:text-secondary-200',
  Urgent: 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-300',
}

const typeStyles: Record<string, string> = {
  Alert: 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-300',
  Announcement: 'bg-info-100 text-info-700 dark:bg-info-900/30 dark:text-info-300',
  Reminder: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300',
  Update: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300',
}

const notificationIcons: Record<string, typeof AlertTriangle> = {
  alert: AlertTriangle,
  mail: Mail,
  megaphone: Megaphone,
  calendar: Calendar,
  check: CheckCircle,
}

const schedules: Array<{ title: string; audience: string; next: string }> = []

export default function NotificationsContent() {
  const [notifications, setNotifications] = useLocalStorageState<NotificationItem[]>(
    'esm_notifications',
    []
  )
  const [categoryFilter, setCategoryFilter] = useState('All categories')
  const [statusFilter, setStatusFilter] = useState('All status')
  const deliveryStatus = notifications.length ? 'OK' : '--'
  const deliveryMessage = notifications.length
    ? 'Delivery tracking active.'
    : 'No delivery data yet.'

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      const matchesCategory =
        categoryFilter === 'All categories' ||
        notification.type.toLowerCase() === categoryFilter.toLowerCase()
      const matchesStatus =
        statusFilter === 'All status' || notification.status === statusFilter
      return matchesCategory && matchesStatus
    })
  }, [notifications, categoryFilter, statusFilter])

  const handleMarkAllRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({
        ...notification,
        status: notification.status === 'Urgent' ? 'Urgent' : 'Read',
      }))
    )
    pushToast({
      title: 'Notifications cleared',
      message: 'All non-urgent notifications marked as read.',
      variant: 'success',
    })
  }

  const handleCreateAnnouncement = () => {
    notify({
      title: 'New leadership update',
      message: 'A leadership update has been shared with all staff.',
      type: 'Announcement',
      channel: 'Leadership',
      iconKey: 'megaphone',
    })
  }

  const handleView = (id: number) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id && notification.status !== 'Urgent'
          ? { ...notification, status: 'Read' }
          : notification
      )
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary-500" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Notifications
            </h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track alerts, announcements, and updates across departments.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="btn-secondary" onClick={handleMarkAllRead}>
            Mark all as read
          </button>
          <button className="btn-primary" onClick={handleCreateAnnouncement}>
            Create announcement
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Unread Alerts</h3>
            <AlertTriangle className="h-5 w-5 text-error-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {notifications.filter((notification) => notification.status === 'Unread').length}
          </p>
          <p className="text-sm text-error-600 dark:text-error-400 mt-1">
            {notifications.filter((notification) => notification.status === 'Urgent').length} urgent today
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Announcements</h3>
            <Megaphone className="h-5 w-5 text-info-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {notifications.filter((notification) => notification.type === 'Announcement').length}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {notifications.some((notification) => notification.type === 'Announcement')
              ? 'Latest announcement available'
              : 'No announcements yet'}
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Reminders</h3>
            <Calendar className="h-5 w-5 text-warning-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {notifications.filter((notification) => notification.type === 'Reminder').length}
          </p>
          <p className="text-sm text-warning-600 dark:text-warning-400 mt-1">
            {notifications.filter((notification) => notification.type === 'Reminder' && notification.status !== 'Read').length} pending
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Delivery Health</h3>
            <CheckCircle className="h-5 w-5 text-success-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {deliveryStatus}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {deliveryMessage}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="card">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-4">
              <h3 className="text-lg font-semibold">Notification Feed</h3>
              <div className="flex flex-wrap gap-3">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    className="input-field pl-9"
                    value={categoryFilter}
                    onChange={(event) => setCategoryFilter(event.target.value)}
                  >
                    <option>All categories</option>
                    <option>Alert</option>
                    <option>Announcement</option>
                    <option>Reminder</option>
                    <option>Update</option>
                  </select>
                </div>
                <select
                  className="input-field"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option>All status</option>
                  <option>Unread</option>
                  <option>Read</option>
                  <option>Urgent</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {filteredNotifications.map((notification) => {
                const Icon = notificationIcons[notification.iconKey] || Bell
                return (
                  <div
                    key={notification.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {notification.message}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>{notification.time}</span>
                          <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700">
                            {notification.channel}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full ${typeStyles[notification.type]}`}>
                            {notification.type}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`status-badge ${statusStyles[notification.status]}`}>
                        {notification.status}
                      </span>
                      <button
                        className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                        onClick={() => handleView(notification.id)}
                      >
                        View
                      </button>
                    </div>
                  </div>
                )
              })}
              {filteredNotifications.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No notifications yet.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Channels</h3>
              <Info className="h-5 w-5 text-info-500" />
            </div>
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Channel analytics will appear once notifications are sent.
              </p>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Scheduled Sends</h3>
              <Calendar className="h-5 w-5 text-primary-500" />
            </div>
            <div className="space-y-3">
              {schedules.map((schedule) => (
                <div
                  key={schedule.title}
                  className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <p className="font-medium text-gray-900 dark:text-white">
                    {schedule.title}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Audience: {schedule.audience}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Next: {schedule.next}
                  </p>
                </div>
              ))}
              {schedules.length === 0 && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No scheduled sends yet.
                </p>
              )}
            </div>
            <button className="w-full mt-4 text-sm btn-secondary py-2">
              Manage Schedules
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
