const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Entry Information
  entryDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  // Personal Information
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  birthdate: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true
  },
  // Passport Information
  passportNumber: {
    type: String,
    required: true,
    trim: true
  },
  passportIssuingCountry: {
    type: String,
    required: true
  },
  passportExpirationDate: {
    type: Date,
    required: true
  },
  // Travel Information
  dateOfArrival: {
    type: Date,
    required: true
  },
  dateOfDeparture: {
    type: Date,
    required: true
  },
  // Company Information
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  position: {
    type: String,
    required: true,
    trim: true
  },
  // Company Address
  companyMailingAddress1: {
    type: String,
    required: true,
    trim: true
  },
  companyMailingAddress2: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    required: true,
    trim: true
  },
  postalCode: {
    type: String,
    required: true,
    trim: true
  },
  country: {
    type: String,
    required: true,
    trim: true
  },
  // Contact Information
  phone: {
    type: String,
    required: true,
    trim: true
  },
  fax: {
    type: String,
    trim: true
  },
  // Hotel Information
  hotelName: {
    type: String,
    trim: true
  },
  hotelConfirmation: {
    type: String,
    trim: true
  },
  // Additional Fields
  additionalInformation: {
    type: String,
    trim: true
  },
  // Administrative Fields
  status: {
    type: String,
    enum: ['Pending','Complete','Rejected'],
    default: 'Pending'
  },
  letterEmailedDate: {
    type: Date
  },
  hardCopyMailedDate: {
    type: Date
  },
  addressToMailHardCopy: {
    type: String,
    trim: true
  },
  additionalDocumentation: {
    type: [String],
    trim: true
  },
  meeting: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting',
    required: true,
  },
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

// Update timestamp on save
applicationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Validate dates
applicationSchema.pre('validate', function(next) {
  // Passport must be valid during the entire stay
  if (this.passportExpirationDate < this.dateOfDeparture) {
    next(new Error('Passport must be valid for the entire duration of stay'));
  }
  // Departure must be after arrival
  if (this.dateOfDeparture < this.dateOfArrival) {
    next(new Error('Departure date must be after arrival date'));
  }
  next();
});

const Application = mongoose.model('Application', applicationSchema);

module.exports = Application; 