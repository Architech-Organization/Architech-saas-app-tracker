import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import api from '../services/api'

export default function Notifications() {
  const [settings, setSettings] = useState({ enabled:false, reminder_days:[7,30,90], notify_emails:[], smtp_host:'', smtp_port:587, smtp_user:'', smtp_password:'', from_email:'', from_name:'LicenseVault' })
  const [emailInput, setEmailInput] = useState('')
  const [testEmail, setTestEmail] = useState('')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [testMsg, setTestMsg] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.get('/notifications/settings').then(r=>{ setSettings(s=>({...s,...r.data})); setLoading(false) }).catch(()=>setLoading(false)) }, [])

  const saveMut = useMutation({ mutationFn:()=>api.post('/notifications/settings',settings), onSuccess:()=>{setSaved(true);setTimeout(()=>setSaved(false),3000)}, onError:err=>setError(err.response?.data?.detail||'Save failed') })
  const testMut = useMutation({ mutationFn:()=>api.post('/notifications/test',{to_email:testEmail}), onSuccess:()=>setTestMsg('Test email sent!'), onError:err=>setTestMsg(err.response?.data?.detail||'Failed') })
  const sendNowMut = useMutation({ mutationFn:()=>api.post('/notifications/send-reminders'), onSuccess:()=>setTestMsg('Reminders sent!'), onError:err=>setTestMsg(err.response?.data?.detail||'Failed') })

  const toggleDay = d => setSettings(s=>({...s,reminder_days:s.reminder_days.includes(d)?s.reminder_days.filter(x=>x!==d):[...s.reminder_days,d].sort((a,b)=>a-b)}))
  const addEmail = () => { const e=emailInput.trim().toLowerCase(); if(!e||settings.notify_emails.includes(e))return; setSettings(s=>({...s,notify_emails:[...s.notify_emails,e]})); setEmailInput('') }
  const removeEmail = e => setSettings(s=>({...s,notify_emails:s.notify_emails.filter(x=>x!==e)}))

  if (loading) return <div style={{padding:40,color:'#888780'}}>Loading…</div>

  return (
    <div style={{padding:'28px 32px',maxWidth:660}}>
      <div style={{marginBottom:24}}><h1 style={{fontSize:22,fontWeight:700,color:'#1a1a18',marginBottom:3}}>Notifications</h1><p style={{fontSize:13,color:'#888780'}}>Configure email renewal reminders</p></div>

      {error&&<div style={s.errBox}>{error}</div>}
      {saved&&<div style={s.okBox}>Settings saved!</div>}
      {testMsg&&<div style={testMsg.includes('sent')||testMsg.includes('success')?s.okBox:s.errBox}>{testMsg}</div>}

      <div style={s.card}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div><div style={s.cardTitle}>Email notifications</div><div style={s.cardSub}>Send automatic renewal reminders</div></div>
          <button onClick={()=>setSettings(s=>({...s,enabled:!s.enabled}))} style={{width:44,height:24,borderRadius:12,border:'none',cursor:'pointer',background:settings.enabled?'#5b5ef4':'#e0dfd8',position:'relative',flexShrink:0}}>
            <div style={{width:18,height:18,borderRadius:'50%',background:'#fff',position:'absolute',top:3,left:settings.enabled?23:3,transition:'left 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}/>
          </button>
        </div>
      </div>

      <div style={s.card}>
        <div style={s.cardTitle}>Reminder schedule</div>
        <div style={s.cardSub}>Send when a license is this many days from renewal</div>
        <div style={{display:'flex',gap:8,marginTop:12,flexWrap:'wrap'}}>
          {[7,14,30,60,90].map(d=>(
            <button key={d} onClick={()=>toggleDay(d)} style={{padding:'6px 16px',borderRadius:20,fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:'inherit',border:'1px solid',background:settings.reminder_days.includes(d)?'#EEF2FF':'#fff',color:settings.reminder_days.includes(d)?'#5b5ef4':'#888780',borderColor:settings.reminder_days.includes(d)?'#A5B4FC':'#e0dfd8'}}>{d} days</button>
          ))}
        </div>
      </div>

      <div style={s.card}>
        <div style={s.cardTitle}>Notify these emails</div>
        <div style={s.cardSub}>Reminders will be sent to all addresses below</div>
        <div style={{display:'flex',gap:8,marginTop:12}}>
          <input style={{...s.input,flex:1}} type="email" placeholder="email@architech.ca" value={emailInput} onChange={e=>setEmailInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&(e.preventDefault(),addEmail())}/>
          <button style={s.btnSec} onClick={addEmail}>Add</button>
        </div>
        {settings.notify_emails.length>0&&<div style={{marginTop:10,display:'flex',flexWrap:'wrap',gap:6}}>{settings.notify_emails.map(e=>(
          <div key={e} style={{display:'flex',alignItems:'center',gap:6,background:'#f5f5f3',border:'1px solid #e0dfd8',borderRadius:20,padding:'4px 12px',fontSize:12}}>
            <span style={{color:'#1a1a18'}}>{e}</span>
            <button onClick={()=>removeEmail(e)} style={{background:'none',border:'none',color:'#b0afa8',cursor:'pointer',fontSize:14,padding:0,lineHeight:1}}>×</button>
          </div>
        ))}</div>}
      </div>

      <div style={s.card}>
        <div style={s.cardTitle}>SMTP configuration</div>
        <div style={s.cardSub}>Use Gmail (smtp.gmail.com:587) or Microsoft 365 (smtp.office365.com:587)</div>
        <div style={{display:'flex',flexDirection:'column',gap:12,marginTop:14}}>
          <div style={s.row}><div><label style={s.label}>SMTP HOST</label><input style={s.input} placeholder="smtp.office365.com" value={settings.smtp_host} onChange={e=>setSettings(s=>({...s,smtp_host:e.target.value}))}/></div><div><label style={s.label}>PORT</label><input style={s.input} type="number" value={settings.smtp_port} onChange={e=>setSettings(s=>({...s,smtp_port:Number(e.target.value)}))}/></div></div>
          <div style={s.row}><div><label style={s.label}>USERNAME</label><input style={s.input} placeholder="your@email.com" value={settings.smtp_user} onChange={e=>setSettings(s=>({...s,smtp_user:e.target.value}))}/></div><div><label style={s.label}>PASSWORD</label><input style={s.input} type="password" placeholder="App password" value={settings.smtp_password} onChange={e=>setSettings(s=>({...s,smtp_password:e.target.value}))}/></div></div>
          <div style={s.row}><div><label style={s.label}>FROM EMAIL</label><input style={s.input} placeholder="noreply@architech.ca" value={settings.from_email} onChange={e=>setSettings(s=>({...s,from_email:e.target.value}))}/></div><div><label style={s.label}>FROM NAME</label><input style={s.input} placeholder="LicenseVault" value={settings.from_name} onChange={e=>setSettings(s=>({...s,from_name:e.target.value}))}/></div></div>
        </div>
      </div>

      <div style={{display:'flex',gap:10,marginBottom:20}}>
        <button style={s.btnPrimary} onClick={()=>saveMut.mutate()} disabled={saveMut.isPending}>{saveMut.isPending?'Saving…':'Save settings'}</button>
        <button style={s.btnSec} onClick={()=>sendNowMut.mutate()} disabled={sendNowMut.isPending}>{sendNowMut.isPending?'Sending…':'Send reminders now'}</button>
      </div>

      <div style={s.card}>
        <div style={s.cardTitle}>Send test email</div>
        <div style={s.cardSub}>Verify your SMTP settings work</div>
        <div style={{display:'flex',gap:8,marginTop:12}}>
          <input style={{...s.input,flex:1}} type="email" placeholder="your@email.com" value={testEmail} onChange={e=>setTestEmail(e.target.value)}/>
          <button style={s.btnSec} onClick={()=>{setTestMsg('');testMut.mutate()}} disabled={testMut.isPending||!testEmail}>{testMut.isPending?'Sending…':'Send test'}</button>
        </div>
      </div>
    </div>
  )
}

const s={
  card:{background:'#fff',border:'1px solid #e0dfd8',borderRadius:10,padding:'18px 20px',marginBottom:14,boxShadow:'0 1px 4px rgba(0,0,0,0.04)'},
  cardTitle:{fontSize:14,fontWeight:600,color:'#1a1a18',marginBottom:3},
  cardSub:{fontSize:12,color:'#888780'},
  row:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12},
  label:{display:'block',fontSize:11,fontWeight:700,color:'#888780',letterSpacing:'0.6px',textTransform:'uppercase',marginBottom:5},
  input:{width:'100%',padding:'8px 12px',borderRadius:7,border:'1px solid #e0dfd8',background:'#fafaf8',color:'#1a1a18',fontSize:13,outline:'none',fontFamily:'inherit'},
  btnPrimary:{padding:'9px 18px',borderRadius:8,background:'linear-gradient(135deg,#5b5ef4,#7c5cfc)',color:'#fff',border:'none',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'},
  btnSec:{padding:'9px 14px',borderRadius:8,background:'#fff',color:'#5F5E5A',border:'1px solid #e0dfd8',fontSize:13,cursor:'pointer',fontFamily:'inherit'},
  errBox:{background:'#FEF2F2',border:'1px solid #FECACA',borderRadius:8,padding:'10px 14px',fontSize:13,color:'#DC2626',marginBottom:14},
  okBox:{background:'#ECFDF5',border:'1px solid #A7F3D0',borderRadius:8,padding:'10px 14px',fontSize:13,color:'#059669',marginBottom:14},
}
