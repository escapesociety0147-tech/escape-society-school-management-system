'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, School } from 'lucide-react'
import { authenticateUser, createSessionToken, normalizeEmail } from '@/lib/authStore'

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false,
  })
  const [authError, setAuthError] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setAuthError('')
    const maxAge = formData.remember ? 60 * 60 * 24 * 7 : undefined
    const cookieOptions = `path=/;${maxAge ? ` max-age=${maxAge};` : ''}`

    const result = authenticateUser(formData.email, formData.password)
    if (!result.ok) {
      setAuthError(result.error || 'Unable to sign in. Please try again.')
      return
    }

    const role = result.user.role
    const userType =
      role === 'teacher' ? 'teacher' : role === 'parent' ? 'parent' : role === 'student' ? 'student' : 'user'
    document.cookie = `auth_token=${createSessionToken()}; ${cookieOptions}`
    document.cookie = `user_type=${userType}; ${cookieOptions}`
    try {
      const session = {
        id: result.user.id,
        role: result.user.role,
        name: result.user.name,
        email: result.user.email,
      }
      localStorage.setItem('esm_user_session', JSON.stringify(session))

      if (role === 'teacher') {
        const storedTeachers = localStorage.getItem('esm_teachers')
        const teachers = storedTeachers ? JSON.parse(storedTeachers) : []
        const match = teachers.find(
          (teacher: { email?: string }) =>
            normalizeEmail(teacher.email || '') === normalizeEmail(result.user.email)
        )
        if (match) {
          localStorage.setItem(
            'esm_teacher_profile',
            JSON.stringify({
              name: match.name || result.user.name,
              role: match.department ? `${match.department} Teacher` : 'Teacher',
              email: match.email || result.user.email,
              phone: match.phone || '',
              schoolId: match.schoolId || '',
            })
          )
        }
      }

      if (role === 'parent') {
        const storedParents = localStorage.getItem('esm_parents')
        const parents = storedParents ? JSON.parse(storedParents) : []
        const match = parents.find(
          (parent: { email?: string }) =>
            normalizeEmail(parent.email || '') === normalizeEmail(result.user.email)
        )
        if (match) {
          const storedStudents = localStorage.getItem('esm_students')
          const students = storedStudents ? JSON.parse(storedStudents) : []
          const normalizedSchoolId = String(match.schoolId || '').toLowerCase()
          const linkedIds = Array.isArray(match.linkedStudentIds)
            ? match.linkedStudentIds
            : []
          const validIds = normalizedSchoolId
            ? new Set(
                students
                  .filter(
                    (student: { schoolId?: string }) =>
                      String(student.schoolId || '').toLowerCase() === normalizedSchoolId
                  )
                  .map((student: { id?: number }) => Number(student.id))
              )
            : null
          const cleanedLinkedIds = validIds
            ? linkedIds.filter((id: number) => validIds.has(id))
            : linkedIds
          localStorage.setItem(
            'esm_parent_profile',
            JSON.stringify({
              name: match.name || result.user.name,
              role: 'Parent / Guardian',
              email: match.email || result.user.email,
              phone: match.phone || '',
              parentId: match.parentId || '',
              relationship: match.relationship || 'Parent',
              schoolId: match.schoolId || '',
              linkedStudentIds: cleanedLinkedIds,
            })
          )
          localStorage.setItem(
            'esm_parent_links',
            JSON.stringify(cleanedLinkedIds)
          )
        }
      }

      if (role === 'student') {
        const storedStudents = localStorage.getItem('esm_students')
        const students = storedStudents ? JSON.parse(storedStudents) : []
        const match = students.find(
          (student: { email?: string }) =>
            normalizeEmail(student.email || '') === normalizeEmail(result.user.email)
        )
        if (match) {
          localStorage.setItem(
            'esm_student_profile',
            JSON.stringify({
              id: match.id || 0,
              studentId: match.studentId || '',
              name: match.name || result.user.name,
              email: match.email || result.user.email,
              phone: match.contact || '',
              rollNumber: match.rollNumber || '',
              grade: match.grade || '',
              section: match.section || '',
              schoolId: match.schoolId || '',
            })
          )
          localStorage.setItem('esm_student_id', String(match.id || 0))
        }
      }

      if (role === 'admin') {
        const existing = localStorage.getItem('esm_profile')
        if (!existing) {
          localStorage.setItem(
            'esm_profile',
            JSON.stringify({
              name: result.user.name,
              role: 'School Admin',
              email: result.user.email,
              phone: '',
            })
          )
        }
      }
    } catch {
      // ignore storage errors
    }
    const destination =
      role === 'teacher'
        ? '/teacher/dashboard'
        : role === 'parent'
        ? '/parent/dashboard'
        : role === 'student'
        ? '/student/dashboard'
        : '/dashboard'
    router.push(destination)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <div className="bg-primary-600 p-3 rounded-lg">
              <School className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Or{' '}
            <Link
              href="/auth/register"
              className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
            >
              start your 14-day free trial
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {authError && (
            <div className="rounded-md border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
              {authError}
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm dark:bg-gray-800"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm dark:bg-gray-800"
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                checked={formData.remember}
                onChange={(e) =>
                  setFormData({ ...formData, remember: e.target.checked })
                }
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-gray-900 dark:text-gray-300"
              >
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a
                href="#"
                className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
              >
                Forgot your password?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Sign in
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <Link
                href="/auth/register"
                className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
              >
                Get started for free
              </Link>
            </p>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 dark:bg-gray-900 text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div>
              <a
                href="#"
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <span className="sr-only">Sign in with Google</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                </svg>
              </a>
            </div>
            <div>
              <a
                href="#"
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <span className="sr-only">Sign in with Microsoft</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 23 23">
                  <path d="M11.5 11.5H0V0h11.5v11.5zM23 11.5H11.5V0H23v11.5zM11.5 23H0V11.5h11.5V23zM23 23H11.5V11.5H23V23z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
