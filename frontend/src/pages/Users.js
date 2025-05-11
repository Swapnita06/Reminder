import { useState, useEffect } from 'react';
import { useAuth } from '../components/auth/AuthContext';
import { Link } from 'react-router-dom';
import '../App.css';

export default function Users() {
  const { user, isAuthenticated, getUsers } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getUsers();
        setUsers(data);
      } catch (err) {
        setError('Failed to fetch users');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchUsers();
    }
  }, [isAuthenticated, getUsers]);

  if (!isAuthenticated) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>Please login to view users</h2>
          <Link to="/login" className="auth-button">Login</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="loading">Loading users...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="users-container">
      <h1>User List</h1>
      <div className="users-list">
        {users.map((userItem) => (
          <div key={userItem._id} className="user-card">
            <div className="user-info">
              <h3>{userItem.username}</h3>
              <p>Email: {userItem.email}</p>
              <p>Status: {userItem.status}</p>
              {userItem.phone && <p>Phone: {userItem.phone}</p>}
            </div>
            {user._id === userItem._id ? (
              <Link to="/profile" className="edit-button">
                Edit Profile
              </Link>
            ) : (
    // <Link 
    //   to={`/chat/participant/${userItem._id}`} 
    //   className="chat-button"
    // >
    //   Chat
    // </Link>

    <Link 
  to={`/chat/get-or-create/${userItem._id}`}
  className="chat-button"
>
  Chat
</Link>
  )}
          </div>
        ))}
      </div>
    </div>
  );
}