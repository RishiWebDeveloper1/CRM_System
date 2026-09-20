import { NavLink, useNavigate } from 'react-router-dom'
import { Ticket, LayoutDashboard, LogOut, Plus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Sidebar({ onNewTicket }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    toast.success('Logged out')
    navigate('/login')
  }

  return (
    <aside className="w-56 shrink-0 h-screen sticky top-0 bg-gray-900 border-r border-gray-800 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-800">
        <div className="p-1.5 bg-brand-500 rounded-lg">
          <Ticket size={18} className="text-white" />
        </div>
        <span className="font-bold text-white tracking-tight">SupportDesk</span>
      </div>

      {/* New ticket button */}
      <div className="px-4 py-4">
        <button onClick={onNewTicket} className="btn-primary w-full justify-center">
          <Plus size={16} />
          New Ticket
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive ? 'bg-brand-500/15 text-brand-500' : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`
          }
        >
          <LayoutDashboard size={16} />
          Dashboard
        </NavLink>
      </nav>

      {/* User + logout */}
      <div className="px-4 py-4 border-t border-gray-800">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-500 text-xs font-bold">
            {user?.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-white truncate">{user?.name || 'Agent'}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="btn-ghost w-full justify-start text-xs gap-2 px-2">
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
