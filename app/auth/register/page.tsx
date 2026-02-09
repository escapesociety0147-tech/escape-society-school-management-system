'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { School, User, Building2, ChevronRight, Check, ArrowLeft, GraduationCap } from 'lucide-react'

const registrationTypes = [
  {
    id: 'school',
    title: 'School / Institution',
    description:
      'Register your educational institution to manage students, teachers, and administrative tasks.',
    icon: School,
    features: [
      'Manage unlimited students & teachers',
      'Attendance & exam management',
      'Fee collection & financial reports',
      'Parent & teacher portals',
    ],
    recommended: true,
  },
  {
    id: 'teacher',
    title: 'Teacher / Staff',
    description: "Join your school's EduManage system or register as an individual educator.",
    icon: User,
    features: [
      'Access student information',
      'Mark attendance & grades',
      'Communicate with parents',
      'Track class performance',
    ],
  },
  {
    id: 'parent',
    title: 'Parent / Guardian',
    description: "Connect with your child's school to track progress and receive updates.",
    icon: Building2,
    features: [
      "Monitor child's attendance",
      'View grades & report cards',
      'Receive school notifications',
      'Make fee payments online',
    ],
  },
  {
    id: 'student',
    title: 'Student',
    description: 'Access your classes, attendance, results, and school updates in one place.',
    icon: GraduationCap,
    features: [
      'View attendance and results',
      'Track fees and payments',
      'Access documents and events',
      'Message teachers securely',
    ],
  },
] as const

type RegistrationType = (typeof registrationTypes)[number]['id']

export default function RegisterPage() {
  const router = useRouter()
  const [selectedType, setSelectedType] = useState<RegistrationType>('school')

  const handleContinue = () => {
    switch (selectedType) {
      case 'school':
        router.push('/auth/register/school')
        break
      case 'teacher':
        router.push('/auth/register/teacher')
        break
      case 'parent':
        router.push('/auth/register/parent')
        break
      case 'student':
        router.push('/auth/register/student')
        break
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Back button */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to home
          </Link>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Create Your Account
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Join thousands of educational institutions, teachers, and parents using EduManage
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {registrationTypes.map((type) => {
            const Icon = type.icon
            const isSelected = selectedType === type.id

            return (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`text-left p-8 rounded-2xl border-2 transition-all duration-200 ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-lg scale-[1.02]'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg ${
                      isSelected
                        ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {type.title}
                      </h3>
                      {type.recommended && (
                        <span className="inline-block mt-1 px-2 py-1 text-xs font-semibold bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded">
                          Most Popular
                        </span>
                      )}
                    </div>
                  </div>
                  {isSelected && (
                    <div className="bg-primary-500 text-white p-1 rounded-full">
                      <Check className="h-5 w-5" />
                    </div>
                  )}
                </div>

                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {type.description}
                </p>

                <ul className="space-y-3 mb-8">
                  {type.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-success-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className={`text-center py-3 rounded-lg font-medium ${
                  isSelected
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}>
                  {isSelected ? 'Selected' : 'Select Plan'}
                </div>
              </button>
            )
          })}
        </div>

        <div className="max-w-2xl mx-auto mt-12 p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Ready to get started with <span className="text-primary-600 dark:text-primary-400">
                  {registrationTypes.find(t => t.id === selectedType)?.title}
                </span>?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {selectedType === 'school' 
                  ? 'Start your 14-day free trial. No credit card required.'
                  : 'Create your account in just a few minutes.'}
              </p>
            </div>
            <button
              onClick={handleContinue}
              className="mt-4 sm:mt-0 btn-primary text-lg px-8 py-3 flex items-center space-x-2 group"
            >
              <span>Continue Registration</span>
              <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Already have an account?{' '}
              <Link
                href="/auth/login"
                className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mt-16">
          <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Frequently Asked Questions
          </h3>
          <div className="space-y-4">
            {[
              {
                question: 'Is there a free trial for schools?',
                answer: 'Yes, schools get a 14-day free trial with full access to all features. No credit card required.',
              },
              {
                question: 'Can teachers join existing school accounts?',
                answer: 'Yes, teachers can be invited by their school administrators or request to join an existing school.',
              },
              {
                question: 'How secure is my data?',
                answer: 'We use bank-level encryption, regular security audits, and comply with GDPR and data protection regulations.',
              },
              {
                question: 'Can I upgrade or downgrade my plan?',
                answer: 'Yes, you can change your plan at any time. Changes take effect at the start of your next billing cycle.',
              },
            ].map((faq, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {faq.question}
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
