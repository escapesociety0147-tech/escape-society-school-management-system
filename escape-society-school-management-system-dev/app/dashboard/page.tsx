'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/dashboard/layout/DashboardShell'
import RecentActivities from '@/components/dashboard/RecentActivities'
import MonthlyCollectionChart from '@/components/dashboard/MonthlyCollectionChart'
import StatsCard from '@/components/dashboard/StatsCard'
import QuickActions from '@/components/dashboard/QuickActions'
import UpcomingEvents from '@/components/dashboard/UpcomingEvents'
import { Users, UserCircle, Activity, DollarSign } from 'lucide-react'
import Welcome from '@/components/dashboard/Welome'
import DashboardCalendar from '@/components/dashboard/DashboardCalender'
import api from '@/lib/api'

interface Stats {
  total_students: number
  total_teachers: number
  total_parents: number
  attendance_rate: number
  total_revenue: number
}

export default function DashboardPage() {
  const [date, setDate] = useState(new Date())
  const [stats, setStats] = useState<Stats>({
    total_students: 0,
    total_teachers: 0,
    total_parents: 0,
    attendance_rate: 0,
    total_revenue: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.stats.get()
      .then(setStats)
      .catch(() => setError('Could not load stats from server.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <DashboardShell>
      <Welcome date={date} />

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error} Make sure the backend is running at http://127.0.0.1:8000
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatsCard
          title="Total Students"
          value={loading ? '...' : stats.total_students.toLocaleString()}
          change="+0"
          trend="up"
          icon={Users}
          color="blue"
          description="Active enrollment"
        />
        <StatsCard
          title="Teaching Staff"
          value={loading ? '...' : stats.total_teachers.toLocaleString()}
          change="+0"
          trend="up"
          icon={UserCircle}
          color="purple"
          description="Full-time faculty"
        />
        <StatsCard
          title="Attendance Rate"
          value={loading ? '...' : `${stats.attendance_rate.toFixed(1)}%`}
          change="+0%"
          trend="up"
          icon={Activity}
          color="emerald"
          description="This month"
        />
        <StatsCard
          title="Monthly Revenue"
          value={loading ? '...' : `$${stats.total_revenue.toLocaleString()}`}
          change="+0%"
          trend="up"
          icon={DollarSign}
          color="amber"
          description="Total collected"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <div className="space-y-6">
            <QuickActions />
            <MonthlyCollectionChart />
          </div>
        </div>
        <div className="space-y-6">
          <DashboardCalendar date={date} onDateChange={setDate} />
          <RecentActivities />
        </div>
      </div>
    </DashboardShell>
  )
}