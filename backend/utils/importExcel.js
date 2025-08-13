const csv = require('csv-parse');
const fs = require('fs');
const Application = require('../models/Application');
const User = require('../models/User');
const { sendEmail } = require('./sendEmail');
const { APPLICATION_STATUSES } = require('../constants/statuses');

exports.importApplications = async (filePath, adminUserId) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const errors = [];

    fs.createReadStream(filePath)
      .pipe(csv({
        columns: true,
        skip_empty_lines: true,
        trim: true
      }))
      .on('data', async (data) => {
        try {
          // Create a temporary user account for existing applications
          const tempUser = await User.findOneAndUpdate(
            { email: data.email },
            {
              email: data.email,
              firstName: data.firstName,
              lastName: data.lastName,
              password: Math.random().toString(36).slice(-8), // Generate random password
              role: 'applicant'
            },
            { upsert: true, new: true }
          );

          // Create application
          const application = new Application({
            userId: tempUser._id,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            nationality: data.nationality,
            passportNumber: data.passportNumber,
            passportExpiryDate: new Date(data.passportExpiryDate),
            dateOfBirth: new Date(data.dateOfBirth),
            phoneNumber: data.phoneNumber,
            organization: data.organization,
            role: data.role,
            status: data.status || APPLICATION_STATUSES[0],
            submittedAt: new Date(data.submittedDate) || new Date(),
            lastUpdatedBy: adminUserId,
            // Mark as imported
            isImported: true,
            importedBy: adminUserId
          });

          await application.save();
          results.push(application);
        } catch (error) {
          errors.push({ row: data, error: error.message });
        }
      })
      .on('end', () => {
        resolve({ imported: results.length, errors });
      })
      .on('error', reject);
  });
}; 