import { useState } from 'react';
import { supabase } from '../supabase/client';

function CreateEmployee({ onEmployeeCreated }) {
  const [formData, setFormData] = useState({
    employee_id: '',
    name: '',
    email: '',
    password: '',
    position: '',
    role: 'employee'
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
      // Create user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      // Create profile entry with employee_id
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: authData.user.id,
            employee_id: formData.employee_id || null,
            name: formData.name,
            email: formData.email,
            position: formData.position,
            role: formData.role
          }
        ]);

      if (profileError) throw profileError;

      setSuccess(`Employee "${formData.name}" created successfully!`);
      setFormData({
        employee_id: '',
        name: '',
        email: '',
        password: '',
        position: '',
        role: 'employee'
      });

      // Notify parent component to refresh employee list
      if (onEmployeeCreated) {
        onEmployeeCreated();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-6">
      <h3 className="text-xl font-bold mb-4">Create New Employee</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Employee ID (Optional)</label>
            <input
              type="text"
              name="employee_id"
              value={formData.employee_id}
              onChange={handleChange}
              placeholder="e.g., EMP001"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Full Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter employee name"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="employee@company.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
              placeholder="Min 6 characters"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Position *</label>
            <input
              type="text"
              name="position"
              value={formData.position}
              onChange={handleChange}
              required
              placeholder="Manager, Developer, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select name="role" value={formData.role} onChange={handleChange}>
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        {error && <div className="p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}
        {success && <div className="p-3 bg-green-100 text-green-700 rounded text-sm">{success}</div>}

        <button type="submit" disabled={loading} className="btn-primary w-full md:w-auto">
          {loading ? 'Creating Employee...' : 'Create Employee'}
        </button>
      </form>
    </div>
  );
}

export default CreateEmployee;
