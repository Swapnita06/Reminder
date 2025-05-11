import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthContext';
import RegisterForm from '../components/auth/RegisterForm';
import '../App.css';

export default function Register() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  if (isAuthenticated) {
    navigate('/');
    return null;
  }

  const handleSubmit = async (userData) => {
    const { success, message } = await register(userData);
    if (!success) {
      setError(message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Register</h1>
        {error && <p className="auth-error">{error}</p>}
        <RegisterForm onSubmit={handleSubmit} />
        <p className="auth-switch-text">
          Already have an account? <a href="/login">Login</a>
        </p>
      </div>
    </div>
  );
}