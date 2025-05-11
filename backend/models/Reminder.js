const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  dueAt: {
    type: Date,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  sourceMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat'
  },
  senderInfo: {
    _id: mongoose.Schema.Types.ObjectId,
    username: String
  },
  recipientInfo: {
    _id: mongoose.Schema.Types.ObjectId,
    username: String
  }

}, {
  timestamps: true
});

module.exports = mongoose.model('Reminder', reminderSchema);