import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import socket from '../../services/socket';



export default function ChatPage() {
  const { chatId, participantId } = useParams();
  const { user, createChat, getChatMessages, sendMessage } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeChat = async () => {
      try {
        setLoading(true);
      setError('');
        let currentChatId = chatId;
        
        // If no chatId but has participantId, create new chat
        if (!chatId && participantId) {
          const chat = await createChat(participantId);
          currentChatId = chat._id;
          navigate(`/chat/${currentChatId}`, { replace: true });
          return;
        }

        if (currentChatId) {
          const fetchedMessages = await getChatMessages(currentChatId);
          setMessages(fetchedMessages);

           if (socket) {
          socket.emit('joinChat', currentChatId);
        }
        }
      } catch (err) {
        console.error('Chat error:', err);
        setError('Failed to load chat');
        navigate('/chats');
        //console.error(err);
      } finally {
        setLoading(false);
      }
    };

    initializeChat();
     return () => {
    if (socket) {
      socket.off('receiveMessage');
    }
  };
  }, [chatId, participantId, createChat, getChatMessages, navigate,socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const message = await sendMessage(chatId, newMessage);
      setMessages([...messages, message]);
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message', err);
      setError('Failed to send message');
    }
  };

  if (loading) {
    return <div className="loading">Loading chat...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map((message) => (
          <div
            key={message._id}
            className={`message ${message.sender._id === user._id ? 'sent' : 'received'}`}
          >
            <div className="message-content">
              <p>{message.content}</p>
              <span className="message-time">
                {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="chat-input-form">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="chat-input"
        />
        <button type="submit" className="chat-send-button">
          Send
        </button>
      </form>
    </div>
  );
}