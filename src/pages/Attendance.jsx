import React, { useEffect, useState } from 'react'
import { supabase } from '../supabase/client'
import './attendance.css'

export default function Attendance() {
  const [profiles, setProfiles] = useState([])
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [profileOpen, setProfileOpen] = useState(false)

  useEffect(() => {
    fetchData()
    // subscribe to realtime changes so modal updates when employees check in/out
    const ch = supabase
      .channel('attendance_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => fetchData())
      .subscribe()

    return () => {
      try { supabase.removeChannel(ch) } catch (e) { /* ignore */ }
    }
  }, [])

  async function fetchData() {
    setLoading(true)
    const { data: profilesData } = await supabase.from('profiles').select('*')
    const { data: attData } = await supabase.from('attendance').select('*')

    setProfiles(profilesData || [])
    setAttendance(attData || [])
    setLoading(false)
  }

  // compute simple percent present for month/year per user
  const today = new Date()
  const month = today.getMonth()
  const year = today.getFullYear()

  function calcStatsFor(userId) {
    const userRecords = attendance.filter(a => a.user_id === userId)
    const monthRecords = userRecords.filter(r => new Date(r.date).getMonth() === month && new Date(r.date).getFullYear() === year)
    const yearRecords = userRecords.filter(r => new Date(r.date).getFullYear() === year)

    // naive percent based on recorded days / possible days (assume 22 workdays/month, 260/year)
    const monthPct = Math.round((monthRecords.length / 22) * 100) || 0
    const yearPct = Math.round((yearRecords.length / 260) * 100) || 0
    return { monthPct: Math.min(monthPct, 100), yearPct: Math.min(yearPct, 100), days: userRecords.length }
  }

  if (loading) return <div className="attendance-loading">Loading attendance...</div>

  return (
    <div className="attendance-page">
      <div className="attendance-top">
        <h1>Attendance</h1>
        <p className="attendance-sub">Overview of employee attendance and quick actions</p>
      </div>

      <div className="attendance-cards">
        {profiles.map(p => {
          const stats = calcStatsFor(p.id)
          return (
            <div className="att-card" key={p.id}>
              <div className="att-avatar">
                <img src={`https://ui-avatars.com/api/?name=${p.name}&background=random`} alt="avatar" />
              </div>
                <div className="att-info-vertical">
                  <h4 className="att-name">{p.name}</h4>
                <div className="att-role">{p.position || 'Employee'}</div>
                <div className="att-badges">
                  <div className="badge month">{stats.monthPct}% <span>Month</span></div>
                  <div className="badge year">{stats.yearPct}% <span>Year</span></div>
                </div>
                <button className="profile-btn" onClick={() => { setSelectedProfile(p); setProfileOpen(true) }}>Reports</button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="attendance-list">
        <h3>Attendance List</h3>
        <table className="att-table">
          <thead>
  <tr>
    <th>ID</th>
    <th>Name</th>
    <th>Position</th>
    <th>Date</th>
    <th>Check In</th>
    <th>Check Out</th>
    <th>Task</th>
    <th>Description</th>
    <th>Time Spent</th>
    <th>File</th>
  </tr>
</thead>
          <tbody>
            {attendance.map((r) => {
              const profile = profiles.find(p => p.id === r.user_id) || {}
              return (
                <tr key={r.id}>
                  <td>{profile.employee_id || '-'}</td>
                  <td className="name-cell">{profile.name || 'Unknown'}</td>
                  <td>{profile.position || '-'}</td>
                  
                  <td>{r.date}</td>
<td>{r.check_in || '-'}</td>
<td>{r.check_out || '-'}</td>

<td>{r.task_title || '-'}</td>
<td>{r.description || '-'}</td>
<td>{r.time_spent || '-'}</td>

<td>
  {r.file_url ? (
    <a href={r.file_url} target="_blank" rel="noopener noreferrer">
      📎 View
    </a>
  ) : '-'}
</td>

<td>
  <button
    className="view-btn"
    onClick={() => { setSelectedProfile(profile); setProfileOpen(true) }}
  >
    View
  </button>
</td>
                  
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

    {/* Profile Modal */}
    {profileOpen && selectedProfile && (
      <div className="profile-modal-overlay" onClick={() => setProfileOpen(false)}>
        <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
          <div className="profile-head">
            <img src={`https://ui-avatars.com/api/?name=${selectedProfile.name}&background=random`} alt="avatar" />
            <div>
              <h2>{selectedProfile.name}</h2>
              <div className="profile-position">{selectedProfile.position || '-'}</div>
              <div className="profile-email">{selectedProfile.email}</div>
            </div>
          </div>

          <div className="profile-work">
            <h3>Daily Work Reports</h3>
            <div className="work-list">
              {attendance.filter(a => a.user_id === selectedProfile.id).length === 0 && (
                <p className="muted">No work reports yet.</p>
              )}
              {attendance
  .filter(a => a.user_id === selectedProfile.id)
  .map(w => (
    <div className="work-item" key={w.id}>

      <div className="work-date">
        <strong>Date:</strong> {w.date}
      </div>

      <div className="work-times">
        <strong>Time:</strong> {w.check_in || '-'} → {w.check_out || '-'}
      </div>

      <div>
        <strong>Task:</strong> {w.task_title || '-'}
      </div>

      <div>
        <strong>Description:</strong> {w.description || '-'}
      </div>

      <div>
        <strong>Time Spent:</strong> {w.time_spent || '-'}
      </div>

      {w.file_url && (
        <div>
          <strong>File:</strong>{' '}
          <a
            href={w.file_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            📎 View Uploaded File
          </a>
        </div>
      )}

      <hr />
    </div>
))}
            </div>
          </div>

          <div className="profile-actions">
            <button onClick={() => setProfileOpen(false)} className="btn-close">Close</button>
          </div>
        </div>
      </div>
    )}
    </div>
  )
}
