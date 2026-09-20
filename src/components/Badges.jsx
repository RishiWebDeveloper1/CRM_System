// Status badge colors
export function StatusBadge({ status }) {
  const styles = {
    'Open':        'bg-blue-500/15 text-blue-400 border border-blue-500/30',
    'In Progress': 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
    'Closed':      'bg-green-500/15 text-green-400 border border-green-500/30',
  }
  return (
    <span className={`badge ${styles[status] || 'bg-gray-700 text-gray-300'}`}>
      {status}
    </span>
  )
}

// Priority badge colors
export function PriorityBadge({ priority }) {
  const styles = {
    'High':   'bg-red-500/15 text-red-400',
    'Medium': 'bg-orange-500/15 text-orange-400',
    'Low':    'bg-gray-500/15 text-gray-400',
  }
  return (
    <span className={`badge ${styles[priority] || 'bg-gray-700 text-gray-400'}`}>
      {priority}
    </span>
  )
}
