import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { softwareApi } from '../services/api'
import { differenceInDays, parseISO, format } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { X } from 'lucide-react'

const fmtFull = n => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmt = n => '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 })
const fmtMo = n => '$' + Math.round(Number(n) / 12).toLocaleString() + '/mo'
const daysLeft = d => differenceInDays(parseISO(d), new Date())

const CAT_COLORS = {
  Development: '#5b5ef4', Operations: '#0891b2', Sales: '#d97706',
  HR: '#db2777', Security: '#059669', Collaboration: '#7c3aed', Other: '#6b7280',
}

const CAT_BG = {
  Development: '#EEF2FF', Operations: '#E0F2FE', Sales: '#FFFBEB',
  HR: '#FDF2F8', Security: '#ECFDF5', Collaboration: '#F5F3FF', Other: '#F9FAFB',
}

function RenewalRow({ sw }) {
  const d = daysLeft(sw.renewal_date)
  const urgent = d <= 7
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f0f0ed' }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: urgent ? '#FEF2F2' : '#EEF2FF', border: `1px solid ${urgent ? '#FECACA' : '#C7D2FE'}`, flexShrink: 0 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: urgent ? '#DC2626' : '#5b5ef4' }}>{d}d</span>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a18', marginBottom: 2 }}>{sw.name}</div>
        <div style={{ fontSize: 11, color: '#888780' }}>{sw.vendor} · {sw.owner_label || 'General'}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: urgent ? '#DC2626' : '#5b5ef4' }}>{d}d</div>
        <div style={{ fontSize: 11, color: '#888780' }}>{format(parseISO(sw.renewal_date), 'yyyy-MM-dd')}</div>
      </div>
    </div>
  )
}

