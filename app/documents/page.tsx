'use client'

import { useEffect, useMemo, useState, type FormEvent, type ChangeEvent } from 'react'
import DashboardShell from '@/components/dashboard/layout/DashboardShell'
import {
  Clock,
  FileText,
  Folder,
  HardDrive,
  Plus,
  Search,
  Share2,
  ShieldCheck,
  Upload,
} from 'lucide-react'
import { useLocalStorageState } from '@/lib/useLocalStorage'
import { initialDocuments, initialDocumentFolders } from '@/lib/documentsData'

const documentStatusStyles: Record<string, string> = {
  Approved: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300',
  'In Review': 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300',
  Draft: 'bg-secondary-200 text-secondary-700 dark:bg-secondary-800 dark:text-secondary-200',
  'Expiring Soon': 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-300',
}

const initialFolders = initialDocumentFolders

const requests: Array<{
  title: string
  requester: string
  due: string
  status: string
}> = []

export default function DocumentsPage() {
  const [profile] = useLocalStorageState('esm_profile', {
    name: '',
    role: '',
    email: '',
    phone: '',
  })
  const [documents, setDocuments] = useLocalStorageState('esm_documents', initialDocuments)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('Category')
  const [ownerFilter, setOwnerFilter] = useState('Owner')
  const [statusFilter, setStatusFilter] = useState('Status')
  const [sortBy, setSortBy] = useState('Last Updated')
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [showFolderForm, setShowFolderForm] = useState(false)
  const [folderList, setFolderList] = useLocalStorageState(
    'esm_document_folders',
    initialFolders
  )
  const [newFolderName, setNewFolderName] = useState('')
  const [uploadStatus, setUploadStatus] = useState('')
  const [fileError, setFileError] = useState('')
  const [fileData, setFileData] = useState<{
    fileName: string
    displayName: string
    typeLabel: string
    sizeLabel: string
    sizeBytes: number
    dataUrl: string
  } | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    owner: '',
    type: 'PDF',
    status: 'Draft',
  })

  const maxUploadBytes = 2 * 1024 * 1024

  useEffect(() => {
    if (!showUploadForm) {
      setFileData(null)
      setFileError('')
    }
  }, [showUploadForm])

  useEffect(() => {
    if (!formData.owner && profile.name) {
      setFormData((prev) => ({ ...prev, owner: profile.name }))
    }
  }, [formData.owner, profile.name])

  const ownerOptions = useMemo(() => {
    const owners = new Set<string>()
    documents.forEach((doc) => {
      if (doc.owner) owners.add(doc.owner)
    })
    if (profile.name) owners.add(profile.name)
    return Array.from(owners).sort((a, b) => a.localeCompare(b))
  }, [documents, profile.name])

  const filteredDocuments = useMemo(() => {
    let filtered = documents.filter((doc) => {
      const ownerName = doc.owner || ''
      const matchesSearch =
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ownerName.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = categoryFilter === 'Category' || doc.category === categoryFilter
      const matchesOwner = ownerFilter === 'Owner' || ownerName === ownerFilter
      const matchesStatus = statusFilter === 'Status' || doc.status === statusFilter
      return matchesSearch && matchesCategory && matchesOwner && matchesStatus
    })

    if (sortBy === 'Owner') {
      filtered = [...filtered].sort((a, b) => a.owner.localeCompare(b.owner))
    } else if (sortBy === 'Category') {
      filtered = [...filtered].sort((a, b) => a.category.localeCompare(b.category))
    } else if (sortBy === 'Size') {
      filtered = [...filtered].sort((a, b) => a.size.localeCompare(b.size))
    } else {
      filtered = [...filtered].sort((a, b) => b.updated.localeCompare(a.updated))
    }

    return filtered
  }, [documents, searchQuery, categoryFilter, ownerFilter, statusFilter, sortBy])

  const storageUsedMb = useMemo(() => {
    return documents.reduce((sum, doc) => {
      const [value, unit] = doc.size.split(' ')
      const sizeValue = Number.parseFloat(value)
      if (Number.isNaN(sizeValue)) return sum
      if (unit?.toLowerCase() === 'kb') return sum + sizeValue / 1024
      if (unit?.toLowerCase() === 'gb') return sum + sizeValue * 1024
      return sum + sizeValue
    }, 0)
  }, [documents])
  const storageUsedGb = (storageUsedMb / 1024).toFixed(1)

  const folders = useMemo(() => {
    return folderList.map((folder) => ({
      name: folder,
      count: documents.filter((doc) => doc.category === folder).length,
    }))
  }, [documents, folderList])

  const expiringCount = documents.filter((doc) => doc.status === 'Expiring Soon').length
  const consentCoverage = documents.length ? '100%' : '--'
  const retentionStatus = documents.length ? 'Review' : 'Pending'

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 KB'
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${Math.max(1, Math.round(bytes / 1024))} KB`
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setFileError('')
    setUploadStatus('')
    if (!file) {
      setFileData(null)
      return
    }
    if (file.size > maxUploadBytes) {
      setFileError('File too large for browser storage. Use a file under 2 MB.')
      setFileData(null)
      event.target.value = ''
      return
    }
    const extension = file.name.split('.').pop() || ''
    const typeLabel = extension ? extension.toUpperCase() : file.type || 'FILE'
    const sizeLabel = formatFileSize(file.size)
    const baseName = file.name.replace(/\.[^/.]+$/, '')
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : ''
      setFileData({
        fileName: file.name,
        displayName: baseName || file.name,
        typeLabel,
        sizeLabel,
        sizeBytes: file.size,
        dataUrl,
      })
      setFormData((prev) => ({
        ...prev,
        name: prev.name || baseName || file.name,
        type: typeLabel,
      }))
    }
    reader.onerror = () => {
      setFileError('Could not read the selected file.')
      setFileData(null)
    }
    reader.readAsDataURL(file)
  }

  const handleCreateFolder = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!newFolderName.trim()) return
    setFolderList((prev) =>
      prev.includes(newFolderName.trim()) ? prev : [...prev, newFolderName.trim()]
    )
    setNewFolderName('')
    setShowFolderForm(false)
  }

  const handleClearFilters = () => {
    setCategoryFilter('Category')
    setOwnerFilter('Owner')
    setStatusFilter('Status')
    setSortBy('Last Updated')
    setSearchQuery('')
  }

  const handleUpload = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFileError('')
    if (!fileData) {
      setFileError('Select a file to upload.')
      return
    }
    if (!formData.name || !formData.category || !formData.owner) {
      return
    }
    const categoryValue = formData.category.trim()
    if (!categoryValue) return
    const nextId = documents.length ? Math.max(...documents.map((doc) => doc.id)) + 1 : 1
    const updated = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    })
    if (!folderList.includes(categoryValue)) {
      setFolderList((prev) => [...prev, categoryValue])
    }
    setDocuments((prev) => [
      {
        id: nextId,
        name: formData.name,
        category: categoryValue,
        owner: formData.owner,
        updated,
        type: fileData.typeLabel || formData.type,
        size: fileData.sizeLabel,
        status: formData.status,
        fileUrl: fileData.dataUrl,
        fileName: fileData.fileName,
      },
      ...prev,
    ])
    setFormData({
      name: '',
      category: '',
      owner: profile.name || '',
      type: 'PDF',
      status: 'Draft',
    })
    setFileData(null)
    setUploadStatus('Document uploaded.')
    setTimeout(() => setUploadStatus(''), 2000)
    setShowUploadForm(false)
  }

  const handleOpenDocument = (id: number) => {
    const selected = documents.find((doc) => doc.id === id)
    if (selected?.fileUrl) {
      window.open(selected.fileUrl, '_blank', 'noopener,noreferrer')
    }
    const nextStatus: Record<string, string> = {
      Draft: 'In Review',
      'In Review': 'Approved',
      'Expiring Soon': 'Approved',
      Approved: 'Approved',
    }
    const updated = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    })
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === id
          ? { ...doc, status: nextStatus[doc.status] || doc.status, updated }
          : doc
      )
    )
  }

  const handleRemoveDocument = (id: number) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id))
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary-500" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Documents Library
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Store, organize, and share school documents with clear ownership and status tracking.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setShowFolderForm((prev) => !prev)}
              className="btn-secondary flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {showFolderForm ? 'Close Folder' : 'New Folder'}
            </button>
            <button
              type="button"
              onClick={() => setShowUploadForm((prev) => !prev)}
              className="btn-primary flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {showUploadForm ? 'Close Upload' : 'Upload Document'}
            </button>
          </div>
        </div>
        {uploadStatus && (
          <p className="text-sm text-success-600 dark:text-success-400">
            {uploadStatus}
          </p>
        )}

        {showFolderForm && (
          <form onSubmit={handleCreateFolder} className="card">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <input
                type="text"
                value={newFolderName}
                onChange={(event) => setNewFolderName(event.target.value)}
                placeholder="Folder name"
                className="input-field flex-1"
                required
              />
              <div className="flex gap-3">
                <button type="button" className="btn-secondary" onClick={() => setShowFolderForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Folder
                </button>
              </div>
            </div>
          </form>
        )}

        {showUploadForm && (
          <form onSubmit={handleUpload} className="card">
            {fileError && (
              <p className="text-sm text-error-600 dark:text-error-400 mb-4">
                {fileError}
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="md:col-span-2 lg:col-span-3">
                <label className="text-sm text-gray-600 dark:text-gray-400">Select File *</label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="input-field mt-1"
                  required
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                />
                {fileData && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Selected: {fileData.fileName} ({fileData.sizeLabel})
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Max 2 MB for browser storage.
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Document Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                  className="input-field mt-1"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Category *</label>
                <input
                  value={formData.category}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, category: event.target.value }))
                  }
                  className="input-field mt-1"
                  required
                  list="document-categories"
                  placeholder="e.g. Policies"
                />
                <datalist id="document-categories">
                  {folderList.map((folder) => (
                    <option key={folder} value={folder} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Owner *</label>
                <input
                  type="text"
                  value={formData.owner}
                  onChange={(event) => setFormData((prev) => ({ ...prev, owner: event.target.value }))}
                  className="input-field mt-1"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">File Type</label>
                <input
                  type="text"
                  value={fileData?.typeLabel || formData.type}
                  onChange={(event) => setFormData((prev) => ({ ...prev, type: event.target.value }))}
                  className="input-field mt-1"
                  disabled={!!fileData}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Size</label>
                <input
                  type="text"
                  value={fileData?.sizeLabel || ''}
                  className="input-field mt-1"
                  placeholder="Auto-calculated"
                  disabled
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Status</label>
                <select
                  value={formData.status}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, status: event.target.value }))
                  }
                  className="input-field mt-1"
                >
                  <option>Draft</option>
                  <option>In Review</option>
                  <option>Approved</option>
                  <option>Expiring Soon</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button type="button" className="btn-secondary" onClick={() => setShowUploadForm(false)}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={!fileData || !formData.name || !formData.category || !formData.owner}
              >
                Add Document
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Total Documents</h3>
              <Folder className="h-5 w-5 text-primary-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{documents.length}</p>
            <p className="text-sm text-success-600 dark:text-success-400 mt-1">
              {documents.filter((doc) => doc.status === 'Approved').length} approved
            </p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Storage Used</h3>
              <HardDrive className="h-5 w-5 text-info-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{storageUsedGb} GB</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {Math.min(Math.round((Number(storageUsedGb) / 265) * 100), 100)}% of 265 GB allocated
            </p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Pending Reviews</h3>
              <Clock className="h-5 w-5 text-warning-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {documents.filter((doc) => doc.status !== 'Approved').length}
            </p>
            <p className="text-sm text-warning-600 dark:text-warning-400 mt-1">
              {documents.filter((doc) => doc.status === 'Expiring Soon').length} expiring soon
            </p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Shared Externally</h3>
              <Share2 className="h-5 w-5 text-success-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">0</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              No shares recorded yet
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <div className="card">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-4">
                <h3 className="text-lg font-semibold">Document Library</h3>
                <div className="relative w-full lg:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search documents..."
                    className="input-field pl-9"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4 mb-6">
                <select
                  className="input-field flex-1 min-w-[160px]"
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                >
                  <option>Category</option>
                  {folderList.map((folder) => (
                    <option key={folder}>{folder}</option>
                  ))}
                </select>
                <select
                  className="input-field flex-1 min-w-[160px]"
                  value={ownerFilter}
                  onChange={(event) => setOwnerFilter(event.target.value)}
                >
                  <option>Owner</option>
                  {ownerOptions.map((owner) => (
                    <option key={owner}>{owner}</option>
                  ))}
                </select>
                <select
                  className="input-field flex-1 min-w-[160px]"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option>Status</option>
                  <option>Approved</option>
                  <option>In Review</option>
                  <option>Draft</option>
                  <option>Expiring Soon</option>
                </select>
                <select
                  className="input-field flex-1 min-w-[160px]"
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                >
                  <option>Last Updated</option>
                  <option>Owner</option>
                  <option>Category</option>
                  <option>Size</option>
                </select>
                <button type="button" className="btn-secondary" onClick={handleClearFilters}>
                  Clear Filters
                </button>
              </div>

              <div className="table-container">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="table-header">Document</th>
                      <th className="table-header">Owner</th>
                      <th className="table-header">Updated</th>
                      <th className="table-header">Status</th>
                      <th className="table-header">Size</th>
                      <th className="table-header text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocuments.length === 0 ? (
                      <tr>
                        <td className="table-cell text-center text-gray-500 dark:text-gray-400" colSpan={6}>
                          No documents uploaded yet.
                        </td>
                      </tr>
                    ) : (
                      filteredDocuments.map((doc) => (
                        <tr
                          key={doc.id}
                          className="border-b border-slate-200 dark:border-slate-700"
                        >
                          <td className="table-cell">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {doc.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {doc.category} - {doc.type}
                            </div>
                          </td>
                          <td className="table-cell">{doc.owner}</td>
                          <td className="table-cell">{doc.updated}</td>
                          <td className="table-cell">
                            <span
                              className={`status-badge ${documentStatusStyles[doc.status]}`}
                            >
                              {doc.status}
                            </span>
                          </td>
                          <td className="table-cell">{doc.size}</td>
                          <td className="table-cell text-right">
                            <div className="flex items-center justify-end gap-3">
                              <button
                                type="button"
                                onClick={() => handleOpenDocument(doc.id)}
                                className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                              >
                                Open
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveDocument(doc.id)}
                                className="text-sm text-error-600 dark:text-error-400 hover:underline"
                              >
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Recent Requests & Approvals</h3>
                <button className="btn-secondary text-sm px-3 py-1.5">
                  View Queue
                </button>
              </div>
              <div className="space-y-4">
                {requests.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No pending requests yet.
                  </p>
                ) : (
                  requests.map((request) => (
                    <div
                      key={request.title}
                      className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {request.title}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {request.requester}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Due: {request.due}
                          </p>
                        </div>
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-secondary-100 text-secondary-700 dark:bg-secondary-800 dark:text-secondary-200">
                          {request.status}
                        </span>
                      </div>
                      <button className="w-full mt-3 text-sm btn-primary py-2">
                        Review Request
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
                <h3 className="text-lg font-semibold">Folders & Categories</h3>
                <Folder className="h-5 w-5 text-primary-500" />
              </div>
              <div className="space-y-3">
                {folders.map((folder) => (
                  <div
                    key={folder.name}
                    className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {folder.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {folder.count} documents
                      </p>
                    </div>
                    <button className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                      Open
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Compliance & Storage</h3>
                <ShieldCheck className="h-5 w-5 text-success-500" />
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Storage usage
                </p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {Math.min(Math.round((Number(storageUsedGb) / 265) * 100), 100)}%
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {storageUsedGb} GB / 265 GB
                  </p>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-3">
                  <div
                    className="bg-info-500 h-2 rounded-full"
                    style={{
                      width: `${Math.min(Math.round((Number(storageUsedGb) / 265) * 100), 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Consent forms coverage
                  </span>
                  <span className="text-sm font-medium text-success-600 dark:text-success-400">
                    {consentCoverage}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Policies reviewed
                  </span>
                  <span className="text-sm font-medium text-warning-600 dark:text-warning-400">
                    {expiringCount} due
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Data retention checks
                  </span>
                  <span className="text-sm font-medium text-success-600 dark:text-success-400">
                    {retentionStatus}
                  </span>
                </div>
              </div>
              <button className="w-full mt-4 text-sm btn-secondary py-2">
                Review Compliance
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
