'use client'

import { X, User, Mail } from 'lucide-react'
import type { ProfileField } from '@/lib/userDirectory'

type UserProfileModalProps = {
  open: boolean
  onClose: () => void
  name: string
  role: string
  email?: string
  fields: ProfileField[]
}

export default function UserProfileModal({
  open,
  onClose,
  name,
  role,
  email,
  fields,
}: UserProfileModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <User className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{role}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="space-y-3">
          {email && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Mail className="h-4 w-4" />
              {email}
            </div>
          )}
          {fields.map((field) => (
            <div key={field.label} className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">{field.label}</span>
              <span className="text-gray-900 dark:text-gray-100">{field.value}</span>
            </div>
          ))}
          {fields.length === 0 && !email && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No additional profile details available.
            </p>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
