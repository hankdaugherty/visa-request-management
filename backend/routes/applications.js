const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const multer = require('multer');
const { parse } = require('csv-parse');
const Meeting = require('../models/Meeting');
const Application = require('../models/Application');
const { APPLICATION_STATUSES } = require('../constants/statuses');
const upload = multer({ storage: multer.memoryStorage() });
const pdfService = require('../services/pdfService');
const fs = require('fs-extra');
const path = require('path');
const { PDFDocument, PDFForm } = require('pdf-lib');

// Add this helper function at the top
const getMeetingByName = async (name) => {
  const meeting = await Meeting.findOne({ name: name });
  if (!meeting) {
    throw new Error(`Meeting not found: ${name}`);
  }
  return meeting;
};

// Get statistics for admin dashboard
router.get('/stats', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin users can access statistics' });
    }

    const { meetingId } = req.query;
    let query = {};
    
    // Filter by meeting if provided
    if (meetingId) {
      query.meeting = meetingId;
    }

    // Get total count
    const total = await Application.countDocuments(query);
    
    // Get counts by status
    const pending = await Application.countDocuments({ ...query, status: { $regex: /^pending$/i } });
    const approved = await Application.countDocuments({ ...query, status: { $regex: /^approved$/i } });
    const rejected = await Application.countDocuments({ ...query, status: { $regex: /^rejected$/i } });

    res.json({
      total,
      pending,
      approved,
      rejected
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
});

