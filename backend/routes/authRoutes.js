const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

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

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
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

module.exports = router; 