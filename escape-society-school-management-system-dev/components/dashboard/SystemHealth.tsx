'use client'

import { useState } from 'react'
import { Server, Database, Shield, Cpu, Activity, AlertCircle, 
         CheckCircle, XCircle, Clock, Zap, RefreshCw, BarChart } from 'lucide-react'

export default function SystemHealth() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const systemMetrics = [
    {
      name: 'Web Server',
      status: 'operational',
      uptime: '99.98%',
      responseTime: '42ms',
      icon: Server,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/30'
    },
    {
      name: 'Database',
      status: 'operational',
      uptime: '99.95%',
      responseTime: '18ms',
      icon: Database,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/30'
    },
    {
      name: 'Security',
      status: 'warning',
      uptime: '99.85%',
      responseTime: '65ms',
      icon: Shield,
      color: 'text-amber-500',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30'
    },
    {
      name: 'CPU Usage',
      status: 'operational',
      uptime: '76%',
      responseTime: 'N/A',
      icon: Cpu,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/30'
    },
    {
      name: 'Memory',
      status: 'operational',
      uptime: '82%',
      responseTime: 'N/A',
      icon: Activity,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/30'
    },
    {
      name: 'Backup System',
      status: 'degraded',
      uptime: '99.50%',
      responseTime: '120ms',
      icon: Database,
      color: 'text-rose-500',
      bgColor: 'bg-rose-100 dark:bg-rose-900/30'
    },
  ]

  const performanceData = [
    { label: 'CPU', value: 76, color: 'bg-blue-500' },
    { label: 'Memory', value: 82, color: 'bg-emerald-500' },
    { label: 'Disk', value: 45, color: 'bg-amber-500' },
    { label: 'Network', value: 68, color: 'bg-purple-500' },
  ]

  const recentIssues = [
    { id: 1, component: 'Backup System', time: '2 hours ago', status: 'resolved' },
    { id: 2, component: 'Security Scanner', time: '1 day ago', status: 'investigating' },
    { id: 3, component: 'Email Server', time: '3 days ago', status: 'resolved' },
  ]

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'operational':
        return <CheckCircle className="h-5 w-5 text-emerald-500" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-amber-500" />
      case 'degraded':
        return <XCircle className="h-5 w-5 text-rose-500" />
      default:
        return <Clock className="h-5 w-5 text-slate-500" />
    }
  }

  const refreshData = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  return (
    <div className="relative group">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
      
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-lg transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                System Health
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Real-time system monitoring
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-5 w-5 text-slate-500 dark:text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <div className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full text-sm font-medium">
              <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span>All Systems Operational</span>
            </div>
          </div>
        </div>

        {/* Performance Charts */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-slate-900 dark:text-white">
              Resource Usage
            </h4>
            <Zap className="h-5 w-5 text-amber-500" />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {performanceData.map((metric, index) => (
              <div key={index} className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-800 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {metric.label}
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {metric.value}%
                  </span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${metric.color} rounded-full transition-all duration-500`}
                    style={{ width: `${metric.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Components */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-slate-900 dark:text-white">
              System Components
            </h4>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              6/6 monitored
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {systemMetrics.map((component, index) => {
              const Icon = component.icon
              return (
                <div
                  key={index}
                  className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${component.bgColor}`}>
                        <Icon className={`h-5 w-5 ${component.color}`} />
                      </div>
                      <div>
                        <h5 className="font-medium text-slate-900 dark:text-white">
                          {component.name}
                        </h5>
                        <div className="flex items-center space-x-2 mt-1">
                          {getStatusIcon(component.status)}
                          <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                            {component.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center p-2 bg-slate-100 dark:bg-slate-900/50 rounded-lg">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Uptime</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {component.uptime}
                      </p>
                    </div>
                    <div className="text-center p-2 bg-slate-100 dark:bg-slate-900/50 rounded-lg">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Response</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {component.responseTime}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent Issues */}
        <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-slate-900 dark:text-white">
              Recent Issues
            </h4>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Last 7 days
            </span>
          </div>
          
          <div className="space-y-3">
            {recentIssues.map((issue) => (
              <div
                key={issue.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-800 hover:shadow-sm transition-all"
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-1.5 rounded-full ${
                    issue.status === 'resolved' 
                      ? 'bg-emerald-100 dark:bg-emerald-900/30' 
                      : 'bg-amber-100 dark:bg-amber-900/30'
                  }`}>
                    {issue.status === 'resolved' ? (
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {issue.component}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {issue.time}
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  issue.status === 'resolved'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                }`}>
                  {issue.status.charAt(0).toUpperCase() + issue.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            <span className="font-medium">Last updated:</span> Just now
          </div>
          <button className="flex items-center space-x-2 text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium">
            <BarChart className="h-4 w-4" />
            <span>Detailed Analytics</span>
          </button>
        </div>
      </div>
    </div>
  )
}