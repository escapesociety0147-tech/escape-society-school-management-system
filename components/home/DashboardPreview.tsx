'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Monitor, Smartphone, Tablet } from 'lucide-react'

const previews = [
  {
    id: 1,
    title: 'Dashboard Overview',
    description: 'Real-time insights into school performance and key metrics',
    image: '/previews/dashboard.png',
  },
  {
    id: 2,
    title: 'Student Management',
    description: 'Comprehensive student profiles and academic tracking',
    image: '/previews/students.png',
  },
  {
    id: 3,
    title: 'Attendance System',
    description: 'Digital attendance tracking with automated reporting',
    image: '/previews/attendance.png',
  },
  {
    id: 4,
    title: 'Exam Results',
    description: 'Automated grading and performance analytics',
    image: '/previews/results.png',
  },
  {
    id: 5,
    title: 'Fee Management',
    description: 'Streamlined fee collection and financial tracking',
    image: '/previews/fees.png',
  },
]

export default function DashboardPreview() {
  const [activePreview, setActivePreview] = useState(0)
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')

  const nextPreview = () => {
    setActivePreview((prev) => (prev + 1) % previews.length)
  }

  const prevPreview = () => {
    setActivePreview((prev) => (prev - 1 + previews.length) % previews.length)
  }

  const deviceClasses = {
    desktop: 'w-full h-auto',
    tablet: 'max-w-md mx-auto h-96',
    mobile: 'max-w-sm mx-auto h-[500px]',
  }

  return (
    <section id="dashboard" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Beautiful & Intuitive Dashboard
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Experience the power of modern school management with our clean, user-friendly interface
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          <div className="lg:w-2/3">
            {/* Device selector */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setDevice('desktop')}
                  className={`px-4 py-2 rounded-md flex items-center space-x-2 transition-colors ${
                    device === 'desktop'
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <Monitor className="h-4 w-4" />
                  <span>Desktop</span>
                </button>
                <button
                  onClick={() => setDevice('tablet')}
                  className={`px-4 py-2 rounded-md flex items-center space-x-2 transition-colors ${
                    device === 'tablet'
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <Tablet className="h-4 w-4" />
                  <span>Tablet</span>
                </button>
                <button
                  onClick={() => setDevice('mobile')}
                  className={`px-4 py-2 rounded-md flex items-center space-x-2 transition-colors ${
                    device === 'mobile'
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <Smartphone className="h-4 w-4" />
                  <span>Mobile</span>
                </button>
              </div>
            </div>

            {/* Preview display */}
            <div className="relative bg-gray-900 rounded-xl p-2 shadow-2xl">
              <div className="bg-gray-800 p-4 rounded-t-lg flex items-center space-x-2">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-error-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-warning-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-success-500 rounded-full"></div>
                </div>
                <div className="flex-1 text-center text-sm text-gray-400">
                  {previews[activePreview].title}
                </div>
              </div>
              
              <div className={`${deviceClasses[device]} bg-gray-800 rounded-b-lg overflow-hidden`}>
                <div className="relative h-full bg-gradient-to-br from-primary-900/20 to-accent-900/20">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-white mb-2">
                        {previews[activePreview].title}
                      </div>
                      <p className="text-gray-300">
                        Interactive preview - {device} view
                      </p>
                    </div>
                  </div>
                  
                  {/* Navigation controls */}
                  <button
                    onClick={prevPreview}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
                  >
                    <ChevronLeft className="h-6 w-6 text-white" />
                  </button>
                  <button
                    onClick={nextPreview}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
                  >
                    <ChevronRight className="h-6 w-6 text-white" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:w-1/3">
            <div className="sticky top-24">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Key Features
              </h3>
              
              <div className="space-y-6">
                {previews.map((preview, index) => (
                  <button
                    key={preview.id}
                    onClick={() => setActivePreview(index)}
                    className={`text-left p-4 rounded-lg border transition-all w-full ${
                      activePreview === index
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        activePreview === index
                          ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <h4 className={`font-semibold mb-1 ${
                          activePreview === index
                            ? 'text-primary-600 dark:text-primary-400'
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {preview.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {preview.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-8 p-6 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-200 dark:border-primary-800">
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                  Responsive Design
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Access your school management system from any device - desktop, tablet, or mobile.
                </p>
                <div className="flex space-x-2">
                  <div className="text-xs px-2 py-1 bg-primary-100 dark:bg-primary-800 text-primary-800 dark:text-primary-300 rounded">
                    Desktop
                  </div>
                  <div className="text-xs px-2 py-1 bg-primary-100 dark:bg-primary-800 text-primary-800 dark:text-primary-300 rounded">
                    Tablet
                  </div>
                  <div className="text-xs px-2 py-1 bg-primary-100 dark:bg-primary-800 text-primary-800 dark:text-primary-300 rounded">
                    Mobile
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}