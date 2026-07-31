import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { listMyRecords, listSharedWithMe } from '../../services/procedureService'
import ProcedureList from './ProcedureList'
import Loading from '../Common/Loading'
import { roleLabel } from '../../utils/formatters'

export default function Dashboard() {
  const { profile, user } = useAuth()
  const [myRecords, setMyRecords] = useState([])
  const [shared, setShared] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([listMyRecords(user.id), listSharedWithMe(user.id)])
      .then(([mine, sharedWithMe]) => {
        setMyRecords(mine)
        setShared(sharedWithMe)
      })
      .finally(() => setLoading(false))
  }, [user])

  if (loading) return <Loading fullScreen label="Loading your dashboard…" />

  return (
    <div className="space-y-8 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Welcome back{profile?.first_name ? `, ${profile.first_name}` : ''}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {profile?.hospitals?.name || 'No hospital set'} · {roleLabel(profile?.role)}
          </p>
        </div>
        <Link
          to="/procedures/new"
          className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          + New Procedure
        </Link>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-medium text-gray-900">Your procedures</h2>
        <ProcedureList records={myRecords} emptyLabel="You haven't created any procedures yet." />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-gray-900">Shared with you</h2>
        <ProcedureList records={shared} emptyLabel="No procedures have been shared with you." />
      </section>
    </div>
  )
}
