'use client'

import { useMemo, useState, type FormEvent } from 'react'
import DashboardShell from '@/components/dashboard/layout/DashboardShell'
import {
  CheckCircle,
  Clock,
  LifeBuoy,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Search,
  ShieldCheck,
} from 'lucide-react'
import { useLocalStorageState } from '@/lib/useLocalStorage'

const statusStyles: Record<string, string> = {
  Open: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300',
  'In Progress': 'bg-info-100 text-info-700 dark:bg-info-900/30 dark:text-info-300',
  Waiting: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-800 dark:text-secondary-200',
  Resolved: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300',
}

const initialTickets: Array<{
  id: string
  title: string
  requester: string
  status: string
  updated: string
}> = []

const resources: Array<{ title: string; views: string }> = []

export default function SupportPage() {
  const [tickets, setTickets] = useLocalStorageState('esm_support_tickets', initialTickets)
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    requester: '',
    status: 'Open',
  })

  const filteredTickets = useMemo(() => {
    return tickets.filter(
      (ticket) =>
        ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.requester.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.id.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [tickets, searchQuery])

  const handleNewTicket = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!formData.title || !formData.requester) return
    const nextIdNumber = tickets.length
      ? Math.max(...tickets.map((ticket) => Number(ticket.id.replace('SUP-', '')))) + 1
      : 2000
    const nextId = `SUP-${nextIdNumber}`
    setTickets((prev) => [
      {
        id: nextId,
        title: formData.title,
        requester: formData.requester,
        status: formData.status,
        updated: 'Just now',
      },
      ...prev,
    ])
    setFormData({ title: '', requester: '', status: 'Open' })
    setShowForm(false)
  }

  const handleToggleStatus = (id: string) => {
    const statusOrder = ['Open', 'In Progress', 'Waiting', 'Resolved']
    setTickets((prev) =>
      prev.map((ticket) => {
        if (ticket.id !== id) return ticket
        const nextStatus =
          statusOrder[(statusOrder.indexOf(ticket.status) + 1) % statusOrder.length]
        return { ...ticket, status: nextStatus, updated: 'Just now' }
      })
    )
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <LifeBuoy className="h-6 w-6 text-primary-500" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Support Center
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Track requests, browse knowledge base resources, and reach support.
            </p>
          </div>
          <button
            className="btn-primary flex items-center gap-2"
            onClick={() => setShowForm((prev) => !prev)}
          >
            <Plus className="h-4 w-4" />
            {showForm ? 'Close Form' : 'New Ticket'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleNewTicket} className="card">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
                  className="input-field mt-1"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Requester *</label>
                <input
                  type="text"
                  value={formData.requester}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, requester: event.target.value }))
                  }
                  className="input-field mt-1"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Status</label>
                <select
                  value={formData.status}
                  onChange={(event) => setFormData((prev) => ({ ...prev, status: event.target.value }))}
                  className="input-field mt-1"
                >
                  <option>Open</option>
                  <option>In Progress</option>
                  <option>Waiting</option>
                  <option>Resolved</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Create Ticket
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Open Tickets</h3>
              <Clock className="h-5 w-5 text-warning-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {tickets.filter((ticket) => ticket.status !== 'Resolved').length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {tickets.filter((ticket) => ticket.status === 'Waiting').length} awaiting response
            </p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Avg First Reply</h3>
              <MessageSquare className="h-5 w-5 text-info-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {tickets.length ? '—' : '--'}
            </p>
            <p className="text-sm text-success-600 dark:text-success-400 mt-1">
              {tickets.length ? 'Add response time data to calculate.' : 'No tickets yet.'}
            </p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Resolved This Month</h3>
              <CheckCircle className="h-5 w-5 text-success-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {tickets.filter((ticket) => ticket.status === 'Resolved').length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {tickets.length ? 'Satisfaction data pending' : 'No tickets yet.'}
            </p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">SLA Compliance</h3>
              <ShieldCheck className="h-5 w-5 text-primary-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {tickets.length ? '—' : '--'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {tickets.length ? 'Add SLA targets to calculate.' : 'No SLA data yet.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <div className="card">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-4">
                <h3 className="text-lg font-semibold">Active Tickets</h3>
                <div className="relative w-full lg:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search tickets..."
                    className="input-field pl-9"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                {filteredTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {ticket.id}
                        </p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {ticket.title}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Requester: {ticket.requester}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(ticket.id)}
                          className={`status-badge ${statusStyles[ticket.status]}`}
                        >
                          {ticket.status}
                        </button>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {ticket.updated}
                        </span>
                        <button className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredTickets.length === 0 && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    No tickets created yet.
                  </p>
                )}
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Knowledge Base Highlights</h3>
                <button className="btn-secondary text-sm px-3 py-1.5">
                  Browse all
                </button>
              </div>
              <div className="space-y-3">
                {resources.length === 0 ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    No knowledge base resources added yet.
                  </p>
                ) : (
                  resources.map((resource) => (
                    <div
                      key={resource.title}
                      className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {resource.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {resource.views}
                        </p>
                      </div>
                      <button className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                        Open
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Contact Support</h3>
                <LifeBuoy className="h-5 w-5 text-primary-500" />
              </div>
              <div className="space-y-3">
                <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <Phone className="h-4 w-4 text-primary-500" />
                    <span className="text-sm font-medium">Support Hotline</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    +1 (555) 482-9090
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Mon-Fri, 7:00 AM - 6:00 PM
                  </p>
                </div>
                <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <Mail className="h-4 w-4 text-primary-500" />
                    <span className="text-sm font-medium">Email Desk</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    support@escapesociety.edu
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Response within 2 hours
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">System Status</h3>
                <ShieldCheck className="h-5 w-5 text-success-500" />
              </div>
              <div className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  System status will appear once monitoring is configured.
                </p>
              </div>
              <button className="w-full mt-4 text-sm btn-secondary py-2">
                View incident history
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
