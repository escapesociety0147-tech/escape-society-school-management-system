import { pushToast, type ToastVariant } from '@/lib/toastBus'

export type NotificationStatus = 'Unread' | 'Read' | 'Urgent'
export type NotificationType = 'Alert' | 'Announcement' | 'Reminder' | 'Update'

export type NotificationItem = {
  id: number
  title: string
  message: string
  time: string
  channel: string
  type: NotificationType
  status: NotificationStatus
  iconKey: string
}

export type NotificationInput = {
  title: string
  message: string
  channel?: string
  type?: NotificationType
  status?: NotificationStatus
  iconKey?: string
  time?: string
  toastVariant?: ToastVariant
}

const storageKey = 'esm_notifications'
const syncEventName = 'local-storage-sync'

const typeToIcon: Record<NotificationType, string> = {
  Alert: 'alert',
  Announcement: 'megaphone',
  Reminder: 'calendar',
  Update: 'check',
}

const typeToToast: Record<NotificationType, ToastVariant> = {
  Alert: 'error',
  Announcement: 'info',
  Reminder: 'warning',
  Update: 'success',
}

const formatTime = () =>
  new Date().toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
  })

const safeParse = (value: string | null): NotificationItem[] => {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed)) return []
    return parsed as NotificationItem[]
  } catch {
    return []
  }
}

const writeNotifications = (items: NotificationItem[]) => {
  if (typeof window === 'undefined') return
  try {
    const serialized = JSON.stringify(items)
    localStorage.setItem(storageKey, serialized)
    window.dispatchEvent(
      new CustomEvent(syncEventName, {
        detail: { key: storageKey, value: serialized, source: 'notify' },
      })
    )
  } catch {
    // ignore storage errors
  }
}

export const readNotifications = () => {
  if (typeof window === 'undefined') return []
  return safeParse(localStorage.getItem(storageKey))
}

export const pushNotification = (input: NotificationInput) => {
  if (typeof window === 'undefined') return null
  const existing = readNotifications()
  const nextId = existing.length ? Math.max(...existing.map((item) => item.id)) + 1 : 1
  const type: NotificationType = input.type || 'Update'
  const status: NotificationStatus = input.status || 'Unread'
  const item: NotificationItem = {
    id: nextId,
    title: input.title,
    message: input.message,
    time: input.time || formatTime(),
    channel: input.channel || 'System',
    type,
    status,
    iconKey: input.iconKey || typeToIcon[type],
  }
  writeNotifications([item, ...existing])
  return item
}

export const notify = (input: NotificationInput, withToast = true) => {
  const item = pushNotification(input)
  if (!item) return null
  if (withToast) {
    pushToast({
      title: item.title,
      message: item.message,
      variant: input.toastVariant || typeToToast[item.type],
    })
  }
  return item
}
