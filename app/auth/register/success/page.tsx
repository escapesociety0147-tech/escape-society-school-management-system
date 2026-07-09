'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, Mail, ArrowRight, Download, Clock, UserCheck } from 'lucide-react'
import { createSessionToken, loadUsers, normalizeEmail } from '@/lib/authStore'

export default function RegistrationSuccessPage() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [userType, setUserType] = useState('')
  const [schoolId, setSchoolId] = useState('')

  useEffect(() => {
    const emailParam = searchParams.get('email')
    const typeParam = searchParams.get('type')
    
    if (emailParam) setEmail(emailParam)
    if (typeParam) setUserType(typeParam)

    if (typeParam) {
      const mappedType =
        typeParam === 'teacher' || typeParam === 'parent' || typeParam === 'student'
          ? typeParam
          : 'user'
      document.cookie = `auth_token=${createSessionToken()}; path=/;`
      document.cookie = `user_type=${mappedType}; path=/;`
      if (emailParam) {
        try {
          const users = loadUsers()
          const match = users.find(
            (user) => normalizeEmail(user.email) === normalizeEmail(emailParam)
          )
          if (match) {
            localStorage.setItem(
              'esm_user_session',
              JSON.stringify({
                id: match.id,
                role: match.role,
                name: match.name,
                email: match.email,
              })
            )
          }
        } catch {
          // ignore storage errors
        }
      }
    }
    if (typeParam === 'school') {
      try {
        const storedProfile = localStorage.getItem('esm_school_profile')
        const parsed = storedProfile ? JSON.parse(storedProfile) : null
        if (parsed?.schoolId) {
          setSchoolId(parsed.schoolId)
        }
      } catch {
        // ignore storage errors
      }
    }
  }, [searchParams])

  const getNextSteps = () => {
    switch (userType) {
      case 'school':
        return [
          'Check your email for verification link',
          'Complete school profile setup',
          'Add your first classes and subjects',
          'Invite teachers and staff',
          'Start adding student records',
        ]
      case 'teacher':
        return [
          'Verify your email address',
          'Wait for school approval',
          'Complete your teacher profile',
          'Set up your classes and subjects',
          'Start using the dashboard',
        ]
      case 'parent':
        return [
          'Verify your email address',
          'Wait for school approval',
          'Connect with your child\'s profile',
          'Download the mobile app',
          'Start receiving updates',
        ]
      case 'student':
        return [
          'Verify your email address',
          'Complete your student profile',
          'Review your class schedule',
          'Check attendance and results',
          'Stay updated on events',
        ]
      default:
        return [
          'Check your email for verification',
          'Complete your profile setup',
          'Explore the dashboard',
          'Connect with your institution',
        ]
    }
  }

  const getRedirectPath = () => {
    switch (userType) {
      case 'school':
        return '/dashboard'
      case 'teacher':
        return '/teacher/dashboard'
      case 'parent':
        return '/parent/dashboard'
      case 'student':
        return '/student/dashboard'
      default:
        return '/dashboard'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-success-100 dark:bg-success-900 rounded-full mb-8">
            <CheckCircle className="h-12 w-12 text-success-600 dark:text-success-400" />
          </div>

          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Registration Successful!
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Welcome to EduManage! Your account has been created successfully.
          </p>

        {email && (
          <div className="inline-flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg px-6 py-4 mb-8">
            <Mail className="h-6 w-6 text-primary-600 dark:text-primary-400 mr-3" />
            <div className="text-left">
              <p className="text-sm text-gray-600 dark:text-gray-400">Verification email sent to</p>
              <p className="font-semibold text-gray-900 dark:text-white">{email}</p>
            </div>
          </div>
        )}
        {userType === 'school' && schoolId && (
          <div className="inline-flex items-center bg-primary-50 dark:bg-primary-900/20 rounded-lg px-6 py-4 mb-8">
            <div className="text-left">
              <p className="text-sm text-primary-600 dark:text-primary-300">School ID</p>
              <p className="font-semibold text-gray-900 dark:text-white">{schoolId}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Share this ID with teachers, parents, and students.
              </p>
            </div>
          </div>
        )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Next Steps
          </h2>

          <div className="space-y-4">
            {getNextSteps().map((step, index) => (
              <div key={index} className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mr-4">
                  <span className="text-primary-600 dark:text-primary-400 font-semibold">
                    {index + 1}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 dark:text-white">{step}</p>
                  {index === 0 && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Click the link in the email to verify your account
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-primary-50 dark:bg-primary-900/20 p-6 rounded-xl border border-primary-200 dark:border-primary-800">
            <div className="flex items-center mb-4">
              <Mail className="h-6 w-6 text-primary-600 dark:text-primary-400 mr-3" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Check Email</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Verify your email address to activate your account
            </p>
            <button className="w-full btn-secondary text-sm py-2">
              Resend Verification
            </button>
          </div>

          <div className="bg-success-50 dark:bg-success-900/20 p-6 rounded-xl border border-success-200 dark:border-success-800">
            <div className="flex items-center mb-4">
              <Download className="h-6 w-6 text-success-600 dark:text-success-400 mr-3" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Mobile App</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Download our mobile app for on-the-go access
            </p>
            <div className="flex space-x-2">
              <button className="flex-1 btn-secondary text-sm py-2">
                iOS
              </button>
              <button className="flex-1 btn-secondary text-sm py-2">
                Android
              </button>
            </div>
          </div>

          <div className="bg-warning-50 dark:bg-warning-900/20 p-6 rounded-xl border border-warning-200 dark:border-warning-800">
            <div className="flex items-center mb-4">
              <UserCheck className="h-6 w-6 text-warning-600 dark:text-warning-400 mr-3" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Support</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Need help? Our support team is available 24/7
            </p>
            <button className="w-full btn-secondary text-sm py-2">
              Contact Support
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href={getRedirectPath()}
            className="flex-1 btn-primary py-3 text-lg flex items-center justify-center space-x-2 group"
          >
            <span>Go to Dashboard</span>
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          
          <Link
            href="/"
            className="flex-1 btn-secondary py-3 text-lg text-center"
          >
            Back to Home
          </Link>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Didn't receive the email? Check your spam folder or{' '}
            <button className="text-primary-600 hover:text-primary-500 dark:text-primary-400">
              contact support
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
