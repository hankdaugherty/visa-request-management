const fs = require('fs-extra');
const path = require('path');
const { PDFDocument, PDFForm, StandardFonts, PDFName } = require('pdf-lib');
const { execFile } = require('child_process');

class PDFService {
  constructor() {
    // Update path to point to the backend directory where we'll store the template
    this.templatePath = path.join(__dirname, '../templates/visa-letter-template.pdf');
    this.outputDir = path.join(__dirname, '../generated-pdfs');
    
    // Ensure output directory exists
    fs.ensureDirSync(this.outputDir);
    
    // Initialize template cache
    this.templateCache = null;
    this.templateLoaded = false;
  }

  // Try to normalize a PDF using Ghostscript if installed
  normalizeWithGhostscript(filePath) {
    return new Promise(async (resolve, reject) => {
      try {
        const exeCandidates = [
          'gswin64c',
          'gswin32c',
          'gs'
        ];
        const outputPath = filePath.replace(/\.pdf$/i, '.normalized.pdf');
        const args = [
          '-sDEVICE=pdfwrite',
          '-dCompatibilityLevel=1.4',
          '-dDetectDuplicateImages=true',
          '-dColorImageDownsampleType=/Bicubic',
          '-dColorImageResolution=300',
          '-dGrayImageDownsampleType=/Bicubic',
          '-dGrayImageResolution=300',
          '-dMonoImageDownsampleType=/Subsample',
          '-dMonoImageResolution=600',
          '-dPDFSETTINGS=/prepress',
          '-dEmbedAllFonts=true',
          '-dSubsetFonts=true',
          '-dNOPAUSE',
          '-dQUIET',
          '-dBATCH',
          `-sOutputFile=${outputPath}`,
          filePath
        ];

        const tryExec = (idx) => {
          if (idx >= exeCandidates.length) return reject(new Error('Ghostscript not found'));
          const exe = exeCandidates[idx];
          execFile(exe, args, { windowsHide: true }, async (err) => {
            if (err) {
              return tryExec(idx + 1);
            }
            try {
              const exists = await fs.pathExists(outputPath);
              if (!exists) return reject(new Error('Ghostscript did not produce output'));
              const normalizedFilename = path.basename(outputPath);
              return resolve({ path: outputPath, filename: normalizedFilename });
            } catch (e) {
              return reject(e);
            }
          });
        };

        tryExec(0);
      } catch (e) {
        return reject(e);
      }
    });
  }

  async loadTemplate() {
    try {
      console.log('Loading PDF template from:', this.templatePath);
      console.log('Current working directory:', process.cwd());
      console.log('__dirname:', __dirname);
      
      // Check if template file exists
      if (!await fs.pathExists(this.templatePath)) {
        console.error('Template file not found at:', this.templatePath);
        // List contents of templates directory
        try {
          const templatesDir = path.dirname(this.templatePath);
          const files = await fs.readdir(templatesDir);
          console.log('Files in templates directory:', files);
        } catch (dirError) {
          console.error('Error reading templates directory:', dirError);
        }
        throw new Error(`Template file not found at: ${this.templatePath}`);
      }
      
      const templateBytes = await fs.readFile(this.templatePath);
      console.log('Template file read successfully, size:', templateBytes.length);
      this.templateCache = templateBytes;
      this.templateLoaded = true;
      console.log('PDF template loaded and cached successfully');
    } catch (error) {
      console.error('Error loading PDF template:', error);
      throw new Error('Failed to load PDF template: ' + error.message);
    }
  }

