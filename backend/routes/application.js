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
    console.log('Fetching applications for user:', req.user._id);
    const applications = await Application.find({ userId: req.user._id });
    console.log('Found applications:', applications.length);
    res.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add the route directly in the file
router.get('/:id', auth, async (req, res) => {
  try {
    console.log('Attempting to fetch application with ID:', req.params.id);
    console.log('User ID:', req.user._id);
    
    const application = await Application.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
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

module.exports = router; 