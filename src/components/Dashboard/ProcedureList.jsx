import { Link } from 'react-router-dom'
import { formatDateTime } from '../../utils/formatters'

const STATUS_STYLES = {
  draft: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-amber-100 text-amber-800',
  completed: 'bg-green-100 text-green-800',
}

export default function ProcedureList({ records, emptyLabel = 'No procedures yet.' }) {
  if (!records || records.length === 0) {
    return <p className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">{emptyLabel}</p>
  }

  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {records.map((item) => {
        const record = item.surgical_records || item
        const permissionLevel = item.permission_level
        return (
          <li key={record.id}>
            <Link
              to={`/procedures/${record.id}`}
              className="block h-full rounded-xl border border-gray-200 bg-white p-4 transition hover:border-brand-300 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium text-gray-900">
                  {record.surgical_procedures?.name || 'Untitled procedure'}
                </h3>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    STATUS_STYLES[record.status] || STATUS_STYLES.draft
                  }`}
                >
                  {record.status?.replace('_', ' ') || 'draft'}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {record.surgical_specialties?.name || 'No specialty'} · {record.surgeons?.name || 'No surgeon'}
              </p>
              {record.hospitals?.name && (
                <p className="mt-1 text-xs text-gray-400">{record.hospitals.name}</p>
              )}
              <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                <span>Updated {formatDateTime(record.updated_at)}</span>
                {permissionLevel && (
                  <span className="rounded bg-brand-50 px-2 py-0.5 font-medium text-brand-700">
                    {permissionLevel === 'write' ? 'Can edit' : 'Read only'}
                  </span>
                )}
              </div>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
