import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { softwareApi } from '../services/api'
import { differenceInDays, parseISO, format } from 'date-fns'
import { Plus, Search, Pencil, Trash2, RefreshCw, X, Download } from 'lucide-react'

const CATEGORIES = ['Development', 'Operations', 'Sales', 'HR', 'Security', 'Collaboration', 'Other']
const BILLING = ['Annual', 'Monthly', 'One-time']
const CURRENCIES = ['CAD', 'USD']

const fmtCost = (n, cur) => (cur === 'USD' ? 'US$' : 'CA$') + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 })
const daysLeft = d => differenceInDays(parseISO(d), new Date())

const exportCSV = (software) => {
  const headers = ['Name','Vendor','Category','Billing','Annual Cost','Currency','Seats','Utilisation %','Owner','Renewal Date','Status','Notes']
  const rows = software.map(sw => [sw.name,sw.vendor,sw.category,sw.billing_cycle,sw.annual_cost,sw.currency||'CAD',sw.seats,sw.utilisation,sw.owner_label||'',sw.renewal_date,sw.status,(sw.notes||'').replace(/,/g,';')])
  const csv = [headers,...rows].map(r=>r.join(',')).join('\n')
  const blob = new Blob([csv],{type:'text/csv'})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href=url; a.download=`licenses-${new Date().toISOString().slice(0,10)}.csv`; a.click()
  URL.revokeObjectURL(url)
}

const CAT_COLORS = {
  Development: { color: '#5b5ef4', bg: '#EEF2FF' },
  Operations: { color: '#0891b2', bg: '#E0F2FE' },
  Sales: { color: '#D97706', bg: '#FFFBEB' },
  HR: { color: '#DB2777', bg: '#FDF2F8' },
  Security: { color: '#059669', bg: '#ECFDF5' },
  Collaboration: { color: '#7C3AED', bg: '#F5F3FF' },
  Other: { color: '#6B7280', bg: '#F9FAFB' },
}

const statusInfo = date => {
  const d = daysLeft(date)
  if (d < 0) return { label: 'Expired', color: '#DC2626', bg: '#FEF2F2' }
  if (d <= 7) return { label: `${d}d`, color: '#DC2626', bg: '#FEF2F2' }
  if (d <= 30) return { label: `${d}d`, color: '#D97706', bg: '#FFFBEB' }
  return { label: 'Active', color: '#059669', bg: '#ECFDF5' }
}

const EMPTY = { name:'',vendor:'',category:'Development',billing_cycle:'Annual',status:'active',annual_cost:'',currency:'CAD',seats:'',utilisation:'',renewal_date:'',owner_label:'',notes:'',contract_url:'' }