// Add the base routes
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = { userId: req.user._id };
    let sort = { createdAt: -1 };

        // If user is admin and specifically requesting all applications with pagination
    if (req.user.role === 'admin' && req.query.admin === 'true') {
      query = {};
      const hasMeetingFilter = req.query.meetingId;
      const hasSearchFilter = req.query.search && req.query.search.trim();
      
      // Meeting filter
      if (hasMeetingFilter) {
        query.meeting = req.query.meetingId;
      }
      
      // Search filter - search by firstName, lastName, or email
      if (hasSearchFilter) {
        const searchTerm = req.query.search.trim();
        console.log('Search term received:', searchTerm);
        const searchConditions = {
          $or: [
            { firstName: { $regex: searchTerm, $options: 'i' } },
            { lastName: { $regex: searchTerm, $options: 'i' } },
            { email: { $regex: searchTerm, $options: 'i' } }
          ]
        };
        
        // If we have both meeting and search filters, combine them with $and
        if (hasMeetingFilter) {
          query = {
            $and: [
              { meeting: req.query.meetingId },
              searchConditions
            ]
          };
        } else {
          // Only search filter
          query = searchConditions;
        }
        console.log('Final query with search:', JSON.stringify(query, null, 2));
      }
      // Sorting
      const sortBy = req.query.sortBy || 'status';
      const sortDirection = req.query.sortDirection === 'asc' ? 1 : -1;
      if (sortBy === 'status') {
        // For status sorting, we need to fetch all applications for the meeting to sort properly
        const total = await Application.countDocuments(query);
        
        // Fetch all applications for this meeting to sort properly
        const allApplications = await Application.find(query)
          .populate('meeting')
          .populate('userId', 'firstName lastName email')
          .sort({ createdAt: -1 });

        // Sort applications in memory to prioritize pending
        allApplications.sort((a, b) => {
          const statusA = a.status.toLowerCase();
          const statusB = b.status.toLowerCase();
          
          // Define priority order - always prioritize pending first
          const priority = { 'pending': 1, 'approved': 2, 'rejected': 3 };
          
          const priorityA = priority[statusA] || 4;
          const priorityB = priority[statusB] || 4;
          
          if (priorityA !== priorityB) {
            return priorityA - priorityB;
          }
          
          // If same priority, sort by creation date (newest first)
          return new Date(b.createdAt) - new Date(a.createdAt);
        });

        // Apply pagination after sorting
        const applications = allApplications.slice(skip, skip + limit);

        return res.json({
          applications,
          pagination: {
            total,
            page,
            pages: Math.ceil(total / limit)
          }
        });
      } else {
        sort = { createdAt: sortDirection };
        
        const total = await Application.countDocuments(query);
        const applications = await Application.find(query)
          .populate('meeting')
          .populate('userId', 'firstName lastName email')
          .sort(sort)
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
    }
    
    // For regular dashboard requests, only show applications created by the user (not imported)
    const applications = await Application.find({
      ...query,
      isImported: { $ne: true }  // Only show non-imported applications
    })
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

    // Helper function to clean phone numbers that may have Excel formula format
    const cleanPhoneNumber = (value) => {
      if (!value) return value;
      const str = String(value).trim();
      // Remove Excel formula format: ="value" -> value
      if (str.startsWith('="') && str.endsWith('"')) {
        return str.slice(2, -1).replace(/""/g, '"');
      }
      return str;
    };

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
        
        // Check if application already exists using passport number and meeting
        const existingApplication = await Application.findOne({
          passportNumber: cleanPhoneNumber(record.passportNumber),
          meeting: meeting._id
        });

        if (existingApplication) {
          // Update existing application with new data
          Object.assign(existingApplication, {
            // Update all fields with new data
            email: record.email,
            lastName: record.lastName,
            firstName: record.firstName,
            birthdate: new Date(record.birthdate),
            passportNumber: cleanPhoneNumber(record.passportNumber),
            passportIssuingCountry: record.passportIssuingCountry,
            passportExpirationDate: new Date(record.passportExpirationDate),
            dateOfArrival: new Date(record.dateOfArrival),
            dateOfDeparture: new Date(record.dateOfDeparture),
            gender: record.gender,
            companyName: record.companyName,
            position: record.position,
            companyMailingAddress1: record.companyMailingAddress1,
            companyMailingAddress2: record.companyMailingAddress2 || '',
            city: record.city,
            state: record.state,
            postalCode: record.postalCode,
            country: record.country,
            phone: cleanPhoneNumber(record.phone),
            fax: cleanPhoneNumber(record.fax || ''),
            hotelName: record.hotelName || '',
            hotelConfirmation: cleanPhoneNumber(record.hotelConfirmation || ''),
            additionalInformation: record.additionalInformation || '',
            letterEmailedDate: record.letterEmailedDate ? new Date(record.letterEmailedDate) : undefined,
            hardCopyMailedDate: record.hardCopyMailedDate ? new Date(record.hardCopyMailedDate) : undefined,
            addressToMailHardCopy: record.addressToMailHardCopy || '',
            letterEmailed: record.letterEmailed === 'true' || false,
            hardCopyMailed: record.hardCopyMailed === 'true' || false,
            // Update status based on CSV data
            status: record.status?.toLowerCase() === 'approved' ? 'Approved' : APPLICATION_STATUSES[0],
            lastUpdatedBy: req.user._id,
            updatedAt: new Date(),
            // Mark as imported
            isImported: true,
            importedBy: req.user._id
          });

          await existingApplication.save();

          results.push({
            success: true,
            name: `${record.firstName} ${record.lastName}`,
            updated: true,
            reason: `Updated existing application for passport ${record.passportNumber}`
          });
          continue; // Move to next record
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
          status: record.status?.toLowerCase() === 'approved' ? 'Approved' : APPLICATION_STATUSES[0],
          entryDate: applicationDate,
          createdAt: applicationDate,  // This should now stick due to immutable: true
          // Mark as imported
          isImported: true,
          importedBy: req.user._id,
          
          // Required fields in order
          email: record.email,
          lastName: record.lastName,
          firstName: record.firstName,
          birthdate: new Date(record.birthdate),
          passportNumber: cleanPhoneNumber(record.passportNumber),
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
          phone: cleanPhoneNumber(record.phone),
          fax: cleanPhoneNumber(record.fax || ''),
          meeting: meeting._id,
          
          // Optional fields
          companyMailingAddress2: record.companyMailingAddress2 || '',
          hotelName: record.hotelName || '',
          hotelConfirmation: cleanPhoneNumber(record.hotelConfirmation || ''),
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

    // Update the response to include updated records
    const updatedRecords = results.filter(r => r.updated);
    const newRecords = results.filter(r => r.success && !r.updated);

    res.json({
      message: 'Import completed',
      total: records.length,
      successful: newRecords.length,
      updated: updatedRecords.length,
      failed: errors.length,
      errors,
      updatedRecords
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({
      message: 'Error processing import',
      error: error.message
    });
  }
});

// Export applications for a meeting as CSV - ADMIN ONLY
router.get('/export', auth, async (req, res) => {
  console.log('Export request received:', {
    user: req.user,
    meetingId: req.query.meetingId
  });

  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admin users can export applications' });
  }

  if (!req.query.meetingId) {
    return res.status(400).json({ message: 'Meeting ID is required' });
  }

  try {
    // Fetch all applications for the meeting
    const applications = await Application.find({ meeting: req.query.meetingId })
      .populate('meeting', 'name')
      .sort({ createdAt: -1 });

    if (applications.length === 0) {
      return res.status(404).json({ message: 'No applications found for this meeting' });
    }

    // Define CSV headers matching the import format
    const headers = [
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
      'companyMailingAddress2',
      'city',
      'state',
      'postalCode',
      'country',
      'phone',
      'fax',
      'hotelName',
      'hotelConfirmation',
      'additionalInformation',
      'meetingName',
      'applicationDate',
      'status',
      'letterEmailed',
      'letterEmailedDate',
      'hardCopyMailed',
      'hardCopyMailedDate',
      'addressToMailHardCopy'
    ];

    // Helper function to escape CSV fields
    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      // If value contains comma, quote, or newline, wrap in quotes and escape quotes
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    // Helper function to format numeric fields as text for Excel (prevents scientific notation)
    // Uses Excel formula format ="" which forces Excel to treat as text
    const formatAsText = (value) => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value).trim();
      if (!stringValue) return '';
      // If it looks like a number (digits, +, -, spaces, parentheses), use Excel formula format
      // This prevents Excel from converting to scientific notation
      if (/^[\d\+\-\s\(\)]+$/.test(stringValue) && stringValue.length > 0) {
        // Use Excel formula format: ="value" forces Excel to treat as text
        return `="${stringValue.replace(/"/g, '""')}"`;
      }
      return escapeCSV(value);
    };

    // Helper function to format date as YYYY-MM-DD
    const formatDate = (date) => {
      if (!date) return '';
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Build CSV content
    let csvContent = headers.join(',') + '\n';

    for (const app of applications) {
      const row = [
        escapeCSV(app.email),
        escapeCSV(app.lastName),
        escapeCSV(app.firstName),
        escapeCSV(formatDate(app.birthdate)),
        formatAsText(app.passportNumber),
        escapeCSV(app.passportIssuingCountry),
        escapeCSV(formatDate(app.passportExpirationDate)),
        escapeCSV(formatDate(app.dateOfArrival)),
        escapeCSV(formatDate(app.dateOfDeparture)),
        escapeCSV(app.gender),
        escapeCSV(app.companyName),
        escapeCSV(app.position),
        escapeCSV(app.companyMailingAddress1),
        escapeCSV(app.companyMailingAddress2 || ''),
        escapeCSV(app.city),
        escapeCSV(app.state),
        escapeCSV(app.postalCode),
        escapeCSV(app.country),
        formatAsText(app.phone),
        formatAsText(app.fax || ''),
        escapeCSV(app.hotelName || ''),
        formatAsText(app.hotelConfirmation || ''),
        escapeCSV(app.additionalInformation || ''),
        escapeCSV(app.meeting?.name || ''),
        escapeCSV(formatDate(app.entryDate || app.createdAt)),
        escapeCSV(app.status),
        escapeCSV(app.letterEmailedDate ? 'true' : 'false'),
        escapeCSV(formatDate(app.letterEmailedDate)),
        escapeCSV(app.hardCopyMailedDate ? 'true' : 'false'),
        escapeCSV(formatDate(app.hardCopyMailedDate)),
        escapeCSV(app.addressToMailHardCopy || '')
      ];
      csvContent += row.join(',') + '\n';
    }

    // Get meeting name for filename
    const meetingName = applications[0]?.meeting?.name || 'applications';
    const sanitizedMeetingName = meetingName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `${sanitizedMeetingName}_applications_${formatDate(new Date()).replace(/-/g, '')}.csv`;

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      message: 'Error exporting applications',
      error: error.message
    });
  }
});

