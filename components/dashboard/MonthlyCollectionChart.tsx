'use client'

import { useMemo, useState } from 'react'
import { TrendingUp, Download, Filter } from 'lucide-react'
import { LineChart, Line, BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, 
         Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { useLocalStorageState } from '@/lib/useLocalStorage'
import { initialPayments } from '@/lib/paymentsData'

export default function MonthlyCollectionChart() {
  const [view, setView] = useState<'line' | 'bar' | 'area'>('area')
  const [timeRange, setTimeRange] = useState('year')
  const [payments] = useLocalStorageState('esm_payments', initialPayments)

  const data = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const totals = months.map(() => ({ fees: 0, donations: 0 }))
    payments.forEach((payment) => {
      const parsed = new Date(payment.lastPayment)
      if (Number.isNaN(parsed.getTime())) return
      const monthIndex = parsed.getMonth()
      totals[monthIndex].fees += payment.amountPaid || 0
    })
    return months.map((month, index) => {
      const fees = totals[index].fees
      const donations = totals[index].donations
      return { month, fees, donations, total: fees + donations }
    })
  }, [payments])

  const summary = useMemo(() => {
    const totalRevenue = data.reduce((sum, item) => sum + item.total, 0)
    const monthsWithData = data.filter((item) => item.total > 0).length
    const avgMonthly = monthsWithData ? totalRevenue / monthsWithData : 0
    const highest = data.reduce(
      (top, item) => (item.total > top.total ? item : top),
      { month: '—', total: 0 }
    )
    const currentMonthIndex = new Date().getMonth()
    const prevMonthIndex = (currentMonthIndex + 11) % 12
    const currentTotal = data[currentMonthIndex]?.total || 0
    const prevTotal = data[prevMonthIndex]?.total || 0
    const change =
      prevTotal > 0 ? `${(((currentTotal - prevTotal) / prevTotal) * 100).toFixed(1)}%` : '--'
    const projected = monthsWithData ? totalRevenue / monthsWithData * 12 : 0
    return {
      total: totalRevenue ? `$${totalRevenue.toLocaleString()}` : '--',
      change,
      avgMonthly: avgMonthly ? `$${Math.round(avgMonthly).toLocaleString()}` : '--',
      highestMonth: highest.total ? highest.month : '--',
      projected: projected ? `$${Math.round(projected).toLocaleString()}` : '--',
    }
  }, [data])

  const renderChart = () => {
    switch(view) {
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="month" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid #475569',
                borderRadius: '8px',
                color: '#f1f5f9'
              }}
            />
            <Legend />
            <Line type="monotone" dataKey="fees" stroke="#0d9488" strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="donations" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} />
          </LineChart>
        )
      case 'bar':
        return (
          <ReBarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="month" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid #475569',
                borderRadius: '8px',
                color: '#f1f5f9'
              }}
            />
            <Legend />
            <Bar dataKey="fees" fill="#0d9488" radius={[4, 4, 0, 0]} />
            <Bar dataKey="donations" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </ReBarChart>
        )
      case 'area':
        return (
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorFees" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0d9488" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="month" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid #475569',
                borderRadius: '8px',
                color: '#f1f5f9'
              }}
            />
            <Legend />
            <Area type="monotone" dataKey="total" stroke="#10b981" fillOpacity={1} fill="url(#colorTotal)" />
            <Area type="monotone" dataKey="fees" stroke="#0d9488" fillOpacity={1} fill="url(#colorFees)" />
          </AreaChart>
        )
    }
  }

  return (
    <div className="relative group">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-emerald-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
      
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-lg transition-all duration-300">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Monthly Collection Trend
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Track revenue performance over time
            </p>
          </div>
          
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            {/* Time Range Selector */}
            <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-900 rounded-lg p-1">
              {['month', 'quarter', 'year'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    timeRange === range
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
            
            {/* View Toggle */}
            <div className="flex items-center space-x-2">
              {['area', 'line', 'bar'].map((chartType) => (
                <button
                  key={chartType}
                  onClick={() => setView(chartType as any)}
                  className={`p-2 rounded-lg transition-colors ${
                    view === chartType
                      ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400'
                      : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title={`${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart`}
                >
                  {chartType === 'area' && '📊'}
                  {chartType === 'line' && '📈'}
                  {chartType === 'bar' && '📉'}
                </button>
              ))}
            </div>
            
            {/* Actions */}
            <div className="flex items-center space-x-2">
              <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <Filter className="h-5 w-5 text-slate-500 dark:text-slate-400" />
              </button>
              <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <Download className="h-5 w-5 text-slate-500 dark:text-slate-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Revenue</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {summary.total}
                </p>
              </div>
              <TrendingUp className="h-6 w-6 text-emerald-500" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-4 rounded-xl">
            <p className="text-sm text-slate-600 dark:text-slate-400">Growth</p>
            <div className="flex items-center mt-1">
              <TrendingUp className="h-5 w-5 text-blue-500 mr-2" />
              <p className="text-xl font-bold text-slate-900 dark:text-white">
                {summary.change}
              </p>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-xl">
            <p className="text-sm text-slate-600 dark:text-slate-400">Avg Monthly</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {summary.avgMonthly}
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-4 rounded-xl">
            <p className="text-sm text-slate-600 dark:text-slate-400">Peak Month</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {summary.highestMonth}
            </p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 bg-emerald-500 rounded-full"></div>
            <span className="text-sm text-slate-600 dark:text-slate-400">Total Collection</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 bg-teal-500 rounded-full"></div>
            <span className="text-sm text-slate-600 dark:text-slate-400">Tuition Fees</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 bg-purple-500 rounded-full"></div>
            <span className="text-sm text-slate-600 dark:text-slate-400">Donations</span>
          </div>
        </div>
      </div>
    </div>
  )
}
