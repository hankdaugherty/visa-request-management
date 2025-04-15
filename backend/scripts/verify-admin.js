const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
require('dotenv').config();

const verifyAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const User = require('../models/User');
    
    const admin = await User.findOne({ email: 'admin@example.com' });
    if (admin) {
      console.log('Admin found:', {
        email: admin.email,
        passwordHash: admin.password,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role
      });

      // Test password match
      const testPassword = 'admin123';
      const isMatch = await bcryptjs.compare(testPassword, admin.password);
      console.log('Password test match:', isMatch);
    } else {
      console.log('Admin not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
};

verifyAdmin();
