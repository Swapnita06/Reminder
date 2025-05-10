const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const usersController = require('../controllers/usersController');
// Register a new user
router.post('/register', authController.register);

// Login user
router.post('/login', authController.login);

// Get user profile
router.get('/profile', authController.authenticate, authController.getProfile);

// Update user profile
router.put('/profile', authController.authenticate, authController.updateProfile);

router.get('/getUsers',usersController.getUsers)

module.exports = router;