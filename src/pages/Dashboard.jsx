import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, SlidersHorizontal, RefreshCw, Inbox } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'
import Sidebar from '../components/Sidebar'
import CreateTicketModal from '../components/CreateTicketModal'
import { StatusBadge, PriorityBadge } from '../components/Badges'

const STATUSES = ['All', 'Open', 'In Progress', 'Closed']

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function Dashboard() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All')
  const [showCreate, setShowCreate] = useState(false)
  const debouncedSearch = useDebounce(search, 300)
  const navigate = useNavigate()

  // stats
  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'Open').length,
    inProgress: tickets.filter(t => t.status === 'In Progress').length,
    closed: tickets.filter(t => t.status === 'Closed').length,
  }

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (status !== 'All') params.status = status
      if (debouncedSearch) params.search = debouncedSearch
      const { data } = await api.get('/tickets', { params })
      setTickets(data)
    } catch {
      toast.error('Failed to load tickets')
    } finally {
      setLoading(false)
    }
  }, [status, debouncedSearch])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  function formatDate(d) {
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar onNewTicket={() => setShowCreate(true)} />

      <main className="flex-1 overflow-auto p-6 bg-gray-950">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Tickets</h1>
          <p className="text-gray-400 text-sm mt-0.5">Manage and resolve customer support requests</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total', value: stats.total, color: 'text-white' },
            { label: 'Open', value: stats.open, color: 'text-blue-400' },
            { label: 'In Progress', value: stats.inProgress, color: 'text-yellow-400' },
            { label: 'Closed', value: stats.closed, color: 'text-green-400' },
          ].map(s => (
            <div key={s.label} className="card px-4 py-3">
              <p className="text-xs text-gray-500 mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              className="input pl-9"
              placeholder="Search by name, email, ID, subject…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1.5 bg-gray-900 border border-gray-700 rounded-lg p-1">
            <SlidersHorizontal size={13} className="text-gray-500 ml-1.5" />
            {STATUSES.map(s => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  status === s
                    ? 'bg-brand-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <button onClick={fetchTickets} className="btn-ghost px-3" title="Refresh">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Ticket table */}
        <div className="card overflow-hidden">
          {loading ? (
            // skeleton rows
            <div className="divide-y divide-gray-800">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="px-4 py-3.5 flex gap-4 animate-pulse">
                  <div className="h-4 bg-gray-800 rounded w-20" />
                  <div className="h-4 bg-gray-800 rounded w-32" />
                  <div className="h-4 bg-gray-800 rounded flex-1" />
                  <div className="h-4 bg-gray-800 rounded w-16" />
                </div>
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Inbox size={40} className="text-gray-700 mb-3" />
              <p className="text-gray-400 font-medium">No tickets found</p>
              <p className="text-gray-600 text-sm mt-1">
                {search || status !== 'All' ? 'Try adjusting your filters' : 'Create your first ticket to get started'}
              </p>
            </div>
          ) : (
            <>
              {/* Table header */}
              <div className="px-4 py-2.5 grid grid-cols-12 gap-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-800">
                <span className="col-span-2">ID</span>
                <span className="col-span-3">Customer</span>
                <span className="col-span-3">Subject</span>
                <span className="col-span-2">Priority</span>
                <span className="col-span-1">Status</span>
                <span className="col-span-1 text-right">Date</span>
              </div>
              {/* Rows */}
              <div className="divide-y divide-gray-800/60">
                {tickets.map(ticket => (
                  <div
                    key={ticket._id}
                    onClick={() => navigate(`/ticket/${ticket.ticket_id}`)}
                    className="px-4 py-3.5 grid grid-cols-12 gap-3 items-center hover:bg-gray-800/40 cursor-pointer transition-colors group"
                  >
                    <span className="col-span-2 text-xs font-mono text-brand-500 group-hover:text-brand-400 font-medium">
                      {ticket.ticket_id}
                    </span>
                    <div className="col-span-3 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{ticket.customer_name}</p>
                      <p className="text-xs text-gray-500 truncate">{ticket.customer_email}</p>
                    </div>
                    <p className="col-span-3 text-sm text-gray-300 truncate">{ticket.subject}</p>
                    <span className="col-span-2"><PriorityBadge priority={ticket.priority} /></span>
                    <span className="col-span-1"><StatusBadge status={ticket.status} /></span>
                    <span className="col-span-1 text-xs text-gray-500 text-right whitespace-nowrap">
                      {formatDate(ticket.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <p className="text-xs text-gray-600 mt-3 text-right">
          {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
        </p>
      </main>

      {showCreate && (
        <CreateTicketModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); fetchTickets() }}
        />
      )}
    </div>
  )
}
