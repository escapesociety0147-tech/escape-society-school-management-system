'use client'

import { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface EnhancedStatsCardProps {
  title: string
  value: string
  change: string
  trend: 'up' | 'down'
  icon: LucideIcon
  color: 'blue' | 'purple' | 'emerald' | 'amber' | 'rose' | 'teal'
  description?: string
}

const colorClasses = {
  blue: {
    bg: 'from-blue-500 to-cyan-500',
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
    trendUp: 'text-blue-600 dark:text-blue-400',
    trendDown: 'text-blue-400 dark:text-blue-300',
  },
  purple: {
    bg: 'from-purple-500 to-pink-500',
    iconBg: 'bg-purple-100 dark:bg-purple-900/30',
    iconColor: 'text-purple-600 dark:text-purple-400',
    trendUp: 'text-purple-600 dark:text-purple-400',
    trendDown: 'text-purple-400 dark:text-purple-300',
  },
  emerald: {
    bg: 'from-emerald-500 to-teal-500',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    trendUp: 'text-emerald-600 dark:text-emerald-400',
    trendDown: 'text-emerald-400 dark:text-emerald-300',
  },
  amber: {
    bg: 'from-amber-500 to-orange-500',
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    iconColor: 'text-amber-600 dark:text-amber-400',
    trendUp: 'text-amber-600 dark:text-amber-400',
    trendDown: 'text-amber-400 dark:text-amber-300',
  },
  rose: {
    bg: 'from-rose-500 to-pink-500',
    iconBg: 'bg-rose-100 dark:bg-rose-900/30',
    iconColor: 'text-rose-600 dark:text-rose-400',
    trendUp: 'text-rose-600 dark:text-rose-400',
    trendDown: 'text-rose-400 dark:text-rose-300',
  },
  teal: {
    bg: 'from-teal-500 to-emerald-500',
    iconBg: 'bg-teal-100 dark:bg-teal-900/30',
    iconColor: 'text-teal-600 dark:text-teal-400',
    trendUp: 'text-teal-600 dark:text-teal-400',
    trendDown: 'text-teal-400 dark:text-teal-300',
  },
}

export default function StatsCard({ 
  title, value, change, trend, icon: Icon, color, description 
}: EnhancedStatsCardProps) {
  const colors = colorClasses[color]

  return (
    <div className="relative group">
      {/* Background Glow Effect */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg} rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300 blur-xl`} />
      
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
        {/* Top Border Gradient */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${colors.bg}`} />
        
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
              {title}
            </p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              {value}
            </p>
            
            <div className="flex items-center space-x-2">
              {trend === 'up' ? (
                <TrendingUp className={`h-4 w-4 ${colors.trendUp}`} />
              ) : (
                <TrendingDown className={`h-4 w-4 ${colors.trendDown}`} />
              )}
              <span className={`text-sm font-medium ${colors.trendUp}`}>
                {change}
              </span>
              {description && (
                <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                  {description}
                </span>
              )}
            </div>
          </div>
          
          {/* Icon Container */}
          <div className="relative">
            <div className={`${colors.iconBg} p-3 rounded-xl relative z-10`}>
              <Icon className={`h-6 w-6 ${colors.iconColor}`} />
            </div>
            {/* Icon Glow */}
            <div className={`absolute inset-0 ${colors.iconBg} rounded-xl opacity-50 blur-md`} />
          </div>
        </div>
        
        {/* Progress Indicator */}
        <div className="mt-6">
          <div className="h-1 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r ${colors.bg} rounded-full`}
              style={{ width: trend === 'up' ? '75%' : '40%' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}