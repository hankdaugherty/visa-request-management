const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const User = require('../models/User');

    // First delete any existing admin
    await User.deleteOne({ email: 'admin@example.com' });

    // Create new admin with bcrypt
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = new User({
      email: 'admin@example.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isEmailVerified: true
    });

    await adminUser.save();

    console.log('Admin user created:');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    
    // Verify the user was created
    const verifyUser = await User.findOne({ email: 'admin@example.com' }).select('+password');
    if (verifyUser) {
      console.log('Verified: Admin user exists in database');
      console.log('Stored password hash:', verifyUser.password);
      
      // Test the password
      const testMatch = await bcrypt.compare('admin123', verifyUser.password);
      console.log('Password test match:', testMatch);
    }

  } catch (error) {
    console.error('Error seeding admin:', error);
  } finally {
    await mongoose.disconnect();
  }
};

seedAdmin();
