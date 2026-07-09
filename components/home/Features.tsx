import { Users, UserCheck, BookOpen, CreditCard, BarChart, Settings, Lock, Bell } from 'lucide-react'

const features = [
  {
    icon: Users,
    title: 'Student Management',
    description: 'Comprehensive student profiles with academic records, attendance, and performance tracking.',
    color: 'primary',
  },
  {
    icon: UserCheck,
    title: 'Attendance Tracking',
    description: 'Real-time attendance monitoring with automated reports and parent notifications.',
    color: 'success',
  },
  {
    icon: BookOpen,
    title: 'Exam Results',
    description: 'Automated grade calculation, report cards, and performance analytics.',
    color: 'accent',
  },
  {
    icon: CreditCard,
    title: 'Fee Management',
    description: 'Streamlined fee collection, payment tracking, and financial reporting.',
    color: 'warning',
  },
  {
    icon: BarChart,
    title: 'Analytics Dashboard',
    description: 'Interactive dashboards with insights into academic and administrative metrics.',
    color: 'info',
  },
  {
    icon: Settings,
    title: 'Customizable Modules',
    description: 'Flexible system that adapts to your school\'s unique requirements.',
    color: 'gray',
  },
  {
    icon: Lock,
    title: 'Secure & Compliant',
    description: 'Bank-level security with GDPR and data protection compliance.',
    color: 'error',
  },
  {
    icon: Bell,
    title: 'Automated Notifications',
    description: 'Automatic alerts for fees, attendance, exams, and important announcements.',
    color: 'purple',
  },
]

const colorClasses = {
  primary: 'bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-400',
  success: 'bg-success-100 text-success-600 dark:bg-success-900 dark:text-success-400',
  accent: 'bg-accent-100 text-accent-600 dark:bg-accent-900 dark:text-accent-400',
  warning: 'bg-warning-100 text-warning-600 dark:bg-warning-900 dark:text-warning-400',
  info: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400',
  gray: 'bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-400',
  error: 'bg-error-100 text-error-600 dark:bg-error-900 dark:text-error-400',
  purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400',
}

export default function Features() {
  return (
    <section id="features" className="py-20 bg-gray-50 dark:bg-gray-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Everything You Need to Manage Your School
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            From student admissions to graduation, EduManage covers all aspects of school administration
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            const color = feature.color as keyof typeof colorClasses
            
            return (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                <div className={`inline-flex p-3 rounded-lg mb-4 ${colorClasses[color]}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}