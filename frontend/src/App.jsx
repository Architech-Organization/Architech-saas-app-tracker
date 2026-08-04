import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import SoftwareList from './pages/SoftwareList'
import Renewals from './pages/Renewals'
import Spend from './pages/Spend'

const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } })

const Stub = ({ title }) => <div style={{ padding: '28px 32px', color: '#6b6b8a', fontSize: 14 }}><h1 style={{ fontSize: 20, fontWeight: 600, color: '#fff', marginBottom: 8 }}>{title}</h1>Coming soon.</div>

function Protected({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ padding: 40, color: '#6b6b8a', fontFamily: 'system-ui' }}>Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Protected><Layout /></Protected>}>
              <Route index element={<Dashboard />} />
              <Route path="software" element={<SoftwareList />} />
              <Route path="renewals" element={<Renewals />} />
              <Route path="spend" element={<Spend />} />
              <Route path="users" element={<Stub title="Users" />} />
              <Route path="notifications" element={<Stub title="Notifications" />} />
              <Route path="audit" element={<Stub title="Audit Log" />} />
              <Route path="profile" element={<Stub title="My Profile" />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
