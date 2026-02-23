'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const token = searchParams.get('token')
    const role = searchParams.get('role')
    const name = searchParams.get('name')

    if (!token) {
      router.push('/auth/login')
      return
    }

    const userType = role === 'teacher' ? 'teacher' : role === 'parent' ? 'parent' : role === 'student' ? 'student' : 'user'
    document.cookie = `auth_token=${token}; path=/;`
    document.cookie = `user_type=${userType}; path=/;`

    try {
      localStorage.setItem('esm_user_session', JSON.stringify({ role, name, email: '' }))
    } catch { }

    const destination = role === 'teacher' ? '/teacher/dashboard' : role === 'parent' ? '/parent/dashboard' : role === 'student' ? '/student/dashboard' : '/dashboard'
    router.push(destination)
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Signing you in with Google...</p>
      </div>
    </div>
  )
}