  async generateVisaLetter(application, meeting) {
    try {
      console.log('Starting PDF generation for:', application.firstName, application.lastName);
      
      // Debug the complete application object
      console.log('=== Complete Application Object Debug ===');
      console.log('Application object keys:', Object.keys(application));
      console.log('Application object values:', {
        firstName: application.firstName,
        lastName: application.lastName,
        email: application.email,
        companyName: application.companyName,
        city: application.city,
        country: application.country
      });
      console.log('Application object types:', {
        firstName: typeof application.firstName,
        lastName: typeof application.lastName,
        email: typeof application.email
      });
      
      // Load template if not already loaded
      if (!this.templateLoaded) {
        await this.loadTemplate();
      }
      
      // Use cached template
      if (!this.templateCache) {
        throw new Error('PDF template not loaded');
      }
      
      // Store original template size for comparison
      const originalTemplateSize = this.templateCache.length;
      console.log('Original template size:', (originalTemplateSize / (1024 * 1024)).toFixed(2), 'MB');
      
      const pdfDoc = await PDFDocument.load(this.templateCache);
      console.log('PDF template loaded from cache successfully');
      
      // Get the form from the PDF
      const form = pdfDoc.getForm();
      const formFields = form.getFields();
      
      console.log('PDF form fields found:', formFields.map(field => ({
        name: field.getName(),
        type: field.constructor.name,
        isReadOnly: field.isReadOnly()
      })));
      
      // Fill in the form fields with application data
      try {
        console.log('=== Starting PDF Field Population ===');
        console.log('Application data summary:', {
          name: `${application.firstName} ${application.lastName}`,
          email: application.email,
          passport: {
            number: application.passportNumber,
            country: application.passportIssuingCountry,
            expiration: application.passportExpirationDate
          },
          travel: {
            arrival: application.dateOfArrival,
            departure: application.dateOfDeparture
          },
          meeting: {
            name: meeting?.name,
            location: meeting?.location,
            startDate: meeting?.startDate,
            endDate: meeting?.endDate
          }
        });
        
        // Personal Information - using exact field names from template
        this.setFormField(form, 'first_name', application.firstName);
        this.setFormField(form, 'last_name', application.lastName);
        this.setFormField(form, 'full_name', `${application.firstName} ${application.lastName},`);
        this.setFormField(form, 'applicant_email', application.email);
        this.setFormField(form, 'birth_date_af_date', this.formatDateForPDF(application.birthdate));
        
        // Passport Information - consolidated field
        const passportInfo = [
          application.passportNumber,
          application.passportIssuingCountry,
          this.formatDateForPDF(application.passportExpirationDate)
        ].filter(Boolean).join(' / ');
        this.setFormField(form, 'passport_information', passportInfo);
        console.log('Set passport_information field to:', passportInfo);
        console.log('Passport data:', {
          number: application.passportNumber,
          country: application.passportIssuingCountry,
          expiration: application.passportExpirationDate
        });
        
        // Gender
        this.setFormField(form, 'gender', application.gender);
        
        // Company Information
        this.setFormField(form, 'company_name', application.companyName);
        this.setFormField(form, 'position', application.position);
        
        // Address Information - consolidated field
        const addressParts = [
          application.companyMailingAddress1,
          application.companyMailingAddress2
        ].filter(Boolean);
        const fullAddress = addressParts.join(', ');
        this.setFormField(form, 'mailing_address', fullAddress);
        console.log('Set mailing_address field to:', fullAddress);
        console.log('Address data:', {
          address1: application.companyMailingAddress1,
          address2: application.companyMailingAddress2,
          consolidated: fullAddress
        });
        
        // City, Postal Code, and Country as separate fields
        this.setFormField(form, 'city', application.city);
        this.setFormField(form, 'postal_code', application.postalCode);
        this.setFormField(form, 'country', application.country);
        
        // Contact Information
        this.setFormField(form, 'phone', application.phone);
        this.setFormField(form, 'fax', application.fax);
        
        // Travel Information - consolidated field
        const travelInfo = [
          this.formatDateForPDF(application.dateOfArrival),
          this.formatDateForPDF(application.dateOfDeparture)
        ].filter(Boolean).join(' / ');
        this.setFormField(form, 'travel_dates_af_date', travelInfo);
        console.log('Set travel_dates_af_date field to:', travelInfo);
        console.log('Travel data:', {
          arrival: application.dateOfArrival,
          departure: application.dateOfDeparture,
          formatted: travelInfo
        });
        
        // Meeting Information - new fields
        this.setFormField(form, 'meeting_name', meeting?.name || 'Unknown Meeting');
        console.log('Set meeting_name field to:', meeting?.name || 'Unknown Meeting');
        
        // Format meeting information as: "meeting_name, held in [meeting location] on [meeting dates]"
        const meetingLocation = meeting?.location || 'Dallas, TX'; // Default location if not specified
        const meetingDates = this.formatMeetingDates(meeting?.startDate, meeting?.endDate);
        const meetingInfo = `${meeting?.name || 'Unknown Meeting'}, held in ${meetingLocation} on ${meetingDates}`;
        this.setFormField(form, 'meeting_information', meetingInfo);
        console.log('Set meeting_information field to:', meetingInfo);
        console.log('Meeting data:', {
          name: meeting?.name,
          location: meetingLocation,
          startDate: meeting?.startDate,
          endDate: meeting?.endDate,
          formatted: meetingInfo
        });
        
        // Hotel Information
        this.setFormField(form, 'hotel_name', application.hotelName);
        this.setFormField(form, 'hotel_confirmation_number', application.hotelConfirmation);
        
        // Set today's date
        this.setFormField(form, 'todays_date_af_date', this.formatDateForPDF(new Date().toISOString()));
        
        console.log('Form fields populated successfully');
        
        // Ensure field appearances use a well-supported embedded font for print reliability
        console.log('Embedding standard font and updating field appearances...');
        const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
        form.updateFieldAppearances(helvetica);
        
        // Flatten the form fields to make them non-editable and printable everywhere
        console.log('Flattening form fields to make them non-editable...');
        form.flatten();
        console.log('Form fields flattened successfully');

        // Remove AcroForm and page annotations to avoid printer issues in Acrobat
        try {
          console.log('Removing AcroForm and page annotations for compatibility...');
          // Delete AcroForm from catalog
          if (pdfDoc.catalog.get(PDFName.of('AcroForm'))) {
            pdfDoc.catalog.delete(PDFName.of('AcroForm'));
          }
          // Remove annotations from each page
          const pagesForCleanup = pdfDoc.getPages();
          pagesForCleanup.forEach((p) => {
            try { p.node.delete(PDFName.of('Annots')); } catch (_) {}
          });
          console.log('AcroForm and annotations removed');
        } catch (cleanupErr) {
          console.log('Non-fatal cleanup error:', cleanupErr?.message);
        }
        
      } catch (formError) {
        console.warn('Warning: Some form fields could not be filled:', formError.message);
        // Continue with generation even if some fields fail
      }
      
      // Generate filename following the naming convention
      console.log('=== Filename Generation Debug ===');
      console.log('Application data for filename:', {
        firstName: application.firstName,
        lastName: application.lastName,
        firstNameType: typeof application.firstName,
        lastNameType: typeof application.lastName,
        firstNameLength: application.firstName?.length,
        lastNameLength: application.lastName?.length
      });
      
      // Ensure we have valid names for the filename
      const firstName = application.firstName?.trim() || 'Unknown';
      const lastName = application.lastName?.trim() || 'Unknown';
      
      const filename = `visa-request-letter-${firstName}-${lastName}.pdf`;
      console.log('Generated filename:', filename);
      
      const outputPath = path.join(this.outputDir, filename);
      
      // Save the populated PDF with printer-friendly options
      // - useObjectStreams: false improves compatibility with some drivers/printers
      // - updateFieldAppearances: true to persist visual appearances
      const pdfBytes = await pdfDoc.save({
        useObjectStreams: false,
        addDefaultPage: false,
        updateFieldAppearances: true,
        // Enable compression while keeping compatibility
        compress: true
      });
      await fs.writeFile(outputPath, pdfBytes);
      
      console.log('PDF saved to:', outputPath);
      
      // Optionally normalize with Ghostscript if available for maximum print compatibility
      const normalized = await this.normalizeWithGhostscript(outputPath).catch(() => null);
      const finalPath = normalized?.path || outputPath;
      const finalFilename = normalized?.filename || filename;

      // Analyze and report size optimization results
      const finalStat = await fs.stat(finalPath);
      const sizeAnalysis = this.analyzePDFSize(originalTemplateSize, finalStat.size);
      
      return {
        filename: finalFilename,
        path: finalPath,
        size: finalStat.size,
        sizeAnalysis
      };
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF: ' + error.message);
    }
  }

