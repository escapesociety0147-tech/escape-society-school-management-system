import type { ReactNode } from 'react'
import Sidebar from './DashboardSidebar'
import Navbar from './DashboardNavbar'

export default function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <Navbar />
        <main className="flex-1 min-w-0 p-6 bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
