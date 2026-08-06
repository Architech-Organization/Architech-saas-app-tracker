import { useQuery } from '@tanstack/react-query'
import api from '../services/api'
import { format, parseISO } from 'date-fns'

export default function AuditLog() {
  const { data:software=[] } = useQuery({ queryKey:['software'], queryFn:()=>api.get('/software/').then(r=>r.data) })
  const events = software.flatMap(sw=>(sw.renewal_history||[]).map(h=>({software:sw.name,action:h.action,note:h.note,prev_cost:h.previous_cost,new_cost:h.new_cost,performed_at:h.performed_at}))).sort((a,b)=>new Date(b.performed_at)-new Date(a.performed_at))
  const actionColor = a=>({renewed:'#059669',renegotiated:'#0891b2',cancelled:'#DC2626',noted:'#7C3AED'}[a]||'#6B7280')
  const actionBg = a=>({renewed:'#ECFDF5',renegotiated:'#E0F2FE',cancelled:'#FEF2F2',noted:'#F5F3FF'}[a]||'#F9FAFB')

  return (
    <div style={{padding:'28px 32px'}}>
      <div style={{marginBottom:24}}>
        <h1 style={{fontSize:22,fontWeight:700,color:'#1a1a18',marginBottom:3}}>Audit Log</h1>
        <p style={{fontSize:13,color:'#888780'}}>All renewal and change events</p>
      </div>
      <div style={{background:'#fff',border:'1px solid #e0dfd8',borderRadius:10,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.04)'}}>
        {!events.length?(<div style={{padding:48,textAlign:'center',color:'#c8c7c0',fontSize:14}}>No audit events yet. Renewal actions will appear here.</div>):(
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
            <thead><tr>{['Date','Software','Action','Cost change','Note'].map(h=><th key={h} style={{textAlign:'left',padding:'9px 16px',fontSize:10,color:'#b0afa8',background:'#fafaf8',borderBottom:'1px solid #e0dfd8',textTransform:'uppercase',letterSpacing:'0.8px',fontWeight:700}}>{h}</th>)}</tr></thead>
            <tbody>{events.map((e,i)=>(
              <tr key={i}>
                <td style={{padding:'10px 16px',borderBottom:'1px solid #f0f0ed',color:'#888780',fontSize:12,whiteSpace:'nowrap'}}>{format(parseISO(e.performed_at),'MMM d, yyyy HH:mm')}</td>
                <td style={{padding:'10px 16px',borderBottom:'1px solid #f0f0ed',color:'#1a1a18',fontWeight:600}}>{e.software}</td>
                <td style={{padding:'10px 16px',borderBottom:'1px solid #f0f0ed'}}><span style={{padding:'3px 9px',borderRadius:20,fontSize:11,fontWeight:600,background:actionBg(e.action),color:actionColor(e.action)}}>{e.action}</span></td>
                <td style={{padding:'10px 16px',borderBottom:'1px solid #f0f0ed',color:'#888780',fontSize:12}}>{e.prev_cost!=null&&e.new_cost!=null?`$${e.prev_cost} → $${e.new_cost}`:'—'}</td>
                <td style={{padding:'10px 16px',borderBottom:'1px solid #f0f0ed',color:'#888780',fontSize:12}}>{e.note||'—'}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  )
}
