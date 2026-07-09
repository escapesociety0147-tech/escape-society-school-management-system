import { Calendar, CreditCard, FileText, UserMinus, UserPlus } from 'lucide-react'
import { useLocalStorageState } from '@/lib/useLocalStorage'

type ActivityItem = {
  action: string
  time: string
  iconKey: 'student' | 'attendance' | 'results' | 'payment' | 'alert'
}

const iconMap = {
  student: UserPlus,
  attendance: Calendar,
  results: FileText,
  payment: CreditCard,
  alert: UserMinus,
} as const

const colorMap: Record<ActivityItem['iconKey'], string> = {
  student: 'text-primary-500',
  attendance: 'text-success-500',
  results: 'text-warning-500',
  payment: 'text-accent-500',
  alert: 'text-error-500',
}

export default function RecentActivities() {
  const [activities] = useLocalStorageState<ActivityItem[]>('esm_activity_log', [])

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Recent Activities</h3>
      <div className="space-y-4">
        {activities.map((activity, index) => {
          const Icon = iconMap[activity.iconKey] || UserPlus
          return (
            <div key={index} className="flex items-start space-x-3">
              <div className={`${colorMap[activity.iconKey]} mt-1`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {activity.action}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {activity.time}
                </p>
              </div>
            </div>
          )
        })}
        {activities.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No recent activity yet.
          </p>
        )}
      </div>
    </div>
  )
}
