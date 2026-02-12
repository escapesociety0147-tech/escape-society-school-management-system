import type { ReactNode } from 'react'
import TeacherSidebar from './TeacherSidebar'
import TeacherNavbar from './TeacherNavbar'

export default function TeacherShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <TeacherSidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <TeacherNavbar />
        <main className="flex-1 min-w-0 p-6 bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
