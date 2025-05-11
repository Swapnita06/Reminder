import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Cookies from 'js-cookie';

export default function ChatLoader() {
  const { participantId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const createOrFindChat = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/chat/get-or-create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Cookies.get('token')}`
          },
          body: JSON.stringify({ participantId })
        });
        const data = await response.json();
        navigate(`/chat/${data._id}`);
      } catch (err) {
        console.error('Failed to get or create chat', err);
        navigate('/chats');
      }
    };

    if (user && participantId) {
      createOrFindChat();
    }
  }, [user, participantId, navigate]);

  return <div className="loading">Loading chat...</div>;
}