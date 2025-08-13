const csv = require('csv-parse');
const fs = require('fs');
const User = require('../models/User');
const Application = require('../models/Application');
const { sendEmail } = require('./sendEmail');

const parseDate = (dateStr) => {
  if (!dateStr) return null;
  // Handle various date formats from the CSV
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
};

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
      .on('data', async (row) => {
        try {
          // Create or find user account
          const user = await User.findOneAndUpdate(
            { email: row.Email.toLowerCase() },
            {
              email: row.Email.toLowerCase(),
              firstName: row['First Name'],
              lastName: row['Last Name'],
              role: 'applicant',
              // Generate a random password that user will need to reset
              password: Math.random().toString(36).slice(-8)
            },
            { upsert: true, new: true }
          );

          // Create application
          const application = new Application({
            userId: user._id,
            entryDate: parseDate(row['Entry Date']),
            email: row.Email,
            lastName: row['Last Name'],
            firstName: row['First Name'],
            birthdate: parseDate(row.Birthdate),
            gender: row.Gender,
            passportNumber: row['Passport number'],
            passportIssuingCountry: row['Passport issuing country'],
            passportExpirationDate: parseDate(row['Passport Expiration Date']),
            dateOfArrival: parseDate(row['Date of Arrival']),
            dateOfDeparture: parseDate(row['Date of Departure']),
            companyName: row['Company name'],
            position: row.Position,
            companyAddress: {
              line1: row['Company mailing address 1'],
              line2: row['Company mailing address 2'],
              city: row.City,
              state: row.State,
              postalCode: row['Postal Code'],
              country: row.Country
            },
            phone: row.Phone,
            fax: row.Fax,
            hotelName: row['Hotel Name'],
            hotelConfirmation: row['Hotel confirmation'],
            additionalInformation: row['Additional Information'],
            pickUpInOrlando: row['Pick up in Orlando'] === 'checked',
            letterEmailed: parseDate(row['Letter Emailed']),
            hardCopyMailed: !!row['Hard Copy Mailed'],
            hardCopyMailedAddress: row['Address to mail hard copy'],
            hardCopyMailedDate: parseDate(row['Hard Copy Mailed Date']),
            additionalDocumentation: row['Additional Documentation'],
            lastUpdatedBy: adminUserId,
            // Mark as imported
            isImported: true,
            importedBy: adminUserId
          });

          await application.save();
          results.push(application);

          // Send email to user about account creation
          await sendEmail(user.email, 'accountCreated', {
            name: `${user.firstName} ${user.lastName}`,
            resetPasswordLink: `${process.env.FRONTEND_URL}/reset-password?token=${user.resetPasswordToken}`
          });

        } catch (error) {
          errors.push({
            row: row['Entry Date'],
            email: row.Email,
            error: error.message
          });
        }
      })
      .on('end', () => {
        resolve({
          imported: results.length,
          errors: errors,
          total: results.length + errors.length
        });
      })
      .on('error', reject);
  });
}; 