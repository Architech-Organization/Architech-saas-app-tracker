import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { softwareApi } from '../services/api'
import { differenceInDays, parseISO, format } from 'date-fns'

const CATEGORIES = ['Development', 'Operations', 'Sales', 'HR', 'Security', 'Collaboration', 'Other']
const BILLING = ['Annual', 'Monthly', 'One-time']
const fmt = n => '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 })
const daysLeft = d => differenceInDays(parseISO(d), new Date())

const CAT_COLORS = {
  Development: '#7c5cfc', Operations: '#06b6d4', Sales: '#f59e0b',
  HR: '#ec4899', Security: '#10b981', Collaboration: '#8b5cf6', Other: '#6b7280',
}

const statusInfo = date => {
  const d = daysLeft(date)
  if (d < 0) return { label: 'Expired', color: '#f87171', bg: 'rgba(239,68,68,0.12)' }
  if (d <= 7) return { label: `${d}d`, color: '#f87171', bg: 'rgba(239,68,68,0.12)' }
  if (d <= 30) return { label: `${d}d`, color: '#fbbf24', bg: 'rgba(245,158,11,0.12)' }
  return { label: 'Active', color: '#34d399', bg: 'rgba(16,185,129,0.12)' }
}

const EMPTY = { name: '', vendor: '', category: 'Development', billing_cycle: 'Annual', status: 'active', annual_cost: '', seats: '', utilisation: '', renewal_date: '', owner_label: '', notes: '', contract_url: '' }

