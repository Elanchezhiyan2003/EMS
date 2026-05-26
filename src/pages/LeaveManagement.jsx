import React, { useEffect, useState } from 'react'
import { supabase } from '../supabase/client'
import './leave.css'

export default function LeaveManagement() {
  const [leaves, setLeaves] = useState([])
  const [holidays, setHolidays] = useState([])               // new state
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [yearSummary, setYearSummary] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  // subscribe to realtime changes to reflect employee requests immediately
  useEffect(() => {
    // listen for changes on leaves and holidays so UI updates live
    const ch = supabase
      .channel('leave_holiday_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leaves' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'holidays' }, () => fetchData())
      .subscribe()

    return () => {
      try { supabase.removeChannel(ch) } catch (e) { }
    }
  }, [])

  async function fetchData() {
    setLoading(true)
    const [{ data: leaveData }, { data: holidayData }, { data: profilesData }] = await Promise.all([
      supabase.from('leaves').select('*').order('created_at', { ascending: false }),
      supabase.from('holidays').select('*').order('start_date', { ascending: false }),
      supabase.from('profiles').select('*')
    ])
    setLeaves(leaveData || [])
    setHolidays(holidayData || [])
    setProfiles(profilesData || [])
    setLoading(false)
  }

  // sample public holidays list (ISO YYYY-MM-DD). Replace with real source if available.
  const publicHolidays = [
    // add sample holidays for current year/month
    // '2026-02-21',
  ]

  function includesWeekendOrHoliday(from_date, to_date) {
    try {
      const from = new Date(from_date)
      const to = new Date(to_date)
      for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
        const dow = d.getDay()
        const iso = d.toISOString().split('T')[0]
        if (dow === 0 || dow === 6) return true
        if (publicHolidays.includes(iso)) return true
      }
    } catch (e) { }
    return false
  }

  function getProfile(userId) {
    return profiles.find(p => p.id === userId) || {}
  }

  async function updateStatus(id, status) {
    const ok = window.confirm(`Mark request ${id} as ${status}?`)
    if (!ok) return
    const { error } = await supabase.from('leaves').update({ status }).eq('id', id)
    if (error) return alert('Update failed: ' + error.message)
    fetchData()
  }

  // delete a holiday by id
  async function deleteHoliday(id) {
    const ok = window.confirm('Delete this holiday?')
    if (!ok) return
    const { error } = await supabase.from('holidays').delete().eq('id', id)
    if (error) return alert('Failed to delete holiday: ' + error.message)
    fetchData()
  }

  const counts = {
    total: leaves.length,
    pending: leaves.filter(l => l.status === 'pending').length,
    approved: leaves.filter(l => l.status === 'approved').length,
    denied: leaves.filter(l => l.status === 'denied').length,
    annual: leaves.filter(l => (l.type || '').toLowerCase() === 'annual').length,
    sick: leaves.filter(l => (l.type || '').toLowerCase() === 'sick').length,
    other: leaves.filter(l => {
      const t = (l.type || '').toLowerCase();
      return t !== 'sick' && t !== 'annual'
    }).length
  }

  // find the next month (starting from current) that has any leave; fallback to current month
  function findMonthWithLeaves(startMonthsAhead = 0, maxLookahead = 3) {
    const now = new Date()
    for (let i = startMonthsAhead; i < maxLookahead; i++) {
      const mDate = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const mm = mDate.getMonth()
      const yy = mDate.getFullYear()
      const found = leaves.some(l => {
        if (!l.from_date || !l.to_date) return false
        const from = new Date(l.from_date)
        const to = new Date(l.to_date)
        return (from.getFullYear() === yy && from.getMonth() === mm) ||
               (to.getFullYear() === yy && to.getMonth() === mm) ||
               (from < new Date(yy, mm+1, 1) && to >= new Date(yy, mm, 1))
      })
      if (found) return { month: mm, year: yy }
    }
    // fallback to current month
    const now2 = new Date()
    return { month: now2.getMonth(), year: now2.getFullYear() }
  }

  const target = findMonthWithLeaves(0, 4)
  const upcomingLeaves = leaves.filter(l => {
    if (!l.from_date || !l.to_date) return false
    const from = new Date(l.from_date)
    const to = new Date(l.to_date)
    const mm = target.month
    const yy = target.year
    return (from.getFullYear() === yy && from.getMonth() === mm) ||
           (to.getFullYear() === yy && to.getMonth() === mm) ||
           (from < new Date(yy, mm+1, 1) && to >= new Date(yy, mm, 1))
  }).slice(0,8)

  // holidays for current month (ignore leaves)
  // show all holidays (new ones will appear immediately after fetch)
  const upcomingHolidays = holidays
    .slice()
    .sort((a,b) => new Date(b.start_date) - new Date(a.start_date))
    .slice(0,8)

  // annotated upcoming leaves with weekend/holiday marker
  const upcomingAnnotated = upcomingLeaves.map(l => ({ ...l, hasWeekendOrHoliday: includesWeekendOrHoliday(l.from_date, l.to_date) }))
  // leave counts by type (for small summary)
  const typeCounts = {
    annual: leaves.filter(l => (l.type || '').toLowerCase() === 'annual').length,
    sick: leaves.filter(l => (l.type || '').toLowerCase() === 'sick').length,
    other: leaves.filter(l => { const t = (l.type || '').toLowerCase(); return t !== 'sick' && t !== 'annual' }).length
  }

  // Year summary generator
  function generateYearSummary(year = new Date().getFullYear()) {
    const months = Array.from({ length: 12 }, (_, i) => ({ month: i, count: 0 }))
    leaves.forEach(l => {
      if (!l.from_date || !l.to_date) return
      const from = new Date(l.from_date)
      const to = new Date(l.to_date)
      for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
        if (d.getFullYear() !== year) continue
        months[d.getMonth()].count++
      }
    })
    return months
  }

  const [yearSummaryState, setYearSummaryState] = useState([])

  async function applySpecialLeaveToAll({ type, from_date, to_date, reason }) {
    if (!type || !from_date || !to_date) return alert('Please fill type, from and to dates')
    if (!confirm('Apply this leave to ALL employees?')) return
    const entries = profiles.map(p => ({ user_id: p.id, type, from_date, to_date, reason, status: 'approved', days: null }))
    const { error } = await supabase.from('leaves').insert(entries)
    if (error) return alert('Failed to apply: ' + error.message)
    fetchData()
    alert('Applied to all employees')
  }

  function formatRange(from, to) {
    try {
      const f = new Date(from)
      const t = new Date(to)
      const opts = { day: '2-digit', month: 'short', year: 'numeric' }
      return `${f.toLocaleDateString(undefined, opts)} — ${t.toLocaleDateString(undefined, opts)}`
    } catch (e) { return `${from} - ${to}` }
  }

  // Add a company holiday (stores a single holiday row in `holidays` table)
  async function addHoliday({ from_date, to_date, title = 'Holiday', description = '', days }) {
    if (!from_date || !to_date) return alert('Please provide both from and to dates')
    // compute days if not provided
    let computedDays = days ? Number(days) : null
    if (!computedDays) {
      try {
        const f = new Date(from_date)
        const t = new Date(to_date)
        computedDays = Math.round((t - f) / (1000 * 60 * 60 * 24)) + 1
      } catch (e) { computedDays = null }
    }
    if (!confirm(`Add holiday "${title}" from ${from_date} to ${to_date}? (${computedDays || 'N/A'} days)`)) return

    // try to get current user id (works with supabase v1 and v2 clients)
    let userId = null
    try {
      if (supabase.auth && typeof supabase.auth.getUser === 'function') {
        const u = await supabase.auth.getUser()
        userId = u?.data?.user?.id || null
      } else if (supabase.auth && typeof supabase.auth.user === 'function') {
        const uu = supabase.auth.user()
        userId = uu?.id || null
      }
    } catch (e) { /* ignore */ }

    const payload = {
      start_date: from_date,
      end_date: to_date,
      title,
      description: description || null,
      // omit `days` column; it's generated by the database
      created_by: userId
    }

    const { error } = await supabase.from('holidays').insert([payload])
    if (error) return alert('Failed to add holiday: ' + error.message)

    // refresh data (still pulls leaves/profiles) and notify
    fetchData()
    alert('Holiday added')
  }

  function handleManualHolidaySubmit(e) {
    e.preventDefault()
    const fd = new FormData(e.target)
    addHoliday({
      title: fd.get('reason') || 'Holiday',
      from_date: fd.get('from_date'),
      to_date: fd.get('to_date'),
      days: fd.get('days'),
      description: fd.get('reason')
    })
    e.target.reset()
  }

  return (
    <div className="leave-page">
      <div className="leave-top">
        <h1>Leave Management</h1>
        <p className="leave-sub">Review and action employee leave requests</p>
      </div>

      <div className="leave-cards">
        <div className="lt-card">Total Requests <div className="lt-num">{counts.total}</div></div>
        <div className="lt-card">Annual Leave <div className="lt-num">{counts.annual}</div></div>
        <div className="lt-card">Sick Leave <div className="lt-num">{counts.sick}</div></div>
        <div className="lt-card">Other Leave <div className="lt-num">{counts.other}</div></div>
        <div className="lt-card pending">Pending <div className="lt-num">{counts.pending}</div></div>
      </div>

      <div className="leave-upcoming" style={{display:'flex',gap:16,flexWrap:'wrap'}}>
        {/* left card: add holiday form */}
        <div className="upcoming-box" style={{flex:'1 1 400px'}}>
          <h3>Add Holidays</h3>
          <div className="manual-holiday-row">
            <form className="manual-holiday-form" onSubmit={handleManualHolidaySubmit} style={{display:'flex',flexDirection:'column',gap:8}}>
              <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'nowrap'}}>
                <input name="from_date" type="date" style={{padding:'6px 8px'}}/>
                <input name="to_date" type="date" style={{padding:'6px 8px'}}/>
                <input name="days" placeholder="Days (optional)" style={{width:120,padding:'6px 8px'}}/>
                <input name="reason" placeholder="Reason / Name" style={{padding:'6px 8px',minWidth:180}}/>
              </div>
              <div style={{textAlign:'center'}}>
                <button type="submit" className="btn-apply-all">Add Holiday</button>
              </div>
            </form>
          </div>
        </div>

        {/* right card: upcoming holidays list */}
        <div className="upcoming-box" style={{flex:'1 1 400px'}}>
          <h3>Upcoming Holidays</h3>
          {upcomingHolidays.length > 0 ? (
            <table className="upcoming-table">
              <thead>
                <tr><th>Title</th><th>From</th><th>To</th><th>Days</th><th>Action</th></tr>
              </thead>
              <tbody>
                {upcomingHolidays.map(h => (
                  <tr key={h.id}>
                    <td>{h.title}</td>
                    <td>{h.start_date}</td>
                    <td>{h.end_date || h.start_date}</td>
                    <td>{h.days || '-'}</td>
                    <td><button className="btn-deny" onClick={() => deleteHoliday(h.id)}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted">No holidays this month.</p>
          )}
        </div>
      </div>

      <div className="leave-list">
        <h3>Pending Approvals</h3>
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <table className="leave-table">
            <thead>
              <tr><th>Employee</th><th>Type</th><th>From</th><th>To</th><th>No. of Days</th><th>Reason</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {leaves.map(l => {
                const p = getProfile(l.user_id)
                return (
                  <tr key={l.id} className={l.status === 'pending' ? 'row-pending':''}>
                    <td className="emp-cell">{p.name || 'Unknown'}</td>
                    <td>{l.type}</td>
                    <td>{l.from_date}</td>
                    <td>{l.to_date}</td>
                    <td>{l.days}</td>
                    <td className="reason">{l.reason || '-'}</td>
                    <td className={`status ${l.status}`}>{l.status}</td>
                    <td>
                      {l.status === 'pending' ? (
                        <>
                          <button className="btn-accept" onClick={() => updateStatus(l.id, 'approved')}>Accept</button>
                          <button className="btn-deny" onClick={() => updateStatus(l.id, 'denied')}>Deny</button>
                        </>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
