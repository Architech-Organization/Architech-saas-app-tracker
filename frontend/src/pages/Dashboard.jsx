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

// Card with colored top border
function StatCard({ label, value, sub, accentColor, large }) {
  return (
    <div style={{ ...sc.card, borderTop: `2px solid ${accentColor}` }}>
      <div style={sc.statLabel}>{label}</div>
      <div style={{ ...sc.statValue, color: accentColor, fontSize: large ? 42 : 36 }}>{value}</div>
      <div style={sc.statSub}>{sub}</div>
    </div>
  )
}

function RenewalRow({ sw }) {
  const d = daysLeft(sw.renewal_date)
  const urgent = d <= 7
  return (
    <div style={sc.renewalRow}>
      <div style={{ ...sc.dBadge, background: urgent ? 'rgba(239,68,68,0.15)' : 'transparent', color: urgent ? '#f87171' : '#a78bfa', border: `1px solid ${urgent ? 'rgba(239,68,68,0.3)' : 'rgba(124,92,252,0.3)'}` }}>
        <span style={{ fontSize: 10, fontWeight: 700 }}>{d}d</span>
      </div>
      <div style={{ flex: 1 }}>
        <div style={sc.renewalName}>{sw.name}</div>
        <div style={sc.renewalMeta}>{sw.vendor} · {sw.owner_label || 'General'}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ ...sc.renewalDays, color: urgent ? '#f87171' : '#a78bfa' }}>{d}d</div>
        <div style={sc.renewalDate}>{format(parseISO(sw.renewal_date), 'yyyy-MM-dd')}</div>
      </div>
    </div>
  )
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

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: () => softwareApi.dashboard().then(r => r.data) })
  const { data: all = [] } = useQuery({ queryKey: ['software'], queryFn: () => softwareApi.list().then(r => r.data) })

  if (isLoading) return <div style={{ padding: 40, color: '#6b6b8a' }}>Loading…</div>

  const totalMonthly = Number(stats?.total_annual_spend || 0) / 12
  const upcoming = all.filter(s => { const d = daysLeft(s.renewal_date); return d >= 0 && d <= 30 }).sort((a, b) => new Date(a.renewal_date) - new Date(b.renewal_date))
  const renewing7 = all.filter(s => { const d = daysLeft(s.renewal_date); return d >= 0 && d <= 7 })

  const catData = Object.entries(stats?.spend_by_category || {})
    .map(([cat, val]) => ({ cat, val: val / 12 }))
    .filter(x => x.val > 0)
    .sort((a, b) => b.val - a.val)

  // Mock monthly trend data (6 months)
  const months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']
  const trend = months.map((m, i) => ({ month: m, spend: totalMonthly * (0.85 + i * 0.04) }))

  return (
    <div style={sc.page}>
      {/* Header */}
      <div style={sc.pageHeader}>
        <div>
          <h1 style={sc.pageTitle}>Dashboard</h1>
          <p style={sc.pageSubtitle}>License & spend overview</p>
        </div>
        <div style={sc.clock}>{format(new Date(), 'HH:mm')}</div>
      </div>

      {/* Stat cards */}
      <div style={sc.statsGrid}>
        <StatCard label="TOTAL SUBSCRIPTIONS" value={stats?.total_software || 0} sub="Active licenses" accentColor="#7c5cfc" large />
        <StatCard label="MONTHLY SPEND" value={fmt(totalMonthly)} sub="Across all active plans" accentColor="#10b981" large />
        <StatCard label="RENEWING (30D)" value={upcoming.length} sub="Upcoming renewals" accentColor="#f59e0b" large />
        <StatCard label="RENEWING (7D)" value={renewing7.length} sub="Needs attention" accentColor="#ef4444" large />
      </div>

      {/* Main content row */}
      <div style={sc.mainRow}>
        {/* Upcoming renewals */}
        <div style={sc.bigCard}>
          <div style={sc.cardHeader}>
            <span style={sc.cardTitle}>Upcoming Renewals</span>
            <button style={sc.viewAllBtn}>View all</button>
          </div>
          <div>
            {upcoming.slice(0, 6).map(sw => <RenewalRow key={sw.id} sw={sw} />)}
            {!upcoming.length && <div style={{ padding: '32px 0', textAlign: 'center', color: '#3a3a52', fontSize: 13 }}>No renewals in the next 30 days</div>}
          </div>
        </div>

        {/* Spend by category */}
        <div style={sc.sideCard}>
          <div style={sc.cardHeader}><span style={sc.cardTitle}>Spend by Category</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {catData.map(({ cat, val }, i) => {
              const max = catData[0]?.val || 1
              const color = CAT_COLORS[cat] || '#7c5cfc'
              return (
                <div key={cat}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 13, color: '#c4c4d4' }}>{cat}</span>
                    <span style={{ fontSize: 12, color: '#9090aa', fontWeight: 500 }}>{fmtMo(val * 12)}</span>
                  </div>
                  <div style={{ height: 5, background: '#1a1a28', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(val / max) * 100}%`, background: `linear-gradient(90deg, ${color}, ${color}aa)`, borderRadius: 3 }} />
                  </div>
                </div>
              )
            })}
            {!catData.length && <div style={{ color: '#3a3a52', fontSize: 13 }}>No data yet.</div>}
          </div>
        </div>
      </div>

      {/* Monthly Spend Trend */}
      <div style={sc.card}>
        <div style={sc.cardHeader}>
          <span style={sc.cardTitle}>Monthly Spend Trend</span>
          <span style={{ fontSize: 11, color: '#3a3a52' }}>Last 6 months · click bar for details</span>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#3a3a52' }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(124,92,252,0.08)' }} />
            <Bar dataKey="spend" radius={[4, 4, 0, 0]}>
              {trend.map((entry, i) => (
                <Cell key={i} fill={i >= trend.length - 2 ? '#7c5cfc' : '#2a2040'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

const sc = {
  page: { padding: '28px 32px', maxWidth: 1300, margin: '0 auto' },
  pageHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 },
  pageTitle: { fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 3 },
  pageSubtitle: { fontSize: 13, color: '#6b6b8a' },
  clock: { fontSize: 13, color: '#6b6b8a', background: '#13131f', border: '1px solid #1e1e30', borderRadius: 6, padding: '5px 12px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 },
  card: { background: '#13131f', borderRadius: 12, border: '1px solid #1e1e30', padding: '18px 20px' },
  bigCard: { flex: '1 1 55%', background: '#13131f', borderRadius: 12, border: '1px solid #1e1e30', padding: '18px 20px' },
  sideCard: { flex: '1 1 40%', background: '#13131f', borderRadius: 12, border: '1px solid #1e1e30', padding: '18px 20px' },
  mainRow: { display: 'flex', gap: 16, marginBottom: 20 },
  statLabel: { fontSize: 10, fontWeight: 700, color: '#4a4a6a', letterSpacing: '0.8px', marginBottom: 10 },
  statValue: { fontWeight: 700, lineHeight: 1, marginBottom: 6 },
  statSub: { fontSize: 12, color: '#4a4a6a' },
  cardHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  cardTitle: { fontSize: 14, fontWeight: 600, color: '#e2e2f0' },
  viewAllBtn: { fontSize: 12, color: '#7c5cfc', background: 'rgba(124,92,252,0.1)', border: '1px solid rgba(124,92,252,0.2)', borderRadius: 6, padding: '4px 10px' },
  renewalRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #1a1a28' },
  dBadge: { width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  renewalName: { fontSize: 13, fontWeight: 600, color: '#e2e2f0', marginBottom: 2 },
  renewalMeta: { fontSize: 11, color: '#6b6b8a' },
  renewalDays: { fontSize: 13, fontWeight: 700 },
  renewalDate: { fontSize: 11, color: '#6b6b8a' },
}
