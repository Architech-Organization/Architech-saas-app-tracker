import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import SoftwareList from './pages/SoftwareList'
import Renewals from './pages/Renewals'
import Spend from './pages/Spend'
import Users from './pages/Users'
import Profile from './pages/Profile'

const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } })

function Protected({ children, adminOnly }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ padding: 40, color: '#6b6b8a', fontFamily: 'system-ui' }}>Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Login />} />
            <Route path="/" element={<Protected><Layout /></Protected>}>
              <Route index element={<Dashboard />} />
              <Route path="software" element={<SoftwareList />} />
              <Route path="renewals" element={<Renewals />} />
              <Route path="spend" element={<Spend />} />
              <Route path="users" element={<Protected adminOnly><Users /></Protected>} />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
