import { useQuery } from '@tanstack/react-query'
import { softwareApi } from '../services/api'
import { differenceInDays, parseISO, format } from 'date-fns'

const fmt = n => '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 })
const daysLeft = d => differenceInDays(parseISO(d), new Date())

function Section({ title, accentColor, items }) {
  if (!items.length) return null
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, borderRadius: 2, background: accentColor }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e2f0' }}>{title}</span>
        <span style={{ fontSize: 11, color: accentColor, background: `${accentColor}18`, borderRadius: 20, padding: '2px 8px', border: `1px solid ${accentColor}30` }}>{items.length}</span>
      </div>
      <div style={{ background: '#13131f', border: '1px solid #1e1e30', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr>{['Software', 'Category', 'Owner', 'Renewal Date', 'Annual Cost', 'Days'].map(h =>
            <th key={h} style={{ textAlign: 'left', padding: '9px 16px', fontSize: 10, color: '#3a3a52', background: '#0d0d14', borderBottom: '1px solid #1a1a28', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700 }}>{h}</th>
          )}</tr></thead>
          <tbody>
            {items.map(sw => {
              const d = daysLeft(sw.renewal_date)
              return (
                <tr key={sw.id}>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #1a1a28', color: '#e2e2f0', fontWeight: 600 }}>{sw.name}<br /><span style={{ fontSize: 11, color: '#6b6b8a', fontWeight: 400 }}>{sw.vendor}</span></td>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #1a1a28', color: '#9090aa' }}>{sw.category}</td>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #1a1a28', color: '#9090aa' }}>{sw.owner_label || '—'}</td>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #1a1a28', color: '#9090aa' }}>{format(parseISO(sw.renewal_date), 'MMM d, yyyy')}</td>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #1a1a28', color: '#e2e2f0', fontWeight: 600 }}>{fmt(sw.annual_cost)}</td>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #1a1a28', fontWeight: 700, color: accentColor }}>{d < 0 ? 'Expired' : `${d}d`}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function Renewals() {
  const { data: all = [], isLoading } = useQuery({ queryKey: ['software'], queryFn: () => softwareApi.list().then(r => r.data) })
  if (isLoading) return <div style={{ padding: 40, color: '#6b6b8a' }}>Loading…</div>

  const expired = all.filter(s => daysLeft(s.renewal_date) < 0).sort((a, b) => new Date(a.renewal_date) - new Date(b.renewal_date))
  const urgent = all.filter(s => { const d = daysLeft(s.renewal_date); return d >= 0 && d <= 7 }).sort((a, b) => new Date(a.renewal_date) - new Date(b.renewal_date))
  const soon = all.filter(s => { const d = daysLeft(s.renewal_date); return d > 7 && d <= 30 }).sort((a, b) => new Date(a.renewal_date) - new Date(b.renewal_date))
  const upcoming = all.filter(s => daysLeft(s.renewal_date) > 30).sort((a, b) => new Date(a.renewal_date) - new Date(b.renewal_date))

  return (
    <div style={{ padding: '28px 32px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 3 }}>Renewals</h1>
        <p style={{ fontSize: 13, color: '#6b6b8a' }}>Track and manage upcoming license renewals</p>
      </div>
      <Section title="Expired" accentColor="#f87171" items={expired} />
      <Section title="Due within 7 days" accentColor="#f87171" items={urgent} />
      <Section title="Due within 30 days" accentColor="#fbbf24" items={soon} />
      <Section title="Upcoming" accentColor="#7c5cfc" items={upcoming} />
      {!all.length && <div style={{ color: '#3a3a52', fontSize: 14 }}>No software tracked yet.</div>}
    </div>
  )
}
