'use client'

import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Mail, Phone, Users, School, Lock, Plus, X } from 'lucide-react'
import { registerUser, createSessionToken } from '@/lib/authStore'

interface ChildInfo {
  id: number
  name: string
  studentId: string
  grade: string
  section: string
  relationship: string
}

export default function ParentRegistrationPage() {
  const router = useRouter()
  const [formError, setFormError] = useState('')
  const [children, setChildren] = useState<ChildInfo[]>([
    { id: 1, name: '', studentId: '', grade: '', section: '', relationship: 'Son' },
  ])
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    relationship: 'Parent',
    address: '',
    city: '',
    state: '',
    country: '',
    schoolId: '',
    agreeToTerms: false,
  })

  useEffect(() => {
    if (formData.schoolId) return
    try {
      const storedProfile = localStorage.getItem('esm_school_profile')
      const parsed = storedProfile ? JSON.parse(storedProfile) : null
      const storedId = parsed?.schoolId ? String(parsed.schoolId) : ''
      if (storedId) {
        setFormData((prev) => ({ ...prev, schoolId: storedId }))
      }
    } catch {
      // ignore storage errors
    }
  }, [formData.schoolId])

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

  const handleChildChange = (id: number, field: keyof ChildInfo, value: string) => {
    setChildren(prev =>
      prev.map(child =>
        child.id === id ? { ...child, [field]: value } : child
      )
    )
  }

  const addChild = () => {
    setChildren(prev => [
      ...prev,
      { id: Date.now(), name: '', studentId: '', grade: '', section: '', relationship: 'Son' },
    ])
  }

  const removeChild = (id: number) => {
    if (children.length > 1) {
      setChildren(prev => prev.filter(child => child.id !== id))
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
    const resolvedSchoolId = (formData.schoolId || storedSchoolId).trim()
    const normalizedSchoolId = resolvedSchoolId.toLowerCase()
    if (storedSchoolId && formData.schoolId && formData.schoolId.trim() !== storedSchoolId) {
      setFormError('School ID not found. Please confirm the ID provided by your school.')
      return
    }
    const hasStudentIds = children.some((child) => child.studentId.trim())
    if (hasStudentIds && !resolvedSchoolId) {
      setFormError('Please enter the School ID to link student records.')
      return
    }
    const registrationData = {
      ...formData,
      children,
    }
    console.log('Submitting parent registration:', registrationData)
    const fullName = `${formData.firstName} ${formData.lastName}`.trim() || 'Parent'
    const parentProfile = {
      name: fullName,
      role: 'Parent / Guardian',
      email: formData.email,
      phone: formData.phone,
      schoolId: resolvedSchoolId,
    }
    const registration = registerUser({
      role: 'parent',
      name: fullName,
      email: formData.email,
      password: formData.password,
    })
    if (!registration.ok) {
      setFormError(registration.error || 'Unable to create parent account.')
      return
    }
    try {
      const storedStudents = localStorage.getItem('esm_students')
      const studentList = storedStudents
        ? (JSON.parse(storedStudents) as Array<Record<string, unknown>>)
        : []
      const matchResults = children.map((child) => {
        const input = child.studentId.trim()
        if (!input) {
          return { child, match: null }
        }
        const normalizedInput = input.toLowerCase()
        const match = studentList.find((student) => {
          const rollNumber = String(student.rollNumber || '').toLowerCase()
          const studentId = String(student.id || '').toLowerCase()
          const studentCode = String(student.studentId || '').toLowerCase()
          const studentSchoolId = String(student.schoolId || '').toLowerCase()
          const matchesSchool = !normalizedSchoolId || studentSchoolId === normalizedSchoolId
          return (
            matchesSchool &&
            (rollNumber === normalizedInput ||
              studentId === normalizedInput ||
              studentCode === normalizedInput)
          )
        })
        return { child, match }
      })
      const missingIds = matchResults
        .filter(({ child, match }) => child.studentId.trim() && !match)
        .map(({ child }) => child.studentId.trim())
      if (missingIds.length > 0) {
        setFormError(
          `We could not find these student IDs for the selected school: ${missingIds.join(', ')}`
        )
        return
      }
      const linkedIds = matchResults
        .map(({ match }) => (match ? Number(match.id) : null))
        .filter((id): id is number => typeof id === 'number' && !Number.isNaN(id))
      const uniqueIds = Array.from(new Set(linkedIds))
      const resolvedChildren = matchResults.map(({ child, match }) => ({
        ...child,
        name: (match?.name as string | undefined) || child.name.trim(),
        studentId: match?.studentId ? String(match.studentId) : child.studentId.trim(),
        grade: (match?.grade as string | undefined) || child.grade.trim(),
        section: (match?.section as string | undefined) || child.section.trim(),
      }))
      const storedParents = localStorage.getItem('esm_parents')
      const existingParents = storedParents
        ? (JSON.parse(storedParents) as Array<Record<string, unknown>>)
        : []
      const nextParentNumericId =
        existingParents.length > 0
          ? Math.max(...existingParents.map((item) => Number(item.id) || 0)) + 1
          : 1
      const parentId = `PAR-${String(nextParentNumericId).padStart(4, '0')}`
      const parentRecord = {
        id: nextParentNumericId,
        parentId,
        name: fullName,
        email: formData.email,
        phone: formData.phone,
        relationship: formData.relationship,
        schoolId: resolvedSchoolId,
        linkedStudentIds: uniqueIds,
        children: resolvedChildren.map((child) => ({
          name: child.name.trim(),
          studentId: child.studentId.trim(),
          grade: child.grade.trim(),
          section: child.section.trim(),
          relationship: child.relationship,
        })),
        status: uniqueIds.length > 0 ? 'Active' : 'Pending',
        createdAt: new Date().toISOString(),
      }
      localStorage.setItem('esm_parents', JSON.stringify([parentRecord, ...existingParents]))
      localStorage.setItem(
        'esm_parent_profile',
        JSON.stringify({
          ...parentProfile,
          parentId,
          relationship: formData.relationship,
          linkedStudentIds: uniqueIds,
        })
      )
      localStorage.setItem('esm_parent_links', JSON.stringify(uniqueIds))
      localStorage.setItem('esm_parent_id', String(nextParentNumericId))
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
    document.cookie = `user_type=parent; ${cookieOptions}`
    router.push(
      `/auth/register/success?type=parent&email=${encodeURIComponent(formData.email)}`
    )
  }

  const relationships = ['Parent', 'Guardian', 'Grandparent', 'Other']
  const childRelationships = ['Son', 'Daughter', 'Ward', 'Other']

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
              <Users className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Parent Registration
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Connect with your child's school and stay updated on their progress
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
              {/* Parent Information */}
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Parent/Guardian Information
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
                  Relationship to Child *
                </label>
                <select
                  name="relationship"
                  value={formData.relationship}
                  onChange={handleChange}
                  required
                  className="input-field"
                >
                  {relationships.map((rel) => (
                    <option key={rel} value={rel}>{rel}</option>
                  ))}
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

              {/* Children Information */}
              <div className="md:col-span-2 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Children Information
                </h3>
              </div>

              {children.map((child, index) => (
                <div key={child.id} className="md:col-span-2 p-6 border border-gray-200 dark:border-gray-700 rounded-lg space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      Child {index + 1}
                    </h4>
                    {children.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeChild(child.id)}
                        className="p-1 hover:bg-error-50 dark:hover:bg-error-900/20 rounded text-error-600 dark:text-error-400"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Child's Full Name *
                      </label>
                      <input
                        type="text"
                        value={child.name}
                        onChange={(e) => handleChildChange(child.id, 'name', e.target.value)}
                        required
                        className="input-field"
                        placeholder="Enter child's name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Relationship *
                      </label>
                      <select
                        value={child.relationship}
                        onChange={(e) => handleChildChange(child.id, 'relationship', e.target.value)}
                        required
                        className="input-field"
                      >
                        {childRelationships.map((rel) => (
                          <option key={rel} value={rel}>{rel}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Student ID (from school)
                      </label>
                      <input
                        type="text"
                        value={child.studentId}
                        onChange={(e) => handleChildChange(child.id, 'studentId', e.target.value)}
                        className="input-field"
                        placeholder="Enter the student ID provided by the school"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Grade/Class
                      </label>
                      <input
                        type="text"
                        value={child.grade}
                        onChange={(e) => handleChildChange(child.id, 'grade', e.target.value)}
                        className="input-field"
                        placeholder="e.g., Grade 5"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="md:col-span-2">
                <button
                  type="button"
                  onClick={addChild}
                  className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-400 dark:hover:border-primary-600 transition-colors flex flex-col items-center justify-center"
                >
                  <Plus className="h-6 w-6 text-gray-400 mb-2" />
                  <span className="text-gray-600 dark:text-gray-400">Add Another Child</span>
                </button>
              </div>

              {/* School Information */}
              <div className="md:col-span-2 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <School className="h-5 w-5 mr-2" />
                  School Information
                </h3>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  School ID (if known)
                </label>
                <input
                  type="text"
                  name="schoolId"
                  value={formData.schoolId}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Enter school ID provided by the school"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Provide the School ID to sync student records during registration.
                </p>
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
                Create Parent Account
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
