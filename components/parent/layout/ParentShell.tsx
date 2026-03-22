import type { ReactNode } from 'react'
import ParentSidebar from './ParentSidebar'
import ParentNavbar from './ParentNavbar'

export default function ParentShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <ParentSidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <ParentNavbar />
        <main className="flex-1 min-w-0 p-6 bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
