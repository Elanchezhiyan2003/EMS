import { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import CreateEmployee from '../components/CreateEmployee';

function AdminDashboard({ profile, onLogout }) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [editingEmployeeId, setEditingEmployeeId] = useState(null);
  const [newEmployeeId, setNewEmployeeId] = useState('');
  const [message, setMessage] = useState('');
  const [filters, setFilters] = useState({ date: '', email: '' });

  /* ---------------- FETCH FUNCTIONS ---------------- */

  const fetchAllAttendance = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          profiles (
            employee_id,
            name,
            email
          )
        `)
        .order('date', { ascending: false });

      if (error) throw error;

      setAttendanceRecords(data);
      setFilteredRecords(data);
    } catch (err) {
      console.error('Error fetching attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSingleAttendance = async (id) => {
    const { data, error } = await supabase
      .from('attendance')
      .select(`
        *,
        profiles (
          employee_id,
          name,
          email
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching single attendance:', error);
      return null;
    }

    return data;
  };

  const fetchAllEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setEmployees(data);
    } catch (err) {
      console.error('Error fetching employees:', err);
    } finally {
      setEmployeesLoading(false);
    }
  };

  /* ---------------- INITIAL LOAD ---------------- */

  useEffect(() => {
    fetchAllAttendance();
    fetchAllEmployees();
  }, []);

  /* ---------------- REALTIME (IMPORTANT PART) ---------------- */

  useEffect(() => {
    const channel = supabase
      .channel('attendance-admin-live')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'attendance',
        },
        async (payload) => {
          console.log('🟢 Attendance INSERT realtime:', payload.new);

          const fullRecord = await fetchSingleAttendance(payload.new.id);
          if (!fullRecord) return;

          setAttendanceRecords((prev) => [fullRecord, ...prev]);
          setFilteredRecords((prev) => [fullRecord, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'attendance',
        },
        async (payload) => {
          console.log('🟡 Attendance UPDATE realtime:', payload.new);

          const fullRecord = await fetchSingleAttendance(payload.new.id);
          if (!fullRecord) return;

          setAttendanceRecords((prev) =>
            prev.map((r) => (r.id === fullRecord.id ? fullRecord : r))
          );

          setFilteredRecords((prev) =>
            prev.map((r) => (r.id === fullRecord.id ? fullRecord : r))
          );
        }
      )
      .subscribe((status) => {
        console.log('Realtime status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /* ---------------- FILTER LOGIC ---------------- */

  useEffect(() => {
    let filtered = [...attendanceRecords];

    if (filters.date) {
      filtered = filtered.filter((r) => r.date === filters.date);
    }

    if (filters.email) {
      filtered = filtered.filter((r) =>
        r.profiles.email.toLowerCase().includes(filters.email.toLowerCase())
      );
    }

    setFilteredRecords(filtered);
  }, [filters, attendanceRecords]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const clearFilters = () => {
    setFilters({ date: '', email: '' });
  };

  /* ---------------- EMPLOYEE ID UPDATE ---------------- */

  const handleUpdateEmployeeId = async (userId) => {
    setMessage('');
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ employee_id: newEmployeeId })
        .eq('id', userId);

      if (error) throw error;

      setMessage('Employee ID updated successfully!');
      setEditingEmployeeId(null);
      setNewEmployeeId('');
      fetchAllEmployees();
    } catch (err) {
      setMessage('Error: ' + err.message);
    }
  };

  const startEditing = (userId, currentEmployeeId) => {
    setEditingEmployeeId(userId);
    setNewEmployeeId(currentEmployeeId || '');
    setMessage('');
  };

  const cancelEditing = () => {
    setEditingEmployeeId(null);
    setNewEmployeeId('');
    setMessage('');
  };

  const handleEmployeeCreated = () => {
    fetchAllEmployees();
    setShowCreateForm(false);
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Welcome, {profile.name}!</p>
        </div>
        <button onClick={onLogout} className="btn-logout">
          Logout
        </button>
      </div>

      <div className="employees-section">
        <div className="section-header">
          <h3>Employee Management</h3>
          <button 
            onClick={() => setShowCreateForm(!showCreateForm)} 
            className="btn-primary"
            style={{ padding: '10px 20px', width: 'auto' }}
          >
            {showCreateForm ? 'Cancel' : '+ Create New Employee'}
          </button>
        </div>

        {showCreateForm && (
          <CreateEmployee onEmployeeCreated={handleEmployeeCreated} />
        )}

        {message && (
          <div className={message.includes('Error') ? 'error-message' : 'success-message'}>
            {message}
          </div>
        )}
        {employeesLoading ? (
          <div className="loading">Loading employees...</div>
        ) : employees.length === 0 ? (
          <p>No employees found.</p>
        ) : (
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Position</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id}>
                  <td>
                    {editingEmployeeId === employee.id ? (
                      <input
                        type="text"
                        value={newEmployeeId}
                        onChange={(e) => setNewEmployeeId(e.target.value)}
                        placeholder="Enter Employee ID"
                        style={{ padding: '5px', width: '150px' }}
                      />
                    ) : (
                      employee.employee_id || <span style={{ color: '#999' }}>Not assigned</span>
                    )}
                  </td>
                  <td>{employee.name}</td>
                  <td>{employee.email}</td>
                  <td>
                    <span className={`role-badge role-${employee.role}`}>
                      {employee.role}
                    </span>
                  </td>
                  <td>
                    {employee.position || <span style={{ color: '#999' }}>Not specified</span>}
                  </td>
                  <td>
                    {editingEmployeeId === employee.id ? (
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button
                          onClick={() => handleUpdateEmployeeId(employee.id)}
                          className="btn-save"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="btn-cancel"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEditing(employee.id, employee.employee_id)}
                        className="btn-edit"
                      >
                        {employee.employee_id ? 'Edit ID' : 'Assign ID'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="filters-section">
        <h3>Filter Attendance Records</h3>
        <div className="filters-container">
          <div className="form-group">
            <label>Filter by Date</label>
            <input
              type="date"
              name="date"
              value={filters.date}
              onChange={handleFilterChange}
            />
          </div>

          <div className="form-group">
            <label>Filter by Email</label>
            <input
              type="text"
              name="email"
              value={filters.email}
              onChange={handleFilterChange}
              placeholder="Enter employee email"
            />
          </div>

          <button onClick={clearFilters} className="btn-secondary">
            Clear Filters
          </button>
        </div>
      </div>

      <div className="attendance-section">
        <h3>All Employee Attendance Records</h3>
        <p className="record-count">
          Showing {filteredRecords.length} of {attendanceRecords.length} records
        </p>
        
        {loading ? (
          <div className="loading">Loading records...</div>
        ) : filteredRecords.length === 0 ? (
          <p>No attendance records found.</p>
        ) : (
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Employee Name</th>
                <th>Email</th>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Work Done</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => (
                <tr key={record.id}>
                  <td>{record.profiles.employee_id || '-'}</td>
                  <td>{record.profiles.name}</td>
                  <td>{record.profiles.email}</td>
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

export default AdminDashboard;

