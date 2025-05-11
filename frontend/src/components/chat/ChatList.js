import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { Link } from 'react-router-dom';
import Cookies from 'js-cookie';


export default function ChatList() {
  const { user, socket } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/chat`, {
          headers: {
            'Authorization': `Bearer ${Cookies.get('token')}`
          }
        });
        const data = await response.json();
        setChats(data);
      } catch (err) {
        console.error('Failed to fetch chats', err);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();

    // Socket listeners for real-time updates
    if (socket) {
      socket.on('newMessage', (message) => {
        setChats(prevChats => {
          const updatedChats = [...prevChats];
          const chatIndex = updatedChats.findIndex(c => c._id === message.chat._id);
          if (chatIndex !== -1) {
            updatedChats[chatIndex].lastMessage = message;
            updatedChats[chatIndex].lastMessageAt = new Date();
            // Move to top
            const [reorderedChat] = updatedChats.splice(chatIndex, 1);
            updatedChats.unshift(reorderedChat);
          }
          return updatedChats;
        });
      });
    }

    return () => {
      if (socket) {
        socket.off('newMessage');
      }
    };
  }, [socket]);

  if (loading) return <div className="loading">Loading chats...</div>;

  return (
    <div className="chat-list">
      <h2>Your Conversations</h2>
      {chats.map(chat => {
        const participant = chat.participants.find(p => p._id !== user._id);
        return (
          <Link 
            key={chat._id} 
            to={`/chat/${chat._id}`}
            className="chat-list-item"
          >
            <div className="chat-avatar">{participant.username.charAt(0)}</div>
            <div className="chat-info">
              <h3>{participant.username}</h3>
              <p className="last-message">
                {chat.lastMessage?.sender._id === user._id ? 'You: ' : ''}
                {chat.lastMessage?.content || 'No messages yet'}
              </p>
            </div>
            <div className="chat-time">
              {chat.lastMessageAt ? new Date(chat.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
            </div>
          </Link>
        );
      })}
    </div>
  );
}