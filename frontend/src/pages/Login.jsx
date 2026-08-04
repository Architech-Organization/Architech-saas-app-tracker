import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = async e => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      if (mode === 'login') await login(form.email, form.password)
      else await register(form.name, form.email, form.password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials')
    } finally { setLoading(false) }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        {/* Logo */}
        <div style={s.logoWrap}>
          <div style={s.logoIcon}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h1 style={s.appName}>LicenseVault</h1>
          <p style={s.appSub}>Software License Management</p>
        </div>

        {error && <div style={s.error}>{error}</div>}

        <form onSubmit={handle} style={s.form}>
          {mode === 'register' && (
            <div style={s.fieldWrap}>
              <label style={s.label}>FULL NAME</label>
              <input style={s.input} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Your name" />
            </div>
          )}
          <div style={s.fieldWrap}>
            <label style={s.label}>EMAIL ADDRESS</label>
            <input style={s.input} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required placeholder="you@company.com" />
          </div>
          <div style={s.fieldWrap}>
            <label style={s.label}>PASSWORD</label>
            <input style={{ ...s.input, ...s.inputFocus }} type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required placeholder="••••••••" />
          </div>
          <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {mode === 'login' && <p style={s.forgot}><button style={s.forgotBtn}>Forgot password?</button></p>}

        <p style={s.toggle}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button style={s.toggleBtn} onClick={() => setMode(m => m === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'Register' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}

const s = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(ellipse at 60% 40%, #1a1040 0%, #0d0d14 70%)' },
  card: { background: '#13131f', borderRadius: 16, border: '1px solid #1e1e30', padding: '36px 32px', width: 360 },
  logoWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 },
  logoIcon: { width: 60, height: 60, borderRadius: 14, background: 'linear-gradient(135deg, #7c5cfc, #5b8af5)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  appName: { fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 4 },
  appSub: { fontSize: 13, color: '#6b6b8a' },
  error: { background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#f87171', marginBottom: 16 },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  fieldWrap: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 11, fontWeight: 600, color: '#6b6b8a', letterSpacing: '0.8px' },
  input: { padding: '11px 14px', borderRadius: 8, border: '1px solid #1e1e30', background: '#0d0d14', color: '#e2e2f0', fontSize: 14, outline: 'none', transition: 'border-color 0.15s' },
  inputFocus: { borderColor: '#7c5cfc' },
  btn: { marginTop: 4, padding: '12px', borderRadius: 8, background: 'linear-gradient(135deg, #7c5cfc, #6b4ef5)', color: '#fff', border: 'none', fontSize: 15, fontWeight: 600, letterSpacing: '0.2px' },
  forgot: { marginTop: 14, textAlign: 'center' },
  forgotBtn: { background: 'none', border: 'none', color: '#7c5cfc', fontSize: 13 },
  toggle: { marginTop: 20, textAlign: 'center', fontSize: 13, color: '#6b6b8a' },
  toggleBtn: { background: 'none', border: 'none', color: '#7c5cfc', fontSize: 13, fontWeight: 500 },
}
