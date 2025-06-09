const Application = require('../models/Application');
const Meeting = require('../models/Meeting');
// Allowed status values shared across the backend
const { APPLICATION_STATUSES } = require('../constants/statuses');

exports.createApplication = async (req, res) => {
  try {
    console.log('Creating application with data:', req.body);
    console.log('User from auth middleware:', req.user);

    const { meetingId, ...otherData } = req.body;
    const application = new Application({
      meeting: meetingId,
      userId: req.user.id,
      ...otherData
    });
    
    await application.save();
    console.log('Application saved successfully:', application);
    res.status(201).json(application);
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
};

exports.getApplications = async (req, res) => {
  try {
    const applications = await Application.find({ userId: req.user.id });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateApplication = async (req, res) => {
  try {
    console.log('Update application request:', {
      applicationId: req.params.id,
      userId: req.user._id,
      userRole: req.user.role,
      requestBody: req.body
    });

    // First find the application
    const application = await Application.findById(req.params.id);
    
    if (!application) {
      console.log('Application not found');
      return res.status(404).json({ message: 'Application not found' });
    }

    console.log('Found application:', {
      applicationId: application._id,
      applicationUserId: application.userId,
      applicationStatus: application.status
    });

    // Check permissions
    const isOwner = application.userId.toString() === req.user._id.toString();
    const PENDING_STATUS = APPLICATION_STATUSES[0];
    const isPending = application.status === PENDING_STATUS;

    console.log('Permission check:', {
      isOwner,
      isPending,
      userRole: req.user.role
    });

    // Allow updates if:
    // 1. User owns the application AND it's pending, OR
    // 2. User is an admin
    if (!(isOwner && isPending) && req.user.role !== 'admin') {
      console.log('Update permission denied');
      return res.status(403).json({
        message: 'Not authorized to update this application'
      });
    }

    // Perform the update
    const updatedApplication = await Application.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('meeting');

    console.log('Application updated successfully');
    res.json(updatedApplication);
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getApplicationById = async (req, res) => {
  try {
    const application = await Application.findOne({ 
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    res.json(application);
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 