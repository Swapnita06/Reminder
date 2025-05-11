const Reminder = require('../models/Reminder');

exports.getUserReminders = async (req, res) => {
  try {
    const reminders = await Reminder.find({
      user: req.user._id,
      completed: false,
      dueAt: { $gt: new Date() }
    }).sort({ dueAt: 1 });

    res.status(200).json(reminders);
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
};

exports.createReminder = async (req, res) => {
  try {
    const { content, dueAt } = req.body;

    const reminder = new Reminder({
      user: req.user._id,
      content,
       dueAt: utcDate,
  originalTimeString: parsedDate[0].text
    });

    await reminder.save();

    res.status(201).json(reminder);
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
};

exports.updateReminder = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, dueAt } = req.body;

    const reminder = await Reminder.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { content, dueAt },
      { new: true }
    );

    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    res.status(200).json(reminder);
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
};

exports.deleteReminder = async (req, res) => {
  try {
    const { id } = req.params;

    const reminder = await Reminder.findOneAndDelete({
      _id: id,
      user: req.user._id
    });

    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    res.status(200).json({ message: 'Reminder deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
};

exports.markAsCompleted = async (req, res) => {
  try {
    const { id } = req.params;

    const reminder = await Reminder.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { completed: true },
      { new: true }
    );

    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    res.status(200).json(reminder);
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
};

exports.snoozeReminder = async (req, res) => {
  try {
    const { id } = req.params;
    const { minutes } = req.body;

    const reminder = await Reminder.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { 
        dueAt: new Date(Date.now() + minutes * 60000),
        notified: false
      },
      { new: true }
    );

    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    res.status(200).json(reminder);
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
};

exports.getActiveReminders = async (req, res) => {
  try {
    const reminders = await Reminder.find({
      user: req.user._id,
    
      completed: false,
      dueAt: { $gt: new Date() } // Only future reminders
    }).sort({ dueAt: 1 })
    .lean();

     console.log('Returning reminders:', reminders); // Add this log
    res.json(reminders);
    //res.status(200).json(reminders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reminders' });
  }
};