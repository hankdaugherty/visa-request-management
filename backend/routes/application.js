const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const {
  createApplication,
  getApplications,
  getApplicationById,
  updateApplication
} = require('../controllers/applicationController');
const Application = require('../models/Application');

router.post('/', auth, createApplication);
router.get('/', auth, async (req, res) => {
  try {
    // Add debug logging
    console.log('User making request:', {
      userId: req.user._id,
      role: req.user.role
    });
    
    // For regular dashboard requests
    let query = { userId: req.user._id };
    
    // If user is admin and specifically requesting all applications
    if (req.user.role === 'admin' && req.query.admin === 'true') {
      query = {}; // Empty query to get all applications
      console.log('Admin requesting all applications');
    }
    
    console.log('Using query:', query);
    
    const applications = await Application.find(query)
      .populate('meeting')
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${applications.length} applications`);
    
    res.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ message: 'Error fetching applications', error: error.message });
  }
});

// Add the route directly in the file
router.get('/:id', auth, async (req, res) => {
  try {
    console.log('Attempting to fetch application with ID:', req.params.id);
    console.log('User ID:', req.user._id);
    console.log('User Role:', req.user.role);
    
    // Create the query based on user role
    const query = req.user.role === 'admin' 
      ? { _id: req.params.id }  // Admin can view any application
      : { _id: req.params.id, userId: req.user._id };  // Regular users can only view their own
    
    const application = await Application.findOne(query)
      .populate('userId', 'email')
      .populate('meeting', 'name');
    
    if (!application) {
      console.log('Application not found');
      return res.status(404).json({ message: 'Application not found' });
    }
    
    console.log('Found application:', application);
    res.json(application);
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', auth, updateApplication);

// Add this route after the other routes
router.delete('/:id', auth, async (req, res) => {
  try {
    const application = await Application.findByIdAndDelete(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({ message: 'Error deleting application' });
  }
});

module.exports = router; 