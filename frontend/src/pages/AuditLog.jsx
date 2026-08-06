import { useQuery } from '@tanstack/react-query'
import api from '../services/api'
import { format, parseISO } from 'date-fns'

export default function AuditLog() {
  const { data: software = [] } = useQuery({ queryKey: ['software'], queryFn: () => api.get('/software/').then(r => r.data) })

  const events = software.flatMap(sw =>
    (sw.renewal_history || []).map(h => ({
      software: sw.name,
      action: h.action,
      note: h.note,
      prev_cost: h.previous_cost,
      new_cost: h.new_cost,
      performed_at: h.performed_at,
    }))
  ).sort((a, b) => new Date(b.performed_at) - new Date(a.performed_at))

  const actionColor = a => ({
    renewed: '#34d399', renegotiated: '#67e8f9', cancelled: '#f87171', noted: '#a78bfa'
  }[a] || '#9090aa')

  return (
    <div style={{ padding: '28px 32px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 3 }}>Audit Log</h1>
        <p style={{ fontSize: 13, color: '#6b6b8a' }}>All renewal and change events</p>
      </div>

      <div style={{ background: '#13131f', border: '1px solid #1e1e30', borderRadius: 12, overflow: 'hidden' }}>
        {events.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#3a3a52', fontSize: 14 }}>
            No audit events yet. Renewal actions will appear here.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr>{['Date', 'Software', 'Action', 'Cost change', 'Note'].map(h =>
              <th key={h} style={{ textAlign: 'left', padding: '9px 16px', fontSize: 10, color: '#3a3a52', background: '#0d0d14', borderBottom: '1px solid #1a1a28', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700 }}>{h}</th>
            )}</tr></thead>
            <tbody>
              {events.map((e, i) => (
                <tr key={i}>
                  <td style={{ padding: '11px 16px', borderBottom: '1px solid #1a1a28', color: '#6b6b8a', fontSize: 12, whiteSpace: 'nowrap' }}>{format(parseISO(e.performed_at), 'MMM d, yyyy HH:mm')}</td>
                  <td style={{ padding: '11px 16px', borderBottom: '1px solid #1a1a28', color: '#e2e2f0', fontWeight: 600 }}>{e.software}</td>
                  <td style={{ padding: '11px 16px', borderBottom: '1px solid #1a1a28' }}>
                    <span style={{ padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: `${actionColor(e.action)}18`, color: actionColor(e.action) }}>{e.action}</span>
                  </td>
                  <td style={{ padding: '11px 16px', borderBottom: '1px solid #1a1a28', color: '#9090aa', fontSize: 12 }}>
                    {e.prev_cost != null && e.new_cost != null ? `$${e.prev_cost} → $${e.new_cost}` : '—'}
                  </td>
                  <td style={{ padding: '11px 16px', borderBottom: '1px solid #1a1a28', color: '#6b6b8a', fontSize: 12 }}>{e.note || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
