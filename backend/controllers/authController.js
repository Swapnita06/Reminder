const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const cleanAndValidatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  
  const cleanPassword = password.trim().replace(/\s+/g, '');
  
  if (cleanPassword.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }
  
  return cleanPassword;
};

exports.register = async (req, res) => {
  try {
    const { username, email, password, phone } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required' });
    }

    const cleanPassword = cleanAndValidatePassword(password);
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(cleanPassword, 12);

    const user = new User({
      username,
      email,
      password: hashedPassword,
      phone: phone || '',
      status: 'Hey there! I am using WhatsApp Clone', 
    });

    await user.save();

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d'
    });

    // Return user data without password
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(201).json({ user: userResponse, token });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: error.message || 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const cleanPassword = cleanAndValidatePassword(password);
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' }); 
    }

    const isMatch = await bcrypt.compare(cleanPassword, user.password);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' }); 
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d'
    });

    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(200).json({ user: userResponse, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: error.message || 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

exports.resetUserPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    
    if (!email || !newPassword) {
      return res.status(400).json({ message: 'Email and new password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const cleanPassword = cleanAndValidatePassword(newPassword);
    const hashedPassword = await bcrypt.hash(cleanPassword, 12);
    
    user.password = hashedPassword;
    await user.save();
    
    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ 
      message: error.message || 'Password reset failed',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

exports.authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ 
      message: 'Invalid or expired token',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch profile',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

exports.getUsers = async(req,res) =>{
  try{
    const users = await User.find({}) ;
    res.json(users)
  }
  catch(error){
    console.log(error)
  }
}

exports.updateProfile = async (req, res) => {
  try {
    const { username, status, phone } = req.body;

    if (!username && !status && !phone) {
      return res.status(400).json({ message: 'At least one field must be provided for update' });
    }

    const updatedFields = {};
    if (username) updatedFields.username = username;
    if (status) updatedFields.status = status;
    if (phone) updatedFields.phone = phone;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updatedFields,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      message: 'Failed to update profile',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};