  // Helper method to safely set form field values
  setFormField(form, fieldName, value) {
    try {
      if (value && value.toString().trim()) {
        const field = form.getField(fieldName);
        if (field) {
          // Set the text value only - no font formatting
          field.setText(value.toString().trim());
          console.log(`Set field '${fieldName}' to: ${value}`);
        } else {
          console.log(`Field '${fieldName}' not found in PDF form`);
        }
      }
    } catch (error) {
      console.log(`Could not set field '${fieldName}':`, error.message);
    }
  }

  // Helper method to format dates for PDF
  formatDateForPDF(dateString) {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      console.log('Error formatting date:', error.message);
      return dateString;
    }
  }

  // Helper method to format meeting dates for PDF
  formatMeetingDates(startDateString, endDateString) {
    if (!startDateString || !endDateString) return '';
    try {
      const startDate = new Date(startDateString);
      const endDate = new Date(endDateString);
      
      // Format as MM/DD/YYYY - MM/DD/YYYY
      const startFormatted = startDate.toLocaleDateString('en-US', { 
        month: '2-digit', 
        day: '2-digit',
        year: 'numeric'
      });
      const endFormatted = endDate.toLocaleDateString('en-US', { 
        month: '2-digit', 
        day: '2-digit',
        year: 'numeric'
      });
      
      return `${startFormatted} - ${endFormatted}`;
    } catch (error) {
      console.log('Error formatting meeting dates:', error.message);
      return `${startDateString} - ${endDateString}`;
    }
  }

  // Helper method to analyze PDF size and provide optimization feedback
  analyzePDFSize(originalSize, optimizedSize) {
    const sizeInMB = (bytes) => (bytes / (1024 * 1024)).toFixed(2);
    const compressionRatio = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
    
    console.log('=== PDF Size Analysis ===');
    console.log(`Original size: ${sizeInMB(originalSize)} MB`);
    console.log(`Optimized size: ${sizeInMB(optimizedSize)} MB`);
    console.log(`Size reduction: ${compressionRatio}%`);
    
    if (optimizedSize > 1024 * 1024) { // If still > 1MB
      console.log('⚠️  PDF is still large. Consider:');
      console.log('   - Checking template for high-resolution images');
      console.log('   - Using web-optimized fonts');
      console.log('   - Reducing template complexity');
    } else {
      console.log('✅ PDF size is now optimized!');
    }
    
    return {
      originalSizeMB: sizeInMB(originalSize),
      optimizedSizeMB: sizeInMB(optimizedSize),
      compressionRatio: compressionRatio
    };
  }
}

module.exports = new PDFService();
