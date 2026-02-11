import { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import { Calendar, Check, X, Filter, User } from 'lucide-react';

function AdminLeaveManagement() {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending'); // all, pending, approved, rejected
    const [message, setMessage] = useState('');

    const fetchLeaves = async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('leaves')
                .select(`
          *,
          profiles (
            name,
            email,
            employee_id
          )
        `)
                .order('created_at', { ascending: false });

            if (filter !== 'all') {
                query = query.eq('status', filter);
            }

            const { data, error } = await query;
            if (error) throw error;
            setLeaves(data);
        } catch (err) {
            console.error('Error fetching leaves:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaves();
    }, [filter]);

    const handleStatusChange = async (id, newStatus) => {
        try {
            const { error } = await supabase
                .from('leaves')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;

            setMessage(`Leave ${newStatus} successfully.`);
            setTimeout(() => setMessage(''), 3000);
            fetchLeaves();
        } catch (err) {
            console.error('Error updating leave status:', err);
            alert('Error updating leave status: ' + err.message);
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-700',
            approved: 'bg-green-100 text-green-700',
            rejected: 'bg-red-100 text-red-700'
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    return (
        <div className="glass-panel p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-500" />
                    Leave Management
                </h3>

                <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                    {['all', 'pending', 'approved', 'rejected'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${filter === f
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {message && (
                <div className="bg-green-100 text-green-700 p-3 rounded mb-4 text-sm animate-fade-in">
                    {message}
                </div>
            )}

            {loading ? (
                <div className="text-center py-8 text-gray-500">Loading leave requests...</div>
            ) : leaves.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    No {filter !== 'all' ? filter : ''} leave requests found.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="rounded-l-lg px-4 py-3 text-left">Employee</th>
                                <th className="px-4 py-3 text-left">Dates</th>
                                <th className="px-4 py-3 text-left">Reason</th>
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="rounded-r-lg px-4 py-3 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {leaves.map((leave) => (
                                <tr key={leave.id} className="hover:bg-white/40 transition">
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-indigo-50 rounded-full">
                                                <User className="w-4 h-4 text-indigo-400" />
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-800">{leave.profiles.name}</div>
                                                <div className="text-xs text-gray-500">{leave.profiles.employee_id || leave.profiles.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-sm whitespace-nowrap">
                                        <div className="text-gray-700">From: {new Date(leave.start_date).toLocaleDateString()}</div>
                                        <div className="text-gray-700">To: {new Date(leave.end_date).toLocaleDateString()}</div>
                                    </td>
                                    <td className="px-4 py-4 text-sm min-w-[200px]">
                                        <div className="text-gray-600 bg-gray-50 p-2 rounded line-clamp-2" title={leave.reason}>
                                            {leave.reason}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        {getStatusBadge(leave.status)}
                                    </td>
                                    <td className="px-4 py-4">
                                        {leave.status === 'pending' ? (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleStatusChange(leave.id, 'approved')}
                                                    className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition shadow-sm border border-green-200"
                                                    title="Approve"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleStatusChange(leave.id, 'rejected')}
                                                    className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition shadow-sm border border-red-200"
                                                    title="Reject"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400 font-italic">No actions available</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default AdminLeaveManagement;
