'use client'

import { useMemo, useState } from 'react'
import DashboardShell from '@/components/dashboard/layout/DashboardShell'
import RecentActivities from '@/components/dashboard/RecentActivities'
import MonthlyCollectionChart from '@/components/dashboard/MonthlyCollectionChart'
import StatsCard from '@/components/dashboard/StatsCard'
import QuickActions from '@/components/dashboard/QuickActions'
import UpcomingEvents from '@/components/dashboard/UpcomingEvents'
import { 
  Users, UserCircle, Activity, DollarSign
} from 'lucide-react'
import Welcome from '@/components/dashboard/Welome'
import DashboardCalendar from '@/components/dashboard/DashboardCalender'
import { useLocalStorageState } from '@/lib/useLocalStorage'
import { seedStudents } from '@/lib/seedData'
import { initialPayments } from '@/lib/paymentsData'
import { initialAttendanceHistory } from '@/lib/attendanceData'

export default function DashboardPage() {
  const [date, setDate] = useState(new Date())
  const [students] = useLocalStorageState('esm_students', seedStudents)
  const [teachers] = useLocalStorageState('esm_teachers', [])
  const [attendanceHistory] = useLocalStorageState(
    'esm_attendance_history',
    initialAttendanceHistory
  )
  const [payments] = useLocalStorageState('esm_payments', initialPayments)

  const now = new Date()
  const currentMonth = now.toISOString().slice(0, 7)
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    .toISOString()
    .slice(0, 7)
  const monthLabel = now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

  const computeAttendanceRate = (records: typeof attendanceHistory) => {
    const totals = records.reduce(
      (acc, record) => {
        acc.present += record.present
        acc.total += record.present + record.absent
        return acc
      },
      { present: 0, total: 0 }
    )
    return totals.total ? Number(((totals.present / totals.total) * 100).toFixed(1)) : 0
  }

  const attendanceThisMonth = useMemo(() => {
    const records = attendanceHistory.filter((record) => record.dateISO.startsWith(currentMonth))
    return computeAttendanceRate(records)
  }, [attendanceHistory, currentMonth])

  const attendancePrevMonth = useMemo(() => {
    const records = attendanceHistory.filter((record) => record.dateISO.startsWith(previousMonth))
    return computeAttendanceRate(records)
  }, [attendanceHistory, previousMonth])

  const attendanceDelta = Number((attendanceThisMonth - attendancePrevMonth).toFixed(1))
  const attendanceChange = `${attendanceDelta >= 0 ? '+' : ''}${attendanceDelta}%`

  const revenueThisMonth = useMemo(
    () =>
      payments
        .filter((payment) => payment.lastPayment.startsWith(currentMonth))
        .reduce((sum, payment) => sum + payment.amountPaid, 0),
    [payments, currentMonth]
  )

  const revenuePrevMonth = useMemo(
    () =>
      payments
        .filter((payment) => payment.lastPayment.startsWith(previousMonth))
        .reduce((sum, payment) => sum + payment.amountPaid, 0),
    [payments, previousMonth]
  )

  const revenueDeltaPct = revenuePrevMonth
    ? ((revenueThisMonth - revenuePrevMonth) / revenuePrevMonth) * 100
    : 0
  const revenueChange = `${revenueDeltaPct >= 0 ? '+' : ''}${revenueDeltaPct.toFixed(1)}%`

  const newStudentsThisMonth = useMemo(
    () => students.filter((student: { createdAt?: string }) => student.createdAt?.startsWith(currentMonth)).length,
    [students, currentMonth]
  )

  const newTeachersThisMonth = useMemo(
    () => teachers.filter((teacher: { createdAt?: string }) => teacher.createdAt?.startsWith(currentMonth)).length,
    [teachers, currentMonth]
  )

  return (
    <DashboardShell>
      {/* Welcome Section */}
      <Welcome date={date} />
      
      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatsCard
          title="Total Students"
          value={students.length.toLocaleString()}
          change={`+${newStudentsThisMonth}`}
          trend="up"
          icon={Users}
          color="blue"
          description={newStudentsThisMonth ? `${newStudentsThisMonth} new this month` : 'Active enrollment'}
        />
        <StatsCard
          title="Teaching Staff"
          value={teachers.length.toLocaleString()}
          change={`+${newTeachersThisMonth}`}
          trend="up"
          icon={UserCircle}
          color="purple"
          description={newTeachersThisMonth ? `${newTeachersThisMonth} new this month` : 'Full-time faculty'}
        />
        <StatsCard
          title="Attendance Rate"
          value={`${attendanceThisMonth.toFixed(1)}%`}
          change={attendanceChange}
          trend={attendanceDelta >= 0 ? 'up' : 'down'}
          icon={Activity}
          color="emerald"
          description="This month"
        />
        <StatsCard
          title="Monthly Revenue"
          value={`$${revenueThisMonth.toLocaleString()}`}
          change={revenueChange}
          trend={revenueDeltaPct >= 0 ? 'up' : 'down'}
          icon={DollarSign}
          color="amber"
          description={`Updated ${monthLabel}`}
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left Column: Quick Actions */}
        <div className="lg:col-span-2">
          <div className="space-y-6">
            <QuickActions />
            <MonthlyCollectionChart />
          </div>
        </div>
        
        {/* Right Column: Calendar & Upcoming Events */}
        <div className="space-y-6">
          <DashboardCalendar date={date} onDateChange={setDate} />
             {/* Recent Activities */}
      <RecentActivities />
        </div>
      </div>
    </DashboardShell>
  )
}
