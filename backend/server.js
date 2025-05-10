require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const reminderRoutes = require('./routes/reminderRoutes');
const { initializeSocket } = require('./socket/socket');
const { processMessagesForReminders } = require('./utils/reminderAI');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/reminders', reminderRoutes);

// Database connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Socket.io initialization
// const io = socketIo(server, {
//   cors: {
//     origin:  "http://localhost:5000",
//     methods: ["GET", "POST"]
//   }
// });
//initializeSocket(io);


const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    transports: ['websocket', 'polling'], // Add this line
    credentials: true
  },
  allowEIO3: true // For Socket.IO v2 client compatibility
});

// Add health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ websocket: io.engine.clientsCount });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Background task to process messages for reminders
setInterval(async () => {
  try {
    await processMessagesForReminders();
  } catch (error) {
    console.error('Error processing reminders:', error);
  }
}, 60000); // Check every minute