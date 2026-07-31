export function formatDate(value) {
  if (!value) return ''
  const d = new Date(value)
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatDateTime(value) {
  if (!value) return ''
  const d = new Date(value)
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatFileSize(bytes) {
  if (bytes === null || bytes === undefined) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let size = Number(bytes)
  let i = 0
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024
    i += 1
  }
  return `${size.toFixed(size >= 10 || i === 0 ? 0 : 1)} ${units[i]}`
}

export function formatDuration(seconds) {
  const total = Math.round(Number(seconds) || 0)
  const mins = Math.floor(total / 60)
  const secs = total % 60
  return `${mins}:${String(secs).padStart(2, '0')}`
}

export function initials(firstName, lastName) {
  const a = (firstName || '').trim()[0] || ''
  const b = (lastName || '').trim()[0] || ''
  return (a + b).toUpperCase() || '?'
}

export function roleLabel(role) {
  const labels = {
    nurse: 'Nurse / User',
    shared_access: 'Shared Access User',
    hospital_admin: 'Hospital Admin',
    higher_authority: 'Higher Authority',
  }
  return labels[role] || role
}
