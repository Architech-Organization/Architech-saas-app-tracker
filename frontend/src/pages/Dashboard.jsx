import { useQuery } from '@tanstack/react-query'
import { softwareApi } from '../services/api'
import { differenceInDays, parseISO, format } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const fmt = n => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtMo = n => '$' + Math.round(Number(n) / 12).toLocaleString() + '/mo'
const daysLeft = d => differenceInDays(parseISO(d), new Date())

const CAT_COLORS = {
  Development: '#7c5cfc', Operations: '#06b6d4', Sales: '#f59e0b',
  HR: '#ec4899', Security: '#10b981', Collaboration: '#8b5cf6', Other: '#6b7280',
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#1a1a2e', border: '1px solid #2a2a40', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
      <div style={{ color: '#9090aa', marginBottom: 4 }}>{label}</div>
      <div style={{ color: '#a78bfa', fontWeight: 600 }}>{fmt(payload[0].value)}</div>
    </div>
  )
}

function RenewalRow({ sw }) {
  const d = daysLeft(sw.renewal_date)
  const urgent = d <= 7
  const bg = urgent ? 'rgba(239,68,68,0.15)' : 'rgba(124,92,252,0.15)'
  const color = urgent ? '#f87171' : '#a78bfa'
  const border = urgent ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(124,92,252,0.3)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #1a1a28' }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg, border, flexShrink: 0 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color }}>{d}d</span>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e2f0', marginBottom: 2 }}>{sw.name}</div>
        <div style={{ fontSize: 11, color: '#6b6b8a' }}>{sw.vendor} · {sw.owner_label || 'General'}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color }}>{d}d</div>
        <div style={{ fontSize: 11, color: '#6b6b8a' }}>{format(parseISO(sw.renewal_date), 'yyyy-MM-dd')}</div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: () => softwareApi.dashboard().then(r => r.data) })
  const { data: all = [] } = useQuery({ queryKey: ['software'], queryFn: () => softwareApi.list().then(r => r.data) })

  if (isLoading) return <div style={{ padding: 40, color: '#6b6b8a' }}>Loading…</div>

  const totalMonthly = Number(stats?.total_annual_spend || 0) / 12
  const upcoming = all.filter(s => { const d = daysLeft(s.renewal_date); return d >= 0 && d <= 30 }).sort((a, b) => new Date(a.renewal_date) - new Date(b.renewal_date))
  const renewing7 = all.filter(s => { const d = daysLeft(s.renewal_date); return d >= 0 && d <= 7 })
  const catData = Object.entries(stats?.spend_by_category || {}).map(([cat, val]) => ({ cat, val: val / 12 })).filter(x => x.val > 0).sort((a, b) => b.val - a.val)
  const months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']
  const trend = months.map((m, i) => ({ month: m, spend: totalMonthly * (0.85 + i * 0.04) }))

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1300, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 3 }}>Dashboard</h1>
          <p style={{ fontSize: 13, color: '#6b6b8a' }}>License & spend overview</p>
        </div>
        <div style={{ fontSize: 13, color: '#6b6b8a', background: '#13131f', border: '1px solid #1e1e30', borderRadius: 6, padding: '5px 12px' }}>{format(new Date(), 'HH:mm')}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        {[
          { label: 'TOTAL SUBSCRIPTIONS', value: stats?.total_software || 0, accent: '#7c5cfc' },
          { label: 'MONTHLY SPEND', value: fmt(totalMonthly), accent: '#10b981' },
          { label: 'RENEWING (30D)', value: upcoming.length, accent: '#f59e0b' },
          { label: 'RENEWING (7D)', value: renewing7.length, accent: '#ef4444' },
        ].map(({ label, value, accent }) => (
          <div key={label} style={{ background: '#13131f', borderRadius: 12, border: '1px solid #1e1e30', borderTop: `2px solid ${accent}`, padding: '14px 20px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#4a4a6a', letterSpacing: '0.8px', marginBottom: 10 }}>{label}</div>
            <div style={{ fontSize: 36, fontWeight: 700, color: accent, lineHeight: 1, marginBottom: 6 }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        <div style={{ flex: '1 1 55%', background: '#13131f', borderRadius: 12, border: '1px solid #1e1e30', padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e2f0' }}>Upcoming renewals</span>
          </div>
          {upcoming.slice(0, 6).map(sw => <RenewalRow key={sw.id} sw={sw} />)}
          {!upcoming.length && <div style={{ padding: '32px 0', textAlign: 'center', color: '#3a3a52', fontSize: 13 }}>No renewals in the next 30 days</div>}
        </div>
        <div style={{ flex: '1 1 40%', background: '#13131f', borderRadius: 12, border: '1px solid #1e1e30', padding: '18px 20px' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e2f0', marginBottom: 16 }}>Spend by category</div>
          {catData.map(({ cat, val }, i) => {
            const color = CAT_COLORS[cat] || '#7c5cfc'
            const max = catData[0]?.val || 1
            return (
              <div key={cat} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 13, color: '#c4c4d4' }}>{cat}</span>
                  <span style={{ fontSize: 12, color: '#9090aa', fontWeight: 500 }}>{fmtMo(val * 12)}</span>
                </div>
                <div style={{ height: 5, background: '#1a1a28', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(val / max) * 100}%`, background: color, borderRadius: 3 }} />
                </div>
              </div>
            )
          })}
          {!catData.length && <div style={{ color: '#3a3a52', fontSize: 13 }}>No data yet.</div>}
        </div>
      </div>

      <div style={{ background: '#13131f', border: '1px solid #1e1e30', borderRadius: 12, padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e2f0' }}>Monthly spend trend</span>
          <span style={{ fontSize: 11, color: '#3a3a52' }}>Last 6 months</span>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#3a3a52' }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(124,92,252,0.08)' }} />
            <Bar dataKey="spend" radius={[4, 4, 0, 0]}>
              {trend.map((_, i) => <Cell key={i} fill={i >= trend.length - 2 ? '#7c5cfc' : '#2a2040'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
