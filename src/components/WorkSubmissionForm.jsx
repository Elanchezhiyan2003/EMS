import { useState } from 'react';
import { supabase } from '../supabase/client';
import { Upload, Link as LinkIcon, FileText, X } from 'lucide-react';

function WorkSubmissionForm({ userId, onSubmissionComplete }) {
    const [description, setDescription] = useState('');
    const [link, setLink] = useState('');
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const removeFile = () => {
        setFile(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        try {
            if (!description.trim()) {
                throw new Error('Please provide a description of your work.');
            }

            let attachmentUrl = null;
            let fileName = null;

            if (file) {
                const fileExt = file.name.split('.').pop();
                fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
                const filePath = `${userId}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('work_documents')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('work_documents')
                    .getPublicUrl(filePath);

                attachmentUrl = publicUrl;
                fileName = file.name;
            }

            const { error: insertError } = await supabase
                .from('work_submissions')
                .insert([{
                    user_id: userId,
                    work_description: description,
                    link_url: link,
                    attachment_url: attachmentUrl,
                    file_name: fileName
                }]);

            if (insertError) throw insertError;

            setMessage('Work submitted successfully!');
            setDescription('');
            setLink('');
            setFile(null);
            if (onSubmissionComplete) onSubmissionComplete();

        } catch (err) {
            console.error('Submission error:', err);
            setError(err.message || 'Failed to submit work.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-panel p-8 mt-6 max-w-2xl mx-auto animate-fade-in">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800">
                <div className="p-2 bg-blue-50 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                </div>
                Submit Daily Work
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="form-group">
                    <label>Description *</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows="4"
                        placeholder="Describe what you accomplished today..."
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Project Link (Optional)</label>
                    <div className="relative">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="url"
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            style={{ paddingLeft: '2.5rem' }}
                            placeholder="https://github.com/project/repo"
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label>Attachment (Optional)</label>
                    {!file ? (
                        <div className="relative border-2 border-dashed border-gray-200 rounded-xl p-8 hover:bg-gray-50 transition-colors cursor-pointer text-center group">
                            <input
                                type="file"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                <Upload className="w-6 h-6" />
                            </div>
                            <p className="text-sm font-medium text-gray-600">Click to upload document or image</p>
                            <p className="text-xs text-gray-400 mt-1">SVG, PNG, JPG or GIF (MAX. 800x400px)</p>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="p-2 bg-white rounded-lg">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                </div>
                                <span className="text-sm font-medium text-blue-900 truncate">{file.name}</span>
                            </div>
                            <button
                                type="button"
                                onClick={removeFile}
                                className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>

                {error && <div className="error-message">{error}</div>}
                {message && <div className="success-message">{message}</div>}

                <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full"
                >
                    {loading ? 'Submitting...' : 'Submit Work'}
                </button>
            </form>
        </div>
    );
}

export default WorkSubmissionForm;
