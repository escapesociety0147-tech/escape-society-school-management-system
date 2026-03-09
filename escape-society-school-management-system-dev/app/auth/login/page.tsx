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

  const handleGoogleLogin = () => {
    window.location.href = 'http://127.0.0.1:8000/auth/google/login'
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
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-gray-400" /></div>
              <input type="email" required className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-800" placeholder="Email address" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-gray-400" /></div>
              <input type={showPassword ? 'text' : 'password'} required className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-800" placeholder="Password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
              <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input id="remember-me" type="checkbox" className="h-4 w-4 text-primary-600 border-gray-300 rounded" checked={formData.remember} onChange={(e) => setFormData({ ...formData, remember: e.target.checked })} />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Remember me</label>
            </div>
            <a href="#" className="text-sm font-medium text-primary-600 hover:text-primary-500">Forgot your password?</a>
          </div>
          <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-60">
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300 dark:border-gray-600" /></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-gray-50 dark:bg-gray-900 text-gray-500">Or continue with</span></div>
          </div>
          <button type="button" onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Do not have an account? <Link href="/auth/register" className="font-medium text-primary-600 hover:text-primary-500">Get started for free</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
