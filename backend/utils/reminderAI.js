const natural = require('natural');
const chrono = require('chrono-node');
const Reminder = require('../models/Reminder');
const Message = require('../models/Message');
const User = require('../models/User');

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
  console.log("🔍 Unprocessed messages found:", messageContent.length)
  try {
    console.log('Analyzing message for reminder:',messageContent);

 // First, fetch the message to get chat info
    const message = await Message.findById(messageId).populate('chat').populate('sender', 'username');
    if (!message) {
      console.log('Message not found');
      return null;
    }

// Prevent duplicate reminder creation
    const existingReminder = await Reminder.findOne({ user: senderId, sourceMessage: messageId });
    if (existingReminder) {
      console.log('⛔ Reminder already exists for this message.');
      return null;
    }

    // Parse the message for time references
    const userTimezone = 'Asia/Kolkata'; 
    // const parsedDate = chrono.parse(messageContent);
    const parsedDate = chrono.parse(messageContent, new Date(), { 
  timezone: userTimezone 
});
// const parsedDate = chrono.parse(messageContent);
// if (parsedDate.length === 0) return null;

// const dueDateIST = parsedDate[0].start.date();
// const utcDate = new Date(dueDateIST.getTime() - (330 * 60000)); // Convert IST to UTC



    if (parsedDate.length === 0) return null;

    // Tokenize and stem the message
    const tokens = tokenizer.tokenize(messageContent.toLowerCase());
    const stems = tokens.map(token => stemmer.stem(token));

    // Check if the message contains any reminder-related keywords
    const hasReminderKeyword = stems.some(stem => 
      reminderKeywords.includes(stem)
    );

    const timePatterns = [
      /\b(at|by|before|after)\s+\d{1,2}(:\d{2})?\s*(am|pm)?\b/i,
      /\b(tomorrow|today|tonight)\b/i,
      /\b(next\s+(week|month|year|monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/i
    ];
    const hasTimeReference = timePatterns.some(pattern => pattern.test(messageContent));
 // Parse natural date/time using chrono
    
    //if (parsedDate.length === 0) return null;

    if (!hasReminderKeyword && !hasTimeReference) {
      console.log('⏭️ No reminder-related keyword or time reference found.');
      return null;
    }

    // Extract the first date found
    const dueDate = parsedDate[0].start.date();
    const utcDate = new Date(dueDate.getTime() - (dueDate.getTimezoneOffset() * 60000));
    console.log('Original time:', dueDate.toLocaleString('en-IN'));
console.log('UTC time:', utcDate.toISOString());
   console.assert(dueDate.getTimezoneOffset() === -330, 
      `Expected IST offset (-330), got ${dueDate.getTimezoneOffset()}`);


     // Get sender and recipient info
const sender = await User.findById(senderId);
const recipient = await User.findById(recipientId);

if (!sender || !recipient) {
  console.log('Sender or recipient not found');
  return null;
}

    // Create reminders for both participants
    const senderReminder = new Reminder({
      user: senderId,
      content: `Reminder from chat: "${messageContent}"`,
      dueAt: utcDate,
      sourceMessage: messageId,
      chat: message.chat._id,
  senderInfo: {
    _id: sender._id,
    username: sender.username
  },
  recipientInfo: {
    _id: recipient._id,
    username: recipient.username
  }
    });

    const recipientReminder = new Reminder({
      user: recipientId,
      content: `Reminder from chat: "${messageContent}"`,
      dueAt: utcDate,
      sourceMessage: messageId,
 chat: message.chat._id,
  senderInfo: {
    _id: sender._id,
    username: sender.username
  },
  recipientInfo: {
    _id: recipient._id,
    username: recipient.username
  }
    });

    await Promise.all([senderReminder.save(), recipientReminder.save()]);
    console.log('Reminders saved:', {
  sender: senderReminder,
  recipient: recipientReminder,
   dueAt: utcDate.toISOString()
});


    // Return both reminders
    return {
      senderReminder,
      recipientReminder
    };
  } catch (error) {
    console.error('Error processing message for reminders:', error);
    return null;
  }
};

// Process all unprocessed messages for reminders (background task)
exports.processMessagesForReminders = async (io) => {
  try {



    // Find messages that might contain reminders but haven't been processed yet
    const messages = await Message.find({
      reminderProcessed: { $ne: true },
      createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    }).populate({
      path: 'chat',
      populate: {
        path: 'participants',
        select: '_id username'
      }
    });

    for (const message of messages) {
      const chat = message.chat;
      const senderId = message.sender;
       const senderIdStr = senderId._id ? senderId._id.toString() : senderId.toString();

      // Find the other participant in the chat
      // const otherParticipant = chat.participants.find(
      //   p => p.toString() !== senderId.toString()
      // );

      const otherParticipant = chat.participants.find(p => {
  const pId = p._id ? p._id.toString() : p.toString();
  const senderIdStr = senderId._id ? senderId._id.toString() : senderId.toString();
  return pId !== senderIdStr;
});

if (!otherParticipant) {
  console.warn("⚠️ No recipient found for message:", message._id);
  continue; // Skip this message if no recipient found
}
      
      
 const result =await exports.processMessageForReminders(
        message.content,
  senderId,
  otherParticipant._id ? otherParticipant._id : otherParticipant,
  message._id
        );
      
      
 if (result) {
          io.to(senderId.toString()).emit('newReminder', result.senderReminder);
          io.to(otherParticipant._id.toString()).emit('newReminder', result.recipientReminder);
        
          //   scheduleReminderNotification(io, result.senderReminder);
          // scheduleReminderNotification(io, result.recipientReminder);

    }else {
        console.log(`🛑 Skipped reminder creation for message ${message._id}`);
      }
      
// Mark message as processed
      message.reminderProcessed = true;
      await message.save();
    }

    
// // Add this new function
// function scheduleReminderNotification(io, reminder) {
//   const now = new Date();
//   const dueTime = new Date(reminder.dueAt).getTime();
//   const timeUntilDue = dueTime - now.getTime();

//   if (timeUntilDue > 0) {
//     setTimeout(() => {
//       io.to(reminder.user.toString()).emit('reminderDueNow', {
//         ...reminder.toObject(),
//         isDueNow: true
//       });
//     }, timeUntilDue);
//   }
// }

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