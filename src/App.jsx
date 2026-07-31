import { useState } from 'react'
import { Navigate, Route, Routes, Outlet } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Login from './components/Auth/Login'
import Register from './components/Auth/Register'
import OtpVerification from './components/Auth/OtpVerification'
import Dashboard from './components/Dashboard/Dashboard'
import SurgicalForm from './components/SurgicalForm/SurgicalForm'
import Header from './components/Common/Header'
import Sidebar from './components/Common/Sidebar'
import Loading from './components/Common/Loading'

function ProtectedLayout() {
  const { isAuthenticated, loading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (loading) return <Loading fullScreen label="Loading OrnGlobal…" />
  if (!isAuthenticated) return <Navigate to="/login" replace />

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onToggleSidebar={() => setSidebarOpen((v) => !v)} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function PublicOnlyRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <Loading fullScreen />
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <Register />
          </PublicOnlyRoute>
        }
      />
      <Route path="/verify-otp" element={<OtpVerification />} />

      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/procedures/new" element={<SurgicalForm />} />
        <Route path="/procedures/:id" element={<SurgicalForm />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
