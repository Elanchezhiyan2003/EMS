import { useState } from 'react';
import { supabase } from '../supabase/client';

function Register({ onToggle }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee',
    position: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    setSuccess('');

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: authData.user.id,
            name: formData.name,
            email: formData.email,
            role: formData.role,
            position: formData.position
          }
        ]);

      if (profileError) throw profileError;

      setSuccess('Registration successful! Please login.');
      setFormData({ name: '', email: '', password: '', role: 'employee', position: '' });
      setTimeout(onToggle, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card animate-fade-in">
        <h2>Join the Team</h2>
        <p className="auth-subtext">Create your employee profile</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g. John Doe"
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className="form-group">
              <label>Role</label>
              <select name="role" value={formData.role} onChange={handleChange}>
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="form-group">
              <label>Position</label>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleChange}
                required
                placeholder="e.g. Designer"
              />
            </div>
          </div>

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
              minLength="6"
              placeholder="••••••••"
            />
          </div>

          {error && <div className="error-message"><span>⚠️</span> {error}</div>}
          {success && <div className="success-message"><span>✅</span> {success}</div>}

          <button type="submit" disabled={loading} className="btn-primary w-full mt-4">
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="toggle-text">
          Already a member?{' '}
          <span onClick={onToggle} className="toggle-link">
            Log in here
          </span>
        </p>
      </div>
    </div>
  );
}

export default Register;
