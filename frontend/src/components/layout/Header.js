import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header>
      <nav>
        <Link to="/">Home</Link>
        {isAuthenticated ? (
          <>
           <Link to="/users">Users</Link>
            <Link to="/profile">Profile</Link>
            <Link to="reminders">Notifications</Link>
            <button onClick={logout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </nav>
    </header>
  );
}