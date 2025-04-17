const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    select: false  // Don't include password by default in queries
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailNotifications: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  resetToken: String,
  resetTokenExpiry: Date,
  isAdmin: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Add this pre-save middleware to keep isAdmin and role in sync
userSchema.pre('save', function(next) {
  // Update isAdmin based on role
  this.isAdmin = this.role === 'admin';
  next();
});

// Add this pre-update middleware to keep isAdmin and role in sync
userSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  if (update.role) {
    update.isAdmin = update.role === 'admin';
  } else if (update.isAdmin !== undefined) {
    update.role = update.isAdmin ? 'admin' : 'user';
  }
  next();
});

module.exports = mongoose.model('User', userSchema); 