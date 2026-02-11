import { useState } from 'react';
import { supabase } from '../supabase/client';

function Login({ onToggle, onLogin }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email.trim(),
        password: formData.password,
      });

      if (authError) {
        if (authError.message === 'Invalid login credentials') {
          throw new Error('Invalid email or password.');
        }
        throw authError;
      }

      let { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      // Self-healing if profile missing
      if (!profile) {
        const userMetadata = data.user.user_metadata || {};
        const fallbackName = userMetadata.full_name || userMetadata.name || data.user.email.split('@')[0];

        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([{
            id: data.user.id,
            name: fallbackName,
            email: data.user.email,
            role: 'employee',
            position: 'Member'
          }])
          .select()
          .single();

        if (createError) throw new Error('Profile could not be created. Contact admin.');
        profile = newProfile;
      }

      onLogin(data.user, profile);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card animate-fade-in">
        <h2>Welcome Back</h2>
        <p className="auth-subtext">Enter your credentials to access your dashboard</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="name@company.com"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="error-message">
              <span>⚠️</span>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full mt-4">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="toggle-text">
          New to the company?{' '}
          <span onClick={onToggle} className="toggle-link">
            Create an account
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;
