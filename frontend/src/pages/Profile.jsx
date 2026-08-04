import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function Profile() {
  const { user, logout } = useAuth()
  const qc = useQueryClient()
  const [name, setName] = useState(user?.name || '')
  const [pwd, setPwd] = useState({ current: '', new: '', confirm: '' })
  const [nameMsg, setNameMsg] = useState('')
  const [pwdMsg, setPwdMsg] = useState('')
  const [pwdError, setPwdError] = useState('')

  const nameMut = useMutation({
    mutationFn: () => api.patch('/users/me', { name }),
    onSuccess: () => { setNameMsg('Name updated!'); qc.invalidateQueries(['me']) },
  })

  const pwdMut = useMutation({
    mutationFn: () => api.post('/users/me/password', { current_password: pwd.current, new_password: pwd.new }),
    onSuccess: () => { setPwdMsg('Password updated!'); setPwd({ current: '', new: '', confirm: '' }) },
    onError: err => setPwdError(err.response?.data?.detail || 'Failed to update password'),
  })

  const handlePwd = e => {
    e.preventDefault()
    setPwdError(''); setPwdMsg('')
    if (pwd.new !== pwd.confirm) { setPwdError('New passwords do not match'); return }
    if (pwd.new.length < 6) { setPwdError('Password must be at least 6 characters'); return }
    pwdMut.mutate()
  }

  const roleColor = { admin: '#a78bfa', editor: '#67e8f9', viewer: '#94a3b8' }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 560 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 3 }}>My profile</h1>
        <p style={{ fontSize: 13, color: '#6b6b8a' }}>Manage your account settings</p>
      </div>

      {/* Avatar + info */}
      <div style={{ background: '#13131f', border: '1px solid #1e1e30', borderRadius: 12, padding: 20, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #7c5cfc, #5b8af5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>{user?.name}</div>
          <div style={{ fontSize: 13, color: '#6b6b8a' }}>{user?.email}</div>
          <div style={{ marginTop: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: 'rgba(124,92,252,0.15)', color: roleColor[user?.role] || '#a78bfa' }}>{user?.role}</span>
          </div>
        </div>
      </div>

      {/* Update name */}
      <div style={{ background: '#13131f', border: '1px solid #1e1e30', borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e2f0', marginBottom: 14 }}>Display name</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input style={s.input} value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
          <button style={s.btnPrimary} onClick={() => { setNameMsg(''); nameMut.mutate() }} disabled={nameMut.isPending}>Save</button>
        </div>
        {nameMsg && <div style={{ fontSize: 12, color: '#34d399', marginTop: 8 }}>{nameMsg}</div>}
      </div>

      {/* Change password */}
      <div style={{ background: '#13131f', border: '1px solid #1e1e30', borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e2f0', marginBottom: 14 }}>Change password</div>
        {pwdError && <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#f87171', marginBottom: 12 }}>{pwdError}</div>}
        {pwdMsg && <div style={{ fontSize: 12, color: '#34d399', marginBottom: 10 }}>{pwdMsg}</div>}
        <form onSubmit={handlePwd} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label style={s.label}>Current password</label>
            <input style={s.input} type="password" value={pwd.current} onChange={e => setPwd(p => ({ ...p, current: e.target.value }))} required />
          </div>
          <div>
            <label style={s.label}>New password</label>
            <input style={s.input} type="password" value={pwd.new} onChange={e => setPwd(p => ({ ...p, new: e.target.value }))} required />
          </div>
          <div>
            <label style={s.label}>Confirm new password</label>
            <input style={s.input} type="password" value={pwd.confirm} onChange={e => setPwd(p => ({ ...p, confirm: e.target.value }))} required />
          </div>
          <button type="submit" style={s.btnPrimary} disabled={pwdMut.isPending}>
            {pwdMut.isPending ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </div>

      {/* Sign out */}
      <button onClick={logout} style={{ width: '100%', padding: '10px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
        Sign out
      </button>
    </div>
  )
}

const s = {
  label: { display: 'block', fontSize: 11, fontWeight: 700, color: '#4a4a6a', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 5 },
  input: { width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #1e1e30', background: '#0d0d14', color: '#e2e2f0', fontSize: 13, outline: 'none', fontFamily: 'inherit' },
  btnPrimary: { padding: '9px 18px', borderRadius: 8, background: 'linear-gradient(135deg, #7c5cfc, #6b4ef5)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
}
