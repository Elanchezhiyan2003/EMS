import { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import CreateEmployee from '../components/CreateEmployee';
import AdminWorkSubmissions from '../components/AdminWorkSubmissions';
import AdminLeaveManagement from '../components/AdminLeaveManagement';
import { Users, CheckSquare, FileText, LayoutDashboard, Download, Calendar } from 'lucide-react';

function AdminDashboard({ profile, onLogout }) {
  const [activeTab, setActiveTab] = useState('attendance');
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

  /* ---------------- EXPORT CSV ---------------- */

  const handleExportCSV = () => {
    if (filteredRecords.length === 0) return;

    // Define CSV headers
    const headers = ['Employee ID', 'Name', 'Email', 'Date', 'Check In', 'Check Out', 'Work Done'];

    // Map data to CSV rows
    const rows = filteredRecords.map(record => [
      record.profiles.employee_id || '',
      record.profiles.name,
      record.profiles.email,
      record.date,
      record.check_in || '',
      record.check_out || '',
      `"${(record.work_done || '').replace(/"/g, '""')}"` // Escape double quotes
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create export blob
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const TabButton = ({ id, label, icon: Icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${activeTab === id
        ? 'bg-blue-600 text-white shadow-md'
        : 'bg-white text-gray-600 hover:bg-gray-50'
        }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  return (
    <div className="dashboard">
      <div className="dashboard-header glass-panel sticky top-4 z-10">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <LayoutDashboard className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-sm text-gray-500">Welcome, {profile.name}!</p>
          </div>
        </div>
        <button onClick={onLogout} className="btn-danger">
          Logout
        </button>
      </div>

      <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
        <TabButton id="attendance" label="Attendance Records" icon={CheckSquare} />
        <TabButton id="employees" label="Employees" icon={Users} />
        <TabButton id="submissions" label="Work Submissions" icon={FileText} />
        <TabButton id="leaves" label="Leaves" icon={Calendar} />
      </div>

      {activeTab === 'submissions' && (
        <AdminWorkSubmissions />
      )}

      {activeTab === 'leaves' && (
        <AdminLeaveManagement />
      )}

      {activeTab === 'employees' && (
        <div className="employees-section glass-panel p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-500" />
              Employee Management
            </h3>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="btn-primary"
            >
              {showCreateForm ? 'Cancel' : '+ Create New Employee'}
            </button>
          </div>

          {showCreateForm && (
            <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-100">
              <CreateEmployee onEmployeeCreated={handleEmployeeCreated} />
            </div>
          )}

          {message && (
            <div className={`p-3 rounded mb-4 ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {message}
            </div>
          )}

          {employeesLoading ? (
            <div className="text-center p-8 text-gray-500">Loading employees...</div>
          ) : employees.length === 0 ? (
            <p className="text-center p-8 text-gray-500">No employees found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="rounded-l-lg">Employee ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Position</th>
                    <th className="rounded-r-lg">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-white/40 transition">
                      <td>
                        {editingEmployeeId === employee.id ? (
                          <input
                            type="text"
                            value={newEmployeeId}
                            onChange={(e) => setNewEmployeeId(e.target.value)}
                            placeholder="ID"
                            className="w-32 p-1 border rounded"
                          />
                        ) : (
                          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                            {employee.employee_id || 'N/A'}
                          </span>
                        )}
                      </td>
                      <td className="font-medium">{employee.name}</td>
                      <td>{employee.email}</td>
                      <td>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${employee.role === 'admin'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                          }`}>
                          {employee.role}
                        </span>
                      </td>
                      <td>{employee.position || '-'}</td>
                      <td>
                        {editingEmployeeId === employee.id ? (
                          <div className="flex gap-2">
                            <button onClick={() => handleUpdateEmployeeId(employee.id)} className="text-green-600 hover:text-green-900 text-sm font-medium">Save</button>
                            <button onClick={cancelEditing} className="text-gray-500 hover:text-gray-700 text-sm">Cancel</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEditing(employee.id, employee.employee_id)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Edit ID
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="glass-panel p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-green-500" />
              Attendance Records
            </h3>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <input
                type="date"
                name="date"
                value={filters.date}
                onChange={handleFilterChange}
                className="w-full sm:w-auto"
              />
              <input
                type="text"
                name="email"
                value={filters.email}
                onChange={handleFilterChange}
                placeholder="Search by email..."
                className="w-full sm:w-auto"
              />
              <button onClick={clearFilters} className="btn-secondary whitespace-nowrap">
                Clear
              </button>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-4">
            Showing {filteredRecords.length} records
          </p>

          {loading ? (
            <div className="text-center p-8 text-gray-500">Loading records...</div>
          ) : filteredRecords.length === 0 ? (
            <p className="text-center p-8 text-gray-500">No attendance records found matched your filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="rounded-l-lg">Employee</th>
                    <th>Date</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th className="rounded-r-lg">Work Done</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-white/40 transition">
                      <td>
                        <div className="font-medium">{record.profiles.name}</div>
                        <div className="text-xs text-gray-500">{record.profiles.employee_id || record.profiles.email}</div>
                      </td>
                      <td>{record.date}</td>
                      <td>
                        {record.check_in ? (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                            {record.check_in}
                          </span>
                        ) : '-'}
                      </td>
                      <td>
                        {record.check_out ? (
                          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                            {record.check_out}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="max-w-xs truncate" title={record.work_done}>
                        {record.work_done || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;

