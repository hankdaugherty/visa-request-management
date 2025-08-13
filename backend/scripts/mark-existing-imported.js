const mongoose = require('mongoose');
const Application = require('../models/Application');
const User = require('../models/User');

// Load environment variables
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/visa-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function markExistingImported() {
  try {
    console.log('Starting to mark existing applications as imported...');
    
    // Find all admin users
    const adminUsers = await User.find({ role: 'admin' });
    console.log(`Found ${adminUsers.length} admin users`);
    
    // For each admin user, find applications they created and mark them as imported
    for (const adminUser of adminUsers) {
      console.log(`Processing admin user: ${adminUser.email}`);
      
      // Find applications created by this admin user
      const applications = await Application.find({ 
        userId: adminUser._id,
        isImported: { $ne: true } // Only process applications not already marked
      });
      
      console.log(`Found ${applications.length} applications to mark as imported for ${adminUser.email}`);
      
      if (applications.length > 0) {
        // Mark these applications as imported
        const result = await Application.updateMany(
          { 
            userId: adminUser._id,
            isImported: { $ne: true }
          },
          { 
            $set: { 
              isImported: true,
              importedBy: adminUser._id
            }
          }
        );
        
        console.log(`Updated ${result.modifiedCount} applications for ${adminUser.email}`);
      }
    }
    
    console.log('Finished marking existing applications as imported');
    
    // Show summary
    const totalImported = await Application.countDocuments({ isImported: true });
    const totalApplications = await Application.countDocuments({});
    
    console.log(`\nSummary:`);
    console.log(`Total applications: ${totalApplications}`);
    console.log(`Total imported applications: ${totalImported}`);
    console.log(`Total non-imported applications: ${totalApplications - totalImported}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

markExistingImported();
