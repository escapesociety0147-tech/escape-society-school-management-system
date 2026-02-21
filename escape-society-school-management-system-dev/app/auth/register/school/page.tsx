'use client'

import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Building2, Phone, Users, Check } from 'lucide-react'
import api from '@/lib/api'

export default function SchoolRegistrationPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    schoolName: '', schoolType: '', establishedYear: '', address: '', city: '', country: '',
    contactPerson: '', contactPosition: '', email: '', phone: '', website: '',
    academicBoard: '', totalStudents: '', classesOffered: [] as string[],
    adminName: '', adminEmail: '', adminPassword: '', confirmPassword: '', agreeToTerms: false,
  })

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
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
    if (step < 4) { setStep(step + 1); return }
    if (formData.adminPassword !== formData.confirmPassword) {
      setFormError('Passwords do not match.'); return
    }
    setLoading(true)
    try {
      const adminEmail = formData.adminEmail || formData.email
      const adminName = formData.adminName || formData.contactPerson
      await api.auth.register({ name: adminName, email: adminEmail, password: formData.adminPassword, role: 'admin' })
      const result = await api.auth.login(adminEmail, formData.adminPassword)
      const { token, user } = result
      document.cookie = `auth_token=${token}; path=/;`
      document.cookie = `user_type=user; path=/;`
      try {
        localStorage.setItem('esm_user_session', JSON.stringify({ id: user.id, role: user.role, name: user.name, email: user.email }))
        localStorage.setItem('esm_profile', JSON.stringify({ name: user.name, role: 'School Admin', email: user.email, phone: formData.phone }))
      } catch { }
      router.push(`/auth/register/success?type=school&email=${encodeURIComponent(adminEmail)}`)
    } catch (err: any) {
      setFormError(err.message || 'Unable to complete registration. Please try again.')
    } finally { setLoading(false) }
  }

  const handleBack = () => { if (step > 1) setStep(step - 1); else router.push('/auth/register') }
  const steps = [{ number: 1, title: 'School Info', icon: Building2 }, { number: 2, title: 'Contact', icon: Phone }, { number: 3, title: 'Academic', icon: Users }, { number: 4, title: 'Admin Account', icon: Check }]
  const schoolTypes = ['Primary School', 'Middle School', 'High School', 'International School', 'Boarding School', 'Co-educational', 'Special Education']
  const classes = ['Pre-KG', 'LKG', 'UKG', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <button onClick={handleBack} className="inline-flex items-center text-gray-600 hover:text-primary-600 mb-6"><ArrowLeft className="h-4 w-4 mr-2" /> Back</button>
        <div className="text-center mb-8"><h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Register Your School</h1></div>
        <div className="flex justify-between items-center mb-12">
          {steps.map((s, i) => (
            <div key={s.number} className="flex items-center">
              <div className={`flex flex-col items-center ${step >= s.number ? 'text-primary-600' : 'text-gray-400'}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${step >= s.number ? 'bg-primary-100' : 'bg-gray-100'}`}><s.icon className="h-6 w-6" /></div>
                <span className="text-sm font-medium">{s.title}</span>
              </div>
              {i < steps.length - 1 && <div className={`flex-1 h-1 mx-4 ${step > s.number ? 'bg-primary-500' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>
        <form onSubmit={handleSubmit}>
          {formError && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>}
          {step === 1 && (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold mb-6">School Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2"><label className="block text-sm font-medium mb-2">School Name *</label><input type="text" name="schoolName" value={formData.schoolName} onChange={handleChange} required className="input-field" placeholder="Enter full school name" /></div>
                <div><label className="block text-sm font-medium mb-2">School Type *</label><select name="schoolType" value={formData.schoolType} onChange={handleChange} required className="input-field"><option value="">Select type</option>{schoolTypes.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                <div><label className="block text-sm font-medium mb-2">Year Established *</label><input type="number" name="establishedYear" value={formData.establishedYear} onChange={handleChange} required min="1900" max={new Date().getFullYear()} className="input-field" placeholder="e.g. 1995" /></div>
                <div className="md:col-span-2"><label className="block text-sm font-medium mb-2">Address *</label><textarea name="address" value={formData.address} onChange={handleChange} required rows={3} className="input-field" placeholder="Full address" /></div>
                <div><label className="block text-sm font-medium mb-2">City *</label><input type="text" name="city" value={formData.city} onChange={handleChange} required className="input-field" placeholder="City" /></div>
                <div><label className="block text-sm font-medium mb-2">Country *</label><input type="text" name="country" value={formData.country} onChange={handleChange} required className="input-field" placeholder="Country" /></div>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className="block text-sm font-medium mb-2">Contact Person *</label><input type="text" name="contactPerson" value={formData.contactPerson} onChange={handleChange} required className="input-field" placeholder="Full name" /></div>
                <div><label className="block text-sm font-medium mb-2">Position *</label><input type="text" name="contactPosition" value={formData.contactPosition} onChange={handleChange} required className="input-field" placeholder="e.g. Principal" /></div>
                <div><label className="block text-sm font-medium mb-2">Email *</label><input type="email" name="email" value={formData.email} onChange={handleChange} required className="input-field" placeholder="Official email" /></div>
                <div><label className="block text-sm font-medium mb-2">Phone *</label><input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className="input-field" placeholder="Phone number" /></div>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold mb-6">Academic Setup</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className="block text-sm font-medium mb-2">Academic Board *</label><select name="academicBoard" value={formData.academicBoard} onChange={handleChange} required className="input-field"><option value="">Select board</option><option value="CBSE">CBSE</option><option value="ICSE">ICSE</option><option value="State">State Board</option><option value="IB">IB</option><option value="Other">Other</option></select></div>
                <div><label className="block text-sm font-medium mb-2">Total Students *</label><input type="number" name="totalStudents" value={formData.totalStudents} onChange={handleChange} required min="1" className="input-field" placeholder="Approx. number" /></div>
                <div className="md:col-span-2"><label className="block text-sm font-medium mb-2">Classes Offered</label><div className="grid grid-cols-3 md:grid-cols-4 gap-3">{classes.map(c => <button key={c} type="button" onClick={() => handleClassToggle(c)} className={`p-3 rounded-lg border text-sm transition-colors ${formData.classesOffered.includes(c) ? 'border-primary-500 bg-primary-50 text-primary-600' : 'border-gray-200'}`}>{c}</button>)}</div></div>
              </div>
            </div>
          )}
          {step === 4 && (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold mb-6">Create Admin Account</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className="block text-sm font-medium mb-2">Admin Full Name *</label><input type="text" name="adminName" value={formData.adminName} onChange={handleChange} required className="input-field" placeholder="Full name" /></div>
                <div><label className="block text-sm font-medium mb-2">Admin Email *</label><input type="email" name="adminEmail" value={formData.adminEmail} onChange={handleChange} required className="input-field" placeholder="Admin email" /></div>
                <div><label className="block text-sm font-medium mb-2">Password *</label><input type="password" name="adminPassword" value={formData.adminPassword} onChange={handleChange} required minLength={8} className="input-field" placeholder="Min 8 characters" /></div>
                <div><label className="block text-sm font-medium mb-2">Confirm Password *</label><input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required className="input-field" placeholder="Confirm password" /></div>
                <div className="md:col-span-2"><div className="flex items-start"><input id="agreeToTerms" name="agreeToTerms" type="checkbox" checked={formData.agreeToTerms} onChange={handleChange} required className="h-4 w-4 mt-1 mr-2" /><label htmlFor="agreeToTerms" className="text-sm text-gray-700 dark:text-gray-300">I agree to the <Link href="/terms" className="text-primary-600">Terms of Service</Link> and <Link href="/privacy" className="text-primary-600">Privacy Policy</Link>.</label></div></div>
              </div>
            </div>
          )}
          <div className="flex justify-between mt-8">
            <button type="button" onClick={handleBack} className="btn-secondary px-8 py-3 flex items-center"><ArrowLeft className="h-5 w-5 mr-2" /> Back</button>
            <button type="submit" disabled={loading} className="btn-primary px-8 py-3 disabled:opacity-60">{loading ? 'Processing...' : step === 4 ? 'Complete Registration' : 'Continue'}</button>
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
