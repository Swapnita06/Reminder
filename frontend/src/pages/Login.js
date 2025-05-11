import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthContext';
import LoginForm from '../components/auth/LoginForm';
import '../App.css';

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  if (isAuthenticated) {
    navigate('/');
    return null;
  }

  const handleSubmit = async ({ email, password }) => {
    const { success, message } = await login(email, password);
    if (!success) {
      setError(message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Login</h1>
        {error && <p className="auth-error">{error}</p>}
        <LoginForm onSubmit={handleSubmit} />
        <p className="auth-switch-text">
          Don't have an account? <a href="/register">Register</a>
        </p>
      </div>
    </div>
  );
}