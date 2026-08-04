import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

const ROLES = ['viewer', 'editor', 'admin']

const roleColor = r => ({
  admin: { bg: 'rgba(124,92,252,0.15)', color: '#a78bfa' },
  editor: { bg: 'rgba(6,182,212,0.15)', color: '#67e8f9' },
  viewer: { bg: 'rgba(100,116,139,0.15)', color: '#94a3b8' },
}[r] || {})

export default function Users() {
  const { user: me } = useAuth()
  const qc = useQueryClient()
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('viewer')
  const [inviteLink, setInviteLink] = useState(null)
  const [error, setError] = useState('')

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users/').then(r => r.data),
  })

  const { data: invites = [] } = useQuery({
    queryKey: ['invites'],
    queryFn: () => api.get('/users/invites').then(r => r.data),
  })

  const roleMut = useMutation({
    mutationFn: ({ id, role }) => api.patch(`/users/${id}/role?role=${role}`),
    onSuccess: () => qc.invalidateQueries(['users']),
  })

  const deleteMut = useMutation({
    mutationFn: id => api.delete(`/users/${id}`),
    onSuccess: () => qc.invalidateQueries(['users']),
  })

  const inviteMut = useMutation({
    mutationFn: data => api.post('/users/invite', data),
    onSuccess: res => {
      const base = window.location.origin
      setInviteLink(`${base}/register?token=${res.data.invite_token}`)
      setInviteEmail('')
      qc.invalidateQueries(['invites'])
    },
    onError: err => setError(err.response?.data?.detail || 'Failed to send invite'),
  })

  const handleInvite = e => {
    e.preventDefault()
    setError('')
    setInviteLink(null)
    inviteMut.mutate({ email: inviteEmail, role: inviteRole })
  }

  return (
    <div style={{ padding: '28px 32px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 3 }}>Users</h1>
        <p style={{ fontSize: 13, color: '#6b6b8a' }}>Manage team access and roles</p>
      </div>

      {/* Invite form */}
      <div style={{ background: '#13131f', border: '1px solid #1e1e30', borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e2f0', marginBottom: 14 }}>Invite a team member</div>
        {error && <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#f87171', marginBottom: 12 }}>{error}</div>}
        {inviteLink && (
          <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: '#34d399', marginBottom: 6 }}>Invite link generated — share this with your team member:</div>
            <div style={{ fontSize: 12, color: '#6b6b8a', wordBreak: 'break-all', fontFamily: 'monospace', background: '#0d0d14', padding: '6px 10px', borderRadius: 6 }}>{inviteLink}</div>
            <button onClick={() => navigator.clipboard.writeText(inviteLink)} style={{ marginTop: 8, fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', cursor: 'pointer' }}>Copy link</button>
          </div>
        )}
        <form onSubmit={handleInvite} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#4a4a6a', letterSpacing: '0.6px', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Email</label>
            <input style={s.input} type="email" required placeholder="colleague@architech.ca" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
          </div>
          <div style={{ width: 140 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#4a4a6a', letterSpacing: '0.6px', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Role</label>
            <select style={s.input} value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <button type="submit" style={s.btnPrimary} disabled={inviteMut.isPending}>
            {inviteMut.isPending ? 'Sending…' : 'Send invite'}
          </button>
        </form>
        <div style={{ marginTop: 10, fontSize: 12, color: '#4a4a6a' }}>
          Viewer — read only · Editor — can add/edit licenses · Admin — full access
        </div>
      </div>

      {/* Users table */}
      <div style={{ background: '#13131f', border: '1px solid #1e1e30', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ padding: '12px 18px', borderBottom: '1px solid #1e1e30', fontSize: 13, fontWeight: 600, color: '#e2e2f0' }}>
          Team members ({users.length})
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>{['Name', 'Email', 'Role', 'Joined', ''].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td style={s.td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #7c5cfc, #5b8af5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {u.name?.[0]?.toUpperCase()}
                    </div>
                    <span style={{ color: '#e2e2f0', fontWeight: 500 }}>{u.name} {u.id === me?.id && <span style={{ fontSize: 10, color: '#6b6b8a' }}>(you)</span>}</span>
                  </div>
                </td>
                <td style={s.td}><span style={{ color: '#9090aa' }}>{u.email}</span></td>
                <td style={s.td}>
                  {u.id === me?.id ? (
                    <span style={{ ...s.rolePill, ...roleColor(u.role) }}>{u.role}</span>
                  ) : (
                    <select style={{ ...s.roleSelect, ...roleColor(u.role) }} value={u.role}
                      onChange={e => roleMut.mutate({ id: u.id, role: e.target.value })}>
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  )}
                </td>
                <td style={s.td}><span style={{ color: '#6b6b8a', fontSize: 12 }}>{new Date(u.created_at).toLocaleDateString()}</span></td>
                <td style={s.td}>
                  {u.id !== me?.id && (
                    <button style={{ ...s.dangerBtn }} onClick={() => { if (confirm(`Remove ${u.name}?`)) deleteMut.mutate(u.id) }}>Remove</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pending invites */}
      {invites.length > 0 && (
        <div style={{ background: '#13131f', border: '1px solid #1e1e30', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid #1e1e30', fontSize: 13, fontWeight: 600, color: '#e2e2f0' }}>
            Pending invites ({invites.length})
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr>{['Email', 'Role', 'Expires'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
            <tbody>
              {invites.map(inv => (
                <tr key={inv.token}>
                  <td style={s.td}><span style={{ color: '#9090aa' }}>{inv.email}</span></td>
                  <td style={s.td}><span style={{ ...s.rolePill, ...roleColor(inv.role) }}>{inv.role}</span></td>
                  <td style={s.td}><span style={{ color: '#6b6b8a', fontSize: 12 }}>{new Date(inv.expires_at).toLocaleDateString()}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const s = {
  th: { textAlign: 'left', padding: '9px 16px', fontSize: 10, color: '#3a3a52', background: '#0d0d14', borderBottom: '1px solid #1a1a28', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700 },
  td: { padding: '12px 16px', borderBottom: '1px solid #1a1a28', verticalAlign: 'middle' },
  input: { width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #1e1e30', background: '#0d0d14', color: '#e2e2f0', fontSize: 13, outline: 'none', fontFamily: 'inherit' },
  btnPrimary: { padding: '9px 18px', borderRadius: 8, background: 'linear-gradient(135deg, #7c5cfc, #6b4ef5)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' },
  dangerBtn: { padding: '4px 10px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' },
  rolePill: { display: 'inline-block', padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600 },
  roleSelect: { padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit', outline: 'none' },
}
