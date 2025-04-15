const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Application = require('../models/Application');

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  console.log('Checking admin status:', {
    userId: req.user._id,
    userRole: req.user.role
  });
  
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin only.' });
  }
};

// Get all applications (admin only)
router.get('/applications', auth, isAdmin, async (req, res) => {
  try {
    console.log('Admin fetching all applications');
    const applications = await Application.find({})  // Explicitly use empty filter
      .populate('userId', 'email firstName lastName')
      .populate('meeting', 'name')
      .sort('-createdAt');
    
    console.log(`Found ${applications.length} applications total`);
    res.json(applications);
  } catch (error) {
    console.error('Error fetching admin applications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 