import { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { initializeSocket, disconnectSocket } from '../../services/socket';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = Cookies.get('token');
        if (token) {
          api.defaults.headers.Authorization = `Bearer ${token}`;
          const { data } = await api.get('/api/auth/profile');
          setUser(data);
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('Failed to load user', err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
  if (isAuthenticated) {
    const newSocket = initializeSocket(Cookies.get('token'));
    setSocket(newSocket);

    return () => {
      disconnectSocket();
    };
  }
}, [isAuthenticated]);

// Add to AuthProvider
useEffect(() => {
  if (socket && user) {
    socket.emit('setOnline', user._id);
    
    socket.on('userOnline', (userId) => {
      // Update your user list state if needed
    });
    
    socket.on('userOffline', (userId) => {
      // Update your user list state if needed
    });
  }
}, [socket, user]);

  const login = async (email, password) => {
    try {
      const { data } = await api.post('/api/auth/login', { email, password });
      Cookies.set('token', data.token, { expires: 30 });
      api.defaults.headers.Authorization = `Bearer ${data.token}`;
      setUser(data.user);
      setIsAuthenticated(true);
      navigate('/');
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    }
  };

  const register = async (userData) => {
    try {
      const { data } = await api.post('/api/auth/register', userData);
      Cookies.set('token', data.token, { expires: 30 });
      api.defaults.headers.Authorization = `Bearer ${data.token}`;
      setUser(data.user);
      setIsAuthenticated(true);
      navigate('/');
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Registration failed' };
    }
  };

const getUsers = async () => {
  try {
    const { data } = await api.get('/api/auth/getUsers');
    return data;
  } catch (error) {
    console.error('Failed to fetch users', error);
    throw error;
  }
};

const createChat = async (participantId) => {
  try {
    const { data } = await api.post(`/api/chat/get-or-create'`, { participantId });
    return data;
  } catch (error) {
    console.error('Failed to create chat', error);
    throw error;
  }
};

const getChatMessages = async (chatId) => {
  try {
    const { data } = await api.get(`/api/chat/${chatId}/messages`);
    return data;
  } catch (error) {
    console.error('Failed to fetch messages', error);
    throw error;
  }
};

const sendMessage = async (chatId, content) => {
  try {
    const { data } = await api.post(`/api/chat/${chatId}/messages`, { content });
    return data;
  } catch (error) {
    console.error('Failed to send message', error);
    throw error;
  }
};


  const logout = () => {
    Cookies.remove('token');
    delete api.defaults.headers.Authorization;
    setUser(null);
    setIsAuthenticated(false);
    navigate('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        register,
        logout,
        getUsers,
        createChat,      
      getChatMessages,
      sendMessage,
      socket
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);