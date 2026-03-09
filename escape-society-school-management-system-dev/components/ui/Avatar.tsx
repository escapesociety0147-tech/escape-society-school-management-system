'use client'

/**
 * Avatar.tsx — reusable profile photo component
 * Drop in: escape-society-school-management-system-dev/components/ui/Avatar.tsx
 *
 * Usage:
 *   <Avatar name="John Doe" photoUrl={student.photo_url} size="lg" />
 *   <Avatar name="Jane Smith" photoUrl={teacher.photo_url} editable onUpload={handleUpload} />
 */

import { useState, useRef } from 'react'
import { Camera, Loader2 } from 'lucide-react'

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface AvatarProps {
  name: string
  photoUrl?: string | null
  size?: AvatarSize
  editable?: boolean
  onUpload?: (url: string) => void
  className?: string
}

const sizeMap: Record<AvatarSize, { container: string; text: string; icon: string }> = {
  xs: { container: 'h-6 w-6',   text: 'text-xs',  icon: 'h-2 w-2' },
  sm: { container: 'h-8 w-8',   text: 'text-sm',  icon: 'h-3 w-3' },
  md: { container: 'h-10 w-10', text: 'text-base', icon: 'h-4 w-4' },
  lg: { container: 'h-16 w-16', text: 'text-xl',  icon: 'h-5 w-5' },
  xl: { container: 'h-24 w-24', text: 'text-3xl', icon: 'h-6 w-6' },
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('')
}

function getColorFromName(name: string): string {
  const colors = [
    'bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-rose-500',
    'bg-amber-500', 'bg-cyan-500', 'bg-pink-500', 'bg-indigo-500',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

function getToken(): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(/auth_token=([^;]+)/)
  return match ? match[1] : ''
}

export default function Avatar({ name, photoUrl, size = 'md', editable = false, onUpload, className = '' }: AvatarProps) {
  const { container, text, icon } = sizeMap[size]
  const [imgError, setImgError] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [currentUrl, setCurrentUrl] = useState(photoUrl)
  const inputRef = useRef<HTMLInputElement>(null)

  const showImage = currentUrl && !imgError

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`${API_URL}/upload/profile`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      const url = data.url || data.photo_url
      setCurrentUrl(url)
      setImgError(false)
      onUpload?.(url)
    } catch (err) {
      console.error('Photo upload failed:', err)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      <div className={`${container} rounded-full overflow-hidden flex items-center justify-center font-semibold text-white ${showImage ? '' : getColorFromName(name)}`}>
        {uploading ? (
          <Loader2 className={`${icon} animate-spin text-white`} />
        ) : showImage ? (
          <img
            src={currentUrl!}
            alt={name}
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className={text}>{getInitials(name)}</span>
        )}
      </div>

      {editable && !uploading && (
        <>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-0 right-0 rounded-full bg-primary-600 p-1 text-white shadow hover:bg-primary-700 transition-colors"
            title="Change photo"
          >
            <Camera className={icon} />
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </>
      )}
    </div>
  )
}
