const Message = require('../models/Message');
const Chat = require('../models/Chat');
const User = require('../models/User');
const Reminder = require('../models/Reminder');
const { processMessageForReminders } = require('../utils/reminderAI');

const initializeSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('New client connected');

    // Join user to their personal room
    socket.on('join', async (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined their room`);
    });

    // Join a chat room
    socket.on('joinChat', (chatId) => {
      socket.join(chatId);
      console.log(`User joined chat ${chatId}`);
    });

    // Handle new messages
    socket.on('sendMessage', async (messageData, callback) => {
      try {
        const { chatId, content, senderId } = messageData;

        // Create new message
        const message = new Message({
          chat: chatId,
          sender: senderId,
          content
        });

        await message.save();

        // Update chat last message
        await Chat.findByIdAndUpdate(chatId, {
          lastMessage: message._id,
          lastMessageAt: new Date()
        });

        // Populate sender info
        const populatedMessage = await Message.populate(message, {
          path: 'sender',
          select: 'username'
        });

        // Emit to all participants in the chat
        io.to(chatId).emit('receiveMessage', populatedMessage);

        // Process message for potential reminders
        const chat = await Chat.findById(chatId).populate('participants');
        const otherParticipant = chat.participants.find(p => p._id.toString() !== senderId);
        
        if (otherParticipant) {
          const reminder = await processMessageForReminders(content, senderId, otherParticipant._id, message._id);
          if (reminder) {
            io.to(otherParticipant._id.toString()).emit('newReminder', reminder);
          }
        }

        callback({ success: true, message: populatedMessage });
      } catch (error) {
        console.error('Error sending message:', error);
        callback({ success: false, error: 'Failed to send message' });
      }
    });

    // Mark messages as read
    socket.on('markAsRead', async ({ messageIds, userId }) => {
      try {
        await Message.updateMany(
          { _id: { $in: messageIds } },
          { $addToSet: { readBy: userId } }
        );

        // Notify other participants that messages were read
        const messages = await Message.find({ _id: { $in: messageIds } }).populate('chat');
        const chatIds = [...new Set(messages.map(m => m.chat._id.toString()))];
        
        chatIds.forEach(chatId => {
          io.to(chatId).emit('messagesRead', { messageIds, readerId: userId });
        });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });
};

module.exports = { initializeSocket };