const mongoose = require('mongoose');
require('dotenv').config();

const checkAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const User = require('../models/User');
    
    const admin = await User.findOne({ email: 'admin@example.com' });
    if (admin) {
      console.log('Admin user found:', {
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role
      });
    } else {
      console.log('Admin user not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
};

checkAdmin();
