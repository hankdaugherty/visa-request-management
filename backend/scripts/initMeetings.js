const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Meeting = require('../models/Meeting');

dotenv.config();

const meetings = [
  {
    name: 'Dallas 2025',
    startDate: new Date('2025-11-17'),
    endDate: new Date('2025-11-21'),
    location: 'Dallas, TX',
    isActive: true
  },
  {
    name: 'Calgary 2026',
    startDate: new Date('2026-11-16'),
    endDate: new Date('2026-11-21'),
    location: 'Calgary, AB',
    isActive: true
  }
];

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB Connected');
    
    try {
      // Clear existing meetings
      await Meeting.deleteMany({});
      
      // Insert new meetings
      await Meeting.insertMany(meetings);
      
      console.log('Meetings initialized successfully');
      process.exit(0);
    } catch (error) {
      console.error('Error initializing meetings:', error);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  }); 