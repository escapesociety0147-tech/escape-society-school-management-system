'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { toastEventName, type ToastPayload, type ToastVariant } from '@/lib/toastBus'

type ToastItem = {
  id: string
  title: string
  message?: string
  variant: ToastVariant
  durationMs: number
}

const variantStyles: Record<ToastVariant, string> = {
  success:
    'border-success-200 bg-success-50 text-success-700 dark:border-success-900/40 dark:bg-success-900/20 dark:text-success-200',
  info: 'border-info-200 bg-info-50 text-info-700 dark:border-info-900/40 dark:bg-info-900/20 dark:text-info-200',
  warning:
    'border-warning-200 bg-warning-50 text-warning-700 dark:border-warning-900/40 dark:bg-warning-900/20 dark:text-warning-200',
  error: 'border-error-200 bg-error-50 text-error-700 dark:border-error-900/40 dark:bg-error-900/20 dark:text-error-200',
}

export default function ToastProvider() {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timeoutsRef = useRef<Record<string, NodeJS.Timeout>>({})

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
    const timeout = timeoutsRef.current[id]
    if (timeout) {
      clearTimeout(timeout)
      delete timeoutsRef.current[id]
    }
  }

  useEffect(() => {
    const handleToast = (event: Event) => {
      const detail = (event as CustomEvent<ToastPayload>).detail
      if (!detail?.title) return
      const id = `${Date.now().toString(36)}_${Math.random().toString(16).slice(2)}`
      const nextToast: ToastItem = {
        id,
        title: detail.title,
        message: detail.message,
        variant: detail.variant || 'info',
        durationMs: detail.durationMs ?? 3500,
      }
      setToasts((prev) => [nextToast, ...prev].slice(0, 5))
      timeoutsRef.current[id] = setTimeout(() => removeToast(id), nextToast.durationMs)
    }

    window.addEventListener(toastEventName, handleToast)
    return () => {
      window.removeEventListener(toastEventName, handleToast)
      Object.values(timeoutsRef.current).forEach((timeout) => clearTimeout(timeout))
      timeoutsRef.current = {}
    }
  }, [])

  const containerClasses = useMemo(
    () =>
      'fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm w-[90vw] sm:w-[360px]',
    []
  )

  return (
    <div className={containerClasses} aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`border rounded-xl shadow-lg px-4 py-3 backdrop-blur ${variantStyles[toast.variant]}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">{toast.title}</p>
              {toast.message && (
                <p className="text-xs mt-1 text-gray-600 dark:text-gray-300">
                  {toast.message}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-full hover:bg-white/60 dark:hover:bg-gray-900/40"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
