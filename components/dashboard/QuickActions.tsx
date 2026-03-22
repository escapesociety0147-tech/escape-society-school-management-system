import { UserPlus, Calendar, FileText, CreditCard, UserCircle } from 'lucide-react'
import Link from 'next/link'

const actions = [
  {
    title: 'Register New Student',
    icon: UserPlus,
    href: '/students/register',
    color: 'bg-primary-500',
  },
  {
    title: 'Mark Attendance',
    icon: Calendar,
    href: '/attendance',
    color: 'bg-success-500',
  },
  {
    title: 'Enter Exam Results',
    icon: FileText,
    href: '/results',
    color: 'bg-warning-500',
  },
  {
    title: 'Record Payment',
    icon: CreditCard,
    href: '/fees',
    color: 'bg-accent-500',
  },
  {
    title: 'Manage Teachers',
    icon: UserCircle,
    href: '/teachers',
    color: 'bg-indigo-500',
  },
]

export default function QuickActions() {
  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.title}
              href={action.href}
              className="flex flex-col items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className={`${action.color} p-3 rounded-lg mb-3`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-medium text-center">{action.title}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
