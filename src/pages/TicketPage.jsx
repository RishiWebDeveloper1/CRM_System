import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Mail, Hash, Clock, SendHorizonal } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'
import { StatusBadge, PriorityBadge } from '../components/Badges'

const STATUSES = ['Open', 'In Progress', 'Closed']

export default function TicketPage() {
  const { ticket_id } = useParams()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState(null)
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [noteText, setNoteText] = useState('')
  const [saving, setSaving] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  async function fetchTicket() {
    setLoading(true)
    try {
      const { data } = await api.get(`/tickets/${ticket_id}`)
      setTicket(data)
      setNotes(data.notes || [])
    } catch {
      toast.error('Ticket not found')
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTicket() }, [ticket_id])

  async function handleStatusChange(newStatus) {
    if (newStatus === ticket.status) return
    setUpdatingStatus(true)
    try {
      await api.put(`/tickets/${ticket_id}`, { status: newStatus })
      setTicket(t => ({ ...t, status: newStatus }))
      toast.success(`Status updated to ${newStatus}`)
    } catch {
      toast.error('Failed to update status')
    } finally {
      setUpdatingStatus(false)
    }
  }

  async function handleAddNote(e) {
    e.preventDefault()
    if (!noteText.trim()) return
    setSaving(true)
    try {
      await api.put(`/tickets/${ticket_id}`, { note_text: noteText })
      const { data } = await api.get(`/tickets/${ticket_id}`)
      setNotes(data.notes || [])
      setNoteText('')
      toast.success('Note added')
    } catch {
      toast.error('Failed to add note')
    } finally {
      setSaving(false)
    }
  }

  function formatDateTime(d) {
    return new Date(d).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!ticket) return null

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Back */}
        <button onClick={() => navigate('/')} className="btn-ghost mb-6 pl-0">
          <ArrowLeft size={16} />
          Back to tickets
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main ticket detail */}
          <div className="lg:col-span-2 space-y-4">
            <div className="card p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono text-brand-500 font-medium">{ticket.ticket_id}</span>
                    <StatusBadge status={ticket.status} />
                    <PriorityBadge priority={ticket.priority} />
                  </div>
                  <h1 className="text-xl font-semibold text-white">{ticket.subject}</h1>
                </div>
              </div>

              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{ticket.description}</p>

              <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-gray-800">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <User size={13} className="text-gray-600" />
                  <span className="text-white">{ticket.customer_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Mail size={13} className="text-gray-600" />
                  <a href={`mailto:${ticket.customer_email}`} className="text-brand-500 hover:underline truncate">
                    {ticket.customer_email}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Hash size={13} className="text-gray-600" />
                  <span>Created {formatDateTime(ticket.created_at)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Clock size={13} className="text-gray-600" />
                  <span>Updated {formatDateTime(ticket.updated_at)}</span>
                </div>
              </div>
            </div>

            {/* Notes thread */}
            <div className="card p-6">
              <h2 className="text-sm font-semibold text-white mb-4">
                Activity {notes.length > 0 && <span className="text-gray-500 font-normal">({notes.length})</span>}
              </h2>

              {notes.length === 0 ? (
                <p className="text-sm text-gray-600 italic">No notes yet. Add one below.</p>
              ) : (
                <div className="space-y-3 mb-4">
                  {notes.map(note => (
                    <div key={note._id} className="bg-gray-800/50 rounded-lg p-3.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-gray-300">{note.author || 'Agent'}</span>
                        <span className="text-xs text-gray-600">{formatDateTime(note.created_at)}</span>
                      </div>
                      <p className="text-sm text-gray-200 leading-relaxed">{note.note_text}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add note */}
              <form onSubmit={handleAddNote} className="flex gap-2 mt-4 pt-4 border-t border-gray-800">
                <input
                  className="input flex-1"
                  placeholder="Add a note or update…"
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                />
                <button type="submit" disabled={saving || !noteText.trim()} className="btn-primary px-3">
                  <SendHorizonal size={15} />
                </button>
              </form>
            </div>
          </div>

          {/* Right sidebar — status update */}
          <div className="space-y-4">
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Update Status</h3>
              <div className="space-y-2">
                {STATUSES.map(s => (
                  <button
                    key={s}
                    disabled={updatingStatus}
                    onClick={() => handleStatusChange(s)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                      ticket.status === s
                        ? s === 'Open' ? 'bg-blue-500/20 border-blue-500/40 text-blue-400'
                          : s === 'In Progress' ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400'
                          : 'bg-green-500/20 border-green-500/40 text-green-400'
                        : 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-200'
                    }`}
                  >
                    {s === ticket.status ? '✓ ' : ''}{s}
                  </button>
                ))}
              </div>
            </div>

            <div className="card p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Details</h3>
              <dl className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Priority</dt>
                  <dd><PriorityBadge priority={ticket.priority} /></dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Status</dt>
                  <dd><StatusBadge status={ticket.status} /></dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Notes</dt>
                  <dd className="text-white">{notes.length}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
