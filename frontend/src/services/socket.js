import { io } from 'socket.io-client';

let socket;

export const initializeSocket = (token) => {
  if (socket) return socket;
  socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
    withCredentials: true,
    auth: { token },
    transports: ['websocket', 'polling']
  });

  socket.on('connect', () => {
    console.log('Connected to socket server');
  });

  

  socket.on('disconnect', () => {
    console.log('Disconnected from socket server');
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
  }
};

export default socket;