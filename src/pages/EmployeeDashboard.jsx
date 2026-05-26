import { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import CheckInOut from '../components/CheckInOut';

function EmployeeDashboard({ user, profile, onLogout }) {
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch employee's attendance history
  const fetchAttendanceHistory = async () => {
    console.log("Fetching attendance history for user:", user.id);
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;

      setAttendanceHistory(data);
    } catch (err) {
      console.error('Error fetching attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceHistory();
  }, [user.id]);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Employee Dashboard</h1>
          <p>Welcome, {profile.name}!</p>
        </div>
        <button onClick={onLogout} className="btn-logout">
          Logout
        </button>
      </div>

      <CheckInOut userId={user.id} onCheck={fetchAttendanceHistory} />

      <div className="attendance-section">
        <h3>My Attendance History</h3>
        {loading ? (
          <div className="loading">Loading history...</div>
        ) : attendanceHistory.length === 0 ? (
          <p>No attendance records yet.</p>
        ) : (
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Work Done</th>
              </tr>
            </thead>
            <tbody>
              {attendanceHistory.map((record) => (
                <tr key={record.id}>
                  <td>{record.date}</td>
                  <td>{record.check_in || '-'}</td>
                  <td>{record.check_out || '-'}</td>
                  <td>{record.work_done || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="leave-request-section" style={{marginTop:24}}>
        <h3>Request Leave</h3>
        <form className="leave-request-form" onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const payload = {
            user_id: user.id,
            type: fd.get('type') || 'Annual',
            from_date: fd.get('from_date'),
            to_date: fd.get('to_date'),
            days: fd.get('days') ? Number(fd.get('days')) : null,
            reason: fd.get('reason'),
            status: 'pending'
          };
          try {
            const { error } = await supabase.from('leaves').insert([payload]);
            if (error) throw error;
            alert('Leave request submitted');
            e.target.reset();
          } catch (err) {
            console.error('Failed to submit leave:', err);
            alert('Failed to submit leave: ' + (err.message || err.error || err));
          }
        }} style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
          <select name="type" defaultValue="Annual" style={{padding:'6px 8px'}}>
            <option>Annual</option>
            <option>Sick</option>
            <option>Other</option>
          </select>
          <input name="from_date" type="date" required style={{padding:'6px 8px'}} />
          <input name="to_date" type="date" required style={{padding:'6px 8px'}} />
          <input name="days" placeholder="Days (optional)" style={{width:120,padding:'6px 8px'}} />
          <input name="reason" placeholder="Reason" style={{minWidth:200,padding:'6px 8px'}} />
          <button type="submit" className="btn-apply-all" style={{marginLeft:6}}>Request Leave</button>
        </form>
      </div>
    </div>
  );
}

export default EmployeeDashboard;