// Generate PDF for approved applications - ADMIN ONLY (intentionally restricted for now)
router.get('/:id/pdf', auth, async (req, res) => {
  console.log('🚀 PDF ROUTE ENTERED - Starting PDF generation process');
  try {
    console.log('PDF route hit for application ID:', req.params.id);
    console.log('User requesting PDF:', req.user._id, 'Role:', req.user.role);
    
    const application = await Application.findById(req.params.id)
      .populate('meeting');
    
    if (!application) {
      console.log('Application not found for ID:', req.params.id);
      return res.status(404).json({ message: 'Application not found' });
    }

    console.log('Application found:', {
      id: application._id,
      status: application.status,
      userId: application.userId,
      meeting: application.meeting
    });

    // Check if user has permission - Users can generate PDFs for their own approved applications, admins can generate for any
    if (req.user.role !== 'admin') {
      // For regular users, check if they own this application
      if (application.userId.toString() !== req.user._id.toString()) {
        console.log('Permission denied. User:', req.user._id, 'does not own application:', application._id);
        return res.status(403).json({ message: 'You can only generate visa letters for your own applications' });
      }
    }

    // Check if application is approved
    if (application.status.toLowerCase() !== 'approved') {
      console.log('Application not approved. Status:', application.status);
      return res.status(400).json({ message: 'PDF can only be generated for approved applications' });
    }

    console.log('Generating PDF for approved application...');
    
    // Test PDF service import
    console.log('🔍 Testing PDF service import...');
    console.log('pdfService type:', typeof pdfService);
    console.log('pdfService methods:', Object.getOwnPropertyNames(pdfService));
    console.log('pdfService.generateVisaLetter type:', typeof pdfService.generateVisaLetter);
    
    // Debug the application data being passed to PDF service
    console.log('=== Route Debug - Application Data ===');
    console.log('Application object keys:', Object.keys(application));
    console.log('Application firstName:', application.firstName);
    console.log('Application lastName:', application.lastName);
    console.log('Application email:', application.email);
    console.log('Meeting data:', application.meeting);
    
    // Generate PDF
    let pdfResult;
    try {
      console.log('About to call pdfService.generateVisaLetter...');
      pdfResult = await pdfService.generateVisaLetter(application, application.meeting);
      console.log('PDF generated successfully:', pdfResult);
    } catch (pdfError) {
      console.error('Error in PDF generation:', pdfError);
      console.error('PDF error stack:', pdfError.stack);
      throw pdfError; // Re-throw to be caught by outer catch
    }
    
    // Update application with PDF generation info
    application.pdfGenerated = true;
    application.pdfGeneratedDate = new Date();
    await application.save();
    
    // Send the file
    res.download(pdfResult.path, pdfResult.filename, (err) => {
      if (err) {
        console.error('Error sending file:', err);
      }
      // Clean up the file after sending
      fs.remove(pdfResult.path).catch(console.error);
    });
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ message: 'Error generating PDF', error: error.message });
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
    const appUserId = application.userId && application.userId._id ? application.userId._id.toString() : application.userId.toString();
    if (req.user.role !== 'admin' && appUserId !== req.user._id.toString()) {
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
    // Prevent userId from being set by the frontend
    const { userId, ...safeBody } = req.body;
    const application = new Application({
      ...safeBody,
      userId: req.user._id,
      status: APPLICATION_STATUSES[0]
    });
    
    await application.save();
    res.status(201).json(application);
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({ message: 'Error creating application', error: error.message });
  }
});



module.exports = router; 