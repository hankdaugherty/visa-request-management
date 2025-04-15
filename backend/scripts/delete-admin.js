const mongoose = require('mongoose');
require('dotenv').config();

const deleteAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const User = require('../models/User');
    
    const result = await User.deleteOne({ email: 'admin@example.com' });
    
    if (result.deletedCount > 0) {
      console.log('Admin user successfully deleted');
    } else {
      console.log('Admin user not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
};

deleteAdmin();
