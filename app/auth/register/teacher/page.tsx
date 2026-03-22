'use client'

import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, User, Mail, Phone, Book, School, MapPin, Lock } from 'lucide-react'
import { registerUser, createSessionToken } from '@/lib/authStore'

export default function TeacherRegistrationPage() {
  const router = useRouter()
  const [formError, setFormError] = useState('')
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    gender: '',
    qualification: '',
    specialization: '',
    experience: '',
    currentSchool: '',
    schoolId: '',
    address: '',
    city: '',
    state: '',
    country: '',
    agreeToTerms: false,
  })

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement
      setFormData(prev => ({
        ...prev,
        [name]: checkbox.checked,
      }))
    } else {
      setFormData(prev => ({
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
    console.log('Submitting teacher registration:', formData)
    const fullName = `${formData.firstName} ${formData.lastName}`.trim() || 'Teacher'
    const specialization = formData.specialization || 'General'
    const teacherProfile = {
      name: fullName,
      role: `${specialization} Teacher`,
      email: formData.email,
      phone: formData.phone,
      schoolId: formData.schoolId || storedSchoolId,
    }
    const registration = registerUser({
      role: 'teacher',
      name: fullName,
      email: formData.email,
      password: formData.password,
    })
    if (!registration.ok) {
      setFormError(registration.error || 'Unable to create teacher account.')
      return
    }
    try {
      localStorage.setItem('esm_teacher_profile', JSON.stringify(teacherProfile))
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
    try {
      const stored = localStorage.getItem('esm_teachers')
      const existing = stored ? (JSON.parse(stored) as Array<Record<string, unknown>>) : []
      const nextId =
        existing.length > 0
          ? Math.max(...existing.map((item) => Number(item.id) || 0)) + 1
          : 1
      const newTeacher = {
        id: nextId,
        empId: `EMP-${String(nextId).padStart(3, '0')}`,
        name: fullName,
        department: specialization,
        subjects: [specialization],
        email: formData.email,
        phone: formData.phone,
        status: 'Active',
        createdAt: new Date().toISOString(),
        schoolId: formData.schoolId || storedSchoolId,
      }
      localStorage.setItem('esm_teachers', JSON.stringify([newTeacher, ...existing]))
    } catch {
      // ignore storage errors
    }
    const cookieOptions = 'path=/;'
    document.cookie = `auth_token=${createSessionToken()}; ${cookieOptions}`
    document.cookie = `user_type=teacher; ${cookieOptions}`
    router.push(
      `/auth/register/success?type=teacher&email=${encodeURIComponent(formData.email)}`
    )
  }

  const qualifications = [
    'B.Ed',
    'M.Ed',
    'B.A. B.Ed',
    'B.Sc. B.Ed',
    'M.A. B.Ed',
    'M.Sc. B.Ed',
    'Ph.D in Education',
    'Diploma in Education',
    'Other',
  ]

  const subjects = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science',
    'English', 'Hindi', 'Sanskrit', 'Other Languages',
    'History', 'Geography', 'Political Science', 'Economics',
    'Physical Education', 'Art', 'Music', 'Dance',
    'Home Science', 'Psychology', 'Sociology',
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
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
              <User className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Teacher Registration
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Join EduManage as an educator or connect with your existing school
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
              {/* Personal Information */}
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Personal Information
                </h3>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="Enter first name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="Enter last name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  required
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Gender *
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                  className="input-field"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Contact Information */}
              <div className="md:col-span-2 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Mail className="h-5 w-5 mr-2" />
                  Contact Information
                </h3>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="Enter phone number"
                />
              </div>

              {/* Professional Information */}
              <div className="md:col-span-2 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Book className="h-5 w-5 mr-2" />
                  Professional Information
                </h3>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Highest Qualification *
                </label>
                <select
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleChange}
                  required
                  className="input-field"
                >
                  <option value="">Select qualification</option>
                  {qualifications.map((qual) => (
                    <option key={qual} value={qual}>{qual}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Subject Specialization *
                </label>
                <select
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  required
                  className="input-field"
                >
                  <option value="">Select subject</option>
                  {subjects.map((subject) => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Years of Experience *
                </label>
                <input
                  type="number"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  required
                  min="0"
                  max="50"
                  className="input-field"
                  placeholder="Enter years of experience"
                />
              </div>

              {/* School Information */}
              <div className="md:col-span-2 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <School className="h-5 w-5 mr-2" />
                  School Information
                </h3>
              </div>

              <div className="md:col-span-2">
                <div className="mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-2">
                        Current School Name
                      </label>
                      <input
                        type="text"
                        name="currentSchool"
                        value={formData.currentSchool}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="Enter your school name"
                      />
                    </div>
                    <div className="text-center">
                      <span className="text-gray-500 dark:text-gray-400">OR</span>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-2">
                        School ID (if already on EduManage)
                      </label>
                      <input
                        type="text"
                        name="schoolId"
                        value={formData.schoolId}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="Enter school ID"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    If your school is already using EduManage, enter the School ID to join directly
                  </p>
                </div>
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                  className="input-field"
                  placeholder="Enter your address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Enter city"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  State
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Enter state"
                />
              </div>

              {/* Account Security */}
              <div className="md:col-span-2 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Lock className="h-5 w-5 mr-2" />
                  Account Security
                </h3>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  className="input-field"
                  placeholder="Create a strong password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="Confirm your password"
                />
              </div>

              {/* Terms */}
              <div className="md:col-span-2">
                <div className="flex items-start">
                  <input
                    id="agreeToTerms"
                    name="agreeToTerms"
                    type="checkbox"
                    checked={formData.agreeToTerms}
                    onChange={handleChange}
                    required
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1 dark:border-gray-600 dark:bg-gray-700"
                  />
                  <label htmlFor="agreeToTerms" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    I agree to the{' '}
                    <Link href="/terms" className="text-primary-600 hover:text-primary-500 dark:text-primary-400">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-primary-600 hover:text-primary-500 dark:text-primary-400">
                      Privacy Policy
                    </Link>
                  </label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
              <button
                type="submit"
                className="flex-1 btn-primary py-3"
              >
                Create Teacher Account
              </button>
              <Link
                href="/auth/login"
                className="flex-1 btn-secondary py-3 text-center"
              >
                Already have an account? Sign In
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
