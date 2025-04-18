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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = { userId: req.user._id };
    
    // If user is admin and specifically requesting all applications with pagination
    if (req.user.role === 'admin' && req.query.admin === 'true') {
      query = {}; // Empty query to get all applications
      
      const total = await Application.countDocuments(query);
      const applications = await Application.find(query)
        .populate('meeting')
        .populate('userId', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      // Return paginated response for admin view
      return res.json({
        applications,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit)
        }
      });
    }
    
    // For regular dashboard requests, return the old format (no pagination)
    const applications = await Application.find(query)
      .populate('meeting')
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 });
    
    // Return simple array for backwards compatibility
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
          status: record.status?.toLowerCase() === 'complete' ? 'Complete' : 'Pending',
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
          
          // Update administrative fields
          letterEmailedDate: record.letterEmailedDate ? new Date(record.letterEmailedDate) : undefined,
          hardCopyMailedDate: record.hardCopyMailedDate ? new Date(record.hardCopyMailedDate) : undefined,
          addressToMailHardCopy: record.addressToMailHardCopy || '',
          
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
      .populate('userId', 'firstName lastName email')
      .populate('lastUpdatedBy', 'firstName lastName email');
    
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

    // Update the application with lastUpdatedBy
    Object.assign(application, {
      ...req.body,
      lastUpdatedBy: req.user._id,
      updatedAt: new Date()
    });
    
    await application.save();
    
    // Fetch the updated application with populated fields
    const updatedApplication = await Application.findById(application._id)
      .populate('meeting')
      .populate('userId', 'firstName lastName email')
      .populate('lastUpdatedBy', 'firstName lastName email');
    
    res.json(updatedApplication);
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