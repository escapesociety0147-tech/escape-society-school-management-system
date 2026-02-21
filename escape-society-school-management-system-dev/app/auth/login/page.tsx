'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, School } from 'lucide-react'
import api from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ email: '', password: '', remember: false })
  const [authError, setAuthError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setAuthError('')
    setLoading(true)
    try {
      const result = await api.auth.login(formData.email, formData.password)
      const { token, user } = result
      const maxAge = formData.remember ? 60 * 60 * 24 * 7 : undefined
      const cookieOptions = `path=/;${maxAge ? ` max-age=${maxAge};` : ''}`
      const userType = user.role === 'teacher' ? 'teacher' : user.role === 'parent' ? 'parent' : user.role === 'student' ? 'student' : 'user'
      document.cookie = `auth_token=${token}; ${cookieOptions}`
      document.cookie = `user_type=${userType}; ${cookieOptions}`
      try {
        localStorage.setItem('esm_user_session', JSON.stringify({ id: user.id, role: user.role, name: user.name, email: user.email }))
      } catch { }
      const destination = user.role === 'teacher' ? '/teacher/dashboard' : user.role === 'parent' ? '/parent/dashboard' : user.role === 'student' ? '/student/dashboard' : '/dashboard'
      router.push(destination)
    } catch (err: any) {
      setAuthError(err.message || 'Unable to sign in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center"><div className="bg-primary-600 p-3 rounded-lg"><School className="h-8 w-8 text-white" /></div></div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">Sign in to your account</h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">Or <Link href="/auth/register" className="font-medium text-primary-600 hover:text-primary-500">start your 14-day free trial</Link></p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {authError && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{authError}</div>}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-gray-400" /></div>
                <input id="email" name="email" type="email" required className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-800" placeholder="Email address" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-gray-400" /></div>
                <input id="password" name="password" type={showPassword ? 'text' : 'password'} required className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-800" placeholder="Password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-primary-600 border-gray-300 rounded" checked={formData.remember} onChange={(e) => setFormData({ ...formData, remember: e.target.checked })} />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Remember me</label>
            </div>
            <a href="#" className="text-sm font-medium text-primary-600 hover:text-primary-500">Forgot your password?</a>
          </div>
          <button type="submit" disabled={loading} className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Do not have an account? <Link href="/auth/register" className="font-medium text-primary-600 hover:text-primary-500">Get started for free</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
