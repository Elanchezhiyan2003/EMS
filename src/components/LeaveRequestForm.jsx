import { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import { Calendar, Send, Clock } from 'lucide-react';

function LeaveRequestForm({ userId }) {
    const [formData, setFormData] = useState({
        start_date: '',
        end_date: '',
        reason: ''
    });
    const [loading, setLoading] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [leaveHistory, setLeaveHistory] = useState([]);
    const [message, setMessage] = useState({ text: '', type: '' });

    const fetchLeaveHistory = async () => {
        try {
            const { data, error } = await supabase
                .from('leaves')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setLeaveHistory(data);
        } catch (err) {
            console.error('Error fetching leaves:', err);
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaveHistory();
    }, [userId]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: '', type: '' });

        try {
            const { error } = await supabase
                .from('leaves')
                .insert([{
                    user_id: userId,
                    ...formData,
                    status: 'pending'
                }]);

            if (error) throw error;

            setMessage({ text: 'Leave request submitted successfully!', type: 'success' });
            setFormData({ start_date: '', end_date: '', reason: '' });
            fetchLeaveHistory();
        } catch (err) {
            setMessage({ text: err.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: 'badge-warning',
            approved: 'badge-success',
            rejected: 'badge-danger'
        };
        const labels = {
            pending: 'Pending',
            approved: 'Approved',
            rejected: 'Rejected'
        };

        return (
            <span className={`badge ${badges[status] || 'badge-primary'}`}>
                {labels[status] || status}
            </span>
        );
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
            <div className="glass-panel p-8 h-fit">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800">
                    <div className="p-2 bg-blue-50 rounded-lg">
                        <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    Request Leave
                </h3>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label>Start Date</label>
                            <input
                                type="date"
                                name="start_date"
                                value={formData.start_date}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>End Date</label>
                            <input
                                type="date"
                                name="end_date"
                                value={formData.end_date}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Reason</label>
                        <textarea
                            name="reason"
                            value={formData.reason}
                            onChange={handleChange}
                            placeholder="Briefly explain the reason for leave..."
                            required
                            rows="4"
                        ></textarea>
                    </div>

                    {message.text && (
                        <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'success'
                                ? 'bg-green-50 text-green-700 border border-green-100'
                                : 'bg-red-50 text-red-700 border border-red-100'
                            }`}>
                            {message.text}
                        </div>
                    )}

                    <button type="submit" disabled={loading} className="btn-primary w-full">
                        {loading ? 'Submitting...' : 'Submit Request'}
                    </button>
                </form>
            </div>

            <div className="glass-panel p-8">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800">
                    <div className="p-2 bg-purple-50 rounded-lg">
                        <Clock className="w-5 h-5 text-purple-700" />
                    </div>
                    Leave History
                </h3>

                {historyLoading ? (
                    <div className="text-center py-8 text-gray-400">Loading history...</div>
                ) : leaveHistory.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No leave requests found.</p>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-gray-100">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-4 py-3">Dates</th>
                                    <th className="px-4 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {leaveHistory.map((leave) => (
                                    <tr key={leave.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-4">
                                            <div className="font-bold text-gray-800 text-sm">
                                                {new Date(leave.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} -
                                                {new Date(leave.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1 truncate max-w-[150px]">
                                                {leave.reason}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            {getStatusBadge(leave.status)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default LeaveRequestForm;
