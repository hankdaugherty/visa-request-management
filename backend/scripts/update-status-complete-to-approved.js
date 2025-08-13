const mongoose = require('mongoose');
require('dotenv').config();

// Import the Application model
const Application = require('../models/Application');

async function updateStatuses() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Find all applications with status "Complete" (case-insensitive)
    const applicationsToUpdate = await Application.find({
      status: { $regex: /^complete$/i }
    });

    console.log(`Found ${applicationsToUpdate.length} applications with status "Complete"`);

    if (applicationsToUpdate.length === 0) {
      console.log('No applications to update. All applications already have the correct status.');
      return;
    }

    // Update all applications with status "Complete" to "Approved"
    const result = await Application.updateMany(
      { status: { $regex: /^complete$/i } },
      { $set: { status: 'Approved' } }
    );

    console.log(`Successfully updated ${result.modifiedCount} applications from "Complete" to "Approved"`);

    // Verify the update
    const remainingComplete = await Application.find({
      status: { $regex: /^complete$/i }
    });
    console.log(`Remaining applications with status "Complete": ${remainingComplete.length}`);

    // Show some examples of updated applications
    const updatedApplications = await Application.find({
      status: 'Approved'
    }).limit(5);
    
    console.log('\nSample of updated applications:');
    updatedApplications.forEach(app => {
      console.log(`- ${app.firstName} ${app.lastName}: ${app.status}`);
    });

  } catch (error) {
    console.error('Error updating statuses:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the script
updateStatuses();
