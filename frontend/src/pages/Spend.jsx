import { useQuery } from '@tanstack/react-query'
import { softwareApi } from '../services/api'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts'

const fmt = n => '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 })
const fmtFull = n => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const CAT_COLORS = ['#7c5cfc','#06b6d4','#f59e0b','#ec4899','#10b981','#8b5cf6','#6b7280']

const DarkTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#1a1a2e', border: '1px solid #2a2a40', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
      {label && <div style={{ color: '#9090aa', marginBottom: 4 }}>{label}</div>}
      {payload.map(p => <div key={p.name} style={{ color: '#a78bfa', fontWeight: 600 }}>{fmt(p.value)}</div>)}
    </div>
  )
}

export default function Spend() {
  const { data: dashboard } = useQuery({ queryKey: ['dashboard'], queryFn: () => softwareApi.dashboard().then(r => r.data) })
  const { data: all = [] } = useQuery({ queryKey: ['software'], queryFn: () => softwareApi.list().then(r => r.data) })

  const sorted = [...all].sort((a, b) => b.annual_cost - a.annual_cost)
  const total = all.reduce((s, sw) => s + Number(sw.annual_cost), 0)
  const catData = Object.entries(dashboard?.spend_by_category || {}).map(([name, value]) => ({ name, value })).filter(x => x.value > 0).sort((a, b) => b.value - a.value)

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 3 }}>Spend Analysis</h1>
        <p style={{ fontSize: 13, color: '#6b6b8a' }}>Full cost breakdown across all licenses</p>
      </div>

      {/* Top stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'TOTAL ANNUAL', value: fmtFull(total), accent: '#7c5cfc' },
          { label: 'MONTHLY EQUIV.', value: fmtFull(total / 12), accent: '#10b981' },
          { label: 'AVG PER TOOL', value: all.length ? fmt(total / all.length) : '—', accent: '#f59e0b' },
        ].map(({ label, value, accent }) => (
          <div key={label} style={{ background: '#13131f', borderRadius: 12, border: '1px solid #1e1e30', borderTop: `2px solid ${accent}`, padding: '16px 20px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#4a4a6a', letterSpacing: '0.8px', marginBottom: 8 }}>{label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: accent }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Donut */}
        <div style={{ background: '#13131f', border: '1px solid #1e1e30', borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e2f0', marginBottom: 16 }}>Spend by Category</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={catData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={50}>
                {catData.map((_, i) => <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />)}
              </Pie>
              <Tooltip content={<DarkTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            {catData.map(({ name, value }, i) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#9090aa' }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: CAT_COLORS[i % CAT_COLORS.length], flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{name}</span>
                <span style={{ fontWeight: 600, color: '#e2e2f0' }}>{fmt(value)}</span>
                <span style={{ color: '#4a4a6a', width: 36, textAlign: 'right' }}>{total ? Math.round(value / total * 100) : 0}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar */}
        <div style={{ background: '#13131f', border: '1px solid #1e1e30', borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e2f0', marginBottom: 16 }}>Top 8 by Spend</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sorted.slice(0, 8)} layout="vertical" margin={{ left: 4, right: 16 }}>
              <XAxis type="number" tick={{ fontSize: 10, fill: '#3a3a52' }} axisLine={false} tickLine={false} tickFormatter={v => '$' + (v / 1000).toFixed(0) + 'k'} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#9090aa' }} axisLine={false} tickLine={false} width={110} />
              <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(124,92,252,0.08)' }} />
              <Bar dataKey="annual_cost" fill="#7c5cfc" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Full table */}
      <div style={{ background: '#13131f', border: '1px solid #1e1e30', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #1e1e30', fontSize: 14, fontWeight: 600, color: '#e2e2f0' }}>All software — cost breakdown</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr>{['Software', 'Category', 'Annual Cost', 'Seats', 'Cost / Seat', 'Billing'].map(h =>
            <th key={h} style={{ textAlign: 'left', padding: '9px 16px', fontSize: 10, color: '#3a3a52', background: '#0d0d14', borderBottom: '1px solid #1a1a28', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700 }}>{h}</th>
          )}</tr></thead>
          <tbody>
            {sorted.map(sw => (
              <tr key={sw.id}>
                <td style={{ padding: '11px 16px', borderBottom: '1px solid #1a1a28', color: '#e2e2f0', fontWeight: 600 }}>{sw.name}</td>
                <td style={{ padding: '11px 16px', borderBottom: '1px solid #1a1a28', color: '#9090aa' }}>{sw.category}</td>
                <td style={{ padding: '11px 16px', borderBottom: '1px solid #1a1a28', color: '#a78bfa', fontWeight: 700 }}>{fmt(sw.annual_cost)}</td>
                <td style={{ padding: '11px 16px', borderBottom: '1px solid #1a1a28', color: '#9090aa' }}>{sw.seats || '—'}</td>
                <td style={{ padding: '11px 16px', borderBottom: '1px solid #1a1a28', color: '#9090aa' }}>{sw.seats ? fmt(sw.annual_cost / sw.seats) : 'Usage'}</td>
                <td style={{ padding: '11px 16px', borderBottom: '1px solid #1a1a28', color: '#6b6b8a', fontSize: 12 }}>{sw.billing_cycle}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
