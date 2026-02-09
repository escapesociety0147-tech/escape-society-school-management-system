'use client'

import { TrendingUp, TrendingDown, Target, Award, Zap, BarChart } from 'lucide-react'

export default function PerformanceMetrics() {
  const metrics = [
    {
      title: 'System Performance',
      value: '98.7%',
      change: '+2.3%',
      trend: 'up',
      icon: Zap,
      color: 'from-emerald-500 to-teal-500',
      status: 'Excellent'
    },
    {
      title: 'Goal Completion',
      value: '82%',
      change: '+15%',
      trend: 'up',
      icon: Target,
      color: 'from-blue-500 to-cyan-500',
      status: 'On Track'
    },
    {
      title: 'User Satisfaction',
      value: '4.8',
      change: '+0.3',
      trend: 'up',
      icon: Award,
      color: 'from-amber-500 to-orange-500',
      status: 'High'
    },
    {
      title: 'Task Efficiency',
      value: '76%',
      change: '-4%',
      trend: 'down',
      icon: BarChart,
      color: 'from-purple-500 to-pink-500',
      status: 'Needs Attention'
    },
  ]

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Performance Metrics
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Key performance indicators
          </p>
        </div>
        <div className="text-xs font-medium px-3 py-1.5 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-full">
          Live
        </div>
      </div>

      <div className="space-y-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon
          return (
            <div
              key={index}
              className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-800 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-lg bg-gradient-to-br ${metric.color}`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {metric.title}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-2xl font-bold text-slate-900 dark:text-white">
                      {metric.value}
                    </span>
                    <span className={`text-sm font-medium flex items-center ${
                      metric.trend === 'up' 
                        ? 'text-emerald-600 dark:text-emerald-400' 
                        : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {metric.trend === 'up' ? (
                        <TrendingUp className="h-4 w-4 mr-1" />
                      ) : (
                        <TrendingDown className="h-4 w-4 mr-1" />
                      )}
                      {metric.change}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                metric.status === 'Excellent' || metric.status === 'High'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                  : metric.status === 'On Track'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
              }`}>
                {metric.status}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
        <div className="text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Updated 5 minutes ago
          </p>
          <button className="mt-2 text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 text-sm font-medium">
            View Detailed Report →
          </button>
        </div>
      </div>
    </div>
  )
}