'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  UserCircle,
  Calendar,
  BookOpen,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Home,
  FileText,
  BarChart3,
  Bell,
  MessageSquare,
  Settings,
  HelpCircle,
  Shield,
  LogOut,
  HeartHandshake,
} from 'lucide-react'
import { useLocalStorageState } from '@/lib/useLocalStorage'

const mainNavItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Students', href: '/students', icon: Users },
  { name: 'Teachers', href: '/teachers', icon: UserCircle },
  { name: 'Parents', href: '/parents', icon: HeartHandshake },
  { name: 'Attendance', href: '/attendance', icon: Calendar },
  { name: 'Results', href: '/results', icon: BookOpen },
  { name: 'Fees', href: '/fees', icon: CreditCard },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Events', href: '/events', icon: Calendar },
]

const supportNavItems = [
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Messages', href: '/messages', icon: MessageSquare },
  { name: 'Support', href: '/support', icon: HelpCircle },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const [profile] = useLocalStorageState('esm_profile', {
    name: '',
    role: '',
    email: '',
    phone: '',
  })

  return (
    <aside
      className={`
        ${collapsed ? 'w-20' : 'w-64'}
        bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
        transition-all duration-300 ease-in-out
        h-screen sticky top-0 flex flex-col
      `}
    >
      {/* Logo Section */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <Link href="/" className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-primary-600 to-primary-800 p-2 rounded-lg">
            <Home className="h-6 w-6 text-white" />
          </div>
          {!collapsed && (
            <div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                EduManage
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                v2.0.1
              </p>
            </div>
          )}
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {!collapsed && (
          <div className="px-4 mb-3">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Main Menu
            </h3>
          </div>
        )}
        <ul className="space-y-1 px-3">
          {mainNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all
                    ${isActive
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && (
                    <span className="font-medium text-sm truncate">{item.name}</span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Support Section */}
        {!collapsed && (
          <div className="px-4 mt-6 mb-3">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Support
            </h3>
          </div>
        )}
        <ul className="space-y-1 px-3">
          {supportNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all
                    ${isActive
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && (
                    <span className="font-medium text-sm truncate">{item.name}</span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Admin Section - Fixed at bottom */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="h-10 w-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5">
              <div className="h-3 w-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800">
                <div className="h-full w-full bg-green-500 rounded-full animate-ping opacity-75"></div>
              </div>
            </div>
          </div>
          
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {profile.name || 'Admin Account'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {profile.role || 'School Admin'}
                  </p>
                </div>
                <button 
                  onClick={() => {/* Add logout handler */}}
                  className="text-gray-400 hover:text-error-500 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Collapse Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 transform -translate-y-1/2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full p-1.5 shadow-lg hover:shadow-xl transition-shadow"
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        ) : (
          <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        )}
      </button>
    </aside>
  )
}
