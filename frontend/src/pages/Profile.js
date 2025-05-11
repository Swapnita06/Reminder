import { useState } from 'react';
import { useAuth } from '../components/auth/AuthContext';
import '../App.css';

export default function Profile() {
  const { user, logout } = useAuth();
  const [formData, setFormData] = useState({
    username: user?.username || '',
    status: user?.status || '',
    phone: user?.phone || ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // You would need to implement the update profile API call in your AuthContext
      // await updateProfile(formData);
      setMessage('Profile updated successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Profile</h1>
        {message && <p className="auth-success">{message}</p>}
        {error && <p className="auth-error">{error}</p>}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="text"
              value={user.email}
              readOnly
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>Status</label>
            <input
              type="text"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="form-input"
            />
          </div>
          <button type="submit" className="auth-button">
            Update Profile
          </button>
        </form>
        <button onClick={logout} className="auth-button" style={{ backgroundColor: '#ef4444' }}>
          Logout
        </button>
      </div>
    </div>
  );
}