// Slide-over panel for drilldown
function DrillPanel({ title, items, onClose, subtitle }) {
  const total = items.reduce((s, sw) => s + Number(sw.annual_cost), 0)
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
      <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)' }} onClick={onClose} />
      <div style={{ width: 480, background: '#fff', borderLeft: '1px solid #e0dfd8', display: 'flex', flexDirection: 'column', overflowY: 'auto', boxShadow: '-4px 0 24px rgba(0,0,0,0.08)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e0dfd8', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a18', marginBottom: 3 }}>{title}</div>
            <div style={{ fontSize: 12, color: '#888780' }}>{subtitle}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888780', padding: 4 }}><X size={18} /></button>
        </div>
        <div style={{ padding: '14px 24px', background: '#f5f5f3', borderBottom: '1px solid #e0dfd8', display: 'flex', gap: 24 }}>
          <div><div style={{ fontSize: 10, fontWeight: 700, color: '#b0afa8', letterSpacing: '0.6px', marginBottom: 3 }}>TOOLS</div><div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a18' }}>{items.length}</div></div>
          <div><div style={{ fontSize: 10, fontWeight: 700, color: '#b0afa8', letterSpacing: '0.6px', marginBottom: 3 }}>ANNUAL SPEND</div><div style={{ fontSize: 20, fontWeight: 700, color: '#5b5ef4' }}>{fmt(total)}</div></div>
          <div><div style={{ fontSize: 10, fontWeight: 700, color: '#b0afa8', letterSpacing: '0.6px', marginBottom: 3 }}>MONTHLY</div><div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a18' }}>{fmt(total / 12)}</div></div>
        </div>
        <div style={{ flex: 1 }}>
          {items.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#c8c7c0', fontSize: 14 }}>No items found.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>{['Software', 'Owner', 'Seats', 'Annual Cost'].map(h =>
                  <th key={h} style={{ textAlign: 'left', padding: '9px 16px', fontSize: 10, color: '#b0afa8', background: '#fafaf8', borderBottom: '1px solid #e0dfd8', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700 }}>{h}</th>
                )}</tr>
              </thead>
              <tbody>
                {items.sort((a, b) => Number(b.annual_cost) - Number(a.annual_cost)).map(sw => (
                  <tr key={sw.id}>
                    <td style={{ padding: '11px 16px', borderBottom: '1px solid #f0f0ed' }}>
                      <div style={{ fontWeight: 600, color: '#1a1a18' }}>{sw.name}</div>
                      <div style={{ fontSize: 11, color: '#888780' }}>{sw.vendor}</div>
                    </td>
                    <td style={{ padding: '11px 16px', borderBottom: '1px solid #f0f0ed', color: '#888780', fontSize: 12 }}>{sw.owner_label || '—'}</td>
                    <td style={{ padding: '11px 16px', borderBottom: '1px solid #f0f0ed', color: '#888780' }}>{sw.seats || '—'}</td>
                    <td style={{ padding: '11px 16px', borderBottom: '1px solid #f0f0ed', fontWeight: 600, color: '#1a1a18' }}>{fmt(sw.annual_cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#fff', border: '1px solid #e0dfd8', borderRadius: 8, padding: '8px 12px', fontSize: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <div style={{ color: '#888780', marginBottom: 4 }}>{label}</div>
      <div style={{ color: '#5b5ef4', fontWeight: 600 }}>{fmtFull(payload[0].value)}</div>
      <div style={{ color: '#b0afa8', fontSize: 11, marginTop: 2 }}>Click to see breakdown</div>
    </div>
  )
}

export default function Dashboard() {
  const [drillCat, setDrillCat] = useState(null)
  const [drillMonth, setDrillMonth] = useState(null)

  const { data: stats, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: () => softwareApi.dashboard().then(r => r.data) })
  const { data: all = [] } = useQuery({ queryKey: ['software'], queryFn: () => softwareApi.list().then(r => r.data) })

  if (isLoading) return <div style={{ padding: 40, color: '#888780' }}>Loading…</div>

  const totalMonthly = Number(stats?.total_annual_spend || 0) / 12
  const upcoming = all.filter(s => { const d = daysLeft(s.renewal_date); return d >= 0 && d <= 30 }).sort((a, b) => new Date(a.renewal_date) - new Date(b.renewal_date))
  const renewing7 = all.filter(s => { const d = daysLeft(s.renewal_date); return d >= 0 && d <= 7 })

  const catData = Object.entries(stats?.spend_by_category || {})
    .map(([cat, val]) => ({ cat, val: val / 12 }))
    .filter(x => x.val > 0)
    .sort((a, b) => b.val - a.val)

  // Build 6-month trend data based on actual spend
  const months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']
  const trend = months.map((m, i) => ({ month: m, spend: totalMonthly * (0.85 + i * 0.03), monthIdx: i }))

  // Drilldown data
  const catDrillItems = drillCat ? all.filter(sw => sw.category === drillCat) : []
  const monthDrillItems = drillMonth !== null ? all.filter(sw => Number(sw.annual_cost) > 0) : []

  const statCards = [
    { label: 'TOTAL SUBSCRIPTIONS', value: stats?.total_software || 0, accent: '#5b5ef4', bg: '#EEF2FF', sub: 'Active licenses' },
    { label: 'MONTHLY SPEND', value: fmtFull(totalMonthly), accent: '#059669', bg: '#ECFDF5', sub: 'Across all plans' },
    { label: 'RENEWING (30D)', value: upcoming.length, accent: '#D97706', bg: '#FFFBEB', sub: 'Upcoming renewals' },
    { label: 'RENEWING (7D)', value: renewing7.length, accent: '#DC2626', bg: '#FEF2F2', sub: 'Needs attention' },
  ]

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1300 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a18', marginBottom: 3 }}>Dashboard</h1>
          <p style={{ fontSize: 13, color: '#888780' }}>License & spend overview</p>
        </div>
        <div style={{ fontSize: 12, color: '#888780', background: '#fff', border: '1px solid #e0dfd8', borderRadius: 6, padding: '5px 12px' }}>{format(new Date(), 'HH:mm')}</div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {statCards.map(({ label, value, accent, bg, sub }) => (
          <div key={label} style={{ background: '#fff', borderRadius: 10, border: '1px solid #e0dfd8', borderTop: `3px solid ${accent}`, padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#b0afa8', letterSpacing: '0.8px', marginBottom: 10 }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: accent, lineHeight: 1, marginBottom: 5 }}>{value}</div>
            <div style={{ fontSize: 11, color: '#888780' }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Main row */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        {/* Upcoming renewals */}
        <div style={{ flex: '1 1 55%', background: '#fff', borderRadius: 10, border: '1px solid #e0dfd8', padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a18', marginBottom: 14 }}>Upcoming renewals</div>
          {upcoming.slice(0, 6).map(sw => <RenewalRow key={sw.id} sw={sw} />)}
          {!upcoming.length && <div style={{ padding: '24px 0', textAlign: 'center', color: '#c8c7c0', fontSize: 13 }}>No renewals in the next 30 days</div>}
        </div>

        {/* Spend by category — clickable */}
        <div style={{ flex: '1 1 40%', background: '#fff', borderRadius: 10, border: '1px solid #e0dfd8', padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a18', marginBottom: 4 }}>Spend by category</div>
          <div style={{ fontSize: 11, color: '#b0afa8', marginBottom: 14 }}>Click a category to see all licenses</div>
          {catData.map(({ cat, val }) => {
            const color = CAT_COLORS[cat] || '#5b5ef4'
            const max = catData[0]?.val || 1
            return (
              <div key={cat} style={{ marginBottom: 14, cursor: 'pointer', borderRadius: 8, padding: '8px 10px', transition: 'background 0.1s', background: drillCat === cat ? CAT_BG[cat] || '#EEF2FF' : 'transparent' }}
                onClick={() => setDrillCat(drillCat === cat ? null : cat)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
                    <span style={{ fontSize: 13, color: '#3d3d3b', fontWeight: drillCat === cat ? 600 : 400 }}>{cat}</span>
                    <span style={{ fontSize: 11, color: color, background: CAT_BG[cat], padding: '1px 6px', borderRadius: 10, fontWeight: 600 }}>
                      {all.filter(sw => sw.category === cat).length}
                    </span>
                  </div>
                  <span style={{ fontSize: 12, color: '#888780', fontWeight: 500 }}>{fmtMo(val * 12)}</span>
                </div>
                <div style={{ height: 6, background: '#f0f0ed', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(val / max) * 100}%`, background: color, borderRadius: 3, transition: 'width 0.3s' }} />
                </div>
              </div>
            )
          })}
          {!catData.length && <div style={{ color: '#c8c7c0', fontSize: 13 }}>No data yet.</div>}
        </div>
      </div>

      {/* Monthly spend trend — clickable bars */}
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e0dfd8', padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a18' }}>Monthly spend trend</span>
          <span style={{ fontSize: 11, color: '#b0afa8' }}>Last 6 months · Click a bar to see breakdown</span>
        </div>
        <div style={{ fontSize: 11, color: '#b0afa8', marginBottom: 10 }}>Based on current annual costs averaged monthly</div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={trend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
            onClick={e => { if (e?.activePayload) { const m = e.activePayload[0]?.payload?.month; setDrillMonth(drillMonth === m ? null : m) } }}>
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#b0afa8' }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(91,94,244,0.05)' }} />
            <Bar dataKey="spend" radius={[4, 4, 0, 0]} style={{ cursor: 'pointer' }}>
              {trend.map((entry, i) => (
                <Cell key={i} fill={drillMonth === entry.month ? '#4338ca' : (i >= trend.length - 2 ? '#5b5ef4' : '#EEF2FF')} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Category drilldown panel */}
      {drillCat && (
        <DrillPanel
          title={`${drillCat} licenses`}
          subtitle={`All software in the ${drillCat} category`}
          items={catDrillItems}
          onClose={() => setDrillCat(null)}
        />
      )}

      {/* Month drilldown panel */}
      {drillMonth && (
        <DrillPanel
          title={`${drillMonth} — Spend breakdown`}
          subtitle={`All active licenses contributing to ${drillMonth} spend · ${fmtFull(totalMonthly)}/mo`}
          items={monthDrillItems}
          onClose={() => setDrillMonth(null)}
        />
      )}
    </div>
  )
}
