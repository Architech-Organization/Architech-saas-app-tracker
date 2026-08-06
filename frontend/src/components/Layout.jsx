import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAutoLogout } from '../hooks/useAutoLogout'

const NAV = [
  { section: 'OVERVIEW', items: [
    { to: '/', label: 'Dashboard', icon: GridIcon, end: true },
  ]},
  { section: 'LICENSES', items: [
    { to: '/software', label: 'All Licenses', icon: FileIcon },
    { to: '/renewals', label: 'Renewals', icon: CalendarIcon },
  ]},
  { section: 'ADMIN', items: [
    { to: '/users', label: 'Users', icon: UsersIcon },
    { to: '/notifications', label: 'Notifications', icon: BellIcon },
    { to: '/audit', label: 'Audit Log', icon: ShieldIcon },
  ]},
  { section: 'ACCOUNT', items: [
    { to: '/profile', label: 'My Profile', icon: PersonIcon },
  ]},
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  useAutoLogout()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div style={s.shell}>
      <aside style={s.sidebar}>
        <div style={s.logoArea}>
          <div style={s.logoIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div>
            <div style={s.logoName}>LicenseVault</div>
            <div style={s.logoSub}>LICENSE MGMT</div>
          </div>
        </div>

        <nav style={s.nav}>
          {NAV.map(({ section, items }) => (
            <div key={section} style={s.navSection}>
              <div style={s.sectionLabel}>{section}</div>
              {items.map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end}
                  style={({ isActive }) => ({ ...s.navItem, ...(isActive ? s.navActive : {}) })}>
                  {({ isActive }) => <><Icon active={isActive} /><span>{label}</span></>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div style={s.userArea} onClick={handleLogout} title="Sign out">
          <div style={s.userAvatar}>{user?.name?.[0]?.toUpperCase()}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={s.userName}>{user?.name}</div>
            <div style={s.userEmail}>{user?.email}</div>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b6b8a" strokeWidth="2" strokeLinecap="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </div>
      </aside>

      <main style={s.main}><Outlet /></main>
    </div>
  )
}

// ── Icons (exact originals) ────────────────────────────────────────────────
function GridIcon({ active }) {
  const c = active ? '#7c5cfc' : '#6b6b8a'
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
}
function FileIcon({ active }) {
  const c = active ? '#7c5cfc' : '#6b6b8a'
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
}
function CalendarIcon({ active }) {
  const c = active ? '#7c5cfc' : '#6b6b8a'
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
}
function UsersIcon({ active }) {
  const c = active ? '#7c5cfc' : '#6b6b8a'
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
}
function BellIcon({ active }) {
  const c = active ? '#7c5cfc' : '#6b6b8a'
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
}
function ShieldIcon({ active }) {
  const c = active ? '#7c5cfc' : '#6b6b8a'
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
}
function PersonIcon({ active }) {
  const c = active ? '#7c5cfc' : '#6b6b8a'
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
}

const s = {
  shell: { display: 'flex', height: '100vh', overflow: 'hidden', background: '#0d0d14' },
  sidebar: { width: 200, display: 'flex', flexDirection: 'column', background: '#0d0d14', borderRight: '1px solid #1a1a28', flexShrink: 0 },
  logoArea: { display: 'flex', alignItems: 'center', gap: 10, padding: '18px 16px 16px', borderBottom: '1px solid #1a1a28' },
  logoIcon: { width: 34, height: 34, borderRadius: 8, background: 'linear-gradient(135deg, #7c5cfc, #5b8af5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  logoName: { fontSize: 13, fontWeight: 700, color: '#fff' },
  logoSub: { fontSize: 9, color: '#6b6b8a', letterSpacing: '0.8px', fontWeight: 600 },
  nav: { flex: 1, padding: '8px', overflowY: 'auto' },
  navSection: { marginBottom: 8 },
  sectionLabel: { fontSize: 10, fontWeight: 700, color: '#3a3a52', letterSpacing: '0.8px', padding: '10px 8px 4px' },
  navItem: { display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px', borderRadius: 7, fontSize: 13, color: '#9090aa', textDecoration: 'none', marginBottom: 1, transition: 'all 0.1s' },
  navActive: { background: '#1a1440', color: '#c4b5fd' },
  userArea: { display: 'flex', alignItems: 'center', gap: 9, padding: '12px 14px', borderTop: '1px solid #1a1a28', cursor: 'pointer' },
  userAvatar: { width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #7c5cfc, #5b8af5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 },
  userName: { fontSize: 12, fontWeight: 600, color: '#c4c4d4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  userEmail: { fontSize: 10, color: '#6b6b8a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  main: { flex: 1, overflowY: 'auto', background: '#0d0d14' },
}
