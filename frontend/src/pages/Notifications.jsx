import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import api from '../services/api'

export default function Notifications() {
  const [settings, setSettings] = useState({
    enabled: false,
    reminder_days: [7, 30, 90],
    notify_emails: [],
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_password: '',
    from_email: '',
    from_name: 'LicenseVault',
  })
  const [emailInput, setEmailInput] = useState('')
  const [testEmail, setTestEmail] = useState('')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [testMsg, setTestMsg] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/notifications/settings').then(r => {
      setSettings(s => ({ ...s, ...r.data }))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const saveMut = useMutation({
    mutationFn: () => api.post('/notifications/settings', settings),
    onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 3000) },
    onError: err => setError(err.response?.data?.detail || 'Save failed'),
  })

  const testMut = useMutation({
    mutationFn: () => api.post('/notifications/test', { to_email: testEmail }),
    onSuccess: () => setTestMsg('Test email sent successfully!'),
    onError: err => setTestMsg(err.response?.data?.detail || 'Failed to send test email'),
  })

  const sendNowMut = useMutation({
    mutationFn: () => api.post('/notifications/send-reminders'),
    onSuccess: () => setTestMsg('Reminders sent to all configured emails!'),
    onError: err => setTestMsg(err.response?.data?.detail || 'Failed'),
  })

  const toggleDay = d => {
    setSettings(s => ({
      ...s,
      reminder_days: s.reminder_days.includes(d)
        ? s.reminder_days.filter(x => x !== d)
        : [...s.reminder_days, d].sort((a, b) => a - b)
    }))
  }

  const addEmail = () => {
    const e = emailInput.trim().toLowerCase()
    if (!e || settings.notify_emails.includes(e)) return
    setSettings(s => ({ ...s, notify_emails: [...s.notify_emails, e] }))
    setEmailInput('')
  }

  const removeEmail = e => setSettings(s => ({ ...s, notify_emails: s.notify_emails.filter(x => x !== e) }))

  if (loading) return <div style={{ padding: 40, color: '#6b6b8a' }}>Loading…</div>

  return (
    <div style={{ padding: '28px 32px', maxWidth: 680 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 3 }}>Notifications</h1>
        <p style={{ fontSize: 13, color: '#6b6b8a' }}>Configure email renewal reminders</p>
      </div>

      {error && <div style={s.errorBox}>{error}</div>}
      {saved && <div style={s.successBox}>Settings saved successfully!</div>}
      {testMsg && <div style={testMsg.includes('success') || testMsg.includes('sent') ? s.successBox : s.errorBox}>{testMsg}</div>}

      {/* Enable toggle */}
      <div style={s.card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={s.cardTitle}>Email notifications</div>
            <div style={s.cardSub}>Send automatic renewal reminders by email</div>
          </div>
          <button
            onClick={() => setSettings(s => ({ ...s, enabled: !s.enabled }))}
            style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: settings.enabled ? '#7c5cfc' : '#2a2a40', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: settings.enabled ? 23 : 3, transition: 'left 0.2s' }} />
          </button>
        </div>
      </div>

      {/* Reminder days */}
      <div style={s.card}>
        <div style={s.cardTitle}>Reminder schedule</div>
        <div style={s.cardSub}>Send reminders when a license is this many days from renewal</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          {[7, 14, 30, 60, 90].map(d => (
            <button key={d} onClick={() => toggleDay(d)}
              style={{ padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', border: '1px solid', background: settings.reminder_days.includes(d) ? 'rgba(124,92,252,0.2)' : '#0d0d14', color: settings.reminder_days.includes(d) ? '#a78bfa' : '#6b6b8a', borderColor: settings.reminder_days.includes(d) ? 'rgba(124,92,252,0.5)' : '#1e1e30' }}>
              {d} days
            </button>
          ))}
        </div>
      </div>

      {/* Notify emails */}
      <div style={s.card}>
        <div style={s.cardTitle}>Notify these email addresses</div>
        <div style={s.cardSub}>Renewal reminders will be sent to all addresses below</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <input style={{ ...s.input, flex: 1 }} type="email" placeholder="email@architech.ca" value={emailInput} onChange={e => setEmailInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addEmail())} />
          <button style={s.btnSecondary} onClick={addEmail}>Add</button>
        </div>
        {settings.notify_emails.length > 0 && (
          <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {settings.notify_emails.map(e => (
              <div key={e} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1a1a28', border: '1px solid #2a2a40', borderRadius: 20, padding: '4px 12px', fontSize: 12 }}>
                <span style={{ color: '#e2e2f0' }}>{e}</span>
                <button onClick={() => removeEmail(e)} style={{ background: 'none', border: 'none', color: '#6b6b8a', cursor: 'pointer', fontSize: 14, padding: 0, lineHeight: 1 }}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SMTP settings */}
      <div style={s.card}>
        <div style={s.cardTitle}>SMTP configuration</div>
        <div style={s.cardSub}>Enter your email server details. Use Gmail, Outlook, or any SMTP provider.</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
          <div style={s.row}>
            <div>
              <label style={s.label}>SMTP HOST</label>
              <input style={s.input} placeholder="smtp.gmail.com" value={settings.smtp_host} onChange={e => setSettings(s => ({ ...s, smtp_host: e.target.value }))} />
            </div>
            <div>
              <label style={s.label}>PORT</label>
              <input style={s.input} type="number" placeholder="587" value={settings.smtp_port} onChange={e => setSettings(s => ({ ...s, smtp_port: Number(e.target.value) }))} />
            </div>
          </div>
          <div style={s.row}>
            <div>
              <label style={s.label}>SMTP USERNAME</label>
              <input style={s.input} placeholder="your@email.com" value={settings.smtp_user} onChange={e => setSettings(s => ({ ...s, smtp_user: e.target.value }))} />
            </div>
            <div>
              <label style={s.label}>SMTP PASSWORD</label>
              <input style={s.input} type="password" placeholder="App password" value={settings.smtp_password} onChange={e => setSettings(s => ({ ...s, smtp_password: e.target.value }))} />
            </div>
          </div>
          <div style={s.row}>
            <div>
              <label style={s.label}>FROM EMAIL</label>
              <input style={s.input} placeholder="noreply@architech.ca" value={settings.from_email} onChange={e => setSettings(s => ({ ...s, from_email: e.target.value }))} />
            </div>
            <div>
              <label style={s.label}>FROM NAME</label>
              <input style={s.input} placeholder="LicenseVault" value={settings.from_name} onChange={e => setSettings(s => ({ ...s, from_name: e.target.value }))} />
            </div>
          </div>
        </div>
        <div style={{ marginTop: 14, padding: 12, background: '#0d0d14', borderRadius: 8, fontSize: 12, color: '#6b6b8a', lineHeight: 1.6 }}>
          <strong style={{ color: '#9090aa' }}>Gmail:</strong> Use smtp.gmail.com, port 587, and an App Password (Google Account → Security → App passwords).<br />
          <strong style={{ color: '#9090aa' }}>Outlook/Microsoft 365:</strong> Use smtp.office365.com, port 587.
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <button style={s.btnPrimary} onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
          {saveMut.isPending ? 'Saving…' : 'Save settings'}
        </button>
        <button style={s.btnSecondary} onClick={() => sendNowMut.mutate()} disabled={sendNowMut.isPending}>
          {sendNowMut.isPending ? 'Sending…' : 'Send reminders now'}
        </button>
      </div>

      {/* Test email */}
      <div style={s.card}>
        <div style={s.cardTitle}>Send test email</div>
        <div style={s.cardSub}>Verify your SMTP settings by sending a test notification</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <input style={{ ...s.input, flex: 1 }} type="email" placeholder="your@email.com" value={testEmail} onChange={e => setTestEmail(e.target.value)} />
          <button style={s.btnSecondary} onClick={() => { setTestMsg(''); testMut.mutate() }} disabled={testMut.isPending || !testEmail}>
            {testMut.isPending ? 'Sending…' : 'Send test'}
          </button>
        </div>
      </div>
    </div>
  )
}

const s = {
  card: { background: '#13131f', border: '1px solid #1e1e30', borderRadius: 12, padding: '18px 20px', marginBottom: 16 },
  cardTitle: { fontSize: 14, fontWeight: 600, color: '#e2e2f0', marginBottom: 4 },
  cardSub: { fontSize: 12, color: '#6b6b8a' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  label: { display: 'block', fontSize: 11, fontWeight: 700, color: '#4a4a6a', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 5 },
  input: { width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #1e1e30', background: '#0d0d14', color: '#e2e2f0', fontSize: 13, outline: 'none', fontFamily: 'inherit' },
  btnPrimary: { padding: '9px 18px', borderRadius: 8, background: 'linear-gradient(135deg, #7c5cfc, #6b4ef5)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  btnSecondary: { padding: '9px 16px', borderRadius: 8, background: '#1a1a28', color: '#9090aa', border: '1px solid #2a2a40', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
  errorBox: { background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#f87171', marginBottom: 16 },
  successBox: { background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#34d399', marginBottom: 16 },
}
