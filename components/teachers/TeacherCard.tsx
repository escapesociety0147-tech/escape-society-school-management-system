import { Mail, Phone, Eye, Trash2, RefreshCcw, Pencil } from 'lucide-react'

interface TeacherCardProps {
  teacher: {
    id: number
    empId: string
    name: string
    department: string
    subjects: string[]
    email: string
    phone: string
    status: string
  }
  onRemove?: () => void
  onToggleStatus?: () => void
  onEdit?: () => void
}

export default function TeacherCard({ teacher, onRemove, onToggleStatus, onEdit }: TeacherCardProps) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="font-bold text-lg text-gray-900 dark:text-white">
            {teacher.name}
          </h4>
          <p className="text-sm text-primary-600 dark:text-primary-400">{teacher.empId}</p>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          teacher.status === 'Active'
            ? 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-300'
            : 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-300'
        }`}>
          {teacher.status}
        </span>
      </div>

      <div className="mb-4">
        <span className="inline-block bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 text-xs font-semibold px-2 py-1 rounded mb-2">
          {teacher.department}
        </span>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Subjects Taught:</p>
        <div className="flex flex-wrap gap-1">
          {teacher.subjects.map((subject, index) => (
            <span
              key={index}
              className="text-xs bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-2 py-1 rounded"
            >
              {subject}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center space-x-2">
          <Mail className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          <span className="text-sm text-gray-700 dark:text-gray-300">{teacher.email}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Phone className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          <span className="text-sm text-gray-700 dark:text-gray-300">{teacher.phone}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button className="flex-1 btn-secondary flex items-center justify-center space-x-2">
          <Eye className="h-4 w-4" />
          <span>View Profile</span>
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-center"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onToggleStatus}
          className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-center"
        >
          <RefreshCcw className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="px-3 py-2 rounded-lg border border-error-200 dark:border-error-800 text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 flex items-center justify-center"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
