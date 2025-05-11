const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all chat routes
router.use(authMiddleware.authenticate);

// Get all chats for user
router.get('/', chatController.getUserChats);

// Get messages for a specific chat
router.get('/:chatId/messages', chatController.getChatMessages);

// Create a new chat
//router.post('/', chatController.createChat);

// Add a message to a chat
router.post('/:chatId/messages', chatController.addMessage);

// Add to chatRoutes.js
router.post('/get-or-create', authMiddleware.authenticate, chatController.getOrCreateChat);

module.exports = router;