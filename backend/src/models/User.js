const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Personal Information
  fullName: {
    type: String,
    required: true,
    trim: true,
    minlength: 3
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: /^\+?[0-9]{10,15}$/
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  nationalId: {
    type: String,
    required: true,
    unique: true
  },
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ['male', 'female'],
    required: true
  },

  // Account Information
  accountType: {
    type: String,
    enum: ['male', 'female', 'kids'],
    required: true
  },
  accountLevel: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum'],
    default: 'bronze'
  },
  parentPhone: {
    type: String,
    match: /^\+?[0-9]{10,15}$/,
    sparse: true
  },
  parentApproval: {
    type: Boolean,
    default: false
  },

  // Authentication
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false
  },
  passwordChangedAt: Date,
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: Date,

  // Security
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String,
    select: false
  },
  biometricEnabled: {
    type: Boolean,
    default: false
  },
  deviceTokens: [{
    token: String,
    deviceInfo: String,
    lastUsed: Date,
    createdAt: { type: Date, default: Date.now }
  }],

  // Verification Status
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  verificationRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VerificationRequest'
  },
  verificationDate: Date,
  verificationNotes: String,

  // Status
  status: {
    type: String,
    enum: ['active', 'suspended', 'blocked', 'inactive'],
    default: 'active'
  },
  lastLoginAt: Date,
  lastLoginIP: String,

  // Preferences
  language: {
    type: String,
    enum: ['ar', 'en'],
    default: 'ar'
  },
  currency: {
    type: String,
    enum: ['SAR', 'USD', 'EUR'],
    default: 'SAR'
  },
  notificationPreferences: {
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true }
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Index for faster queries
userSchema.index({ phoneNumber: 1 });
userSchema.index({ email: 1 });
userSchema.index({ nationalId: 1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema);
