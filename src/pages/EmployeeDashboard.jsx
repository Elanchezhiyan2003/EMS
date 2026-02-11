import { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import CheckInOut from '../components/CheckInOut';
import WorkSubmissionForm from '../components/WorkSubmissionForm';
import LeaveRequestForm from '../components/LeaveRequestForm';
import Profile from '../components/Profile';
import { LayoutDashboard, CheckCircle, FileText, Calendar, LogOut, User } from 'lucide-react';

function EmployeeDashboard({ user, profile, onLogout, onProfileUpdate }) {
  const [activeTab, setActiveTab] = useState('attendance');
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAttendanceHistory = async () => {
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

    // Subscribe to attendance changes
    const channel = supabase
      .channel('employee-attendance')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'attendance',
        filter: `user_id=eq.${user.id}`
      }, () => {
        fetchAttendanceHistory();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id]);

  const formatTime = (timeStr) => {
    if (!timeStr) return '--:--';
    const [hours, minutes] = timeStr.split(':');
    let h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${minutes} ${ampm}`;
  };

  const NavItem = ({ id, label, icon: Icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-3 px-6 py-3 rounded-xl transition-all duration-300 font-semibold ${activeTab === id
        ? 'nav-item-active'
        : 'nav-item-inactive'
        }`}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="glass-panel p-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 profile-gradient rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 overflow-hidden">
              {/* {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
              ) : (
                <span className="text-2xl font-bold">{profile.name.charAt(0)}</span>
              )} */}
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-gray-800 tracking-tight">
                {profile.name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2.5 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg uppercase tracking-wider">
                  Member
                </span>
                <span className="text-gray-400 text-xs font-medium">•</span>
                <span className="text-gray-500 text-sm font-medium">{profile.position || 'Employee'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="group flex items-center gap-2 px-5 py-2.5 bg-white border border-red-100 text-red-500 rounded-xl font-bold hover:bg-red-50 hover:border-red-200 transition-all duration-300 shadow-sm"
          >
            <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-4 mb-8">
          <NavItem id="attendance" label="Dashboard" icon={LayoutDashboard} />
          <NavItem id="work" label="Work Submissions" icon={FileText} />
          <NavItem id="leaves" label="Leave Requests" icon={Calendar} />
          <NavItem id="profile" label="My Profile" icon={User} />
        </div>

        <div className="animate-fade-in">
          {/* Dashboard Tab */}
          {activeTab === 'attendance' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <CheckInOut userId={user.id} onCheck={fetchAttendanceHistory} />
              </div>

              <div className="lg:col-span-2 space-y-8">
                <div className="glass-panel p-8">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold flex items-center gap-3 text-gray-800">
                      <div className="p-2 bg-green-50 rounded-lg">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                      Attendance Logs
                    </h3>
                  </div>

                  {loading ? (
                    <div className="flex items-center justify-center h-48 text-gray-400 font-medium">
                      Loading history...
                    </div>
                  ) : attendanceHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                      <LayoutDashboard className="w-12 h-12 mb-3 opacity-20" />
                      <p className="font-medium">No check-ins recorded yet</p>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
                      <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                          <tr>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">In</th>
                            <th className="px-6 py-4">Out</th>
                            <th className="px-6 py-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {attendanceHistory.map((record) => (
                            <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-5">
                                <span className="font-bold text-gray-700">
                                  {new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              </td>
                              <td className="px-6 py-5">
                                <span className="text-sm font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded-md">{formatTime(record.check_in)}</span>
                              </td>
                              <td className="px-6 py-5">
                                <span className="text-sm font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded-md">{formatTime(record.check_out)}</span>
                              </td>
                              <td className="px-6 py-5">
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${record.check_out
                                  ? 'bg-green-50 text-green-600'
                                  : 'bg-orange-50 text-orange-600'
                                  }`}>
                                  {record.check_out ? 'Completed' : 'On-Going'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Work Submissions Tab */}
          {activeTab === 'work' && (
            <div className="max-w-4xl mx-auto w-full">
              <WorkSubmissionForm userId={user.id} />
            </div>
          )}

          {/* Leave Requests Tab */}
          {activeTab === 'leaves' && (
            <div className="max-w-4xl mx-auto w-full">
              <LeaveRequestForm userId={user.id} />
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="max-w-4xl mx-auto w-full">
              <Profile user={user} onProfileUpdate={onProfileUpdate} />
            </div>
          )}
        </div>
      </div>
    </div>

    
  );
}

export default EmployeeDashboard;
