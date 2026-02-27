'use client'

import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Book, Lock } from 'lucide-react'
import api from '@/lib/api'

export default function StudentRegistrationPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', dateOfBirth: '', gender: '',
    grade: '', section: '', rollNumber: '', admissionNumber: '',
    password: '', confirmPassword: '', agreeToTerms: false,
  })

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (step < 3) { setStep(step + 1); return }
    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match.'); return
    }
    setLoading(true)
    try {
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`
      await api.auth.register({
        name: fullName,
        email: formData.email,
        password: formData.password,
        role: 'student',
      })
      const result = await api.auth.login(formData.email, formData.password)
      const { token, user } = result
      document.cookie = `auth_token=${token}; path=/;`
      document.cookie = `user_type=student; path=/;`
      try {
        localStorage.setItem('esm_user_session', JSON.stringify({ id: user.id, role: user.role, name: user.name, email: user.email }))
        localStorage.setItem('esm_profile', JSON.stringify({
          name: user.name, role: 'Student', email: user.email,
          phone: formData.phone, grade: formData.grade, section: formData.section,
        }))
      } catch { }
      router.push(`/auth/register/success?type=student&email=${encodeURIComponent(formData.email)}`)
    } catch (err: any) {
      setFormError(err.message || 'Unable to complete registration. Please try again.')
    } finally { setLoading(false) }
  }

  const handleBack = () => { if (step > 1) setStep(step - 1); else router.push('/auth/register') }

  const steps = [
    { number: 1, title: 'Personal Info', icon: User },
    { number: 2, title: 'Academic Info', icon: Book },
    { number: 3, title: 'Account', icon: Lock },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <button onClick={handleBack} className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-primary-600 mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </button>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Student Registration</h1>
          <p className="text-gray-600 dark:text-gray-400">Complete the following steps to create your account</p>
        </div>

        <div className="flex justify-between items-center mb-12">
          {steps.map((s, i) => (
            <div key={s.number} className="flex items-center">
              <div className={`flex flex-col items-center ${step >= s.number ? 'text-primary-600' : 'text-gray-400'}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${step >= s.number ? 'bg-primary-100 dark:bg-primary-900' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <s.icon className="h-6 w-6" />
                </div>
                <span className="text-sm font-medium">{s.title}</span>
              </div>
              {i < steps.length - 1 && <div className={`flex-1 h-1 mx-4 ${step > s.number ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'}`} />}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {formError && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>}

          {step === 1 && (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold mb-6">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className="block text-sm font-medium mb-2">First Name *</label><input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required className="input-field" placeholder="First name" /></div>
                <div><label className="block text-sm font-medium mb-2">Last Name *</label><input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required className="input-field" placeholder="Last name" /></div>
                <div><label className="block text-sm font-medium mb-2">Email Address *</label><input type="email" name="email" value={formData.email} onChange={handleChange} required className="input-field" placeholder="Your email" /></div>
                <div><label className="block text-sm font-medium mb-2">Phone Number</label><input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="input-field" placeholder="Phone number" /></div>
                <div><label className="block text-sm font-medium mb-2">Date of Birth</label><input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="input-field" /></div>
                <div><label className="block text-sm font-medium mb-2">Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} className="input-field">
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold mb-6">Academic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className="block text-sm font-medium mb-2">Grade/Class *</label>
                  <select name="grade" value={formData.grade} onChange={handleChange} required className="input-field">
                    <option value="">Select grade</option>
                    {['Pre-KG','LKG','UKG','Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12'].map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div><label className="block text-sm font-medium mb-2">Section</label>
                  <select name="section" value={formData.section} onChange={handleChange} className="input-field">
                    <option value="">Select section</option>
                    {['A','B','C','D','E'].map(s => <option key={s} value={s}>Section {s}</option>)}
                  </select>
                </div>
                <div><label className="block text-sm font-medium mb-2">Roll Number</label><input type="text" name="rollNumber" value={formData.rollNumber} onChange={handleChange} className="input-field" placeholder="e.g. 001" /></div>
                <div><label className="block text-sm font-medium mb-2">Admission Number</label><input type="text" name="admissionNumber" value={formData.admissionNumber} onChange={handleChange} className="input-field" placeholder="Admission number" /></div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold mb-6">Create Account</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className="block text-sm font-medium mb-2">Password *</label><input type="password" name="password" value={formData.password} onChange={handleChange} required minLength={8} className="input-field" placeholder="Min 8 characters" /></div>
                <div><label className="block text-sm font-medium mb-2">Confirm Password *</label><input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required className="input-field" placeholder="Confirm password" /></div>
                <div className="md:col-span-2">
                  <div className="flex items-start">
                    <input id="agreeToTerms" name="agreeToTerms" type="checkbox" checked={formData.agreeToTerms} onChange={handleChange} required className="h-4 w-4 mt-1 mr-2" />
                    <label htmlFor="agreeToTerms" className="text-sm text-gray-700 dark:text-gray-300">I agree to the <Link href="/terms" className="text-primary-600">Terms of Service</Link> and <Link href="/privacy" className="text-primary-600">Privacy Policy</Link>.</label>
                  </div>
                </div>
              </div>
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold mb-3">Summary</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-gray-500">Name</p><p className="font-medium">{formData.firstName} {formData.lastName}</p></div>
                  <div><p className="text-gray-500">Email</p><p className="font-medium">{formData.email}</p></div>
                  <div><p className="text-gray-500">Grade</p><p className="font-medium">{formData.grade || 'Not provided'}</p></div>
                  <div><p className="text-gray-500">Section</p><p className="font-medium">{formData.section || 'Not provided'}</p></div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8">
            <button type="button" onClick={handleBack} className="btn-secondary px-8 py-3 flex items-center"><ArrowLeft className="h-5 w-5 mr-2" /> Back</button>
            <button type="submit" disabled={loading} className="btn-primary px-8 py-3 disabled:opacity-60">{loading ? 'Processing...' : step === 3 ? 'Complete Registration' : 'Continue'}</button>
          </div>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">Step {step} of {steps.length}</p>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2"><div className="bg-primary-600 h-2 rounded-full transition-all" style={{ width: `${(step / steps.length) * 100}%` }} /></div>
        </div>
      </div>
    </div>
  )
}
