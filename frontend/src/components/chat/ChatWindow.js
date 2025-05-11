import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Cookies from 'js-cookie';


export default function ChatWindow() {
  const { chatId } = useParams();
  const { user, socket } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [chatInfo, setChatInfo] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const messagesEndRef = useRef(null);
const [showReminderCreated, setShowReminderCreated] = useState(false);


  const handleInputChange = (e) => {
  setNewMessage(e.target.value);
  if (!isTyping) {
    socket.emit('typing', { chatId, userId: user._id });
    setIsTyping(true);
    setTimeout(() => {
      socket.emit('stopTyping', { chatId, userId: user._id });
      setIsTyping(false);
    }, 3000);
  }
};

  useEffect(() => {
    const fetchChatData = async () => {
      try {
        // Fetch chat messages
        const messagesRes = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/chat/${chatId}/messages`, {
          headers: {
            'Authorization': `Bearer ${Cookies.get('token')}`
          }
        });
        const messagesData = await messagesRes.json();
        setMessages(messagesData);

        // Fetch chat info
        const chatRes = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/chat/${chatId}`, {
          headers: {
            'Authorization': `Bearer ${Cookies.get('token')}`
          }
        });
        const chatData = await chatRes.json();
        setChatInfo(chatData);

        // Join chat room
        if (socket) {
          socket.emit('joinChat', chatId);
        }
      } catch (err) {
        console.error('Failed to fetch chat data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchChatData();

    // Socket listeners
    if (socket) {
      socket.on('receiveMessage', (message) => {
        if (message.chat === chatId) {
          setMessages(prev => [...prev, message]);
        }
      });

      socket.on('messagesRead', ({ messageIds }) => {
        setMessages(prev => prev.map(msg => 
          messageIds.includes(msg._id) 
            ? { ...msg, readBy: [...msg.readBy, user._id] } 
            : msg
        ));
      });
    }

    return () => {
      if (socket) {
        socket.off('receiveMessage');
        socket.off('messagesRead');
      }
    };
  }, [chatId, socket, user._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Add socket listeners
useEffect(() => {
  if (socket) {
    socket.on('typing', ({ chatId: typingChatId, userId }) => {
      if (typingChatId === chatId && userId !== user._id) {
        setOtherTyping(true);
      }
    });
    
    socket.on('stopTyping', ({ chatId: typingChatId, userId }) => {
      if (typingChatId === chatId && userId !== user._id) {
        setOtherTyping(false);
      }
    });
  }
}, [socket, chatId, user._id]);

useEffect(() => {
  if (socket) {
    socket.on('newReminder', (reminder) => {
      if (reminder.sourceMessage && messages.some(m => m._id === reminder.sourceMessage)) {
        setShowReminderCreated(true);
        setTimeout(() => setShowReminderCreated(false), 3000);
      }
    });
  }
}, [socket, messages]);

// Add to JSX
{showReminderCreated && (
  <div className="reminder-notification">
    Reminder created from this message!
  </div>
)}

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      if (socket) {
        socket.emit('sendMessage', {
          chatId,
          content: newMessage,
          senderId: user._id
        }, (response) => {
          if (response.success) {
            setNewMessage('');
          }
        });
      }
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  if (loading) return <div className="loading">Loading chat...</div>;

  const participant = chatInfo?.participants.find(p => p._id !== user._id);

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>{participant?.username}</h2>
        <p>{participant?.status}</p>
      </div>
      
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
                {message.sender._id === user._id && (
                  <span className="read-status">
                    {message.readBy?.length > 1 ? '✓✓' : '✓'}
                  </span>
                )}
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