const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');

exports.getUserChats = async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user._id
    }).populate('participants', 'username status');

    res.status(200).json(chats);
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
};

exports.getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const messages = await Message.find({ chat: chatId })
      .sort({ createdAt: 1 })
      .populate('sender', 'username');

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
};

// exports.createChat = async (req, res) => {
//   try {
//     const { participantId } = req.body;

//     // Check if chat already exists
//     const existingChat = await Chat.findOne({
//       participants: { $all: [req.user._id, participantId] }
//     });

//     if (existingChat) {
//       return res.status(200).json(existingChat);
//     }

//     // Create new chat
//     const chat = new Chat({
//       participants: [req.user._id, participantId]
//     });

//     await chat.save();

//     res.status(201).json(chat);
//   } catch (error) {
//     res.status(500).json({ message: 'Something went wrong' });
//   }
// };

// Add to chatController.js
exports.getOrCreateChat = async (req, res) => {
  try {
    const { participantId } = req.body;
    const userId = req.user._id;

    // Check if chat exists
    let chat = await Chat.findOne({
      participants: { $all: [userId, participantId] }
    }).populate('participants', 'username status');

    // Create new chat if doesn't exist
    if (!chat) {
      chat = new Chat({
        participants: [userId, participantId]
      });
      await chat.save();
      chat = await Chat.populate(chat, { path: 'participants', select: 'username status' });
    }

    res.status(200).json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get or create chat' });
  }
};

exports.addMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content } = req.body;

    // Create new message
    const message = new Message({
      chat: chatId,
      sender: req.user._id,
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

    // Emit the new message to all participants via Socket.IO
    // (Socket handling is in socket.js)

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
};