const Application = require('../models/Application');

exports.createApplication = async (req, res) => {
  try {
    console.log('Creating application with data:', req.body);
    console.log('User from auth middleware:', req.user);

    const application = new Application({
      ...req.body,
      userId: req.user.id
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
    const application = await Application.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    res.json(application);
  } catch (error) {
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