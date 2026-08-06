import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

const ROLES = ['viewer', 'editor', 'admin']
const ALLOWED_DOMAIN = 'architech.ca'

const roleColor = r => ({
  admin: { bg: 'rgba(124,92,252,0.15)', color: '#a78bfa' },
  editor: { bg: 'rgba(6,182,212,0.15)', color: '#67e8f9' },
  viewer: { bg: 'rgba(100,116,139,0.15)', color: '#94a3b8' },
}[r] || {})

export default function Users() {
  const { user: me } = useAuth()
  const qc = useQueryClient()
  const [form, setForm] = useState({ name: '', email: '', role: 'viewer', password: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users/').then(r => r.data),
  })

  const { data: invites = [], refetch: refetchInvites } = useQuery({
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

  const deleteInviteMut = useMutation({
    mutationFn: token => api.delete(`/users/invites/${token}`),
    onSuccess: () => refetchInvites(),
  })

  const resendInviteMut = useMutation({
    mutationFn: token => api.post(`/users/invites/${token}/resend`),
    onSuccess: (res) => {
      setSuccess(`Invite link: ${window.location.origin}/register?token=${res.data.token}`)
    },
  })

  const createUserMut = useMutation({
    mutationFn: data => api.post('/users/create', data),
    onSuccess: () => {
      qc.invalidateQueries(['users'])
      setForm({ name: '', email: '', role: 'viewer', password: '' })
      setShowAdd(false)
      setSuccess('User created successfully!')
      setTimeout(() => setSuccess(''), 4000)
    },
    onError: err => setError(err.response?.data?.detail || 'Failed to create user'),
  })

  const handleCreate = e => {
    e.preventDefault()
    setError(''); setSuccess('')
    const domain = form.email.split('@')[1]
    if (domain !== ALLOWED_DOMAIN) {
      setError(`Only @${ALLOWED_DOMAIN} email addresses are allowed.`)
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    createUserMut.mutate(form)
  }

  return (
    <div style={{ padding: '28px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 3 }}>Users</h1>
          <p style={{ fontSize: 13, color: '#6b6b8a' }}>Manage team access · Only @{ALLOWED_DOMAIN} emails allowed</p>
        </div>
        <button style={s.btnPrimary} onClick={() => { setShowAdd(true); setError(''); setSuccess('') }}>+ Add User</button>
      </div>

      {error && <div style={s.errorBox}>{error}</div>}
      {success && <div style={s.successBox}>{success}</div>}

      {/* Add User Modal */}
      {showAdd && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <span style={s.modalTitle}>Add User</span>
              <button style={s.closeBtn} onClick={() => setShowAdd(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div style={s.modalBody}>
                {error && <div style={s.errorBox}>{error}</div>}
                <div style={s.row}>
                  <div>
                    <label style={s.label}>FULL NAME *</label>
                    <input style={s.input} placeholder="Jane Smith" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                  </div>
                  <div>
                    <label style={s.label}>EMAIL *</label>
                    <input style={s.input} type="email" placeholder="jane@architech.ca" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                  </div>
                </div>
                <div style={s.row}>
                  <div>
                    <label style={s.label}>ROLE</label>
                    <select style={s.input} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label style={s.label}>TEMPORARY PASSWORD *</label>
                    <input style={s.input} type="password" placeholder="Min. 6 characters" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={6} />
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#6b6b8a', background: '#0d0d14', borderRadius: 6, padding: '8px 12px' }}>
                  The user can log in immediately with these credentials and change their password from their profile.
                </div>
              </div>
              <div style={s.modalFooter}>
                <button type="button" style={s.btnSecondary} onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" style={s.btnPrimary} disabled={createUserMut.isPending}>
                  {createUserMut.isPending ? 'Creating…' : 'Save & Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                    <button style={s.dangerBtn} onClick={() => { if (confirm(`Remove ${u.name}?`)) deleteMut.mutate(u.id) }}>Remove</button>
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
            <thead><tr>{['Email', 'Role', 'Expires', ''].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
            <tbody>
              {invites.map(inv => (
                <tr key={inv.token}>
                  <td style={s.td}><span style={{ color: '#9090aa' }}>{inv.email}</span></td>
                  <td style={s.td}><span style={{ ...s.rolePill, ...roleColor(inv.role) }}>{inv.role}</span></td>
                  <td style={s.td}><span style={{ color: '#6b6b8a', fontSize: 12 }}>{new Date(inv.expires_at).toLocaleDateString()}</span></td>
                  <td style={s.td}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button style={s.actionBtn} onClick={() => resendInviteMut.mutate(inv.token)}>Resend</button>
                      <button style={s.dangerBtn} onClick={() => { if (confirm('Delete this invite?')) deleteInviteMut.mutate(inv.token) }}>Delete</button>
                    </div>
                  </td>
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
  input: { width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #1e1e30', background: '#0d0d14', color: '#e2e2f0', fontSize: 13, outline: 'none', fontFamily: 'inherit', marginTop: 4 },
  label: { fontSize: 11, fontWeight: 700, color: '#4a4a6a', letterSpacing: '0.6px', textTransform: 'uppercase' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  btnPrimary: { padding: '9px 18px', borderRadius: 8, background: 'linear-gradient(135deg, #7c5cfc, #6b4ef5)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  btnSecondary: { padding: '9px 16px', borderRadius: 8, background: '#1a1a28', color: '#9090aa', border: '1px solid #2a2a40', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
  dangerBtn: { padding: '4px 10px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' },
  actionBtn: { padding: '4px 10px', borderRadius: 6, background: 'rgba(124,92,252,0.1)', border: '1px solid rgba(124,92,252,0.2)', color: '#a78bfa', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' },
  rolePill: { display: 'inline-block', padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600 },
  roleSelect: { padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit', outline: 'none' },
  errorBox: { background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#f87171', marginBottom: 16 },
  successBox: { background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#34d399', marginBottom: 16, wordBreak: 'break-all' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modal: { background: '#13131f', borderRadius: 14, border: '1px solid #2a2a40', width: 540, maxHeight: '90vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid #1e1e30' },
  modalTitle: { fontSize: 15, fontWeight: 700, color: '#fff' },
  closeBtn: { background: 'none', border: 'none', color: '#6b6b8a', fontSize: 16, cursor: 'pointer' },
  modalBody: { padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '14px 22px', borderTop: '1px solid #1e1e30' },
}
