import type { ReactNode } from 'react'
import StudentSidebar from './StudentSidebar'
import StudentNavbar from './StudentNavbar'

export default function StudentShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <StudentSidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <StudentNavbar />
        <main className="flex-1 min-w-0 p-6 bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
