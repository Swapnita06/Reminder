import { useAuth } from '../components/auth/AuthContext';

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Welcome to Chat and get reminded!</h1>
      {isAuthenticated ? (
        <div>
          <p>Hello, {user.username}!</p>
          <p>"Welcome to this platform. CHAT and CONNECT"</p>
          {/* <p>Status: {user.status}</p> */}
        </div>
      ) : (
        <p>Please login or register to continue</p>
      )}
    </div>
  );
}