export default function SoftwareList() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [renewForm, setRenewForm] = useState({ action:'renewed',new_cost:'',new_renewal_date:'',note:'' })
  const [selectedId, setSelectedId] = useState(null)

  const { data: software=[], isLoading } = useQuery({
    queryKey: ['software',search,catFilter],
    queryFn: () => softwareApi.list({ search:search||undefined, category:catFilter||undefined }).then(r=>r.data),
  })

  const createMut = useMutation({ mutationFn: softwareApi.create, onSuccess: () => { qc.invalidateQueries(['software']); qc.invalidateQueries(['dashboard']); closeModal() } })
  const updateMut = useMutation({ mutationFn: ({id,data}) => softwareApi.update(id,data), onSuccess: () => { qc.invalidateQueries(['software']); qc.invalidateQueries(['dashboard']); closeModal() } })
  const deleteMut = useMutation({ mutationFn: softwareApi.delete, onSuccess: () => { qc.invalidateQueries(['software']); qc.invalidateQueries(['dashboard']) } })
  const renewMut = useMutation({ mutationFn: ({id,data}) => softwareApi.renew(id,data), onSuccess: () => { qc.invalidateQueries(['software']); closeModal() } })

  const openAdd = () => { setForm(EMPTY); setModal('add') }
  const openEdit = sw => { setForm({...sw,currency:sw.currency||'CAD'}); setSelectedId(sw.id); setModal('edit') }
  const openRenew = id => { setSelectedId(id); setRenewForm({action:'renewed',new_cost:'',new_renewal_date:'',note:''}); setModal('renew') }
  const closeModal = () => { setModal(null); setSelectedId(null) }

  const handleSave = e => {
    e.preventDefault()
    const payload = {...form, annual_cost:Number(form.annual_cost), seats:Number(form.seats)||0, utilisation:Number(form.utilisation)||0}
    if (modal==='add') createMut.mutate(payload)
    else updateMut.mutate({id:selectedId, data:payload})
  }

  const handleRenew = e => {
    e.preventDefault()
    renewMut.mutate({id:selectedId, data:{...renewForm, new_cost:renewForm.new_cost?Number(renewForm.new_cost):undefined, new_renewal_date:renewForm.new_renewal_date||undefined}})
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>All Licenses</h1>
          <p style={s.sub}>{software.length} software tracked</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button style={s.btnSec} onClick={() => exportCSV(software)}><Download size={13}/> Export CSV</button>
          <button style={s.btnPrimary} onClick={openAdd}><Plus size={14}/> Add License</button>
        </div>
      </div>

      <div style={s.filterBar}>
        <div style={s.searchBox}>
          <Search size={13} color="#b0afa8"/>
          <input style={s.searchInput} placeholder="Search licenses…" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <div style={s.chips}>
          {['',...CATEGORIES].map(c=>(
            <button key={c} style={{...s.chip,...(catFilter===c?s.chipActive:{})}} onClick={()=>setCatFilter(c)}>{c||'All'}</button>
          ))}
        </div>
      </div>

      {isLoading ? <div style={{padding:40,color:'#888780'}}>Loading…</div> : (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead><tr>{['Software','Category','Seats','Annual Cost','Owner','Renewal','Status',''].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
            <tbody>
              {software.map(sw => {
                const status = statusInfo(sw.renewal_date)
                const cat = CAT_COLORS[sw.category]||CAT_COLORS.Other
                return (
                  <tr key={sw.id} style={s.tr}>
                    <td style={s.td}>
                      <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <div style={{width:32,height:32,borderRadius:8,background:cat.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:cat.color,flexShrink:0}}>{sw.name[0].toUpperCase()}</div>
                        <div>
                          <div style={{fontSize:13,fontWeight:600,color:'#1a1a18'}}>{sw.name}</div>
                          <div style={{fontSize:11,color:'#888780'}}>{sw.vendor}</div>
                        </div>
                      </div>
                    </td>
                    <td style={s.td}><span style={{...s.catPill,background:cat.bg,color:cat.color}}>{sw.category}</span></td>
                    <td style={s.td}><span style={{color:'#5F5E5A',fontSize:13}}>{sw.seats||'Usage'}</span></td>
                    <td style={s.td}>
                      <span style={{fontSize:13,fontWeight:600,color:'#1a1a18'}}>{fmtCost(sw.annual_cost,sw.currency)}</span>
                      <span style={{fontSize:10,color:'#b0afa8',marginLeft:4,background:'#f5f5f3',padding:'1px 5px',borderRadius:4}}>{sw.currency||'CAD'}</span>
                    </td>
                    <td style={s.td}><span style={{color:'#5F5E5A',fontSize:13}}>{sw.owner_label||'—'}</span></td>
                    <td style={s.td}><span style={{color:'#5F5E5A',fontSize:13}}>{format(parseISO(sw.renewal_date),'MMM d, yyyy')}</span></td>
                    <td style={s.td}><span style={{...s.badge,background:status.bg,color:status.color}}>{status.label}</span></td>
                    <td style={s.td}>
                      <div style={{display:'flex',gap:4}}>
                        <button style={s.iconBtn} onClick={()=>openRenew(sw.id)}><RefreshCw size={12}/></button>
                        <button style={s.iconBtn} onClick={()=>openEdit(sw)}><Pencil size={12}/></button>
                        <button style={{...s.iconBtn,color:'#DC2626'}} onClick={()=>{if(confirm(`Delete ${sw.name}?`))deleteMut.mutate(sw.id)}}><Trash2 size={12}/></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {!software.length&&<tr><td colSpan={8} style={{...s.td,textAlign:'center',color:'#c8c7c0',padding:48}}>No licenses yet. <button style={{background:'none',border:'none',color:'#5b5ef4',cursor:'pointer',fontSize:13}} onClick={openAdd}>Add your first →</button></td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {(modal==='add'||modal==='edit'||modal==='renew') && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <span style={s.modalTitle}>{modal==='add'?'Add License':modal==='edit'?'Edit License':'Log Renewal'}</span>
              <button style={s.closeBtn} onClick={closeModal}><X size={16}/></button>
            </div>
            {modal==='renew'?(
              <form onSubmit={handleRenew}>
                <div style={s.modalBody}>
                  <DField label="Action"><select style={s.input} value={renewForm.action} onChange={e=>setRenewForm(f=>({...f,action:e.target.value}))}>{['renewed','renegotiated','cancelled','noted'].map(a=><option key={a}>{a}</option>)}</select></DField>
                  <DField label="New cost (optional)"><input style={s.input} type="number" min={0} value={renewForm.new_cost} onChange={e=>setRenewForm(f=>({...f,new_cost:e.target.value}))}/></DField>
                  <DField label="New renewal date (optional)"><input style={s.input} type="date" value={renewForm.new_renewal_date} onChange={e=>setRenewForm(f=>({...f,new_renewal_date:e.target.value}))}/></DField>
                  <DField label="Note"><textarea style={{...s.input,height:72,resize:'vertical'}} value={renewForm.note} onChange={e=>setRenewForm(f=>({...f,note:e.target.value}))}/></DField>
                </div>
                <div style={s.modalFooter}><button type="button" style={s.btnSec} onClick={closeModal}>Cancel</button><button type="submit" style={s.btnPrimary}>Save</button></div>
              </form>
            ):(
              <form onSubmit={handleSave}>
                <div style={s.modalBody}>
                  <div style={s.row}><DField label="Name" required><input style={s.input} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required/></DField><DField label="Vendor" required><input style={s.input} value={form.vendor} onChange={e=>setForm(f=>({...f,vendor:e.target.value}))} required/></DField></div>
                  <div style={s.row}><DField label="Category"><select style={s.input} value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></DField><DField label="Billing"><select style={s.input} value={form.billing_cycle} onChange={e=>setForm(f=>({...f,billing_cycle:e.target.value}))}>{BILLING.map(b=><option key={b}>{b}</option>)}</select></DField></div>
                  <DField label="Annual cost" required>
                    <div style={{display:'flex',gap:6}}>
                      <select style={{...s.input,width:90,flexShrink:0}} value={form.currency} onChange={e=>setForm(f=>({...f,currency:e.target.value}))}>{CURRENCIES.map(c=><option key={c}>{c}</option>)}</select>
                      <input style={s.input} type="number" min={0} value={form.annual_cost} onChange={e=>setForm(f=>({...f,annual_cost:e.target.value}))} required placeholder="0"/>
                    </div>
                  </DField>
                  <div style={s.row}><DField label="Seats"><input style={s.input} type="number" min={0} value={form.seats} onChange={e=>setForm(f=>({...f,seats:e.target.value}))}/></DField><DField label="Utilisation %"><input style={s.input} type="number" min={0} max={100} value={form.utilisation} onChange={e=>setForm(f=>({...f,utilisation:e.target.value}))}/></DField></div>
                  <div style={s.row}><DField label="Renewal date" required><input style={s.input} type="date" value={form.renewal_date} onChange={e=>setForm(f=>({...f,renewal_date:e.target.value}))} required/></DField><DField label="Owner / team"><input style={s.input} value={form.owner_label} onChange={e=>setForm(f=>({...f,owner_label:e.target.value}))}/></DField></div>
                  <DField label="Notes"><textarea style={{...s.input,height:64,resize:'vertical'}} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/></DField>
                </div>
                <div style={s.modalFooter}><button type="button" style={s.btnSec} onClick={closeModal}>Cancel</button><button type="submit" style={s.btnPrimary}>{modal==='add'?'Add License':'Save Changes'}</button></div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function DField({label,children,required}){return <label style={{display:'flex',flexDirection:'column',gap:5,fontSize:11,fontWeight:700,color:'#888780',letterSpacing:'0.6px',textTransform:'uppercase'}}>{label}{required&&<span style={{color:'#DC2626'}}>*</span>}{children}</label>}

const s = {
  page:{padding:'28px 32px'},
  header:{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:24},
  title:{fontSize:22,fontWeight:700,color:'#1a1a18',marginBottom:3},
  sub:{fontSize:13,color:'#888780'},
  filterBar:{display:'flex',gap:12,alignItems:'center',marginBottom:16,flexWrap:'wrap'},
  searchBox:{display:'flex',alignItems:'center',gap:8,background:'#fff',border:'1px solid #e0dfd8',borderRadius:8,padding:'7px 12px',flex:'0 0 240px'},
  searchInput:{border:'none',outline:'none',fontSize:13,background:'transparent',color:'#1a1a18',fontFamily:'inherit',width:'100%'},
  chips:{display:'flex',gap:6,flexWrap:'wrap'},
  chip:{padding:'5px 12px',borderRadius:20,fontSize:12,border:'1px solid #e0dfd8',background:'#fff',color:'#5F5E5A',fontFamily:'inherit',cursor:'pointer'},
  chipActive:{background:'#EEF2FF',borderColor:'#A5B4FC',color:'#5b5ef4'},
  tableWrap:{background:'#fff',border:'1px solid #e0dfd8',borderRadius:10,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.04)'},
  table:{width:'100%',borderCollapse:'collapse',fontSize:13},
  th:{textAlign:'left',padding:'9px 14px',fontSize:10,color:'#b0afa8',background:'#fafaf8',borderBottom:'1px solid #e0dfd8',textTransform:'uppercase',letterSpacing:'0.8px',fontWeight:700},
  td:{padding:'11px 14px',borderBottom:'1px solid #f0f0ed',verticalAlign:'middle'},
  tr:{},
  catPill:{display:'inline-block',padding:'3px 9px',borderRadius:20,fontSize:11,fontWeight:600},
  badge:{display:'inline-block',padding:'3px 9px',borderRadius:20,fontSize:11,fontWeight:600},
  actions:{display:'flex',gap:4},
  iconBtn:{padding:'4px 6px',border:'1px solid #e0dfd8',borderRadius:5,background:'#fafaf8',cursor:'pointer',color:'#888780',display:'flex',alignItems:'center'},
  overlay:{position:'fixed',inset:0,background:'rgba(0,0,0,0.3)',zIndex:50,display:'flex',alignItems:'center',justifyContent:'center'},
  modal:{background:'#fff',borderRadius:12,border:'1px solid #e0dfd8',width:520,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 8px 32px rgba(0,0,0,0.12)'},
  modalHeader:{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',borderBottom:'1px solid #e0dfd8'},
  modalTitle:{fontSize:15,fontWeight:700,color:'#1a1a18'},
  closeBtn:{background:'none',border:'none',color:'#888780',cursor:'pointer',display:'flex',alignItems:'center'},
  modalBody:{padding:'18px 20px',display:'flex',flexDirection:'column',gap:14},
  modalFooter:{display:'flex',justifyContent:'flex-end',gap:8,padding:'12px 20px',borderTop:'1px solid #e0dfd8'},
  row:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12},
  input:{marginTop:2,padding:'8px 12px',borderRadius:7,border:'1px solid #e0dfd8',background:'#fafaf8',color:'#1a1a18',fontSize:13,outline:'none',fontFamily:'inherit',width:'100%'},
  btnPrimary:{display:'inline-flex',alignItems:'center',gap:6,padding:'8px 16px',borderRadius:8,background:'linear-gradient(135deg,#5b5ef4,#7c5cfc)',color:'#fff',border:'none',fontSize:13,fontWeight:600,fontFamily:'inherit',cursor:'pointer'},
  btnSec:{display:'inline-flex',alignItems:'center',gap:6,padding:'8px 14px',borderRadius:8,background:'#fff',color:'#5F5E5A',border:'1px solid #e0dfd8',fontSize:13,fontFamily:'inherit',cursor:'pointer'},
}
