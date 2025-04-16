const express = require('express');
const router = express.Router();
const Meeting = require('../models/Meeting');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Get all meetings (protected, admin only)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const meetings = await Meeting.find({});
    res.json(meetings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get active meetings (public endpoint for application form)
router.get('/active', async (req, res) => {
  try {
    const meetings = await Meeting.find({ isActive: true });
    res.json(meetings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin routes
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  const meeting = new Meeting({
    name: req.body.name,
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    location: req.body.location,
    isActive: req.body.isActive
  });

  try {
    const newMeeting = await meeting.save();
    res.status(201).json(newMeeting);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update meeting
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const meeting = await Meeting.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    res.json(meeting);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete meeting
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const meeting = await Meeting.findByIdAndDelete(req.params.id);
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    res.json({ message: 'Meeting deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 