import RegistrationForm from '@/components/students/RegistrationForm'
import DashboardShell from '@/components/dashboard/layout/DashboardShell'

export default function RegisterStudentPage() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Student Registration
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Register a new student with all required information
          </p>
        </div>

        <RegistrationForm />
      </div>
    </DashboardShell>
  )
}
