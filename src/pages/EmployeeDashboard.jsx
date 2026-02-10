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
    </div>
  );
}

export default EmployeeDashboard;
