import { useQuery } from '@tanstack/react-query'
import { softwareApi } from '../services/api'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts'

const fmt = n => '$' + Number(n).toLocaleString('en-US',{maximumFractionDigits:0})
const fmtFull = n => '$' + Number(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})
const CAT_COLORS = ['#5b5ef4','#0891b2','#D97706','#DB2777','#059669','#7C3AED','#6B7280']

const LightTooltip = ({active,payload,label}) => {
  if (!active||!payload?.length) return null
  return <div style={{background:'#fff',border:'1px solid #e0dfd8',borderRadius:8,padding:'8px 12px',fontSize:12,boxShadow:'0 2px 8px rgba(0,0,0,0.08)'}}>{label&&<div style={{color:'#888780',marginBottom:4}}>{label}</div>}{payload.map(p=><div key={p.name} style={{color:'#5b5ef4',fontWeight:600}}>{fmt(p.value)}</div>)}</div>
}

export default function Spend() {
  const { data: dashboard } = useQuery({ queryKey:['dashboard'], queryFn:()=>softwareApi.dashboard().then(r=>r.data) })
  const { data: all=[] } = useQuery({ queryKey:['software'], queryFn:()=>softwareApi.list().then(r=>r.data) })

  const sorted = [...all].sort((a,b)=>b.annual_cost-a.annual_cost)
  const total = all.reduce((s,sw)=>s+Number(sw.annual_cost),0)
  const catData = Object.entries(dashboard?.spend_by_category||{}).map(([name,value])=>({name,value})).filter(x=>x.value>0).sort((a,b)=>b.value-a.value)

  return (
    <div style={{ padding:'28px 32px', maxWidth:1200 }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:700, color:'#1a1a18', marginBottom:3 }}>Spend Analysis</h1>
        <p style={{ fontSize:13, color:'#888780' }}>Full cost breakdown across all licenses</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:20 }}>
        {[
          {label:'TOTAL ANNUAL',value:fmtFull(total),accent:'#5b5ef4'},
          {label:'MONTHLY EQUIV.',value:fmtFull(total/12),accent:'#059669'},
          {label:'AVG PER TOOL',value:all.length?fmt(total/all.length):'—',accent:'#D97706'},
        ].map(({label,value,accent})=>(
          <div key={label} style={{background:'#fff',borderRadius:10,border:'1px solid #e0dfd8',borderTop:`3px solid ${accent}`,padding:'16px 18px',boxShadow:'0 1px 4px rgba(0,0,0,0.04)'}}>
            <div style={{fontSize:10,fontWeight:700,color:'#b0afa8',letterSpacing:'0.8px',marginBottom:8}}>{label}</div>
            <div style={{fontSize:24,fontWeight:700,color:accent}}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
        <div style={{ background:'#fff', border:'1px solid #e0dfd8', borderRadius:10, padding:'18px 20px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize:14, fontWeight:600, color:'#1a1a18', marginBottom:14 }}>Spend by Category</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart><Pie data={catData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={50}>
              {catData.map((_,i)=><Cell key={i} fill={CAT_COLORS[i%CAT_COLORS.length]}/>)}
            </Pie><Tooltip content={<LightTooltip/>}/></PieChart>
          </ResponsiveContainer>
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:8 }}>
            {catData.map(({name,value},i)=>(
              <div key={name} style={{display:'flex',alignItems:'center',gap:8,fontSize:12,color:'#5F5E5A'}}>
                <div style={{width:8,height:8,borderRadius:2,background:CAT_COLORS[i%CAT_COLORS.length],flexShrink:0}}/>
                <span style={{flex:1}}>{name}</span>
                <span style={{fontWeight:600,color:'#1a1a18'}}>{fmt(value)}</span>
                <span style={{color:'#b0afa8',width:36,textAlign:'right'}}>{total?Math.round(value/total*100):0}%</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background:'#fff', border:'1px solid #e0dfd8', borderRadius:10, padding:'18px 20px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize:14, fontWeight:600, color:'#1a1a18', marginBottom:14 }}>Top 8 by Spend</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sorted.slice(0,8)} layout="vertical" margin={{left:4,right:16}}>
              <XAxis type="number" tick={{fontSize:10,fill:'#b0afa8'}} axisLine={false} tickLine={false} tickFormatter={v=>'$'+(v/1000).toFixed(0)+'k'}/>
              <YAxis type="category" dataKey="name" tick={{fontSize:11,fill:'#1a1a18'}} axisLine={false} tickLine={false} width={110}/>
              <Tooltip content={<LightTooltip/>} cursor={{fill:'rgba(91,94,244,0.05)'}}/>
              <Bar dataKey="annual_cost" fill="#5b5ef4" radius={[0,4,4,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background:'#fff', border:'1px solid #e0dfd8', borderRadius:10, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ padding:'12px 16px', borderBottom:'1px solid #e0dfd8', fontSize:14, fontWeight:600, color:'#1a1a18' }}>All software — cost breakdown</div>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead><tr>{['Software','Category','Annual Cost','Seats','Cost/Seat','Billing'].map(h=>
            <th key={h} style={{textAlign:'left',padding:'9px 14px',fontSize:10,color:'#b0afa8',background:'#fafaf8',borderBottom:'1px solid #e0dfd8',textTransform:'uppercase',letterSpacing:'0.8px',fontWeight:700}}>{h}</th>
          )}</tr></thead>
          <tbody>
            {sorted.map(sw=>(
              <tr key={sw.id}>
                <td style={{padding:'10px 14px',borderBottom:'1px solid #f0f0ed',color:'#1a1a18',fontWeight:600}}>{sw.name}</td>
                <td style={{padding:'10px 14px',borderBottom:'1px solid #f0f0ed',color:'#888780'}}>{sw.category}</td>
                <td style={{padding:'10px 14px',borderBottom:'1px solid #f0f0ed',color:'#5b5ef4',fontWeight:700}}>{fmt(sw.annual_cost)}</td>
                <td style={{padding:'10px 14px',borderBottom:'1px solid #f0f0ed',color:'#888780'}}>{sw.seats||'—'}</td>
                <td style={{padding:'10px 14px',borderBottom:'1px solid #f0f0ed',color:'#888780'}}>{sw.seats?fmt(sw.annual_cost/sw.seats):'Usage'}</td>
                <td style={{padding:'10px 14px',borderBottom:'1px solid #f0f0ed',color:'#b0afa8',fontSize:12}}>{sw.billing_cycle}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
