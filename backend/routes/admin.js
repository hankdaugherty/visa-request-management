const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Application = require('../models/Application');

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin only.' });
  }
};

// Get all applications (admin only)
router.get('/applications', auth, isAdmin, async (req, res) => {
  try {
    console.log('Fetching all applications for admin');
    const applications = await Application.find()
      .populate('userId', 'email firstName lastName')
      .sort('-createdAt');
    console.log(`Found ${applications.length} applications`);
    res.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 