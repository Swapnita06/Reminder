const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminderController');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all reminder routes
router.use(authMiddleware.authenticate);

// Get all reminders for user
router.get('/', reminderController.getUserReminders);

// Create a new reminder
router.post('/', reminderController.createReminder);

// Update a reminder
router.put('/:id', reminderController.updateReminder);

// Delete a reminder
router.delete('/:id', reminderController.deleteReminder);

// Mark reminder as completed
router.patch('/:id/complete', reminderController.markAsCompleted);

router.get('/active',reminderController.getActiveReminders);

router.patch('/:id/snooze', reminderController.snoozeReminder);

module.exports = router;