import { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import { User, Mail, Briefcase, Camera } from 'lucide-react';

function Profile({ user, onProfileUpdate }) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');

    const fetchProfile = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) throw error;
            setProfile(data);
        } catch (err) {
            console.error('Error fetching profile:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, [user.id]);

    const handleImageUpload = async (event) => {
        try {
            setUploading(true);
            setMessage('');

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.');
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Math.random()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            let { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id);

            if (updateError) throw updateError;

            setMessage('Profile picture updated!');
            fetchProfile();
            if (onProfileUpdate) onProfileUpdate(); // Notify parent
        } catch (error) {
            setMessage(`Error: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <div className="text-center py-8">Loading profile...</div>;

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="glass-panel p-8">
                <h3 className="text-xl font-bold mb-8 flex items-center gap-2 text-gray-800">
                    <div className="p-2 bg-blue-50 rounded-lg">
                        <User className="w-5 h-5 text-blue-600" />
                    </div>
                    My Profile
                </h3>

                <div className="flex flex-col md:flex-row gap-8 items-start">
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100 flex items-center justify-center relative group">
                            {profile?.avatar_url ? (
                                <img
                                    src={profile.avatar_url}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-4xl font-bold text-gray-400">
                                    {profile?.name?.charAt(0) || '?'}
                                </span>
                            )}

                            <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <Camera className="w-8 h-8 text-white" />
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    disabled={uploading}
                                    className="hidden"
                                />
                            </label>
                        </div>

                        <div className="text-center">
                            <p className="text-xs text-gray-500 mb-1">Click image to change</p>
                            {uploading && <span className="text-xs text-blue-600 font-medium">Uploading...</span>}
                            {message && <span className={`text-xs font-medium ${message.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>{message}</span>}
                        </div>
                    </div>

                    {/* Details Section */}
                    <div className="flex-1 w-full space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Full Name</label>
                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 font-medium text-gray-800 flex items-center gap-2">
                                    <User className="w-4 h-4 text-gray-400" />
                                    {profile?.name}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Email Address</label>
                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 font-medium text-gray-800 flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    {profile?.email}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Role</label>
                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 font-medium text-gray-800 uppercase text-sm flex items-center gap-2">
                                    <Briefcase className="w-4 h-4 text-gray-400" />
                                    {profile?.role}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Position</label>
                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 font-medium text-gray-800 flex items-center gap-2">
                                    <Briefcase className="w-4 h-4 text-gray-400" />
                                    {profile?.position || 'Not Specified'}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <h4 className="font-semibold text-blue-900 mb-1">Profile Information</h4>
                            <p className="text-sm text-blue-700">
                                To update your personal details such as name or position, please contact the HR department or your administrator.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Profile;
