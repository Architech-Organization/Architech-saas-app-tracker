import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

const ROLES = ['viewer','editor','admin']
const ALLOWED_DOMAIN = 'architech.ca'
const roleColor = r => ({admin:{bg:'#EEF2FF',color:'#5b5ef4'},editor:{bg:'#E0F2FE',color:'#0891b2'},viewer:{bg:'#F9FAFB',color:'#6B7280'}}[r]||{})

export default function Users() {
  const { user:me } = useAuth()
  const qc = useQueryClient()
  const [form, setForm] = useState({name:'',email:'',role:'viewer',password:''})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  const { data:users=[] } = useQuery({ queryKey:['users'], queryFn:()=>api.get('/users/').then(r=>r.data) })
  const { data:invites=[], refetch:refetchInvites } = useQuery({ queryKey:['invites'], queryFn:()=>api.get('/users/invites').then(r=>r.data) })

  const roleMut = useMutation({ mutationFn:({id,role})=>api.patch(`/users/${id}/role?role=${role}`), onSuccess:()=>qc.invalidateQueries(['users']) })
  const deleteMut = useMutation({ mutationFn:id=>api.delete(`/users/${id}`), onSuccess:()=>qc.invalidateQueries(['users']) })
  const deleteInviteMut = useMutation({ mutationFn:token=>api.delete(`/users/invites/${token}`), onSuccess:()=>refetchInvites() })
  const resendMut = useMutation({ mutationFn:token=>api.post(`/users/invites/${token}/resend`), onSuccess:(res)=>{ setSuccess(`Invite resent. Link: ${window.location.origin}/register?token=${res.data.token}`); setTimeout(()=>setSuccess(''),8000) } })
  const createMut = useMutation({
    mutationFn:data=>api.post('/users/create',data),
    onSuccess:()=>{ qc.invalidateQueries(['users']); setForm({name:'',email:'',role:'viewer',password:''}); setShowAdd(false); setSuccess('User created!'); setTimeout(()=>setSuccess(''),4000) },
    onError:err=>setError(err.response?.data?.detail||'Failed to create user'),
  })

  const handleCreate = e => {
    e.preventDefault(); setError(''); setSuccess('')
    if (form.email.split('@')[1]!==ALLOWED_DOMAIN) { setError(`Only @${ALLOWED_DOMAIN} emails allowed`); return }
    if (form.password.length<6) { setError('Password must be at least 6 characters'); return }
    createMut.mutate(form)
  }

  return (
    <div style={{ padding:'28px 32px' }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, color:'#1a1a18', marginBottom:3 }}>Users</h1>
          <p style={{ fontSize:13, color:'#888780' }}>Manage team access · Only @{ALLOWED_DOMAIN} emails</p>
        </div>
        <button style={s.btnPrimary} onClick={()=>{ setShowAdd(true); setError(''); setSuccess('') }}>+ Add User</button>
      </div>

      {error&&<div style={s.errorBox}>{error}</div>}
      {success&&<div style={s.successBox}>{success}</div>}

      {showAdd&&(
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.modalHeader}><span style={s.modalTitle}>Add User</span><button style={s.closeBtn} onClick={()=>setShowAdd(false)}>✕</button></div>
            <form onSubmit={handleCreate}>
              <div style={s.modalBody}>
                {error&&<div style={s.errorBox}>{error}</div>}
                <div style={s.row}>
                  <div><label style={s.label}>FULL NAME *</label><input style={s.input} placeholder="Jane Smith" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required/></div>
                  <div><label style={s.label}>EMAIL *</label><input style={s.input} type="email" placeholder={`jane@${ALLOWED_DOMAIN}`} value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} required/></div>
                </div>
                <div style={s.row}>
                  <div><label style={s.label}>ROLE</label><select style={s.input} value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}><option value="viewer">Viewer</option><option value="editor">Editor</option><option value="admin">Admin</option></select></div>
                  <div><label style={s.label}>TEMPORARY PASSWORD *</label><input style={s.input} type="password" placeholder="Min. 6 characters" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} required minLength={6}/></div>
                </div>
                <div style={{ fontSize:12, color:'#888780', background:'#f5f5f3', borderRadius:6, padding:'8px 12px' }}>User logs in with these credentials and can change password from their profile.</div>
              </div>
              <div style={s.modalFooter}><button type="button" style={s.btnSec} onClick={()=>setShowAdd(false)}>Cancel</button><button type="submit" style={s.btnPrimary} disabled={createMut.isPending}>{createMut.isPending?'Creating…':'Save & Send Invite'}</button></div>
            </form>
          </div>
        </div>
      )}

      <div style={{ background:'#fff', border:'1px solid #e0dfd8', borderRadius:10, overflow:'hidden', marginBottom:20, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ padding:'12px 18px', borderBottom:'1px solid #e0dfd8', fontSize:13, fontWeight:600, color:'#1a1a18' }}>Team members ({users.length})</div>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead><tr>{['Name','Email','Role','Joined',''].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
          <tbody>
            {users.map(u=>(
              <tr key={u.id}>
                <td style={s.td}><div style={{display:'flex',alignItems:'center',gap:10}}><div style={{width:30,height:30,borderRadius:'50%',background:'linear-gradient(135deg,#5b5ef4,#7c5cfc)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#fff',flexShrink:0}}>{u.name?.[0]?.toUpperCase()}</div><span style={{color:'#1a1a18',fontWeight:500}}>{u.name} {u.id===me?.id&&<span style={{fontSize:10,color:'#b0afa8'}}>(you)</span>}</span></div></td>
                <td style={s.td}><span style={{color:'#888780'}}>{u.email}</span></td>
                <td style={s.td}>{u.id===me?.id?(<span style={{...s.rolePill,...roleColor(u.role)}}>{u.role}</span>):(<select style={{...s.roleSelect,...roleColor(u.role)}} value={u.role} onChange={e=>roleMut.mutate({id:u.id,role:e.target.value})}>{ROLES.map(r=><option key={r} value={r}>{r}</option>)}</select>)}</td>
                <td style={s.td}><span style={{color:'#b0afa8',fontSize:12}}>{new Date(u.created_at).toLocaleDateString()}</span></td>
                <td style={s.td}>{u.id!==me?.id&&<button style={s.dangerBtn} onClick={()=>{if(confirm(`Remove ${u.name}?`))deleteMut.mutate(u.id)}}>Remove</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {invites.length>0&&(
        <div style={{ background:'#fff', border:'1px solid #e0dfd8', borderRadius:10, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ padding:'12px 18px', borderBottom:'1px solid #e0dfd8', fontSize:13, fontWeight:600, color:'#1a1a18' }}>Pending invites ({invites.length})</div>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead><tr>{['Email','Role','Expires',''].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
            <tbody>
              {invites.map(inv=>(
                <tr key={inv.token}>
                  <td style={s.td}><span style={{color:'#888780'}}>{inv.email}</span></td>
                  <td style={s.td}><span style={{...s.rolePill,...roleColor(inv.role)}}>{inv.role}</span></td>
                  <td style={s.td}><span style={{color:'#b0afa8',fontSize:12}}>{new Date(inv.expires_at).toLocaleDateString()}</span></td>
                  <td style={s.td}><div style={{display:'flex',gap:6}}><button style={s.actionBtn} onClick={()=>resendMut.mutate(inv.token)}>Resend</button><button style={s.dangerBtn} onClick={()=>{if(confirm('Delete invite?'))deleteInviteMut.mutate(inv.token)}}>Delete</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const s = {
  th:{textAlign:'left',padding:'9px 16px',fontSize:10,color:'#b0afa8',background:'#fafaf8',borderBottom:'1px solid #e0dfd8',textTransform:'uppercase',letterSpacing:'0.8px',fontWeight:700},
  td:{padding:'12px 16px',borderBottom:'1px solid #f0f0ed',verticalAlign:'middle'},
  input:{width:'100%',padding:'8px 12px',borderRadius:7,border:'1px solid #e0dfd8',background:'#fafaf8',color:'#1a1a18',fontSize:13,outline:'none',fontFamily:'inherit',marginTop:4},
  label:{fontSize:11,fontWeight:700,color:'#888780',letterSpacing:'0.6px',textTransform:'uppercase'},
  row:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12},
  btnPrimary:{padding:'9px 18px',borderRadius:8,background:'linear-gradient(135deg,#5b5ef4,#7c5cfc)',color:'#fff',border:'none',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'},
  btnSec:{padding:'9px 14px',borderRadius:8,background:'#fff',color:'#5F5E5A',border:'1px solid #e0dfd8',fontSize:13,cursor:'pointer',fontFamily:'inherit'},
  dangerBtn:{padding:'4px 10px',borderRadius:6,background:'#FEF2F2',border:'1px solid #FECACA',color:'#DC2626',fontSize:12,cursor:'pointer',fontFamily:'inherit'},
  actionBtn:{padding:'4px 10px',borderRadius:6,background:'#EEF2FF',border:'1px solid #C7D2FE',color:'#5b5ef4',fontSize:12,cursor:'pointer',fontFamily:'inherit'},
  rolePill:{display:'inline-block',padding:'3px 9px',borderRadius:20,fontSize:11,fontWeight:600},
  roleSelect:{padding:'3px 8px',borderRadius:20,fontSize:11,fontWeight:600,border:'none',cursor:'pointer',fontFamily:'inherit',outline:'none'},
  errorBox:{background:'#FEF2F2',border:'1px solid #FECACA',borderRadius:8,padding:'10px 14px',fontSize:13,color:'#DC2626',marginBottom:16},
  successBox:{background:'#ECFDF5',border:'1px solid #A7F3D0',borderRadius:8,padding:'10px 14px',fontSize:12,color:'#059669',marginBottom:16,wordBreak:'break-all'},
  overlay:{position:'fixed',inset:0,background:'rgba(0,0,0,0.25)',zIndex:50,display:'flex',alignItems:'center',justifyContent:'center'},
  modal:{background:'#fff',borderRadius:12,border:'1px solid #e0dfd8',width:540,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 8px 32px rgba(0,0,0,0.12)'},
  modalHeader:{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',borderBottom:'1px solid #e0dfd8'},
  modalTitle:{fontSize:15,fontWeight:700,color:'#1a1a18'},
  closeBtn:{background:'none',border:'none',color:'#888780',fontSize:16,cursor:'pointer'},
  modalBody:{padding:'20px',display:'flex',flexDirection:'column',gap:14},
  modalFooter:{display:'flex',justifyContent:'flex-end',gap:8,padding:'12px 20px',borderTop:'1px solid #e0dfd8'},
}
