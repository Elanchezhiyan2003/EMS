import { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import { FileText, Link as LinkIcon, Download, ExternalLink } from 'lucide-react';

function AdminWorkSubmissions() {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('work_submissions')
                .select(`
          *,
          profiles (name, email, employee_id)
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setSubmissions(data);
        } catch (err) {
            console.error('Error fetching submissions:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubmissions();

        // Realtime subscription
        const channel = supabase
            .channel('admin_submissions')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'work_submissions' },
                (payload) => {
                    // Ideally we'd fetch the single new record including profile, 
                    // but for simplicity we'll just refetch all for now or optimize later
                    fetchSubmissions();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    if (loading) return <div className="text-center p-4">Loading submissions...</div>;

    return (
        <div className="glass-panel p-6 mt-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Employee Work Submissions
                </h3>
                <button onClick={fetchSubmissions} className="btn-secondary text-sm">
                    Refresh
                </button>
            </div>

            {submissions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No work submissions found.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="rounded-l-lg">Employee</th>
                                <th>Description</th>
                                <th>Links/Files</th>
                                <th className="rounded-r-lg">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {submissions.map((sub) => (
                                <tr key={sub.id} className="hover:bg-white/40 transition">
                                    <td>
                                        <div className="font-medium text-gray-900">{sub.profiles?.name}</div>
                                        <div className="text-xs text-gray-500">{sub.profiles?.employee_id || sub.profiles?.email}</div>
                                    </td>
                                    <td className="max-w-md">
                                        <p className="whitespace-pre-wrap text-gray-700">{sub.work_description}</p>
                                    </td>
                                    <td>
                                        <div className="flex flex-col gap-2">
                                            {sub.link_url && (
                                                <a
                                                    href={sub.link_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center gap-1 text-blue-600 hover:underline text-sm"
                                                >
                                                    <LinkIcon className="w-3 h-3" />
                                                    View Link <ExternalLink className="w-3 h-3" />
                                                </a>
                                            )}

                                            {sub.attachment_url && (
                                                <a
                                                    href={sub.attachment_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center gap-1 text-green-600 hover:underline text-sm"
                                                >
                                                    <Download className="w-3 h-3" />
                                                    {sub.file_name || 'Download File'}
                                                </a>
                                            )}

                                            {!sub.link_url && !sub.attachment_url && (
                                                <span className="text-gray-400 text-sm italic">No attachments</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="text-sm text-gray-500">
                                        {new Date(sub.created_at).toLocaleDateString()}
                                        <br />
                                        <span className="text-xs">
                                            {new Date(sub.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
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

export default AdminWorkSubmissions;
