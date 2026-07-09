'use client'

import { useMemo, useState } from 'react'
import { FileText, Download, Eye, Trash2 } from 'lucide-react'
import { useLocalStorageState } from '@/lib/useLocalStorage'
import { initialDocuments } from '@/lib/documentsData'

type ReadStatus = Record<number, 'Read' | 'Unread'>

export default function ParentDocumentsPage() {
  const [documents, setDocuments] = useLocalStorageState('esm_documents', initialDocuments)
  const [readStatus, setReadStatus] = useLocalStorageState<ReadStatus>(
    'esm_parent_document_reads',
    {}
  )
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [actionStatus, setActionStatus] = useState('')

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const status = readStatus[doc.id] || 'Unread'
      return statusFilter === 'All Status' ? true : status === statusFilter
    })
  }, [documents, statusFilter, readStatus])

  const toggleStatus = (id: number) => {
    setReadStatus((prev) => ({
      ...prev,
      [id]: prev[id] === 'Read' ? 'Unread' : 'Read',
    }))
  }

  const removeDoc = (id: number) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id))
  }

  const handleDownload = (doc: (typeof documents)[number]) => {
    if (doc?.fileUrl) {
      window.open(doc.fileUrl, '_blank', 'noopener,noreferrer')
      return
    }
    setActionStatus('File not available. Ask the school to re-upload.')
    setTimeout(() => setActionStatus(''), 2000)
  }

  const unreadCount = documents.filter((doc) => (readStatus[doc.id] || 'Unread') === 'Unread').length

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Documents
          </h2>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Access school forms, report cards, and shared resources synced from the school library.
        </p>
      </div>
      {actionStatus && (
        <p className="text-sm text-warning-600 dark:text-warning-400">{actionStatus}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Documents</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{documents.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500 dark:text-gray-400">Unread</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{unreadCount}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500 dark:text-gray-400">Categories</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {Array.from(new Set(documents.map((doc) => doc.category))).length}
          </p>
        </div>
      </div>

      <div className="card space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <select
            className="input-field w-full lg:w-40"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="All Status">All Status</option>
            <option value="Unread">Unread</option>
            <option value="Read">Read</option>
          </select>
        </div>

        <div className="space-y-3">
          {filteredDocuments.map((doc) => {
            const status = readStatus[doc.id] || 'Unread'
            return (
              <div
                key={doc.id}
                className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{doc.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {doc.category} | {doc.updated}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      status === 'Unread'
                        ? 'bg-warning-50 text-warning-600 dark:bg-warning-900/20 dark:text-warning-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                    }`}
                  >
                    {status}
                  </span>
                  <button
                    className="btn-secondary text-sm flex items-center gap-2"
                    onClick={() => toggleStatus(doc.id)}
                  >
                    <Eye className="h-4 w-4" />
                    {status === 'Unread' ? 'Mark Read' : 'Mark Unread'}
                  </button>
                  <button
                    className="btn-secondary text-sm flex items-center gap-2"
                    onClick={() => handleDownload(doc)}
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </button>
                  <button
                    className="btn-secondary text-sm flex items-center gap-2 text-error-600 dark:text-error-400"
                    onClick={() => removeDoc(doc.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {filteredDocuments.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No documents match your filters.
          </p>
        )}
      </div>
    </div>
  )
}
