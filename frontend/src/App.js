import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './components/auth/AuthContext';
import Header from './components/layout/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Users from './pages/Users';
import ChatPage from './components/pages/ChatPage';
import './App.css';
import ChatList from './components/chat/ChatList';
import ChatWindow from './components/chat/ChatWindow';
import ChatLoader from './components/chat/ChatLoader';
import ReminderList from './components/reminders/ReminderList';
import ReminderNotification from './components/reminders/ReminderNotification';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <AuthProvider>
      <ToastContainer position="top-right" autoClose={5000} />
        <div className="App">
          <Header />
          <ReminderNotification />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/users" element={<Users />} />
              <Route path="/chat/:chatId" element={<ChatPage />} />
<Route path="/chat/participant/:participantId" element={<ChatPage />} />
<Route path="/chats" element={<ChatList />} />
<Route path="/chat/:chatId" element={<ChatWindow />} />
<Route path="/chat/get-or-create/:participantId" element={<ChatLoader/>} />
<Route path="/reminders" element={<ReminderList />} />
            </Routes>
          </main>
        </div>
      
    </AuthProvider>
  );
}

export default App;