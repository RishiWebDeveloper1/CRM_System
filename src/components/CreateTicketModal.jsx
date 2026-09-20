import { useState } from 'react'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'

const PRIORITIES = ['Low', 'Medium', 'High']

export default function CreateTicketModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    subject: '',
    description: '',
    priority: 'Medium',
  })
  const [loading, setLoading] = useState(false)

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/tickets', form)
      toast.success(`Ticket ${data.ticket_id} created!`)
      onCreated()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create ticket')
    } finally {
      setLoading(false)
    }
  }

  return (
    // backdrop
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="card w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">New support ticket</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Customer name</label>
              <input name="customer_name" className="input" placeholder="Jane Doe" value={form.customer_name} onChange={handleChange} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Customer email</label>
              <input name="customer_email" type="email" className="input" placeholder="jane@example.com" value={form.customer_email} onChange={handleChange} required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Subject</label>
            <input name="subject" className="input" placeholder="Brief description of the issue" value={form.subject} onChange={handleChange} required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
            <textarea
              name="description"
              className="input min-h-[90px] resize-y"
              placeholder="Full details of the issue…"
              value={form.description}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Priority</label>
            <div className="flex gap-2">
              {PRIORITIES.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, priority: p }))}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    form.priority === p
                      ? p === 'High' ? 'bg-red-500/20 border-red-500/50 text-red-400'
                        : p === 'Medium' ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                        : 'bg-gray-600/40 border-gray-500/50 text-gray-300'
                      : 'border-gray-700 text-gray-500 hover:border-gray-600'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? 'Creating…' : 'Create ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
