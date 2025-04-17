const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Add debug middleware for all auth routes
router.use((req, res, next) => {
  console.log('Auth Route Request:', {
    method: req.method,
    path: req.path,
    body: req.body,
    headers: req.headers
  });
  next();
});

// Register new user
router.post('/register', async (req, res) => {
  console.log('Starting registration process...'); // Debug log
  
  try {
    const { email, password, firstName, lastName } = req.body;
    
    console.log('Registration data received:', { email, firstName, lastName }); // Debug log

    // Check if user already exists
    console.log('Checking for existing user...'); // Debug log
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists:', email); // Debug log
      return res.status(400).json({ message: 'User already exists' });
    }

    console.log('No existing user found, proceeding with registration'); // Debug log

    // Hash password
    console.log('Hashing password...'); // Debug log
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    console.log('Creating new user...'); // Debug log
    const user = new User({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: 'user' // Default role
    });

    console.log('Saving user to database...'); // Debug log
    await user.save();
    console.log('User saved successfully'); // Debug log

    // Create JWT token
    console.log('Generating JWT token...'); // Debug log
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('Registration complete, sending response...'); // Debug log
    res.status(201).json({
      token,
      userId: user._id,
      role: user.role
    });
  } catch (error) {
    console.error('Registration error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      message: 'Server error',
      details: error.message 
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for:', email);

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    console.log('User found:', user ? 'yes' : 'no');
    
    if (!user) {
      console.log('No user found with email:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    console.log('Password match:', isMatch ? 'yes' : 'no');
    
    if (!isMatch) {
      console.log('Password did not match for user:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.json({
      token,
      userId: user._id,
      role: user.role
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

    // Save token to user
    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    // Send email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: user.email,
      subject: '3GPP Visa Portal Password Reset',
      html: `
        <p>You requested a password reset.</p>
        <p>Click this <a href="${resetUrl}">link</a> to reset your password.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
      `
    });

    res.json({ message: 'Reset email sent' });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ message: 'Error sending reset email' });
  }
});

// Reset password with token
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;
    const { token } = req.params;

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Error resetting password' });
  }
});

// Change password (for logged-in users)
router.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('+password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash and save new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Error changing password' });
  }
});

module.exports = router; 