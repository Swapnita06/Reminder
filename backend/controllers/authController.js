const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
  try {
    const { username, email, password, phone } = req.body;
    // Log raw input to see exactly what's being sent
    console.log('REGISTER - Raw password input:', `"${password}"`);
    
    // Consistently use cleanPassword to handle any whitespace issues
    const cleanPassword = password.replace(/\s+/g, '');
    
    if (cleanPassword.length !== password.length) {
      console.log('REGISTER - Stripped', password.length - cleanPassword.length, 'hidden chars');
    }
    console.log('REGISTER - Cleaned password:', `"${cleanPassword}"`);
    console.log('REGISTER - Cleaned length:', cleanPassword.length);
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password using the cleanPassword
    const hashedPassword = await bcrypt.hash(cleanPassword, 12);
    console.log('REGISTER - Generated hash:', hashedPassword);

    // Create user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      phone,
      status: 'Hey there! I am using WhatsApp Clone', 
    });

    await user.save();
    console.log('REGISTER - Saved user with hash:', user.password);

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d'
    });

    res.status(201).json({ user, token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('LOGIN - Raw password input:', `"${password}"`);
    
    // Use the same cleaning method as registration
    const cleanPassword = password.replace(/\s+/g, '');

    console.log('LOGIN - Cleaned password:', `"${cleanPassword}"`);
    console.log('LOGIN - Cleaned length:', cleanPassword.length);

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    console.log('LOGIN - Stored hash:', user.password);
    
    // Try a few variations for comparison to identify what might be wrong
    console.log('===== PASSWORD COMPARISON TESTS =====');
    
    // 1. Clean password (what we expect to work)
    const cleanMatch = await bcrypt.compare(cleanPassword, user.password);
    console.log('Test 1 - Clean password match:', cleanMatch);
    
    // 2. Raw password with potential whitespace
    const rawMatch = await bcrypt.compare(password, user.password);
    console.log('Test 2 - Raw password match:', rawMatch);
    
    // 3. Try with the literal string "hardeep123"
    const literalMatch = await bcrypt.compare("hardeep123", user.password);
    console.log('Test 3 - Literal "hardeep123" match:', literalMatch);
    
    // 4. Debugging special characters - convert to hex to see if there are hidden chars
    console.log('Password as hex:', Buffer.from(password).toString('hex'));
    console.log('CleanPassword as hex:', Buffer.from(cleanPassword).toString('hex'));
    
    // Check password using the cleanPassword
    const isMatch = await bcrypt.compare(cleanPassword, user.password); 
    
    if (!isMatch) {
      return res.status(400).json({ 
        message: 'Invalid password',
        debug: {
          cleanMatch,
          rawMatch,
          literalMatch,
          passwordHex: Buffer.from(password).toString('hex'),
          cleanPasswordHex: Buffer.from(cleanPassword).toString('hex')
        }
      });
    }

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d'
    });

    res.status(200).json({ user, token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

// Add a password reset helper endpoint for debugging
exports.resetUserPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    
    // Find the user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Clean and hash the new password
    const cleanPassword = newPassword.replace(/\s+/g, '');
    const hashedPassword = await bcrypt.hash(cleanPassword, 12);
    
    // Update the user's password
    user.password = hashedPassword;
    await user.save();
    
    console.log('RESET - Password reset for user:', email);
    console.log('RESET - New clean password:', `"${cleanPassword}"`);
    console.log('RESET - New hash:', hashedPassword);
    
    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

exports.authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

exports.getProfile = async (req, res) => {
  res.status(200).json(req.user);
};

exports.updateProfile = async (req, res) => {
  try {
    const { username, status, phone } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { username, status, phone },
      { new: true }
    ).select('-password');

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
};