export default function SoftwareList() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [renewForm, setRenewForm] = useState({ action: 'renewed', new_cost: '', new_renewal_date: '', note: '' })
  const [selectedId, setSelectedId] = useState(null)

  const { data: software = [], isLoading } = useQuery({
    queryKey: ['software', search, catFilter],
    queryFn: () => softwareApi.list({ search: search || undefined, category: catFilter || undefined }).then(r => r.data),
  })

  const createMut = useMutation({ mutationFn: softwareApi.create, onSuccess: () => { qc.invalidateQueries(['software']); qc.invalidateQueries(['dashboard']); closeModal() } })
  const updateMut = useMutation({ mutationFn: ({ id, data }) => softwareApi.update(id, data), onSuccess: () => { qc.invalidateQueries(['software']); qc.invalidateQueries(['dashboard']); closeModal() } })
  const deleteMut = useMutation({ mutationFn: softwareApi.delete, onSuccess: () => { qc.invalidateQueries(['software']); qc.invalidateQueries(['dashboard']) } })
  const renewMut = useMutation({ mutationFn: ({ id, data }) => softwareApi.renew(id, data), onSuccess: () => { qc.invalidateQueries(['software']); closeModal() } })

  const openAdd = () => { setForm(EMPTY); setModal('add') }
  const openEdit = sw => { setForm({ ...sw, annual_cost: sw.annual_cost, seats: sw.seats, utilisation: sw.utilisation, renewal_date: sw.renewal_date }); setSelectedId(sw.id); setModal('edit') }
  const openRenew = id => { setSelectedId(id); setRenewForm({ action: 'renewed', new_cost: '', new_renewal_date: '', note: '' }); setModal('renew') }
  const closeModal = () => { setModal(null); setSelectedId(null) }

  const handleSave = e => {
    e.preventDefault()
    const payload = { ...form, annual_cost: Number(form.annual_cost), seats: Number(form.seats) || 0, utilisation: Number(form.utilisation) || 0 }
    if (modal === 'add') createMut.mutate(payload)
    else updateMut.mutate({ id: selectedId, data: payload })
  }

  const handleRenew = e => {
    e.preventDefault()
    const payload = { ...renewForm, new_cost: renewForm.new_cost ? Number(renewForm.new_cost) : undefined, new_renewal_date: renewForm.new_renewal_date || undefined }
    renewMut.mutate({ id: selectedId, data: payload })
  }

  const isOpen = modal === 'add' || modal === 'edit' || modal === 'renew'

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>All Licenses</h1>
          <p style={s.subtitle}>{software.length} software tracked</p>
        </div>
        <button style={s.btnPrimary} onClick={openAdd}>+ Add License</button>
      </div>

      {/* Filters */}
      <div style={s.filterBar}>
        <div style={s.searchBox}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b6b8a" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input style={s.searchInput} placeholder="Search licenses…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={s.chips}>
          {['', ...CATEGORIES].map(c => (
            <button key={c} style={{ ...s.chip, ...(catFilter === c ? s.chipActive : {}) }} onClick={() => setCatFilter(c)}>
              {c || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? <div style={s.loading}>Loading…</div> : (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>{['Software', 'Category', 'Seats', 'Annual Cost', 'Owner', 'Renewal', 'Status', ''].map(h =>
                <th key={h} style={s.th}>{h}</th>
              )}</tr>
            </thead>
            <tbody>
              {software.map(sw => {
                const status = statusInfo(sw.renewal_date)
                const catColor = CAT_COLORS[sw.category] || '#6b7280'
                return (
                  <tr key={sw.id} style={s.tr}>
                    <td style={s.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${catColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: catColor, flexShrink: 0 }}>
                          {sw.name[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e2f0' }}>{sw.name}</div>
                          <div style={{ fontSize: 11, color: '#6b6b8a' }}>{sw.vendor}</div>
                        </div>
                      </div>
                    </td>
                    <td style={s.td}><span style={{ ...s.catPill, background: `${catColor}18`, color: catColor, border: `1px solid ${catColor}30` }}>{sw.category}</span></td>
                    <td style={s.td}><span style={s.tdText}>{sw.seats || 'Usage'}</span></td>
                    <td style={s.td}><span style={{ ...s.tdText, fontWeight: 600 }}>{fmt(sw.annual_cost)}</span></td>
                    <td style={s.td}><span style={s.tdText}>{sw.owner_label || '—'}</span></td>
                    <td style={s.td}><span style={s.tdText}>{format(parseISO(sw.renewal_date), 'MMM d, yyyy')}</span></td>
                    <td style={s.td}><span style={{ ...s.badge, background: status.bg, color: status.color }}>{status.label}</span></td>
                    <td style={s.td}>
                      <div style={s.actions}>
                        <button style={s.actionBtn} title="Log renewal" onClick={() => openRenew(sw.id)}>↻</button>
                        <button style={s.actionBtn} title="Edit" onClick={() => openEdit(sw)}>✎</button>
                        <button style={{ ...s.actionBtn, color: '#f87171' }} title="Delete" onClick={() => { if (confirm(`Delete ${sw.name}?`)) deleteMut.mutate(sw.id) }}>✕</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {!software.length && (
                <tr><td colSpan={8} style={{ ...s.td, textAlign: 'center', color: '#3a3a52', padding: 48 }}>
                  No licenses yet. <button style={{ background: 'none', border: 'none', color: '#7c5cfc', cursor: 'pointer', fontSize: 13 }} onClick={openAdd}>Add your first →</button>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal overlay */}
      {isOpen && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <span style={s.modalTitle}>
                {modal === 'add' ? 'Add License' : modal === 'edit' ? 'Edit License' : 'Log Renewal'}
              </span>
              <button style={s.closeBtn} onClick={closeModal}>✕</button>
            </div>

            {modal === 'renew' ? (
              <form onSubmit={handleRenew}>
                <div style={s.modalBody}>
                  <DField label="Action"><select style={s.input} value={renewForm.action} onChange={e => setRenewForm(f => ({ ...f, action: e.target.value }))}>
                    {['renewed', 'renegotiated', 'cancelled', 'noted'].map(a => <option key={a}>{a}</option>)}
                  </select></DField>
                  <DField label="New cost (optional)"><input style={s.input} type="number" min={0} value={renewForm.new_cost} onChange={e => setRenewForm(f => ({ ...f, new_cost: e.target.value }))} /></DField>
                  <DField label="New renewal date (optional)"><input style={s.input} type="date" value={renewForm.new_renewal_date} onChange={e => setRenewForm(f => ({ ...f, new_renewal_date: e.target.value }))} /></DField>
                  <DField label="Note"><textarea style={{ ...s.input, height: 72, resize: 'vertical' }} value={renewForm.note} onChange={e => setRenewForm(f => ({ ...f, note: e.target.value }))} /></DField>
                </div>
                <div style={s.modalFooter}>
                  <button type="button" style={s.btnSecondary} onClick={closeModal}>Cancel</button>
                  <button type="submit" style={s.btnPrimary}>Save</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSave}>
                <div style={s.modalBody}>
                  <div style={s.row}>
                    <DField label="Software name" required><input style={s.input} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></DField>
                    <DField label="Vendor" required><input style={s.input} value={form.vendor} onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))} required /></DField>
                  </div>
                  <div style={s.row}>
                    <DField label="Category"><select style={s.input} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></DField>
                    <DField label="Billing"><select style={s.input} value={form.billing_cycle} onChange={e => setForm(f => ({ ...f, billing_cycle: e.target.value }))}>{BILLING.map(b => <option key={b}>{b}</option>)}</select></DField>
                  </div>
                  <div style={s.row}>
                    <DField label="Annual cost (CAD)" required><input style={s.input} type="number" min={0} value={form.annual_cost} onChange={e => setForm(f => ({ ...f, annual_cost: e.target.value }))} required /></DField>
                    <DField label="Seats"><input style={s.input} type="number" min={0} value={form.seats} onChange={e => setForm(f => ({ ...f, seats: e.target.value }))} /></DField>
                  </div>
                  <div style={s.row}>
                    <DField label="Renewal date" required><input style={s.input} type="date" value={form.renewal_date} onChange={e => setForm(f => ({ ...f, renewal_date: e.target.value }))} required /></DField>
                    <DField label="Utilisation %"><input style={s.input} type="number" min={0} max={100} value={form.utilisation} onChange={e => setForm(f => ({ ...f, utilisation: e.target.value }))} /></DField>
                  </div>
                  <DField label="Owner / team"><input style={s.input} value={form.owner_label} onChange={e => setForm(f => ({ ...f, owner_label: e.target.value }))} /></DField>
                  <DField label="Contract URL"><input style={s.input} type="url" value={form.contract_url} onChange={e => setForm(f => ({ ...f, contract_url: e.target.value }))} /></DField>
                  <DField label="Notes"><textarea style={{ ...s.input, height: 72, resize: 'vertical' }} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></DField>
                </div>
                <div style={s.modalFooter}>
                  <button type="button" style={s.btnSecondary} onClick={closeModal}>Cancel</button>
                  <button type="submit" style={s.btnPrimary}>{modal === 'add' ? 'Add License' : 'Save Changes'}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function DField({ label, children, required }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 11, fontWeight: 700, color: '#4a4a6a', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
      {label}{required && <span style={{ color: '#f87171' }}>*</span>}
      {children}
    </label>
  )
}

const s = {
  page: { padding: '28px 32px' },
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 3 },
  subtitle: { fontSize: 13, color: '#6b6b8a' },
  loading: { padding: 40, color: '#6b6b8a', fontSize: 14 },
  filterBar: { display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' },
  searchBox: { display: 'flex', alignItems: 'center', gap: 8, background: '#13131f', border: '1px solid #1e1e30', borderRadius: 8, padding: '8px 12px', flex: '0 0 240px' },
  searchInput: { border: 'none', outline: 'none', fontSize: 13, background: 'transparent', color: '#e2e2f0', fontFamily: 'inherit', width: '100%' },
  chips: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  chip: { padding: '5px 12px', borderRadius: 20, fontSize: 12, border: '1px solid #1e1e30', background: '#13131f', color: '#6b6b8a', fontFamily: 'inherit' },
  chipActive: { background: 'rgba(124,92,252,0.15)', borderColor: 'rgba(124,92,252,0.4)', color: '#c4b5fd' },
  tableWrap: { background: '#13131f', border: '1px solid #1e1e30', borderRadius: 12, overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { textAlign: 'left', padding: '10px 16px', fontSize: 10, color: '#3a3a52', background: '#0d0d14', borderBottom: '1px solid #1a1a28', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700 },
  td: { padding: '12px 16px', borderBottom: '1px solid #1a1a28', verticalAlign: 'middle' },
  tr: {},
  tdText: { fontSize: 13, color: '#9090aa' },
  catPill: { display: 'inline-block', padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600 },
  badge: { display: 'inline-block', padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600 },
  actions: { display: 'flex', gap: 4 },
  actionBtn: { padding: '4px 8px', border: '1px solid #1e1e30', borderRadius: 6, background: '#1a1a28', color: '#9090aa', fontSize: 14 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modal: { background: '#13131f', borderRadius: 14, border: '1px solid #2a2a40', width: 540, maxHeight: '90vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid #1e1e30' },
  modalTitle: { fontSize: 15, fontWeight: 700, color: '#fff' },
  closeBtn: { background: 'none', border: 'none', color: '#6b6b8a', fontSize: 16 },
  modalBody: { padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '14px 22px', borderTop: '1px solid #1e1e30' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  input: { marginTop: 2, padding: '8px 12px', borderRadius: 8, border: '1px solid #1e1e30', background: '#0d0d14', color: '#e2e2f0', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%' },
  btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 8, background: 'linear-gradient(135deg, #7c5cfc, #6b4ef5)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' },
  btnSecondary: { padding: '9px 16px', borderRadius: 8, background: '#1a1a28', color: '#9090aa', border: '1px solid #2a2a40', fontSize: 13, fontFamily: 'inherit' },
}
