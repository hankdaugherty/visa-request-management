const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const multer = require('multer');
const { parse } = require('csv-parse');
const Meeting = require('../models/Meeting');
const Application = require('../models/Application');
const upload = multer({ storage: multer.memoryStorage() });

// Add this helper function at the top
const getMeetingByName = async (name) => {
  const meeting = await Meeting.findOne({ name: name });
  if (!meeting) {
    throw new Error(`Meeting not found: ${name}`);
  }
  return meeting;
};

// Add the base routes
router.get('/', auth, async (req, res) => {
  try {
    // Add debug logging
    console.log('User making request:', {
      userId: req.user._id,
      role: req.user.role
    });
    
    // For regular dashboard requests
    let query = { userId: req.user._id };
    
    // If user is admin and specifically requesting all applications
    if (req.user.role === 'admin' && req.query.admin === 'true') {
      query = {}; // Empty query to get all applications
      console.log('Admin requesting all applications');
    }
    
    console.log('Using query:', query);
    
    const applications = await Application.find(query)
      .populate('meeting')
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${applications.length} applications`);
    
    res.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ message: 'Error fetching applications', error: error.message });
  }
});

// Add the import route
router.post('/import', auth, upload.single('file'), async (req, res) => {
  console.log('Import request received:', {
    user: req.user,
    file: req.file ? 'Present' : 'Missing'
  });

  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admin users can import applications' });
  }

  if (!req.file) {
    console.log('No file in request');
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    const results = [];
    const errors = [];

    // Parse CSV file
    const records = await new Promise((resolve, reject) => {
      parse(req.file.buffer.toString(), {
        columns: true,
        skip_empty_lines: true,
        trim: true
      }, (err, data) => {
        if (err) {
          console.error('CSV parsing error:', err);
          reject(err);
        } else {
          console.log(`Successfully parsed ${data.length} records`);
          resolve(data);
        }
      });
    });

    // Process each record
    for (const record of records) {
      try {
        // Validate required fields
        const requiredFields = [
          'email',
          'lastName',
          'firstName',
          'birthdate',
          'passportNumber',
          'passportIssuingCountry',
          'passportExpirationDate',
          'dateOfArrival',
          'dateOfDeparture',
          'gender',
          'companyName',
          'position',
          'companyMailingAddress1',
          'city',
          'state',
          'postalCode',
          'country',
          'phone',
          'meetingName',
          'applicationDate'
        ];

        const missingFields = requiredFields.filter(field => !record[field]);
        if (missingFields.length > 0) {
          throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        // Convert meeting name to ID
        const meeting = await getMeetingByName(record.meetingName);
        
        // Check if application already exists
        const existingApplication = await Application.findOne({
          firstName: record.firstName,
          lastName: record.lastName,
          meeting: meeting._id
        });

        if (existingApplication) {
          results.push({
            success: false,
            name: `${record.firstName} ${record.lastName}`,
            skipped: true,
            reason: `Application already exists for this person and meeting`
          });
          continue; // Skip to next record
        }

        // Parse and validate applicationDate
        let applicationDate;
        try {
          applicationDate = new Date(record.applicationDate);
          if (isNaN(applicationDate.getTime())) {
            throw new Error('Invalid date format');
          }
        } catch (err) {
          throw new Error(`Invalid applicationDate format. Expected YYYY-MM-DD but got: ${record.applicationDate}`);
        }

        // Create new application document with timestamps disabled
        const application = new Application({
          // System fields
          userId: req.user._id,
          status: record.status?.toLowerCase() === 'complete' ? 'complete' : 'pending',
          entryDate: applicationDate,
          createdAt: applicationDate,  // This should now stick due to immutable: true
          
          // Required fields in order
          email: record.email,
          lastName: record.lastName,
          firstName: record.firstName,
          birthdate: new Date(record.birthdate),
          passportNumber: record.passportNumber,
          passportIssuingCountry: record.passportIssuingCountry,
          passportExpirationDate: new Date(record.passportExpirationDate),
          dateOfArrival: new Date(record.dateOfArrival),
          dateOfDeparture: new Date(record.dateOfDeparture),
          gender: record.gender,
          companyName: record.companyName,
          position: record.position,
          companyMailingAddress1: record.companyMailingAddress1,
          city: record.city,
          state: record.state,
          postalCode: record.postalCode,
          country: record.country,
          phone: record.phone,
          fax: record.fax || '',
          meeting: meeting._id,
          
          // Optional fields
          companyMailingAddress2: record.companyMailingAddress2 || '',
          hotelName: record.hotelName || '',
          hotelConfirmation: record.hotelConfirmation || '',
          additionalInformation: record.additionalInformation || '',
          
          // Administrative fields (if provided in the CSV)
          letterEmailed: record.letterEmailed === 'true' || false,
          hardCopyMailed: record.hardCopyMailed === 'true' || false,
          hardCopyMailedDate: record.hardCopyMailedDate ? new Date(record.hardCopyMailedDate) : undefined,
          addressToMailHardCopy: record.addressToMailHardCopy || ''
        }, { timestamps: false }); // Disable automatic timestamp handling

        await application.save();

        results.push({
          success: true,
          name: `${record.firstName} ${record.lastName}`,
          status: application.status
        });
      } catch (err) {
        errors.push({
          name: `${record.firstName} ${record.lastName}` || 'Unknown',
          error: err.message
        });
      }
    }

    // Update the response to include skipped records
    const skippedRecords = results.filter(r => r.skipped);
    const successfulRecords = results.filter(r => r.success && !r.skipped);

    res.json({
      message: 'Import completed',
      total: records.length,
      successful: successfulRecords.length,
      skipped: skippedRecords.length,
      failed: errors.length,
      errors,
      skippedRecords
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({
      message: 'Error processing import',
      error: error.message
    });
  }
});

// Get single application by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('meeting')
      .populate('userId', 'firstName lastName email');
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if user has permission to view this application
    if (req.user.role !== 'admin' && application.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this application' });
    }

    res.json(application);
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ message: 'Error fetching application', error: error.message });
  }
});

// Update application
router.put('/:id', auth, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    // Check permission
    if (req.user.role !== 'admin' && application.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this application' });
    }

    // Update the application
    Object.assign(application, req.body);
    await application.save();
    
    res.json(application);
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({ message: 'Error updating application', error: error.message });
  }
});

// Delete application
router.delete('/:id', auth, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check permission
    if (req.user.role !== 'admin' && application.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this application' });
    }

    await Application.findByIdAndDelete(req.params.id);  // ✅ This replaces application.remove()
    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({ message: 'Error deleting application', error: error.message });
  }
});


// Add this after the GET route
router.post('/', auth, async (req, res) => {
  try {
    const application = new Application({
      ...req.body,
      userId: req.user._id,
      status: 'Pending'
    });
    
    await application.save();
    res.status(201).json(application);
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({ message: 'Error creating application', error: error.message });
  }
});

module.exports = router; 