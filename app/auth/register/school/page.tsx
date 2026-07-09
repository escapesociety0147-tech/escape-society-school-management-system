'use client'

import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, Building2, MapPin, Phone, Mail, Users, Calendar, Check } from 'lucide-react'
import { registerUser, createSessionToken } from '@/lib/authStore'

export default function SchoolRegistrationPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [formError, setFormError] = useState('')
  const [formData, setFormData] = useState({
    // Step 1: School Information
    schoolName: '',
    schoolType: '',
    establishedYear: '',
    affiliationNumber: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    
    // Step 2: Contact Information
    contactPerson: '',
    contactPosition: '',
    email: '',
    phone: '',
    alternativePhone: '',
    website: '',
    
    // Step 3: Academic Information
    academicBoard: '',
    mediumOfInstruction: '',
    totalStudents: '',
    totalTeachers: '',
    totalStaff: '',
    classesOffered: [] as string[],
    
    // Step 4: Admin Account
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
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

  const handleClassToggle = (className: string) => {
    setFormData(prev => ({
      ...prev,
      classesOffered: prev.classesOffered.includes(className)
        ? prev.classesOffered.filter(c => c !== className)
        : [...prev.classesOffered, className],
    }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (step < 4) {
      setStep(step + 1)
    } else {
      // Submit form
      console.log('Submitting school registration:', formData)
      if (formData.adminPassword !== formData.confirmPassword) {
        setFormError('Passwords do not match.')
        return
      }
      const schoolProfile = {
        name: formData.schoolName || '',
        schoolId: '',
        type: formData.schoolType,
        establishedYear: formData.establishedYear,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        postalCode: formData.postalCode,
        email: formData.email,
        phone: formData.phone,
        website: formData.website,
        academicBoard: formData.academicBoard,
        mediumOfInstruction: formData.mediumOfInstruction,
        totalStudents: Number(formData.totalStudents) || 0,
        totalTeachers: Number(formData.totalTeachers) || 0,
        classesOffered: formData.classesOffered,
      }
      const adminProfile = {
        name: formData.adminName || formData.contactPerson || '',
        role: formData.contactPosition || 'School Admin',
        email: formData.adminEmail || formData.email,
        phone: formData.phone,
      }
      const adminEmail = formData.adminEmail || formData.email
      const registration = registerUser({
        role: 'admin',
        name: adminProfile.name,
        email: adminEmail,
        password: formData.adminPassword,
      })
      if (!registration.ok) {
        setFormError(registration.error || 'Unable to create admin account.')
        return
      }
      try {
        const existingProfile = localStorage.getItem('esm_school_profile')
        const parsedProfile = existingProfile ? JSON.parse(existingProfile) : null
        const storedId = parsedProfile?.schoolId ? String(parsedProfile.schoolId) : ''
        const generatedId =
          storedId ||
          `SCH-${Date.now().toString(36).toUpperCase().slice(-6)}`
        schoolProfile.schoolId = generatedId
        localStorage.setItem('esm_school_profile', JSON.stringify(schoolProfile))
        localStorage.setItem('esm_profile', JSON.stringify(adminProfile))
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
      document.cookie = `user_type=user; ${cookieOptions}`
      router.push(
        `/auth/register/success?type=school&email=${encodeURIComponent(adminEmail)}`
      )
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    } else {
      router.push('/auth/register')
    }
  }

  const steps = [
    { number: 1, title: 'School Information', icon: Building2 },
    { number: 2, title: 'Contact Details', icon: Phone },
    { number: 3, title: 'Academic Setup', icon: Users },
    { number: 4, title: 'Admin Account', icon: Check },
  ]

  const schoolTypes = [
    'Preschool/Kindergarten',
    'Primary School',
    'Middle School',
    'High School',
    'Higher Secondary',
    'International School',
    'Boarding School',
    'Day School',
    'Co-educational',
    'Girls School',
    'Boys School',
    'Special Education',
    'Vocational School',
  ]

  const classes = [
    'Pre-KG', 'LKG', 'UKG',
    'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5',
    'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10',
    'Grade 11', 'Grade 12',
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleBack}
            className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Register Your School
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Complete the following steps to set up your school on EduManage
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-12">
            <div className="flex justify-between items-center">
              {steps.map((stepItem, index) => (
                <div key={stepItem.number} className="flex items-center">
                  <div className={`flex flex-col items-center ${
                    step >= stepItem.number ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'
                  }`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                      step >= stepItem.number
                        ? 'bg-primary-100 dark:bg-primary-900'
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}>
                      <stepItem.icon className="h-6 w-6" />
                    </div>
                    <span className="text-sm font-medium">{stepItem.title}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-1 mx-4 ${
                      step > stepItem.number ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {formError && (
            <div className="mb-6 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
              {formError}
            </div>
          )}
          {/* Step 1: School Information */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  School Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">
                      School Name *
                    </label>
                    <input
                      type="text"
                      name="schoolName"
                      value={formData.schoolName}
                      onChange={handleChange}
                      required
                      className="input-field"
                      placeholder="Enter full school name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      School Type *
                    </label>
                    <select
                      name="schoolType"
                      value={formData.schoolType}
                      onChange={handleChange}
                      required
                      className="input-field"
                    >
                      <option value="">Select school type</option>
                      {schoolTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Year Established *
                    </label>
                    <input
                      type="number"
                      name="establishedYear"
                      value={formData.establishedYear}
                      onChange={handleChange}
                      required
                      min="1900"
                      max={new Date().getFullYear()}
                      className="input-field"
                      placeholder="e.g., 1995"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Affiliation/Registration Number
                    </label>
                    <input
                      type="text"
                      name="affiliationNumber"
                      value={formData.affiliationNumber}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="Enter affiliation number"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">
                      School Address *
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      rows={3}
                      className="input-field"
                      placeholder="Enter complete address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      className="input-field"
                      placeholder="Enter city"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      State/Province *
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      required
                      className="input-field"
                      placeholder="Enter state"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Country *
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      required
                      className="input-field"
                      placeholder="Enter country"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Postal Code *
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleChange}
                      required
                      className="input-field"
                      placeholder="Enter postal code"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Contact Information */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Contact Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Contact Person Name *
                    </label>
                    <input
                      type="text"
                      name="contactPerson"
                      value={formData.contactPerson}
                      onChange={handleChange}
                      required
                      className="input-field"
                      placeholder="Enter full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Position *
                    </label>
                    <input
                      type="text"
                      name="contactPosition"
                      value={formData.contactPosition}
                      onChange={handleChange}
                      required
                      className="input-field"
                      placeholder="e.g., Principal, Administrator"
                    />
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
                      placeholder="Enter official email"
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
                      placeholder="Enter primary phone"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Alternative Phone
                    </label>
                    <input
                      type="tel"
                      name="alternativePhone"
                      value={formData.alternativePhone}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="Enter alternative phone"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Academic Information */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Academic Setup
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Academic Board/Curriculum *
                    </label>
                    <select
                      name="academicBoard"
                      value={formData.academicBoard}
                      onChange={handleChange}
                      required
                      className="input-field"
                    >
                      <option value="">Select board</option>
                      <option value="CBSE">CBSE (Central Board)</option>
                      <option value="ICSE">ICSE/ISC</option>
                      <option value="State">State Board</option>
                      <option value="IB">International Baccalaureate</option>
                      <option value="IGCSE">Cambridge IGCSE</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Medium of Instruction *
                    </label>
                    <select
                      name="mediumOfInstruction"
                      value={formData.mediumOfInstruction}
                      onChange={handleChange}
                      required
                      className="input-field"
                    >
                      <option value="">Select medium</option>
                      <option value="English">English</option>
                      <option value="Hindi">Hindi</option>
                      <option value="Regional">Regional Language</option>
                      <option value="Bilingual">Bilingual</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Total Students (approx.) *
                    </label>
                    <input
                      type="number"
                      name="totalStudents"
                      value={formData.totalStudents}
                      onChange={handleChange}
                      required
                      min="1"
                      className="input-field"
                      placeholder="Number of students"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Total Teachers (approx.) *
                    </label>
                    <input
                      type="number"
                      name="totalTeachers"
                      value={formData.totalTeachers}
                      onChange={handleChange}
                      required
                      min="1"
                      className="input-field"
                      placeholder="Number of teachers"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">
                      Classes Offered *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {classes.map((className) => (
                        <button
                          key={className}
                          type="button"
                          onClick={() => handleClassToggle(className)}
                          className={`p-3 rounded-lg border text-center transition-colors ${
                            formData.classesOffered.includes(className)
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          {className}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Admin Account */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Create Admin Account
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Admin Full Name *
                    </label>
                    <input
                      type="text"
                      name="adminName"
                      value={formData.adminName}
                      onChange={handleChange}
                      required
                      className="input-field"
                      placeholder="Enter admin full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Admin Email *
                    </label>
                    <input
                      type="email"
                      name="adminEmail"
                      value={formData.adminEmail}
                      onChange={handleChange}
                      required
                      className="input-field"
                      placeholder="Enter admin email"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Password *
                    </label>
                    <input
                      type="password"
                      name="adminPassword"
                      value={formData.adminPassword}
                      onChange={handleChange}
                      required
                      minLength={8}
                      className="input-field"
                      placeholder="Create a strong password"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Minimum 8 characters with letters and numbers
                    </p>
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
                        </Link>.
                        I understand that I'm starting a 14-day free trial and can cancel anytime.
                      </label>
                    </div>
                  </div>
                </div>

                {/* Summary Card */}
                <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                    Registration Summary
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">School Name</p>
                      <p className="font-medium">{formData.schoolName || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">School Type</p>
                      <p className="font-medium">{formData.schoolType || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Contact Email</p>
                      <p className="font-medium">{formData.email || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Students</p>
                      <p className="font-medium">{formData.totalStudents || '0'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              type="button"
              onClick={handleBack}
              className="btn-secondary px-8 py-3 flex items-center space-x-2"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back</span>
            </button>
            
            <button
              type="submit"
              className="btn-primary px-8 py-3"
            >
              {step === 4 ? 'Complete Registration' : 'Continue'}
            </button>
          </div>
        </form>

        {/* Progress Indicator */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Step {step} of {steps.length}
          </p>
          <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  )
}
