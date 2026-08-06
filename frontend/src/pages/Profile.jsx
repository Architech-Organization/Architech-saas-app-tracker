import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function Profile() {
  const { user, logout } = useAuth()
  const qc = useQueryClient()
  const [name, setName] = useState(user?.name||'')
  const [pwd, setPwd] = useState({current:'',new:'',confirm:''})
  const [nameMsg, setNameMsg] = useState('')
  const [pwdMsg, setPwdMsg] = useState('')
  const [pwdErr, setPwdErr] = useState('')

  const nameMut = useMutation({ mutationFn:()=>api.patch('/users/me',{name}), onSuccess:()=>{ setNameMsg('Name updated!'); qc.invalidateQueries(['me']) } })
  const pwdMut = useMutation({ mutationFn:()=>api.post('/users/me/password',{current_password:pwd.current,new_password:pwd.new}), onSuccess:()=>{ setPwdMsg('Password updated!'); setPwd({current:'',new:'',confirm:''}) }, onError:err=>setPwdErr(err.response?.data?.detail||'Failed') })

  const handlePwd = e => {
    e.preventDefault(); setPwdErr(''); setPwdMsg('')
    if (pwd.new!==pwd.confirm){setPwdErr('Passwords do not match');return}
    if (pwd.new.length<6){setPwdErr('Min. 6 characters');return}
    pwdMut.mutate()
  }
  const roleColor={admin:'#5b5ef4',editor:'#0891b2',viewer:'#6B7280'}

  return (
    <div style={{padding:'28px 32px',maxWidth:520}}>
      <div style={{marginBottom:24}}><h1 style={{fontSize:22,fontWeight:700,color:'#1a1a18',marginBottom:3}}>My Profile</h1><p style={{fontSize:13,color:'#888780'}}>Manage your account</p></div>

      <div style={{background:'#fff',border:'1px solid #e0dfd8',borderRadius:10,padding:20,marginBottom:14,display:'flex',alignItems:'center',gap:16,boxShadow:'0 1px 4px rgba(0,0,0,0.04)'}}>
        <div style={{width:52,height:52,borderRadius:'50%',background:'linear-gradient(135deg,#5b5ef4,#7c5cfc)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:700,color:'#fff',flexShrink:0}}>{user?.name?.[0]?.toUpperCase()}</div>
        <div>
          <div style={{fontSize:16,fontWeight:600,color:'#1a1a18'}}>{user?.name}</div>
          <div style={{fontSize:13,color:'#888780'}}>{user?.email}</div>
          <span style={{fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:20,background:`${roleColor[user?.role]}15`,color:roleColor[user?.role],marginTop:4,display:'inline-block'}}>{user?.role}</span>
        </div>
      </div>

      <div style={{background:'#fff',border:'1px solid #e0dfd8',borderRadius:10,padding:20,marginBottom:14,boxShadow:'0 1px 4px rgba(0,0,0,0.04)'}}>
        <div style={{fontSize:14,fontWeight:600,color:'#1a1a18',marginBottom:12}}>Display name</div>
        <div style={{display:'flex',gap:8}}>
          <input style={s.input} value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"/>
          <button style={s.btnPrimary} onClick={()=>{setNameMsg('');nameMut.mutate()}} disabled={nameMut.isPending}>Save</button>
        </div>
        {nameMsg&&<div style={{fontSize:12,color:'#059669',marginTop:8}}>{nameMsg}</div>}
      </div>

      <div style={{background:'#fff',border:'1px solid #e0dfd8',borderRadius:10,padding:20,marginBottom:14,boxShadow:'0 1px 4px rgba(0,0,0,0.04)'}}>
        <div style={{fontSize:14,fontWeight:600,color:'#1a1a18',marginBottom:12}}>Change password</div>
        {pwdErr&&<div style={s.errBox}>{pwdErr}</div>}
        {pwdMsg&&<div style={{fontSize:12,color:'#059669',marginBottom:10}}>{pwdMsg}</div>}
        <form onSubmit={handlePwd} style={{display:'flex',flexDirection:'column',gap:10}}>
          {[['Current password','current'],['New password','new'],['Confirm new password','confirm']].map(([label,key])=>(
            <div key={key}><label style={s.label}>{label.toUpperCase()}</label><input style={s.input} type="password" value={pwd[key]} onChange={e=>setPwd(p=>({...p,[key]:e.target.value}))} required/></div>
          ))}
          <button type="submit" style={s.btnPrimary} disabled={pwdMut.isPending}>{pwdMut.isPending?'Updating…':'Update password'}</button>
        </form>
      </div>

      <button onClick={logout} style={{width:'100%',padding:'10px',borderRadius:8,background:'#FEF2F2',border:'1px solid #FECACA',color:'#DC2626',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:'inherit'}}>Sign out</button>
    </div>
  )
}
const s={label:{display:'block',fontSize:11,fontWeight:700,color:'#888780',letterSpacing:'0.6px',textTransform:'uppercase',marginBottom:5},input:{width:'100%',padding:'8px 12px',borderRadius:7,border:'1px solid #e0dfd8',background:'#fafaf8',color:'#1a1a18',fontSize:13,outline:'none',fontFamily:'inherit'},btnPrimary:{padding:'9px 18px',borderRadius:8,background:'linear-gradient(135deg,#5b5ef4,#7c5cfc)',color:'#fff',border:'none',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'},errBox:{background:'#FEF2F2',border:'1px solid #FECACA',borderRadius:8,padding:'10px 14px',fontSize:13,color:'#DC2626',marginBottom:12}}
