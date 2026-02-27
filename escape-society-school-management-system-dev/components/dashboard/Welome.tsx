'use client'

import { useLocalStorageState } from '@/lib/useLocalStorage'
import { initialSchoolProfile } from '@/lib/schoolData'

interface WelcomeProps {
  date: Date
}

export default function Welcome({ date }: WelcomeProps) {
  const [schoolProfile] = useLocalStorageState('esm_school_profile', initialSchoolProfile)
  const schoolName = schoolProfile?.name?.trim() || 'Admin'

  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
        Welcome back, {schoolName}!
      </h1>
      <p className="text-slate-600 dark:text-slate-400 mt-2">
        Here's your system overview for {date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}
      </p>
    </div>
  )
}
