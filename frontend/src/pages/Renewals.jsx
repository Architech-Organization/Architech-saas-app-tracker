import { useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { softwareApi } from '../services/api'
import { differenceInDays, parseISO, format } from 'date-fns'
import { Printer, Search } from 'lucide-react'

const daysLeft = d => differenceInDays(parseISO(d), new Date())
const fmtCost = (n, cur) => (cur==='USD'?'US$':'CA$') + Number(n).toLocaleString('en-US',{maximumFractionDigits:0})

function Section({ title, accentColor, items, textColor }) {
  if (!items.length) return null
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
        <div style={{ width:3, height:14, borderRadius:2, background:accentColor }} />
        <span style={{ fontSize:13, fontWeight:700, color:'#1a1a18' }}>{title}</span>
        <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:20, background:`${accentColor}15`, color:accentColor }}>{items.length}</span>
      </div>
      <div style={{ background:'#fff', border:'1px solid #e0dfd8', borderRadius:10, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead><tr>{['Software','Vendor','Owner','Renewal Date','Cost','Days'].map(h=>
            <th key={h} style={{ textAlign:'left', padding:'9px 14px', fontSize:10, color:'#b0afa8', background:'#fafaf8', borderBottom:'1px solid #e0dfd8', textTransform:'uppercase', letterSpacing:'0.8px', fontWeight:700 }}>{h}</th>
          )}</tr></thead>
          <tbody>
            {items.map(sw => {
              const d = daysLeft(sw.renewal_date)
              return (
                <tr key={sw.id}>
                  <td style={{ padding:'10px 14px', borderBottom:'1px solid #f0f0ed', color:'#1a1a18', fontWeight:600 }}>{sw.name}</td>
                  <td style={{ padding:'10px 14px', borderBottom:'1px solid #f0f0ed', color:'#888780' }}>{sw.vendor}</td>
                  <td style={{ padding:'10px 14px', borderBottom:'1px solid #f0f0ed', color:'#888780' }}>{sw.owner_label||'—'}</td>
                  <td style={{ padding:'10px 14px', borderBottom:'1px solid #f0f0ed', color:'#5F5E5A' }}>{format(parseISO(sw.renewal_date),'MMM d, yyyy')}</td>
                  <td style={{ padding:'10px 14px', borderBottom:'1px solid #f0f0ed', color:'#1a1a18', fontWeight:500 }}>{fmtCost(sw.annual_cost,sw.currency)}</td>
                  <td style={{ padding:'10px 14px', borderBottom:'1px solid #f0f0ed', fontWeight:700, color:accentColor }}>{d<0?'Expired':`${d}d`}</td>
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
  const [search, setSearch] = useState('')
  const printRef = useRef()
  const { data: all=[], isLoading } = useQuery({ queryKey:['software'], queryFn:()=>softwareApi.list().then(r=>r.data) })

  const filtered = search ? all.filter(s=>s.name.toLowerCase().includes(search.toLowerCase())||s.vendor.toLowerCase().includes(search.toLowerCase())) : all
  const expired  = filtered.filter(s=>daysLeft(s.renewal_date)<0).sort((a,b)=>new Date(a.renewal_date)-new Date(b.renewal_date))
  const urgent   = filtered.filter(s=>{const d=daysLeft(s.renewal_date);return d>=0&&d<=7}).sort((a,b)=>new Date(a.renewal_date)-new Date(b.renewal_date))
  const soon     = filtered.filter(s=>{const d=daysLeft(s.renewal_date);return d>7&&d<=30}).sort((a,b)=>new Date(a.renewal_date)-new Date(b.renewal_date))
  const upcoming = filtered.filter(s=>daysLeft(s.renewal_date)>30).sort((a,b)=>new Date(a.renewal_date)-new Date(b.renewal_date))

  const handlePrint = () => {
    const win = window.open('','_blank')
    win.document.write(`<html><head><title>LicenseVault — Renewals</title>
    <style>body{font-family:-apple-system,sans-serif;padding:24px;color:#111}h1{font-size:20px;margin-bottom:4px}p{font-size:13px;color:#666;margin-bottom:24px}h2{font-size:13px;margin:20px 0 8px;color:#333;font-weight:700;text-transform:uppercase;letter-spacing:.5px}table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:16px}th{text-align:left;padding:7px 10px;background:#f5f5f3;border-bottom:1px solid #ddd;font-weight:600;font-size:11px}td{padding:7px 10px;border-bottom:1px solid #eee}@media print{body{padding:0}}</style></head>
    <body><h1>LicenseVault — Renewals Report</h1><p>Generated: ${new Date().toLocaleString()} · Architech</p>${printRef.current.innerHTML}</body></html>`)
    win.document.close(); win.print()
  }

  if (isLoading) return <div style={{padding:40,color:'#888780'}}>Loading…</div>

  return (
    <div style={{ padding:'28px 32px' }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, color:'#1a1a18', marginBottom:3 }}>Renewals</h1>
          <p style={{ fontSize:13, color:'#888780' }}>Upcoming & expiring licenses</p>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, background:'#fff', border:'1px solid #e0dfd8', borderRadius:8, padding:'7px 12px' }}>
            <Search size={13} color="#b0afa8"/>
            <input style={{ border:'none', background:'transparent', color:'#1a1a18', fontSize:13, outline:'none', fontFamily:'inherit', width:160 }} placeholder="Search renewals..." value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <button onClick={handlePrint} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:8, background:'#fff', border:'1px solid #e0dfd8', color:'#5F5E5A', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
            <Printer size={13}/> Print
          </button>
          <div style={{ fontSize:12, color:'#888780', background:'#fff', border:'1px solid #e0dfd8', borderRadius:6, padding:'7px 12px' }}>{format(new Date(),'HH:mm')}</div>
        </div>
      </div>
      <div ref={printRef}>
        <Section title="Expired" accentColor="#DC2626" items={expired}/>
        <Section title="Due within 7 days" accentColor="#DC2626" items={urgent}/>
        <Section title="Due within 30 days" accentColor="#D97706" items={soon}/>
        <Section title="Upcoming" accentColor="#5b5ef4" items={upcoming}/>
        {!all.length&&<div style={{color:'#c8c7c0',fontSize:14}}>No software tracked yet.</div>}
      </div>
    </div>
  )
}
