import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabase/client';
import CreateEmployee from '../components/CreateEmployee';
import AdminWorkSubmissions from '../components/AdminWorkSubmissions';
import AdminLeaveManagement from '../components/AdminLeaveManagement';
import {
  Users, CheckSquare, FileText, LayoutDashboard,
  Download, Calendar, LogOut, Search, Plus, X
} from 'lucide-react';

function AdminDashboard({ profile, onLogout }) {
  /* ---------------- STATE ---------------- */
  const [activeTab, setActiveTab] = useState('attendance');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [editingEmployeeId, setEditingEmployeeId] = useState(null);
  const [newEmployeeId, setNewEmployeeId] = useState('');
  const [message, setMessage] = useState('');
  const [filters, setFilters] = useState({ date: '', email: '' });

  /* ---------------- DATA FETCHING ---------------- */
  const fetchAllAttendance = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select(`*, profiles ( employee_id, name, email )`)
        .order('date', { ascending: false });
      if (error) throw error;
      setAttendanceRecords(data);
    } catch (err) {
      console.error('Error fetching attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      setEmployees(data);
    } catch (err) {
      console.error('Error fetching employees:', err);
    } finally {
      setEmployeesLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAttendance();
    fetchAllEmployees();
  }, []);

  /* ---------------- LOGIC HANDLERS ---------------- */
  const filteredRecords = useMemo(() => {
    return attendanceRecords.filter(r => {
      const matchDate = !filters.date || r.date === filters.date;
      const matchEmail = !filters.email || r.profiles?.email?.toLowerCase().includes(filters.email.toLowerCase());
      return matchDate && matchEmail;
    });
  }, [attendanceRecords, filters]);

  const handleExportCSV = () => {
    if (filteredRecords.length === 0) return;
    const headers = ['Employee ID', 'Name', 'Email', 'Date', 'Check In', 'Check Out', 'Work Done'];
    const rows = filteredRecords.map(record => [
      record.profiles?.employee_id || '',
      record.profiles?.name || '',
      record.profiles?.email || '',
      record.date,
      record.check_in || '',
      record.check_out || '',
      `"${(record.work_done || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleUpdateEmployeeId = async (userId) => {
    setMessage('');
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ employee_id: newEmployeeId })
        .eq('id', userId);

      if (error) throw error;
      setMessage('✅ Employee ID updated successfully!');
      setEditingEmployeeId(null);
      setNewEmployeeId('');
      fetchAllEmployees();
    } catch (err) {
      setMessage('❌ Error: ' + err.message);
    }
  };

  /* ---------------- RENDER HELPERS ---------------- */
  const renderAttendanceTable = () => (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search email..."
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-64 text-sm"
              value={filters.email}
              onChange={(e) => setFilters({ ...filters, email: e.target.value })}
            />
          </div>
          <input
            type="date"
            className="px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={filters.date}
            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
          />
          {(filters.date || filters.email) && (
            <button
              onClick={() => setFilters({ date: '', email: '' })}
              className="text-sm text-gray-500 hover:text-blue-600 font-medium"
            >
              Clear
            </button>
          )}
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-medium shadow-sm"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 text-gray-400 text-xs uppercase tracking-wider">
              <th className="px-4 py-4 font-semibold">Employee</th>
              <th className="px-4 py-4 font-semibold">Date</th>
              <th className="px-4 py-4 font-semibold">Time Log</th>
              <th className="px-4 py-4 font-semibold">Work Summary</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan="4" className="text-center py-10 text-gray-400">Loading records...</td></tr>
            ) : filteredRecords.length === 0 ? (
              <tr><td colSpan="4" className="text-center py-10 text-gray-400">No records found matching filters.</td></tr>
            ) : (
              filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-4">
                    <p className="font-bold text-gray-800">{record.profiles?.name || 'Unknown'}</p>
                    <p className="text-xs text-gray-500">{record.profiles?.employee_id || record.profiles?.email}</p>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">{record.date}</td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-bold border border-green-100">
                        IN: {record.check_in || '--:--'}
                      </span>
                      <span className="px-2 py-1 bg-gray-50 text-gray-600 rounded text-xs font-bold border border-gray-100">
                        OUT: {record.check_out || '--:--'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500 max-w-xs truncate" title={record.work_done}>
                    {record.work_done || <span className="text-gray-300 italic">No notes provided</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderEmployeesTable = () => (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-bold text-gray-800">Staff Management</h3>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium text-sm ${showCreateForm ? 'bg-gray-100 text-gray-600' : 'bg-blue-600 text-white shadow-blue-200 shadow-lg'}`}
        >
          {showCreateForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showCreateForm ? 'Cancel' : 'Register New Employee'}
        </button>
      </div>

      {showCreateForm && (
        <div className="mb-8 p-6 bg-blue-50/30 rounded-2xl border border-blue-100">
          <CreateEmployee onEmployeeCreated={() => { fetchAllEmployees(); setShowCreateForm(false); }} />
        </div>
      )}

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="text-gray-400 text-xs uppercase border-b border-gray-100">
            <tr>
              <th className="px-4 py-3">ID / Designation</th>
              <th className="px-4 py-3">Employee Details</th>
              <th className="px-4 py-3">Access Level</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {employees.map(emp => (
              <tr key={emp.id} className="group hover:bg-gray-50/30">
                <td className="px-4 py-4">
                  {editingEmployeeId === emp.id ? (
                    <div className="flex gap-2">
                      <input
                        value={newEmployeeId}
                        onChange={e => setNewEmployeeId(e.target.value)}
                        className="border rounded px-2 py-1 w-24 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="New ID..."
                      />
                    </div>
                  ) : (
                    <span className="font-mono text-[10px] bg-gray-100 px-2 py-1 rounded text-gray-600 font-bold tracking-tighter">
                      {emp.employee_id || 'PENDING'}
                    </span>
                  )}
                  <p className="text-xs text-gray-400 mt-1 uppercase font-semibold">{emp.position || 'General'}</p>
                </td>
                <td className="px-4 py-4">
                  <p className="font-bold text-gray-800">{emp.name}</p>
                  <p className="text-xs text-gray-500">{emp.email}</p>
                </td>
                <td className="px-4 py-4">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${emp.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {emp.role}
                  </span>
                </td>
                <td className="px-4 py-4 text-right">
                  {editingEmployeeId === emp.id ? (
                    <div className="flex justify-end gap-3">
                      <button onClick={() => handleUpdateEmployeeId(emp.id)} className="text-xs font-bold text-green-600 hover:underline">Save</button>
                      <button onClick={() => setEditingEmployeeId(null)} className="text-xs font-bold text-gray-400">Cancel</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingEmployeeId(emp.id); setNewEmployeeId(emp.employee_id || ''); }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 text-xs font-bold bg-blue-50 px-3 py-1 rounded hover:bg-blue-100"
                    >
                      Update ID
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* ---------------- MAIN UI ---------------- */
  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm z-20">
        <div className="p-8 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-200">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-xl tracking-tight text-gray-900">CORE<span className="text-blue-600">HR</span></span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 mt-4">
          <NavItem id="attendance" label="Attendance" icon={CheckSquare} active={activeTab} setActive={setActiveTab} />
          <NavItem id="employees" label="Employees" icon={Users} active={activeTab} setActive={setActiveTab} />
          <NavItem id="submissions" label="Daily Logs" icon={FileText} active={activeTab} setActive={setActiveTab} />
          <NavItem id="leaves" label="Leave Requests" icon={Calendar} active={activeTab} setActive={setActiveTab} />
        </nav>

        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={onLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all font-semibold text-sm"
          >
            <LogOut className="w-4 h-4" /> Logout System
          </button>
        </div>
      </aside>

      {/* MAIN PANEL */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* HEADER */}
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-10 shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 capitalize tracking-tight">{activeTab}</h2>
            <p className="text-xs text-gray-400 font-medium">Manage and monitor organizational workflow</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-900">{profile.name}</p>
              <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">Administrator</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold border-4 border-white shadow-xl">
              {profile.name[0]}
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-10">

          {/* STATS OVERVIEW (Quick Context) */}
          {activeTab === 'attendance' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              <StatCard label="Total Personnel" value={employees.length} color="blue" />
              <StatCard label="Today's Attendance" value={attendanceRecords.filter(r => r.date === new Date().toISOString().split('T')[0]).length} color="green" />
              <StatCard label="Pending Tasks" value={attendanceRecords.filter(r => !r.work_done).length} color="orange" />
            </div>
          )}

          {/* MAIN CARD CONTAINER */}
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
            {activeTab === 'attendance' && renderAttendanceTable()}
            {activeTab === 'employees' && renderEmployeesTable()}
            {activeTab === 'submissions' && <AdminWorkSubmissions />}
            {activeTab === 'leaves' && <AdminLeaveManagement />}
          </div>
        </div>
      </main>
    </div>
  );
}

/* ---------------- HELPER COMPONENTS ---------------- */

function NavItem({ id, label, icon: Icon, active, setActive }) {
  const isActive = active === id;
  return (
    <button
      onClick={() => setActive(id)}
      className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-xl transition-all duration-200 group ${isActive
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-100'
          : 'text-gray-500 hover:bg-blue-50 hover:text-blue-600'
        }`}
    >
      <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-gray-400'}`} />
      <span className="text-sm font-bold tracking-tight">{label}</span>
      {isActive && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>}
    </button>
  );
}

function StatCard({ label, value, color }) {
  const colors = {
    blue: 'text-blue-600 bg-blue-50 border-blue-100',
    green: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    orange: 'text-orange-600 bg-orange-50 border-orange-100'
  };
  return (
    <div className={`p-6 rounded-3xl border-2 transition-all hover:scale-[1.02] ${colors[color]}`}>
      <p className="text-xs font-black uppercase tracking-widest opacity-70 mb-1">{label}</p>
      <p className="text-3xl font-black">{value}</p>
    </div>
  );
}

export default AdminDashboard;