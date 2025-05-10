const Reminder = require('../models/Reminder');
const Message = require('../models/Message');
const User = require('../models/User');
const natural = require('natural');
const chrono = require('chrono-node');

// Initialize NLP tools
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

// Keywords that might indicate a reminder
const reminderKeywords = [
  'remind', 'remember', 'call', 'meet', 'meeting', 'appointment',
  'schedule', 'task', 'todo', 'deadline', 'due', 'alert', 'notify',
  'time', 'date', 'at', 'on', 'by', 'before', 'after'
].map(word => stemmer.stem(word));

// Process a single message for potential reminders
exports.processMessageForReminders = async (messageContent, senderId, recipientId, messageId) => {
  try {
    // Parse the message for time references
    const parsedDate = chrono.parse(messageContent);
    if (parsedDate.length === 0) return null;

    // Tokenize and stem the message
    const tokens = tokenizer.tokenize(messageContent.toLowerCase());
    const stems = tokens.map(token => stemmer.stem(token));

    // Check if the message contains any reminder-related keywords
    const hasReminderKeyword = stems.some(stem => 
      reminderKeywords.includes(stem)
    );

    if (!hasReminderKeyword) return null;

    // Extract the first date found
    const dueDate = parsedDate[0].start.date();
    
    // Create a reminder
    const reminder = new Reminder({
      user: recipientId,
      content: `Reminder from chat: "${messageContent}"`,
      dueAt: dueDate,
      sourceMessage: messageId
    });

    await reminder.save();
    
    // Populate sender info
    const populatedReminder = await Reminder.populate(reminder, {
      path: 'sourceMessage',
      populate: {
        path: 'sender',
        select: 'username'
      }
    });

    return populatedReminder;
  } catch (error) {
    console.error('Error processing message for reminders:', error);
    return null;
  }
};

// Process all unprocessed messages for reminders (background task)
exports.processMessagesForReminders = async () => {
  try {
    // Find messages that might contain reminders but haven't been processed yet
    const messages = await Message.find({
      reminderProcessed: { $ne: true },
      createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    }).populate('chat');

    for (const message of messages) {
      const chat = message.chat;
      const senderId = message.sender;
      
      // Find the other participant in the chat
      const otherParticipant = chat.participants.find(
        p => p.toString() !== senderId.toString()
      );
      
      if (otherParticipant) {
        await processMessageForReminders(
          message.content,
          senderId,
          otherParticipant,
          message._id
        );
      }
      
      // Mark message as processed
      message.reminderProcessed = true;
      await message.save();
    }

    // Check for due reminders and send notifications
    const now = new Date();
    const dueReminders = await Reminder.find({
      dueAt: { $lte: now },
      notified: { $ne: true },
      completed: false
    }).populate('user sourceMessage');

    for (const reminder of dueReminders) {
      // Send notification via Socket.IO
      if (reminder.user) {
        io.to(reminder.user._id.toString()).emit('reminderDue', reminder);
      }
      
      // Mark reminder as notified
      reminder.notified = true;
      await reminder.save();
    }
  } catch (error) {
    console.error('Error processing reminders:', error);
  }
};