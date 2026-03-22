'use client'

import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Upload, Save, RotateCcw } from 'lucide-react'
import { useLocalStorageState } from '@/lib/useLocalStorage'
import { seedStudents } from '@/lib/seedData'
import type { Student } from '@/components/students/StudentTable'
import { initialSchoolProfile } from '@/lib/schoolData'

export default function RegistrationForm() {
  const [students, setStudents] = useLocalStorageState<Student[]>('esm_students', seedStudents)
  const [schoolProfile] = useLocalStorageState('esm_school_profile', initialSchoolProfile)
  const [submitStatus, setSubmitStatus] = useState('')
  const [formError, setFormError] = useState('')
  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    nationality: '',
    religion: '',
    email: '',
    phone: '',
    currentAddress: '',
    permanentAddress: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    grade: '',
    section: '',
    rollNumber: '',
    admissionDate: '',
    previousSchoolName: '',
    previousSchoolGrade: '',
    fathersName: '',
    fathersOccupation: '',
    fathersPhone: '',
    mothersName: '',
    mothersOccupation: '',
    mothersPhone: '',
  })

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setFormError('')
    const nextId = students.length ? Math.max(...students.map((s) => s.id)) + 1 : 1
    const normalizedRoll = formData.rollNumber.trim()
    const existingRolls = new Set(students.map((student) => String(student.rollNumber).toLowerCase()))
    if (normalizedRoll && existingRolls.has(normalizedRoll.toLowerCase())) {
      setFormError('That roll number is already in use.')
      return
    }
    let rollNumber = normalizedRoll
    if (!rollNumber) {
      let counter = nextId
      let candidate = `2024${String(counter).padStart(3, '0')}`
      while (existingRolls.has(candidate.toLowerCase())) {
        counter += 1
        candidate = `2024${String(counter).padStart(3, '0')}`
      }
      rollNumber = candidate
    }
    const gradeLabel = formData.grade ? `Grade ${formData.grade}` : 'Grade 7'
    const newStudent: Student = {
      id: nextId,
      studentId: `STD-${String(nextId).padStart(4, '0')}`,
      rollNumber,
      name: formData.fullName,
      grade: gradeLabel,
      section: formData.section || 'A',
      contact: formData.phone || 'N/A',
      email: formData.email,
      status: 'Active',
      createdAt: new Date().toISOString(),
      schoolId: schoolProfile.schoolId || '',
    }

    setStudents((prev) => [newStudent, ...prev])
    setSubmitStatus('Student registered successfully.')
    setTimeout(() => setSubmitStatus(''), 2000)
    handleReset()
  }

  const handleReset = () => {
    setFormData({
      fullName: '',
      dateOfBirth: '',
      gender: '',
      bloodGroup: '',
      nationality: '',
      religion: '',
      email: '',
      phone: '',
      currentAddress: '',
      permanentAddress: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      grade: '',
      section: '',
      rollNumber: '',
      admissionDate: '',
      previousSchoolName: '',
      previousSchoolGrade: '',
      fathersName: '',
      fathersOccupation: '',
      fathersPhone: '',
      mothersName: '',
      mothersOccupation: '',
      mothersPhone: '',
    })
  }

  return (
    <div className="card">
      <form onSubmit={handleSubmit}>
        {submitStatus && (
          <p className="mb-4 text-sm text-success-600 dark:text-success-400">
            {submitStatus}
          </p>
        )}
        {formError && (
          <p className="mb-4 text-sm text-error-600 dark:text-error-400">
            {formError}
          </p>
        )}
        {/* Personal Information */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            Personal Information
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Student Photo
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  SVG, PNG, JPG or GIF (MAX. 800x400px)
                </p>
                <button
                  type="button"
                  className="mt-4 text-sm btn-secondary"
                >
                  Choose File
                </button>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="Enter full name"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
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
                  <label className="block text-sm font-medium mb-1">
                    Gender *
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                    className="input-field"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Blood Group
                  </label>
                  <select
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Nationality
                  </label>
                  <input
                    type="text"
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Enter nationality"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Religion
                  </label>
                  <input
                    type="text"
                    name="religion"
                    value={formData.religion}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Enter religion"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            Contact Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
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
              <label className="block text-sm font-medium mb-1">
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Current Address *
              </label>
              <textarea
                name="currentAddress"
                value={formData.currentAddress}
                onChange={handleChange}
                required
                rows={3}
                className="input-field"
                placeholder="Enter current address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Permanent Address
              </label>
              <textarea
                name="permanentAddress"
                value={formData.permanentAddress}
                onChange={handleChange}
                rows={3}
                className="input-field"
                placeholder="Enter permanent address"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Emergency Contact Name *
              </label>
              <input
                type="text"
                name="emergencyContactName"
                value={formData.emergencyContactName}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="Enter emergency contact name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Emergency Contact Phone *
              </label>
              <input
                type="tel"
                name="emergencyContactPhone"
                value={formData.emergencyContactPhone}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="Enter emergency contact phone"
              />
            </div>
          </div>
        </div>

        {/* Academic Information */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            Academic Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Grade/Class *
              </label>
              <select
                name="grade"
                value={formData.grade}
                onChange={handleChange}
                required
                className="input-field"
              >
                <option value="">Select Grade</option>
                <option value="7">Grade 7</option>
                <option value="8">Grade 8</option>
                <option value="9">Grade 9</option>
                <option value="10">Grade 10</option>
                <option value="11">Grade 11</option>
                <option value="12">Grade 12</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Section *
              </label>
              <select
                name="section"
                value={formData.section}
                onChange={handleChange}
                required
                className="input-field"
              >
                <option value="">Select Section</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Roll Number
              </label>
              <input
                type="text"
                name="rollNumber"
                value={formData.rollNumber}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter roll number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Admission Date *
              </label>
              <input
                type="date"
                name="admissionDate"
                value={formData.admissionDate}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Previous School Name
              </label>
              <input
                type="text"
                name="previousSchoolName"
                value={formData.previousSchoolName}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter previous school name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Previous School Grade
              </label>
              <input
                type="text"
                name="previousSchoolGrade"
                value={formData.previousSchoolGrade}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter previous grade"
              />
            </div>
          </div>
        </div>

        {/* Parent/Guardian Information */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            Parent/Guardian Information
          </h3>
          
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-3">Father's Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Father's Name *
                  </label>
                  <input
                    type="text"
                    name="fathersName"
                    value={formData.fathersName}
                    onChange={handleChange}
                    required
                    className="input-field"
                    placeholder="Enter father's name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Father's Occupation
                  </label>
                  <input
                    type="text"
                    name="fathersOccupation"
                    value={formData.fathersOccupation}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Enter father's occupation"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Father's Phone
                  </label>
                  <input
                    type="tel"
                    name="fathersPhone"
                    value={formData.fathersPhone}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Enter father's phone"
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Mother's Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Mother's Name *
                  </label>
                  <input
                    type="text"
                    name="mothersName"
                    value={formData.mothersName}
                    onChange={handleChange}
                    required
                    className="input-field"
                    placeholder="Enter mother's name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Mother's Occupation
                  </label>
                  <input
                    type="text"
                    name="mothersOccupation"
                    value={formData.mothersOccupation}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Enter mother's occupation"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Mother's Phone
                  </label>
                  <input
                    type="tel"
                    name="mothersPhone"
                    value={formData.mothersPhone}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Enter mother's phone"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={handleReset}
            className="btn-secondary flex items-center space-x-2"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset</span>
          </button>
          <button
            type="submit"
            className="btn-primary flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>Submit Registration</span>
          </button>
        </div>
      </form>
    </div>
  )
}
