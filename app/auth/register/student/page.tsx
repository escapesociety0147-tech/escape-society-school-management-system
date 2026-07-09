'use client'

import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, GraduationCap, Mail, Phone, Lock, User } from 'lucide-react'
import { registerUser, createSessionToken } from '@/lib/authStore'

export default function StudentRegistrationPage() {
  const router = useRouter()
  const [formError, setFormError] = useState('')
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    rollNumber: '',
    grade: '',
    section: '',
    schoolId: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  })

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement
      setFormData((prev) => ({
        ...prev,
        [name]: checkbox.checked,
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match.')
      return
    }
    const fullName = `${formData.firstName} ${formData.lastName}`.trim() || 'Student'
    const rollNumber = formData.rollNumber.trim()
    const grade = formData.grade || 'Grade 9'
    const section = formData.section || 'A'
    let storedSchoolId = ''
    try {
      const storedProfile = localStorage.getItem('esm_school_profile')
      const parsed = storedProfile ? JSON.parse(storedProfile) : null
      storedSchoolId = parsed?.schoolId ? String(parsed.schoolId) : ''
    } catch {
      storedSchoolId = ''
    }
    if (storedSchoolId && formData.schoolId && formData.schoolId.trim() !== storedSchoolId) {
      setFormError('School ID not found. Please confirm the ID provided by your school.')
      return
    }

    let nextStudents: Array<{
      id: number
      studentId?: string
      rollNumber: string
      name: string
      grade: string
      section: string
      contact: string
      email?: string
      status: string
      schoolId?: string
      createdAt?: string
    }> = []
    let studentId = 1
    let generatedRoll = rollNumber

    try {
      const stored = localStorage.getItem('esm_students')
      const existing = stored ? JSON.parse(stored) : []
      const normalizedRoll = rollNumber.toLowerCase()
      if (normalizedRoll) {
        const duplicate = existing.find(
          (student: { rollNumber?: string }) =>
            String(student.rollNumber || '').toLowerCase() === normalizedRoll
        )
        if (duplicate) {
          setFormError('That roll number is already registered.')
          return
        }
      }
      studentId =
        existing.length > 0
          ? Math.max(...existing.map((student: { id?: number }) => Number(student.id) || 0)) + 1
          : 1
      while (
        generatedRoll &&
        existing.some(
          (student: { rollNumber?: string }) =>
            String(student.rollNumber || '').toLowerCase() === generatedRoll.toLowerCase()
        )
      ) {
        generatedRoll = ''
      }
      if (!generatedRoll) {
        let counter = studentId
        let nextRoll = `2024${String(counter).padStart(3, '0')}`
        while (
          existing.some(
            (student: { rollNumber?: string }) =>
              String(student.rollNumber || '').toLowerCase() === nextRoll.toLowerCase()
          )
        ) {
          counter += 1
          nextRoll = `2024${String(counter).padStart(3, '0')}`
        }
        generatedRoll = nextRoll
      }
      nextStudents = [
        {
          id: studentId,
          studentId: `STD-${String(studentId).padStart(4, '0')}`,
          rollNumber: generatedRoll,
          name: fullName,
          grade,
          section,
          contact: formData.phone || 'N/A',
          email: formData.email,
          status: 'Active',
          schoolId: formData.schoolId || storedSchoolId,
          createdAt: new Date().toISOString(),
        },
        ...existing,
      ]
    } catch {
      // ignore storage errors
    }

    const registration = registerUser({
      role: 'student',
      name: fullName,
      email: formData.email,
      password: formData.password,
    })
    if (!registration.ok) {
      setFormError(registration.error || 'Unable to create student account.')
      return
    }

    try {
      localStorage.setItem('esm_students', JSON.stringify(nextStudents))
      localStorage.setItem(
        'esm_student_profile',
        JSON.stringify({
          id: studentId,
          studentId: `STD-${String(studentId).padStart(4, '0')}`,
          name: fullName,
          email: formData.email,
          phone: formData.phone,
          rollNumber: generatedRoll,
          grade,
          section,
          schoolId: formData.schoolId || storedSchoolId,
        })
      )
      localStorage.setItem('esm_student_id', String(studentId))
      localStorage.setItem(
        'esm_user_session',
        JSON.stringify({
          id: registration.user.id,
          role: registration.user.role,
          name: registration.user.name,
          email: registration.user.email,
        })
      )
    } catch {
      // ignore storage errors
    }

    const cookieOptions = 'path=/;'
    document.cookie = `auth_token=${createSessionToken()}; ${cookieOptions}`
    document.cookie = `user_type=student; ${cookieOptions}`
    router.push(
      `/auth/register/success?type=student&email=${encodeURIComponent(formData.email)}`
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link
            href="/auth/register"
            className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to registration options
          </Link>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full mb-4">
              <GraduationCap className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Student Registration
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Create your student portal to access grades, attendance, and updates.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {formError && (
            <div className="mb-6 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
              {formError}
            </div>
          )}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Student Information
                </h3>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="input-field pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="input-field pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Roll Number</label>
                <input
                  type="text"
                  name="rollNumber"
                  value={formData.rollNumber}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="2024001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Grade *</label>
                <select
                  name="grade"
                  value={formData.grade}
                  onChange={handleChange}
                  required
                  className="input-field"
                >
                  <option value="">Select Grade</option>
                  <option>Grade 7</option>
                  <option>Grade 8</option>
                  <option>Grade 9</option>
                  <option>Grade 10</option>
                  <option>Grade 11</option>
                  <option>Grade 12</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Section *</label>
                <select
                  name="section"
                  value={formData.section}
                  onChange={handleChange}
                  required
                  className="input-field"
                >
                  <option value="">Select Section</option>
                  <option>A</option>
                  <option>B</option>
                  <option>C</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">School ID (if provided)</label>
                <input
                  type="text"
                  name="schoolId"
                  value={formData.schoolId}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Enter school ID from your school"
                />
              </div>

              <div className="md:col-span-2 mt-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Lock className="h-5 w-5 mr-2" />
                  Account Security
                </h3>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Password *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="input-field"
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-start space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <input
                    type="checkbox"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={handleChange}
                    required
                    className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span>
                    I agree to the{' '}
                    <Link
                      href="/terms"
                      className="text-primary-600 hover:text-primary-500 dark:text-primary-400"
                    >
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link
                      href="/privacy"
                      className="text-primary-600 hover:text-primary-500 dark:text-primary-400"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button type="submit" className="btn-primary px-8 py-3">
              Create Student Account
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
